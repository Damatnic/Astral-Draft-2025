import { AxeResults, Result as AxeResult } from 'axe-core';

export interface AccessibilityMetrics {
  timestamp: string;
  totalViolations: number;
  violationsByLevel: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  wcagCompliance: {
    levelA: number; // Percentage compliance
    levelAA: number;
    levelAAA: number;
  };
  componentMetrics: ComponentAccessibilityMetric[];
  testCoverage: {
    totalComponents: number;
    testedComponents: number;
    coveragePercentage: number;
  };
  performanceMetrics: {
    testExecutionTime: number;
    averageViolationsPerComponent: number;
  };
}

export interface ComponentAccessibilityMetric {
  componentName: string;
  violationCount: number;
  violationsByLevel: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  wcagScore: number; // 0-100 percentage
  lastTested: string;
  status: 'passing' | 'failing' | 'warning';
  trends: {
    improving: boolean;
    violationDelta: number; // Change from previous test
  };
}

export interface ViolationTrend {
  date: string;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  total: number;
}

export interface AccessibilityReport {
  id: string;
  timestamp: string;
  metrics: AccessibilityMetrics;
  violations: AxeResult[];
  summary: {
    overallScore: number;
    complianceLevel: 'A' | 'AA' | 'AAA' | 'Non-compliant';
    trendDirection: 'improving' | 'declining' | 'stable';
    keyIssues: string[];
    recommendations: string[];
  };
}

class AccessibilityMonitoringService {
  private readonly STORAGE_KEY = 'accessibility-metrics-history';
  private readonly MAX_HISTORY_ENTRIES = 100;

  /**
   * Process axe results and generate accessibility metrics
   */
  public processAxeResults(results: AxeResults, componentName?: string): AccessibilityMetrics {
    const violations = results.violations || [];
    const timestamp = new Date().toISOString();

    // Count violations by level
    const violationsByLevel = violations.reduce(
      (acc, violation) => {
        const impact = violation.impact || 'minor';
        acc[impact as keyof typeof acc]++;
        return acc;
      },
      { critical: 0, serious: 0, moderate: 0, minor: 0 }
    );

    // Calculate WCAG compliance scores
    const wcagCompliance = this.calculateWCAGCompliance(violations);

    // Generate component metrics
    const componentMetrics = componentName 
      ? [this.generateComponentMetric(componentName, violations)]
      : this.generateAllComponentMetrics(violations);

    // Calculate test coverage
    const testCoverage = this.calculateTestCoverage();

    // Performance metrics
    const performanceMetrics = {
      testExecutionTime: this.getLastTestExecutionTime(),
      averageViolationsPerComponent: componentMetrics.length > 0 
        ? violations.length / componentMetrics.length 
        : 0
    };

    return {
      timestamp,
      totalViolations: violations.length,
      violationsByLevel,
      wcagCompliance,
      componentMetrics,
      testCoverage,
      performanceMetrics
    };
  }

  /**
   * Generate comprehensive accessibility report
   */
  public generateReport(metrics: AccessibilityMetrics): AccessibilityReport {
    const id = `report-${Date.now()}`;
    const overallScore = this.calculateOverallScore(metrics);
    const complianceLevel = this.determineComplianceLevel(metrics.wcagCompliance);
    const trendDirection = this.analyzeTrend(metrics);
    const keyIssues = this.identifyKeyIssues(metrics);
    const recommendations = this.generateRecommendations(metrics);

    return {
      id,
      timestamp: metrics.timestamp,
      metrics,
      violations: [], // Would be populated with actual violation details
      summary: {
        overallScore,
        complianceLevel,
        trendDirection,
        keyIssues,
        recommendations
      }
    };
  }

  /**
   * Store metrics in local storage for historical tracking
   */
  public storeMetrics(metrics: AccessibilityMetrics): void {
    try {
      const history = this.getMetricsHistory();
      history.unshift(metrics);
      
      // Keep only the most recent entries
      const trimmedHistory = history.slice(0, this.MAX_HISTORY_ENTRIES);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Failed to store accessibility metrics:', error);
    }
  }

  /**
   * Get historical metrics data
   */
  public getMetricsHistory(): AccessibilityMetrics[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to retrieve accessibility metrics:', error);
      return [];
    }
  }

  /**
   * Get trend data for charting
   */
  public getTrendData(days: number = 30): ViolationTrend[] {
    const history = this.getMetricsHistory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return history
      .filter(metric => new Date(metric.timestamp) >= cutoffDate)
      .map(metric => ({
        date: metric.timestamp.split('T')[0], // Get date part only
        critical: metric.violationsByLevel.critical,
        serious: metric.violationsByLevel.serious,
        moderate: metric.violationsByLevel.moderate,
        minor: metric.violationsByLevel.minor,
        total: metric.totalViolations
      }))
      .reverse(); // Oldest first for charting
  }

  /**
   * Get component-specific trends
   */
  public getComponentTrends(componentName: string, days: number = 30): ViolationTrend[] {
    const history = this.getMetricsHistory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return history
      .filter(metric => new Date(metric.timestamp) >= cutoffDate)
      .map(metric => {
        const component = metric.componentMetrics.find(c => c.componentName === componentName);
        if (!component) return null;

        return {
          date: metric.timestamp.split('T')[0],
          critical: component.violationsByLevel.critical,
          serious: component.violationsByLevel.serious,
          moderate: component.violationsByLevel.moderate,
          minor: component.violationsByLevel.minor,
          total: component.violationCount
        };
      })
      .filter(Boolean) as ViolationTrend[];
  }

  /**
   * Calculate overall accessibility score (0-100)
   */
  private calculateOverallScore(metrics: AccessibilityMetrics): number {
    const { violationsByLevel, wcagCompliance, testCoverage } = metrics;
    
    // Weight violations by severity
    const violationPenalty = 
      (violationsByLevel.critical * 10) +
      (violationsByLevel.serious * 5) +
      (violationsByLevel.moderate * 2) +
      (violationsByLevel.minor * 1);

    // Base score from WCAG AA compliance
    const wcagScore = wcagCompliance.levelAA;
    
    // Coverage bonus
    const coverageBonus = testCoverage.coveragePercentage * 0.1;
    
    // Calculate final score
    const score = Math.max(0, wcagScore - violationPenalty + coverageBonus);
    return Math.min(100, Math.round(score));
  }

  /**
   * Calculate WCAG compliance percentages
   */
  private calculateWCAGCompliance(violations: AxeResult[]): AccessibilityMetrics['wcagCompliance'] {
    // This is a simplified calculation - in practice, you'd map violations to specific WCAG criteria
    const totalChecks = 50; // Approximate number of WCAG checks
    const levelAViolations = violations.filter(v => this.isLevelAViolation(v)).length;
    const levelAAViolations = violations.filter(v => this.isLevelAAViolation(v)).length;
    const levelAAAViolations = violations.filter(v => this.isLevelAAAViolation(v)).length;

    return {
      levelA: Math.max(0, ((totalChecks - levelAViolations) / totalChecks) * 100),
      levelAA: Math.max(0, ((totalChecks - levelAAViolations) / totalChecks) * 100),
      levelAAA: Math.max(0, ((totalChecks - levelAAAViolations) / totalChecks) * 100)
    };
  }

  /**
   * Generate component-specific metrics
   */
  private generateComponentMetric(componentName: string, violations: AxeResult[]): ComponentAccessibilityMetric {
    // Filter violations for this component (simplified)
    const componentViolations = violations.filter(v => 
      v.nodes.some(node => 
        node.html.includes(componentName.toLowerCase()) || 
        node.target.some(target => target.includes(componentName.toLowerCase()))
      )
    );

    const violationsByLevel = componentViolations.reduce(
      (acc, violation) => {
        const impact = violation.impact || 'minor';
        acc[impact as keyof typeof acc]++;
        return acc;
      },
      { critical: 0, serious: 0, moderate: 0, minor: 0 }
    );

    const wcagScore = this.calculateComponentWCAGScore(componentViolations);
    const status = this.determineComponentStatus(violationsByLevel);

    return {
      componentName,
      violationCount: componentViolations.length,
      violationsByLevel,
      wcagScore,
      lastTested: new Date().toISOString(),
      status,
      trends: {
        improving: false, // Would be calculated based on historical data
        violationDelta: 0  // Would be calculated based on previous test
      }
    };
  }

  /**
   * Generate metrics for all components
   */
  private generateAllComponentMetrics(violations: AxeResult[]): ComponentAccessibilityMetric[] {
    // Extract component names from violations (simplified approach)
    const componentNames = new Set<string>();
    
    violations.forEach(violation => {
      violation.nodes.forEach(node => {
        // Try to extract component name from class names or data attributes
        const html = node.html;
        const matches = html.match(/class="[^"]*([A-Z][a-zA-Z]*Component?)[^"]*"/);
        if (matches && matches[1]) {
          componentNames.add(matches[1]);
        }
      });
    });

    // If no components found, create a general metric
    if (componentNames.size === 0) {
      componentNames.add('Application');
    }

    return Array.from(componentNames).map(name => 
      this.generateComponentMetric(name, violations)
    );
  }

  /**
   * Calculate test coverage metrics
   */
  private calculateTestCoverage(): AccessibilityMetrics['testCoverage'] {
    // This would integrate with your test framework to get actual coverage
    // For now, returning mock data
    return {
      totalComponents: 25,
      testedComponents: 20,
      coveragePercentage: 80
    };
  }

  /**
   * Get last test execution time
   */
  private getLastTestExecutionTime(): number {
    // This would be tracked during test execution
    // For now, returning a reasonable mock value
    return 2.5; // seconds
  }

  /**
   * Determine WCAG compliance level
   */
  private determineComplianceLevel(wcagCompliance: AccessibilityMetrics['wcagCompliance']): AccessibilityReport['summary']['complianceLevel'] {
    if (wcagCompliance.levelAAA >= 95) return 'AAA';
    if (wcagCompliance.levelAA >= 95) return 'AA';
    if (wcagCompliance.levelA >= 95) return 'A';
    return 'Non-compliant';
  }

  /**
   * Analyze trend direction
   */
  private analyzeTrend(metrics: AccessibilityMetrics): 'improving' | 'declining' | 'stable' {
    const history = this.getMetricsHistory();
    if (history.length < 2) return 'stable';

    const current = metrics.totalViolations;
    const previous = history[1]?.totalViolations || current;

    if (current < previous) return 'improving';
    if (current > previous) return 'declining';
    return 'stable';
  }

  /**
   * Identify key accessibility issues
   */
  private identifyKeyIssues(metrics: AccessibilityMetrics): string[] {
    const issues: string[] = [];
    const { violationsByLevel, testCoverage } = metrics;

    if (violationsByLevel.critical > 0) {
      issues.push(`${violationsByLevel.critical} critical accessibility violations`);
    }
    if (violationsByLevel.serious > 5) {
      issues.push(`High number of serious violations (${violationsByLevel.serious})`);
    }
    if (testCoverage.coveragePercentage < 80) {
      issues.push(`Low test coverage (${testCoverage.coveragePercentage}%)`);
    }

    return issues;
  }

  /**
   * Generate accessibility recommendations
   */
  private generateRecommendations(metrics: AccessibilityMetrics): string[] {
    const recommendations: string[] = [];
    const { violationsByLevel, testCoverage, componentMetrics } = metrics;

    if (violationsByLevel.critical > 0) {
      recommendations.push('Address critical accessibility violations immediately');
    }
    if (violationsByLevel.serious > 0) {
      recommendations.push('Review and fix serious accessibility issues');
    }
    if (testCoverage.coveragePercentage < 90) {
      recommendations.push('Increase accessibility test coverage');
    }

    const failingComponents = componentMetrics.filter(c => c.status === 'failing');
    if (failingComponents.length > 0) {
      recommendations.push(`Focus on ${failingComponents.length} failing components`);
    }

    return recommendations;
  }

  /**
   * Helper methods for WCAG level classification
   */
  private isLevelAViolation(violation: AxeResult): boolean {
    // Map violation rules to WCAG levels
    const levelARules = ['color-contrast', 'image-alt', 'label', 'keyboard'];
    return violation.tags?.some(tag => levelARules.includes(tag)) || false;
  }

  private isLevelAAViolation(violation: AxeResult): boolean {
    const levelAARules = ['color-contrast-enhanced', 'focus-order-semantics'];
    return violation.tags?.some(tag => levelAARules.includes(tag)) || false;
  }

  private isLevelAAAViolation(violation: AxeResult): boolean {
    const levelAAARules = ['color-contrast-enhanced', 'context-help'];
    return violation.tags?.some(tag => levelAAARules.includes(tag)) || false;
  }

  private calculateComponentWCAGScore(violations: AxeResult[]): number {
    const maxPossibleScore = 100;
    const violationPenalty = violations.length * 5; // 5 points per violation
    return Math.max(0, maxPossibleScore - violationPenalty);
  }

  private determineComponentStatus(violationsByLevel: ComponentAccessibilityMetric['violationsByLevel']): ComponentAccessibilityMetric['status'] {
    if (violationsByLevel.critical > 0) return 'failing';
    if (violationsByLevel.serious > 0) return 'warning';
    return 'passing';
  }
}

export const accessibilityMonitoringService = new AccessibilityMonitoringService();

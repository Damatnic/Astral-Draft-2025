// Report Types
export interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    category: ReportCategory;
    type: ReportType;
    dataSource: DataSource[];
    visualization: VisualizationType;
    filters: ReportFilter[];
    metrics: ReportMetric[];
    isCustom: boolean;
    createdBy?: string;
    createdAt: Date;
    lastUsed?: Date;
    popularity: number;
    tags: string[];
}

export type ReportCategory = 
    | 'league_analytics' 
    | 'player_performance' 
    | 'team_comparison' 
    | 'trade_analysis' 
    | 'draft_recap' 
    | 'season_summary' 
    | 'predictions_accuracy' 
    | 'social_engagement' 
    | 'commissioner_overview'
    | 'custom';

export type ReportType = 
    | 'snapshot' 
    | 'trend_analysis' 
    | 'comparison' 
    | 'predictive' 
    | 'summary' 
    | 'detailed';

export type DataSource = 
    | 'players' 
    | 'teams' 
    | 'leagues' 
    | 'trades' 
    | 'draft_picks' 
    | 'matchups' 
    | 'predictions' 
    | 'social_activity' 
    | 'external_stats';

export type VisualizationType = 
    | 'table' 
    | 'bar_chart' 
    | 'line_chart' 
    | 'pie_chart' 
    | 'scatter_plot' 
    | 'heatmap' 
    | 'radar_chart' 
    | 'treemap' 
    | 'dashboard';

export interface ReportFilter {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'between';
    value: any;
    label: string;
}

export interface ReportMetric {
    field: string;
    aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median' | 'std_dev';
    label: string;
    format: 'number' | 'percentage' | 'currency' | 'decimal';
    precision?: number;
}

export interface GeneratedReport {
    id: string;
    templateId: string;
    templateName: string;
    title: string;
    description: string;
    generatedAt: Date;
    generatedBy: string;
    parameters: Record<string, any>;
    data: ReportData;
    insights: AutomatedInsight[];
    exportFormats: ExportFormat[];
    shareUrl?: string;
    isScheduled: boolean;
    nextScheduledRun?: Date;
}

export interface ReportData {
    headers: string[];
    rows: any[][];
    metadata: {
        totalRows: number;
        generationTime: number;
        dataRange: {
            start: Date;
            end: Date;
        };
        sources: DataSource[];
    };
    charts?: ChartData[];
    summary?: Record<string, any>;
}

export interface ChartData {
    type: VisualizationType;
    title: string;
    data: any;
    options: Record<string, any>;
}

export interface AutomatedInsight {
    id: string;
    type: InsightType;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    actionable: boolean;
    recommendations?: string[];
    data?: any;
}

export type InsightType = 
    | 'trend_alert' 
    | 'anomaly_detection' 
    | 'performance_outlier' 
    | 'optimization_opportunity' 
    | 'risk_warning' 
    | 'achievement_highlight' 
    | 'prediction_accuracy' 
    | 'comparative_analysis';

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json' | 'png' | 'html';

export interface ReportSchedule {
    id: string;
    templateId: string;
    userId: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    time: string; // HH:MM format
    isActive: boolean;
    lastRun?: Date;
    nextRun: Date;
    recipients: string[]; // Email addresses
    exportFormat: ExportFormat;
    parameters: Record<string, any>;
}

export interface DashboardWidget {
    id: string;
    type: 'metric' | 'chart' | 'table' | 'insight';
    title: string;
    position: { x: number; y: number; w: number; h: number };
    dataSource: DataSource;
    visualization: VisualizationType;
    refreshInterval: number; // seconds
    filters: ReportFilter[];
    lastUpdated: Date;
    data?: any;
}

export interface CustomDashboard {
    id: string;
    name: string;
    description: string;
    userId: string;
    widgets: DashboardWidget[];
    layout: 'grid' | 'flex' | 'custom';
    isPublic: boolean;
    tags: string[];
    createdAt: Date;
    lastModified: Date;
}

// Advanced Reporting Service
export class AdvancedReportingService {
    private readonly templates: Map<string, ReportTemplate> = new Map();
    private readonly generatedReports: Map<string, GeneratedReport> = new Map();
    private readonly schedules: Map<string, ReportSchedule> = new Map();
    private readonly dashboards: Map<string, CustomDashboard> = new Map();

    constructor() {
        this.initializeDefaultTemplates();
    }

    // Template Management
    async getReportTemplates(category?: ReportCategory): Promise<ReportTemplate[]> {
        let templates = Array.from(this.templates.values());
        
        if (category) {
            templates = templates.filter(t => t.category === category);
        }

        return templates.sort((a, b) => b.popularity - a.popularity);
    }

    async createCustomTemplate(
        userId: string,
        template: Omit<ReportTemplate, 'id' | 'createdAt' | 'lastUsed' | 'popularity' | 'isCustom'>
    ): Promise<ReportTemplate> {
        const templateId = `template_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const newTemplate: ReportTemplate = {
            ...template,
            id: templateId,
            createdBy: userId,
            createdAt: new Date(),
            popularity: 0,
            isCustom: true
        };

        this.templates.set(templateId, newTemplate);
        return newTemplate;
    }

    async updateTemplate(templateId: string, updates: Partial<ReportTemplate>): Promise<ReportTemplate> {
        const template = this.templates.get(templateId);
        if (!template) throw new Error('Template not found');

        const updatedTemplate = { ...template, ...updates };
        this.templates.set(templateId, updatedTemplate);
        return updatedTemplate;
    }

    async deleteTemplate(templateId: string): Promise<void> {
        const template = this.templates.get(templateId);
        if (!template) throw new Error('Template not found');
        if (!template.isCustom) throw new Error('Cannot delete system template');

        this.templates.delete(templateId);
    }

    // Report Generation
    async generateReport(
        templateId: string,
        userId: string,
        parameters: Record<string, any> = {}
    ): Promise<GeneratedReport> {
        const template = this.templates.get(templateId);
        if (!template) throw new Error('Template not found');

        // Update template usage
        template.popularity++;
        template.lastUsed = new Date();

        const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const generationStart = Date.now();

        // Generate report data based on template
        const reportData = await this.generateReportData(template, parameters);
        
        // Generate automated insights
        const insights = await this.generateInsights(template, reportData);

        const report: GeneratedReport = {
            id: reportId,
            templateId,
            templateName: template.name,
            title: this.formatReportTitle(template.name, parameters),
            description: template.description,
            generatedAt: new Date(),
            generatedBy: userId,
            parameters,
            data: reportData,
            insights,
            exportFormats: ['pdf', 'excel', 'csv'],
            isScheduled: false
        };

        this.generatedReports.set(reportId, report);
        return report;
    }

    async getReportHistory(userId: string, limit: number = 50): Promise<GeneratedReport[]> {
        const reports = Array.from(this.generatedReports.values())
            .filter(r => r.generatedBy === userId)
            .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
            .slice(0, limit);

        return reports;
    }

    async getReport(reportId: string): Promise<GeneratedReport | null> {
        return this.generatedReports.get(reportId) || null;
    }

    async deleteReport(reportId: string): Promise<void> {
        this.generatedReports.delete(reportId);
    }

    // Data Export
    async exportReport(reportId: string, format: ExportFormat): Promise<Blob> {
        const report = this.generatedReports.get(reportId);
        if (!report) throw new Error('Report not found');

        switch (format) {
            case 'csv':
                return this.exportToCSV(report);
            case 'excel':
                return this.exportToExcel(report);
            case 'pdf':
                return this.exportToPDF(report);
            case 'json':
                return this.exportToJSON(report);
            default:
                throw new Error(`Export format ${format} not supported`);
        }
    }

    private async exportToCSV(report: GeneratedReport): Promise<Blob> {
        const { headers, rows } = report.data;
        let csv = headers.join(',') + '\n';
        
        rows.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        return new Blob([csv], { type: 'text/csv' });
    }

    private async exportToExcel(report: GeneratedReport): Promise<Blob> {
        // Mock Excel export - in real implementation, use a library like xlsx
        const data = JSON.stringify({
            title: report.title,
            data: report.data,
            insights: report.insights
        });
        
        return new Blob([data], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
    }

    private async exportToPDF(report: GeneratedReport): Promise<Blob> {
        // Mock PDF export - in real implementation, use a library like jsPDF
        const data = `Report: ${report.title}\nGenerated: ${report.generatedAt}\n\nData:\n${JSON.stringify(report.data, null, 2)}`;
        
        return new Blob([data], { type: 'application/pdf' });
    }

    private async exportToJSON(report: GeneratedReport): Promise<Blob> {
        const data = JSON.stringify(report, null, 2);
        return new Blob([data], { type: 'application/json' });
    }

    // Insight Generation
    private async generateInsights(template: ReportTemplate, data: ReportData): Promise<AutomatedInsight[]> {
        const insights: AutomatedInsight[] = [];

        // Example insight generation logic
        if (template.category === 'player_performance' && data.rows.length > 0) {
            const performanceScores = data.rows.map(row => parseFloat(row[2]) || 0);
            const avgScore = performanceScores.reduce((a, b) => a + b, 0) / performanceScores.length;
            const maxScore = Math.max(...performanceScores);
            const minScore = Math.min(...performanceScores);

            if (maxScore - avgScore > avgScore * 0.3) {
                insights.push({
                    id: `insight_${Date.now()}_1`,
                    type: 'performance_outlier',
                    title: 'High Performer Detected',
                    description: `Player with score ${maxScore} significantly outperforms average (${avgScore.toFixed(1)})`,
                    severity: 'medium',
                    confidence: 0.85,
                    actionable: true,
                    recommendations: [
                        'Consider this player for starting lineup',
                        'Monitor for trade opportunities',
                        'Check injury status and upcoming matchups'
                    ]
                });
            }

            if (avgScore - minScore > avgScore * 0.4) {
                insights.push({
                    id: `insight_${Date.now()}_2`,
                    type: 'risk_warning',
                    title: 'Underperforming Player Alert',
                    description: `Player with score ${minScore} significantly underperforms average`,
                    severity: 'high',
                    confidence: 0.78,
                    actionable: true,
                    recommendations: [
                        'Consider benching this player',
                        'Look for waiver wire alternatives',
                        'Investigate recent performance trends'
                    ]
                });
            }
        }

        if (template.category === 'trade_analysis') {
            insights.push({
                id: `insight_${Date.now()}_3`,
                type: 'optimization_opportunity',
                title: 'Trade Opportunity Identified',
                description: 'Analysis suggests potential beneficial trades based on team needs',
                severity: 'medium',
                confidence: 0.72,
                actionable: true,
                recommendations: [
                    'Review proposed trade scenarios',
                    'Consider positional needs and strength',
                    'Evaluate playoff implications'
                ]
            });
        }

        return insights;
    }

    // Report Data Generation
    private async generateReportData(
        template: ReportTemplate, 
        parameters: Record<string, any>
    ): Promise<ReportData> {
        // Mock data generation based on template type
        let headers: string[] = [];
        let rows: any[][] = [];

        switch (template.category) {
            case 'player_performance':
                headers = ['Player Name', 'Position', 'Points', 'Games', 'Avg Points', 'Trend'];
                rows = this.generatePlayerPerformanceData();
                break;

            case 'team_comparison':
                headers = ['Team', 'Total Points', 'Avg Points/Week', 'Wins', 'Losses', 'Rank'];
                rows = this.generateTeamComparisonData();
                break;

            case 'league_analytics':
                headers = ['Metric', 'Value', 'League Avg', 'Rank', 'Percentile'];
                rows = this.generateLeagueAnalyticsData();
                break;

            case 'trade_analysis':
                headers = ['Trade', 'Team A', 'Team B', 'Fairness Score', 'Impact', 'Status'];
                rows = this.generateTradeAnalysisData();
                break;

            default:
                headers = ['Item', 'Value', 'Description'];
                rows = [
                    ['Sample Data', '123', 'This is sample data for the report'],
                    ['Another Item', '456', 'Additional sample information']
                ];
        }

        // Apply filters if specified
        if (template.filters.length > 0) {
            rows = this.applyFilters(rows, headers, template.filters, parameters);
        }

        const generationTime = 50; // Mock generation time

        return {
            headers,
            rows,
            metadata: {
                totalRows: rows.length,
                generationTime,
                dataRange: {
                    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                    end: new Date()
                },
                sources: template.dataSource
            },
            charts: this.generateChartData(template.visualization, headers, rows),
            summary: this.generateSummaryStats(headers, rows)
        };
    }

    private generatePlayerPerformanceData(): any[][] {
        const players = ['Josh Allen', 'Lamar Jackson', 'Christian McCaffrey', 'Cooper Kupp', 'Travis Kelce'];
        return players.map((player, i) => {
            const points = Math.floor(Math.random() * 50) + 150;
            const games = 14;
            const avgPoints = (points / games).toFixed(1);
            const trend = Math.random() > 0.5 ? '↑' : '↓';
            return [player, 'QB', points, games, avgPoints, trend];
        });
    }

    private generateTeamComparisonData(): any[][] {
        const teams = ['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta', 'Team Epsilon'];
        return teams.map((team, i) => {
            const totalPoints = Math.floor(Math.random() * 500) + 1200;
            const avgPoints = (totalPoints / 14).toFixed(1);
            const wins = Math.floor(Math.random() * 8) + 4;
            const losses = 14 - wins;
            return [team, totalPoints, avgPoints, wins, losses, i + 1];
        });
    }

    private generateLeagueAnalyticsData(): any[][] {
        return [
            ['Total Players Traded', '45', '38', '3', '85%'],
            ['Avg Points Per Week', '98.5', '92.1', '1', '95%'],
            ['Waiver Claims', '156', '134', '2', '92%'],
            ['Message Activity', '234', '189', '1', '98%'],
            ['Draft Accuracy', '78%', '72%', '4', '76%']
        ];
    }

    private generateTradeAnalysisData(): any[][] {
        const trades = [
            'McCaffrey for Kelce + WR',
            'QB Trade Package',
            'RB Depth for WR1',
            'Defense Streaming Trade'
        ];
        
        return trades.map(trade => {
            const fairness = Math.floor(Math.random() * 40) + 60;
            const impact = ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)];
            const status = ['Completed', 'Pending', 'Rejected'][Math.floor(Math.random() * 3)];
            return [trade, 'Team A', 'Team B', `${fairness}%`, impact, status];
        });
    }

    private applyFilters(
        rows: any[][], 
        headers: string[], 
        filters: ReportFilter[], 
        parameters: Record<string, any>
    ): any[][] {
        return rows.filter(row => {
            return filters.every(filter => {
                const columnIndex = headers.indexOf(filter.field);
                if (columnIndex === -1) return true;

                const cellValue = row[columnIndex];
                const filterValue = parameters[filter.field] || filter.value;

                switch (filter.operator) {
                    case 'equals':
                        return cellValue === filterValue;
                    case 'contains':
                        return String(cellValue).toLowerCase().includes(String(filterValue).toLowerCase());
                    case 'greater_than':
                        return Number(cellValue) > Number(filterValue);
                    case 'less_than':
                        return Number(cellValue) < Number(filterValue);
                    default:
                        return true;
                }
            });
        });
    }

    private generateChartData(visualization: VisualizationType, headers: string[], rows: any[][]): ChartData[] {
        const charts: ChartData[] = [];

        if (visualization === 'bar_chart' && rows.length > 0) {
            charts.push({
                type: 'bar_chart',
                title: 'Performance Overview',
                data: {
                    labels: rows.map(row => row[0]),
                    datasets: [{
                        label: headers[1] || 'Value',
                        data: rows.map(row => Number(row[1]) || 0),
                        backgroundColor: 'rgba(59, 130, 246, 0.8)'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true }
                    }
                }
            });
        }

        return charts;
    }

    private generateSummaryStats(headers: string[], rows: any[][]): Record<string, any> {
        if (rows.length === 0) return {};

        return {
            totalRecords: rows.length,
            numericColumns: headers.length,
            dateGenerated: new Date().toISOString(),
            topPerformer: rows[0]?.[0] || 'N/A',
            averageValue: rows.length > 0 ? 
                (rows.reduce((sum, row) => sum + (Number(row[1]) || 0), 0) / rows.length).toFixed(2) : 
                'N/A'
        };
    }

    private formatReportTitle(templateName: string, parameters: Record<string, any>): string {
        let title = templateName;
        
        if (parameters.week) {
            title += ` - Week ${parameters.week}`;
        }
        if (parameters.season) {
            title += ` (${parameters.season})`;
        }
        if (parameters.team) {
            title += ` - ${parameters.team}`;
        }

        return title;
    }

    // Dashboard Management
    async createDashboard(userId: string, dashboard: Omit<CustomDashboard, 'id' | 'createdAt' | 'lastModified'>): Promise<CustomDashboard> {
        const dashboardId = `dashboard_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const newDashboard: CustomDashboard = {
            ...dashboard,
            id: dashboardId,
            userId,
            createdAt: new Date(),
            lastModified: new Date()
        };

        this.dashboards.set(dashboardId, newDashboard);
        return newDashboard;
    }

    async getUserDashboards(userId: string): Promise<CustomDashboard[]> {
        return Array.from(this.dashboards.values())
            .filter(d => d.userId === userId || d.isPublic)
            .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    }

    async updateDashboard(dashboardId: string, updates: Partial<CustomDashboard>): Promise<CustomDashboard> {
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard) throw new Error('Dashboard not found');

        const updatedDashboard = {
            ...dashboard,
            ...updates,
            lastModified: new Date()
        };

        this.dashboards.set(dashboardId, updatedDashboard);
        return updatedDashboard;
    }

    // Initialize default templates
    private initializeDefaultTemplates(): void {
        const defaultTemplates: ReportTemplate[] = [
            {
                id: 'player_performance_weekly',
                name: 'Weekly Player Performance',
                description: 'Detailed analysis of player performance for the current week',
                category: 'player_performance',
                type: 'snapshot',
                dataSource: ['players', 'matchups'],
                visualization: 'table',
                filters: [
                    { field: 'position', operator: 'in', value: ['QB', 'RB', 'WR', 'TE'], label: 'Position' }
                ],
                metrics: [
                    { field: 'points', aggregation: 'sum', label: 'Total Points', format: 'number' },
                    { field: 'points', aggregation: 'avg', label: 'Average Points', format: 'decimal', precision: 1 }
                ],
                isCustom: false,
                createdAt: new Date(),
                popularity: 85,
                tags: ['weekly', 'players', 'performance']
            },
            {
                id: 'league_standings',
                name: 'League Standings Report',
                description: 'Current league standings with detailed team statistics',
                category: 'league_analytics',
                type: 'snapshot',
                dataSource: ['teams', 'leagues', 'matchups'],
                visualization: 'table',
                filters: [],
                metrics: [
                    { field: 'wins', aggregation: 'count', label: 'Wins', format: 'number' },
                    { field: 'points', aggregation: 'avg', label: 'Avg Points', format: 'decimal', precision: 1 }
                ],
                isCustom: false,
                createdAt: new Date(),
                popularity: 92,
                tags: ['standings', 'league', 'teams']
            },
            {
                id: 'trade_impact_analysis',
                name: 'Trade Impact Analysis',
                description: 'Comprehensive analysis of completed and proposed trades',
                category: 'trade_analysis',
                type: 'detailed',
                dataSource: ['trades', 'players', 'teams'],
                visualization: 'dashboard',
                filters: [
                    { field: 'status', operator: 'in', value: ['completed', 'pending'], label: 'Trade Status' }
                ],
                metrics: [
                    { field: 'fairness_score', aggregation: 'avg', label: 'Avg Fairness', format: 'percentage' }
                ],
                isCustom: false,
                createdAt: new Date(),
                popularity: 78,
                tags: ['trades', 'analysis', 'impact']
            }
        ];

        defaultTemplates.forEach(template => {
            this.templates.set(template.id, template);
        });
    }
}

// Export singleton instance
export const advancedReportingService = new AdvancedReportingService();

/**
 * Oracle Historical Analytics Hook
 * React hook for managing historical prediction analytics and trend analysis
 */

import { useState, useEffect, useCallback } from 'react';
import oracleHistoricalAnalyticsService, {
    HistoricalTrendAnalysis,
    AccuracyBreakdown,
    PerformanceComparison,
    AdvancedInsights,
    HistoricalPredictionRecord
} from '../services/oracleHistoricalAnalyticsService';
import { OraclePrediction, PredictionType } from '../services/oraclePredictionService';

export type TimeframeType = 'weekly' | 'monthly' | 'seasonal' | 'yearly';
export type ExportFormat = 'json' | 'csv';

export interface UseHistoricalAnalyticsResult {
    // Data
    trendAnalysis: HistoricalTrendAnalysis | null;
    accuracyBreakdown: AccuracyBreakdown | null;
    performanceComparison: PerformanceComparison | null;
    advancedInsights: AdvancedInsights | null;
    historicalRecords: HistoricalPredictionRecord[];
    
    // Loading states
    isLoading: boolean;
    isLoadingTrends: boolean;
    isLoadingBreakdown: boolean;
    isLoadingComparison: boolean;
    isLoadingInsights: boolean;
    
    // Error states
    error: string | null;
    
    // Actions
    refreshAnalytics: () => Promise<void>;
    recordPrediction: (
        prediction: OraclePrediction,
        actualResult?: number,
        userPrediction?: number
    ) => Promise<void>;
    exportData: (format?: ExportFormat, filters?: any) => Promise<string>;
    importData: (data: string, format?: ExportFormat) => Promise<{ imported: number; errors: string[] }>;
    
    // Filtering and analysis
    analyzeTimeframe: (timeframe: TimeframeType) => Promise<void>;
    comparePerformance: (currentPeriod: string, previousPeriod: string) => Promise<void>;
    filterByType: (types: PredictionType[]) => HistoricalPredictionRecord[];
    filterByDateRange: (startDate: string, endDate: string) => HistoricalPredictionRecord[];
    filterByAccuracy: (minAccuracy: number) => HistoricalPredictionRecord[];
    
    // Metrics
    getOverallStats: () => {
        totalPredictions: number;
        overallAccuracy: number;
        averageConfidence: number;
        longestStreak: number;
        currentStreak: number;
    };
    getTypePerformance: () => Record<PredictionType, { accuracy: number; count: number }>;
    getRecentPerformance: (days: number) => {
        accuracy: number;
        predictions: number;
        improvement: number;
    };
}

export function useHistoricalAnalytics(): UseHistoricalAnalyticsResult {
    // State
    const [trendAnalysis, setTrendAnalysis] = useState<HistoricalTrendAnalysis | null>(null);
    const [accuracyBreakdown, setAccuracyBreakdown] = useState<AccuracyBreakdown | null>(null);
    const [performanceComparison, setPerformanceComparison] = useState<PerformanceComparison | null>(null);
    const [advancedInsights, setAdvancedInsights] = useState<AdvancedInsights | null>(null);
    const [historicalRecords, setHistoricalRecords] = useState<HistoricalPredictionRecord[]>([]);
    
    // Loading states
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingTrends, setIsLoadingTrends] = useState(false);
    const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false);
    const [isLoadingComparison, setIsLoadingComparison] = useState(false);
    const [isLoadingInsights, setIsLoadingInsights] = useState(false);
    
    // Error state
    const [error, setError] = useState<string | null>(null);
    
    // Load initial data
    useEffect(() => {
        loadInitialData();
    }, []);
    
    const loadInitialData = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            await Promise.all([
                loadTrendAnalysis(),
                loadAccuracyBreakdown(),
                loadHistoricalRecords()
            ]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load analytics data');
        } finally {
            setIsLoading(false);
        }
    };
    
    const loadTrendAnalysis = async (timeframe: TimeframeType = 'monthly') => {
        setIsLoadingTrends(true);
        try {
            const analysis = await oracleHistoricalAnalyticsService.getHistoricalTrendAnalysis(timeframe);
            setTrendAnalysis(analysis);
        } catch (err) {
            throw new Error(`Failed to load trend analysis: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsLoadingTrends(false);
        }
    };
    
    const loadAccuracyBreakdown = async () => {
        setIsLoadingBreakdown(true);
        try {
            const breakdown = await oracleHistoricalAnalyticsService.getAccuracyBreakdown();
            setAccuracyBreakdown(breakdown);
        } catch (err) {
            throw new Error(`Failed to load accuracy breakdown: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsLoadingBreakdown(false);
        }
    };
    
    const loadHistoricalRecords = async () => {
        try {
            const records = await oracleHistoricalAnalyticsService['getHistoricalRecords']();
            setHistoricalRecords(records);
        } catch (err) {
            throw new Error(`Failed to load historical records: ${err instanceof Error ? err.message : String(err)}`);
        }
    };
    
    const loadAdvancedInsights = async () => {
        setIsLoadingInsights(true);
        try {
            const insights = await oracleHistoricalAnalyticsService.getAdvancedInsights();
            setAdvancedInsights(insights);
        } catch (err) {
            throw new Error(`Failed to load advanced insights: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsLoadingInsights(false);
        }
    };
    
    // Actions
    const refreshAnalytics = useCallback(async () => {
        await loadInitialData();
        if (advancedInsights) {
            await loadAdvancedInsights();
        }
    }, [advancedInsights]);
    
    const recordPrediction = useCallback(async (
        prediction: OraclePrediction,
        actualResult?: number,
        userPrediction?: number
    ) => {
        try {
            await oracleHistoricalAnalyticsService.storeHistoricalRecord(
                prediction,
                actualResult,
                userPrediction
            );
            
            // Refresh data
            await loadHistoricalRecords();
            if (actualResult !== undefined) {
                await loadTrendAnalysis();
                await loadAccuracyBreakdown();
            }
        } catch (err) {
            setError(`Failed to record prediction: ${err instanceof Error ? err.message : String(err)}`);
        }
    }, []);
    
    const exportData = useCallback(async (
        format: ExportFormat = 'json',
        filters?: any
    ) => {
        try {
            return await oracleHistoricalAnalyticsService.exportHistoricalData(format, filters);
        } catch (err) {
            setError(`Failed to export data: ${err instanceof Error ? err.message : String(err)}`);
            throw err;
        }
    }, []);
    
    const importData = useCallback(async (
        data: string,
        format: ExportFormat = 'json'
    ) => {
        try {
            const result = await oracleHistoricalAnalyticsService.importHistoricalData(data, format);
            await refreshAnalytics();
            return result;
        } catch (err) {
            setError(`Failed to import data: ${err instanceof Error ? err.message : String(err)}`);
            throw err;
        }
    }, [refreshAnalytics]);
    
    // Analysis functions
    const analyzeTimeframe = useCallback(async (
        timeframe: TimeframeType
    ) => {
        await loadTrendAnalysis(timeframe);
    }, []);
    
    const comparePerformance = useCallback(async (
        currentPeriod: string,
        previousPeriod: string
    ) => {
        setIsLoadingComparison(true);
        try {
            const comparison = await oracleHistoricalAnalyticsService.getPerformanceComparison(
                currentPeriod,
                previousPeriod
            );
            setPerformanceComparison(comparison);
        } catch (err) {
            setError(`Failed to compare performance: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsLoadingComparison(false);
        }
    }, []);
    
    // Filtering functions
    const filterByType = useCallback((types: PredictionType[]) => {
        return historicalRecords.filter(record => types.includes(record.type));
    }, [historicalRecords]);
    
    const filterByDateRange = useCallback((startDate: string, endDate: string) => {
        return historicalRecords.filter(record => {
            const recordDate = new Date(record.recordedAt);
            return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
        });
    }, [historicalRecords]);
    
    const filterByAccuracy = useCallback((minAccuracy: number) => {
        return historicalRecords.filter(record => {
            if (record.isCorrect === undefined) return false;
            return record.isCorrect && record.confidence >= minAccuracy;
        });
    }, [historicalRecords]);
    
    // Metrics functions
    const getOverallStats = useCallback(() => {
        const completedRecords = historicalRecords.filter(r => r.actualResult !== undefined);
        const correctPredictions = completedRecords.filter(r => r.isCorrect).length;
        const totalPredictions = completedRecords.length;
        const overallAccuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
        const averageConfidence = historicalRecords.reduce((sum, r) => sum + r.confidence, 0) / historicalRecords.length || 0;
        
        // Calculate streaks
        const sortedRecords = [...completedRecords].sort((a, b) => 
            new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
        );
        
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        
        // Current streak (from end)
        for (let i = sortedRecords.length - 1; i >= 0; i--) {
            if (sortedRecords[i].isCorrect) {
                currentStreak++;
            } else {
                break;
            }
        }
        
        // Longest streak
        for (const record of sortedRecords) {
            if (record.isCorrect) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 0;
            }
        }
        
        return {
            totalPredictions,
            overallAccuracy,
            averageConfidence,
            longestStreak,
            currentStreak
        };
    }, [historicalRecords]);
    
    const getTypePerformance = useCallback(() => {
        const result: Record<string, { accuracy: number; count: number }> = {};
        const types = Array.from(new Set(historicalRecords.map(r => r.type)));
        
        for (const type of types) {
            const typeRecords = historicalRecords.filter(r => r.type === type && r.actualResult !== undefined);
            const correct = typeRecords.filter(r => r.isCorrect).length;
            const total = typeRecords.length;
            
            result[type] = {
                accuracy: total > 0 ? correct / total : 0,
                count: total
            };
        }
        
        return result as Record<PredictionType, { accuracy: number; count: number }>;
    }, [historicalRecords]);
    
    const getRecentPerformance = useCallback((days: number) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const recentRecords = historicalRecords.filter(record => {
            const recordDate = new Date(record.recordedAt);
            return recordDate >= cutoffDate && record.actualResult !== undefined;
        });
        
        const olderRecords = historicalRecords.filter(record => {
            const recordDate = new Date(record.recordedAt);
            return recordDate < cutoffDate && record.actualResult !== undefined;
        });
        
        const recentCorrect = recentRecords.filter(r => r.isCorrect).length;
        const recentTotal = recentRecords.length;
        const recentAccuracy = recentTotal > 0 ? recentCorrect / recentTotal : 0;
        
        const olderCorrect = olderRecords.filter(r => r.isCorrect).length;
        const olderTotal = olderRecords.length;
        const olderAccuracy = olderTotal > 0 ? olderCorrect / olderTotal : 0;
        
        return {
            accuracy: recentAccuracy,
            predictions: recentTotal,
            improvement: recentAccuracy - olderAccuracy
        };
    }, [historicalRecords]);
    
    return {
        // Data
        trendAnalysis,
        accuracyBreakdown,
        performanceComparison,
        advancedInsights,
        historicalRecords,
        
        // Loading states
        isLoading,
        isLoadingTrends,
        isLoadingBreakdown,
        isLoadingComparison,
        isLoadingInsights,
        
        // Error state
        error,
        
        // Actions
        refreshAnalytics,
        recordPrediction,
        exportData,
        importData,
        
        // Analysis
        analyzeTimeframe,
        comparePerformance,
        filterByType,
        filterByDateRange,
        filterByAccuracy,
        
        // Metrics
        getOverallStats,
        getTypePerformance,
        getRecentPerformance
    };
}

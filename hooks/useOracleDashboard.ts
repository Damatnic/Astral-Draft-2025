/**
 * Oracle Dashboard Integration Hook
 * Connects dashboard components with Oracle performance services
 */

import { useState, useEffect, useCallback } from 'react';
import { oracleUserDashboardService, UserDashboardStats, PersonalizedInsight, UserPredictionHistory } from '../services/oracleUserDashboardService';

export interface DashboardData {
    stats: UserDashboardStats | null;
    insights: PersonalizedInsight[];
    history: UserPredictionHistory[];
    isLoading: boolean;
    error: string | null;
}

export interface DashboardFilters {
    timeframe: 'week' | 'month' | 'season' | 'all';
    category: string;
    onlyResolved: boolean;
}

export const useOracleDashboard = (userId: string, season: number = 2024) => {
    const [data, setData] = useState<DashboardData>({
        stats: null,
        insights: [],
        history: [],
        isLoading: true,
        error: null
    });

    const [filters, setFilters] = useState<DashboardFilters>({
        timeframe: 'season',
        category: 'all',
        onlyResolved: false
    });

    const loadDashboardData = useCallback(async () => {
        try {
            setData(prev => ({ ...prev, isLoading: true, error: null }));

            const [stats, insights, historyData] = await Promise.all([
                oracleUserDashboardService.getUserDashboardStats(userId, season),
                oracleUserDashboardService.getPersonalizedInsights(userId, season),
                oracleUserDashboardService.getUserPredictionHistory(userId, {
                    limit: 20,
                    category: filters.category,
                    timeframe: filters.timeframe,
                    onlyResolved: filters.onlyResolved
                })
            ]);

            setData({
                stats,
                insights,
                history: historyData.predictions,
                isLoading: false,
                error: null
            });

        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            setData(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to load dashboard data'
            }));
        }
    }, [userId, season, filters]);

    const updateFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    const refreshData = useCallback(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    const clearCache = useCallback(() => {
        oracleUserDashboardService.clearUserCache(userId, season);
        refreshData();
    }, [userId, season, refreshData]);

    // Load data on mount and when dependencies change
    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    return {
        data,
        filters,
        updateFilters,
        refreshData,
        clearCache,
        isLoading: data.isLoading,
        error: data.error
    };
};

/**
 * Performance calculation utilities
 */
export const DashboardUtils = {
    /**
     * Calculate accuracy color based on percentage
     */
    getAccuracyColor: (accuracy: number): string => {
        if (accuracy >= 70) return 'text-green-500';
        if (accuracy >= 60) return 'text-yellow-500';
        return 'text-red-500';
    },

    /**
     * Calculate trend direction
     */
    getTrendDirection: (current: number, previous: number): 'up' | 'down' | 'stable' => {
        const diff = current - previous;
        if (Math.abs(diff) < 1) return 'stable';
        return diff > 0 ? 'up' : 'down';
    },

    /**
     * Format confidence level
     */
    formatConfidence: (confidence: number): string => {
        if (confidence >= 80) return 'Very High';
        if (confidence >= 60) return 'High';
        if (confidence >= 40) return 'Medium';
        if (confidence >= 20) return 'Low';
        return 'Very Low';
    },

    /**
     * Calculate streak emoji
     */
    getStreakEmoji: (streak: number, type: 'correct' | 'incorrect'): string => {
        if (streak === 0) return '⚪';
        if (type === 'correct') {
            if (streak >= 10) return '🔥🔥🔥';
            if (streak >= 5) return '🔥🔥';
            if (streak >= 3) return '🔥';
            return '✅';
        } else {
            if (streak >= 5) return '❄️❄️';
            if (streak >= 3) return '❄️';
            return '❌';
        }
    },

    /**
     * Get insight priority color
     */
    getInsightPriorityColor: (priority: 'high' | 'medium' | 'low'): string => {
        switch (priority) {
            case 'high': return 'border-red-500 bg-red-500/10';
            case 'medium': return 'border-yellow-500 bg-yellow-500/10';
            case 'low': return 'border-blue-500 bg-blue-500/10';
            default: return 'border-gray-500 bg-gray-500/10';
        }
    },

    /**
     * Calculate performance grade
     */
    getPerformanceGrade: (accuracy: number): { grade: string; color: string } => {
        if (accuracy >= 80) return { grade: 'A+', color: 'text-green-400' };
        if (accuracy >= 75) return { grade: 'A', color: 'text-green-500' };
        if (accuracy >= 70) return { grade: 'B+', color: 'text-lime-500' };
        if (accuracy >= 65) return { grade: 'B', color: 'text-yellow-400' };
        if (accuracy >= 60) return { grade: 'B-', color: 'text-yellow-500' };
        if (accuracy >= 55) return { grade: 'C+', color: 'text-orange-400' };
        if (accuracy >= 50) return { grade: 'C', color: 'text-orange-500' };
        if (accuracy >= 45) return { grade: 'C-', color: 'text-red-400' };
        if (accuracy >= 40) return { grade: 'D', color: 'text-red-500' };
        return { grade: 'F', color: 'text-red-600' };
    },

    /**
     * Format time ago
     */
    timeAgo: (date: Date): string => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }
};

export default useOracleDashboard;

/**
 * User Statistics Widget
 * Displays user Oracle prediction performance stats
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrophyIcon, TargetIcon, ZapIcon, TrendingUpIcon } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';

export interface UserStats {
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    streak: number;
    rank: number;
}

interface UserStatsWidgetProps {
    stats: UserStats;
    className?: string;
    compact?: boolean;
}

export const UserStatsWidget: React.FC<UserStatsWidgetProps> = ({ 
    stats, 
    className = '',
    compact = false 
}) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    
    const statItems = [
        {
            label: 'Accuracy',
            value: `${stats.accuracy.toFixed(1)}%`,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
            icon: TargetIcon
        },
        {
            label: 'Streak',
            value: stats.streak.toString(),
            color: 'text-green-400',
            bgColor: 'bg-green-500/10',
            icon: ZapIcon
        },
        {
            label: 'Total',
            value: stats.totalPredictions.toString(),
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
            icon: TrendingUpIcon
        },
        {
            label: 'Rank',
            value: `#${stats.rank}`,
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500/10',
            icon: TrophyIcon
        }
    ];

    if (compact) {
        return (
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 ${className}`}>
                {statItems.map((item, index) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`${item.bgColor} rounded-lg p-3 sm:p-2 text-center min-h-[60px] sm:min-h-[50px] flex flex-col justify-center`}
                    >
                        <div className={`text-sm sm:text-xs font-bold ${item.color} mb-1 sm:mb-0`}>
                            {item.value}
                        </div>
                        <div className="text-xs text-gray-400">{item.label}</div>
                    </motion.div>
                ))}
            </div>
        );
    }

    return (
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 ${className}`}>
            {statItems.map((item, index) => {
                const Icon = item.icon;
                return (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`${item.bgColor} rounded-lg p-4 sm:p-5 text-center min-h-[100px] sm:min-h-[120px] flex flex-col justify-center`}
                    >
                        <div className="flex items-center justify-center mb-2">
                            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${item.color}`} />
                        </div>
                        <div className={`text-xl sm:text-2xl font-bold ${item.color} mb-1`}>
                            {item.value}
                        </div>
                        <div className="text-sm sm:text-base text-gray-400">{item.label}</div>
                        
                        {/* Additional context for each stat */}
                        {item.label === 'Accuracy' && stats.totalPredictions > 0 && (
                            <div className="text-xs sm:text-sm text-gray-500 mt-1">
                                {stats.correctPredictions}/{stats.totalPredictions}
                            </div>
                        )}
                        
                        {item.label === 'Streak' && stats.streak > 0 && (
                            <div className="text-xs sm:text-sm text-gray-500 mt-1">
                                🔥 On fire!
                            </div>
                        )}
                        
                        {item.label === 'Rank' && stats.rank <= 10 && (
                            <div className="text-xs text-yellow-400 mt-1">
                                Top 10!
                            </div>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
};

export default UserStatsWidget;

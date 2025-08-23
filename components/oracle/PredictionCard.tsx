/**
 * Prediction Card Component
 * Individual prediction display with interaction capabilities
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ClockIcon, UsersIcon, BrainIcon } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';

export interface LivePrediction {
    id: string;
    question: string;
    options: Array<{ text: string; probability: number }>;
    oracleChoice: number;
    confidence: number;
    reasoning?: string;
    userChoice?: number;
    userConfidence?: number;
    isSubmitted?: boolean;
    timeRemaining?: number;
    participants?: number;
    consensusChoice?: number;
    consensusConfidence?: number;
}

interface PredictionCardProps {
    prediction: LivePrediction;
    isSelected: boolean;
    onClick: () => void;
    className?: string;
    compact?: boolean;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
    prediction,
    isSelected,
    onClick,
    className = '',
    compact = false
}) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    
    // Format time remaining
    const formatTimeRemaining = (ms?: number) => {
        if (!ms) return 'Time expired';
        
        const minutes = Math.floor(ms / 60000);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m left`;
        }
        return `${minutes}m left`;
    };

    // Get time remaining color based on urgency
    const getTimeColor = (ms?: number) => {
        if (!ms) return 'text-red-400';
        
        const minutes = Math.floor(ms / 60000);
        
        if (minutes < 15) return 'text-red-400';
        if (minutes < 60) return 'text-yellow-400';
        return 'text-green-400';
    };

    // Get status badge styling
    const getStatusBadge = () => {
        if (prediction.isSubmitted) {
            return {
                text: 'Submitted',
                className: 'bg-green-500/20 text-green-400'
            };
        }
        
        if (!prediction.timeRemaining || prediction.timeRemaining <= 0) {
            return {
                text: 'Expired',
                className: 'bg-red-500/20 text-red-400'
            };
        }
        
        return {
            text: 'Open',
            className: 'bg-blue-500/20 text-blue-400'
        };
    };

    const statusBadge = getStatusBadge();

    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                className={`
                    cursor-pointer transition-all duration-200 p-3 sm:p-4 rounded-lg border min-h-[120px] sm:min-h-[100px]
                    ${isSelected 
                        ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/20' 
                        : 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50 hover:border-gray-600'
                    }
                    ${className}
                `}
                onClick={onClick}
                role="button"
                tabIndex={0}
                aria-label={`Select prediction: ${prediction.question}`}
                onKeyDown={(e: any) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onClick();
                    }
                }}
            >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                    <h4 className="text-sm sm:text-base font-medium text-white leading-tight flex-1 pr-0 sm:pr-2">
                        {prediction.question}
                    </h4>
                    <div className={`px-2 py-1 rounded text-xs font-medium self-start ${statusBadge.className}`}>
                        {statusBadge.text}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-400">
                    <div className="flex items-center space-x-2">
                        <ClockIcon className="w-4 h-4 flex-shrink-0" />
                        <span className={getTimeColor(prediction.timeRemaining)}>
                            {formatTimeRemaining(prediction.timeRemaining)}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <UsersIcon className="w-4 h-4 flex-shrink-0" />
                        <span>{prediction.participants || 0} users</span>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: isMobile ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
                cursor-pointer transition-all duration-300 p-4 sm:p-5 rounded-xl border backdrop-blur-sm relative
                ${isSelected 
                    ? 'bg-blue-600/20 border-blue-500 shadow-xl shadow-blue-500/25 ring-1 ring-blue-500/50' 
                    : 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-800/60 hover:border-gray-600 hover:shadow-lg'
                }
                ${className}
            `}
            onClick={onClick}
            role="button"
            tabIndex={0}
            aria-label={`View details for prediction: ${prediction.question}`}
            onKeyDown={(e: any) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
                <h4 className="text-sm sm:text-base font-medium text-white leading-tight flex-1 pr-0 sm:pr-3">
                    {prediction.question}
                </h4>
                <div className={`px-3 py-1 rounded-md text-xs font-semibold self-start ${statusBadge.className}`}>
                    {statusBadge.text}
                </div>
            </div>
            
            {/* Oracle's prediction preview */}
            <div className="mb-3 p-3 bg-blue-900/20 rounded-lg border border-blue-800/30">
                <div className="flex items-center space-x-2 mb-2">
                    <BrainIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-blue-400">Oracle Choice</span>
                    <span className="text-sm text-gray-400">{prediction.confidence}%</span>
                </div>
                <div className="text-sm text-white break-words">
                    {prediction.options[prediction.oracleChoice]?.text || 'Unknown'}
                </div>
            </div>
            
            {/* User's prediction if submitted */}
            {prediction.isSubmitted && prediction.userChoice !== undefined && (
                <div className="mb-3 p-3 bg-green-900/20 rounded-lg border border-green-800/30">
                    <div className="text-sm font-medium text-green-400 mb-2">Your Choice</div>
                    <div className="text-sm text-white break-words">
                        {prediction.options[prediction.userChoice]?.text}
                        <span className="text-gray-400 ml-2">({prediction.userConfidence}%)</span>
                    </div>
                </div>
            )}
            
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm mb-3">
                <div className="flex items-center space-x-2">
                    <ClockIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className={getTimeColor(prediction.timeRemaining)}>
                        {formatTimeRemaining(prediction.timeRemaining)}
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    <UsersIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-300">{prediction.participants || 0} participants</span>
                </div>
            </div>
            
            {/* Community consensus */}
            <div className="pt-3 border-t border-gray-700/50">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 text-xs">
                    <span className="text-gray-500">
                        Oracle: {prediction.confidence}% confident
                    </span>
                    <span className="text-purple-400">
                        Community: {prediction.consensusConfidence || 0}%
                    </span>
                </div>
                
                {/* Consensus choice */}
                <div className="text-xs text-gray-400 mt-2 break-words">
                    Community choice: {prediction.options[prediction.consensusChoice || 0]?.text || 'Unknown'}
                </div>
            </div>
            
            {/* Selection indicator */}
            {isSelected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 rounded-full border-2 border-gray-900"
                    aria-hidden="true"
                />
            )}
        </motion.div>
    );
};

export default PredictionCard;

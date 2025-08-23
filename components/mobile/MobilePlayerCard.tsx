/**
 * Mobile Player Card Component
 * Touch-optimized player cards with swipe actions and condensed information
 */

import React from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Player } from '../../types';
import { 
    StarIcon, 
    TrendingUpIcon, 
    TrendingDownIcon,
    InfoIcon,
    PlusIcon,
    XIcon,
    HeartIcon,
    AlertTriangleIcon
} from 'lucide-react';

interface MobilePlayerCardProps {
    player: Player;
    onAddToQueue?: () => void;
    onRemoveFromQueue?: () => void;
    onViewDetails?: () => void;
    onDraft?: () => void;
    isInQueue?: boolean;
    isDraftable?: boolean;
    showProjection?: boolean;
    showTrends?: boolean;
    isCompact?: boolean;
    swipeActions?: boolean;
    className?: string;
}

interface SwipeAction {
    icon: React.ReactNode;
    color: string;
    label: string;
    action: () => void;
}

const MobilePlayerCard: React.FC<MobilePlayerCardProps> = ({
    player,
    onAddToQueue,
    onRemoveFromQueue,
    onViewDetails,
    onDraft,
    isInQueue = false,
    isDraftable = false,
    showProjection = true,
    showTrends = false,
    isCompact = false,
    swipeActions = true,
    className = ''
}) => {
    const [dragOffset, setDragOffset] = React.useState(0);
    const [isDragging, setIsDragging] = React.useState(false);

    const getPositionColor = (position: string) => {
        switch (position) {
            case 'QB': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'RB': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'WR': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'TE': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'K': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'DST': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getPlayerTier = (tier: number) => {
        if (tier <= 1) return { text: 'Elite', color: 'text-yellow-400' };
        if (tier <= 3) return { text: 'Top', color: 'text-green-400' };
        if (tier <= 6) return { text: 'Mid', color: 'text-blue-400' };
        return { text: 'Deep', color: 'text-gray-400' };
    };

    const getTrendIcon = () => {
        // Mock trend data - in real app this would come from player data
        const trend = Math.random() > 0.5 ? 'up' : 'down';
        return trend === 'up' ? 
            <TrendingUpIcon className="w-3 h-3 text-green-400" /> :
            <TrendingDownIcon className="w-3 h-3 text-red-400" />;
    };

    const leftSwipeActions: SwipeAction[] = [
        {
            icon: <XIcon className="w-5 h-5" />,
            color: 'bg-red-500',
            label: 'Pass',
            action: () => onRemoveFromQueue?.()
        }
    ];

    const rightSwipeActions: SwipeAction[] = [
        {
            icon: isInQueue ? <HeartIcon className="w-5 h-5 fill-current" /> : <StarIcon className="w-5 h-5" />,
            color: isInQueue ? 'bg-red-500' : 'bg-green-500',
            label: isInQueue ? 'Remove' : 'Queue',
            action: () => isInQueue ? onRemoveFromQueue?.() : onAddToQueue?.()
        }
    ];

    const handleDrag = (event: any, info: PanInfo) => {
        if (!swipeActions) return;
        
        const newOffset = Math.max(-120, Math.min(120, info.offset.x));
        setDragOffset(newOffset);
        
        if (!isDragging && Math.abs(newOffset) > 10) {
            setIsDragging(true);
        }
    };

    const handleDragEnd = (event: any, info: PanInfo) => {
        if (!swipeActions) return;
        
        const threshold = 60;
        
        if (info.offset.x < -threshold) {
            // Left swipe
            leftSwipeActions[0]?.action();
        } else if (info.offset.x > threshold) {
            // Right swipe
            rightSwipeActions[0]?.action();
        }
        
        setDragOffset(0);
        setIsDragging(false);
    };

    const getBackgroundColor = () => {
        if (!isDragging) {
            return isInQueue 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-[var(--panel-bg)] border-[var(--panel-border)]';
        }
        
        if (dragOffset > 30) return 'bg-green-500/20';
        if (dragOffset < -30) return 'bg-red-500/20';
        return 'bg-[var(--panel-bg)]';
    };

    const renderSwipeIndicator = () => {
        if (!isDragging || !swipeActions) return null;
        
        let action = null;
        if (dragOffset > 30) {
            action = rightSwipeActions[0];
        } else if (dragOffset < -30) {
            action = leftSwipeActions[0];
        }
        
        if (!action) return null;
        
        return (
            <div className={`absolute ${dragOffset > 0 ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 ${action.color} rounded-full p-2 text-white`}>
                {action.icon}
            </div>
        );
    };

    return (
        <motion.div
            drag={swipeActions ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            onTap={onViewDetails}
            whileTap={{ scale: 0.98 }}
            className={`relative ${getBackgroundColor()} border rounded-lg transition-all cursor-pointer ${className}`}
            style={{ x: dragOffset }}
        >
            {renderSwipeIndicator()}
            
            <div className={`p-3 ${isCompact ? 'py-2' : ''}`}>
                {/* Header Row */}
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Player Avatar/Initial */}
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {player.name.split(' ').map((n: any) => n[0]).join('').slice(0, 2)}
                        </div>
                        
                        {/* Player Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-[var(--text-primary)] truncate text-sm">
                                    {player.name}
                                </h3>
                                {isInQueue && (
                                    <StarIcon className="w-4 h-4 text-yellow-400 fill-current flex-shrink-0" />
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-1 rounded text-xs font-medium border ${getPositionColor(player.position)}`}>
                                    {player.position}
                                </span>
                                <span className="text-xs text-[var(--text-secondary)]">
                                    {player.team}
                                </span>
                                {!isCompact && (
                                    <span className="text-xs text-[var(--text-secondary)]">
                                        Bye {player.bye}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Rankings & Stats */}
                    <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-[var(--text-primary)]">
                            #{player.rank}
                        </div>
                        {!isCompact && (
                            <div className="text-xs text-[var(--text-secondary)]">
                                ADP {player?.adp}
                            </div>
                        )}
                        {showTrends && (
                            <div className="flex items-center justify-end mt-1">
                                {getTrendIcon()}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Stats Row */}
                {showProjection && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div>
                                <div className="text-xs text-[var(--text-secondary)]">Projection</div>
                                <div className="text-sm font-medium text-[var(--text-primary)]">
                                    {player.stats.projection.toFixed(1)}
                                </div>
                            </div>
                            
                            {!isCompact && (
                                <>
                                    <div>
                                        <div className="text-xs text-[var(--text-secondary)]">VORP</div>
                                        <div className="text-sm font-medium text-[var(--text-primary)]">
                                            {player.stats.vorp.toFixed(1)}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <div className="text-xs text-[var(--text-secondary)]">Tier</div>
                                        <div className={`text-sm font-medium ${getPlayerTier(player?.tier).color}`}>
                                            {getPlayerTier(player?.tier).text}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            {onViewDetails && (
                                <button
                                    onClick={(e: any) => {
                                        e.stopPropagation();
                                        onViewDetails();
                                    }}
                                    className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 rounded"
                                >
                                    <InfoIcon className="w-4 h-4" />
                                </button>
                            )}
                            
                            {isDraftable && onDraft && (
                                <button
                                    onClick={(e: any) => {
                                        e.stopPropagation();
                                        onDraft();
                                    }}
                                    className="px-3 py-1.5 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 transition-colors"
                                >
                                    Draft
                                </button>
                            )}
                            
                            {!swipeActions && onAddToQueue && !isInQueue && (
                                <button
                                    onClick={(e: any) => {
                                        e.stopPropagation();
                                        onAddToQueue();
                                    }}
                                    className="p-1.5 text-green-400 hover:bg-green-500/20 rounded"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Injury/News Alert */}
                {player?.injuryHistory && player?.injuryHistory.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs">
                        <AlertTriangleIcon className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                        <span className="text-yellow-400 font-medium">
                            {player?.injuryHistory[0].status}
                        </span>
                        <span className="text-[var(--text-secondary)] truncate">
                            {player?.injuryHistory[0].injury}
                        </span>
                    </div>
                )}
            </div>
            
            {/* Swipe Hints */}
            {swipeActions && !isDragging && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-4 opacity-20">
                    <div className="flex items-center gap-1 text-red-400">
                        <span className="text-xs">←</span>
                        <span className="text-xs">Pass</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-400">
                        <span className="text-xs">Queue</span>
                        <span className="text-xs">→</span>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default MobilePlayerCard;

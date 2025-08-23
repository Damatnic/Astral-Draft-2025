/**
 * Mobile Optimized Oracle Interface
 * Enhanced responsive design and touch interactions for Oracle predictions
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { 
    Menu, 
    Target, 
    BarChart3, 
    TrendingUp, 
    Settings
} from 'lucide-react';
import OracleRealTimePredictionInterface from './OracleRealTimePredictionInterface';

interface Props {
    week?: number;
    className?: string;
}

// Mobile Bottom Navigation Component
const MobileBottomNav: React.FC<{
    activeView: string;
    onViewChange: (view: string) => void;
    onSettingsOpen: () => void;
}> = ({ activeView, onViewChange, onSettingsOpen }) => (
    <motion.div 
        className="fixed bottom-0 left-0 right-0 bg-gray-800/95 backdrop-blur-sm border-t border-gray-700 z-50"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
        <div className="flex items-center justify-around py-2 px-4">
            <button
                onClick={() => onViewChange('predictions')}
                className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                    activeView === 'predictions' 
                        ? 'text-blue-400 bg-blue-400/10' 
                        : 'text-gray-400 hover:text-white'
                }`}
            >
                <Target className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">Predictions</span>
            </button>
            
            <button
                onClick={() => onViewChange('stats')}
                className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                    activeView === 'stats' 
                        ? 'text-green-400 bg-green-400/10' 
                        : 'text-gray-400 hover:text-white'
                }`}
            >
                <TrendingUp className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">Stats</span>
            </button>
            
            <button
                onClick={() => onViewChange('analytics')}
                className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                    activeView === 'analytics' 
                        ? 'text-purple-400 bg-purple-400/10' 
                        : 'text-gray-400 hover:text-white'
                }`}
            >
                <BarChart3 className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">Analytics</span>
            </button>
            
            <button
                onClick={onSettingsOpen}
                className="flex flex-col items-center py-2 px-4 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
                <Settings className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">Settings</span>
            </button>
        </div>
    </motion.div>
);

// Mobile Header Component
const MobileHeader: React.FC<{
    onMenuToggle: () => void;
    accuracy: number;
}> = ({ onMenuToggle, accuracy }) => (
    <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 z-40 p-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <button
                    onClick={onMenuToggle}
                    className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold text-white">🔮 Oracle</h1>
            </div>
            
            <div className="text-right">
                <p className="text-sm text-white font-medium">{accuracy.toFixed(1)}%</p>
                <p className="text-xs text-gray-400">Accuracy</p>
            </div>
        </div>
    </div>
);

// Mobile Swipe Indicators
const MobileSwipeIndicators: React.FC<{
    activeView: string;
}> = ({ activeView }) => (
    <div className="flex justify-center space-x-2 py-2">
        <div className={`w-2 h-2 rounded-full transition-colors ${
            activeView === 'predictions' ? 'bg-blue-400' : 'bg-gray-600'
        }`}></div>
        <div className={`w-2 h-2 rounded-full transition-colors ${
            activeView === 'stats' ? 'bg-green-400' : 'bg-gray-600'
        }`}></div>
        <div className={`w-2 h-2 rounded-full transition-colors ${
            activeView === 'analytics' ? 'bg-purple-400' : 'bg-gray-600'
        }`}></div>
    </div>
);

const MobileOptimizedOracleInterface: React.FC<Props> = ({ 
    week = 1, 
    className = '' 
}) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [activeView, setActiveView] = React.useState('predictions');
    const [showMobileMenu, setShowMobileMenu] = React.useState(false);

    // For demo purposes, using placeholder accuracy
    const accuracy = 85.2;

    // If not mobile, render the regular interface
    if (!isMobile) {
        return (
            <OracleRealTimePredictionInterface 
                week={week} 
                className={className} 
            />
        );
    }

    return (
        <div className={`w-full pb-20 ${className}`}>
            {/* Mobile Header */}
            <MobileHeader 
                onMenuToggle={() => setShowMobileMenu(true)}
                accuracy={accuracy}
            />

            {/* Swipe Indicators */}
            <MobileSwipeIndicators activeView={activeView} />

            {/* Mobile Tips */}
            <div className="p-4">
                <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-200 flex items-center space-x-2">
                        <span>💡</span>
                        <span>Swipe between sections • Tap cards to interact • Long press for options</span>
                    </p>
                </div>

                {/* Main Content */}
                <motion.div
                    key={activeView}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    <OracleRealTimePredictionInterface 
                        week={week} 
                        className="mobile-optimized" 
                    />
                </motion.div>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav
                activeView={activeView}
                onViewChange={setActiveView}
                onSettingsOpen={() => {
                    // Future: Open settings modal
                    console.log('Settings tapped');
                }}
            />

            {/* Mobile Menu Modal */}
            {showMobileMenu && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-50 flex items-end"
                    onClick={() => setShowMobileMenu(false)}
                >
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        className="w-full bg-gray-800 rounded-t-3xl p-6"
                        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                        onClick={(e: any) => e.stopPropagation()}
                    >
                        <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-6"></div>
                        
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                            
                            <button
                                onClick={() => {
                                    setActiveView('predictions');
                                    setShowMobileMenu(false);
                                }}
                                className="w-full flex items-center space-x-3 p-4 bg-gray-700 rounded-xl text-left hover:bg-gray-600 transition-colors"
                            >
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <Target className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">View Predictions</p>
                                    <p className="text-gray-400 text-sm">Latest Oracle insights</p>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => {
                                    setActiveView('analytics');
                                    setShowMobileMenu(false);
                                }}
                                className="w-full flex items-center space-x-3 p-4 bg-gray-700 rounded-xl text-left hover:bg-gray-600 transition-colors"
                            >
                                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Analytics Dashboard</p>
                                    <p className="text-gray-400 text-sm">Performance insights</p>
                                </div>
                            </button>
                        </div>
                        
                        <button
                            onClick={() => setShowMobileMenu(false)}
                            className="w-full mt-6 py-3 bg-gray-700 rounded-xl text-white font-medium hover:bg-gray-600 transition-colors"
                        >
                            Close
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
};

export default MobileOptimizedOracleInterface;

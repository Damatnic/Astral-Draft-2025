/**
 * Draft Simulation Demo Component
 * Showcases the AI-powered draft simulation functionality
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    RocketIcon, 
    BrainIcon, 
    ZapIcon, 
    TargetIcon,
    TrophyIcon,
    StarIcon,
    CheckCircleIcon
} from 'lucide-react';
import { Widget } from '../ui/Widget';
import DraftSimulationInterface from './DraftSimulationInterface';

interface DemoFeature {
    icon: React.ReactNode;
    title: string;
    description: string;
    isHighlight?: boolean;
}

const DraftSimulationDemo: React.FC = () => {
    const [showDemo, setShowDemo] = useState(false);

    const features: DemoFeature[] = [
        {
            icon: <BrainIcon className="w-6 h-6" />,
            title: "AI Opponent Modeling",
            description: "Each AI opponent has unique personalities (Scholar, Gambler, Safe Pick) with different decision-making patterns and draft strategies.",
            isHighlight: true
        },
        {
            icon: <TargetIcon className="w-6 h-6" />,
            title: "Advanced Player Evaluation",
            description: "AI evaluates players based on position scarcity, team needs, strategy fit, and situational factors for realistic draft behavior."
        },
        {
            icon: <ZapIcon className="w-6 h-6" />,
            title: "Multiple Draft Strategies",
            description: "Choose from Balanced, RB Heavy, WR Heavy, Zero RB, Hero RB, and Best Available strategies for diverse draft experiences."
        },
        {
            icon: <TrophyIcon className="w-6 h-6" />,
            title: "Real-time Analytics",
            description: "Get instant feedback on team performance, strengths, weaknesses, and draft grade as the simulation progresses."
        },
        {
            icon: <StarIcon className="w-6 h-6" />,
            title: "Customizable Settings",
            description: "Adjust team count, scoring system, AI difficulty, simulation speed, and other parameters for tailored experiences."
        },
        {
            icon: <RocketIcon className="w-6 h-6" />,
            title: "Post-Draft Analysis",
            description: "Comprehensive team comparisons, value picks analysis, and strategic insights to improve future draft performance."
        }
    ];

    const aiPersonalities = [
        {
            name: "The Scholar",
            icon: "🎓",
            description: "Methodical researcher who analyzes every pick carefully",
            traits: ["High research level", "Consistent decisions", "Strategy adherence"],
            decisionSpeed: "Slow (8-12s)",
            style: "Conservative, data-driven"
        },
        {
            name: "The Gambler", 
            icon: "🎲",
            description: "High-risk, high-reward player who takes bold chances",
            traits: ["Aggressive picks", "Boom/bust players", "Unpredictable"],
            decisionSpeed: "Fast (3-6s)",
            style: "Aggressive, intuitive"
        },
        {
            name: "The Safe Pick",
            icon: "🛡️", 
            description: "Risk-averse manager focused on consistent performance",
            traits: ["Floor over ceiling", "Proven veterans", "Safe strategies"],
            decisionSpeed: "Medium (5-8s)",
            style: "Conservative, reliable"
        }
    ];

    const draftStrategies = [
        {
            name: "Balanced",
            description: "Well-rounded approach filling all positions evenly",
            focus: "Positional balance",
            earlyRounds: "BPA with positional needs"
        },
        {
            name: "RB Heavy",
            description: "Early and frequent running back selections",
            focus: "Running back depth",
            earlyRounds: "Target top RBs first"
        },
        {
            name: "Zero RB",
            description: "Avoid RBs early, focus on WR/TE value",
            focus: "WR/TE in early rounds",
            earlyRounds: "Skip RBs for skill players"
        },
        {
            name: "Hero RB",
            description: "Draft one elite RB, then avoid position",
            focus: "One top RB only",
            earlyRounds: "Elite RB1, then other positions"
        }
    ];

    return (
        <div className="space-y-6">
            {!showDemo ? (
                <div className="space-y-8">
                    {/* Header */}
                    <Widget title="🚀 AI Draft Simulation Engine" className="bg-gradient-to-br from-purple-900/50 to-blue-900/50">
                        <div className="space-y-6">
                            <div className="text-center space-y-4">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="inline-flex items-center space-x-3 px-6 py-3 bg-purple-600/20 rounded-full"
                                >
                                    <RocketIcon className="w-8 h-8 text-purple-400" />
                                    <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                        Advanced AI Mock Drafts
                                    </span>
                                </motion.div>

                                <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                                    Experience realistic draft simulations powered by AI opponents with unique personalities, 
                                    advanced player evaluation algorithms, and comprehensive analytics. Perfect your draft strategy 
                                    against intelligent competition before your real league draft.
                                </p>

                                <motion.button
                                    onClick={() => setShowDemo(true)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg"
                                >
                                    <ZapIcon className="w-5 h-5" />
                                    <span>Launch Draft Simulation</span>
                                </motion.button>
                            </div>

                            {/* Key Features */}
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {features.map((feature, index) => (
                                    <motion.div
                                        key={feature.title}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`p-4 rounded-lg ${
                                            feature.isHighlight 
                                                ? 'bg-gradient-to-br from-purple-800/30 to-blue-800/30 border border-purple-500/30' 
                                                : 'bg-gray-800/30'
                                        }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className={`flex-shrink-0 p-2 rounded-lg ${
                                                feature.isHighlight ? 'bg-purple-600/20 text-purple-400' : 'bg-gray-700/50 text-gray-400'
                                            }`}>
                                                {feature.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                                                <p className="text-sm text-gray-300">{feature.description}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </Widget>

                    {/* AI Personalities */}
                    <Widget title="🤖 AI Opponent Personalities" className="bg-gray-900/50">
                        <div className="grid md:grid-cols-3 gap-6">
                            {aiPersonalities.map((personality, index) => (
                                <motion.div
                                    key={personality.name}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.15 }}
                                    className="bg-gray-800/50 rounded-lg p-4 space-y-3"
                                >
                                    <div className="flex items-center space-x-3">
                                        <span className="text-2xl">{personality.icon}</span>
                                        <h3 className="text-lg font-semibold text-white">{personality.name}</h3>
                                    </div>
                                    
                                    <p className="text-sm text-gray-300">{personality.description}</p>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-400">Decision Speed:</span>
                                            <span className="text-blue-400">{personality.decisionSpeed}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-400">Style:</span>
                                            <span className="text-green-400">{personality.style}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="text-xs font-medium text-gray-400">Key Traits:</div>
                                        {personality.traits.map((trait) => (
                                            <div key={trait} className="flex items-center space-x-1 text-xs text-gray-300">
                                                <CheckCircleIcon className="w-3 h-3 text-green-500" />
                                                <span>{trait}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </Widget>

                    {/* Draft Strategies */}
                    <Widget title="📋 Draft Strategies" className="bg-gray-900/50">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {draftStrategies.map((strategy, index) => (
                                <motion.div
                                    key={strategy.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-gray-800/50 rounded-lg p-4 space-y-2"
                                >
                                    <h3 className="font-semibold text-white">{strategy.name}</h3>
                                    <p className="text-sm text-gray-300">{strategy.description}</p>
                                    
                                    <div className="space-y-1 pt-2 border-t border-gray-700">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-400">Focus:</span>
                                            <span className="text-blue-400">{strategy.focus}</span>
                                        </div>
                                        <div className="text-xs text-gray-300">
                                            <span className="text-gray-400">Early Rounds:</span> {strategy.earlyRounds}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </Widget>

                    {/* Technical Implementation */}
                    <Widget title="⚙️ Technical Implementation" className="bg-gray-900/50">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">AI Evaluation Engine</h3>
                                <ul className="space-y-2 text-sm text-gray-300">
                                    <li>• Position scarcity calculations</li>
                                    <li>• Team need analysis and roster construction</li>
                                    <li>• Strategy compatibility scoring</li>
                                    <li>• Situational factor weighting (injuries, bye weeks)</li>
                                    <li>• Personality-driven decision making</li>
                                    <li>• Dynamic player value adjustments</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">Simulation Features</h3>
                                <ul className="space-y-2 text-sm text-gray-300">
                                    <li>• Snake and linear draft formats</li>
                                    <li>• Variable speed control (1x - 8x)</li>
                                    <li>• Real-time draft board updates</li>
                                    <li>• Live analytics and team scoring</li>
                                    <li>• Post-draft comprehensive analysis</li>
                                    <li>• Export and share simulation results</li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-blue-900/20 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                                <StarIcon className="w-5 h-5 text-yellow-400" />
                                <span className="font-semibold text-white">Pro Tip</span>
                            </div>
                            <p className="text-sm text-gray-300">
                                Run multiple simulations with different settings to understand how draft position, 
                                strategy, and opponent behavior affect your optimal picks. Use the analytics to 
                                identify value opportunities and improve your real draft performance.
                            </p>
                        </div>
                    </Widget>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                            <RocketIcon className="w-6 h-6 text-purple-400" />
                            <span>AI Draft Simulation</span>
                        </h2>
                        <button
                            onClick={() => setShowDemo(false)}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                            Back to Overview
                        </button>
                    </div>
                    
                    <DraftSimulationInterface />
                </div>
            )}
        </div>
    );
};

export default DraftSimulationDemo;

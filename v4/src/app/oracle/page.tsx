'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, BoltIcon, TrophyIcon, ChartBarIcon, SparklesIcon, FireIcon, ArrowTrendingUpIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { StarIcon, UserIcon, CalendarIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

// Cyberpunk color palette
const neonColors = {
  cyan: '#00FFFF',
  magenta: '#FF00FF',
  yellow: '#FFFF00',
  green: '#00FF00',
  red: '#FF0040',
  purple: '#9D00FF',
  orange: '#FF6B00',
  pink: '#FF006E'
};

interface Prediction {
  id: string;
  type: 'breakout' | 'bust' | 'sleeper' | 'injury' | 'weather';
  player: string;
  team: string;
  position: string;
  confidence: number;
  reasoning: string;
  impact: string;
  stats?: {
    projectedPoints: number;
    floor: number;
    ceiling: number;
  };
}

interface TradeAnalysis {
  verdict: 'accept' | 'reject' | 'counter';
  winProbabilityChange: number;
  fairnessScore: number;
  insights: string[];
  counterOffer?: string;
}

interface LineupOptimization {
  changes: {
    out: string;
    in: string;
    reason: string;
  }[];
  projectedPointsGain: number;
  confidence: number;
}

export default function OraclePage() {
  const [activeTab, setActiveTab] = useState<'predictions' | 'trade' | 'lineup' | 'insights'>('predictions');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(15);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [scanLinePosition, setScanLinePosition] = useState(0);
  const [glitchEffect, setGlitchEffect] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [tradeAnalysisResult, setTradeAnalysisResult] = useState<{
    fairnessScore: number;
    winProbabilityChange: number;
    projectedPointsChange: number;
  } | null>(null);

  // Cyberpunk animations
  useEffect(() => {
    const scanInterval = setInterval(() => {
      setScanLinePosition(prev => (prev + 0.5) % 100);
    }, 30);
    
    const glitchInterval = setInterval(() => {
      setGlitchEffect(true);
      setTimeout(() => setGlitchEffect(false), 100);
    }, 8000);
    
    return () => {
      clearInterval(scanInterval);
      clearInterval(glitchInterval);
    };
  }, []);

  // Mock predictions data (fallback if API not available)
  const mockPredictions: Prediction[] = [
    {
      id: '1',
      type: 'breakout',
      player: 'Nico Collins',
      team: 'HOU',
      position: 'WR',
      confidence: 92,
      reasoning: 'Facing weak secondary, high target share, QB chemistry improving',
      impact: '+8.5 points above projection',
      stats: { projectedPoints: 18.5, floor: 14.2, ceiling: 24.8 }
    },
    {
      id: '2',
      type: 'sleeper',
      player: 'Jaylen Warren',
      team: 'PIT',
      position: 'RB',
      confidence: 87,
      reasoning: 'Najee Harris limited in practice, increased snap share trend',
      impact: 'RB2 value at RB3 price',
      stats: { projectedPoints: 14.2, floor: 10.5, ceiling: 18.9 }
    },
    {
      id: '3',
      type: 'bust',
      player: 'Calvin Ridley',
      team: 'TEN',
      position: 'WR',
      confidence: 78,
      reasoning: 'Tough matchup, backup QB starting, weather concerns',
      impact: '-6.2 points below projection',
      stats: { projectedPoints: 8.3, floor: 5.1, ceiling: 11.7 }
    },
    {
      id: '4',
      type: 'weather',
      player: 'Bills DST',
      team: 'BUF',
      position: 'DST',
      confidence: 94,
      reasoning: '25+ mph winds, freezing rain expected, low scoring game',
      impact: 'Elite DST play this week',
      stats: { projectedPoints: 12.5, floor: 9.0, ceiling: 16.0 }
    },
    {
      id: '5',
      type: 'injury',
      player: 'Mike Evans',
      team: 'TB',
      position: 'WR',
      confidence: 65,
      reasoning: 'Hamstring issue, limited practice, game-time decision',
      impact: 'High risk even if active',
      stats: { projectedPoints: 10.2, floor: 0, ceiling: 16.5 }
    }
  ];

  const handleTradeAnalysis = () => {
    setAnalysisLoading(true);
    setTimeout(() => {
      setAnalysisLoading(false);
    }, 2000);
  };

  const handleLineupOptimization = () => {
    setAnalysisLoading(true);
    setTimeout(() => {
      setAnalysisLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Cyberpunk Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-20" 
          style={{
            backgroundImage: `linear-gradient(${neonColors.cyan} 1px, transparent 1px), linear-gradient(90deg, ${neonColors.purple} 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Scanning Lines */}
        <div 
          className="absolute w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60"
          style={{ 
            top: `${scanLinePosition}%`, 
            boxShadow: `0 0 30px ${neonColors.cyan}`,
            filter: 'blur(1px)'
          }}
        />
        <div 
          className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-40"
          style={{ 
            top: `${(scanLinePosition + 50) % 100}%`, 
            boxShadow: `0 0 20px ${neonColors.purple}`
          }}
        />
        
        {/* Holographic Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-cyan-900/10" />
        
        {/* Glitch Effect */}
        {glitchEffect && (
          <div className="absolute inset-0 mix-blend-screen">
            <div className="absolute inset-0 bg-red-500/10 transform translate-x-1" />
            <div className="absolute inset-0 bg-cyan-500/10 transform -translate-x-1" />
          </div>
        )}
      </div>

      {/* Header */}
      <div className="relative z-10 bg-black/60 backdrop-blur-xl border-b border-cyan-500/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-purple-500 to-cyan-500 blur-xl opacity-70"></div>
                <SparklesIcon className="relative h-12 w-12 text-cyan-400" 
                  style={{ filter: `drop-shadow(0 0 20px ${neonColors.cyan})` }} />
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                  style={{
                    textShadow: `0 0 30px ${neonColors.purple}, 0 0 60px ${neonColors.cyan}`,
                    letterSpacing: '0.05em'
                  }}>
                  ORACLE AI v2.0
                </h1>
                <p className="text-cyan-300/80 font-mono text-sm tracking-wider">
                  NEURAL NETWORK FANTASY INTELLIGENCE
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="px-4 py-2 bg-gradient-to-r from-green-900/50 to-green-800/30 backdrop-blur-md text-green-400 rounded-lg flex items-center space-x-2 border border-green-400/50"
                style={{ boxShadow: `0 0 20px ${neonColors.green}40` }}>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(0,255,0,0.8)]"></div>
                <span className="font-mono font-bold">ONLINE</span>
              </div>
              <div className="px-4 py-2 bg-purple-900/30 backdrop-blur-md text-purple-400 rounded-lg border border-purple-400/50 font-mono"
                style={{ boxShadow: `0 0 15px ${neonColors.purple}40` }}>
                WEEK.{selectedWeek.toString().padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="relative z-10 bg-black/40 backdrop-blur-md border-b border-cyan-500/30">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {[
              { id: 'predictions', label: 'AI PREDICTIONS', icon: BoltIcon },
              { id: 'trade', label: 'TRADE ANALYZER', icon: ArrowPathIcon },
              { id: 'lineup', label: 'LINEUP OPTIMIZER', icon: ChartBarIcon },
              { id: 'insights', label: 'DEEP INSIGHTS', icon: SparklesIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-4 border-b-2 transition-all font-bold uppercase tracking-wider ${
                  activeTab === tab.id
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-gray-500 hover:text-purple-400 hover:border-purple-500/50'
                }`}
                style={{
                  textShadow: activeTab === tab.id ? `0 0 20px ${neonColors.cyan}` : 'none',
                  boxShadow: activeTab === tab.id ? `0 2px 20px ${neonColors.cyan}40` : 'none'
                }}
              >
                <tab.icon className="h-5 w-5" 
                  style={{ 
                    filter: activeTab === tab.id ? `drop-shadow(0 0 5px ${neonColors.cyan})` : 'none' 
                  }} />
                <span className="font-mono text-sm">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'predictions' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(Number(e.target.value))}
                  className="px-4 py-2 bg-black/60 backdrop-blur-md text-cyan-100 rounded-lg border border-cyan-500/30 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all font-mono"
                >
                  {[...Array(18)].map((_, i) => (
                    <option key={i} value={i + 1}>WEEK.{(i + 1).toString().padStart(2, '0')}</option>
                  ))}
                </select>
                <select className="px-4 py-2 bg-black/60 backdrop-blur-md text-cyan-100 rounded-lg border border-cyan-500/30 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all font-mono">
                  <option>ALL_PREDICTIONS</option>
                  <option>BREAKOUTS</option>
                  <option>SLEEPERS</option>
                  <option>BUSTS</option>
                  <option>WEATHER_IMPACT</option>
                  <option>INJURY_CONCERNS</option>
                </select>
              </div>
              <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-lg hover:from-purple-500 hover:to-cyan-500 transition-all flex items-center space-x-2 font-bold transform hover:scale-105"
                style={{
                  boxShadow: `0 0 30px ${neonColors.purple}60, 0 0 50px ${neonColors.cyan}40`,
                  textShadow: '0 0 10px rgba(0,0,0,0.5)'
                }}>
                <ArrowPathIcon className="h-4 w-4" />
                <span>REFRESH</span>
              </button>
            </div>

            {/* Holographic Predictions Grid */}
            <div className="grid gap-4">
              {predictions.map((prediction) => (
                <div
                  key={prediction.id}
                  className="relative bg-black/60 backdrop-blur-xl rounded-xl p-6 border border-cyan-500/30 hover:border-purple-400/50 transition-all group overflow-hidden"
                  style={{
                    boxShadow: `0 0 30px ${neonColors.cyan}20, inset 0 0 20px ${neonColors.purple}10`
                  }}
                >
                  {/* Holographic shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  
                  <div className="relative flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg backdrop-blur-md border ${
                        prediction.type === 'breakout' ? 'bg-green-900/30 text-green-400 border-green-400/50' :
                        prediction.type === 'sleeper' ? 'bg-blue-900/30 text-blue-400 border-blue-400/50' :
                        prediction.type === 'bust' ? 'bg-red-900/30 text-red-400 border-red-400/50' :
                        prediction.type === 'weather' ? 'bg-cyan-900/30 text-cyan-400 border-cyan-400/50' :
                        'bg-yellow-900/30 text-yellow-400 border-yellow-400/50'
                      }`}
                      style={{
                        boxShadow: `0 0 20px ${
                          prediction.type === 'breakout' ? neonColors.green :
                          prediction.type === 'sleeper' ? neonColors.cyan :
                          prediction.type === 'bust' ? neonColors.red :
                          prediction.type === 'weather' ? neonColors.cyan :
                          neonColors.yellow
                        }40`
                      }}>
                        {prediction.type === 'breakout' ? <FireIcon className="h-6 w-6" /> :
                         prediction.type === 'sleeper' ? <StarIcon className="h-6 w-6" /> :
                         prediction.type === 'bust' ? <ArrowTrendingUpIcon className="h-6 w-6 rotate-180" /> :
                         prediction.type === 'weather' ? <BoltIcon className="h-6 w-6" /> :
                         <ShieldCheckIcon className="h-6 w-6" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-xl font-bold text-cyan-100"
                            style={{ textShadow: `0 0 10px ${neonColors.cyan}60` }}>
                            {prediction.player}
                          </h3>
                          <span className="text-sm text-gray-400 font-mono">{prediction.team} | {prediction.position}</span>
                          <span className={`px-3 py-1 text-xs rounded-full uppercase font-bold border ${
                            prediction.type === 'breakout' ? 'bg-green-900/30 text-green-400 border-green-400/50' :
                            prediction.type === 'sleeper' ? 'bg-blue-900/30 text-blue-400 border-blue-400/50' :
                            prediction.type === 'bust' ? 'bg-red-900/30 text-red-400 border-red-400/50' :
                            prediction.type === 'weather' ? 'bg-cyan-900/30 text-cyan-400 border-cyan-400/50' :
                            'bg-yellow-900/30 text-yellow-400 border-yellow-400/50'
                          }`}>
                            {prediction.type}
                          </span>
                        </div>
                        <p className="text-gray-300 mb-2">{prediction.reasoning}</p>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-purple-400 font-bold"
                            style={{ textShadow: `0 0 5px ${neonColors.purple}` }}>
                            {prediction.impact}
                          </span>
                          {prediction.stats && (
                            <div className="flex items-center space-x-3 text-sm font-mono">
                              <span className="text-gray-400">PROJ: <span className="text-cyan-400 font-bold">{prediction.stats.projectedPoints}</span></span>
                              <span className="text-gray-400">FLR: <span className="text-yellow-400">{prediction.stats.floor}</span></span>
                              <span className="text-gray-400">CEIL: <span className="text-green-400">{prediction.stats.ceiling}</span></span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-transparent bg-gradient-to-b from-cyan-400 to-purple-400 bg-clip-text mb-1"
                        style={{ textShadow: `0 0 20px ${neonColors.cyan}60` }}>
                        {prediction.confidence}%
                      </div>
                      <div className="text-xs text-gray-400 uppercase font-mono">CONFIDENCE</div>
                      <div className="mt-2 w-24 h-2 bg-black/60 rounded-full overflow-hidden border border-gray-700">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            prediction.confidence >= 90 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                            prediction.confidence >= 75 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                            'bg-gradient-to-r from-orange-500 to-red-500'
                          }`}
                          style={{ 
                            width: `${prediction.confidence}%`,
                            boxShadow: `0 0 10px ${
                              prediction.confidence >= 90 ? neonColors.green :
                              prediction.confidence >= 75 ? neonColors.yellow :
                              neonColors.orange
                            }`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trade' && (
          <div className="space-y-6">
            <div className="bg-black/60 backdrop-blur-xl rounded-xl p-6 border border-cyan-500/30"
              style={{ boxShadow: `0 0 30px ${neonColors.cyan}20` }}>
              <h2 className="text-2xl font-black text-cyan-400 mb-6 uppercase tracking-wider"
                style={{ textShadow: `0 0 20px ${neonColors.cyan}` }}>
                TRADE ANALYZER MATRIX
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Your Team */}
                <div>
                  <h3 className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wider">YOU GIVE</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-900/20 to-transparent backdrop-blur-sm rounded-lg border border-red-500/30">
                      <span className="text-white font-bold">Justin Jefferson</span>
                      <span className="text-gray-400 font-mono">WR | MIN</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-900/20 to-transparent backdrop-blur-sm rounded-lg border border-red-500/30">
                      <span className="text-white font-bold">Austin Ekeler</span>
                      <span className="text-gray-400 font-mono">RB | LAC</span>
                    </div>
                    <button className="w-full p-3 border-2 border-dashed border-cyan-600/50 rounded-lg text-cyan-400 hover:border-cyan-400 hover:bg-cyan-900/20 transition-all font-mono">
                      + ADD_PLAYER
                    </button>
                  </div>
                </div>

                {/* Their Team */}
                <div>
                  <h3 className="text-sm font-bold text-green-400 mb-3 uppercase tracking-wider">YOU RECEIVE</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-900/20 to-transparent backdrop-blur-sm rounded-lg border border-green-500/30">
                      <span className="text-white font-bold">Tyreek Hill</span>
                      <span className="text-gray-400 font-mono">WR | MIA</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-900/20 to-transparent backdrop-blur-sm rounded-lg border border-green-500/30">
                      <span className="text-white font-bold">Saquon Barkley</span>
                      <span className="text-gray-400 font-mono">RB | PHI</span>
                    </div>
                    <button className="w-full p-3 border-2 border-dashed border-cyan-600/50 rounded-lg text-cyan-400 hover:border-cyan-400 hover:bg-cyan-900/20 transition-all font-mono">
                      + ADD_PLAYER
                    </button>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleTradeAnalysis}
                className="mt-6 w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-black rounded-lg hover:from-purple-500 hover:to-cyan-500 transition-all flex items-center justify-center space-x-2 transform hover:scale-105 uppercase tracking-wider"
                style={{
                  boxShadow: `0 0 30px ${neonColors.purple}60, 0 0 50px ${neonColors.cyan}40`,
                  textShadow: '0 0 10px rgba(0,0,0,0.5)'
                }}
              >
                {analysisLoading ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    <span>ANALYZING...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5" />
                    <span>ANALYZE WITH AI</span>
                  </>
                )}
              </button>
            </div>

            {/* Holographic Analysis Results */}
            {!analysisLoading && (
              <div className="bg-black/60 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30"
                style={{ boxShadow: `0 0 30px ${neonColors.purple}20` }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-black text-purple-400 uppercase tracking-wider"
                    style={{ textShadow: `0 0 20px ${neonColors.purple}` }}>
                    AI ANALYSIS
                  </h3>
                  <span className="px-4 py-2 bg-yellow-900/30 backdrop-blur-sm text-yellow-400 rounded-lg text-sm font-bold border border-yellow-400/50 animate-pulse"
                    style={{ boxShadow: `0 0 15px ${neonColors.yellow}40` }}>
                    COUNTER RECOMMENDED
                  </span>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-lg p-4 text-center border border-gray-600/30">
                    <div className="text-3xl font-black text-yellow-400 mb-1"
                      style={{ textShadow: `0 0 15px ${neonColors.yellow}` }}>{tradeAnalysisResult?.fairnessScore || 72}%</div>
                    <div className="text-xs text-gray-400 uppercase font-mono">FAIRNESS_SCORE</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-lg p-4 text-center border border-gray-600/30">
                    <div className={`text-3xl font-black mb-1 ${(tradeAnalysisResult?.winProbabilityChange ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}
                      style={{ textShadow: `0 0 15px ${(tradeAnalysisResult?.winProbabilityChange ?? 0) >= 0 ? neonColors.green : neonColors.red}` }}>
                      {(tradeAnalysisResult?.winProbabilityChange ?? 0) >= 0 ? '+' : ''}{tradeAnalysisResult?.winProbabilityChange ?? -3.2}%
                    </div>
                    <div className="text-xs text-gray-400 uppercase font-mono">WIN_%_CHANGE</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-lg p-4 text-center border border-gray-600/30">
                    <div className={`text-3xl font-black mb-1 ${(tradeAnalysisResult?.projectedPointsChange ?? 0) >= 0 ? 'text-green-400' : 'text-orange-400'}`}
                      style={{ textShadow: `0 0 15px ${(tradeAnalysisResult?.projectedPointsChange ?? 0) >= 0 ? neonColors.green : neonColors.orange}` }}>
                      {(tradeAnalysisResult?.projectedPointsChange ?? 0) >= 0 ? '+' : ''}{tradeAnalysisResult?.projectedPointsChange ?? -8.5}
                    </div>
                    <div className="text-xs text-gray-400 uppercase font-mono">POINTS/WEEK</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mt-1.5 shadow-[0_0_10px_rgba(0,255,255,0.8)]"></div>
                    <p className="text-gray-300">You&apos;re giving up the WR1 overall for a slight downgrade at WR and lateral move at RB</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mt-1.5 shadow-[0_0_10px_rgba(0,255,255,0.8)]"></div>
                    <p className="text-gray-300">Jefferson averages 3.8 more PPG than Hill with higher consistency</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mt-1.5 shadow-[0_0_10px_rgba(0,255,255,0.8)]"></div>
                    <p className="text-gray-300">Consider countering for Hill + a WR2/RB2 to balance value</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gradient-to-r from-purple-900/30 to-pink-900/30 backdrop-blur-sm border border-purple-400/50 rounded-lg"
                  style={{ boxShadow: `0 0 20px ${neonColors.purple}30` }}>
                  <p className="text-sm text-purple-300">
                    <span className="font-bold uppercase">Counter Suggestion:</span> Ask for Hill + James Conner or remove Ekeler from your side
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'lineup' && (
          <div className="space-y-6">
            <div className="bg-black/60 backdrop-blur-xl rounded-xl p-6 border border-cyan-500/30"
              style={{ boxShadow: `0 0 30px ${neonColors.cyan}20` }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-cyan-400 uppercase tracking-wider"
                  style={{ textShadow: `0 0 20px ${neonColors.cyan}` }}>
                  LINEUP OPTIMIZER
                </h2>
                <button
                  onClick={handleLineupOptimization}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all flex items-center space-x-2 transform hover:scale-105"
                  style={{
                    boxShadow: `0 0 30px ${neonColors.purple}60, 0 0 50px ${neonColors.pink}40`,
                    textShadow: '0 0 10px rgba(0,0,0,0.5)'
                  }}
                >
                  {analysisLoading ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      <span>OPTIMIZING...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4" />
                      <span>OPTIMIZE</span>
                    </>
                  )}
                </button>
              </div>

              {/* Current Lineup */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">CURRENT_LINEUP</h3>
                  <div className="space-y-2">
                    {[
                      { pos: 'QB', player: 'Patrick Mahomes', team: 'KC', points: 22.5 },
                      { pos: 'RB1', player: 'Christian McCaffrey', team: 'SF', points: 18.2 },
                      { pos: 'RB2', player: 'Tony Pollard', team: 'DAL', points: 11.8 },
                      { pos: 'WR1', player: 'CeeDee Lamb', team: 'DAL', points: 16.4 },
                      { pos: 'WR2', player: 'Amon-Ra St. Brown', team: 'DET', points: 14.9 },
                      { pos: 'TE', player: 'Travis Kelce', team: 'KC', points: 12.1 },
                      { pos: 'FLEX', player: 'Chris Olave', team: 'NO', points: 10.8 },
                      { pos: 'DST', player: 'Dallas Cowboys', team: 'DAL', points: 8.5 },
                      { pos: 'K', player: 'Justin Tucker', team: 'BAL', points: 9.2 }
                    ].map((slot) => (
                      <div key={slot.pos} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-600/30">
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-bold text-cyan-400 w-12 font-mono">{slot.pos}</span>
                          <div>
                            <span className="text-white font-bold">{slot.player}</span>
                            <span className="text-gray-400 text-sm ml-2 font-mono">{slot.team}</span>
                          </div>
                        </div>
                        <span className="text-purple-400 font-bold font-mono">{slot.points}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-gradient-to-r from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-600/30">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 uppercase font-mono">PROJECTED_TOTAL:</span>
                      <span className="text-3xl font-black text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text"
                        style={{ textShadow: `0 0 20px ${neonColors.cyan}60` }}>
                        124.4
                      </span>
                    </div>
                  </div>
                </div>

                {/* Optimization Suggestions */}
                <div>
                  <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">AI_RECOMMENDATIONS</h3>
                  {!analysisLoading ? (
                    <div className="space-y-3">
                      <div className="p-4 bg-gradient-to-r from-green-900/30 to-transparent backdrop-blur-sm border border-green-400/50 rounded-lg"
                        style={{ boxShadow: `0 0 20px ${neonColors.green}30` }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-green-400 font-bold">+5.8 POINTS</span>
                          <span className="text-xs text-green-400 uppercase bg-green-900/50 px-2 py-1 rounded">HIGH_PRIORITY</span>
                        </div>
                        <p className="text-white mb-1 font-bold">Start DeVonta Smith over Chris Olave</p>
                        <p className="text-sm text-gray-400">Smith has better matchup vs. weak NYG secondary, Olave questionable with injury</p>
                      </div>

                      <div className="p-4 bg-gradient-to-r from-yellow-900/30 to-transparent backdrop-blur-sm border border-yellow-400/50 rounded-lg"
                        style={{ boxShadow: `0 0 20px ${neonColors.yellow}30` }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-yellow-400 font-bold">+3.2 POINTS</span>
                          <span className="text-xs text-yellow-400 uppercase bg-yellow-900/50 px-2 py-1 rounded">CONSIDER</span>
                        </div>
                        <p className="text-white mb-1 font-bold">Start Rachaad White over Tony Pollard</p>
                        <p className="text-sm text-gray-400">White getting more touches, Pollard facing tough run defense</p>
                      </div>

                      <div className="p-4 bg-gradient-to-r from-blue-900/30 to-transparent backdrop-blur-sm border border-blue-400/50 rounded-lg"
                        style={{ boxShadow: `0 0 20px ${neonColors.cyan}30` }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-blue-400 font-bold">WEATHER ALERT</span>
                          <span className="text-xs text-blue-400 uppercase bg-blue-900/50 px-2 py-1 rounded">MONITOR</span>
                        </div>
                        <p className="text-white mb-1 font-bold">Cowboys DST game has weather concerns</p>
                        <p className="text-sm text-gray-400">High winds expected, could boost defensive scoring</p>
                      </div>

                      <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 backdrop-blur-sm border border-purple-400/50 rounded-lg"
                        style={{ boxShadow: `0 0 25px ${neonColors.purple}40` }}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-purple-400 font-bold uppercase">Optimized Projection</span>
                          <span className="text-3xl font-black text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text"
                            style={{ textShadow: `0 0 20px ${neonColors.purple}60` }}>
                            133.4
                          </span>
                        </div>
                        <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-gray-700">
                          <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-full" 
                            style={{ 
                              width: '85%',
                              boxShadow: `0 0 20px ${neonColors.purple}`
                            }}></div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2 font-mono">85% WIN_PROBABILITY VS OPPONENT</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <ArrowPathIcon className="h-8 w-8 text-purple-400 animate-spin mx-auto mb-2" 
                          style={{ filter: `drop-shadow(0 0 10px ${neonColors.purple})` }} />
                        <p className="text-gray-400 font-mono">ANALYZING MATCHUPS AND PROJECTIONS...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Season Trends */}
              <div className="bg-black/60 backdrop-blur-xl rounded-xl p-6 border border-cyan-500/30"
                style={{ boxShadow: `0 0 30px ${neonColors.cyan}20` }}>
                <h3 className="text-xl font-black text-cyan-400 mb-4 uppercase tracking-wider"
                  style={{ textShadow: `0 0 15px ${neonColors.cyan}` }}>
                  SEASON TRENDS
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-900/30 to-transparent backdrop-blur-sm rounded-lg border border-green-400/30">
                    <div className="flex items-center space-x-3">
                      <ArrowTrendingUpIcon className="h-5 w-5 text-green-400" 
                        style={{ filter: `drop-shadow(0 0 5px ${neonColors.green})` }} />
                      <span className="text-white font-bold">Josh Jacobs trending up</span>
                    </div>
                    <span className="text-green-400 text-sm font-mono">+18% USAGE</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-900/30 to-transparent backdrop-blur-sm rounded-lg border border-red-400/30">
                    <div className="flex items-center space-x-3">
                      <ArrowTrendingUpIcon className="h-5 w-5 text-red-400 rotate-180" 
                        style={{ filter: `drop-shadow(0 0 5px ${neonColors.red})` }} />
                      <span className="text-white font-bold">Najee Harris trending down</span>
                    </div>
                    <span className="text-red-400 text-sm font-mono">-22% SNAPS</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-900/30 to-transparent backdrop-blur-sm rounded-lg border border-orange-400/30">
                    <div className="flex items-center space-x-3">
                      <FireIcon className="h-5 w-5 text-orange-400" 
                        style={{ filter: `drop-shadow(0 0 5px ${neonColors.orange})` }} />
                      <span className="text-white font-bold">Puka Nacua hot streak</span>
                    </div>
                    <span className="text-orange-400 text-sm font-mono">4 GAMES 20+</span>
                  </div>
                </div>
              </div>

              {/* Injury Watch */}
              <div className="bg-black/60 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30"
                style={{ boxShadow: `0 0 30px ${neonColors.purple}20` }}>
                <h3 className="text-xl font-black text-purple-400 mb-4 uppercase tracking-wider"
                  style={{ textShadow: `0 0 15px ${neonColors.purple}` }}>
                  INJURY IMPACT ANALYSIS
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gradient-to-r from-red-900/30 to-transparent backdrop-blur-sm border border-red-400/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-bold">A.J. Brown</span>
                      <span className="text-red-400 text-sm font-mono">QUESTIONABLE</span>
                    </div>
                    <p className="text-sm text-gray-400">DeVonta Smith +4.2 projected if Brown sits</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-yellow-900/30 to-transparent backdrop-blur-sm border border-yellow-400/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-bold">Cooper Kupp</span>
                      <span className="text-yellow-400 text-sm font-mono">LIMITED</span>
                    </div>
                    <p className="text-sm text-gray-400">Puka Nacua already WR1, minimal impact</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-green-900/30 to-transparent backdrop-blur-sm border border-green-400/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-bold">Kenneth Walker</span>
                      <span className="text-green-400 text-sm font-mono">CLEARED</span>
                    </div>
                    <p className="text-sm text-gray-400">Full workload expected, Charbonnet back to backup</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Stats Dashboard */}
            <div className="bg-black/60 backdrop-blur-xl rounded-xl p-6 border border-cyan-500/30"
              style={{ boxShadow: `0 0 30px ${neonColors.cyan}20` }}>
              <h3 className="text-xl font-black text-cyan-400 mb-4 uppercase tracking-wider"
                style={{ textShadow: `0 0 15px ${neonColors.cyan}` }}>
                ADVANCED METRICS DASHBOARD
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-lg p-4 border border-gray-600/30">
                  <div className="text-3xl font-black text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text mb-1"
                    style={{ textShadow: `0 0 15px ${neonColors.purple}60` }}>
                    87.3%
                  </div>
                  <div className="text-xs text-gray-400 uppercase font-mono">RZ_EFFICIENCY</div>
                  <div className="text-sm text-gray-300 mt-1">Mahomes Inside 20</div>
                </div>
                <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-lg p-4 border border-gray-600/30">
                  <div className="text-3xl font-black text-transparent bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text mb-1"
                    style={{ textShadow: `0 0 15px ${neonColors.green}60` }}>
                    12.8
                  </div>
                  <div className="text-xs text-gray-400 uppercase font-mono">TARGETS/GAME</div>
                  <div className="text-sm text-gray-300 mt-1">Tyreek Hill Avg</div>
                </div>
                <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-lg p-4 border border-gray-600/30">
                  <div className="text-3xl font-black text-transparent bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text mb-1"
                    style={{ textShadow: `0 0 15px ${neonColors.yellow}60` }}>
                    68.5%
                  </div>
                  <div className="text-xs text-gray-400 uppercase font-mono">SNAP_SHARE</div>
                  <div className="text-sm text-gray-300 mt-1">Breece Hall Week 14</div>
                </div>
                <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-lg p-4 border border-gray-600/30">
                  <div className="text-3xl font-black text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text mb-1"
                    style={{ textShadow: `0 0 15px ${neonColors.cyan}60` }}>
                    5.2
                  </div>
                  <div className="text-xs text-gray-400 uppercase font-mono">YAC_AVERAGE</div>
                  <div className="text-sm text-gray-300 mt-1">Deebo Samuel</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
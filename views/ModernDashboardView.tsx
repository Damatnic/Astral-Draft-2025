/**
 * Modern Dashboard View - Astral Draft
 * Premium fantasy football dashboard with stunning UI/UX
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrophyIcon,
  TrendingUpIcon,
  UsersIcon,
  CalendarIcon,
  BellIcon,
  ChartBarIcon,
  ZapIcon,
  StarIcon,
  FlameIcon,
  ShieldIcon,
  SwordIcon,
  TargetIcon,
  BrainIcon,
  MessageCircleIcon,
  HeartIcon,
  PlayIcon,
  AlertTriangleIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  SearchIcon,
  MoonIcon,
  SunIcon,
  MenuIcon,
  XIcon
} from 'lucide-react';
import { useAppState } from '../contexts/AppContext';
import { netlifyAuth } from '../services/netlifyAuthService';

// Live Score Ticker Component
const LiveScoreTicker: React.FC = () => {
  const [scores, setScores] = useState([
    { team1: 'Thunder', score1: 124.5, team2: 'Lightning', score2: 118.3, live: true },
    { team1: 'Dragons', score1: 142.7, team2: 'Phoenix', score2: 139.2, live: true },
    { team1: 'Titans', score1: 98.4, team2: 'Warriors', score2: 102.1, live: false }
  ]);

  return (
    <div className="glass rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          Live Scores
        </h3>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs text-[var(--text-tertiary)]">LIVE</span>
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide">
        {scores.map((game, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="min-w-[200px] bg-[var(--surface-primary)] rounded-lg p-3"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{game.team1}</span>
              <span className={`text-lg font-bold ${game.score1 > game.score2 ? 'text-green-500' : ''}`}>
                {game.score1}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{game.team2}</span>
              <span className={`text-lg font-bold ${game.score2 > game.score1 ? 'text-green-500' : ''}`}>
                {game.score2}
              </span>
            </div>
            {game.live && (
              <div className="mt-2 flex items-center justify-center">
                <span className="text-xs text-red-500 animate-pulse">Q3 - 4:32</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Stats Card Component with Glassmorphism
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, change, icon, color, subtitle }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="glass rounded-xl p-6 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10 group-hover:bg-opacity-20 transition-all`}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change >= 0 ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
            <span className="text-sm font-medium">{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-2xl font-bold gradient-text">{value}</h3>
        <p className="text-sm text-[var(--text-secondary)]">{title}</p>
        {subtitle && (
          <p className="text-xs text-[var(--text-tertiary)]">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
};

// Player Performance Card
interface PlayerCardProps {
  name: string;
  position: string;
  team: string;
  points: number;
  status: 'healthy' | 'questionable' | 'injured';
  trend: 'up' | 'down' | 'stable';
  imageUrl?: string;
}

const PlayerPerformanceCard: React.FC<PlayerCardProps> = ({
  name, position, team, points, status, trend, imageUrl
}) => {
  const statusColors = {
    healthy: 'text-green-500',
    questionable: 'text-yellow-500',
    injured: 'text-red-500'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-[var(--surface-primary)] rounded-xl p-4 border border-[var(--border-primary)] hover:border-[var(--primary)] transition-all cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-bold">
          {position}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{name}</h4>
            <span className={`text-xs ${statusColors[status]}`}>●</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{team}</p>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold">{points}</span>
            {trend === 'up' && <TrendingUpIcon className="w-4 h-4 text-green-500" />}
            {trend === 'down' && <TrendingUpIcon className="w-4 h-4 text-red-500 rotate-180" />}
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">pts</p>
        </div>
      </div>
    </motion.div>
  );
};

// AI Insights Widget
const AIInsightsWidget: React.FC = () => {
  const [insights] = useState([
    { type: 'trade', message: 'Consider trading Patrick Mahomes - peak value', confidence: 92 },
    { type: 'injury', message: 'Monitor: Cooper Kupp limited in practice', confidence: 78 },
    { type: 'pickup', message: 'Waiver Alert: Tank Bigsby trending up', confidence: 85 }
  ]);

  const typeIcons = {
    trade: <ZapIcon className="w-4 h-4" />,
    injury: <AlertTriangleIcon className="w-4 h-4" />,
    pickup: <PlusIcon className="w-4 h-4" />
  };

  const typeColors = {
    trade: 'bg-blue-500',
    injury: 'bg-red-500',
    pickup: 'bg-green-500'
  };

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BrainIcon className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="font-semibold">AI Insights</h3>
        </div>
        <span className="text-xs text-[var(--text-tertiary)]">Powered by Gemini</span>
      </div>
      
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-3 p-3 bg-[var(--surface-primary)] rounded-lg"
          >
            <div className={`p-2 rounded-lg ${typeColors[insight.type as keyof typeof typeColors]} bg-opacity-10`}>
              {typeIcons[insight.type as keyof typeof typeIcons]}
            </div>
            <div className="flex-1">
              <p className="text-sm">{insight.message}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"
                    style={{ width: `${insight.confidence}%` }}
                  />
                </div>
                <span className="text-xs text-[var(--text-tertiary)]">{insight.confidence}%</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// League Activity Feed
const ActivityFeed: React.FC = () => {
  const [activities] = useState([
    { type: 'trade', user: 'John', action: 'traded Justin Jefferson', time: '2m ago' },
    { type: 'message', user: 'Sarah', action: 'posted in league chat', time: '15m ago' },
    { type: 'waiver', user: 'Mike', action: 'claimed Puka Nacua', time: '1h ago' }
  ]);

  return (
    <div className="bg-[var(--surface-primary)] rounded-xl p-6 border border-[var(--border-primary)]">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <FlameIcon className="w-5 h-5 text-orange-500" />
        League Activity
      </h3>
      
      <div className="space-y-3">
        {activities.map((activity, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]" />
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-medium">{activity.user}</span>{' '}
                <span className="text-[var(--text-secondary)]">{activity.action}</span>
              </p>
            </div>
            <span className="text-xs text-[var(--text-tertiary)]">{activity.time}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Main Dashboard Component
const ModernDashboardView: React.FC = () => {
  const { state, dispatch } = useAppState();
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Apply theme
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors">
      {/* Top Navigation Bar */}
      <nav className="glass sticky top-0 z-50 border-b border-[var(--border-primary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-[var(--surface-hover)]"
              >
                {sidebarOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
              </button>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                  <StarIcon className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl gradient-text">Astral Draft</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-[var(--surface-hover)] relative">
                <SearchIcon className="w-5 h-5" />
              </button>
              
              <button className="p-2 rounded-lg hover:bg-[var(--surface-hover)] relative">
                <BellIcon className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              
              <button className="p-2 rounded-lg hover:bg-[var(--surface-hover)] relative">
                <MessageCircleIcon className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
              </button>
              
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-[var(--surface-hover)]"
              >
                {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button>
              
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-bold cursor-pointer">
                {state.user.name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, <span className="gradient-text">{state.user.name || 'Champion'}</span>
          </h1>
          <p className="text-[var(--text-secondary)]">
            Your teams are performing well this week. Keep the momentum going!
          </p>
        </motion.div>

        {/* Live Score Ticker */}
        <LiveScoreTicker />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Season Points"
            value="1,842.5"
            change={12.3}
            icon={<TrophyIcon className="w-6 h-6 text-yellow-500" />}
            color="bg-yellow-500"
            subtitle="Rank #2 of 12"
          />
          
          <StatsCard
            title="Win Rate"
            value="78.5%"
            change={5.2}
            icon={<ChartBarIcon className="w-6 h-6 text-green-500" />}
            color="bg-green-500"
            subtitle="11-3 Record"
          />
          
          <StatsCard
            title="Active Leagues"
            value="4"
            icon={<UsersIcon className="w-6 h-6 text-blue-500" />}
            color="bg-blue-500"
            subtitle="2 Championships"
          />
          
          <StatsCard
            title="Trade Value"
            value="A+"
            change={8.7}
            icon={<ZapIcon className="w-6 h-6 text-purple-500" />}
            color="bg-purple-500"
            subtitle="Market trending up"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Top Players */}
            <div className="bg-[var(--surface-primary)] rounded-xl p-6 border border-[var(--border-primary)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <StarIcon className="w-5 h-5 text-yellow-500" />
                  Top Performers
                </h3>
                <button className="text-sm text-[var(--primary)] hover:underline">View All</button>
              </div>
              
              <div className="space-y-3">
                <PlayerPerformanceCard
                  name="Josh Allen"
                  position="QB"
                  team="BUF"
                  points={32.8}
                  status="healthy"
                  trend="up"
                />
                <PlayerPerformanceCard
                  name="Tyreek Hill"
                  position="WR"
                  team="MIA"
                  points={28.4}
                  status="healthy"
                  trend="up"
                />
                <PlayerPerformanceCard
                  name="Christian McCaffrey"
                  position="RB"
                  team="SF"
                  points={24.2}
                  status="questionable"
                  trend="down"
                />
              </div>
            </div>

            {/* AI Insights */}
            <AIInsightsWidget />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Activity Feed */}
            <ActivityFeed />
            
            {/* Quick Actions */}
            <div className="bg-[var(--surface-primary)] rounded-xl p-6 border border-[var(--border-primary)]">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="btn btn-primary flex items-center justify-center gap-2">
                  <PlusIcon className="w-4 h-4" />
                  <span>Set Lineup</span>
                </button>
                <button className="btn btn-secondary flex items-center justify-center gap-2">
                  <SearchIcon className="w-4 h-4" />
                  <span>Waivers</span>
                </button>
                <button className="btn btn-secondary flex items-center justify-center gap-2">
                  <ZapIcon className="w-4 h-4" />
                  <span>Trade</span>
                </button>
                <button className="btn btn-secondary flex items-center justify-center gap-2">
                  <MessageCircleIcon className="w-4 h-4" />
                  <span>Chat</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboardView;
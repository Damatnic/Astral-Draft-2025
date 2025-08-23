'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import './CyberSidebar.css';

interface QuickStat {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  icon: string;
}

interface LeagueInfo {
  id: string;
  name: string;
  logo?: string;
  position: number;
  totalTeams: number;
}

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  badge?: number;
  subItems?: {
    path: string;
    label: string;
  }[];
}

interface CyberSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  leagues?: LeagueInfo[];
  currentLeagueId?: string;
  onLeagueChange?: (leagueId: string) => void;
}

export default function CyberSidebar({
  isCollapsed: initialCollapsed = false,
  onToggle,
  leagues = [
    { id: '1', name: 'Quantum League', position: 3, totalTeams: 10 },
    { id: '2', name: 'Cyber Division', position: 1, totalTeams: 12 },
    { id: '3', name: 'Neural Network', position: 5, totalTeams: 8 }
  ],
  currentLeagueId = '1',
  onLeagueChange
}: CyberSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isLeagueSelectorOpen, setIsLeagueSelectorOpen] = useState(false);
  const [quickStats, setQuickStats] = useState<QuickStat[]>([
    { label: 'Points', value: '1,247', trend: 'up', icon: '📊' },
    { label: 'Rank', value: '3rd', trend: 'up', icon: '🏆' },
    { label: 'Win %', value: '67%', trend: 'neutral', icon: '📈' },
    { label: 'Trades', value: 5, icon: '🔄' }
  ]);
  const [pulseActive, setPulseActive] = useState(false);

  const menuItems: MenuItem[] = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: '🏠'
    },
    {
      path: '/team',
      label: 'My Team',
      icon: '⚡',
      subItems: [
        { path: '/team/roster', label: 'Roster' },
        { path: '/team/lineup', label: 'Lineup' },
        { path: '/team/schedule', label: 'Schedule' }
      ]
    },
    {
      path: '/players',
      label: 'Players',
      icon: '👥',
      badge: 3
    },
    {
      path: '/trades',
      label: 'Trades',
      icon: '🔄',
      badge: 2
    },
    {
      path: '/waivers',
      label: 'Waivers',
      icon: '📋'
    },
    {
      path: '/standings',
      label: 'Standings',
      icon: '📊'
    },
    {
      path: '/oracle',
      label: 'Oracle AI',
      icon: '🤖'
    },
    {
      path: '/fantasycast',
      label: 'FantasyCast',
      icon: '📺'
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: '⚙️'
    }
  ];

  useEffect(() => {
    // Pulse effect interval
    const pulseInterval = setInterval(() => {
      setPulseActive(true);
      setTimeout(() => setPulseActive(false), 1000);
    }, 5000);

    return () => clearInterval(pulseInterval);
  }, []);

  const handleToggle = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    if (onToggle) {
      onToggle();
    }
  };

  const toggleExpanded = (path: string) => {
    setExpandedItems(prev =>
      prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  const handleLeagueSelect = (leagueId: string) => {
    if (onLeagueChange) {
      onLeagueChange(leagueId);
    }
    setIsLeagueSelectorOpen(false);
  };

  const currentLeague = leagues.find(l => l.id === currentLeagueId) || leagues[0];

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  const getTrendClass = (trend?: string) => {
    switch (trend) {
      case 'up': return 'trend-up';
      case 'down': return 'trend-down';
      default: return 'trend-neutral';
    }
  };

  return (
    <aside className={`cyber-sidebar ${isCollapsed ? 'collapsed' : ''} ${pulseActive ? 'pulse-active' : ''}`}>
      {/* Background Effects */}
      <div className="sidebar-background">
        <div className="sidebar-grid"></div>
        <div className="sidebar-glow"></div>
        <div className="scan-line"></div>
      </div>

      {/* Toggle Button */}
      <button className="sidebar-toggle" onClick={handleToggle}>
        <div className="toggle-icon">
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
        </div>
      </button>

      {/* Sidebar Content */}
      <div className="sidebar-content">
        {/* League Selector */}
        <div className="league-selector-container">
          <button
            className="league-selector"
            onClick={() => setIsLeagueSelectorOpen(!isLeagueSelectorOpen)}
          >
            <div className="league-icon">🏆</div>
            {!isCollapsed && (
              <>
                <div className="league-info">
                  <div className="league-name">{currentLeague.name}</div>
                  <div className="league-position">
                    Position: {currentLeague.position}/{currentLeague.totalTeams}
                  </div>
                </div>
                <svg className="selector-arrow" viewBox="0 0 12 8" fill="none">
                  <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </>
            )}
          </button>

          {/* League Dropdown */}
          {isLeagueSelectorOpen && !isCollapsed && (
            <div className="league-dropdown">
              {leagues.map(league => (
                <button
                  key={league.id}
                  className={`league-option ${league.id === currentLeagueId ? 'active' : ''}`}
                  onClick={() => handleLeagueSelect(league.id)}
                >
                  <span className="league-option-icon">🏆</span>
                  <div className="league-option-info">
                    <div className="league-option-name">{league.name}</div>
                    <div className="league-option-position">
                      Position: {league.position}/{league.totalTeams}
                    </div>
                  </div>
                  {league.id === currentLeagueId && (
                    <div className="active-indicator"></div>
                  )}
                </button>
              ))}
              <Link href="/leagues/join" className="league-action">
                <span className="action-icon">➕</span>
                <span className="action-text">Join New League</span>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {!isCollapsed && (
          <div className="quick-stats">
            <div className="stats-header">
              <span className="stats-title">QUICK STATS</span>
              <div className="stats-pulse"></div>
            </div>
            <div className="stats-grid">
              {quickStats.map((stat, index) => (
                <div key={index} className="stat-item">
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-content">
                    <div className="stat-value">
                      {stat.value}
                      {stat.trend && (
                        <span className={`stat-trend ${getTrendClass(stat.trend)}`}>
                          {getTrendIcon(stat.trend)}
                        </span>
                      )}
                    </div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <div key={item.path} className="nav-item-container">
              {item.subItems ? (
                <>
                  <button
                    className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => toggleExpanded(item.path)}
                  >
                    <span className="nav-item-icon">{item.icon}</span>
                    {!isCollapsed && (
                      <>
                        <span className="nav-item-label">{item.label}</span>
                        <svg 
                          className={`expand-arrow ${expandedItems.includes(item.path) ? 'expanded' : ''}`} 
                          viewBox="0 0 12 8" 
                          fill="none"
                        >
                          <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </>
                    )}
                    {item.badge && (
                      <div className="nav-item-badge">{item.badge}</div>
                    )}
                    {isActive(item.path) && <div className="active-glow"></div>}
                  </button>
                  {!isCollapsed && expandedItems.includes(item.path) && (
                    <div className="sub-menu">
                      {item.subItems.map(subItem => (
                        <Link
                          key={subItem.path}
                          href={subItem.path}
                          className={`sub-menu-item ${isActive(subItem.path) ? 'active' : ''}`}
                        >
                          <span className="sub-item-indicator"></span>
                          <span className="sub-item-label">{subItem.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.path}
                  className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="nav-item-label">{item.label}</span>
                  )}
                  {item.badge && (
                    <div className="nav-item-badge">{item.badge}</div>
                  )}
                  {isActive(item.path) && <div className="active-glow"></div>}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Footer Actions */}
        {!isCollapsed && (
          <div className="sidebar-footer">
            <button className="footer-action help">
              <span className="action-icon">💡</span>
              <span className="action-text">Help & Support</span>
            </button>
            <button className="footer-action logout">
              <span className="action-icon">🚪</span>
              <span className="action-text">Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Collapsed State Tooltip */}
      {isCollapsed && (
        <div className="collapsed-tooltips">
          {menuItems.map((item) => (
            <div key={item.path} className="tooltip-trigger">
              <div className="tooltip-content">{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Neon Border Effects */}
      <div className="sidebar-border-top"></div>
      <div className="sidebar-border-bottom"></div>
    </aside>
  );
}
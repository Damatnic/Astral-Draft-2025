'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import CyberNav from '@/components/layout/CyberNav';
import CyberSidebar from '@/components/layout/CyberSidebar';
import './layout.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentLeagueId, setCurrentLeagueId] = useState('1');
  const [isLoading, setIsLoading] = useState(true);
  const [glitchActive, setGlitchActive] = useState(false);

  useEffect(() => {
    // Initial loading animation
    const loadTimer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    // Periodic glitch effect
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 150);
    }, 15000);

    return () => {
      clearTimeout(loadTimer);
      clearInterval(glitchInterval);
    };
  }, []);

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleLeagueChange = (leagueId: string) => {
    setCurrentLeagueId(leagueId);
  };

  return (
    <div className={`dashboard-layout ${isLoading ? 'loading' : ''} ${glitchActive ? 'glitch-active' : ''}`}>
      {/* Cyberpunk Background Effects */}
      <div className="cyber-background">
        {/* Animated Grid Pattern */}
        <div className="cyber-grid">
          <div className="grid-lines horizontal"></div>
          <div className="grid-lines vertical"></div>
        </div>

        {/* Scanning Lines */}
        <div className="scan-lines">
          <div className="scan-line scan-line-1"></div>
          <div className="scan-line scan-line-2"></div>
        </div>

        {/* Particle Effects */}
        <div className="particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`particle particle-${i + 1}`}></div>
          ))}
        </div>

        {/* Neon Glow Orbs */}
        <div className="neon-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>

        {/* Matrix Rain Effect */}
        <div className="matrix-rain">
          {[...Array(15)].map((_, i) => (
            <div key={i} className={`rain-column column-${i + 1}`}>
              <span className="rain-text">01101000</span>
            </div>
          ))}
        </div>

        {/* Holographic Overlay */}
        <div className="holographic-overlay"></div>

        {/* Corner Frames */}
        <div className="corner-frame top-left">
          <svg viewBox="0 0 100 100">
            <path d="M0,20 L0,0 L20,0" stroke="var(--neon-cyan)" strokeWidth="2" fill="none" />
            <path d="M0,10 L10,0" stroke="var(--neon-cyan)" strokeWidth="1" fill="none" opacity="0.5" />
          </svg>
        </div>
        <div className="corner-frame top-right">
          <svg viewBox="0 0 100 100">
            <path d="M80,0 L100,0 L100,20" stroke="var(--neon-cyan)" strokeWidth="2" fill="none" />
            <path d="M90,0 L100,10" stroke="var(--neon-cyan)" strokeWidth="1" fill="none" opacity="0.5" />
          </svg>
        </div>
        <div className="corner-frame bottom-left">
          <svg viewBox="0 0 100 100">
            <path d="M0,80 L0,100 L20,100" stroke="var(--neon-pink)" strokeWidth="2" fill="none" />
            <path d="M0,90 L10,100" stroke="var(--neon-pink)" strokeWidth="1" fill="none" opacity="0.5" />
          </svg>
        </div>
        <div className="corner-frame bottom-right">
          <svg viewBox="0 0 100 100">
            <path d="M80,100 L100,100 L100,80" stroke="var(--neon-pink)" strokeWidth="2" fill="none" />
            <path d="M90,100 L100,90" stroke="var(--neon-pink)" strokeWidth="1" fill="none" opacity="0.5" />
          </svg>
        </div>
      </div>

      {/* Navigation */}
      <CyberNav 
        userName="Cyber Manager"
        teamName="Neural Knights"
        leagueName={currentLeagueId === '1' ? 'Quantum League' : currentLeagueId === '2' ? 'Cyber Division' : 'Neural Network'}
      />

      {/* Main Layout Container */}
      <div className={`dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Sidebar */}
        <CyberSidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={handleSidebarToggle}
          currentLeagueId={currentLeagueId}
          onLeagueChange={handleLeagueChange}
        />

        {/* Main Content Area */}
        <main className="dashboard-main">
          <div className="content-wrapper">
            {/* Page Transition Effect */}
            <div className="page-transition">
              <div className="transition-line"></div>
            </div>

            {/* Breadcrumb with Cyber Style */}
            <div className="cyber-breadcrumb">
              <div className="breadcrumb-glow"></div>
              <div className="breadcrumb-content">
                <span className="breadcrumb-icon">📍</span>
                <span className="breadcrumb-path">{pathname}</span>
              </div>
            </div>

            {/* Main Content */}
            <div className="dashboard-content">
              {isLoading ? (
                <div className="loading-container">
                  <div className="cyber-loader">
                    <div className="loader-ring"></div>
                    <div className="loader-ring"></div>
                    <div className="loader-ring"></div>
                    <div className="loader-text">INITIALIZING...</div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Content Header Effect */}
                  <div className="content-header-effect">
                    <div className="header-scan"></div>
                    <div className="header-glitch"></div>
                  </div>

                  {/* Actual Page Content */}
                  <div className="page-content">
                    {children}
                  </div>

                  {/* Content Footer Effect */}
                  <div className="content-footer-effect">
                    <div className="footer-pulse"></div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Floating Action Buttons */}
          <div className="floating-actions">
            <button className="fab-button primary">
              <span className="fab-icon">⚡</span>
              <div className="fab-glow"></div>
            </button>
            <button className="fab-button secondary">
              <span className="fab-icon">🎯</span>
              <div className="fab-glow"></div>
            </button>
          </div>
        </main>
      </div>

      {/* System Status Bar */}
      <div className="system-status-bar">
        <div className="status-item">
          <span className="status-icon">🟢</span>
          <span className="status-text">SYSTEM ONLINE</span>
        </div>
        <div className="status-item">
          <span className="status-icon">⚡</span>
          <span className="status-text">REAL-TIME SYNC</span>
        </div>
        <div className="status-item">
          <span className="status-icon">🔒</span>
          <span className="status-text">SECURE CONNECTION</span>
        </div>
        <div className="status-time">
          {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Glitch Overlay Effect */}
      {glitchActive && (
        <div className="glitch-overlay">
          <div className="glitch-slice"></div>
          <div className="glitch-slice"></div>
          <div className="glitch-slice"></div>
        </div>
      )}
    </div>
  );
}
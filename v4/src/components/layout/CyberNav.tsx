'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import './CyberNav.css';

interface NotificationItem {
  id: string;
  type: 'trade' | 'waiver' | 'injury' | 'score' | 'message';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface CyberNavProps {
  userName?: string;
  userAvatar?: string;
  teamName?: string;
  leagueName?: string;
}

export default function CyberNav({ 
  userName = 'Cyber Manager',
  userAvatar = '/avatar-placeholder.png',
  teamName = 'Neural Knights',
  leagueName = 'Quantum League'
}: CyberNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      type: 'trade',
      title: 'Trade Offer',
      message: 'New trade proposal from Digital Dynasty',
      time: '5m ago',
      read: false
    },
    {
      id: '2',
      type: 'injury',
      title: 'Injury Alert',
      message: 'Player status update: J. Jefferson questionable',
      time: '1h ago',
      read: false
    },
    {
      id: '3',
      type: 'score',
      title: 'Score Update',
      message: 'Your team is winning 112-98',
      time: '2h ago',
      read: true
    }
  ]);
  const [glitchActive, setGlitchActive] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Navigation items
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/leagues', label: 'Leagues', icon: '🏆' },
    { path: '/team', label: 'My Team', icon: '⚡' },
    { path: '/players', label: 'Players', icon: '👥' },
    { path: '/trades', label: 'Trades', icon: '🔄' },
    { path: '/oracle', label: 'Oracle AI', icon: '🤖' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    // Trigger glitch effect periodically
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 10000);

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
      clearInterval(glitchInterval);
    };
  }, []);

  const handleNotificationClick = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'trade': return '🔄';
      case 'waiver': return '📋';
      case 'injury': return '🏥';
      case 'score': return '📊';
      case 'message': return '💬';
      default: return '📢';
    }
  };

  return (
    <>
      {/* Main Navigation Bar */}
      <nav className={`cyber-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-background">
          <div className="nav-grid"></div>
          <div className="nav-scan-line"></div>
        </div>

        <div className="nav-container">
          {/* Logo Section */}
          <div className="nav-logo">
            <Link href="/dashboard" className={`logo-link ${glitchActive ? 'glitch' : ''}`}>
              <div className="logo-hexagon">
                <svg className="logo-svg" viewBox="0 0 60 60">
                  <defs>
                    <linearGradient id="navLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00ffff" />
                      <stop offset="50%" stopColor="#ff00ff" />
                      <stop offset="100%" stopColor="#00ff88" />
                    </linearGradient>
                  </defs>
                  <polygon points="30,5 50,15 50,45 30,55 10,45 10,15" 
                           fill="none" 
                           stroke="url(#navLogoGradient)" 
                           strokeWidth="2" />
                  <text x="30" y="35" textAnchor="middle" 
                        className="logo-text" 
                        fill="url(#navLogoGradient)">AD</text>
                </svg>
              </div>
              <span className="logo-title" data-text="ASTRAL DRAFT">
                ASTRAL DRAFT
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="nav-menu desktop-menu">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`nav-item ${pathname === item.path ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {pathname === item.path && <div className="nav-active-line"></div>}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="nav-right">
            {/* Notifications */}
            <div className="notification-wrapper" ref={notificationRef}>
              <button
                className="notification-button"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              >
                <div className="notification-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C10.9 2 10 2.9 10 4C10 4.1 10 4.2 10 4.3L10 8L6 10V18H18V10L14 8V4.3C14 4.2 14 4.1 14 4C14 2.9 13.1 2 12 2Z" 
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 18V19C9 20.7 10.3 22 12 22C13.7 22 15 20.7 15 19V18" 
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {unreadCount > 0 && (
                    <div className="notification-badge">
                      <span>{unreadCount}</span>
                      <div className="badge-pulse"></div>
                    </div>
                  )}
                </div>
              </button>

              {/* Notifications Dropdown */}
              {isNotificationOpen && (
                <div className="dropdown-menu notifications-dropdown">
                  <div className="dropdown-header">
                    <span className="dropdown-title">NOTIFICATIONS</span>
                    <button className="mark-all-read">Mark all read</button>
                  </div>
                  <div className="dropdown-content">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`notification-item ${!notif.read ? 'unread' : ''}`}
                          onClick={() => handleNotificationClick(notif.id)}
                        >
                          <div className="notif-icon">{getNotificationIcon(notif.type)}</div>
                          <div className="notif-content">
                            <div className="notif-title">{notif.title}</div>
                            <div className="notif-message">{notif.message}</div>
                            <div className="notif-time">{notif.time}</div>
                          </div>
                          {!notif.read && <div className="notif-unread-dot"></div>}
                        </div>
                      ))
                    ) : (
                      <div className="empty-notifications">
                        <span className="empty-icon">📭</span>
                        <span className="empty-text">No notifications</span>
                      </div>
                    )}
                  </div>
                  <div className="dropdown-footer">
                    <Link href="/notifications" className="view-all-link">
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="profile-wrapper" ref={profileRef}>
              <button
                className="profile-button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="avatar-container">
                  <div className="avatar-glow"></div>
                  <div className="avatar-border"></div>
                  <Image
                    src={userAvatar}
                    alt={userName}
                    width={40}
                    height={40}
                    className="avatar-image"
                  />
                  <div className="avatar-status"></div>
                </div>
                <div className="profile-info">
                  <span className="user-name">{userName}</span>
                  <span className="team-name">{teamName}</span>
                </div>
                <svg className="dropdown-arrow" viewBox="0 0 12 8" fill="none">
                  <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="dropdown-menu profile-dropdown">
                  <div className="dropdown-header">
                    <div className="profile-detail">
                      <div className="detail-label">TEAM</div>
                      <div className="detail-value">{teamName}</div>
                    </div>
                    <div className="profile-detail">
                      <div className="detail-label">LEAGUE</div>
                      <div className="detail-value">{leagueName}</div>
                    </div>
                  </div>
                  <div className="dropdown-content">
                    <Link href="/profile" className="dropdown-item">
                      <span className="item-icon">👤</span>
                      <span className="item-label">My Profile</span>
                    </Link>
                    <Link href="/settings" className="dropdown-item">
                      <span className="item-icon">⚙️</span>
                      <span className="item-label">Settings</span>
                    </Link>
                    <Link href="/leagues/create" className="dropdown-item">
                      <span className="item-icon">➕</span>
                      <span className="item-label">Create League</span>
                    </Link>
                    <Link href="/leagues/join" className="dropdown-item">
                      <span className="item-icon">🎯</span>
                      <span className="item-label">Join League</span>
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item logout">
                      <span className="item-icon">🚪</span>
                      <span className="item-label">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <div className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
          </div>
        </div>

        {/* Neon underline effect */}
        <div className="nav-neon-line"></div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-content">
          <div className="mobile-menu-header">
            <div className="mobile-user-info">
              <Image
                src={userAvatar}
                alt={userName}
                width={60}
                height={60}
                className="mobile-avatar"
              />
              <div className="mobile-user-details">
                <div className="mobile-user-name">{userName}</div>
                <div className="mobile-team-name">{teamName}</div>
              </div>
            </div>
          </div>

          <nav className="mobile-nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`mobile-nav-item ${pathname === item.path ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="mobile-nav-icon">{item.icon}</span>
                <span className="mobile-nav-label">{item.label}</span>
                {pathname === item.path && <div className="mobile-active-indicator"></div>}
              </Link>
            ))}
          </nav>

          <div className="mobile-menu-footer">
            <Link href="/settings" className="mobile-footer-link">
              <span>⚙️</span> Settings
            </Link>
            <button className="mobile-logout">
              <span>🚪</span> Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
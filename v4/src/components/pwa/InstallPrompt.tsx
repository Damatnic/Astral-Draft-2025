/**
 * PWA Install Prompt Component (Phase 11.5)
 * Smart install prompt that appears at the right time with proper UX
 */

import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { usePWAInstall } from '../../hooks/usePWA';
import { DownloadIcon, XIcon, SmartphoneIcon, MonitorIcon, ZapIcon } from 'lucide-react';

interface InstallPromptProps {
  className?: string;
  autoShow?: boolean;
  showDelay?: number;
  theme?: 'minimal' | 'detailed' | 'banner';
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({
  className,
  autoShow = true,
  showDelay = 3000,
  theme = 'detailed'
}) => {
  const { canInstall, installApp } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setIsDismissed(true);
        return;
      }
    }

    // Auto-show after delay if enabled
    if (autoShow && canInstall && !isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, showDelay);

      return () => clearTimeout(timer);
    }
    
    return undefined;
  }, [canInstall, autoShow, showDelay, isDismissed]);

  // Don't render if can't install or was dismissed
  if (!canInstall || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    const success = await installApp();
    
    if (success) {
      setIsVisible(false);
    } else {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleRemindLater = () => {
    setIsVisible(false);
    // Don't set localStorage, so it can show again in the same session
  };

  if (theme === 'minimal') {
    return (
      <div className={cn(
        'fixed bottom-4 right-4 z-50 transition-all duration-300',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0',
        className
      )}>
        <div className="glass-card p-3 flex items-center space-x-3 max-w-xs">
          <DownloadIcon className="w-5 h-5 text-astral-purple-400" />
          <span className="text-sm text-white">Install App</span>
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="btn-primary btn-sm"
          >
            {isInstalling ? '...' : 'Install'}
          </button>
          <button
            onClick={handleDismiss}
            className="text-astral-purple-400 hover:text-white p-1"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (theme === 'banner') {
    return (
      <div className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isVisible ? 'translate-y-0' : '-translate-y-full',
        className
      )}>
        <div className="bg-gradient-to-r from-astral-purple-600 to-astral-neon-blue p-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SmartphoneIcon className="w-6 h-6 text-white" />
              <div>
                <h3 className="text-white font-semibold">Install Astral Draft</h3>
                <p className="text-white/80 text-sm">Get the full app experience</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="bg-white text-astral-purple-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-white/90 transition-colors"
              >
                {isInstalling ? 'Installing...' : 'Install'}
              </button>
              <button
                onClick={handleDismiss}
                className="text-white/80 hover:text-white p-2"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Detailed theme (default)
  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300',
      isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
      className
    )}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleRemindLater}
      />
      
      {/* Modal */}
      <div className="relative glass-card p-8 max-w-md w-full mx-auto">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-astral-purple-400 hover:text-white transition-colors"
        >
          <XIcon className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-astral-purple-500 to-astral-neon-cyan rounded-2xl flex items-center justify-center mx-auto mb-4">
            <DownloadIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Install Astral Draft</h2>
          <p className="text-astral-purple-300">
            Get the best fantasy football experience with our native app
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <ZapIcon className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h4 className="text-white font-medium">Lightning Fast</h4>
              <p className="text-astral-purple-300 text-sm">Instant loading and smooth performance</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
              <SmartphoneIcon className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h4 className="text-white font-medium">Works Offline</h4>
              <p className="text-astral-purple-300 text-sm">Access your team even without internet</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
              <MonitorIcon className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h4 className="text-white font-medium">Native Experience</h4>
              <p className="text-astral-purple-300 text-sm">Full-screen app with push notifications</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="w-full btn-primary py-3"
          >
            {isInstalling ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Installing...
              </>
            ) : (
              <>
                <DownloadIcon className="w-4 h-4 mr-2" />
                Install App
              </>
            )}
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={handleRemindLater}
              className="flex-1 btn-secondary py-2 text-sm"
            >
              Maybe Later
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 btn-ghost py-2 text-sm"
            >
              No Thanks
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-astral-purple-400 mt-4">
          You can always install later from your browser menu
        </p>
      </div>
    </div>
  );
};

// Quick install button for header/navbar
export const QuickInstallButton: React.FC<{ className?: string }> = ({ className }) => {
  const { canInstall, installApp } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);

  if (!canInstall) return null;

  const handleInstall = async () => {
    setIsInstalling(true);
    await installApp();
    setIsInstalling(false);
  };

  return (
    <button
      onClick={handleInstall}
      disabled={isInstalling}
      className={cn(
        'flex items-center space-x-2 px-3 py-2 rounded-lg bg-astral-purple-500/20 text-astral-purple-300 hover:bg-astral-purple-500/30 hover:text-white transition-colors text-sm',
        className
      )}
    >
      <DownloadIcon className="w-4 h-4" />
      <span>{isInstalling ? 'Installing...' : 'Install App'}</span>
    </button>
  );
};

// Install reminder that shows after user engagement
export const InstallReminder: React.FC = () => {
  const { canInstall } = usePWAInstall();
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    if (!canInstall) return;

    const engagementScore = 0;
    let activityCount = 0;

    const trackActivity = () => {
      activityCount++;
      
      // Show reminder after significant engagement
      if (activityCount > 10 && !localStorage.getItem('pwa-install-dismissed')) {
        setShowReminder(true);
      }
    };

    const events = ['click', 'scroll', 'keypress'];
    events.forEach(event => {
      document.addEventListener(event, trackActivity);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity);
      });
    };
  }, [canInstall]);

  if (!showReminder) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-80 z-40">
      <InstallPrompt 
        theme="minimal" 
        autoShow={false}
      />
    </div>
  );
};

export default InstallPrompt;
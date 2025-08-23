/**
 * PWA Install Prompt Component
 * Handles PWA installation prompts and provides fallback for iOS
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Plus, Smartphone } from 'lucide-react';

interface Props {
  onInstall?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const PWAInstallPrompt: React.FC<Props> = ({ 
  onInstall, 
  onDismiss,
  className = ''
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode
    const checkStandalone = () => {
      return window.matchMedia('(display-mode: standalone)').matches ||
             (window.navigator as any).standalone ||
             document.referrer.includes('android-app://');
    };

    // Check if iOS device
    const checkIOS = () => {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
             (navigator.userAgent.includes('Mac') && navigator.maxTouchPoints > 1);
    };

    setIsIOS(checkIOS());
    setIsStandalone(checkStandalone());

    // Don't show prompt if already installed
    if (checkStandalone()) {
      return;
    }

    // Check if user has already dismissed the prompt
    const hasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (hasDismissed) {
      return;
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show prompt after a delay if not dismissed
    if (checkIOS() && !hasDismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000); // Show after 3 seconds

      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA: User accepted the install prompt');
      onInstall?.();
    } else {
      console.log('PWA: User dismissed the install prompt');
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    onDismiss?.();
  };

  // Don't render if already installed or no prompt available
  if (isStandalone || (!showPrompt && !showIOSInstructions)) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          className={`
            fixed bottom-20 left-4 right-4 z-50
            bg-gray-800/95 backdrop-blur-sm
            border border-gray-700 rounded-xl
            p-4 shadow-2xl
            ${className}
          `}
          style={{ 
            marginBottom: 'env(safe-area-inset-bottom)'
          }}
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm">
                Install Astral Draft
              </h3>
              <p className="text-gray-300 text-xs mt-1 leading-relaxed">
                Add to your home screen for faster access and offline support
              </p>
              
              <div className="flex items-center space-x-3 mt-3">
                <motion.button
                  onClick={handleInstallClick}
                  className="
                    flex items-center space-x-2 px-4 py-2
                    bg-blue-500 hover:bg-blue-600
                    text-white text-sm font-medium rounded-lg
                    min-h-[44px] transition-colors
                  "
                  whileTap={{ scale: 0.95 }}
                >
                  <Download className="w-4 h-4" />
                  <span>Install</span>
                </motion.button>
                
                <motion.button
                  onClick={handleDismiss}
                  className="
                    px-4 py-2 text-gray-400 hover:text-white
                    text-sm font-medium min-h-[44px] transition-colors
                  "
                  whileTap={{ scale: 0.95 }}
                >
                  Maybe Later
                </motion.button>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="
                p-2 text-gray-400 hover:text-white
                rounded-lg hover:bg-white/5 transition-colors
                min-h-[44px] min-w-[44px] flex items-center justify-center
              "
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* iOS Installation Instructions */}
      {showIOSInstructions && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="
              bg-gray-800 rounded-xl p-6 max-w-sm w-full
              border border-gray-700
            "
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Share className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-white font-semibold text-lg mb-2">
                Install Astral Draft
              </h3>
              
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                To install this app on your iPhone:
              </p>
              
              <div className="space-y-3 text-left">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div className="text-sm text-gray-300">
                    Tap the <Share className="inline w-4 h-4 mx-1" /> share button in Safari
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div className="text-sm text-gray-300">
                    Scroll down and tap <Plus className="inline w-4 h-4 mx-1" /> "Add to Home Screen"
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <div className="text-sm text-gray-300">
                    Tap "Add" to install the app
                  </div>
                </div>
              </div>
              
              <motion.button
                onClick={handleDismiss}
                className="
                  w-full mt-6 px-4 py-3 bg-blue-500 hover:bg-blue-600
                  text-white font-medium rounded-lg transition-colors
                  min-h-[44px]
                "
                whileTap={{ scale: 0.95 }}
              >
                Got it!
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;

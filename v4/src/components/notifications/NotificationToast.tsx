"use client";

import React, { useState, useEffect } from 'react';
import { X, Bell, CheckCircle, AlertTriangle, XCircle, Info, Zap } from 'lucide-react';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'urgent';
  title: string;
  message: string;
  duration?: number; // in milliseconds, 0 for persistent
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}

interface NotificationToastProps {
  notification: ToastNotification;
  onDismiss: (id: string) => void;
  position: number; // 0-based position from bottom
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  position,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [notification.duration]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(notification.id);
      notification.onDismiss?.();
    }, 300);
  };

  const getIcon = () => {
    const iconClass = "w-5 h-5 flex-shrink-0";
    
    switch (notification.type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-400`} />;
      case 'error':
        return <XCircle className={`${iconClass} text-red-400`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-400`} />;
      case 'urgent':
        return <Zap className={`${iconClass} text-red-400`} />;
      default:
        return <Info className={`${iconClass} text-blue-400`} />;
    }
  };

  const getTypeStyles = () => {
    switch (notification.type) {
      case 'success':
        return {
          bg: 'bg-green-900/90 border-green-500/50',
          accent: 'border-l-green-400',
        };
      case 'error':
        return {
          bg: 'bg-red-900/90 border-red-500/50',
          accent: 'border-l-red-400',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-900/90 border-yellow-500/50',
          accent: 'border-l-yellow-400',
        };
      case 'urgent':
        return {
          bg: 'bg-red-900/90 border-red-500/50',
          accent: 'border-l-red-400',
        };
      default:
        return {
          bg: 'bg-blue-900/90 border-blue-500/50',
          accent: 'border-l-blue-400',
        };
    }
  };

  const styles = getTypeStyles();
  const bottomOffset = position * 80 + 16; // 80px per toast + 16px base margin

  return (
    <div
      className={`fixed right-4 z-50 transform transition-all duration-300 ease-out ${
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}
      style={{ bottom: `${bottomOffset}px` }}
    >
      <div
        className={`
          max-w-sm w-full backdrop-blur-md border border-l-4 rounded-lg shadow-2xl
          ${styles.bg} ${styles.accent}
          ${notification.type === 'urgent' ? 'animate-pulse' : ''}
        `}
      >
        <div className="p-4">
          <div className="flex items-start space-x-3">
            {/* Icon */}
            {getIcon()}
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white mb-1">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-300 leading-relaxed">
                {notification.message}
              </p>
              
              {/* Action button */}
              {notification.action && (
                <button
                  onClick={() => {
                    notification.action?.onClick();
                    handleDismiss();
                  }}
                  className="mt-3 text-sm font-medium text-purple-300 hover:text-purple-200 transition-colors"
                >
                  {notification.action.label} →
                </button>
              )}
            </div>
            
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Progress bar for timed notifications */}
        {notification.duration && notification.duration > 0 && (
          <div className="h-1 bg-gray-700 rounded-b-lg overflow-hidden">
            <div
              className={`h-full transition-all ease-linear ${
                notification.type === 'success' ? 'bg-green-400' :
                notification.type === 'error' ? 'bg-red-400' :
                notification.type === 'warning' ? 'bg-yellow-400' :
                notification.type === 'urgent' ? 'bg-red-400' :
                'bg-blue-400'
              }`}
              style={{
                animation: `shrink ${notification.duration}ms linear`,
              }}
            />
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

// Toast Manager Component
interface ToastManagerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const ToastManager: React.FC<ToastManagerProps> = ({
  toasts,
  onDismiss,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {toasts.map((toast, index) => (
        <NotificationToast
          key={toast.id}
          notification={toast}
          onDismiss={onDismiss}
          position={index}
        />
      ))}
    </div>
  );
};

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (toast: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastNotification = {
      ...toast,
      id,
      duration: toast.duration ?? 5000, // Default 5 seconds
    };
    
    setToasts(prev => [...prev, newToast]);
    
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  // Convenience methods
  const toast = {
    success: (title: string, message: string, options?: Partial<ToastNotification>) =>
      addToast({ type: 'success', title, message, ...options }),
    
    error: (title: string, message: string, options?: Partial<ToastNotification>) =>
      addToast({ type: 'error', title, message, duration: 0, ...options }),
    
    warning: (title: string, message: string, options?: Partial<ToastNotification>) =>
      addToast({ type: 'warning', title, message, ...options }),
    
    info: (title: string, message: string, options?: Partial<ToastNotification>) =>
      addToast({ type: 'info', title, message, ...options }),
    
    urgent: (title: string, message: string, options?: Partial<ToastNotification>) =>
      addToast({ type: 'urgent', title, message, duration: 0, ...options }),
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    toast,
  };
};

export default NotificationToast;
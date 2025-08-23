/**
 * Accessible Modal Component
 * Enhanced with focus management, keyboard navigation, and mobile accessibility
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useFocusTrap, 
  useAnnouncer, 
  getModalA11yProps,
  srOnlyClasses
} from '../../utils/accessibility';
import { CloseIcon } from '../icons/CloseIcon';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  initialFocus?: string; // selector for element to focus initially
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md', 
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full'
};

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = '',
  size = 'md',
  closeOnEscape = true,
  closeOnOverlayClick = true,
  showCloseButton = true,
  initialFocus
}) => {
  const { containerRef } = useFocusTrap(isOpen);
  const { announce } = useAnnouncer();
  const titleId = React.useId();
  const descriptionId = React.useId();

  // Handle escape key and focus trap escape
  React.useEffect(() => {
    if (!isOpen) return;

    const handleCustomEscape = (e: CustomEvent) => {
      if (closeOnEscape) {
        onClose();
        announce('Modal closed', 'polite');
      }
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('focustrap:escape', handleCustomEscape as EventListener);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('focustrap:escape', handleCustomEscape as EventListener);
      }
    };
  }, [isOpen, closeOnEscape, onClose, announce, containerRef]);

  // Announce modal opening
  React.useEffect(() => {
    if (isOpen) {
      announce(`${title} dialog opened`, 'assertive');
    }
  }, [isOpen, title, announce]);

  // Handle initial focus
  React.useEffect(() => {
    if (isOpen && initialFocus && containerRef.current) {
      const element = containerRef.current.querySelector(initialFocus);
      if (element && element instanceof HTMLElement) {
        setTimeout(() => element.focus(), 100);
      }
    }
  }, [isOpen, initialFocus, containerRef]);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
      announce('Modal closed', 'polite');
    }
  };

  const handleCloseClick = () => {
    onClose();
    announce('Modal closed', 'polite');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleOverlayClick}
            aria-hidden="true"
          />
          
          {/* Modal Content */}
          <motion.div
            ref={containerRef as React.RefObject<HTMLDivElement>}
            className={`
              relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden
              bg-white dark:bg-gray-800 rounded-xl shadow-2xl
              border border-gray-200 dark:border-gray-700
              ${className}
            `}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            {...getModalA11yProps(isOpen, titleId, description ? descriptionId : undefined)}
          >
            {/* Screen reader only close instruction */}
            <div className={srOnlyClasses}>
              Press Escape to close this dialog
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 
                id={titleId}
                className="text-xl font-semibold text-gray-900 dark:text-white font-display"
              >
                {title}
              </h2>
              
              {showCloseButton && (
                <button
                  onClick={handleCloseClick}
                  className="
                    mobile-touch-target p-2 -mr-2 text-gray-400 hover:text-gray-600 
                    dark:text-gray-500 dark:hover:text-gray-300
                    rounded-full hover:bg-gray-100 dark:hover:bg-gray-700
                    transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                  "
                  aria-label="Close dialog"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Description (if provided) */}
            {description && (
              <div 
                id={descriptionId}
                className="px-6 py-2 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700"
              >
                {description}
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Modal Hook for easier usage
 */
export const useModal = (initialOpen: boolean = false) => {
  const [isOpen, setIsOpen] = React.useState(initialOpen);

  const openModal = React.useCallback(() => setIsOpen(true), []);
  const closeModal = React.useCallback(() => setIsOpen(false), []);
  const toggleModal = React.useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal
  };
};

export default AccessibleModal;

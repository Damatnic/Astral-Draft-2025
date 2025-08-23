
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusTrap, useAnnouncer } from '../../utils/accessibility';
import useSound from '../../hooks/useSound';

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: { 
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring' as 'spring', damping: 25, stiffness: 200 } 
  },
  exit: { 
    opacity: 0, y: 30, scale: 0.98,
    transition: { duration: 0.2 } 
  },
};

const Modal: React.FC<ModalProps> = ({ onClose, children, title, description }) => {
  const { containerRef } = useFocusTrap(true);
  const { announce } = useAnnouncer();
  const playOpenSound = useSound('openModal', 0.3);
  const playCloseSound = useSound('closeModal', 0.2);
  const titleId = React.useId();
  const descriptionId = React.useId();

  React.useEffect(() => {
    playOpenSound();
    if (title) {
      announce(`${title} dialog opened`, 'assertive');
    }
  }, [playOpenSound, announce, title]);

  const handleClose = () => {
    playCloseSound();
    announce('Dialog closed', 'polite');
    onClose();
  };

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    
    const handleCustomEscape = () => {
      handleClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    
    if (containerRef.current) {
      containerRef.current.addEventListener('focustrap:escape', handleCustomEscape);
    }

    // Prevent body scroll
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (containerRef.current) {
        containerRef.current.removeEventListener('focustrap:escape', handleCustomEscape);
      }
      document.body.style.overflow = originalStyle;
    };
  }, [handleClose, containerRef]);

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
      {...{
        variants: backdropVariants,
        initial: "hidden",
        animate: "visible",
        exit: "exit",
      }}
    >
      <motion.div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className="w-full"
        onClick={(e: any) => e.stopPropagation()}
        role="dialog"
        aria-modal={true}
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        {...{
            variants: modalVariants,
            initial: "hidden",
            animate: "visible",
            exit: "exit",
        }}
      >
        {/* Screen reader accessibility info */}
        {title && <div id={titleId} className="sr-only">{title}</div>}
        {description && <div id={descriptionId} className="sr-only">{description}</div>}
        
        {children}
      </motion.div>
    </motion.div>
  );
};

export default Modal;

/**
 * SuspenseLoader - A loading component for lazy-loaded components
 */
import React from 'react';
import { motion } from 'framer-motion';

interface SuspenseLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SuspenseLoader: React.FC<SuspenseLoaderProps> = ({ 
  message = 'Loading...', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center"
      >
        <div className={`${sizeClasses[size]} relative`}>
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-blue-500/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-l-blue-500 border-r-transparent border-b-transparent"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-sm text-slate-300"
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
};

export default SuspenseLoader;
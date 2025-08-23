



import React from 'react';
import { motion } from 'framer-motion';
import type { NotificationType } from '../../types';
import { CheckIcon } from '../icons/CheckIcon';
import { ArrowRightLeftIcon } from '../icons/ArrowRightLeftIcon';
import { PlusCircleIcon } from '../icons/PlusCircleIcon';
import { SparklesIcon } from '../icons/SparklesIcon';

interface NotificationProps {
  message: string;
  type: NotificationType;
}

const Notification: React.FC<NotificationProps> = ({ message, type }) => {
  const getIcon = () => {
    switch (type) {
      case 'DRAFT': return <CheckIcon />;
      case 'TRADE': return <ArrowRightLeftIcon />;
      case 'WAIVER': return <PlusCircleIcon />;
      case 'SYSTEM':
      default:
        return <SparklesIcon className="h-6 w-6 text-cyan-300" />;
    }
  }
  return (
    <motion.div
      className="p-3 bg-gray-900/60 border border-cyan-300/30 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-4 min-w-[300px]"
      {...{
        layout: true,
        initial: { opacity: 0, y: 50, scale: 0.3 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 20, scale: 0.5, transition: { duration: 0.4 } },
        transition: { type: "spring", stiffness: 200, damping: 20 },
      }}
    >
        <div className="text-2xl">{getIcon()}</div>
          <div>
            <p className="font-bold text-white">{message}</p>
        </div>
    </motion.div>
  );
};

export default Notification;
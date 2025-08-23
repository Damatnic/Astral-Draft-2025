/**
 * Notification Bell Component
 * Header notification indicator with unread count
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationCenter from './NotificationCenter';

interface NotificationBellProps {
    className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
    const { unreadCount } = useNotifications();
    const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

    return (
        <>
            <motion.button
                onClick={() => setIsNotificationCenterOpen(true)}
                className={`relative p-2 text-gray-400 hover:text-white transition-colors ${className}`}
                title="Notifications"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <BellIcon className="w-6 h-6" />
                
                {unreadCount > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.div>
                )}
                
                {unreadCount > 0 && (
                    <motion.div
                        className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                )}
            </motion.button>

            <AnimatePresence>
                {isNotificationCenterOpen && (
                    <NotificationCenter
                        isOpen={isNotificationCenterOpen}
                        onClose={() => setIsNotificationCenterOpen(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default NotificationBell;

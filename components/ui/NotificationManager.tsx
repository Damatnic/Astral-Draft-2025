


import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppState } from '../../contexts/AppContext';
import Notification from './Notification';
import useSound from '../../hooks/useSound';

const NotificationManager: React.FC = () => {
    const { state, dispatch } = useAppState();
    const playNotificationSound = useSound('notification', 0.4);

    const currentNotification = state.notifications.length > 0 ? state.notifications[0] : null;

    React.useEffect(() => {
        if (currentNotification) {
            playNotificationSound();
            const timer = setTimeout(() => {
                dispatch({ type: 'REMOVE_NOTIFICATION', payload: currentNotification.id });
            }, 4500); // Display for 4.5 seconds

            return () => clearTimeout(timer);
        }
    }, [currentNotification, dispatch, playNotificationSound]);

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <AnimatePresence>
                {currentNotification && (
                    <Notification key={currentNotification.id} message={currentNotification.message} type={currentNotification.type} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationManager;


export const showNotification = (title: string, options?: NotificationOptions) => {
    // Check if notifications are supported and permission is granted
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            ...options,
            icon: '/favicon.svg',
            body: options?.body || 'Astral Draft',
            tag: title, // Use title as tag to prevent multiple notifications for same event
        });
    }
}

export const requestNotificationPermission = async (dispatch: React.Dispatch<any>) => {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        dispatch({ type: 'SET_NOTIFICATION_PERMISSION', payload: permission });
        if (permission === 'granted') {
            showNotification('Notifications Enabled!', { body: 'You will now receive alerts from Astral Draft.' });
        }
    } else {
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Browser does not support notifications.', type: 'SYSTEM' } });
    }
}
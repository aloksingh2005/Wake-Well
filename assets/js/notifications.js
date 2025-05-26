// Notification System for WakeWell

class NotificationManager {
    constructor() {
        this.hasPermission = false;
        this.initialize();
    }

    async initialize() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            this.hasPermission = permission === 'granted';
        }
    }

    async showNotification(title, options = {}) {
        if (!this.hasPermission) {
            const permission = await Notification.requestPermission();
            this.hasPermission = permission === 'granted';
        }

        if (this.hasPermission) {
            const defaultOptions = {
                icon: '/assets/icons/icon-192x192.png',
                badge: '/assets/icons/badge-96x96.png',
                vibrate: [200, 100, 200],
                tag: 'wakewell-alarm',
                renotify: true,
                requireInteraction: true,
                actions: [
                    {
                        action: 'snooze',
                        title: 'Snooze (5min)'
                    },
                    {
                        action: 'stop',
                        title: 'Stop'
                    }
                ]
            };

            const notification = new Notification(title, { ...defaultOptions, ...options });

            notification.addEventListener('click', () => {
                window.focus();
                notification.close();
            });

            return notification;
        }

        return null;
    }

    async scheduleNotification(time, message) {
        if ('scheduling' in Notification) {
            const scheduledTime = new Date(time).getTime();
            
            await Notification.schedule([{
                title: 'WakeWell Alarm',
                message: message,
                timestamp: scheduledTime,
                tag: 'wakewell-scheduled-alarm'
            }]);
        } else {
            console.log('Notification scheduling not supported');
        }
    }
}

// Export for use in other modules
export const notificationManager = new NotificationManager();

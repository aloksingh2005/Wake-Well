const CACHE_NAME = 'wakewell-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/pages/alarm.html',
    '/pages/tracking.html',
    '/pages/reports.html',
    '/pages/settings.html',
    '/assets/css/main.css',
    '/assets/css/alarm.css',
    '/assets/css/tracking.css',
    '/assets/css/reports.css',
    '/assets/css/settings.css',
    '/assets/js/app.js',
    '/assets/js/alarm.js',
    '/assets/js/tracking.js',
    '/assets/js/reports.js',
    '/assets/js/settings.js',
    '/manifest.json',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Activate Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch Event
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                // Clone the request
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(response => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
    );
});

// Background Sync
self.addEventListener('sync', event => {
    if (event.tag === 'sync-sleep-data') {
        event.waitUntil(syncSleepData());
    }
});

// Push Notification
self.addEventListener('push', event => {
    const options = {
        body: event.data.text(),
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View Details',
                icon: '/assets/icons/checkmark.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/assets/icons/close.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('WakeWell', options)
    );
});

// Notification Click
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/pages/reports.html')
        );
    }
});

// Helper Functions
async function syncSleepData() {
    try {
        const sleepData = await getSleepDataFromIndexedDB();
        await uploadSleepData(sleepData);
        await clearSleepDataFromIndexedDB();
    } catch (error) {
        console.error('Error syncing sleep data:', error);
    }
}

async function getSleepDataFromIndexedDB() {
    // Implementation for getting sleep data from IndexedDB
    return [];
}

async function uploadSleepData(data) {
    // Implementation for uploading sleep data to server
    return true;
}

async function clearSleepDataFromIndexedDB() {
    // Implementation for clearing synced data from IndexedDB
    return true;
} 
const CACHE_NAME = 'astral-draft-cache-v5';
const ORACLE_CACHE = 'oracle-predictions-cache-v3';
const IMAGES_CACHE = 'astral-draft-images-v3';
const API_CACHE = 'astral-draft-api-v3';
const OFFLINE_CACHE = 'astral-draft-offline-v2';

const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  '/offline.html',
  '/icons/oracle-badge.png',
  '/icons/oracle-challenge.png',
  '/icons/oracle-result.png',
  '/icons/oracle-achievement.png',
  '/icons/oracle-social.png',
  '/icons/oracle-update.png'
];

// Offline fallback pages
const offlinePages = [
  '/offline.html',
  '/offline-draft.html',
  '/offline-analytics.html'
];

// Mobile-optimized cache strategies
const CACHE_STRATEGIES = {
  // Cache API responses for 5 minutes
  api: { maxAge: 5 * 60 * 1000 },
  // Cache images for 24 hours
  images: { maxAge: 24 * 60 * 60 * 1000 },
  // Cache Oracle predictions for 1 hour
  oracle: { maxAge: 60 * 60 * 1000 },
  // Cache static assets for 30 days
  static: { maxAge: 30 * 24 * 60 * 60 * 1000 },
  // Cache offline pages indefinitely
  offline: { maxAge: Infinity }
};

// Install event - cache resources including offline fallbacks
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => {
        console.log('📱 Opened main cache');
        return cache.addAll(urlsToCache);
      }),
      caches.open(ORACLE_CACHE).then(cache => {
        console.log('📱 Opened Oracle cache');
        return cache;
      }),
      caches.open(IMAGES_CACHE).then(cache => {
        console.log('📱 Opened images cache for mobile optimization');
        return cache;
      }),
      caches.open(API_CACHE).then(cache => {
        console.log('📱 Opened API cache for offline capability');
        return cache;
      }),
      caches.open(OFFLINE_CACHE).then(async cache => {
        console.log('📱 Opened offline cache for PWA features');
        // Only add offline pages that actually exist
        const validPages = [];
        for (const page of offlinePages) {
          try {
            const response = await fetch(page, { method: 'HEAD' });
            if (response.ok) {
              validPages.push(page);
            }
          } catch (error) {
            console.log(`📱 Offline page ${page} not found, skipping:`, error.message);
          }
        }
        return cache.addAll(validPages);
      })
    ])
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
  // Skip waiting to immediately activate
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== ORACLE_CACHE) {
            console.log('📱 Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  // Filter out chrome-extension URLs and other non-cacheable requests
  if (event.request.url.startsWith('chrome-extension://') ||
      event.request.url.startsWith('moz-extension://') ||
      event.request.url.startsWith('safari-extension://') ||
      event.request.url.startsWith('edge-extension://') ||
      event.request.url.startsWith('about:') ||
      event.request.url.startsWith('moz-extension:') ||
      event.request.method !== 'GET') {
    // Let browser handle these requests normally
    return;
  }

  // Handle Oracle API requests
  if (event.request.url.includes('/api/oracle')) {
    event.respondWith(handleOracleAPIRequest(event.request));
    return;
  }

  // Handle other requests
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Make network request and cache if successful
        return fetch(event.request).then(response => {
          // Enhanced response validation to prevent caching errors
          if (!response || 
              response.status !== 200 || 
              (response.type !== 'basic' && response.type !== 'cors') ||
              !response.url ||
              response.url.startsWith('chrome-extension://') ||
              response.url.startsWith('moz-extension://')) {
            return response;
          }

          // Additional check for cacheable content types
          const contentType = response.headers.get('Content-Type') || '';
          const isHTML = contentType.includes('text/html');
          const isJS = contentType.includes('javascript') || contentType.includes('application/javascript');
          const isCSS = contentType.includes('text/css');
          const isImage = contentType.includes('image/');
          const isFont = contentType.includes('font/') || response.url.includes('.woff') || response.url.includes('.ttf');
          
          // Only cache known safe content types
          if (isHTML || isJS || isCSS || isImage || isFont || response.url.includes('/api/')) {
            try {
              // Clone response for caching with error handling
              const responseToCache = response.clone();
              
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              }).catch(error => {
                console.log('Failed to cache response:', error.message);
              });
            } catch (error) {
              console.log('Failed to clone response for caching:', error.message);
            }
          }

          return response;
        });
      })
      .catch((error) => {
        console.log('Network request failed:', error.message);
        
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        
        // For other requests, return a basic offline response
        return new Response('Offline', { 
          status: 503, 
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// Handle Oracle API requests with offline support
async function handleOracleAPIRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(ORACLE_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('📱 Network failed, trying cache for Oracle API:', error.message);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ 
        offline: true, 
        message: 'Oracle predictions will sync when connection is restored' 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Background sync for Oracle predictions
self.addEventListener('sync', event => {
  if (event.tag === 'oracle-prediction-sync') {
    console.log('📱 Background sync: Oracle predictions');
    event.waitUntil(syncOraclePredictions());
  }
});

// Sync Oracle predictions when back online
async function syncOraclePredictions() {
  try {
    // Get stored offline predictions
    const cache = await caches.open(ORACLE_CACHE);
    const offlineData = await cache.match('/offline-predictions');
    
    if (offlineData) {
      const predictions = await offlineData.json();
      
      // Send predictions to server
      for (const prediction of predictions) {
        try {
          await fetch('/api/oracle/predictions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prediction)
          });
        } catch (error) {
          console.error('Failed to sync prediction:', error);
        }
      }
      
      // Clear offline storage after successful sync
      await cache.delete('/offline-predictions');
      
      // Notify clients about successful sync
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'oracle-sync-complete',
            data: { count: predictions.length }
          });
        });
      });
    }
  } catch (error) {
    console.error('Oracle sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', event => {
  console.log('📱 Push notification received');
  
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: data.icon || '/favicon.svg',
    badge: '/icons/oracle-badge.png',
    tag: data.tag || 'oracle-notification',
    vibrate: [200, 100, 200],
    actions: data.actions || [],
    data: data.data || {},
    requireInteraction: data.requireInteraction || false
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('📱 Notification clicked:', event.notification.tag);
  
  event.notification.close();

  const notificationData = event.notification.data;
  const action = event.action;

  // Handle different notification actions
  if (action === 'view') {
    // Open the Oracle challenges view
    event.waitUntil(
      clients.openWindow('/oracle-challenges')
    );
  } else if (action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - focus or open the app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if no existing window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
        
        return Promise.resolve();
      })
    );
  }

  // Send analytics about notification interaction
  event.waitUntil(
    fetch('/api/analytics/notification-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tag: event.notification.tag,
        action: action || 'default',
        timestamp: new Date().toISOString(),
        data: notificationData
      })
    }).catch(error => {
      console.log('Analytics failed:', error);
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', event => {
  console.log('📱 Notification closed:', event.notification.tag);
  
  // Send analytics about notification dismissal
  fetch('/api/analytics/notification-close', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tag: event.notification.tag,
      timestamp: new Date().toISOString()
    })
  }).catch(error => {
    console.log('Analytics failed:', error);
  });
});

// Periodic background sync for Oracle updates
self.addEventListener('periodicsync', event => {
  if (event.tag === 'oracle-update') {
    console.log('📱 Periodic sync: Oracle updates');
    event.waitUntil(checkOracleUpdates());
  }
});

// Check for Oracle prediction updates
async function checkOracleUpdates() {
  try {
    const response = await fetch('/api/oracle/updates');
    const updates = await response.json();
    
    if (updates.length > 0) {
      // Show notification for important updates
      for (const update of updates) {
        if (update.important) {
          await self.registration.showNotification('Oracle Update', {
            body: update.message,
            icon: '/icons/oracle-update.png',
            tag: `update-${update.id}`,
            data: update
          });
        }
      }
      
      // Notify clients about updates
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'oracle-updates',
          data: updates
        });
      });
    }
  } catch (error) {
    console.error('Failed to check Oracle updates:', error);
  }
}

// Schedule Oracle challenge reminders
function scheduleOracleReminders() {
  // This would integrate with a scheduling system
  // For now, we'll use a simple timeout-based approach
  
  setInterval(async () => {
    try {
      const response = await fetch('/api/oracle/upcoming-challenges');
      const challenges = await response.json();
      
      for (const challenge of challenges) {
        const timeUntilDeadline = new Date(challenge.deadline).getTime() - Date.now();
        
        // Send reminder 1 hour before deadline
        if (timeUntilDeadline <= 3600000 && timeUntilDeadline > 3540000) {
          await self.registration.showNotification('Oracle Challenge Reminder', {
            body: `⚡ Only 1 hour left: ${challenge.question}`,
            icon: '/icons/oracle-challenge.png',
            tag: `reminder-${challenge.id}`,
            requireInteraction: true,
            actions: [
              { action: 'view', title: 'View Challenge' },
              { action: 'dismiss', title: 'Dismiss' }
            ],
            data: challenge
          });
        }
      }
    } catch (error) {
      console.error('Failed to check upcoming challenges:', error);
    }
  }, 60000); // Check every minute
}

// Initialize Oracle reminder system
scheduleOracleReminders();

// Message handling from main thread
self.addEventListener('message', event => {
  // Verify origin for security
  if (!event.origin || event.origin !== self.location.origin) {
    console.warn('📱 Message from untrusted origin:', event.origin);
    return;
  }
  
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'oracle-prediction-submitted':
      // Store prediction for offline sync if needed
      if (data) {
        storePredictionForSync(data);
      }
      break;
    
    case 'oracle-settings-updated':
      // Update notification preferences
      console.log('📱 Oracle settings updated');
      break;
    
    case 'skip-waiting':
      self.skipWaiting();
      break;
      
    default:
      console.log('📱 Unknown message type:', type);
  }
});

// Store prediction for offline sync
async function storePredictionForSync(prediction) {
  try {
    const cache = await caches.open(ORACLE_CACHE);
    const existing = await cache.match('/offline-predictions');
    
    let predictions = [];
    if (existing) {
      predictions = await existing.json();
    }
    
    predictions.push({
      ...prediction,
      timestamp: new Date().toISOString(),
      offline: true
    });
    
    await cache.put('/offline-predictions', new Response(JSON.stringify(predictions)));
    console.log('📱 Prediction stored for offline sync');
  } catch (error) {
    console.error('Failed to store prediction for sync:', error);
  }
}

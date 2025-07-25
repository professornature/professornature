/**
 * Service Worker for Farmers Friend Solar Systems
 * Provides offline functionality and performance optimization
 */

const CACHE_NAME = 'farmers-friend-v1.0.0';
const STATIC_CACHE = 'farmers-friend-static-v1.0.0';
const DYNAMIC_CACHE = 'farmers-friend-dynamic-v1.0.0';

// Critical resources to cache for offline use
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/marketplace.html',
    '/css/bootstrap.min.css',
    '/css/style.css',
    '/css/farmers-friend.css',
    '/css/marketplace.css',
    '/js/main.js',
    '/js/farmers-friend.js',
    '/js/marketplace.js',
    '/lib/wow/wow.min.js',
    '/lib/easing/easing.min.js',
    '/lib/waypoints/waypoints.min.js',
    '/lib/owlcarousel/owl.carousel.min.js',
    '/lib/owlcarousel/assets/owl.carousel.min.css',
    'https://code.jquery.com/jquery-3.4.1.min.js',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/js/bootstrap.bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.4.1/font/bootstrap-icons.css',
    'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&family=Roboto:wght@500;700&display=swap'
];

// Install event - cache static resources
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS.map(url => {
                    // Handle both relative and absolute URLs
                    try {
                        return new Request(url, { mode: 'cors' });
                    } catch (e) {
                        return url;
                    }
                }));
            })
            .catch(error => {
                console.error('Service Worker: Failed to cache static assets', error);
            })
    );
    
    // Skip waiting to activate immediately
    self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => {
                        // Delete old cache versions
                        return cacheName.startsWith('farmers-friend-') &&
                               cacheName !== STATIC_CACHE &&
                               cacheName !== DYNAMIC_CACHE;
                    })
                    .map(cacheName => {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    })
            );
        })
    );
    
    // Take control of all pages immediately
    return self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-HTTP requests
    if (!request.url.startsWith('http')) {
        return;
    }
    
    // Handle different types of requests
    if (request.method === 'GET') {
        event.respondWith(handleGetRequest(request));
    } else {
        event.respondWith(handleNonGetRequest(request));
    }
});

/**
 * Handle GET requests with cache-first strategy for static assets
 * and network-first for dynamic content
 */
async function handleGetRequest(request) {
    const url = new URL(request.url);
    
    try {
        // Check if it's a static asset
        if (isStaticAsset(request.url)) {
            return await cacheFirst(request);
        }
        
        // For API requests and dynamic content, try network first
        if (isAPIRequest(request.url)) {
            return await networkFirst(request);
        }
        
        // For images and other assets, use cache first with fallback
        if (isAssetRequest(request.url)) {
            return await cacheFirst(request, true);
        }
        
        // Default: try network first, fallback to cache
        return await networkFirst(request);
        
    } catch (error) {
        console.error('Service Worker: Fetch error', error);
        return await getOfflineFallback(request);
    }
}

/**
 * Handle non-GET requests (POST, PUT, DELETE)
 */
async function handleNonGetRequest(request) {
    try {
        // Try to make the request
        const response = await fetch(request);
        
        // If successful, return the response
        if (response.ok) {
            return response;
        }
        
        // If failed, store for later sync (background sync would be ideal)
        await storeFailedRequest(request);
        return new Response(
            JSON.stringify({ 
                success: false, 
                message: 'Request stored for later sync',
                offline: true 
            }),
            { 
                status: 202,
                headers: { 'Content-Type': 'application/json' }
            }
        );
        
    } catch (error) {
        // Network failed, store for later sync
        await storeFailedRequest(request);
        return new Response(
            JSON.stringify({ 
                success: false, 
                message: 'Offline - request will be synced when online',
                offline: true 
            }),
            { 
                status: 202,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

/**
 * Cache-first strategy: check cache first, fallback to network
 */
async function cacheFirst(request, updateCache = false) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        // If we want to update cache in background
        if (updateCache) {
            fetchAndCache(request).catch(error => {
                console.log('Service Worker: Background update failed', error);
            });
        }
        return cachedResponse;
    }
    
    // Not in cache, fetch from network
    return await fetchAndCache(request);
}

/**
 * Network-first strategy: try network first, fallback to cache
 */
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        
        // Cache successful responses
        if (response.ok) {
            await cacheResponse(request, response.clone());
        }
        
        return response;
    } catch (error) {
        // Network failed, try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

/**
 * Fetch from network and cache the response
 */
async function fetchAndCache(request) {
    const response = await fetch(request);
    
    if (response.ok) {
        await cacheResponse(request, response.clone());
    }
    
    return response;
}

/**
 * Cache a response in the appropriate cache
 */
async function cacheResponse(request, response) {
    const cacheName = isStaticAsset(request.url) ? STATIC_CACHE : DYNAMIC_CACHE;
    const cache = await caches.open(cacheName);
    
    // Only cache successful responses
    if (response.status === 200) {
        await cache.put(request, response);
    }
}

/**
 * Store failed requests for later synchronization
 */
async function storeFailedRequest(request) {
    try {
        const requestData = {
            url: request.url,
            method: request.method,
            headers: Object.fromEntries(request.headers.entries()),
            body: request.method !== 'GET' ? await request.text() : null,
            timestamp: Date.now()
        };
        
        // Store in IndexedDB or localStorage
        const failedRequests = JSON.parse(localStorage.getItem('failedRequests') || '[]');
        failedRequests.push(requestData);
        localStorage.setItem('failedRequests', JSON.stringify(failedRequests));
        
    } catch (error) {
        console.error('Service Worker: Failed to store request', error);
    }
}

/**
 * Get offline fallback response
 */
async function getOfflineFallback(request) {
    const url = new URL(request.url);
    
    // For HTML pages, return cached page or offline page
    if (request.headers.get('accept')?.includes('text/html')) {
        const cachedResponse = await caches.match('/index.html');
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return basic offline page
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Offline - Farmers Friend</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .offline-icon { font-size: 64px; color: #28a745; margin-bottom: 20px; }
                    .btn { background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="offline-icon">🌱</div>
                <h1>You're Offline</h1>
                <p>Farmers Friend is working in offline mode. Some features may be limited.</p>
                <a href="/" class="btn">Try Again</a>
            </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' }
        });
    }
    
    // For JSON API requests, return offline status
    if (request.headers.get('accept')?.includes('application/json')) {
        return new Response(
            JSON.stringify({ 
                success: false, 
                message: 'Offline mode - limited functionality available',
                offline: true 
            }),
            { 
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
    
    // For other requests, return 503
    return new Response('Service Unavailable', { status: 503 });
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(url) {
    return STATIC_ASSETS.some(asset => url.includes(asset)) ||
           url.includes('.css') ||
           url.includes('.js') ||
           url.includes('.woff') ||
           url.includes('.woff2') ||
           url.includes('fonts.googleapis.com') ||
           url.includes('cdnjs.cloudflare.com') ||
           url.includes('cdn.jsdelivr.net');
}

/**
 * Check if URL is an API request
 */
function isAPIRequest(url) {
    return url.includes('/api/') ||
           url.includes('api.') ||
           url.includes('/ajax/');
}

/**
 * Check if URL is an asset request (images, etc.)
 */
function isAssetRequest(url) {
    return url.includes('.jpg') ||
           url.includes('.jpeg') ||
           url.includes('.png') ||
           url.includes('.gif') ||
           url.includes('.svg') ||
           url.includes('.webp') ||
           url.includes('.ico');
}

// Listen for messages from the main thread
self.addEventListener('message', event => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_URLS':
            // Cache specific URLs on demand
            if (data && data.urls) {
                caches.open(DYNAMIC_CACHE).then(cache => {
                    cache.addAll(data.urls);
                });
            }
            break;
            
        case 'CLEAR_CACHE':
            // Clear specific cache
            if (data && data.cacheName) {
                caches.delete(data.cacheName);
            }
            break;
            
        case 'SYNC_FAILED_REQUESTS':
            // Attempt to sync failed requests
            syncFailedRequests();
            break;
    }
});

/**
 * Sync failed requests when back online
 */
async function syncFailedRequests() {
    try {
        const failedRequests = JSON.parse(localStorage.getItem('failedRequests') || '[]');
        const successful = [];
        
        for (const requestData of failedRequests) {
            try {
                const response = await fetch(requestData.url, {
                    method: requestData.method,
                    headers: requestData.headers,
                    body: requestData.body
                });
                
                if (response.ok) {
                    successful.push(requestData);
                }
            } catch (error) {
                console.log('Service Worker: Sync failed for request', requestData.url);
            }
        }
        
        // Remove successful requests
        const remaining = failedRequests.filter(req => !successful.includes(req));
        localStorage.setItem('failedRequests', JSON.stringify(remaining));
        
        console.log(`Service Worker: Synced ${successful.length} failed requests`);
        
    } catch (error) {
        console.error('Service Worker: Failed to sync requests', error);
    }
}

// Periodic cleanup of old cached data
self.addEventListener('periodicsync', event => {
    if (event.tag === 'cleanup') {
        event.waitUntil(cleanupOldCache());
    }
});

/**
 * Clean up old cached data
 */
async function cleanupOldCache() {
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (const request of requests) {
        const response = await cache.match(request);
        const dateHeader = response.headers.get('date');
        
        if (dateHeader) {
            const responseDate = new Date(dateHeader).getTime();
            if (responseDate < oneWeekAgo) {
                await cache.delete(request);
            }
        }
    }
}

console.log('Service Worker: Script loaded successfully');
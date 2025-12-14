// Service Worker for Exam System
// Provides offline support and caching strategies

const CACHE_NAME = 'exam-system-v1'
const STATIC_CACHE = 'exam-system-static-v1'
const DYNAMIC_CACHE = 'exam-system-dynamic-v1'
const OFFLINE_PAGE = '/offline.html'

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/login',
  '/register',
  '/offline.html',
  '/globals.css',
  '/_next/static/css/app/layout.css',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...')
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[ServiceWorker] Caching static assets')
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('[ServiceWorker] Failed to cache static assets:', err)
      })
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome extensions and other protocols
  if (!request.url.startsWith('http')) {
    return
  }

  // API requests - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // Static assets (images, CSS, JS) - Cache first
  if (
    request.destination === 'image' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.url.includes('/_next/static/')
  ) {
    event.respondWith(cacheFirstStrategy(request))
    return
  }

  // Navigation requests - Network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request))
    return
  }

  // Default: Network first
  event.respondWith(networkFirstStrategy(request))
})

// Cache-first strategy (for static assets)
async function cacheFirstStrategy(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cached = await cache.match(request)
  
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.error('[ServiceWorker] Fetch failed for:', request.url, error)
    throw error
  }
}

// Network-first strategy (for API calls)
async function networkFirstStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE)

  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cached = await cache.match(request)
    if (cached) {
      console.log('[ServiceWorker] Serving from cache (offline):', request.url)
      return cached
    }
    throw error
  }
}

// Network-first with offline page fallback (for navigation)
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request)
    const cache = await caches.open(DYNAMIC_CACHE)
    cache.put(request, response.clone())
    return response
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE)
    const cached = await cache.match(request)
    
    if (cached) {
      return cached
    }

    // Return offline page
    const offlineCache = await caches.open(STATIC_CACHE)
    const offlinePage = await offlineCache.match(OFFLINE_PAGE)
    if (offlinePage) {
      return offlinePage
    }

    // Fallback response if offline page not cached
    return new Response('Offline - No cached version available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain',
      }),
    })
  }
}

// Background sync for exam submissions
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag)
  
  if (event.tag === 'sync-exam-submissions') {
    event.waitUntil(syncExamSubmissions())
  }
})

// Sync pending exam submissions when online
async function syncExamSubmissions() {
  try {
    const db = await openIndexedDB()
    const pendingSubmissions = await getPendingSubmissions(db)

    for (const submission of pendingSubmissions) {
      try {
        const response = await fetch('/api/exam-attempts/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submission.data),
        })

        if (response.ok) {
          await deletePendingSubmission(db, submission.id)
          console.log('[ServiceWorker] Synced submission:', submission.id)
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync submission:', error)
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error)
  }
}

// IndexedDB helpers
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ExamSystemDB', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('pendingSubmissions')) {
        db.createObjectStore('pendingSubmissions', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

function getPendingSubmissions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingSubmissions'], 'readonly')
    const store = transaction.objectStore('pendingSubmissions')
    const request = store.getAll()
    
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function deletePendingSubmission(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingSubmissions'], 'readwrite')
    const store = transaction.objectStore('pendingSubmissions')
    const request = store.delete(id)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push notification received')
  
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Exam System Notification'
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: data.url || '/',
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  )
})

console.log('[ServiceWorker] Loaded successfully')

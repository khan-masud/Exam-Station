// Service Worker Registration and Management

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Workers not supported')
    return
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })

      console.log('✅ Service Worker registered:', registration.scope)

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        console.log('🔄 Service Worker update found')

        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('✨ New Service Worker available')
            // Notify user about update
            notifyUpdate()
          }
        })
      })

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker controller changed')
        window.location.reload()
      })

      // Register background sync
      if ('sync' in registration) {
        console.log('✅ Background Sync supported')
      }

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        // Don't auto-request, let user opt-in
        console.log('📬 Notifications available')
      }

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error)
    }
  })
}

export function unregisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  navigator.serviceWorker.ready.then((registration) => {
    registration.unregister()
    console.log('Service Worker unregistered')
  })
}

export async function checkForUpdates() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    await registration.update()
    console.log('Checked for Service Worker updates')
  } catch (error) {
    console.error('Failed to check for updates:', error)
  }
}

function notifyUpdate() {
  // You can use your toast notification system here
  const updateBanner = document.createElement('div')
  updateBanner.id = 'sw-update-banner'
  updateBanner.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `

  updateBanner.innerHTML = `
    <span>🎉 New version available!</span>
    <button id="sw-update-btn" style="
      background: white;
      color: #667eea;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    ">Update Now</button>
    <button id="sw-dismiss-btn" style="
      background: transparent;
      color: white;
      border: 1px solid white;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      transition: transform 0.2s;
    ">Later</button>
  `

  document.body.appendChild(updateBanner)

  document.getElementById('sw-update-btn')?.addEventListener('click', () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
    }
  })

  document.getElementById('sw-dismiss-btn')?.addEventListener('click', () => {
    updateBanner.remove()
  })
}

// IndexedDB wrapper for offline data storage
export class OfflineStorage {
  private dbName = 'ExamSystemDB'
  private version = 1
  private db: IDBDatabase | null = null

  async open() {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result

        // Create object stores
        if (!db.objectStoreNames.contains('pendingSubmissions')) {
          const submissionStore = db.createObjectStore('pendingSubmissions', {
            keyPath: 'id',
            autoIncrement: true,
          })
          submissionStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        if (!db.objectStoreNames.contains('cachedExams')) {
          const examStore = db.createObjectStore('cachedExams', { keyPath: 'examId' })
          examStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        if (!db.objectStoreNames.contains('cachedResults')) {
          const resultStore = db.createObjectStore('cachedResults', { keyPath: 'resultId' })
          resultStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  async savePendingSubmission(data: any) {
    if (!this.db) await this.open()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingSubmissions'], 'readwrite')
      const store = transaction.objectStore('pendingSubmissions')
      const request = store.add({
        ...data,
        timestamp: Date.now(),
      })

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getPendingSubmissions() {
    if (!this.db) await this.open()

    return new Promise<any[]>((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingSubmissions'], 'readonly')
      const store = transaction.objectStore('pendingSubmissions')
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async deletePendingSubmission(id: number) {
    if (!this.db) await this.open()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingSubmissions'], 'readwrite')
      const store = transaction.objectStore('pendingSubmissions')
      const request = store.delete(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async cacheExam(examId: string, examData: any) {
    if (!this.db) await this.open()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedExams'], 'readwrite')
      const store = transaction.objectStore('cachedExams')
      const request = store.put({
        examId,
        data: examData,
        timestamp: Date.now(),
      })

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getCachedExam(examId: string) {
    if (!this.db) await this.open()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedExams'], 'readonly')
      const store = transaction.objectStore('cachedExams')
      const request = store.get(examId)

      request.onsuccess = () => resolve(request.result?.data)
      request.onerror = () => reject(request.error)
    })
  }
}

// Check if app is running in offline mode
export function isOffline() {
  return typeof navigator !== 'undefined' && !navigator.onLine
}

// Listen for online/offline events
export function setupOnlineListener(onOnline: () => void, onOffline: () => void) {
  if (typeof window === 'undefined') return

  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)

  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  }
}

// Request notification permission
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// Subscribe to push notifications
export async function subscribeToPushNotifications() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    })

    return subscription
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error)
    return null
  }
}

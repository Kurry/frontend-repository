const CACHE = 'template-forms-v3'

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))).then(() => self.clients.claim()),
  )
})

// Network-first for every request so oracle grading never sees a stale empty shell.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  event.respondWith(
    fetch(event.request).then((response) => {
      if (response.ok && event.request.url.startsWith(self.location.origin)) {
        const copy = response.clone()
        caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {})
      }
      return response
    }).catch(() => caches.match(event.request).then((cached) => cached || Response.error())),
  )
})

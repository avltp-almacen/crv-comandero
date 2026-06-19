// Service Worker del Comandero CRV
const CACHE = 'comandero-crv-v1';
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.json'
];

// Al instalar, guardar los archivos básicos en caché
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).catch(() => {})
  );
  self.skipWaiting();
});

// Al activar, limpiar versiones viejas de caché
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estrategia: red primero, caché como respaldo si no hay conexión.
// Nunca cachear llamadas a Firebase ni Google (deben ir siempre a la red).
self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  if (url.includes('firebase') || url.includes('gstatic') || url.includes('googleapis')) {
    return; // dejar pasar directo a la red, sin tocar
  }
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        // Guardar copia fresca en caché
        const copia = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copia)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(e.request)) // sin red: servir de caché
  );
});

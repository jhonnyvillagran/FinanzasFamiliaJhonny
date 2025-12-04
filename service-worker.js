// service-worker.js
// Service Worker básico para la PWA

const CACHE_NAME = 'finanzas-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/manifest.json',
  '/assets/index.js',
  // El usuario debe añadir aquí los archivos CSS, JS y otros assets de su aplicación original
  // Por ejemplo: '/styles.css', '/app.js', '/images/logo.png'
];

// Evento de instalación: se ejecuta cuando el Service Worker se instala por primera vez
self.addEventListener('install', event => {
  // Espera hasta que el caché se abra y se añadan todos los archivos
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto, precacheando assets...');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de activación: se ejecuta cuando el Service Worker se activa
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  // Elimina cachés antiguos
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Evento de fetch: intercepta las peticiones de red
self.addEventListener('fetch', event => {
  // Estrategia Cache-First: intenta responder desde el caché, si falla, va a la red
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si hay respuesta en caché, la devuelve
        if (response) {
          return response;
        }
        // Si no hay respuesta en caché, va a la red
        return fetch(event.request);
      }
    )
  );
});

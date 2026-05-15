const CACHE_NAME = 'droneops-v25';
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './main.js',
  './js/attachments.js',
  './js/cloud.js',
  './js/core.js',
  './js/i18n.js',
  './js/index.js',
  './js/managers.js',
  './js/map.js',
  './js/score.js',
  './js/ui.js',
  './js/util.js',
  './js/weather.js',
  './weather/nd/ndRecommendationService.js',
  './weather/nd/ndWeatherEstimate.js',
  './config.js',
  './manifest.json',
  './data/translations.json',
  './data/profiles.json',
  './data/weathercodes.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

// Cache API requests separately with a shorter TTL
const API_CACHE_NAME = 'droneops-api-v1';
const API_DOMAINS = [
  'api.open-meteo.com',
  'api.sunrise-sunset.org',
  'nominatim.openstreetmap.org',
  'api.brightsky.dev',
  'services-eu1.arcgis.com',
  'tiledimageservices-eu1.arcgis.com',
  'utm.dronespace.at',
  'wms.geo.admin.ch',
];

// ── Install: Cache core assets ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS.map(url => new Request(url, { cache: 'reload' })))
        .catch((err) => {
          console.warn('[SW] Some core assets failed to cache:', err);
        });
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: Remove old caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch: Network-first for API, Cache-first for assets ────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and cross-origin requests to Supabase
  if (event.request.method !== 'GET') return;
  if (url.hostname.includes('supabase.co')) return;

  // API calls: Network-first with API cache fallback
  if (API_DOMAINS.some(domain => url.hostname.includes(domain))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const cloned = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(event.request, cloned);
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Core assets: Cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (response.ok) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      });
    })
  );
});

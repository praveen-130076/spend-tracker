var CACHE = 'spendtracker-v1';
var ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'
];

// Install: cache all assets
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); })
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

// Fetch: serve from cache, fall back to network
self.addEventListener('fetch', function(e){
  // Don't cache Google API calls — always go to network for those
  if(e.request.url.indexOf('googleapis.com')>-1 ||
     e.request.url.indexOf('accounts.google.com')>-1){
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached || fetch(e.request).then(function(resp){
        // Cache new successful responses
        if(resp.status===200){
          var clone=resp.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request,clone); });
        }
        return resp;
      });
    }).catch(function(){
      // Offline fallback — return cached index
      return caches.match('./index.html');
    })
  );
});

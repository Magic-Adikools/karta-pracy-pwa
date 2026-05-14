const CACHE_NAME = 'karta-pracy-v1';
const FILES_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './icon-pro-v2.png'
];

// Instalacja — zapisz pliki w cache
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            console.log('[SW] Zapisywanie plików w cache...');
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Aktywacja — usuń stare cache
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keyList) {
            return Promise.all(keyList.map(function(key) {
                if (key !== CACHE_NAME) {
                    console.log('[SW] Usuwanie starego cache:', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

// Fetch — zwróć z cache, jeśli dostępne; w przeciwnym razie pobierz z sieci
self.addEventListener('fetch', function(event) {
    // Ignoruj żądania do zewnętrznych domen (np. date.nager.at dla świąt)
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(function(response) {
            if (response) {
                return response;
            }
            return fetch(event.request).then(function(networkResponse) {
                // Zapisz dynamicznie pobrane zasoby w cache
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            });
        }).catch(function() {
            // Gdy offline i brak w cache — nic nie rób (aplikacja działa offline z cache)
        })
    );
});

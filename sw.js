// DragonCraft service worker: lets the game open and play with NO internet.
// Strategy: NETWORK-FIRST (always revalidates, so updates show up immediately and
// the old "stuck on the previous version" problem cannot come back); if the network
// is unavailable it falls back to the last copy it saved.
const CACHE = 'dragoncraft-offline-v3';
const CORE = ['./', 'index.html', 'questions.js', 'game.js', 'parent.js', 'styles.css', 'manifest.json', 'icon-180.png', 'icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.all(CORE.map(url => cache.add(new Request(url, { cache: 'reload' })).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('index.html')))
  );
});

// Rehab Log offline support: serve from cache, refresh in the background.
const CACHE = "rehab-log-v3";
const FILES = [
  "./", "index.html", "manifest.webmanifest",
  "icons/icon-32.png", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
  "fonts/barlow-latin-400-normal.woff2", "fonts/barlow-latin-500-normal.woff2", "fonts/barlow-latin-600-normal.woff2",
  "fonts/barlow-semi-condensed-latin-500-normal.woff2", "fonts/barlow-semi-condensed-latin-700-normal.woff2"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === "navigate" || req.destination === "document" || /\.html$|\/$/.test(new URL(req.url).pathname);
  if (isPage) {
    // Pages: network first so updates show on the first open; cached copy when offline.
    e.respondWith(fetch(req).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(h => h || caches.match("index.html"))));
    return;
  }
  // Fonts, icons, etc.: cache first, refresh in the background.
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then(r => { if (r.ok) cache.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});

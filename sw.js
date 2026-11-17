// Talenta: cho phép mở app khi mất mạng. Luôn thử lấy bản mới trên mạng trước, mất mạng thì dùng bản đã cất.
const CACHE = 'talenta-v6';
const CORE = ['./', 'index.html', 'data/market.js', 'logo.svg', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'sync.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === location.origin;
  const fonts = /fonts\.(googleapis|gstatic)\.com$|^cdn\.jsdelivr\.net$/.test(url.hostname);
  if (!same && !fonts) return; // giá trực tiếp, đồng bộ: luôn đi thẳng lên mạng
  e.respondWith(fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});

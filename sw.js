/* کافه‌نت — Service-Workerِ آفلاینِ کامل: بازی تک‌فایل است؛ فقط خودش و آیکون‌ها */
'use strict';
const CACHE = 'cafenet-v1';
const ASSETS = [
  './cafnet.html',
  './pwa/icon-192.png',
  './pwa/icon-512.png',
  './manifest.webmanifest',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
      const cp = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, cp)).catch(() => {});
      return res;
    }).catch(() => caches.match('./cafnet.html')))
  );
});

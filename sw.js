/* 앱 셸만 캐시한다. 대화 데이터는 IndexedDB에 있으므로 여기서 다루지 않는다. */
const CACHE = 'rp-shell-v4';
const SHELL = ['./', './index.html', './manifest.json', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  /* API 호출은 절대 캐시하지 않는다 */
  if (url.origin !== location.origin || e.request.method !== 'GET') return;

  /* 네트워크 우선. 새 버전을 배포하면 바로 반영되고, 오프라인이면 캐시로 넘어간다. */
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});

/* Garde le site en mémoire sur le téléphone pour qu'il s'ouvre sans connexion.
   Après chaque modification du site, changez le numéro de version ci-dessous. */
const CACHE = 'moc-v1';
const CORE = ['./', './index.html', './contact.vcf', './manifest.json', './icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE);
    try { await c.add('./bmw.jpg'); } catch (_) { /* photo facultative */ }
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !isFont) return;

  // Cache d'abord (ouverture instantanée, même hors ligne), mise à jour en arrière-plan
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true }) ||
                (req.mode === 'navigate' ? await cache.match('./index.html') : undefined);
    const net = fetch(req).then((r) => {
      if (r && (r.ok || r.type === 'opaque')) cache.put(req, r.clone());
      return r;
    }).catch(() => hit || Response.error());
    return hit || net;
  })());
});

// Minhas Finanças — funciona sem internet
const CACHE = "financas-v1";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Abre na hora pelo que está guardado e, se tiver internet, atualiza por trás
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.open(CACHE).then(async c => {
      const req = e.request.mode === "navigate" ? "index.html" : e.request;
      const cached = await c.match(req, { ignoreSearch: true });
      const net = fetch(e.request).then(r => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
      return cached || (await net) || new Response("Sem internet", { status: 503 });
    })
  );
});

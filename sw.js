// Minhas Finanças — funciona sem internet e se atualiza sozinho quando tem internet
const CACHE = "financas-v3";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function comTempo(p, ms) { return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej("tempo"), ms))]); }
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const pagina = req.mode === "navigate" || new URL(req.url).pathname.endsWith("/index.html");
  if (pagina) {
    // Página: busca a versão mais nova na internet (até 4 s); sem internet, abre a guardada
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      try {
        const r = await comTempo(fetch(req.url.split("#")[0], { cache: "no-store" }), 4000);
        if (r && r.ok) { c.put("index.html", r.clone()); return r; }
      } catch (_) {}
      return (await c.match("index.html")) || new Response("Sem internet", { status: 503 });
    })());
    return;
  }
  // Ícones e demais arquivos: abre o guardado e atualiza por trás
  e.respondWith(caches.open(CACHE).then(async c => {
    const cached = await c.match(req, { ignoreSearch: true });
    const net = fetch(req, { cache: "no-cache" }).then(r => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    return cached || (await net) || new Response("", { status: 504 });
  }));
});

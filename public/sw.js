const CACHE = "eatlog-v3";
const PRECACHE = ["/", "/login", "/offline", "/manifest.json", "/apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Bypass cross-origin entirely
  if (url.origin !== location.origin) return;

  // Bypass API and auth — those should be fresh / fail loud
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/data/")) return;
  if (url.pathname.startsWith("/auth/")) return;

  // HTML navigation: stale-while-revalidate, offline fallback
  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const networkPromise = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(async () => cached || (await cache.match("/offline")) || Response.error());
        return cached || networkPromise;
      })
    );
    return;
  }

  // Images (Next.js optimizer pipes MinIO through /_next/image): cache-first
  // Static assets (/_next/static/*, /icons/*, /favicon.ico): cache-first
  e.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }).catch(() => cached || Response.error())
    )
  );
});

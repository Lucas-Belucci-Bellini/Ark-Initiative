/* ARCA offline worker: cache only public shell, public operational data and the local WASM validator. */
const SHELL_CACHE = "arca-shell-v1";
const PUBLIC_DATA_CACHE = "arca-public-risk-v1";
const SHELL_PATHS = ["/", "/operacoes", "/seguranca", "/manifest.webmanifest", "/manus-storage/arca-risk-core_721b356f.wasm"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(SHELL_CACHE).then(async cache => {
    await Promise.all(SHELL_PATHS.map(path => cache.add(path).catch(() => undefined)));
    await self.skipWaiting();
  }));
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  const isPublicOperationalFeed = url.pathname === "/api/trpc/operational.overview" && url.searchParams.get("batch") === "1";
  if (isPublicOperationalFeed) {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) caches.open(PUBLIC_DATA_CACHE).then(cache => cache.put(request, response.clone()));
      return response;
    }).catch(() => caches.match(request).then(cached => cached || new Response(JSON.stringify({ error: "offline_public_packet_unavailable" }), { status: 503, headers: { "Content-Type": "application/json" } }))));
    return;
  }

  if (url.pathname.startsWith("/api/trpc/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/operacoes").then(cached => cached || caches.match("/"))));
    return;
  }

  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok && (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/manus-storage/"))) {
      caches.open(SHELL_CACHE).then(cache => cache.put(request, response.clone()));
    }
    return response;
  })));
});

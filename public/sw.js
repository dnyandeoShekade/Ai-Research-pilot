const SHELL_CACHE = "researchpilot-shell-v1";
const STATIC_CACHE = "researchpilot-static-v1";
const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/offline.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(STATIC_ASSETS);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(
            (name) =>
              name.startsWith("researchpilot-") &&
              name !== SHELL_CACHE &&
              name !== STATIC_CACHE,
          )
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.search
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/offline.html"
  ) {
    event.respondWith(handleStaticAsset(request));
  }
});

async function handleNavigation(request) {
  try {
    const response = await fetch(request);

    if (
      response.ok &&
      new URL(request.url).pathname === "/" &&
      response.headers.get("content-type")?.includes("text/html") &&
      !response.headers.get("cache-control")?.match(/\b(private|no-store)\b/i) &&
      !response.headers.has("set-cookie")
    ) {
      const cache = await caches.open(SHELL_CACHE);
      await cache.put("/", response.clone());
    }

    return response;
  } catch {
    const cachedApp = await caches.match("/");
    if (cachedApp) return cachedApp;

    const offlinePage = await caches.match("/offline.html");
    if (offlinePage) return offlinePage;

    return new Response("You are offline.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedAsset = await cache.match(request);
  if (cachedAsset) return cachedAsset;

  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

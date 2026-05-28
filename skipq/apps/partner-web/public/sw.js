// skipQ — partner-web service worker (v3)
//
// Scope intentionally narrowed: we ONLY intercept /dashboard/* routes
// (the salon-side reception app where offline support actually matters).
// Customer routes (/c/*, /, /privacy, /s/*, /login) flow straight to
// the network so a stale cache can never serve them.
//
// The activate handler also nukes every old cache so any v1/v2 entries
// that were serving 404s to customers get wiped on the next page load.

const CACHE = "skipq-partner-v3";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Same-origin only
  if (url.origin !== self.location.origin) return;

  // Customer flow + public routes — never touch them
  if (
    url.pathname === "/" ||
    url.pathname.startsWith("/c/") ||
    url.pathname.startsWith("/s/") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/signup") ||
    url.pathname.startsWith("/auth") ||
    url.pathname.startsWith("/privacy") ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // Live API traffic — never cache
  if (
    url.host.endsWith("supabase.co") ||
    url.host.endsWith("razorpay.com") ||
    url.host.endsWith("onesignal.com")
  ) {
    return;
  }

  // /dashboard/* — network first, fall back to cache when offline
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then(
          (hit) =>
            hit ??
            new Response("Offline", { status: 503, statusText: "Offline" }),
        ),
      ),
  );
});

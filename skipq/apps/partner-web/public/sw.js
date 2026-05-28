// skipQ — partner-web service worker
//
// Strategy:
//   * Precache the dashboard shell + static assets at install
//   * Network-first for everything (so live queue stays fresh) with a
//     stale-while-revalidate fallback when offline
//   * Skip caching for Supabase / Razorpay calls — those need fresh
//     auth and can fail loudly rather than serve stale data

const CACHE = "skipq-partner-v1";
const SHELL = ["/", "/dashboard", "/dashboard/services", "/dashboard/stylists"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (
    url.host.endsWith("supabase.co") ||
    url.host.endsWith("razorpay.com") ||
    url.host.endsWith("onesignal.com")
  ) {
    return; // never cache live API traffic
  }
  if (req.headers.get("accept")?.includes("text/event-stream")) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        if (res.ok && (req.destination === "document" || req.destination === "" || req.destination === "script" || req.destination === "style" || req.destination === "image")) {
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => {
          if (hit) return hit;
          // For document requests we fall back to the cached dashboard shell
          if (req.destination === "document") {
            return caches.match("/dashboard");
          }
          return new Response("Offline", { status: 503, statusText: "Offline" });
        }),
      ),
  );
});

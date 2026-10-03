// Service Worker disabled.
// ALEX/frontend deployment ke dauran stale-cache issues avoid karne ke liye.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const registrations = await self.registration;
      await self.clients.claim();

      const keys = await caches.keys();

      await Promise.all(
        keys.map((key) => caches.delete(key))
      );
    })()
  );
});
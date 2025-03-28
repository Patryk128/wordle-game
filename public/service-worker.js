const CACHE_NAME = "wordle-pwa-v1"; // Nazwa cache'a
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/assets/img/logo.png", // Pełna ścieżka do pliku, jeśli jest w folderze
  "/sounds/win.mp3",
  "/sounds/lose.mp3",
  "/sounds/error.mp3",
  "/icons/web-app-manifest-192x192.png",
  "/icons/web-app-manifest-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
        console.error("Błąd podczas cachowania zasobów:", err);
      });
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        return (
          response ||
          fetch(event.request).then((networkResponse) => {
            // Zaktualizuj cache, jeśli plik był nowy
            if (networkResponse && event.request.url.includes("sound")) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
            return networkResponse;
          })
        );
      })
      .catch((error) => {
        console.log("Błąd w fetch:", error);
        return new Response("Błąd sieci");
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .catch((err) => {
        console.error("Błąd podczas aktywacji:", err);
      })
  );
});

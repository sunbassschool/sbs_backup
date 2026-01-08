import { precacheAndRoute } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST);

function broadcast(type) {
  self.clients.matchAll({ type: "window", includeUncontrolled: true })
    .then(clients => {
      clients.forEach(client => {
        client.postMessage({ type });
      });
    });
}

self.addEventListener("install", (event) => {
  console.log("[SW] install");
  event.waitUntil(
    (async () => {
      broadcast("sw-installing");
    })()
  );
});


self.addEventListener("activate", (event) => {
  console.log("[SW] activate");
  event.waitUntil(
    self.clients.claim().then(() => {
      broadcast("sw-activated");
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    console.log("[SW] skipWaiting forcé");
    self.skipWaiting();
  }
});
console.log("SW VERSION", Date.now())

// 07/01/2026

import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);

// Envoi d'un message aux clients
function sendMessageToClients(message) {
  self.clients.matchAll({ type: "window" }).then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: message });
    });
  });
}

self.addEventListener("install", (event) => {
  console.log("[SW] install");
  sendMessageToClients("sw-installing");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] activate");
  sendMessageToClients("sw-activated");
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    console.log("[SW] skipWaiting forcé");
    self.skipWaiting();
  }
});

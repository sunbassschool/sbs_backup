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
// Envoi d'un message aux clients
// Envoi d'un message aux clients modif du  06/12/2025 à 22:10:25:5456////
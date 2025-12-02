// ✅ Import Workbox
import { precacheAndRoute } from 'workbox-precaching';

// ✅ Injection automatique par vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);

// ✅ Événements classiques
self.addEventListener("install", () => {
  console.log("[SW] install");
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  console.log("[SW] activate");
  self.clients.claim();
});
// maj du 02/11/2025 10:02:00

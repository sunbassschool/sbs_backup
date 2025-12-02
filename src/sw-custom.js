import { precacheAndRoute } from 'workbox-precaching';

// 💥 Cette ligne est obligatoire pour injectManifest !
precacheAndRoute(self.__WB_MANIFEST);

// ✅ install/activate optionnels mais propres
self.addEventListener("install", () => {
  console.log("[SW] install");
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  console.log("[SW] activate");
  self.clients.claim();
});
// Ajout du build stamp pour forcer Chrome à voir la nouvelle version
const BUILD_STAMP = __BUILDSTAMP__;
console.log("[SW] Version build =", BUILD_STAMP);

// Obligatoire Workbox
self.__WB_MANIFEST;

self.addEventListener("install", () => {
  console.log("[SW] install", BUILD_STAMP);
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  console.log("[SW] activate", BUILD_STAMP);
  self.clients.claim();
});

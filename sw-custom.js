/* =========================================================
   🧠 SBS – Service Worker auto-update (mobile safe)
   ========================================================= */

import { precacheAndRoute } from "workbox-precaching";

// Precaching Vite / Workbox
precacheAndRoute(self.__WB_MANIFEST);

// =========================================================
// 🚀 INSTALL → active immédiatement + reload app
// =========================================================
self.addEventListener("install", () => {
  console.log("[SW] install → skipWaiting");
  self.skipWaiting();

  self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: "SW_UPDATED" });
      });
    });
});

// =========================================================
// ✅ ACTIVATE → claim + reload sécurité
// =========================================================
self.addEventListener("activate", (event) => {
  console.log("[SW] activate → claim");

  event.waitUntil(
    self.clients.claim().then(async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      clients.forEach((client) => {
        client.postMessage({ type: "SW_UPDATED" });
      });
    })
  );
});

// =========================================================
// 🔁 Compat (au cas où)
// =========================================================
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    console.log("[SW] skipWaiting forcé");
    self.skipWaiting();
  }
});

console.log("[SW] SBS AUTO UPDATE READY", Date.now());

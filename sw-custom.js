/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from "workbox-precaching"
import { registerRoute, NavigationRoute } from "workbox-routing"

declare let self: ServiceWorkerGlobalScope

// 🔥 Active immédiatement le nouveau SW
self.skipWaiting()
self.clients.claim()

// 🧹 Supprime anciens caches Workbox
cleanupOutdatedCaches()

// 📦 Precache automatique des fichiers générés par Vite
precacheAndRoute(self.__WB_MANIFEST)

// 🧭 Gestion SPA (toujours servir index.html precaché)
const handler = createHandlerBoundToURL("/index.html")

const navigationRoute = new NavigationRoute(handler, {
  denylist: [
    /^\/api\//,         // évite d'intercepter API
    /\/__/              // évite routes internes
  ],
})

registerRoute(navigationRoute)

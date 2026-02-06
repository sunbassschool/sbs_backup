import { precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching"
import { registerRoute } from "workbox-routing"
import { NetworkFirst, CacheFirst } from "workbox-strategies"

self.skipWaiting()
self.clients.claim()

precacheAndRoute(self.__WB_MANIFEST)

// SPA navigation avec fallback offline → index.html
registerRoute(
  ({ request }) => request.mode === "navigate",
  async ({ event }) => {
    try {
      return await new NetworkFirst({
        cacheName: "pages",
        networkTimeoutSeconds: 3,
      }).handle({ event })
    } catch {
      return await createHandlerBoundToURL("/index.html")({ event })
    }
  }
)

// assets → cache first
registerRoute(
  ({ request }) =>
    ["style", "script", "image", "font"].includes(request.destination),
  new CacheFirst({ cacheName: "assets" })
)

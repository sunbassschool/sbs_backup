// src/main.ts
import { createApp, watch, nextTick } from "vue"
import piniaPersist from "pinia-plugin-persistedstate"
import App from "@/App.vue"

import router from "./router"
import Toast from "vue-toastification"
import privilege from "@/directives/privilege"
import { createHead } from "@vueuse/head"

import "font-awesome/css/font-awesome.min.css"
import "vue-toastification/dist/index.css"
import "./assets/main.css"
import "bootstrap/dist/css/bootstrap.min.css"
import "@fortawesome/fontawesome-free/css/all.css"
import "bootstrap-icons/font/bootstrap-icons.css"
import { useToast } from "vue-toastification"

import { pinia } from "@/stores/pinia"
import { useAuthStore } from "@/stores/authStore.js"

import {
  verifyIndexedDBSetup,
  preventIndexedDBCleanup,
  checkIndexedDBStatus,
} from "@/utils/api.ts"

const initialPath = window.location.pathname

// ============================================================
// 🔐 GA4 – restore consent RGPD
// ============================================================
const restoreGaConsent = () => {
  const consent = localStorage.getItem("ga_consent")
  if (consent === "granted" && (window as any).gtag) {
    ;(window as any).gtag("consent", "update", {
      analytics_storage: "granted",
    })
  }
}

// ============================================================
// 🌍 Helpers globaux
// ============================================================
declare global {
  interface Window {
    vueRouterPush: (path: string) => void
    __HIDE_SPLASH__?: () => void
  }
}

window.vueRouterPush = (path: string) => {
  if (path) router.push(path)
}

// ============================================================
// 🛡️ Guard anti double mount
// ============================================================
let appMounted = false

// ============================================================
// 🔁 SW reload
// ============================================================
let pendingSWReload = false

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (e) => {
    if (e.data?.type === "SW_UPDATED") {
      pendingSWReload = true
    }
  })

  let swReloading = false
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (swReloading) return
    swReloading = true
    document.body.classList.add("sw-updating")
    setTimeout(() => location.reload(), 700)
  })
}

function getHome(authStore: any) {
  return ["prof", "admin"].includes(authStore.user?.role)
    ? "/dashboard-prof"
    : "/dashboard"
}

// ============================================================
// 🚀 INITIALISATION APP
// ============================================================
export async function initializeApp() {
  if (appMounted) return
  appMounted = true

  // --------------------------------------------------
  // IndexedDB (non bloquant)
  // --------------------------------------------------
  verifyIndexedDBSetup()
    .then(() => {
      preventIndexedDBCleanup()
      checkIndexedDBStatus()
    })
    .catch(() => {})

  const head = createHead()
  restoreGaConsent()

  const app = createApp(App)

  pinia.use(piniaPersist)
  app.use(pinia)

  const authStore = useAuthStore()

  if (import.meta.env.DEV) {
    ;(window as any).__auth = authStore
  }

  sessionStorage.removeItem("AUTH_ABORTED")

  // --------------------------------------------------
  // 🔐 INIT AUTH
  // --------------------------------------------------
  const authPromise = authStore.initAuth()

  app.use(head)
  app.use(router)

  await router.isReady()
  await authPromise

  // ⭐ REDIRECTION ROOT (UNE SEULE FOIS)
  if (initialPath === "/" && authStore.jwt) {
    router.replace(getHome(authStore))
  }

  // --------------------------------------------------
  // guestOnly (login / magic link)
  // --------------------------------------------------
  watch(
    () => authStore.authReady,
    (ready) => {
      if (!ready) return
      const route = router.currentRoute.value
      if (authStore.jwt && route.meta?.guestOnly) {
        router.replace(getHome(authStore))
      }
    }
  )

  // --------------------------------------------------
  // Onboarding élève (inchangé)
  // --------------------------------------------------
  watch(
    () => authStore.postAuthResolved,
    (done) => {
      if (!done) return

      const isProf = ["prof", "admin"].includes(authStore.user?.role)
      if (isProf) return

      const onboardingDone = authStore.user?.onboarding_done === true
      const path = router.currentRoute.value.path

      if (!onboardingDone && path !== "/onboarding") {
        router.replace("/onboarding")
      }

      if (onboardingDone && path === "/onboarding") {
        router.replace("/dashboard")
      }
    }
  )

  // --------------------------------------------------
  // UI / Plugins
  // --------------------------------------------------
  app.directive("privilege", privilege)
  app.use(Toast)
  const toast = useToast()

  app.mount("#app")

  // --------------------------------------------------
  // SW notif post-auth
  // --------------------------------------------------
  if (pendingSWReload) {
    toast.info("Nouvelle version disponible", {
      timeout: false,
      closeOnClick: true,
      onClose: () => location.reload(),
    })
  }
}

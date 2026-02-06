// src/main.ts
import { createApp,watch,nextTick } from "vue";
import piniaPersist from "pinia-plugin-persistedstate";
import App from "@/App.vue";

import router from "./router";
import Toast from "vue-toastification";
import privilege from "@/directives/privilege";
import { createHead } from '@vueuse/head'

import "font-awesome/css/font-awesome.min.css";
import "vue-toastification/dist/index.css";
import "./assets/main.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useToast } from "vue-toastification";

import { pinia } from "@/stores/pinia";
import { useAuthStore } from "@/stores/authStore.js";

import {
  verifyIndexedDBSetup,
  preventIndexedDBCleanup,
  checkIndexedDBStatus,
  isJwtExpired,
  safeIsJwtExpired,
} from "@/utils/api.ts";




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


/* ============================================================
   🌍 Helpers globaux
   ============================================================ */
declare global {
  interface Window {
    vueRouterPush: (path: string) => void;
    __HIDE_SPLASH__?: () => void;
  }
}

window.vueRouterPush = (path: string) => {
  if (path) router.push(path);
};

/* ============================================================
   🛡️ Guard anti double mount
   ============================================================ */
let appMounted = false;
// ===============================
// 🔁 AUTO RELOAD APRÈS MAJ SW
// ===============================
let pendingSWReload = false

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (e) => {
    if (e.data?.type === "SW_UPDATED") {
      console.log("🔄 SW update detected (deferred)")
      pendingSWReload = true
    }
  })
}

if ("serviceWorker" in navigator) {
  let swReloading = false

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (swReloading) return
    swReloading = true
    document.body.classList.add("sw-updating")
    setTimeout(() => location.reload(), 700)
  })
}


function canReloadForSW() {
  return !!navigator.serviceWorker.controller
}
function getHome(authStore: any) {
  return ["prof", "admin"].includes(authStore.user?.role)
    ? "/dashboard-prof"
    : "/dashboard"
}

/* ============================================================
   🚀 INITIALISATION APP (SAFE)
   ============================================================ */
/* ============================================================
   🚀 INITIALISATION APP (SAFE + FLOW CONSERVÉ)
   ============================================================ */
export async function initializeApp() {
  if (appMounted) return
  appMounted = true
if ("serviceWorker" in navigator) {
  const purged = localStorage.getItem("sw_purged_v1")
  if (!purged) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(reg => reg.unregister())
      localStorage.setItem("sw_purged_v1", "true")
    })
  }
}

  /* =====================================================
     IndexedDB (non bloquant)
  ===================================================== */
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
    ;(window as any).__auth = useAuthStore()
  }

  sessionStorage.removeItem("AUTH_ABORTED")

  // 🔐 init auth async
  const authPromise = authStore.initAuth()
watch(
  () => authStore.authReady,
  async (ready) => {
    if (!ready) return
    await router.isReady()

    const route = router.currentRoute.value
    if (authStore.jwt && route.meta?.guestOnly) {
      router.replace(getHome(authStore))
    }
  }
)


  /* =====================================================
     Router + Head
  ===================================================== */
  app.use(head)
  app.use(router)


  /* =====================================================
     🎯 REDIRECTION POST-AUTH (ROOT UNIQUEMENT)
     ❌ PAS d’onboarding ici
  ===================================================== */
  const auth = useAuthStore()
watch(
  () => authStore.postAuthResolved,
  async (done) => {
    if (!done) return

    const isProf = ["prof", "admin"].includes(authStore.user?.role)
    if (isProf) return // ⛔ PROF → CE WATCH NE FAIT RIEN

    const onboardingDone = authStore.user?.onboarding_done === true
    const path = router.currentRoute.value.path

    if (!onboardingDone && path !== "/onboarding") {
      router.replace("/onboarding")
      return
    }

    if (onboardingDone && path === "/onboarding") {
      router.replace("/dashboard")
    }
  }
)






let initialRouteResolved = false

router.isReady().then(() => {
  initialRouteResolved = true
})

authStore.$subscribe(
  (_mutation: any, state: any) => {  if (!state.isInitDone) return
  if (router.currentRoute.value.path !== "/") return
  router.replace(getHome(authStore))
}, { detached: true })




  /* =====================================================
     UI / Plugins
  ===================================================== */
  app.directive("privilege", privilege)
  app.use(Toast)
  const toast = useToast()

  app.mount("#app")

  /* =====================================================
     Splash / UI ready
  ===================================================== */
  const appEl = document.getElementById("app")
  let uiReady = false
  const SPLASH_MIN_DURATION = 700
  const splashStart = Date.now()

  const showUI = () => {
    if (uiReady) return
    uiReady = true

    const elapsed = Date.now() - splashStart
    const delay = Math.max(0, SPLASH_MIN_DURATION - elapsed)

    setTimeout(() => {
      document.body.classList.add("app-ready")
      appEl?.classList.add("app-visible")
      window.__HIDE_SPLASH__?.()


    }, delay)
  }

  /* =====================================================
     Scroll / Analytics
  ===================================================== */
  const LANDING_ROUTES = ["/", "/home", "/pricing", "/intro","offerpage","cours-de-basse-en-ligne"]

  const applyScrollMode = (path: string) => {
    const isLanding = LANDING_ROUTES.includes(path)

    document.documentElement.classList.toggle("landing-mode", isLanding)
    document.body.classList.toggle("landing-mode", isLanding)
    document.documentElement.classList.toggle("app-mode", !isLanding)
    document.body.classList.toggle("app-mode", !isLanding)

    if (!isLanding) {
      document.documentElement.style.overflow = "hidden"
      document.body.style.overflow = "hidden"
    } else {
      document.documentElement.style.overflow = ""
      document.body.style.overflow = ""
    }
  }

  applyScrollMode(router.currentRoute.value.path)

  router.afterEach((to) => {
    applyScrollMode(to.path)

    if (to.meta.layout === "landing") {
      requestAnimationFrame(() => {
        if (to.hash) return
        window.scrollTo(0, 0)
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
      })
    }

    if ((window as any).gtag) {
      ;(window as any).gtag("event", "page_view", {
        page_path: to.fullPath,
        page_title: document.title,
      })
    }
  })

  /* =====================================================
     Show UI when router ready
  ===================================================== */
  router.isReady().then(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(showUI)
    })
  })

  /* =====================================================
     Auth continue en arrière-plan
  ===================================================== */
  authPromise.then(() => {
    if (pendingSWReload) {
      pendingSWReload = false
      toast.info("Nouvelle version disponible", {
        timeout: false,
        closeOnClick: true,
        onClose: () => location.reload(),
      })
    }
  })
}




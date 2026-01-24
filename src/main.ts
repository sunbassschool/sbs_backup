// src/main.ts
import { createApp,watch } from "vue";
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
let uiReady = false

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


/* ============================================================
   🚀 INITIALISATION APP (SAFE)
   ============================================================ */
/* ============================================================
   🚀 INITIALISATION APP (SAFE + FLOW CONSERVÉ)
   ============================================================ */
export async function initializeApp() {

  if (appMounted) return
  appMounted = true

  // IndexedDB (non bloquant)
  verifyIndexedDBSetup()
    .then(() => {
      preventIndexedDBCleanup()
      checkIndexedDBStatus()
    })
    .catch(() => {})
const head = createHead()

  const app = createApp(App)

  pinia.use(piniaPersist)
  app.use(pinia)

  const authStore = useAuthStore()
  sessionStorage.removeItem("AUTH_ABORTED")

  // init auth (async)
  const authPromise = authStore.initAuth()

  // routes landing
  const LANDING_ROUTES = ["/", "/home", "/pricing", "/intro"]

 const applyScrollMode = (path: string) => {
  const isLanding = LANDING_ROUTES.includes(path)

  document.documentElement.classList.toggle("landing-mode", isLanding)
  document.body.classList.toggle("landing-mode", isLanding)
  document.documentElement.classList.toggle("app-mode", !isLanding)
  document.body.classList.toggle("app-mode", !isLanding)

  // 🔒 scroll UNIQUEMENT en app-mode
  if (!isLanding) {
    document.documentElement.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
  } else {
    document.documentElement.style.overflow = ""
    document.body.style.overflow = ""
  }
}

app.use(head)

  app.use(router)

  // redirection post-auth uniquement
const auth = useAuthStore()
auth.$subscribe(
  (_: unknown, state: any) => {
    if (!state.authReady) return

    const curPath = router.currentRoute.value.path as string
    if (curPath !== "/") return

    if (!state.jwt) {
      router.replace("/home")
      return
    }

    const role = state.user?.role
    if (!role) return

 const target: string =
  role === "prof" || role === "admin"
    ? "/dashboard-prof"
    : "/dashboard"

    if (curPath !== target) {
      router.replace(target)
    }
  },
  { detached: true }
)

  app.directive("privilege", privilege)
  app.use(Toast)
  const toast = useToast()

  // mount INVISIBLE
  app.mount("#app")

  const appEl = document.getElementById("app")

  let uiReady = false
  const showUI = () => {
    if (uiReady) return
    uiReady = true
    document.body.classList.add("app-ready")
    appEl?.classList.add("app-visible")
    window.__HIDE_SPLASH__?.()
  }

  // scroll mode dynamique
  applyScrollMode(router.currentRoute.value.path)
router.afterEach((to) => {
  if (to.meta.layout === "landing") {
    requestAnimationFrame(() => {
      // ✅ si ancre → on ne reset pas en haut
      if (to.hash) return

      window.scrollTo(0, 0)

      const app = document.getElementById("app")
      if (app) app.scrollTop = 0

      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    })
  }
})


  // attente auth + router AVANT affichage
  Promise.allSettled([authPromise, router.isReady()]).then(() => {
    showUI()

    // SW reload éventuel
    const stop = watch(
      () => authStore.authReady,
      (ready) => {
        if (!ready) return

        if (pendingSWReload) {
          pendingSWReload = false
          toast.info("Nouvelle version disponible", {
            timeout: false,
            closeOnClick: true,
            onClose: () => location.reload(),
          })
        }
      },
      { immediate: true }
    )
  })
}



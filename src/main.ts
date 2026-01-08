// src/main.ts
import { createApp } from "vue";
import piniaPersist from "pinia-plugin-persistedstate";
import App from "@/App.vue";

import router from "./router";
import Toast from "vue-toastification";

import "font-awesome/css/font-awesome.min.css";
import "vue-toastification/dist/index.css";
import "./assets/main.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { pinia } from "@/stores/pinia";
import { useAuthStore } from "@/stores/authStore.js";

import {
  verifyIndexedDBSetup,
  preventIndexedDBCleanup,
  checkIndexedDBStatus,
  isJwtExpired
} from "@/utils/api.ts";

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

/* ============================================================
   🚀 INITIALISATION APP
   ============================================================ */
export async function initializeApp() {
  if (appMounted) return
  appMounted = true

  // IndexedDB non bloquant
  verifyIndexedDBSetup()
    .then(() => {
      preventIndexedDBCleanup()
      checkIndexedDBStatus()
    })
    .catch(() => {})

  const app = createApp(App)

  pinia.use(piniaPersist)
  app.use(pinia)

  const authStore = useAuthStore()

  sessionStorage.removeItem("AUTH_ABORTED")

  // 🔍 état initial
  const hadJwt = !!authStore.jwt
  let jwtExpired = true
  try {
    if (hadJwt) jwtExpired = isJwtExpired(authStore.jwt)
  } catch {}

  // 🔐 démarre auth (refresh éventuel)
  const authPromise = authStore.initAuth()

  app.use(router)
  app.use(Toast)

  // 🚀 mount immédiat (invisible par défaut)
  app.mount("#app")

  const appEl = document.getElementById("app")
  appEl?.classList.remove("app-visible")

  // 🟢 JWT valide → UI immédiate, refresh en background
  if (hadJwt && !jwtExpired) {
    appEl?.classList.add("app-visible")
    window.__HIDE_SPLASH__?.()
  }

  // 🔐 JWT expiré / absent → on attend auth + router
  Promise.allSettled([authPromise, router.isReady()]).then(() => {
    document.body.classList.add("app-ready")
    appEl?.classList.add("app-visible")
    window.__HIDE_SPLASH__?.()
  })
}


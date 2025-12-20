import { createApp } from "vue";
import { saveSessionData } from "@/utils/AuthDBManager"
import piniaPersist from "pinia-plugin-persistedstate"
import App from "@/App.vue";
import { createPinia } from "pinia";

// 🔒 BOOTSTRAP SESSION AVANT VUE / PINIA (NON BLOQUANT)
const jwt = localStorage.getItem("jwt")
const refreshToken = localStorage.getItem("refreshToken")
const sessionId = localStorage.getItem("sessionId")

if (jwt && refreshToken && sessionId) {
  saveSessionData({ jwt, refreshToken, sessionId })
    .catch(() => {})
}

export const pinia = createPinia()
pinia.use(piniaPersist)

const app = createApp(App)
app.use(pinia)

import router from "./router";
declare global {
  interface Window {
    vueRouterPush: (path: string) => void
  }
}

// ✅ FONCTION GLOBALE SAFE
window.vueRouterPush = (path: string) => {
  if (path) router.push(path)
}

import { useAuthStore } from "@/stores/authStore.js";

// Ajoute ça :
type AnyStore = ReturnType<typeof useAuthStore> & Record<string, any>;

import Toast from 'vue-toastification';

import "font-awesome/css/font-awesome.min.css";
import "vue-toastification/dist/index.css";
import "./assets/main.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import {
  verifyIndexedDBSetup,
  preventIndexedDBCleanup,
  checkIndexedDBStatus
} from "@/utils/api.ts";

// ============================================================
// 🎸 SunBassSchool — Service Worker UI Helpers
// ============================================================
let deviceId = localStorage.getItem("device_id")
if (!deviceId) {
  deviceId = crypto.randomUUID()
  localStorage.setItem("device_id", deviceId)
}
export { deviceId }
function showUpdateToast(registration: ServiceWorkerRegistration) {
  let toast = document.getElementById("update-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "update-toast";
    toast.innerHTML = `
      <div class="update-toast-wrapper">
        <p>Nouvelle version disponible</p>
        <button id="update-btn">Mettre à jour</button>
      </div>
    `;
    document.body.appendChild(toast);

    const style = document.createElement("style");
    style.textContent = `
      #update-toast {
        position: fixed;
        bottom: 25px;
        right: 25px;
        background: #111;
        padding: 16px 22px;
        border-radius: 10px;
        color: white;
        border: 1px solid #ff4c4c33;
        box-shadow: 0 0 12px #ff4c4c55;
        z-index: 99999;
      }
      #update-btn {
        background: #ff4c4c;
        border: none;
        padding: 8px 14px;
        color: white;
        border-radius: 6px;
        cursor: pointer;
        margin-top: 8px;
      }
    `;
    document.head.appendChild(style);
  }

  toast.style.display = "block";
  const btn = document.getElementById("update-btn") as HTMLButtonElement | null;
  btn?.addEventListener("click", () => {
    registration.waiting?.postMessage({ type: "SKIP_WAITING" });
    window.location.reload();
  });
}

let swInstallStart = 0;
function showInstallingOverlay() {
  let overlay = document.getElementById("sw-install-overlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "sw-install-overlay";
    overlay.innerHTML = `
      <div class="sbs-sw-wrapper fade-in">
        <div class="sbs-loader"></div>
        <p class="sbs-text">Mise à jour SunBassSchool…</p>
      </div>
    `;
    document.body.appendChild(overlay);

    if (!document.getElementById("sw-install-style")) {
      const style = document.createElement("style");
      style.id = "sw-install-style";
      style.textContent = `
        #sw-install-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(12px);
          z-index: 999999999;
          opacity: 0;
          animation: fadeInOverlay 0.4s ease-out forwards;
        }
        .sbs-sw-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
        }
        .sbs-loader {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          border: 4px solid #ff4c4c33;
          border-top-color: #ff4c4c;
          animation: spin 1.2s cubic-bezier(.5, .1, .1, 1) infinite;
        }
        .sbs-text {
          color: #ff4c4c;
          font-size: 18px;
          font-family: Inter, sans-serif;
          opacity: 0.9;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOutOverlay { from { opacity: 1; } to   { opacity: 0; } }
      `;
      document.head.appendChild(style);
    }
  }
}

function hideOverlay() {
  const overlay = document.getElementById("sw-install-overlay");
  if (!overlay) return;
  overlay.style.animation = "fadeOutOverlay 0.4s ease-out forwards";
  setTimeout(() => overlay.remove(), 400);
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "sw-installing") {
      swInstallStart = Date.now();
      showInstallingOverlay();
    }

    if (event.data?.type === "sw-activated") {
      const elapsed = Date.now() - swInstallStart;
      const minVisible = 1200;
      const delay = elapsed < minVisible ? minVisible - elapsed : 0;
      setTimeout(() => hideOverlay(), delay);
    }

    if (event.data?.type === "sw-update-available") {
      // Optionnel : afficher notification
    }
  });

  navigator.serviceWorker.ready.then((registration) => {
    // 🔔 Affiche le toast si une mise à jour est déjà en attente
    if (registration.waiting) showUpdateToast(registration);

    // 🔄 Détection automatique d'une nouvelle version
    registration.addEventListener("updatefound", () => {
      const newSW = registration.installing;
      newSW?.addEventListener("statechange", () => {
        if (newSW.state === "installed" && navigator.serviceWorker.controller) {
          showUpdateToast(registration);
        }
      });
    });
  });
}


// ============================================================
// 🚀 INITIALISATION DE L'APP
// ============================================================

export async function initializeApp() {
  const loadingScreen = document.getElementById("loading-screen");
  const appContainer = document.getElementById("app");

  let dbReady = false;
  try {
    dbReady = await verifyIndexedDBSetup();
  } catch {}

  const jwt = localStorage.getItem("jwt");
  if (!dbReady && !jwt) return;

  if (dbReady) {
    preventIndexedDBCleanup();
    checkIndexedDBStatus();
  }

  // --- 1) Création App + Pinia ---
  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);

 const authStore = useAuthStore() as AnyStore;


  // --- 2) INIT AUTH AVANT ROUTER ---
  console.log("🚀 App init → lancement initAuth()");
  await authStore.initAuth();              // ← FIX CRITIQUE

  console.log("🟢 initAuth terminé, authReady =", authStore.authReady);

  // --- 3) Router + plugins ---
  app.use(router);
  app.use(Toast, { /* … */ });

  // --- 4) Mount ---
  await router.isReady();
  app.mount("#app");

  // --- 5) Loading screen ---
  requestAnimationFrame(() => {
    if (loadingScreen) loadingScreen.style.opacity = "0";
    setTimeout(() => {
      if (loadingScreen) loadingScreen.style.display = "none";
    }, 600);

    if (appContainer) appContainer.classList.add("app-visible");
  });
}



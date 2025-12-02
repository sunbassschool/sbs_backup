import { createApp, watch } from "vue";
import "font-awesome/css/font-awesome.min.css";
import { createPinia } from "pinia";
import App from "@/App.vue";
import router from "./router/index";
import Toast from 'vue-toastification';
import "vue-toastification/dist/index.css";
import "./assets/main.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.css";
import "bootstrap-icons/font/bootstrap-icons.css";
  const { useAuthStore } = await import("@/stores/authStore.js");
// ============================================================
// 🎸 SunBassSchool — Gestion Service Worker + UI Update
// ============================================================
const app = createApp(App);
app.use(Toast, {
  position: 'bottom-center',         // ✔️ au centre bas
  timeout: 3000,                     // ⏱️ 3s avant disparition auto
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  hideProgressBar: false,
  maxToasts: 3,
  newestOnTop: true,
  transition: 'Vue-Toastification__fade'
});
/* -----------------------------------------------------------
   🔥 1 — TOAST "Nouvelle version disponible"
----------------------------------------------------------- */
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
  if (!btn) return;

  btn.onclick = () => {
    registration.waiting?.postMessage({ type: "SKIP_WAITING" });
    window.location.reload();
  };
}

/* -----------------------------------------------------------
   🔥 2 — OVERLAY PREMIUM "Mise à jour en cours"
----------------------------------------------------------- */
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

  setTimeout(() => {
    overlay.remove();
  }, 400);
}

/* -----------------------------------------------------------
   🔥 3 — EVENT LISTENERS SW
----------------------------------------------------------- */
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
      // si jamais tu veux envoyer un message custom
    }
  });

  // Détection officielle via la registration
  navigator.serviceWorker.ready.then((reg) => {
    if (reg.waiting) showUpdateToast(reg);
  });
}

/* -----------------------------------------------------------
   🔥 4 — INITIALISATION APP
----------------------------------------------------------- */

import { verifyIndexedDBSetup, preventIndexedDBCleanup, checkIndexedDBStatus } from "@/utils/api.ts";
import { getCache } from "@/utils/cacheManager";

const loadingScreen = document.getElementById("loading-screen");
const appContainer = document.getElementById("app");

function finalizeApp() {
  if (loadingScreen) {
    loadingScreen.style.opacity = "0";
    setTimeout(() => loadingScreen.style.display = "none", 600);
  }
  if (appContainer) appContainer.classList.add("app-visible");
}

async function initializeApp() {
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

  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);


  const authStore = useAuthStore();
  await authStore.initAuth();

  app.use(router);
  app.mount("#app");

  router.isReady().then(() => {
    requestAnimationFrame(() => setTimeout(() => finalizeApp(), 0));
  });
}

export default initializeApp;

import { createApp } from "vue";
import { wakeCorsProxy } from "@/utils/cors";
import { createPinia } from "pinia"
const pinia = createPinia()
export const pinia = createPinia(); // 👈 à exporter
app.use(pinia);
// ⬇️ AJOUTE ICI
import { useAuthStore } from "@/stores/authStore.js"
window.authStore = useAuthStore(pinia)

import "font-awesome/css/font-awesome.min.css";
import { createPinia } from "pinia";
import App from "@/App.vue";
import router from "./router";
import "./assets/main.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { registerSW } from 'virtual:pwa-register';
import { verifyIndexedDBSetup, preventIndexedDBCleanup, checkIndexedDBStatus } from "@/utils/api";
import { getCache } from "@/utils/cacheManager";
const loadingScreen = document.getElementById("loading-screen");
const appContainer = document.getElementById("app");
// ✅ Fonction pour cacher l'écran de chargement
function finalizeApp() {
    console.log("🎉 Application prête !");
    setTimeout(() => {
        if (loadingScreen) {
            loadingScreen.style.transition = "opacity 0.6s ease-out";
            loadingScreen.style.opacity = "0";
            setTimeout(() => {
                loadingScreen.style.display = "none";
            }, 600);
        }
        if (appContainer) {
            appContainer.classList.add("app-visible");
        }
    }, 300);
}
// ✅ Initialisation principale
(async () => {
    console.log("🚀 Initialisation de l'application...");
    await wakeCorsProxy(); // ⚡ Réveil du proxy CORS
    const dbReady = await verifyIndexedDBSetup();
if (!dbReady) {
    console.error("❌ Échec de la préparation d'IndexedDB. Abandon.");
    if (appContainer) {
        appContainer.innerHTML = `
            <div style="text-align: center; margin-top: 3rem; font-size: 1.2rem; color: red;">
                ❌ Impossible de lancer l'application.<br>
                IndexedDB est corrompue ou absente.<br><br>
                <button onclick="window.location.reload()" style="
                    background-color: #d9534f;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    font-size: 1rem;
                    border-radius: 5px;
                    cursor: pointer;
                ">🔁 Réessayer</button>
            </div>
        `;
    }
    return;
}


    // 🔐 Protection session : garder IndexedDB vivante
    preventIndexedDBCleanup();
    checkIndexedDBStatus();
    // 🌐 Mode offline + données en cache ?

    const app = createApp(App);
    app.use(createPinia());
    app.use(router);
    app.mount("#app");
    router.isReady().then(() => {
        requestAnimationFrame(() => {
            // ⏳ Attendre pour lire la citation
            setTimeout(() => {
                finalizeApp();
            }, 5000);
        });
    });
    const updateSW = registerSW({
        onNeedRefresh() {
            console.log('⚠️ Nouvelle version dispo !');
            const toast = document.getElementById('sw-update-toast');
            const btn = document.getElementById('sw-reload-btn');
            if (toast && btn) {
                toast.style.display = 'block';
                btn.onclick = () => window.location.reload();
            }
        },
        onOfflineReady() {
            console.log('✅ App prête pour le mode hors-ligne !');
        },
    });
})();

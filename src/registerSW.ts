// src/registerSW.ts
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    // Demande à l'utilisateur de recharger
    if (confirm("💡 Une mise à jour est disponible. Recharger maintenant ?")) {
      updateSW(true); // force le skipWaiting et reload
    }
  },
  onOfflineReady() {
    console.log("📦 App ready for offline usage");
  },
});

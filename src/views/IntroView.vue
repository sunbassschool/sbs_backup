<template>
  <div class="intro-container">
    <!-- Logo en haut de la page -->
    <div class="logo-container">

      <img :src="logoUrl" alt="Logo SunBassSchool" class="sidebar-main-logo">
    </div>

    <!-- Spinner de chargement -->
    <div v-if="!showModal && !offlineMode" class="d-flex justify-content-center align-items-center" style="height: calc(100vh - 120px);">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
    </div>
<!-- bouton pour la mise a jour-->
 <div v-if="updateAvailable" class="update-banner">
  <p>🔄 Nouvelle version disponible.</p>
  <button @click="refreshApp" class="btn btn-sm btn-light">Mettre à jour</button>
</div>

    <!-- Mode hors ligne détecté -->
    <div v-if="offlineMode" class="offline-box">
      <p>⚠️ Mode hors ligne détecté. Chargement des données depuis le cache...</p>
      <button class="btn btn-secondary" @click="goToDashboard">Continuer</button>
    </div>

    <!-- Fenêtre d'intro -->
    <transition name="fade" appear>
      <div v-if="showModal" class="intro-box text-center p-4">
        <h1 class="title mb-3">Bienvenue sur <span class="highlight">SunBassSchool</span></h1>
        <p class="subtitle mb-4">Prépare-toi à plonger dans l'univers de la basse 🎸</p>
   <button
  class="btn btn-primary btn-lg start-button"
  @click="goToDashboard"
  :disabled="authLoading"
>
  <i class="bi bi-play-circle-fill me-2"></i>Commencer
</button>

      </div>
    </transition>
  </div>
  <!-- 🔄 Overlay pendant le refresh -->
<div v-if="showOverlay" class="refresh-overlay">
  <div class="spinner-container">
    <div class="loader"></div>
    <p class="loading-text">Connexion sécurisée en cours...</p>
  </div>
</div>

</template>

<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
import { watch, nextTick } from "vue";
import { registerSW } from 'virtual:pwa-register';

import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { preventIndexedDBCleanup, checkIndexedDBStatus } from "@/utils/api";
import { getCache } from "@/utils/cacheManager";
const store = useAuthStore();
const authLoading = computed(() => store.isRefreshingToken);
const router = useRouter();
const showModal = ref(false);
const offlineMode = ref(false);
const showOverlay = ref(false);

const baseUrl = import.meta.env.VITE_BASE_URL || "/app/";
const logoUrl = ref(`${baseUrl}images/logo.png`);
const updateAvailable = ref(false);

const updateSW = registerSW({
  onNeedRefresh() {
    updateAvailable.value = true;
  },
  onOfflineReady() {
    console.log("📦 Application prête hors ligne");
  },
});

const refreshApp = () => {
  updateSW(true); // 🔄 Force update + reload
};

onMounted(async () => {
  console.log("🚀 Début de l'initialisation de IntroView...");
  await store.loadUser(); // pour garantir que l'état initial est chargé

  // 🛡️ Maintenance session côté IndexedDB
  preventIndexedDBCleanup();
  checkIndexedDBStatus();

  // 📴 Mode hors ligne + données en cache ?
  if (!navigator.onLine && getCache("userData_sunny")) {
    console.warn("⚠️ Mode hors ligne activé, utilisation du cache...");
    offlineMode.value = true;
    return;
  }

  // ✅ Sinon on affiche la modale
  showModal.value = true;
});

// 🎬 Action au clic sur "Commencer"
const goToDashboard = async () => {
  showOverlay.value = true;

  // Si déjà en refresh, on attend la fin
  if (store.isRefreshingToken) {
    await new Promise((resolve) => {
     const stop = watch(() => store.isRefreshingToken, (val: any) => {
  if (!val) {
    stop();
    resolve(null);
  }
}, { immediate: true });

    });
  }

  // Petit délai pour éviter flash noir
  await nextTick();
  setTimeout(() => {
    sessionStorage.setItem("comingFromIntro", "true");
    router.replace("/dashboard");
  }, 100);
};




</script>

<style scoped>
.update-banner {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #f0ad4e;
  color: black;
  padding: 10px 20px;
  border-radius: 10px;
  box-shadow: 0 0 10px #000;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 10px;
}

.sidebar-main-logo {
  width: 110px;
  opacity: 0.9;
  transition: transform 0.3s ease;
}
.intro-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to bottom left, rgb(17, 9, 9), rgb(0, 0, 0));
}
.logo-container {
  position: absolute;
  top: 30px;
  display: flex;
  justify-content: center;
  width: 100%;
}
.logo {
  margin-top: 200px;
  width: 100px;
  height: auto;
}
.spinner-border {
  width: 2rem;
  height: 2rem;
  color: red !important;
}
.offline-box {
  text-align: center;
  color: white;
  background: rgba(245, 0, 0, 0.1);
  padding: 20px;
  border-radius: 10px;
}
.offline-box p {
  margin-bottom: 10px;
}
.intro-box {
  width: 450px;
  padding: 30px;
  margin-top:-8%;
  background: rgb(24, 24, 24);
  border-radius: 16px;
  border: 2px solid rgb(3, 3, 3);
  box-shadow: 0px 10px 40px rgba(0, 0, 0, 0.6);
  text-align: center;
}
.title {
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
}
.highlight {
  color: rgb(231, 54, 0);
}
.subtitle {
  font-size: 1.2rem;
  color: #d1d5db;
  margin-top: 10px;
}
.start-button {
  margin-top: 0px;
  padding: 12px 24px;
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
  background: rgb(143, 17, 0);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
}
.start-button:hover {
  background: rgb(207, 0, 0);
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 1s ease-in-out;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.intro-overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 1.2rem;
}

.overlay-text {
  margin-top: 12px;
}
.intro-overlay .spinner-border {
  width: 3rem;
  height: 3rem;
}
.refresh-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #001f3f; /* bleu foncé au lieu de noir */
  z-index: 99999;
  display: flex;
  justify-content: center;
  align-items: center;
}

</style>

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
import { useAuthStore } from "@/stores/authStore.js";
import { ref, onMounted, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import { registerSW } from "virtual:pwa-register";
import { preventIndexedDBCleanup, checkIndexedDBStatus } from "@/utils/api.ts";
import { getCache } from "@/utils/cacheManager";

const store = useAuthStore();
const router = useRouter();

const showModal = ref(false);
const offlineMode = ref(false);
const showOverlay = ref(false);
const updateAvailable = ref(false);

const authReady = computed(() => !!store.jwt && !!store.user);
const authLoading = computed(() => store.isRefreshingToken);

const baseUrl = import.meta.env.VITE_BASE_URL || "/app/";
const logoUrl = `${baseUrl}images/logo.png`;

const updateSW = registerSW({
  onNeedRefresh() {
    updateAvailable.value = true;
  },
});

const refreshApp = () => updateSW(true);

onMounted(async () => {
  preventIndexedDBCleanup();
  checkIndexedDBStatus();

  // 🚀 skip auto si déjà loggé
  if (authReady.value) {
    router.replace("/dashboard");
    return;
  }

  // 📴 offline + cache dispo
  const cacheKey = store.email ? `userData_${store.email}` : null;
  if (!navigator.onLine && cacheKey && getCache(cacheKey)) {
    offlineMode.value = true;
    return;
  }

  // 🎬 animation intro
  await nextTick();
  setTimeout(() => {
    showModal.value = true;
  }, 300);
});

const goToDashboard = async () => {
  if (offlineMode.value) {
    router.replace("/dashboard");
    return;
  }

  showOverlay.value = true;

  while (store.isRefreshingToken) {
    await new Promise(r => setTimeout(r, 50));
  }

  await nextTick();
  router.replace("/dashboard");
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
/* logo fade */
.logo-container {
  animation: fadeDown 0.8s ease-out forwards;
}

@keyframes fadeDown {
  from { opacity: 0; transform: translateY(-20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* intro slide up */
.fade-enter-active {
  transition: all 0.6s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

</style>

<template>
  <div class="app-container">

    <!-- 🔐 Logout loader -->
    <div v-if="showLogoutMessage" class="logout-container">
      <div class="logout-spinner"></div>
      <p class="logout-text">Déconnexion en cours...</p>
    </div>

    <router-view v-else />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore.js";
import { registerSW } from "virtual:pwa-register";
import { useMetronomeStore } from "@/stores/useMetronomeStore";

const auth = useAuthStore();
const showLogoutMessage = ref(false);

onMounted(() => {
  console.log("⏱️ UI affichée à", performance.now());

  window.addEventListener("show-logout-message", () => {
    showLogoutMessage.value = true;
    setTimeout(() => {
      showLogoutMessage.value = false;
    }, 1500);
  });

  window.addEventListener(
    "logout",
    async () => {
      if (!auth.isLoggingOut) {
        await auth.logout();
      }
    },
    { once: true }
  );

  registerSW({
    onNeedRefresh() {
      console.log("🔁 MAJ dispo");
    }
  });

  useMetronomeStore().initVisibilityRecovery();
});
</script>



<style scoped>
/* ============================================================================
   TRANSITIONS PAGE
   ============================================================================ */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ============================================================================
   LAYOUT GLOBAL
   ============================================================================ */
.app-container {
  background-color: black;
}

/* ============================================================================
   SPLASH SCREEN (initialisation)
   ============================================================================ */
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgb(0, 0, 0);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 9999;
  transition: opacity 0.3s ease-in-out;
}

/* ============================================================================
   LOGOUT LOADER (petite bulle)
   ============================================================================ */
.logout-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  border-radius: 40px;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  z-index: 9999;
  animation: fadeIn 0.2s ease-out;
}

.logout-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: #ff3300;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.logout-text {
  margin: 0;
  white-space: nowrap;
}

/* ============================================================================
   ANIMATIONS
   ============================================================================ */
@keyframes spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translate(-50%, -48%); }
  to   { opacity: 1; transform: translate(-50%, -50%); }
}
</style>

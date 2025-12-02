<template>
  <div class="app-container">

    <!-- Overlay pendant refresh -->
    <div v-if="showOverlay && !isUserNavigating" class="refresh-overlay">

      <div class="spinner-container">
        <div class="loader"></div>
        <p class="loading-text">Connexion sécurisée…</p>
      </div>
    </div>

   <!-- App normale -->
<router-view :key="$route.fullPath" />


<!-- 🟡 afficher juste un bandeau non-bloquant -->



  </div>
</template>




<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick, computed   } from "vue";
import { useAuthStore } from "@/stores/authStore.ts";
import { storeToRefs } from "pinia";
import MetronomeProvider from "@/components/MetronomeProvider.vue";
import { registerSW } from "virtual:pwa-register";
import { useMetronomeStore } from "@/stores/useMetronomeStore";
import router from "@/router";
import { isJwtValid, getValidToken } from "@/utils/api.ts";

const isUserNavigating = ref(false); // 💡 permet de savoir si l'utilisateur déclenche lui-même un changement de page

const auth = useAuthStore();
const { isRefreshingToken } = storeToRefs(auth);
const showOverlay = ref(false);

/* ========= INIT ========= */
const initializeApp = async () => {
  console.log("🚀 init PWA");
  await auth.initAuth();
};
const sidebarReady = computed(() => {
  return auth.isInitDone && !!auth.jwt;
});
/* ========= VISIBILITY HANDLER ========= */
async function handleVisibility() {

  if (auth.isLoggingOut) return;              // 🔥 Protection logout
  if (router.currentRoute.value.name === "login") return; // 🔥 Protection page login

  if (document.visibilityState !== "visible") return;

 const hasJwt = isJwtValid(auth.jwt);
  const hasRefresh = !!localStorage.getItem("refreshToken");




  if (auth.needsRefresh) {
    auth.triggerRefresh();
    return;
  }

  if (!hasJwt && hasRefresh) {
    auth.triggerRefresh();
    return;
  }
}
router.beforeEach((to, from, next) => {
  isUserNavigating.value = true;
  next();
});

onMounted(async () => {
  window.addEventListener("logout", async () => {
    console.log("📣 logout event reçu dans App.vue");
    if (!auth.isLoggingOut) {
      await auth.logout();
    }
  }, { once: true });

  registerSW({
    onNeedRefresh() {
      console.log("🔁 MAJ dispo");
    }
  });

  useMetronomeStore().initVisibilityRecovery();
  document.addEventListener("visibilitychange", handleVisibility);



  // ✅ Ne plus appeler `initializeApp()` ici → le router gère `initAuth`
});

router.afterEach(() => {
  // petit délai pour laisser le refresh se terminer
  setTimeout(() => {
    isUserNavigating.value = false;
  }, 500);
});



/* ========= UNMOUNT ========= */
onUnmounted(() => {
  document.removeEventListener("visibilitychange", handleVisibility);
});

/* ========= WATCH ========= */
watch(isRefreshingToken, (val) => {
  showOverlay.value = val;
});
watch(
  () => auth.isInitDone,
  (ready) => {
    if (ready) {
      const splash = document.getElementById("loading-screen");
      if (splash) {
        splash.classList.add("fade-out");
        setTimeout(() => splash.remove(), 600);
      }
    }
  },
  { immediate: true }
);
</script>


<style scoped>
.non-blocking-loader {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
  z-index: 10001;   /* <-- supérieur au splash */
  animation: fadeIn 0.3s ease;
  pointer-events: none; /* ne bloque pas les clics */
}


@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.app-container
{
  background-color: black;
}

.loading-screen,
.refresh-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.3); /* Fond semi-transparent */
  backdrop-filter: blur(6px); /* Le flou magique */
  -webkit-backdrop-filter: blur(6px); /* Pour Safari */
  z-index: 9999;
  transition: opacity 0.3s ease-in-out;
}

.spinner-container {
  text-align: center;
  color: white;
}

.loader {
  width: 28px;
  height: 28px;
  border: 4px solid rgba(255,255,255,0.2);
  border-top: 4px solid #ff3300;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  margin-top: 10px;
  opacity: 0.9;
  font-size: .9rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

</style>

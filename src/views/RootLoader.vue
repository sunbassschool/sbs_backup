<script setup>
import { watchEffect } from "vue"
import { useAuthStore } from "@/stores/authStore"
import { useRouter } from "vue-router"

const auth = useAuthStore()
const router = useRouter()

watchEffect(() => {
  // ⛔ attendre auth complètement prêt
  if (!auth.authReady) return

  // invité
  if (!auth.jwt) {
    router.replace("/cours-de-basse-en-ligne")
    return
  }

  // rôle encore indéfini → attendre
  if (!auth.user?.role) return

  const isProf = ["prof", "admin"].includes(auth.user.role)

  // PROF
  if (isProf) {
    router.replace("/dashboard-prof")
    return
  }

  // ÉLÈVE
  const cachedOnboarding =
    localStorage.getItem("onboarding_done") === "true"

  router.replace(cachedOnboarding ? "/dashboard" : "/onboarding")
})
</script>




<template>
 <div class="root-loader">
  </div>

</template>
<style scoped>
.root-loader {
  position: fixed;
  inset: 0;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.logo {
  width: 90px;      /* ajuste si besoin */
  max-width: 60vw;
  height: auto;
}
.logo {
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}

</style>

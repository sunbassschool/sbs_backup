<script setup>
import { useAuthStore } from "@/stores/authStore"

const auth = useAuthStore()

// ❌ plus de watch
// ❌ plus de router
// ✅ juste un écran "loading / splash"
</script>


<template>
  <div class="root-loader">
    <img src="/logo.png" alt="Logo" class="logo" />
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

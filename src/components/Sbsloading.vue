<template>
  <div class="sbs-loading" :class="variant">
    <div class="spinner"></div>
    <p v-if="label" class="label">{{ label }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  label: {
    type: String,
    default: "Chargement…"
  },
  variant: {
    type: String,
    default: "default" // default | compact | fullscreen
  }
})
</script>

<style scoped>
.sbs-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px 16px;
  color: rgba(255,255,255,0.85);
}

.sbs-loading.compact {
  padding: 16px 8px;
  gap: 8px;
}

.sbs-loading.fullscreen {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(2px);
  z-index: 9999;
}

.label {
  font-size: 13px;
  color: #cfd3dc;
  opacity: 0.85;
  letter-spacing: .3px;
  animation: fadePulse 1.2s ease-in-out infinite;
}

@keyframes fadePulse {
  0%, 100% { opacity: .4 }
  50% { opacity: .9 }
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,.15);
  border-top-color: #e63946;
  border-radius: 50%;
  animation: spin .8s linear infinite;
}

p {
  margin-top: 6px;
  font-size: 13px;
  color: #ffffff;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

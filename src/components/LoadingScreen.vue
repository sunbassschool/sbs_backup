<template>
  <div class="logout-container-wrapper">
    <div class="logout-container">
      <div class="logout-spinner"></div>
      <p class="logout-text">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: "Chargement de ton compte..."
  }
});
</script>

<style scoped>
.logout-container-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  min-height: 200px;
}
.logout-container {
  text-align: center;
}
.logout-spinner {
  width: 28px;
  height: 28px;
  border: 4px solid rgba(0,0,0,0.2);
  border-top: 4px solid #333;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}
.logout-text {
  font-size: 0.9rem;
  color: #666;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

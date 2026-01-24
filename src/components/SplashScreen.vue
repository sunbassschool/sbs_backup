<template>
  <div class="splash">
    <div class="logo">SBS</div>
    <div class="spinner"></div>
  </div>
</template>

<style scoped>
.splash {
  position: fixed;
  inset: 0;
  background: #0f1115; /* dark premium */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.logo {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #ffffff;
  margin-bottom: 20px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255,255,255,0.15);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

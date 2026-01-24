<template>
  <teleport to="body">
    <div class="admin-modal-overlay" @click.self="$emit('close')">
      <div class="admin-modal">
        <button class="close" @click="$emit('close')">✕</button>
        <slot />
      </div>
    </div>
  </teleport>
</template>
<style scoped>
.admin-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.admin-modal {
  background: #121212;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow: auto;
  border-radius: 12px;
  padding: 20px;
}
.close {
  position: absolute;
  top: 12px;
  right: 12px;
}

</style>

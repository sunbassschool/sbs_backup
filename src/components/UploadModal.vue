<template>
  <teleport to="body">
<div class="sbs-modal-overlay" @click.self="emit('close')">
  <div class="sbs-modal" @click.stop>
    <div class="sbs-modal-header">
      <h4>📎 Envoyer un fichier</h4>
      <button class="close-btn" @click="emit('close')">✕</button>
    </div>

<UploadFileCore
  :eleve-id="eleveId"
  :cours-id="coursId"
  v-bind="folderId ? { folderId } : {}"
  @uploaded="handleUploaded"
    @done="emit('close')"   

/>





  </div>
</div>
  </teleport>
</template>

<script setup>
import { useAuthStore } from "@/stores/authStore"
import UploadFileCore from "@/components/UploadFileCore.vue"

defineProps({
  coursId: {
    type: String,
    default: ""
  },
  folderId: {
    type: String,
    default: ""
  },
  eleveId: {
    type: String,
    default: ""
  }
})




const emit = defineEmits(["close", "uploaded"])

const handleUploaded = (upload) => {
  emit("uploaded", upload)
  // ❌ ne pas fermer ici
}



const auth = useAuthStore()
</script>


<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
  z-index: 9999;

  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #1a1a1a;
  color: #fff;
  width: 100%;
  max-width: 420px;
  padding: 20px;
  border-radius: 12px;
}


/* 🌑 Overlay */
.sbs-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  z-index: 9999;

  display: flex;
  align-items: center;
  justify-content: center;

  animation: overlayFade 0.18s ease-out;
}

/* 📦 Box */
.sbs-modal {
  background: #141414;
  color: #fff;
  width: 100%;
  max-width: 420px;
  border-radius: 14px;
  padding: 18px 18px 20px;

  box-shadow: 0 12px 40px rgba(0,0,0,0.45);
  border: 1px solid rgba(255,255,255,0.06);

  animation: modalPop 0.2s ease-out;
}

/* 🔝 Header */
.sbs-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.sbs-modal-header h4 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #ffb347;
}

/* ❌ Close */
.close-btn {
  background: transparent;
  border: none;
  color: #aaa;
  font-size: 1.1rem;
  cursor: pointer;
}

.close-btn:hover {
  color: #fff;
}

/* 🎞 Animations */
@keyframes modalPop {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes overlayFade {
  from { opacity: 0; }
  to   { opacity: 1; }
}



</style>
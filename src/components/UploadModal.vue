<template>
  <teleport to="body">
    <div class="sbs-modal-overlay" @click.self="emit('close')">

      <!-- 🔥 WRAPPER REQUIS PAR TON CSS -->
      <div class="sbs-modal">

        <!-- HEADER -->
        <header class="sbs-modal-header">
          <span class="sbs-modal-title">Ajouter des fichiers</span>
          <button class="sbs-close-btn" @click="emit('close')">✕</button>
        </header>

        <!-- BODY -->
        <section class="sbs-modal-body">
         <label
  class="sbs-dropzone"
  :class="{ 'drag-active': isDragging }"
  @dragenter.prevent="isDragging = true"
  @dragleave.prevent="isDragging = false"
  @dragover.prevent
  @drop.prevent.stop="isDragging = false; onDrop($event)"
>
  <input
    id="upload-input"
    type="file"
    multiple
    hidden
    @change="onSelect"
  />

  <div class="drop-icon">⬆️</div>
  <div class="drop-text">Clique ou glisse tes fichiers ici</div>
  <div class="drop-sub">PDF, images, audio, vidéo</div>
</label>

        </section>

      </div>
    </div>
  </teleport>
</template>



<script setup>
import { ref } from "vue"

const emit = defineEmits(["close", "files-selected"])
const isDragging = ref(false)

const onDrop = (e) => {
  const files = Array.from(e.dataTransfer.files || [])
  if (!files.length) return

  emit("files-selected", files)
  emit("close")
}

const onSelect = (e) => {
  const files = Array.from(e.target.files || [])
  if (!files.length) return

  emit("files-selected", files)
  emit("close")
}
</script>






<style scoped>
/* =====================================================
   🌑 SBS MODAL — PREMIUM DARK (APPLE-LIKE)
   ===================================================== */

/* =====================================================
   🫧 OVERLAY
   ===================================================== */
.sbs-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;

  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(14px) saturate(120%);
}

/* =====================================================
   📦 MODAL CONTAINER
   ===================================================== */
.sbs-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  display: flex;
  flex-direction: column;

  width: min(480px, calc(100vw - 32px));
  padding: 18px 18px 22px;

  background:
    radial-gradient(120% 120% at 0% 0%, rgba(255,255,255,.045), transparent 40%),
    linear-gradient(180deg, #181818, #0d0d0d);

  color: #f2f2f2;

  border-radius: 22px;
  border: 1px solid rgba(255,255,255,.10);

  box-shadow:
    0 35px 90px rgba(0,0,0,.90),
    inset 0 1px 0 rgba(255,255,255,.04);

  animation: sbsModalIn .22s cubic-bezier(.22,1,.36,1);
}

/* =====================================================
   🧭 HEADER
   ===================================================== */
.sbs-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding-bottom: 14px;
  margin-bottom: 18px;

  border-bottom: 1px solid rgba(255,255,255,.08);
}

/* =====================================================
   🏷️ TITLE
   ===================================================== */
.sbs-modal-title {
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: .3px;
  color: #facc15;
}

/* =====================================================
   ✖ CLOSE BUTTON
   ===================================================== */
.sbs-close-btn {
  all: unset;

  width: 34px;
  height: 34px;
  border-radius: 50%;

  display: grid;
  place-items: center;

  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.14);

  color: #d6d6d6;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;

  transition:
    background .15s ease,
    border-color .15s ease,
    transform .15s ease,
    color .15s ease;
}

.sbs-close-btn:hover {
  background: rgba(255,255,255,.14);
  border-color: rgba(255,255,255,.25);
  color: #fff;
}

.sbs-close-btn:active {
  transform: scale(.92);
}

/* =====================================================
   📄 BODY
   ===================================================== */
.sbs-modal-body {
  display: flex;
  justify-content: center;
}

/* =====================================================
   📥 DROPZONE
   ===================================================== */
.sbs-dropzone {
  width: 100%;
  padding: 36px 22px;
  border-radius: 18px;

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  background: rgba(255,255,255,.025);
  border: 2px dashed rgba(255,255,255,.14);

  cursor: pointer;
  user-select: none;

  transition:
    border-color .18s ease,
    background .18s ease,
    transform .18s ease,
    box-shadow .18s ease;
}

/* Hover */
.sbs-dropzone:hover {
  border-color: #facc15;
  background: rgba(250,204,21,.07);
}

/* Drag actif */
.sbs-dropzone.drag-active {
  border-color: #facc15;
  background: rgba(250,204,21,.14);
  box-shadow: 0 0 0 3px rgba(250,204,21,.18);
}

/* Focus clavier */
.sbs-dropzone:focus-within {
  outline: none;
  border-color: #facc15;
  box-shadow: 0 0 0 2px rgba(250,204,21,.25);
}

/* Click */
.sbs-dropzone:active {
  transform: scale(.985);
}

/* =====================================================
   🧩 DROPZONE CONTENT
   ===================================================== */
.drop-icon {
  font-size: 1.9rem;
  opacity: .9;

  transition:
    transform .2s ease,
    opacity .2s ease;
}

.sbs-dropzone:hover .drop-icon {
  transform: translateY(-2px);
  opacity: 1;
}

.drop-text {
  font-weight: 500;
}

.drop-sub {
  font-size: .85rem;
  color: #a9a9a9;
}

/* =====================================================
   ✨ ANIMATIONS
   ===================================================== */
@keyframes sbsModalIn {
  from {
    opacity: 0;
    transform: translate(-50%, -46%) scale(.94);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>


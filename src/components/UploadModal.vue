<template>
  <teleport to="body">
    <div class="sbs-modal-overlay" @click.self="emit('close')">
      <div class="sbs-modal">
        <header class="sbs-modal-header">
          <div class="sbs-modal-title">
            📎 Ajouter des fichiers
          </div>
          <button class="sbs-close-btn" @click="emit('close')">✕</button>
        </header>

        <section class="sbs-modal-body">
          <label class="sbs-dropzone">
            <input
              type="file"
              multiple
              @change="onSelect"
              hidden
            />
            <div class="drop-icon">⬆️</div>
            <div class="drop-text">
              Clique ou glisse tes fichiers ici
            </div>
            <div class="drop-sub">
              PDF, images, audio, vidéo
            </div>
          </label>
        </section>
      </div>
    </div>
  </teleport>
</template>


<script setup>
const emit = defineEmits(["close", "files-selected"])

const onSelect = (e) => {
  const files = Array.from(e.target.files || [])
  if (!files.length) return

  console.log("🟢 UploadModal → files selected", files)

  // 🔥 on transmet les fichiers AU PARENT
  emit("files-selected", files)

  // 🔥 on ferme la modale
  emit("close")
}
</script>






<style scoped>
/* ===== Overlay ===== */
.sbs-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(0,0,0,.75);
  backdrop-filter: blur(12px);
}

/* ===== Modal ===== */
.sbs-modal {
    display: flex;
  flex-direction: column;

  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  width: min(480px, calc(100vw - 32px));
  background: linear-gradient(180deg, #181818, #0f0f0f);
  color: #f2f2f2;

  border-radius: 20px;
  padding: 18px 18px 22px;

  border: 1px solid rgba(255,255,255,.08);
  box-shadow: 0 40px 90px rgba(0,0,0,.85);

  animation: sbsModalIn .2s cubic-bezier(.22,1,.36,1);
}

/* ===== Header ===== */
.sbs-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding-bottom: 14px;
  margin-bottom: 16px;

  border-bottom: 1px solid rgba(255,255,255,.08);
}


.sbs-modal-title {
  font-weight: 600;
  font-size: 1.05rem;
  color: #facc15;
}

/* ===== Close ===== */
.sbs-close-btn {
  all: unset;

  width: 32px;
  height: 32px;
  border-radius: 50%;

  display: grid;
  place-items: center;

  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.14);

  cursor: pointer;
  line-height: 1;
  font-size: 16px;
  font-weight: 500;

  color: #ddd;
}


.sbs-close-btn:hover {
  background: rgba(255,255,255,.18);
  color: #fff;
}

/* ===== Body ===== */
.sbs-modal-body {
  display: flex;
  justify-content: center;
}

/* ===== Dropzone ===== */
.sbs-dropzone {
  width: 100%;
  padding: 34px 20px;
  border-radius: 16px;

  border: 2px dashed rgba(255,255,255,.15);
  background: rgba(255,255,255,.02);

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  cursor: pointer;
  transition: all .18s ease;
}

.sbs-dropzone:hover {
  border-color: #facc15;
  background: rgba(250,204,21,.06);
}

.drop-icon {
  font-size: 1.8rem;
}

.drop-text {
  font-weight: 500;
}

.drop-sub {
  font-size: .85rem;
  color: #aaa;
}

/* ===== Animation ===== */
@keyframes sbsModalIn {
  from {
    opacity: 0;
    transform: translate(-50%, -46%) scale(.95);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}



</style>

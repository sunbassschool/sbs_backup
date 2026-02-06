<script setup lang="ts">
import { ref, watch, toRefs } from "vue"
import { gasPost } from "@/config/gas.ts"
import ProfPreviewModal from "@/components/ProfPreviewModal.vue"
import { prefetchPublicProfs } from "@/utils/publicProfs"

const props = defineProps<{ open: boolean }>()
const { open } = toRefs(props)
const previewProf = ref<any | null>(null)

const emit = defineEmits<{
  (e: "update:open", v: boolean): void
  (e: "select", prof: any): void
  (e: "skip"): void
}>()

const profs = ref<any[]>([])
const loading = ref(false)

watch(open, (v) => {
  if (v && !profs.value.length && !loading.value) fetchProfs()
})

async function fetchProfs() {
  loading.value = true
  profs.value = await prefetchPublicProfs()
  loading.value = false
}


function selectProf(p: any) {
  emit("select", p)          // remonte
  previewProf.value = null   // ferme preview
  emit("update:open", false) // ferme modal
}



function skip() {
  emit("skip")
  emit("update:open", false)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="spm-overlay">
      <div class="spm-modal">

        <header class="spm-header">
          <h3>Choisis ton prof</h3>
          <p>Sélection personnalisée. Modifiable à tout moment.</p>
        </header>

        <div v-if="loading" class="spm-loading">
          <span class="loader" />
          <span>Chargement</span>
        </div>

        <div v-else class="spm-grid">
          <button
            v-for="p in profs"
            :key="p.prof_id"
            class="spm-card"
@click="previewProf = p"
          >
            <div class="spm-avatar">
              <img
                v-if="p.logo_url"
                :src="p.logo_url"
                alt=""
                @error="p.logo_url = null"
              />
              <span v-else>{{ p.prenom?.[0]?.toUpperCase() }}</span>
            </div>

            <div class="spm-info">
              <div class="spm-name">{{ p.prenom }}</div>
              <div v-if="p.specialites" class="spm-spe">
                {{ p.specialites }}
              </div>
            </div>
          </button>
        </div>

        <footer class="spm-footer">
          <button class="ghost" @click="skip">
            Continuer sans choisir
          </button>
        </footer>

      </div>
    </div>
  </Teleport>
  <ProfPreviewModal
  v-if="previewProf"
  :prof="previewProf"
  @close="previewProf = null"
  @select="selectProf"
/>

</template>

<style>
/* ===== THEME ===== */
:root {
  --bg-0: #050505;
  --bg-1: #0b0b0b;
  --bg-2: #121212;

  --border: #262626;
 /* 🔥 TEXTE PLUS CLAIR */
  --text-main: #f5f7fa;     /* quasi blanc */
  --text-soft: #c9cdd3;     /* gris clair lisible */

  --accent: #6aa7ff;        /* bleu plus lumineux */
  --accent-glow: rgba(106,167,255,.45);
}

/* ===== OVERLAY ===== */
.spm-overlay {
  position: fixed;
  inset: 0;
  z-index: 2147483646;
  background: radial-gradient(
    circle at top,
    rgba(255,255,255,.04),
    rgba(0,0,0,.9)
  );
  backdrop-filter: blur(12px);
  display: grid;
  place-items: center;
}

/* ===== MODAL ===== */
.spm-modal {
  width: min(920px, 92vw);
  max-height: 86vh;
  overflow-y: auto;
  background: linear-gradient(180deg, var(--bg-2), var(--bg-0));
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 28px;
  color: var(--text-main);
  box-shadow:
    0 40px 120px rgba(0,0,0,.75),
    inset 0 1px 0 rgba(255,255,255,.04);
}

/* ===== HEADER ===== */
.spm-header {
  text-align: center;
  margin-bottom: 26px;
}
.spm-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -.02em;
}
.spm-header p {
  margin-top: 6px;
  font-size: .9rem;
  color: var(--text-soft);
}


.spm-header p,
.spm-spe,
.spm-loading {
  color: var(--text-soft);
}
.spm-card {
  background: linear-gradient(
    180deg,
    rgba(255,255,255,.06),
    rgba(255,255,255,.01)
  );
}

.spm-name {
  color: var(--text-main);
}
/* hover encore plus lisible */
.spm-card:hover .spm-name {
  color: #ffffff;
}
/* ===== LOADING ===== */
.spm-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 60px 0;
  color: var(--text-soft);
}
.loader {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #2a2a2a;
  border-top-color: var(--accent);
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== GRID ===== */
.spm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 18px;
}

/* ===== CARD ===== */
.spm-card {
  background:
    linear-gradient(180deg, rgba(255,255,255,.03), transparent);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 18px 16px 20px;
  cursor: pointer;
  text-align: center;
  transition: all .25s ease;
}
.spm-card:hover {
  transform: translateY(-6px);
  border-color: var(--accent);
  box-shadow:
    0 20px 40px rgba(0,0,0,.6),
    0 0 0 1px var(--accent-glow);
}

/* ===== AVATAR ===== */
/* ===== AVATAR ===== */
.spm-avatar {
  width: 96px;
  height: 96px;
  margin: 0 auto 12px;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
  display: grid;
  place-items: center;

  background:
    radial-gradient(
      circle at top,
      rgba(255,255,255,.12),
      rgba(255,255,255,.02)
    ),
    linear-gradient(135deg, #1b1b1b, #0d0d0d);

  border: 1px solid #2a2a2a;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.08),
    0 8px 24px rgba(0,0,0,.6);
}

/* image */
.spm-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* fallback initiale */
.spm-avatar span {
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: -.02em;
  color: #ffffff;
  z-index: 1;
}

/* glow discret premium */
.spm-avatar::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 20%,
    rgba(106,167,255,.35),
    transparent 60%
  );
  opacity: .6;
  pointer-events: none;
}


/* ===== INFO ===== */
.spm-name {
  font-size: 1.05rem;
  font-weight: 600;
}
.spm-spe {
  margin-top: 6px;
  font-size: .8rem;
  color: var(--text-soft);
  line-height: 1.3;
}

/* ===== FOOTER ===== */
.spm-footer {
  margin-top: 26px;
  text-align: center;
}
.spm-footer .ghost {
  background: none;
  border: none;
  color: var(--text-soft);
  font-size: .85rem;
  cursor: pointer;
}
.spm-footer .ghost:hover {
  color: var(--text-main);
}

/* ===== MOBILE ===== */
@media (max-width: 640px) {
  .spm-modal {
    padding: 20px 14px; /* réduit les côtés */
  }

  .spm-grid {
    grid-template-columns: repeat(2, 1fr); /* ❗️2 colonnes, pas 3 */
    gap: 12px;
  }

  .spm-card {
    padding: 14px 10px 16px;
  }

  .spm-avatar {
    width: 72px;
    height: 72px;
    font-size: 1.1rem;
  }

  .spm-spe {
    display: none;
  }
}

</style>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue"

const props = defineProps<{
  prof: any
}>()

const emit = defineEmits<{
  (e: "close"): void
  (e: "select", prof: any): void
}>()

function close() {
  emit("close")
}

function select() {
  emit("select", props.prof)
}


function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") close()
}

onMounted(() => window.addEventListener("keydown", onKey))
onUnmounted(() => window.removeEventListener("keydown", onKey))
</script>

<template>
  <Teleport to="body">
    <div class="ppm-overlay" @click.self="close">
      <div class="ppm-modal">

        <header class="ppm-header">
          <div class="ppm-avatar">
            <img
              v-if="prof.logo_url"
              :src="prof.logo_url"
              alt=""
              @error="prof.logo_url = null"
            />
            <span v-else>{{ prof.prenom?.[0]?.toUpperCase() }}</span>
          </div>

          <h3>{{ prof.prenom }}</h3>

          <div class="ppm-badges">
            <span v-if="prof.discipline" class="badge">
              {{ prof.discipline }}
            </span>
            <span v-if="prof.plan === 'premium'" class="badge premium">
              Premium
            </span>
          </div>
        </header>

        <section class="ppm-body">
          <p v-if="prof.bio || prof.description">
            {{ prof.bio || prof.description }}
          </p>

          <div v-if="prof.specialites" class="ppm-meta">
            <strong>Spécialités</strong>
            <span>{{ prof.specialites }}</span>
          </div>

          <a
            v-if="prof.site_web"
            :href="`https://${prof.site_web.replace(/^https?:\/\//,'')}`"
            target="_blank"
            class="ppm-link"
          >
            Site du prof
          </a>
        </section>

        <footer class="ppm-footer">
          <button class="ghost" @click="close">
            Retour
          </button>
          <button class="primary" @click="select">
            Choisir ce prof
          </button>
        </footer>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ===== OVERLAY ===== */
.ppm-overlay {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  background: rgba(0,0,0,.75);
  backdrop-filter: blur(10px);
  display: grid;
  place-items: center;
}

/* ===== MODAL DESKTOP ===== */
.ppm-modal {
  width: min(520px, 92vw);
  background: linear-gradient(180deg, #141414, #070707);
  border: 1px solid #262626;
  border-radius: 22px;
  padding: 26px;
  color: #f5f7fa;
  box-shadow: 0 40px 120px rgba(0,0,0,.8);
  animation: pop .25s ease;
}

@keyframes pop {
  from { opacity: 0; transform: scale(.96); }
  to   { opacity: 1; transform: scale(1); }
}

/* ===== HEADER ===== */
.ppm-header {
  text-align: center;
}
.ppm-avatar {
  width: 96px;
  height: 96px;
  margin: 0 auto 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1b1b1b, #0b0b0b);
  border: 1px solid #2a2a2a;
  display: grid;
  place-items: center;
  font-size: 1.6rem;
  font-weight: 700;
}
.ppm-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
.ppm-header h3 {
  margin: 6px 0 8px;
  font-size: 1.4rem;
}

/* ===== BADGES ===== */
.ppm-badges {
  display: flex;
  justify-content: center;
  gap: 8px;
}
.badge {
  font-size: .7rem;
  padding: 4px 8px;
  border-radius: 999px;
  background: #1e1e1e;
  color: #cfd3da;
}
.badge.premium {
  background: rgba(106,167,255,.15);
  color: #6aa7ff;
}

/* ===== BODY ===== */
.ppm-body {
  margin-top: 18px;
  font-size: .9rem;
  color: #cfd3da;
  line-height: 1.5;
}
.ppm-meta {
  margin-top: 14px;
  font-size: .8rem;
}
.ppm-meta strong {
  display: block;
  color: #fff;
  margin-bottom: 4px;
}
.ppm-link {
  display: inline-block;
  margin-top: 16px;
  font-size: .8rem;
  color: #6aa7ff;
}

/* ===== FOOTER ===== */
.ppm-footer {
  margin-top: 24px;
  display: flex;
  gap: 12px;
}
.ppm-footer button {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
}
.ghost {
  background: #141414;
  border: 1px solid #2a2a2a;
  color: #cfd3da;
}
.primary {
  background: linear-gradient(135deg, #6aa7ff, #4f8cff);
  border: none;
  color: #000;
}

/* ===== MOBILE : BOTTOM SHEET ===== */
@media (max-width: 640px) {

  .ppm-modal {
    width: 100%;
    border-radius: 22px 22px 0 0;
    animation: slideUp .25s ease;
  }
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }
}
</style>

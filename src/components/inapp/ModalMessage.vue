<!-- src/components/inapp/ModalMessage.vue -->
<script setup lang="ts">
import { onMounted } from "vue"
onMounted(() => console.log("✅ [ModalMessage] mounted"))
defineProps<{
  message: any
  lock?: boolean
}>()

const emit = defineEmits(["dismiss", "cta", "cta-secondary"])
</script>

<template>
  <teleport to="body">
<div
  class="inapp-overlay"
  @click.self="!lock && emit('dismiss')"
>      <div class="inapp-modal">
        <h3>{{ message.content.title }}</h3>

        <div class="body">
          <p>{{ message.content.body }}</p>
        </div>

        <div class="actions">
          <button
            v-if="message.content.cta?.label"
            class="btn primary"
            @click="emit('cta')"
          >
            {{ message.content.cta.label }}
          </button>
<button
  v-if="message.content?.cta?.secondary?.label"
  class="btn secondary"
  @click="emit('cta-secondary')"
>
  {{ message.content.cta.secondary.label }}
</button>
    <button
  v-if="!lock"
  class="btn secondary"
  @click="emit('dismiss')"
>
  Fermer
</button>

        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.inapp-overlay {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at top, rgba(255,255,255,.04), transparent 60%),
    rgba(0,0,0,.72);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
}

.inapp-modal {
  position: relative;
  background:
    linear-gradient(180deg, #18181d 0%, #0d0d11 100%);
  color: #fff;
  padding: 26px 26px 22px;
  width: min(440px, 92vw);
  max-height: 82vh;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border: 1px solid rgba(255,255,255,.08);
  box-shadow:
    0 40px 120px rgba(0,0,0,.85),
    inset 0 1px 0 rgba(255,255,255,.05);
  animation: modalEnter .35s cubic-bezier(.22,.61,.36,1);
}

/* glow subtil */
.inapp-modal::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    rgba(255,255,255,.12),
    transparent 40%,
    transparent 60%,
    rgba(255,255,255,.08)
  );
  opacity: .35;
  pointer-events: none;
}

h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: .35px;
}

.body {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.body p {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.65;
  color: #d3d3db;
  white-space: pre-line;
}

/* scrollbar clean */
.body::-webkit-scrollbar {
  width: 4px;
}
.body::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,.15);
  border-radius: 4px;
}

/* actions */
.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 14px;
  border-top: 1px solid rgba(255,255,255,.07);
}

/* boutons */
.btn {
  height: 44px;
  padding: 0 20px;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
}

/* CTA principal */
.btn.primary {
  background: linear-gradient(135deg, #ffffff 0%, #e6e6e6 100%);
  color: #000;
  box-shadow:
    0 8px 30px rgba(255,255,255,.25),
    inset 0 -1px 0 rgba(0,0,0,.15);
}

.btn.primary:hover {
  transform: translateY(-2px);
  box-shadow:
    0 12px 40px rgba(255,255,255,.35);
}

/* secondaire */
.btn.secondary {
  background: rgba(255,255,255,.06);
  color: #fff;
  border: 1px solid rgba(255,255,255,.14);
}

.btn.secondary:hover {
  background: rgba(255,255,255,.12);
}

/* animation */
@keyframes modalEnter {
  from {
    opacity: 0;
    transform: translateY(10px) scale(.94);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.inapp-overlay {
  animation: overlayFade .25s ease;
}

@keyframes overlayFade {
  from { opacity: 0 }
  to { opacity: 1 }
}

</style>

<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="open" class="legal-overlay" @click.self="close">

        <div class="legal-modal">
          <button class="legal-close" @click="close">✕</button>

          <div class="legal-content">

            <component :is="currentComponent" />

          </div>

        </div>

      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from "vue"
import MentionsLegales from "@/components/legal/MentionsLegales.vue"
import PolitiqueConfidentialite from "@/components/legal/PolitiqueConfidentialite.vue"
import CGV from "@/components/legal/CGV.vue"

const props = defineProps<{
  open: boolean
  type: "mentions" | "privacy" | "cgv"
}>()

const emit = defineEmits(["close"])

const close = () => emit("close")

const currentComponent = computed(() => {
  if (props.type === "mentions") return MentionsLegales
  if (props.type === "privacy") return PolitiqueConfidentialite
  return CGV
})
</script>

<style>
/* ===== OVERLAY ===== */

.legal-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

/* ===== MODAL ===== */

.legal-modal {
  width: 100%;
  max-width: 950px;
  max-height: 85vh;
  overflow-y: auto;

  background: linear-gradient(180deg, #121218, #0d0d12);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px;
  padding: 3rem 2.5rem;

  box-shadow: 0 40px 100px rgba(0,0,0,0.8);
  position: relative;
}

/* ===== CLOSE ===== */

.legal-close {
  position: absolute;
  top: 18px;
  right: 20px;
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #aaa;
  cursor: pointer;
}

.legal-close:hover {
  color: #f59e0b;
}

/* ===== CONTENT ===== */

.legal-content {
  color: #f8fafc;
  line-height: 1.8;
}

.legal-content h1 {
  font-size: 1.8rem;
  font-weight: 900;
  margin-bottom: 1.5rem;
}

.legal-content h2 {
  font-size: 1.2rem;
  margin-top: 2rem;
  color: #f59e0b;
}

.legal-content p,
.legal-content li {
  color: #d1d5db;
  margin-top: 0.8rem;
}

/* ===== ANIMATION ===== */

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

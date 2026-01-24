<template>
  <div class="upgrade-backdrop" @click.self="close">
    <div class="upgrade-modal">
      <h3>Fonction réservée</h3>
      <p>
        Cette fonctionnalité nécessite le plan
        <strong>{{ planLabel }}</strong>.
      </p>

      <div class="actions">
        <button class="btn-secondary" @click="close">Plus tard</button>
        <button class="btn-primary" @click="goUpgrade">
          Passer Pro
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/authStore"

const router = useRouter()
const auth = useAuthStore()

const planLabel = computed(() => {
  const map = {
    pro: "Pro",
    studio: "Studio"
  }
  return map[auth.upgradeCTA?.privilege] || "supérieur"
})

const close = () => {
  auth.hideUpgradeCTA()
}

const goUpgrade = () => {
  close()
  router.push("/pricing")
}
</script>

<style scoped>
.upgrade-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.upgrade-modal {
  background: #0b0b0f;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  padding: 1.2rem;
  width: 90%;
  max-width: 360px;
  text-align: center;
}

.upgrade-modal h3 {
  margin-bottom: 0.5rem;
}

.upgrade-modal p {
  opacity: 0.85;
  font-size: 0.9rem;
}

.actions {
  display: flex;
  gap: 0.6rem;
  margin-top: 1rem;
}

.btn-primary {
  flex: 1;
  background: #7c3aed;
  color: white;
  border: none;
  padding: 0.6rem;
  border-radius: 10px;
}

.btn-secondary {
  flex: 1;
  background: transparent;
  color: #aaa;
  border: 1px solid rgba(255,255,255,0.15);
  padding: 0.6rem;
  border-radius: 10px;
}
</style>

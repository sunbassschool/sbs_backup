<template>
  <div class="subs-overlay" @click.self="close">
    <div class="subs-modal">
      <header class="subs-header">
        <h5>Mes abonnements</h5>
        <button class="subs-close" @click="close">✕</button>
      </header>

      <div class="subs-body">
        <div v-if="loading" class="center">Chargement…</div>

        <div v-else-if="!subs.length" class="center muted">
          Aucun abonnement actif
          <AppCTA class="w-100 justify-content-center" />

        </div>

        <div
          v-for="s in subs"
          :key="s.subscription_id"
          class="subs-item"
        >
          <div class="fw-bold">
            {{ s.product_id || "Abonnement" }}
          </div>

          <span class="badge">
            {{ s.cancel_at_period_end ? "Résiliation programmée" : "Actif" }}
          </span>

          <button
            v-if="!s.cancel_at_period_end"
            class="danger"
            @click="onCancel(s)"
            :disabled="busy"
          >
            Résilier
          </button>
        </div>
      </div>

      <footer class="subs-footer">
        <button class="secondary" @click="close">Fermer</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue"
import { useAuthStore } from "@/stores/authStore.js"
import {
  getActiveSubscriptions,
  cancelSubscription
} from "@/utils/api/subscriptions.api.ts"
import { clearSubsCache } from "@/utils/subscriptionsCache.ts"
import AppCTA from "@/components/ui/AppCTA.vue"

const emit = defineEmits(["close"])
const auth = useAuthStore()

const subs = ref<any[]>([])
const loading = ref(true)
const busy = ref(false)

function close() {
  emit("close")
}

async function load() {
  loading.value = true
  const res = await getActiveSubscriptions(auth.user.email)
  subs.value = res?.items || []
  loading.value = false
}

async function onCancel(sub: any) {
  if (!confirm("Confirmer la résiliation ?")) return
  busy.value = true
  await cancelSubscription(sub.subscription_id, sub.stripe_account_id)
  clearSubsCache(auth.user.email)
  await load()
  busy.value = false
}

onMounted(() => {
  document.body.style.overflow = "hidden"
  load()
})

onUnmounted(() => {
  document.body.style.overflow = ""
})
</script>

<style scoped>
.subs-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0,0,0,.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.subs-modal {
  background: #0b0c0f;
  width: 92%;
  max-width: 520px;
  border-radius: 16px;
  padding: 18px;
}

.subs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.subs-close {
  background: none;
  border: none;
  color: #fb923c;
  font-size: 1.3rem;
  cursor: pointer;
}

.subs-body {
  max-height: 60vh;
  overflow: auto;
  margin-top: 12px;
}

.subs-item {
  border: 1px solid #1f1f22;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
}

.center {
  text-align: center;
}

.muted {
  color: #9ca3af;
}

.badge {
  display: inline-block;
  margin: 6px 0;
  padding: 4px 10px;
  border-radius: 999px;
  background: #16a34a;
  font-size: 12px;
}

.danger {
  background: #ef4444;
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.secondary {
  background: #333;
  border: none;
  color: white;
  padding: 8px 14px;
  border-radius: 8px;
}

.subs-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>

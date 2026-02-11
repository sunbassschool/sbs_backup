<!-- src/views/LeadAccess.vue -->
<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useInAppMessageStore } from "@/stores/inAppMessageStore"

const route = useRoute()
const router = useRouter()
const inapp = useInAppMessageStore()

const dismissed = ref(false)
const productId = route.query.pid as string | undefined

function retry() {
  if (!productId) return
  dismissed.value = false

  inapp.emitEvent("lead_click", {
    product_id: productId,
    source: "lead_fallback"
  })
}

function goHome() {
  router.push("/cours-de-basse-en-ligne")
}

onMounted(async () => {
  if (!productId) {
    dismissed.value = true
    return
  }

  await inapp.fetchMessages(true)

  const msg = inapp.emitEvent("lead_click", {
    product_id: productId,
    source: "lead_email"
  })

  // si aucun inapp trouvé → fallback
  if (!msg) {
    dismissed.value = true
  }
})
</script>

<template>
  <div class="lead-access">
    <p v-if="!dismissed">
      Chargement de ton contenu…
    </p>

    <div v-else class="fallback">
      <h3>Ton contenu est toujours disponible 🎸</h3>

      <button class="btn primary" @click="retry">
        Accéder au contenu
      </button>

      <button class="btn secondary" @click="goHome">
        Découvrir les cours
      </button>
    </div>
  </div>
</template>

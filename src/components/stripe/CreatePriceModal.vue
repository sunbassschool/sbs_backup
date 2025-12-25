<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-card">
      <h3>➕ Nouvelle price</h3>

      <form @submit.prevent="submit">
        <!-- MODE -->
        <label>
          Type
          <select v-model="mode">
            <option value="subscription">Abonnement</option>
            <option value="one_time">Paiement unique</option>
          </select>
        </label>

        <!-- AMOUNT -->
        <label>
          Montant (€)
          <input
            type="number"
            min="1"
            step="1"
            v-model.number="amountEuro"
            placeholder="ex : 30"
          />
        </label>

        <!-- SUBSCRIPTION -->
        <label v-if="mode === 'subscription'">
          Fréquence
          <select v-model="interval">
            <option value="month">Mensuel</option>
            <option value="year">Annuel</option>
          </select>
        </label>

        <!-- ONE TIME -->
        <label v-if="mode === 'one_time'">
          Durée d’accès (jours)
          <input
            type="number"
            min="1"
            step="1"
            v-model.number="durationDays"
            placeholder="ex : 90"
          />
        </label>

        <p v-if="error" class="error">❌ {{ error }}</p>

        <div class="actions">
          <button type="button" class="btn secondary" @click="close">
            Annuler
          </button>

          <button class="btn" :disabled="loading">
            <span v-if="!loading">Créer</span>
            <span v-else class="spinner"></span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { useAuthStore } from "@/stores/authStore"
import { getValidToken } from "@/utils/api"
import { getProxyPostURL } from "@/config/gas"

const props = defineProps({
  productId: { type: String, required: true }
})

const emit = defineEmits(["created", "close"])

const auth = useAuthStore()
const proxyUrl = getProxyPostURL()

const mode = ref("subscription")
const amountEuro = ref(null)
const interval = ref("month")
const durationDays = ref(null)

const loading = ref(false)
const error = ref("")

const amountCents = computed(() =>
  amountEuro.value ? Math.round(amountEuro.value * 100) : null
)

const close = () => emit("close")

const submit = async () => {
  error.value = ""

  if (!amountCents.value || amountCents.value <= 0) {
    error.value = "Montant invalide"
    return
  }

  if (mode.value === "one_time" && (!durationDays.value || durationDays.value <= 0)) {
    error.value = "Durée invalide"
    return
  }

  console.group("💰 CreatePriceModal → submit")
  loading.value = true

  try {
    const jwt = await getValidToken()

    const payload = {
      route: "createprice",
      jwt,
      prof_id: auth.user.prof_id,
      product_id: props.productId,
      mode: mode.value,
      amount: amountCents.value,
      currency: "eur"
    }

    if (mode.value === "subscription") {
      payload.interval = interval.value
    }

    if (mode.value === "one_time") {
      payload.duration_days = durationDays.value
    }

    console.log("➡️ payload =", payload)

    const res = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(r => r.json())

    console.log("⬅️ response =", res)

    if (!res.success) {
      error.value = "Erreur lors de la création de la price"
      return
    }

    emit("created")
    close()

  } catch (e) {
    console.error("❌ create price error", e)
    error.value = "Erreur réseau"
  } finally {
    loading.value = false
    console.groupEnd()
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  background: #121212;
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
}

h3 {
  margin-bottom: 12px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.9em;
  margin-bottom: 12px;
}

input,
select {
  background: #1e1e1e;
  border: 1px solid #2c2c2c;
  border-radius: 6px;
  padding: 8px;
  color: #fff;
}

input::placeholder {
  color: #777;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.error {
  color: #e74c3c;
  font-size: 0.9em;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

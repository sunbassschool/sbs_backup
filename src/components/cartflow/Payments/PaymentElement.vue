<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import { loadStripe } from "@stripe/stripe-js"

const props = defineProps<{
  clientSecret: string
  mode: "payment" | "setup"   // payment = one_time, setup = subscription
}>()

const emit = defineEmits<{
  (e: "success", payload: any): void
  (e: "error", message: string): void
}>()

const stripe = ref<any>(null)
const elements = ref<any>(null)
const loading = ref(false)
const mounted = ref(false)

const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLIC_KEY

const mountElement = async () => {
  stripe.value = await loadStripe(STRIPE_PK)
  if (!stripe.value) {
    emit("error", "Stripe non initialisé")
    return
  }

elements.value = stripe.value.elements({
  clientSecret: props.clientSecret,
  appearance: { theme: "night" }

})




  const paymentElement = elements.value.create("payment")
  paymentElement.mount("#payment-element")
}

watch(
  () => props.clientSecret,
  (cs) => {
    if (cs) mountElement()
  },
  { immediate: true }
)


watch(() => props.clientSecret, async (cs) => {
  if (!cs || mounted.value) return
})

const confirm = async () => {
  if (!stripe.value || !elements.value) return
  loading.value = true

  try {
    let res
    if (props.mode === "payment") {
      res = await stripe.value.confirmPayment({
        elements: elements.value,
        redirect: "if_required"
      })
    } else {
      res = await stripe.value.confirmSetup({
        elements: elements.value,
        redirect: "if_required"
      })
    }

    if (res.error) {
      emit("error", res.error.message || "Paiement refusé")
    } else {
      emit("success", res)
    }
  } catch (e: any) {
    emit("error", e.message || "Erreur paiement")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="payment-wrapper">
    <div id="payment-element" />

    <button
      class="pay-btn"
      :disabled="loading"
      @click="confirm"
    >
      <span v-if="!loading">Payer</span>
      <span v-else>Traitement…</span>
    </button>
  </div>
</template>

<style scoped>
.payment-wrapper {
  margin-top: 24px;
}

.pay-btn {
  margin-top: 20px;
  width: 100%;
  padding: 14px;
  border-radius: 10px;
  border: none;
  background: #0d6efd;
  color: white;
  font-weight: 600;
  font-size: 16px;
}
</style>

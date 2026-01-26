<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from "vue"
import { loadStripe } from "@stripe/stripe-js"

const props = defineProps<{
  clientSecret: string
  mode: "payment" | "setup"
}>()

const emit = defineEmits<{
  (e: "success", payload: any): void
  (e: "error", message: string): void
}>()

const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLIC_KEY

const stripe = ref<any>(null)
const elements = ref<any>(null)
const paymentElement = ref<any>(null)
const loading = ref(false)
const mounted = ref(false)

// ✅ AJOUTE ÇA
const destroy = () => {
  try {
    paymentElement.value?.unmount?.()
  } catch (e) {}
  paymentElement.value = null
  elements.value = null
  stripe.value = null
  mounted.value = false
}

const mountElement = async () => {
  if (mounted.value) return
  if (!props.clientSecret) return

  mounted.value = true

  stripe.value = await loadStripe(STRIPE_PK)
  if (!stripe.value) {
    emit("error", "Stripe non initialisé")
    return
  }

  elements.value = stripe.value.elements({
    clientSecret: props.clientSecret,
    appearance: { theme: "night" }
  })

  paymentElement.value = elements.value.create("payment")
  paymentElement.value.mount("#payment-element")
}

watch(
  () => props.clientSecret,
  (cs) => {
    if (cs) mountElement()
  },
  { immediate: true }
)

const confirm = async () => {
  if (loading.value) return
  if (!stripe.value || !elements.value) {
    emit("error", "Stripe non prêt")
    return
  }

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
  redirect: "if_required",
  confirmParams: {
    return_url: `${window.location.origin}/thankyou?pending=1&email=${encodeURIComponent(resolvedEmail.value)}`
  }
})


    }

    if (res?.error) {
      emit("error", res.error.message || "Paiement refusé")
      return
    }

    // ✅ ICI : on démonte Stripe AVANT d’émettre success
    destroy()

    emit("success", {
      setupIntent: res.setupIntent ?? null,
      paymentIntent: res.paymentIntent ?? null
    })

  } catch (e: any) {
    emit("error", e.message || "Erreur paiement")
  } finally {
    loading.value = false
  }
}

// ✅ et ici aussi
onBeforeUnmount(() => {
  destroy()
})
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

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue"
import { loadStripe } from "@stripe/stripe-js"

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY

const props = defineProps<{
  clientSecret: string
}>()

const loading = ref(true)
const error = ref<string | null>(null)
const emit = defineEmits(["success"])

const stripe = ref<any>(null)
const elements = ref<any>(null)
onMounted(async () => {
  console.log("🟣 EmbeddedCheckout mounted")
  console.log("🔐 clientSecret =", props.clientSecret)

  try {
    stripe.value = await loadStripe(STRIPE_PUBLIC_KEY)
    console.log("🟢 stripe loaded", stripe.value)
    console.log(import.meta.env.VITE_STRIPE_PUBLIC_KEY)


    elements.value = stripe.value.elements({
      clientSecret: props.clientSecret,
      appearance: { theme: "stripe" },
      locale: "fr"
    })

    console.log("🧩 elements created", elements.value)

    await nextTick()

    const el = elements.value.create("payment")
    console.log("🧱 payment element =", el)

    el.mount("#payment-element")
    console.log("✅ payment element mounted")

    loading.value = false
  } catch (e: any) {
    console.error("❌ EmbeddedCheckout error", e)
    error.value = e.message
    loading.value = false
  }
})


const confirmPayment = async () => {
  if (!stripe.value || !elements.value) return

  loading.value = true
  const result = await stripe.value.confirmPayment({
    elements: elements.value,
    redirect: "if_required"
  })
if (result.paymentIntent?.status === "succeeded") {
  emit("success", result.paymentIntent)
  loading.value = false
}

  if (result.error) {
    error.value = result.error.message
    loading.value = false
  }
}
</script>
<template>
  <div class="embedded-checkout">

    <!-- LOADING -->
    <div v-if="loading" class="checkout-loading">
      <div class="spinner"></div>
      <p>Chargement sécurisé du paiement…</p>
    </div>

    <!-- ERROR -->
    <div v-if="error" class="checkout-error">
      {{ error }}
    </div>

    <!-- STRIPE -->
    <div id="payment-element" class="payment-element" />

    <!-- CTA -->
<button
  v-if="!loading"
  class="checkout-cta"
  @click="confirmPayment"
>
  <span class="cta-main">Payer </span>
</button>

  </div>
</template>

<style scoped>
.embedded-checkout {
  margin-top: 1.2rem;
}

/* ===== LOADING ===== */
.checkout-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  padding: 2rem 1rem;
  color: var(--muted);
  font-size: 0.9rem;
}

.spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.12);
  border-top-color: var(--accent);
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== ERROR ===== */
.checkout-error {
  background: rgba(248,113,113,0.1);
  border: 1px solid rgba(248,113,113,0.35);
  color: #f87171;
  border-radius: 12px;
  padding: 0.6rem 0.8rem;
  font-size: 0.85rem;
  margin-bottom: 0.8rem;
}

/* ===== STRIPE ELEMENT ===== */
.payment-element {
  margin-top: 0.6rem;
}

/* ===== CTA ===== */
.checkout-cta {
  margin-top: 1rem;
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 0.3px;
}

/* ===== NOTE ===== */
.checkout-note {
  margin-top: 0.8rem;
  text-align: center;
  font-size: 0.75rem;
  color: var(--muted);
}

/* ===== CTA PAYMENT ===== */
.checkout-cta {
  width: 100%;
  margin-top: 1.2rem;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;

  padding: 0.9rem 1rem;
  border-radius: 16px;

  background: linear-gradient(
    180deg,
    #fbbf24,
    var(--accent)
  );

  color: #000;
  border: none;
  cursor: pointer;

  font-weight: 900;
  letter-spacing: 0.2px;

  box-shadow:
    0 8px 20px rgba(245,158,11,0.35),
    inset 0 -1px 0 rgba(0,0,0,0.15);

  transition:
    transform .15s ease,
    box-shadow .15s ease,
    filter .15s ease;
}

/* hover desktop */
@media (hover: hover) {
  .checkout-cta:hover {
    transform: translateY(-1px);
    filter: brightness(1.05);
    box-shadow:
      0 12px 30px rgba(245,158,11,0.45),
      inset 0 -1px 0 rgba(0,0,0,0.2);
  }
}

/* active click */
.checkout-cta:active {
  transform: translateY(0);
  box-shadow:
    0 6px 14px rgba(245,158,11,0.35),
    inset 0 2px 4px rgba(0,0,0,0.25);
}

/* text */
.cta-main {
  font-size: 1.05rem;
}

.cta-sub {
  font-size: 0.7rem;
  font-weight: 600;
  opacity: 0.75;
}

/* disabled state (si un jour) */
.checkout-cta:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

</style>


<template>
  <div class="price-card">
    <div>
      <strong>
        {{ label }}
      </strong>
    </div>

    <button class="btn" @click="pay">
      Payer
    </button>
  </div>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  price: { type: Object, required: true }
})

const label = computed(() => {
  if (props.price.mode === "subscription") {
    return `${props.price.amount / 100} € / ${props.price.interval}`
  }
  return `${props.price.amount / 100} € (paiement unique)`
})

const pay = () => {
  console.log("💳 payer price =", props.price.price_id)
  // 👉 on branchera createCheckoutSessionMultiProf juste après
}
</script>

<style scoped>
.price-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid rgba(255,255,255,0.08);
}
</style>

<script setup lang="ts">
defineProps<{
  offer: {
    product_name: string
    amount: number
    currency: string
  }
}>()

defineEmits(["pay"])
</script>

<template>
  <div class="offer-recap">
    <h3>Récapitulatif</h3>
    <div class="line">
      <span>{{ offer.product_name }}</span>
      <strong>{{ (offer.amount / 100).toFixed(2) }} €</strong>
    </div>

   <button
  class="btn btn-primary w-100 mt-3"
  @click="() => { console.log('🟢 CLICK PAY'); $emit('pay') }"
>
  Payer
</button>

  </div>
</template>

<style scoped>
.offer-recap {
  border-top: 1px solid #333;
  padding-top: 12px;
}
.line {
  display: flex;
  justify-content: space-between;
}
</style>

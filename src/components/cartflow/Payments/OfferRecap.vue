<script setup lang="ts">
defineProps<{
  offer: {
    product_name: string
    amount: number
    currency: string
    pricing_mode: "subscription" | "one_time"
    interval?: "month" | "year"
    duration_days?: number
  }
}>()

defineEmits(["pay"])

</script>

<template>
  <div class="offer-recap">
    <h3>3 . Récapitulatif</h3>

    <div class="line main">
      <span>{{ offer.product_name }}</span>
      <strong>
        {{ (offer.amount / 100).toFixed(2) }} €
        <template v-if="offer.pricing_mode === 'subscription'">
          / {{ offer.interval === 'year' ? 'an' : 'mois' }}
        </template>
      </strong>
    </div>

    <div class="line muted" v-if="offer.pricing_mode === 'subscription'">
      <template v-if="offer.duration_days">
        Engagement {{ offer.duration_days }} jours
      </template>
      <template v-else>
        Sans engagement
      </template>
    </div>

    <div class="line muted" v-else>
      Paiement unique · Accès immédiat
    </div>

    <div class="line guarantee">
      ✔ Garantie satisfait ou remboursé 14 jours
    </div>

    <button
      class="btn btn-primary w-100 mt-3"
      @click="$emit('pay')"
    >
      Payer
    </button>
  </div>
</template>


<style scoped>
.offer-recap {
  margin-top: 0.8rem;
  padding-top: 0.8rem;
  border-top: 1px solid rgba(255,255,255,0.12);

  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.offer-recap h3 {
  font-size: 0.9rem;
  font-weight: 800;
  margin-bottom: 0.4rem;
}

.line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.line.main strong {
  font-size: 1rem;
  font-weight: 900;
}

.line.muted {
  font-size: 0.75rem;
  color: var(--muted);
}

.line.guarantee {
  margin-top: 0.4rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent);
}

</style>

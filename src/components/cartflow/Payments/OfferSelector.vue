<script setup lang="ts">
defineProps<{
  offers: Array<{
    product_id: string
    product_name: string
    description?: string
    amount: number
    currency: string
  }>
  modelValue: any
  loading?: boolean
}>()


defineEmits(["update:modelValue"])
</script>

<template>
  <div class="offer-selector">

    <!-- LOADING SKELETON -->
    <div v-if="loading" class="skeleton-list">
      <div class="skeleton-card" v-for="n in 3" :key="n">
        <div class="skeleton-left">
          <span class="skeleton-line title"></span>
          <span class="skeleton-line text"></span>
        </div>
        <div class="skeleton-price"></div>
      </div>
    </div>

<!-- aucune offre -->
 <div v-else-if="offers.length === 0" class="empty-state">
  Aucune offre disponible pour le moment
</div>

    <!-- OFFERS -->
    <div
      v-else
      v-for="o in offers"
      :key="o.product_id"
      class="offer-card"
      :class="{ active: modelValue?.product_id === o.product_id }"
      @click="$emit('update:modelValue', o)"
    >
      <div class="offer-main">
        <h4>{{ o.product_name }}</h4>
        <p v-if="o.description">{{ o.description }}</p>
      </div>

      <div class="offer-price">
        <span class="amount">{{ (o.amount / 100).toFixed(2) }} €</span>
        <span class="hint">accès immédiat</span>
      </div>
    </div>

  </div>
</template>



<style scoped>
.offer-selector {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

/* CARD */
.offer-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;

  background: linear-gradient(180deg, var(--panel), var(--panel-soft));
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 1rem 1.2rem;

  cursor: pointer;
  transition:
    border-color .2s ease,
    background .2s ease,
    transform .15s ease,
    box-shadow .15s ease;
}

/* HOVER */
@media (hover: hover) {
  .offer-card:hover {
    border-color: rgba(245,158,11,0.35);
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.35);
  }
}

/* ACTIVE (sélectionnée) */
.offer-card.active {
  border-color: var(--accent);
  background:
    linear-gradient(180deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04)),
    linear-gradient(180deg, var(--panel), var(--panel-soft));
  box-shadow:
    0 0 0 1px rgba(245,158,11,0.25),
    0 12px 30px rgba(0,0,0,0.45);
}

/* LEFT */
.offer-main h4 {
  font-size: 1rem;
  font-weight: 800;
  margin: 0 0 0.2rem;
}

.offer-main p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted);
  line-height: 1.4;
}

/* RIGHT */
.offer-price {
  text-align: right;
  flex-shrink: 0;
}

.offer-price .amount {
  display: block;
  font-size: 1.1rem;
  font-weight: 900;
  color: var(--text);
}

.offer-card.active .offer-price .amount {
  color: var(--accent);
}

.offer-price .hint {
  font-size: 0.7rem;
  color: var(--muted);
}

/* MOBILE */
@media (max-width: 520px) {
  .offer-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .offer-price {
    width: 100%;
    text-align: left;
  }
}
/* ===== LOADING ===== */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.skeleton-card {
  display: flex;
  justify-content: space-between;
  gap: 1rem;

 background: linear-gradient(
    180deg,
    var(--panel, #f1f1f1),
    var(--panel-soft, #e8e8e8)
  );
  border: 1px solid var(--border, #ddd);
  border-radius: 18px;
  padding: 1rem 1.2rem;
  overflow: hidden;
  position: relative;

}

.skeleton-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    110deg,
    transparent 30%,
    rgba(255,255,255,0.06) 45%,
    transparent 60%
  );
  animation: shimmer 1.3s infinite;
}

.skeleton-left {
  flex: 1;
}

.skeleton-line {
  display: block;
  height: 10px;
  border-radius: 6px;
  background: rgba(0,0,0,0.08);
  margin-bottom: 8px;
}

.skeleton-line.title {
  width: 60%;
  height: 14px;
}

.skeleton-line.text {
  width: 80%;
}

.skeleton-price {
  width: 60px;
  height: 18px;
  border-radius: 6px;
  background: rgba(0,0,0,0.12);
}
.skeleton-card::after {
  background: linear-gradient(
    110deg,
    transparent 30%,
    rgba(255,255,255,0.6) 45%,
    transparent 60%
  );}
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}


</style>

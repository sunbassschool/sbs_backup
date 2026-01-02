<template>
  <div class="drawer-overlay" @click.self="$emit('close')">
    <div class="drawer-card">
      <header class="drawer-header">
<img
  :src="safeImageUrl"
  alt=""
  class="product-image"
  v-show="imageOk"
  @load="onImageLoad"
  @error="onImageError"
/>


        <h3>{{ item.product.name }}</h3>
<button class="close-btn" @click="$emit('close')" aria-label="Fermer">
  ✕
</button>
      </header>

      <div class="drawer-content">
        <p v-if="item.product.description" class="desc">
          {{ item.product.description }}
        </p>

        <div class="info-row">
          <span class="label">Montant</span>
          <span class="value">{{ item.amount }} €</span>
        </div>

        <div v-if="item.product.category" class="info-row">
          <span class="label">Catégorie</span>
          <span class="value">{{ item.product.category }}</span>
        </div>

        <a
          v-if="item.invoice_url"
          :href="item.invoice_url"
          target="_blank"
          class="invoice-btn"
        >
          Voir la facture
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const imageOk = ref(false)

const safeImageUrl = computed(() => {
  const url = props.item?.product?.image_url
  return typeof url === "string" && url.trim() !== "" ? url : ""
})

function onImageLoad() {
  imageOk.value = true
}

function onImageError() {
  imageOk.value = false
}
</script>


<style scoped>
  .product-image {
  display: block;
}
.product-image {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 14px;
  margin-bottom: 16px;
}

.product-image[src=""] {
  display: none;
}

  .close-btn {
  border: none;
  background: transparent;
  color: #666;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 6px;
  line-height: 1;
}

.close-btn:hover {
  color: #111;
}

.product-image {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 14px;
  margin-bottom: 16px;
}

/* =========================
   OVERLAY
   ========================= */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* =========================
   CARD
   ========================= */
.drawer-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.25);
  padding: 22px;
  animation: pop 0.25s ease-out;
}

/* =========================
   HEADER
   ========================= */
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.drawer-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111;
  margin: 0;
}

.close-btn {
  border: none;
  background: #f2f2f2;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 0.9rem;
}

.close-btn:hover {
  background: #e6e6e6;
}

/* =========================
   CONTENT
   ========================= */
.drawer-content {
  font-size: 0.9rem;
  color: #444;
}

.desc {
  margin-bottom: 18px;
  line-height: 1.5;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.label {
  color: #777;
}

.value {
  font-weight: 500;
  color: #111;
}

/* =========================
   BUTTON
   ========================= */
.invoice-btn {
  display: block;
  margin-top: 22px;
  text-align: center;
  padding: 12px;
  border-radius: 12px;
  background: #fb923c; /* SBS orange */
  color: white;
  font-weight: 500;
  text-decoration: none;
}

.invoice-btn:hover {
  opacity: 0.9;
}

/* =========================
   ANIMATION
   ========================= */
@keyframes pop {
  from {
    transform: scale(0.96);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>

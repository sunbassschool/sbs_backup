<template>
  <div class="product-card">
    <h3>{{ product.name }}</h3>
    <p class="desc">{{ product.description }}</p>

    <ElevePriceCard
      v-for="price in prices"
      :key="price.price_id"
      :price="price"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import ElevePriceCard from "@/components/stripe/ElevePriceCard.vue"
import { getValidToken } from "@/utils/api"
import { getProxyPostURL } from "@/config/gas"

const props = defineProps({
  product: { type: Object, required: true }
})

const proxyUrl = getProxyPostURL()
const prices = ref([])

const fetchPrices = async () => {
  try {
    const jwt = await getValidToken()

    const res = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "listpricesbyproduct",
        jwt,
        product_id: props.product.product_id
      })
    }).then(r => r.json())

    prices.value = (res.prices || []).filter(p => p.active === true)
  } catch (e) {
    console.error("❌ fetchPrices error", e)
  }
}

onMounted(fetchPrices)
</script>

<style scoped>
.product-card {
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.desc {
  opacity: 0.8;
  margin-bottom: 12px;
}
</style>

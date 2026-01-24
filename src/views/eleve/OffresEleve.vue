<template>
  <Layout>
    <div class="offers-page dark">

      <header class="offers-header">
        <h1>Choisis ta formule</h1>
        <p>Paiement sécurisé · Accès immédiat · Sans engagement</p>
      </header>

<SBSLoading
  v-if="loading"
  label="Chargement des offres…"
/>


<p
  v-else-if="hasLoadedOnce && !prices.length"
  class="muted center"
>
  Aucune offre disponible
</p>



    <div v-else class="offers-list">

  <section
    v-for="(group, category) in groupedPrices"
    :key="category"
    class="offers-group"
  >
    <h2 class="category-title">
      {{ category === 'prof_plan' ? 'Abonnements PROF' : category }}
    </h2>

<div
  v-for="price in group"
  :key="price.price_id"
  class="offer-row"
  :data-featured="FEATURED_PRODUCTS[price.product.product_id]?.featured || false"
  :data-badge-label="FEATURED_PRODUCTS[price.product.product_id]?.badge_label || ''"
  :data-category="price.product.category"
>



      <div class="offer-main">
        <span class="offer-name">
          {{ price.product.name }}
        </span>

        <span class="offer-desc">
          {{ price.product.description }}
        </span>
      </div>

      <div class="offer-action">
        <span class="offer-price">
          {{ formatPrice(price) }}
        </span>

       <button
  class="cta"
  :class="{ primary: price.product.category === 'prof_plan', loading: payingPriceId === price.price_id }"
  :disabled="payingPriceId !== null"
  @click="pay(price, price.product)"
>
<span v-if="payingPriceId === price.price_id" class="cta-label">
  </span>
  <span v-else>
    {{ price.mode === 'subscription' ? 'Souscrire' : 'Acheter' }}
  </span>
</button>

      </div>
    </div>
  </section>

</div>


    </div>

    <div
  v-if="showCheckoutOverlay"
  class="checkout-overlay"
>
  <div class="checkout-overlay-content">
    <div class="spinner"></div>
    <p>Redirection vers paiement sécurisé…</p>
  </div>
</div>

  </Layout>
</template>


<script setup>
import { ref, onMounted, watch, computed  } from "vue"
import Layout from "@/views/Layout.vue"
import { useAuthStore } from "@/stores/authStore"
import { getProxyPostURL } from "@/config/gas.ts"
import SBSLoading from "@/components/SBSLoading.vue"

const auth = useAuthStore()
const proxyUrl = getProxyPostURL()
const payingPriceId = ref(null)
const hasFetchedOnce = ref(false)
const FEATURED_PRODUCTS = {
  prod_Tp1wh0Qkob0WS1: {
    featured: true,
    badge_label: "Choix recommandé"
  },
    prod_TnSPmciomqAnrm: {
    featured: true,
    badge_label: "Populaire"
  }
}
const showCheckoutOverlay = ref(false)
let overlayTimeout = null
const hasLoadedOnce = ref(false)

const loading = ref(false)
const products = ref([])
const prices = computed(() => {
  return products.value
    .flatMap(product =>
      (product.prices || []).map(price => ({
        ...price,
        product
      }))
    )
    // optionnel : tri logique
.sort((a, b) => {
  if (a.product.category === "prof_plan" && b.product.category !== "prof_plan") return -1
  if (a.product.category !== "prof_plan" && b.product.category === "prof_plan") return 1
  return a.amount - b.amount
})})
const groupedPrices = computed(() => {
  const map = {}
  const order = []

  prices.value.forEach(p => {
    const cat = p.product.category || "Autre"

    if (!map[cat]) {
      map[cat] = []
      order.push(cat)           // 👈 ordre dynamique API
    }

    map[cat].push(p)
  })

  // prof_plan toujours en dernier
  if (order.includes("prof_plan")) {
    order.splice(order.indexOf("prof_plan"), 1)
    order.push("prof_plan")
  }

  return Object.fromEntries(
    order.map(cat => [cat, map[cat]])
  )
})


const isProfPlan = (price) =>
  price.product.category === "prof_plan"

// =====================================================
// FORMAT PRICE
// =====================================================
const formatPrice = (price) => {
  const amount = (price.amount / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })

  if (price.mode === "subscription") {
    return `${amount} € / mois`
  }

  return `${amount} € `
}

// =====================================================
// HELPERS
// =====================================================

const CACHE_TTL = 5 * 60 * 1000 // 5 min

const getCacheKey = (profId) => `eleve_offres_${profId}`

const loadFromCache = (profId) => {
  try {
    const raw = sessionStorage.getItem(getCacheKey(profId))
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.ts > CACHE_TTL) return null

    return parsed.data
  } catch {
    return null
  }
}

const saveToCache = (profId, data) => {
  sessionStorage.setItem(
    getCacheKey(profId),
    JSON.stringify({ ts: Date.now(), data })
  )
}

const fetchOffersNetwork = async (profId) => {
  console.group("🌐 fetchOffersNetwork")
  console.log("🎯 profId =", profId)

  try {
    loading.value = products.value.length === 0

    // =========================
    // 1️⃣ FETCH PRODUITS
    // =========================
    const prodPayload = {
      route: "listproductsbyprof",
      prof_id: profId
    }

    const prodResRaw = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prodPayload)
    })

    const prodText = await prodResRaw.text()

    let prodRes
    try {
      prodRes = JSON.parse(prodText)
    } catch (e) {
      console.error("❌ JSON produits invalide", prodText)
      throw e
    }

    // ✅ TMP PRODUCTS (DÉCLARÉ ICI)
    const tmpProducts = (prodRes.products || [])
      .filter(p => p.active === true)
      .map(p => ({
        product_id: p.product_id,
        name: p.product_name,
        description: p.description,
        category: p.category,
        prices: []
      }))

    // =========================
    // 2️⃣ FETCH PRICES
    // =========================
    await Promise.all(
      tmpProducts.map(async (product) => {
        try {
          const resRaw = await fetch(proxyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              route: "listpricesbyproduct",
              product_id: product.product_id
            })
          })

          const res = JSON.parse(await resRaw.text())
          product.prices = (res.prices || []).filter(p => p.active === true)
        } catch {
          product.prices = []
        }
      })
    )

    // =========================
    // 3️⃣ COMMIT FINAL (UN SEUL ENDROIT)
    // =========================
    products.value = tmpProducts
    hasLoadedOnce.value = true
    saveToCache(profId, tmpProducts)

  } catch (e) {
    console.error("❌ fetchOffersNetwork error", e)
    hasLoadedOnce.value = true
  } finally {
    loading.value = false
    console.groupEnd()
  }
}



// =====================================================
// FETCH OFFRES (PROGRESSIVE + CACHE SAFE)
// =====================================================
const fetchOffers = async () => {
  const profId = auth.user?.prof_id
  if (!profId) return

  // 1️⃣ cache immédiat
  const cached = loadFromCache(profId)
if (cached) {
  products.value = cached
  loading.value = false          // 👈 IMPORTANT
  fetchOffersNetwork(profId)     // refresh silencieux
  return
}


  // 2️⃣ pas de cache → réseau direct
  fetchOffersNetwork(profId)
}



// =====================================================
// PAY (placeholder)
// =====================================================
// =====================================================
// PAY (DEBUG HARD)
// =====================================================
const pay = async (price, product) => {
  console.group("💳 pay()")
  console.log("price =", price)

  if (payingPriceId.value) return
  payingPriceId.value = price.price_id

  try {
    const eleveEmail = auth.user?.email
    const profId = auth.user?.prof_id

    if (!eleveEmail || !profId) {
      console.warn("⛔ infos manquantes pour paiement", { eleveEmail, profId })
      return
    }

const route =
  price.mode === "subscription"
    ? "createcheckoutsessionmultiprofsubscription"
    : "createcheckoutsessiononetimemultiprofamount"

const payload = {
  route,
  prof_id: profId,
  eleve_email: eleveEmail
}

if (price.mode === "subscription") {
  // 🔁 ABONNEMENT
  payload.product_id = product.product_id   // 👈 OBLIGATOIRE
  payload.price_id = price.price_id         // 👈 price métier
}

if (price.mode === "one_time") {
  // 💳 ONE-TIME
  payload.product_id = price.product_id
  payload.price_id = price.price_id
  payload.price_amount_cents = price.amount
}



    console.log("➡️ payload envoyé =", payload)
    console.log("➡️ proxyUrl =", proxyUrl)
overlayTimeout = setTimeout(() => {
  showCheckoutOverlay.value = true
}, 600) // 👈 seulement si c’est un peu long

    const response = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    console.log("⬅️ HTTP status =", response.status)
    console.log("⬅️ HTTP ok =", response.ok)
    console.log("⬅️ Content-Type =", response.headers.get("content-type"))

    const rawText = await response.text()
    console.log("⬅️ RAW RESPONSE =", rawText)

    let res
    try {
      res = JSON.parse(rawText)
    } catch (err) {
      console.error("❌ JSON parse failed → réponse non JSON")
      throw err
    }

    console.log("✅ checkout response JSON =", res)

    if (!res.checkout_url) {
      console.error("❌ checkout_url manquant", res)
      return
    }

    // 🔥 REDIRECTION STRIPE
    window.location.href = res.checkout_url

  } catch (e) {
    console.error("❌ pay error", e)
  } finally {
    payingPriceId.value = null
    clearTimeout(overlayTimeout)
showCheckoutOverlay.value = false

    console.groupEnd()
  }
}


// =====================================================
// INIT (authReady SAFE)
// =====================================================
watch(
  () => auth.user?.prof_id,
  (profId, prev) => {
    if (!profId || profId === prev) return
    fetchOffers()
  },
  { immediate: true }
)

</script>

<style>
/* =====================================================
   SBS – Offers / Pricing – Version 2 : Featured PROF
   ===================================================== */

:root {
  --accent: #ff6b35;
  --accent-hover: #ff5722;
  --bg: #0b0b0b;
  --surface: rgba(255, 255, 255, 0.025);
  --surface-hover: rgba(255, 255, 255, 0.05);
  --border: rgba(255, 255, 255, 0.1);
  --border-hover: rgba(255, 255, 255, 0.18);
  --text: #ffffff;
  --text-soft: rgba(255, 255, 255, 0.75);
  --text-muted: rgba(255, 255, 255, 0.45);
}

.offers-page {
    width: 100%;

  margin: 0 auto;
  padding: 30px 0 96px;
  font-family: -apple-system, system-ui, sans-serif;
  color: var(--text);
  background: radial-gradient(circle at top, #141414, var(--bg));
}
.offers-page > * {
  max-width: 820px;
  margin: 0 auto;
  padding: 0 24px;
}
/* HEADER */
.offers-header {
  text-align: center;
}

.offers-header h1 {
  font-size: 2.2rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  margin-bottom: 12px;
}

.offers-header p {
  font-size: 0.9rem;
  color: var(--text-muted);
}

/* GROUPS */
.offers-list {
  display: flex;
  flex-direction: column;
  gap: 64px;
}

.category-title {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 20px;
}

/* OFFER CARD */
.offer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  padding: 28px 30px;
  border-radius: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  margin-bottom: 16px; /* 👈 espace entre cards */
  transition: all 0.25s ease;
}

.offer-row:last-child {
  margin-bottom: 0;
}

.offer-row:hover {
  background: var(--surface-hover);
  border-color: var(--border-hover);
  transform: translateY(-2px);
}

/* FEATURED PROF */
.offer-row.is-prof-plan {
  position: relative;
  background: linear-gradient(135deg, rgba(255,107,53,0.12), rgba(255,107,53,0.02));
  border-color: var(--accent);
  box-shadow: 0 14px 40px rgba(255,107,53,0.18);
}
.offer-row[data-featured="true"] {
  position: relative;
}

.offer-row[data-featured="true"]::before {
  content: attr(data-badge-label);
  position: absolute;
  top: -12px;
  left: 32px;
  padding: 5px 10px;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  background: var(--accent);
  color: #fff;
  border-radius: 999px;
}

/* LEFT */
.offer-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.offer-name {
  font-size: 1rem;
  font-weight: 600;
}

.offer-row.is-prof-plan .offer-name {
  color: var(--accent);
}

.offer-desc {
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--text-soft);
}

/* RIGHT */
.offer-action {
  display: flex;
  align-items: center;
  gap: 24px;
}

.offer-price {
  font-size: 1.15rem;
  font-weight: 700;
}

.offer-row.is-prof-plan .offer-price {
  color: var(--accent);
}

/* CTA */
.cta {
  padding: 12px 22px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cta:hover:not(:disabled) {
  background: rgba(255,255,255,0.08);
}

.cta.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.cta.primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

.cta:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* RESPONSIVE */
@media (max-width: 640px) {
  .offer-row {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .offer-action {
    justify-content: space-between;
    border-top: 1px solid var(--border);
    padding-top: 14px;
  }

  .cta {
    flex: 1;
  }
}

.offer-row[data-category="prof_plan"] {
  border-left: 4px solid var(--accent);
}
.offer-row[data-category="Cours de basse"] {
  border-left: 4px solid #4d4d4d;
}

.offer-row[data-category="bundle"] {
  border-left: 4px solid #51cf66;
}


.cta.loading {
  position: relative;
  pointer-events: none;
  opacity: 0.85;
}

.cta.loading::after {
  content: "";
  width: 14px;
  height: 14px;
  box-sizing: border-box;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;

  position: absolute;
  right: 15px;
  top: 50%;

  transform: translateY(-50%); /* ⚠️ PAS d’autre transform ici */
  animation: spin 0.8s linear infinite;
  will-change: transform;
}

@keyframes spin {
  from {
    transform: translateY(-50%) rotate(0deg);
  }
  to {
    transform: translateY(-50%) rotate(360deg);
  }
}

.cta-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
  letter-spacing: 0.01em;
}
.checkout-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkout-overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 24px 28px;
  border-radius: 14px;
  background: rgba(20,20,20,0.95);
  border: 1px solid rgba(255,255,255,0.12);
}

.checkout-overlay-content p {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
  text-align: center;
}

/* spinner overlay */
.checkout-overlay .spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* mobile focus */
@media (max-width: 640px) {
  .checkout-overlay-content {
    width: calc(100% - 48px);
  }
}


</style>

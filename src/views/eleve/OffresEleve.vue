<template>
  <Layout>
    <div class="offers-page dark">

      <header class="offers-header">
        <h1>Choisis ta formule</h1>
        <p>Paiement sécurisé · Accès immédiat · Sans engagement</p>
      </header>

<p v-if="loading" class="muted center">
  Chargement des offres…
</p>

<p v-else-if="!loading && !prices.length" class="muted center">
  Aucune offre disponible
</p>


      <div v-else class="offers-list">
        <div
          v-for="price in prices"
          :key="price.price_id"
          class="offer-row"
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
              :disabled="payingPriceId === price.price_id"
              @click="pay(price, price.product)"
            >
              S'inscrire
            </button>
          </div>
        </div>
      </div>

    </div>
  </Layout>
</template>


<script setup>
import { ref, onMounted, watch, computed  } from "vue"
import Layout from "@/views/Layout.vue"
import { useAuthStore } from "@/stores/authStore"
import { getProxyPostURL } from "@/config/gas.ts"

const auth = useAuthStore()
const proxyUrl = getProxyPostURL()
const payingPriceId = ref(null)
const hasFetchedOnce = ref(false)

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
    .sort((a, b) => a.amount - b.amount)
})
// =====================================================
// FORMAT PRICE
// =====================================================
const formatPrice = (price) => {
  if (price.mode === "subscription") {
    return `${price.amount / 100} € / ${price.interval}`
  }
  return `${price.amount / 100} € (paiement unique)`
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
    console.group("📦 listproductsbyprof")

    const prodPayload = {
      route: "listproductsbyprof",
      prof_id: profId
    }
    console.log("➡️ payload", prodPayload)

    const prodResRaw = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prodPayload)
    })

    const prodText = await prodResRaw.text()
    console.log("⬅️ raw response", prodText)

    let prodRes
    try {
      prodRes = JSON.parse(prodText)
    } catch (e) {
      console.error("❌ JSON produits invalide")
      throw e
    }

    console.log("⬅️ parsed", prodRes)
    console.groupEnd()

    const tmpProducts = (prodRes.products || [])
      .filter(p => p.active === true)
      .map(p => ({
        ...p,
        prices: []
      }))

    console.log("✅ produits actifs =", tmpProducts)

    // =========================
    // 2️⃣ FETCH PRICES
    // =========================
    await Promise.all(
      tmpProducts.map(async (product) => {
        console.group(`💰 listpricesbyproduct | ${product.product_id}`)

        const pricePayload = {
          route: "listpricesbyproduct",
          product_id: product.product_id
        }
        console.log("➡️ payload", pricePayload)

        try {
          const resRaw = await fetch(proxyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pricePayload)
          })

          const text = await resRaw.text()
          console.log("⬅️ raw response", text)

          const res = JSON.parse(text)
          console.log("⬅️ parsed", res)

          product.prices = (res.prices || []).filter(p => p.active === true)
          console.log("✅ prices actives", product.prices)
        } catch (e) {
          console.error("❌ erreur prices", e)
          product.prices = []
        }

        console.groupEnd()
      })
    )

    // =========================
    // 3️⃣ COMMIT FINAL
    // =========================
    console.log("🧩 TMP PRODUCTS FINAL =", tmpProducts)

    products.value = tmpProducts
    saveToCache(profId, tmpProducts)

  } catch (e) {
    console.error("❌ fetchOffersNetwork error", e)
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
    console.groupEnd()
  }
}


// =====================================================
// INIT (authReady SAFE)
// =====================================================
onMounted(() => {
  if (!auth.authReady || !auth.user?.prof_id) {
    const stop = watch(
      () => auth.authReady && auth.user?.prof_id,
      (ready) => {
        if (ready) {
          fetchOffers()
          stop()
        }
      }
    )
  } else {
    fetchOffers()
  }
})
</script>

<style>
/* =====================================================
   SBS – Offers / Pricing list – Dark premium
   ===================================================== */

.offers-page {
  max-width: 860px;
  margin: 0 auto;
  padding: 36px 16px 56px;
}

/* HEADER */
.offers-header {
  text-align: center;
  margin-bottom: 32px;
}

.offers-header h1 {
  font-weight: 700;
  letter-spacing: 0.4px;
}

.offers-header p {
  margin-top: 6px;
  font-size: 0.9rem;
  color: rgba(255,255,255,0.55);
}

/* LIST */
.offers-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ROW */
.offer-row {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 22px;

  padding: 18px 18px 20px;
  border-radius: 14px;

  background: linear-gradient(
    180deg,
    rgba(255,255,255,0.06),
    rgba(255,255,255,0.015)
  );

  border: 1px solid rgba(255,255,255,0.08);
  color: #fff;

  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

/* Hover – discret & premium */
.offer-row:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.55);
}

/* LEFT */
.offer-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 60%;
}

.offer-name {
  font-size: 1rem;
  font-weight: 600;
}

.offer-desc {
  font-size: 0.82rem;
  line-height: 1.35;
  color: rgba(255,255,255,0.6);
}

/* RIGHT */
.offer-action {
  display: flex;
  align-items: center;
  gap: 14px;
  white-space: nowrap;
}

.offer-price {
  font-size: 0.95rem;
  font-weight: 600;
  opacity: 0.95;
}

/* CTA */
.cta {
  padding: 8px 14px;
  border-radius: 999px;
  border: none;

  background: rgba(255,255,255,0.95);
  color: #000;

  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;

  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    opacity 0.15s ease;
}

.cta:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.35);
}

.cta:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}

/* FOCUS (accessibilité PWA) */
.offer-row:focus-within {
  box-shadow:
    0 0 0 2px rgba(255,255,255,0.15),
    0 10px 30px rgba(0,0,0,0.5);
}

/* UTILS */
.center {
  text-align: center;
}

.muted {
  color: rgba(255,255,255,0.55);
}

.small {
  font-size: 0.8rem;
}

/* MOBILE */
@media (max-width: 640px) {
  .offer-row {
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
  }

  .offer-main {
    max-width: 100%;
  }

  .offer-action {
    justify-content: space-between;
  }
}

</style>

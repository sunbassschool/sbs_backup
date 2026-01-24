<template>
  <Layout>
    <div class="offres-page">

      <!-- HEADER -->
      <header class="page-header">
        <h2>Mes offres de cours</h2>
        <button class="btn primary" @click="openCreateProduct">
          ➕ ajouter
        </button>
      </header>

      <!-- LOADING -->
<SBSLoading
  v-if="loading"
  label="Chargement des offres…"
/>

      <!-- EMPTY -->
      <div v-else-if="!products.length" class="empty">
        <p>Aucune  offre créée.</p>
        <button class="btn primary small" @click="openCreateProduct">
          Créer une offre
        </button>
      </div>

      <!-- PRODUCTS -->
      <div v-else class="products">

        <!-- ================= ACTIFS ================= -->
        <div
          v-for="product in activeProducts"
          :key="product.product_id"
          class="product-row"
            :class="{ archived: !product.active, updating: product._updating }"

        >

          <!-- HEADER -->
          <div class="row-main">
            <div class="row-info">
              <strong class="row-title">{{ product.product_name }}</strong>
              <span v-if="product.description" class="row-desc">
                {{ product.description }}
              </span>
            </div>

            <div class="row-actions">
              <button
                class="icon-btn"
                  :disabled="product._updating"

                title="Archiver"
                @click="toggleProductActive(product)"
              >
                <i class="bi bi-archive"></i>
              </button>

              <button
                class="btn ghost small"
                @click="togglePrices(product.product_id)"
              >
                {{ openedProduct === product.product_id ? "Masquer" : "Prix" }}
              </button>
            </div>
          </div>

          <!-- PRICES -->
          <div
            v-if="openedProduct === product.product_id"
            class="prices"
          >
            <p v-if="loadingPrices" class="muted small">
              Chargement…
            </p>

            <div
              v-for="price in pricesByProduct[product.product_id]"
              :key="price.price_id"
              class="price-row"
            >
              <span class="price-label">
                {{ price.amount / 100 }} {{ price.currency }}
                <span v-if="price.interval">/ {{ price.interval }}</span>
                <small class="mode">({{ price.mode }})</small>
              </span>

              <label class="price-toggle">
                <input
                  type="checkbox"
                  :checked="price.active"
                  @change="togglePrice(price, product.product_id)"
                />
              </label>
            </div>

            <button
              class="btn ghost tiny"
              @click="openCreatePrice(product)"
            >
              ➕ Ajouter un prix
            </button>
          </div>
        </div>

        <!-- ================= ARCHIVÉS ================= -->
      <!-- TOGGLE ARCHIVÉS -->
<div
  v-if="archivedProducts.length"
  class="archived-toggle"
>
  <button
    class="btn ghost small"
    @click="showArchived = !showArchived"
  >
    {{ showArchived ? "Masquer" : "Afficher" }}
    les archivés ({{ archivedProducts.length }})
  </button>
</div>

<div
  v-if="showArchived && archivedProducts.length"
  class="archived-section"
>

          <div class="archived-title">
            Archivés
          </div>

          <div
            v-for="product in archivedProducts"
            :key="product.product_id"
            class="product-row archived"
          >

            <div class="row-main">
              <div class="row-info">
                <strong class="row-title">{{ product.product_name }}</strong>
                <span v-if="product.description" class="row-desc">
                  {{ product.description }}
                </span>
              </div>

              <div class="row-actions">
                <button
                  class="icon-btn"
                  title="Réactiver"
                  @click="toggleProductActive(product)"
                >
                  <i class="bi bi-arrow-counterclockwise"></i>
                </button>

                <button
                  class="btn ghost small"
                  @click="togglePrices(product.product_id)"
                >
                  {{ openedProduct === product.product_id ? "Masquer" : "Prix" }}
                </button>
              </div>
            </div>

            <!-- PRICES -->
            <div
              v-if="openedProduct === product.product_id"
              class="prices"
            >
              <p v-if="loadingPrices" class="muted small">
                Chargement…
              </p>

              <div
                v-for="price in pricesByProduct[product.product_id]"
                :key="price.price_id"
                class="price-row"
              >
                <span class="price-label">
                  {{ price.amount / 100 }} {{ price.currency }}
                  <span v-if="price.interval">/ {{ price.interval }}</span>
                  <small class="mode">({{ price.mode }})</small>
                </span>

                <label class="price-toggle">
                  <input
                    type="checkbox"
                    :checked="price.active"
                    @change="togglePrice(price, product.product_id)"
                  />
                </label>
              </div>

              <button
                class="btn ghost tiny"
                @click="openCreatePrice(product)"
              >
                ➕ Ajouter un prix
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- MODALS -->
      <CreateProductModal
        v-if="showCreateProduct"
        @close="showCreateProduct = false"
        @created="() => { clearProductsCache(auth.user.prof_id); fetchProducts() }"
      />

      <CreatePriceModal
        v-if="showCreatePrice"
        :product-id="selectedProductId"
        @close="showCreatePrice = false"
        @created="onPriceCreated"
      />

    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted, computed } from "vue"
import Layout from "@/views/Layout.vue"
import { useAuthStore } from "@/stores/authStore"
import { getValidToken } from "@/utils/api"
import { getProxyPostURL } from "@/config/gas"
import CreateProductModal from "@/components/stripe/CreateProductModal.vue"
import CreatePriceModal from "@/components/stripe/CreatePriceModal.vue"
import SBSLoading from "@/components/SBSLoading.vue"
const auth = useAuthStore()
const proxyUrl = getProxyPostURL()
const showCreateProduct = ref(false)

const loading = ref(false)
const loadingPrices = ref(false)

const products = ref([])
const pricesByProduct = ref({})
const openedProduct = ref(null)
const showArchived = ref(false)


const showCreatePrice = ref(false)
const selectedProductId = ref(null)

const activeProducts = computed(() =>
  (products.value || []).filter(p => p.active)
)

const archivedProducts = computed(() =>
  (products.value || []).filter(p => !p.active)
)


// =====================================================
// CACHE
// =====================================================
const CACHE_TTL = 5 * 60 * 1000 // 5 min
const getCacheKey = profId => `prof_products_${profId}`

const loadProductsFromCache = (profId) => {
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

const saveProductsToCache = (profId, data) => {
  sessionStorage.setItem(
    getCacheKey(profId),
    JSON.stringify({ ts: Date.now(), data })
  )
}

const clearProductsCache = (profId) => {
  sessionStorage.removeItem(getCacheKey(profId))
}
// FETCH PRODUCT RESEAU
const fetchProductsNetwork = async () => {
  loading.value = products.value.length === 0

  try {
    const jwt = await getValidToken()

    const res = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "listproductsbyprof",
        jwt,
        prof_id: auth.user.prof_id
      })
    }).then(r => r.json())

    products.value = res.products || []

    saveProductsToCache(auth.user.prof_id, products.value)
    preloadPrices() // 🔥 background


  } catch (e) {
    console.error("❌ fetchProductsNetwork error", e)
  } finally {
    loading.value = false
  }
}

const fetchProducts = () => {
  const profId = auth.user.prof_id
  if (!profId) return

  // 1️⃣ cache immédiat
  const cached = loadProductsFromCache(profId)
  if (cached) {
    products.value = cached
    // 🔥 refresh arrière-plan
    fetchProductsNetwork()
    return
  }

  // 2️⃣ pas de cache → réseau direct
  fetchProductsNetwork()
}
// Function on price created
const onPriceCreated = () => {
  const productId = selectedProductId.value

  // invalide prices locales
pricesByProduct.value[productId] = null
fetchPrices(productId)
openedProduct.value = productId

}

// =====================================================
// FETCH archiver
// =====================================================
const toggleProductActive = (product) => {
  const action = product.active ? "Archiver" : "Réactiver"
  if (!confirm(`${action} ce produit ?`)) return

  const jwt = auth.jwt || auth.session?.jwt
  if (!jwt) {
    alert("Session invalide, recharge la page")
    return
  }

  // 🔥 OPTIMISTIC UI
  const previousState = product.active
  product.active = !previousState
  product._updating = true

  // 👉 force le rerender / reclassement
  products.value = [...products.value]

  // 🔄 API async
  setTimeout(async () => {
    try {
      const res = await fetch(proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route: "toggleproductactive",
          jwt,
          prof_id: auth.user.prof_id,
          product_id: product.product_id,
          active: product.active
        })
      }).then(r => r.json())

      if (!res.success) {
        // rollback visuel
        product.active = previousState
        products.value = [...products.value]
        alert(res.message || "Erreur lors de l’opération")
      } else {
        clearProductsCache(auth.user.prof_id)
      }

    } catch (e) {
      console.error("❌ toggleProductActive error", e)
      product.active = previousState
      products.value = [...products.value]
    } finally {
      product._updating = false
    }
  }, 0)
}



const fetchPrices = async (productId, { silent = false } = {}) => {
  // déjà chargé → skip
  if (pricesByProduct.value[productId]) return

  console.group("💰 fetchPrices", productId)
  if (!silent) loadingPrices.value = true

  try {
    const jwt = auth.jwt || auth.session?.jwt

    const res = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "listpricesbyproduct",
        jwt,
        product_id: productId
      })
    }).then(r => r.json())

    console.log("⬅️ prices =", res)

    pricesByProduct.value[productId] = res.prices || []

  } catch (e) {
    console.error("❌ fetchPrices error", e)
  } finally {
    if (!silent) loadingPrices.value = false
    console.groupEnd()
  }
}
const preloadPrices = () => {
  for (const product of products.value) {
    fetchPrices(product.product_id, { silent: true })
  }
}

// =====================================================
// FETCH PRICES
// =====================================================
const togglePrices = (productId) => {
  openedProduct.value =
    openedProduct.value === productId ? null : productId
}


// =====================================================
// TOGGLE PRICE ACTIVE
// =====================================================
const togglePrice = async (price, productId) => {
  console.group("🔁 togglePrice", price.price_id)

  try {
    const jwt = await getValidToken()

    await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "togglepriceactive",
        jwt,
        price_id: price.price_id,
        active: !price.active
      })
    })

    price.active = !price.active
  } catch (e) {
    console.error("❌ togglePrice error", e)
  } finally {
    console.groupEnd()
  }
}


// =====================================================
// PLACEHOLDERS MODALS
// =====================================================
const openCreateProduct = () => {
  showCreateProduct.value = true
}


const openCreatePrice = (product) => {
  selectedProductId.value = product.product_id
  showCreatePrice.value = true
}


// =====================================================
// INIT
// =====================================================
onMounted(() => {
  console.log("🛒 Offres.vue mounted")
  fetchProducts()
})
</script>

<style scoped>
.offres-page {
  max-width: 920px;
  margin: 0 auto;
  padding: 20px;
  color: #e6e6e6;
}

/* ================= HEADER ================= */

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.page-header h2 {
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0;
}

/* ================= LIST ================= */

.products {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ================= ROW ================= */

.product-row {
  background: #0c0d11;
  border: 1px solid #1a1a1a;
  border-radius: 10px;
  padding: 10px 12px;
}

.product-row.archived {
  opacity: 0.45;
}

/* ================= MAIN ================= */

.row-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.row-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.row-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: #f5f5f5;
}

.row-desc {
  font-size: 0.75rem;
  color: #9a9a9a;
}

/* ================= ACTIONS ================= */

.row-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  background: transparent;
  border: none;
  color: #9a9a9a;
  font-size: 1rem;
  cursor: pointer;
  padding: 4px;
}

.icon-btn:hover {
  color: #fb923c;
}

/* ================= PRICES ================= */

.prices {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #222;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}

.price-label {
  color: #d4d4d4;
}

.price-label .mode {
  color: #777;
  margin-left: 4px;
}

.price-toggle input {
  accent-color: #fb923c;
}

/* ================= BUTTONS ================= */

.btn {
  background: #fb923c;
  color: #0b0c0f;
  border: none;
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
}

.btn.primary {
  background: #fb923c;
}

.btn.ghost {
  background: transparent;
  color: #fb923c;
  padding: 4px 8px;
}

.btn.ghost:hover {
  text-decoration: underline;
}

.btn.small {
  font-size: 0.7rem;
  padding: 4px 10px;
}

.btn.tiny {
  font-size: 0.65rem;
  padding: 3px 8px;
}

/* ================= UTILS ================= */

.muted {
  color: #8a8a8a;
}

.muted.small {
  font-size: 0.7rem;
}

.empty {
  margin-top: 40px;
  text-align: center;
  color: #8a8a8a;
}
.archived-toggle {
  margin-top: 16px;
  margin-bottom: 6px;
  text-align: right;
}

.archived-toggle .btn {
  font-size: 0.7rem;
  padding: 4px 10px;
}

.archived-section {
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px dashed #2a2a2a;
}

.archived-title {
  font-size: 0.7rem;
  color: #777;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.product-row.updating {
  opacity: 0.5;
  pointer-events: none;
}

</style>

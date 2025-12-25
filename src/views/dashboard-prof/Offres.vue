<template>
  <Layout>
    <div class="offres-page">

      <!-- HEADER -->
      <header class="page-header">
        <h2>Mes cours</h2>
        <button class="btn primary" @click="openCreateProduct">
          ➕ Nouveau produit
        </button>
      </header>

      <!-- LOADING -->
      <p v-if="loading" class="muted">Chargement des cours</p>

      <!-- EMPTY -->
      <div v-else-if="!products.length" class="empty">
        <p>Aucun cours créée pour le moment.</p>
        <button class="btn primary" @click="openCreateProduct">
          Créer mon premier cours
        </button>
      </div>

      <!-- PRODUCTS -->
      <div v-else class="products">
        <section
          v-for="product in products"
          :key="product.product_id"
          class="product-card"
          :class="{ archived: !product.active }"
        >

          <!-- PRODUCT HEADER -->
          <div class="product-header">
            <div class="product-info">
              <h3>{{ product.name }}</h3>
              <p v-if="product.description" class="desc">
                {{ product.description }}
              </p>
            </div>

            <div class="product-actions">
              <!-- ARCHIVE -->
              <button
                class="icon-btn"
                :title="product.active ? 'Archiver' : 'Réactiver'"
                @click="toggleProductActive(product)"
              >
                <i
                  :class="product.active
                    ? 'bi bi-archive'
                    : 'bi bi-arrow-counterclockwise'"
                ></i>
              </button>

              <!-- TOGGLE PRICES -->
              <button
                class="btn ghost"
                @click="togglePrices(product.product_id)"
              >
                {{ openedProduct === product.product_id
                  ? 'Masquer les prices'
                  : 'Voir les prix' }}
              </button>
            </div>
          </div>

          <!-- prix -->
          <div
            v-if="openedProduct === product.product_id"
            class="prices"
          >
            <p v-if="loadingPrices" class="muted">
              Chargement des prix…
            </p>

            <div
              v-for="price in pricesByProduct[product.product_id]"
              :key="price.price_id"
              class="price-row"
            >
              <span class="price-label">
                <strong>{{ price.mode }}</strong>
                — {{ price.amount / 100 }} {{ price.currency }}
                <span v-if="price.interval">
                  / {{ price.interval }}
                </span>
              </span>

              <label class="price-toggle">
                <input
                  type="checkbox"
                  :checked="price.active"
                  @change="togglePrice(price, product.product_id)"
                />
                actif
              </label>
            </div>

            <button
              class="btn small ghost"
              @click="openCreatePrice(product)"
            >
              ➕ Fixer un prix
            </button>
          </div>

        </section>
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
import { ref, onMounted } from "vue"
import Layout from "@/views/Layout.vue"
import { useAuthStore } from "@/stores/authStore"
import { getValidToken } from "@/utils/api"
import { getProxyPostURL } from "@/config/gas"
import CreateProductModal from "@/components/stripe/CreateProductModal.vue"
import CreatePriceModal from "@/components/stripe/CreatePriceModal.vue"

const auth = useAuthStore()
const proxyUrl = getProxyPostURL()
const showCreateProduct = ref(false)

const loading = ref(false)
const loadingPrices = ref(false)

const products = ref([])
const pricesByProduct = ref({})
const openedProduct = ref(null)


const showCreatePrice = ref(false)
const selectedProductId = ref(null)


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

  // force refetch prices
  togglePrices(productId)
}

// =====================================================
// FETCH archiver
// =====================================================
const toggleProductActive = async (product) => {
  const action = product.active ? "Archiver" : "Réactiver"

  if (!confirm(`${action} ce produit ?`)) return

  try {
    const jwt = await getValidToken()

    const res = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "toggleproductactive",
        jwt,
        prof_id: auth.user.prof_id,
        product_id: product.product_id,
        active: !product.active
      })
    }).then(r => r.json())

    if (res.success) {
      product.active = !product.active
      clearProductsCache(auth.user.prof_id)

    } else {
      alert("Erreur lors de l’opération")
    }
  } catch (e) {
    console.error("❌ toggleProductActive error", e)
  }
}

// =====================================================
// FETCH PRICES
// =====================================================
const togglePrices = async (productId) => {
  if (openedProduct.value === productId) {
    openedProduct.value = null
    return
  }

  openedProduct.value = productId

  // déjà chargé → on affiche
  if (pricesByProduct.value[productId]) return

  console.group("💰 fetchPrices", productId)
  loadingPrices.value = true

  try {
    const jwt = await getValidToken()

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
    loadingPrices.value = false
    console.groupEnd()
  }
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
/* =========================
   PAGE
   ========================= */
.offres-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 28px;
  color: #e6e6e6;
}

@media (min-width: 768px) {
  .offres-page {
    padding: 36px;
  }
}

/* =========================
   HEADER
   ========================= */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}

.page-header h2 {
  font-size: 1.3rem;
  font-weight: 500;
  letter-spacing: 0.3px;
  margin: 0;
}

/* =========================
   PRODUCTS LIST
   ========================= */
.products {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* =========================
   PRODUCT CARD
   ========================= */
.product-card {
  background: #0b0c0f;
  border-radius: 18px;
  padding: 20px;
  transition: opacity 0.2s ease;
}

/* produit archivé */
.product-card.archived {
  opacity: 0.45;
}

/* =========================
   PRODUCT HEADER
   ========================= */
.product-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.product-info h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: #f5f5f5;
}

.desc {
  margin-top: 6px;
  font-size: 0.9rem;
  line-height: 1.45;
  color: #b3b3b3;
}

/* =========================
   ACTIONS
   ========================= */
.product-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* icône archive */
.icon-btn {
  background: transparent;
  border: none;
  color: #9a9a9a;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 6px;
}

.icon-btn:hover {
  color: #fb923c; /* accent SBS */
}

/* =========================
   PRICES
   ========================= */
.prices {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #1a1a1a;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ligne price */
.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.9rem;
}

/* label price */
.price-label {
  color: #d4d4d4;
}

/* toggle price */
.price-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #9a9a9a;
}

.price-toggle input {
  accent-color: #fb923c;
}

/* =========================
   BUTTONS
   ========================= */
.btn {
  background: #fb923c;
  color: #0b0c0f;
  border: none;
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
}

.btn:hover {
  opacity: 0.9;
}

.btn.small {
  padding: 6px 14px;
  font-size: 0.75rem;
}

/* bouton principal */
.btn.primary {
  background: #fb923c;
}

/* ghost */
.btn.ghost {
  background: transparent;
  color: #fb923c;
  padding: 6px 12px;
}

.btn.ghost:hover {
  text-decoration: underline;
}

/* =========================
   TEXT UTILS
   ========================= */
.muted {
  color: #8a8a8a;
}

.empty {
  margin-top: 48px;
  color: #8a8a8a;
  text-align: center;
}

</style>

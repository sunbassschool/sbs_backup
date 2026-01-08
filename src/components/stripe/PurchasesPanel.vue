<template>
  <div class="purchases-panel">

    <!-- ===================== -->
    <!-- ABONNEMENT -->
    <!-- ===================== -->
    <div class="section">
      <h2 class="section-title">Mon abonnement</h2>

      <!-- Loading -->
<div v-if="loading && !abonnement">
        <div class="skeleton" />
      </div>

      <!-- Abonnement -->
      <div v-else-if="abonnement" class="item">
        <div class="item-main">
          <h3>{{ abonnement.product?.name || "Abonnement" }}</h3>

          <p v-if="abonnement.product?.description" class="desc">
            {{ abonnement.product.description }}
          </p>

          <p class="desc">
            Montant : {{ abonnement.amount }} €
          </p>
        </div>

        <div class="item-meta">
          <span class="badge ok">Abonnement</span>
          <span>
            payé le {{ formatDate(abonnement.date_paiement) }}
          </span>
        </div>

        <a
          v-if="abonnement.invoice_url"
          :href="abonnement.invoice_url"
          target="_blank"
          class="link"
        >
          Voir la facture →
        </a>
      </div>

      <!-- Aucun abonnement -->
      <p v-else class="muted">Aucun abonnement</p>
    </div>

    <!-- ===================== -->
    <!-- ACHATS -->
    <!-- ===================== -->
<div class="section">
  <!-- TITRE ACCORDÉON -->
  <h2 class="section-title clickable" @click="toggleAchats">
    Mes achats
    <span class="chevron" :class="{ open: achatsOpen }">⌄</span>
  </h2>

  <transition name="accordion">
    <div v-if="achatsOpen">
      <!-- Loading -->
      <div v-if="loading && !achats.length">
        <div class="skeleton" />
        <div class="skeleton" />
      </div>

      <!-- Liste achats -->
      <div v-else-if="achats.length">
        <div
          v-for="a in achats"
          :key="a.session_id"
          class="item clickable"
          @click.stop="openDrawer(a)"
        >
          <div class="item-main">
            <h3>{{ a.product?.name || "Produit" }}</h3>
          </div>

          <div class="item-meta">
            <span>
              acheté le {{ formatDate(a.date_paiement) }}
            </span>
          </div>
        </div>
      </div>

      <p v-else class="muted">Aucun achat</p>
    </div>
  </transition>
</div>



  </div>
  <ProductDrawer
  v-if="activeProduct"
  :item="activeProduct"
  @close="activeProduct = null"
/>

</template>



<script setup>
import { ref, onMounted, computed, watch } from "vue"
import { useAuthStore } from "@/stores/authStore.js"
import { getValidToken } from "@/utils/api"
import { getProxyPostURL } from "@/config/gas"
import ProductDrawer from "@/components/stripe/ProductDrawer.vue"

const auth = useAuthStore()
const proxyUrl = getProxyPostURL()
const activeProduct = ref(null)
const achatsOpen = ref(false)

const abonnement = ref(null)
const achats = ref([])
const loading = ref(false)

const formatDate = d =>
  new Date(d).toLocaleDateString("fr-FR")
const CACHE_KEY = computed(() =>
  auth.user
    ? `purchases_${auth.user.prof_id}_${auth.user.email}`
    : null
)
const CACHE_TTL = 5 * 60 * 1000 // 5 min

function toggleAchats() {
  achatsOpen.value = !achatsOpen.value
}
function getCache() {
  if (!CACHE_KEY.value) return null
  try {
    const raw = sessionStorage.getItem(CACHE_KEY.value)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return data
  } catch {
    return null
  }
}

function setCache(data) {
  if (!CACHE_KEY.value) return
  sessionStorage.setItem(
    CACHE_KEY.value,
    JSON.stringify({ data, ts: Date.now() })
  )
}


watch(
  () => auth.user,
  user => {
    if (!user) return
    console.log("👤 auth.user ready → fetchPurchases")
    fetchPurchases()
  },
  { immediate: true }
)

// =====================================================
// FETCH PURCHASES
// =====================================================
async function fetchPurchases() {
  console.log("🟡 [fetchPurchases] START")

  // 1️⃣ cache instantané
  const cached = getCache()
  if (cached) {
    console.log("⚡ cache hit")
    abonnement.value = cached.abonnement
    achats.value = cached.achats
    loading.value = false

    // refresh silencieux
    refreshPurchases()
    return
  }

  // 2️⃣ pas de cache → fetch normal
  await refreshPurchases()
}
async function refreshPurchases() {
  loading.value = true
  console.log("🌐 refreshPurchases")

  try {
const res = await fetch(proxyUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    route: "getElevePurchases",
    prof_id: auth.user.prof_id,
    email: auth.user.email
  })
}).then(r => r.json())


    if (!res.success) return

    abonnement.value = res.abonnement || null
    achats.value = res.achats || []

    setCache({
      abonnement: abonnement.value,
      achats: achats.value
    })

    console.log("💾 cache updated")
  } catch (e) {
    console.error("🔥 refreshPurchases error", e)
  } finally {
    loading.value = false
  }
}


// =====================================================
// TOGGLE ITEM DETAILS
// =====================================================
function toggle(item) {
  item.show = !item.show
}
function openDrawer(item) {
  activeProduct.value = item
}
</script>


<style scoped>
  .section-title.clickable {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.chevron {
  transition: transform 0.25s ease;
  color: #888;
}

.chevron.open {
  transform: rotate(180deg);
}

.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.25s ease;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* =========================
   WRAPPER
   ========================= */
.purchases-panel {
  padding: 28px;
  max-width: 980px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .purchases-panel {
    padding: 36px;
  }
}

/* =========================
   SECTIONS
   ========================= */
.section {
  margin-bottom: 48px;
}

.section-title {
  font-size: 1.1rem;
  margin-bottom: 18px;
  color: #e6e6e6;
  font-weight: 500;
  letter-spacing: 0.3px;
}

/* =========================
   CARDS (APPLE STYLE)
   ========================= */
.item {
  background: #0b0c0f;          /* flat dark */
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 18px;
  border: none;
}

/* =========================
   TEXT
   ========================= */
.item-main h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: #f5f5f5;
}

.desc {
  font-size: 0.9rem;
  color: #b3b3b3;
  margin-top: 6px;
  line-height: 1.45;
}

/* =========================
   META
   ========================= */
.item-meta {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  font-size: 0.8rem;
  color: #8a8a8a;
}

/* =========================
   BADGES
   ========================= */
.badge {
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 500;
}

.badge.ok {
  background: rgba(234, 88, 12, 0.18); /* orange SBS */
  color: #fb923c;
}

.badge.off {
  background: rgba(120, 53, 15, 0.35);
  color: #fdba74;
}

/* =========================
   LINKS
   ========================= */
.link {
  display: inline-block;
  margin-top: 16px;
  font-size: 0.8rem;
  font-weight: 500;
  color: #fb923c;
  text-decoration: none;
}

.link:hover {
  opacity: 0.85;
}

/* =========================
   MUTED
   ========================= */
.muted {
  color: #777;
  font-size: 0.85rem;
}

/* =========================
   SKELETON (APPLE LIKE)
   ========================= */
.skeleton {
  width: 100%;
  height: 80px;
  border-radius: 18px;
  background: linear-gradient(
    90deg,
    #0b0c0f 25%,
    #1a1a1a 37%,
    #0b0c0f 63%
  );
  background-size: 400% 100%;
  animation: shine 1.6s ease infinite;
  margin-bottom: 18px;
}

@keyframes shine {
  0% { background-position: 100% 0 }
  100% { background-position: 0 0 }
}

.item.clickable {
  cursor: pointer;
}

.item.clickable:hover {
  background: #111217;
}

</style>

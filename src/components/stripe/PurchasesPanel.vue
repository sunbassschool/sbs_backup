<template>
  <div class="purchases-panel">

    <!-- ===================== -->
    <!-- ABONNEMENT -->
    <!-- ===================== -->
    <div class="section">
      <h2 class="section-title">Mon abonnement</h2>

      <!-- Loading -->
<div v-if="!ready">
        <div class="skeleton" />
      </div>

      <!-- Abonnement -->
<div v-else-if="abonnement" class="item abonnement-card">
  <div class="item-main">
    <h3>{{ abonnement.product_name || "Abonnement" }}</h3>

    <p class="desc">
      Montant : {{ abonnement["Montant (€)"] }} €
    </p>
  </div>

  <div class="item-meta">
    <span class="badge ok">Abonnement</span>
    <span>
      payé le {{ formatDate(abonnement.date_paiement) }}
    </span>
  </div>

  <a
    v-if="abonnement.facture_url"
    :href="abonnement.facture_url"
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
<div v-if="!ready">
        <div class="skeleton" />
        <div class="skeleton" />
      </div>

      <!-- Liste achats -->
 <div v-else-if="achats.length" class="purchases-list">
  <div
    v-for="a in achats"
    :key="a.session_id"
    class="purchase-card"
    @click.stop="openDrawer(a)"
  >
    <!-- LEFT -->
    <div class="purchase-main">
      <h3 class="title">
        {{ a["Nom du produit"] || "Produit" }}
      </h3>

      <div class="meta">
        <span class="date">
          {{ formatDate(a.date_paiement) }}
        </span>
        <span class="amount">
          {{ a["Montant (€)"] }} €
        </span>
      </div>
    </div>

    <!-- RIGHT -->
    <div class="purchase-actions">
      <a
        v-if="a['Facture PDF']"
        :href="a['Facture PDF']"
        target="_blank"
        class="invoice-link"
        @click.stop
      >
        Facture
      </a>

      <span class="chevron">›</span>
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
const achatsOpen = ref(true)
const ready = ref(false)

const abonnement = ref(null)
const achats = ref([])
const loading = ref(false)

const formatDate = d => {
  const date = d instanceof Date ? d : new Date(d)
  return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-FR")
}

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

    return {
      abonnement: data.abonnement
        ? {
            ...data.abonnement,
            date_paiement: parseDateSafe(data.abonnement.date_paiement)
          }
        : null,

      achats: Array.isArray(data.achats)
        ? data.achats.map(a => ({
            ...a,
            date_paiement: parseDateSafe(a.date_paiement)
          }))
        : []
    }
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
  abonnement.value = cached.abonnement || null
  achats.value = Array.isArray(cached.achats) ? cached.achats : []

  ready.value = true
  refreshPurchases()
  return
}


  // 2️⃣ pas de cache → fetch normal
  await refreshPurchases()
}

async function refreshPurchases() {
  loading.value = true
  console.log("🌐 refreshPurchases → START")

  try {
    const payload = {
      route: "getElevePurchases",
      email: auth.user.email
    }

    console.log("📤 payload =", payload)

    const res = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(r => r.json())

    console.log("📥 raw response =", res)

    if (!res?.success) {
      console.warn("⚠️ getElevePurchases failed", res)
      return
    }

    const rows = res.rows || []
    console.log("🧾 rows count =", rows.length)
    console.table(rows)

    // =========================
    // 🔧 NORMALISATION
    // =========================
    const mapped = rows.map(r => ({
      ...r,
      mode_paiement: r["Mode de paiement"],
      product_name: r["Nom du produit"] || null,
      facture_url: r["Facture PDF"] || null,
      date_paiement: parseDateSafe(r["Date paiement"]),
      session_id:
        r["Session ID / PaymentIntent"] ||
        r["Session ID"] ||
        Math.random().toString(36)
    }))

    // =========================
    // 📦 ABONNEMENT (dernier)
    // =========================
    abonnement.value =
      mapped
        .filter(r => r.mode_paiement === "subscription")
        .sort(
          (a, b) =>
            (b.date_paiement?.getTime() || 0) -
            (a.date_paiement?.getTime() || 0)
        )[0] || null

    // =========================
    // 🛒 ACHATS (hors abo)
    // =========================
    achats.value = mapped.filter(
      r => r.mode_paiement !== "subscription"
    )

    // =========================
    // 💾 CACHE
    // =========================
    setCache({
      abonnement: abonnement.value,
      achats: achats.value
    })

    console.log("💾 cache updated")

  } catch (e) {
    console.error("🔥 refreshPurchases error", e)
  } finally {
    loading.value = false
      ready.value = true

    console.log("🌐 refreshPurchases → END")
  }
}


// =====================================================
// TOGGLE ITEM DETAILS
// =====================================================
function parseDateSafe(v) {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

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
.purchases-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.purchase-card {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--card-bg, #fff);
  box-shadow: 0 4px 14px rgba(0,0,0,.05);
  cursor: pointer;
  transition: transform .15s ease, box-shadow .15s ease;
    overflow: hidden;            /* 🔒 anti débordement */

}

.purchase-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0,0,0,.08);
}

.purchase-main {
  flex: 1;
  min-width: 0;
}

.title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 6px;
  white-space: nowrap;
  overflow: hidden;
    white-space: normal;         /* 🔥 */
  word-break: break-word;      /* 🔥 */
  text-overflow: ellipsis;
}

.meta {
  display: flex;
    flex-wrap: wrap;             /* 🔥 */

  gap: 10px;
  font-size: 13px;
  color: #777;
}

.amount {
  font-weight: 500;
  color: #111;
}

.purchase-actions {
  display: flex;
  align-items: center;
    justify-content: space-between; /* 🔥 */

  gap: 10px;
}

.invoice-link {
  font-size: 13px;
  color: #0074d4;
  text-decoration: none;
  font-weight: 500;
}

.invoice-link:hover {
  text-decoration: underline;
}

.chevron {
  font-size: 18px;
  color: #aaa;
}

/* Desktop */
@media (min-width: 768px) {
  .purchase-card {
    padding: 16px 18px;
  }
}

/* =========================
   ABONNEMENT — HORIZONTAL
   ========================= */

.abonnement-card {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;          /* 🔥 clé anti overflow */
}

/* COLONNE GAUCHE */
.abonnement-card .item-main {
  flex: 1 1 180px;          /* grow + shrink */
  min-width: 0;
}

/* COLONNE CENTRE */
.abonnement-card .item-meta {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

/* COLONNE DROITE */
.abonnement-card .link {
  flex: 0 0 auto;
  margin-left: auto;       /* pousse à droite */
  white-space: nowrap;
}

/* TEXTE SAFE */
.abonnement-card h3 {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.abonnement-card .desc {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* MOBILE TIGHT */
@media (max-width: 480px) {
  .abonnement-card {
    gap: 10px;
  }

  .abonnement-card .item-meta {
    font-size: 0.75rem;
  }

  .abonnement-card .link {
    font-size: 0.75rem;
  }
}


</style>

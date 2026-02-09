<template>
  <!-- HEADER MARKETING -->
  <MarketingHeader />

  <section class="pricing-page pricing--sell">

    <!-- =====================================================
         HERO
         ===================================================== -->
    <header class="pricing-hero">
      <span class="badge">Tarification simple</span>

      <h1>
        Commence gratuitement.<br />
      </h1>

      <p>Utilisé par des profs indépendants et des écoles.</p>
    </header>

    <!-- =====================================================
         GRID TARIFS
         ===================================================== -->
    <div class="pricing-grid">

      <!-- ================= FREE ================= -->
      <article class="pricing-card">
        <h3>Free</h3>
        <p class="price">0 €</p>
        <p class="period">/ mois</p>

        <ul>
          <li>✔️ Élèves illimités</li>
          <li>✔️ Planning & cours</li>
          <li>✔️ Paiements intégrés</li>
          <li>✔️ 1 Go de fichiers</li>
          <li class="muted">❌ Frais sur chaque paiement</li>
        </ul>

        <!-- Pas connecté → inscription -->
        <RouterLink
          v-if="!auth.user"
          to="/register"
          class="btn ghost full"
        >
          Créer mon compte
        </RouterLink>

        <!-- Connecté → déjà sur Free -->
        <button
          v-else
          class="btn ghost full"
          disabled
        >
          Plan actuel
        </button>
      </article>

  <!-- ================= PRO ================= -->
<article class="pricing-card featured">
  <span class="pill">Choix recommandé</span>

  <h3>Pro</h3>

  <p class="price highlight">15 €</p>
  <small class="anchor">≈ 1 cours payé</small>
  <p class="period">/ mois</p>

  <ul>
    <li class="strong">✅ Tu gardes 100 % de tes revenus</li>
    <li>✔️ Paiements & abonnements</li>
    <li>✔️ 20 Go de fichiers</li>
    <li>✔️ Historique des cours</li>
    <li>✔️ Image professionnelle</li>
  </ul>

  <!-- NON CONNECTÉ -->
  <RouterLink
    v-if="!auth.user"
    to="/register"
    class="btn primary full"
  >
    Créer mon compte
  </RouterLink>

  <!-- CONNECTÉ -->
<button
  v-else
  class="btn primary full"
  :disabled="checkoutTarget === 'teachy_pro' || !isProReady"
  @click="subscribe('teachy_pro')"
>
  <span v-if="checkoutTarget === 'teachy_pro'">
    Redirection…
  </span>
  <span v-else-if="!isProReady">
    Chargement de l’offre…
  </span>
  <span v-else>
    Gagner plus, passer Pro
  </span>
</button>


  <small class="reassure">
    Sans engagement • Passe Pro quand tu veux
  </small>
</article>


      <!-- ================= STUDIO ================= -->
      <article class="pricing-card">
        <h3>Studio</h3>
        <p class="subtitle">Pour écoles & structures</p>

        <p class="price">29 €</p>
        <p class="period">/ mois</p>

        <ul>
          <li class="strong">✅ Tu gardes 100 % de tes revenus</li>
          <li>✔️ 100 Go de fichiers</li>
          <li>✔️ Branding personnalisé</li>
          <li>✔️ Statistiques & revenus</li>
          <li>✔️ Support prioritaire</li>
        </ul>

        <!-- connecté -->
       <button
  v-if="auth.user"
  class="btn ghost full"
:disabled="checkoutTarget === 'teachy_studio'"
  @click="subscribe('teachy_studio')"
>

  <span v-if="checkoutTarget === 'teachy_studio'">
    Redirection…
  </span>
  <span v-else>
    Développer mon école
  </span>


</button>


        <!-- non connecté -->
        <RouterLink
          v-else
          to="/register"
          class="btn ghost full"
        >
          Créer un compte
        </RouterLink>
      </article>

    </div>

    <!-- =====================================================
         FOOTER INFO
         ===================================================== -->
    <p class="legal">
      * Frais Stripe standards applicables.
    </p>
<!-- OVERLAY CHECKOUT (GLOBAL) -->
<div v-if="checkoutTarget" class="checkout-overlay">
  <div class="checkout-modal">
    <span class="spinner"></span>
    <p class="title">Redirection sécurisée</p>
    <p class="subtitle">Ouverture du paiement…</p>
  </div>
</div>

  </section>
</template>

<script setup>
/* =========================================================
   📦 IMPORTS
   ========================================================= */
import { ref, onMounted, computed } from "vue"
import { useAuthStore } from "@/stores/authStore"
import { getProxyPostURL } from "@/config/gas"
import { storeToRefs } from "pinia"

import MarketingHeader from "@/components/MarketingHeader.vue"

/* =========================================================
   🔐 CONTEXT
   ========================================================= */
const auth = useAuthStore()
const proxyUrl = getProxyPostURL("")
const { user, authReadyLight, authFullyReady } = storeToRefs(auth)

/* =========================================================
   🧠 CACHE CONFIG
   ========================================================= */
const CACHE_KEY = "pricing_prof_plans_v1"
const CACHE_TTL = 5 * 60 * 1000 // 5 min

/* =========================================================
   🧾 STATE
   ========================================================= */
const loading = ref(false)
const plansReady = ref(false)
const isCheckout = ref(false)
const products = ref([])
const checkoutTarget = ref(null) // 'teachy_pro' | 'teachy_studio' | null
const isCheckingOutPro = ref(false)
const isCheckingOutStudio = ref(false)

/* =========================================================
   ⚡ COMPUTED
   ========================================================= */
const isProReady = computed(() =>
  products.value.some(
    p => p.droit_code === "teachy_pro" && p.prices?.length
  )
)

/* =========================================================
   📦 CACHE HELPERS
   ========================================================= */
const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null

    const cached = JSON.parse(raw)
    const age = Date.now() - cached.ts

    if (age > CACHE_TTL) {
      console.log("🗑️ [Pricing] cache expired")
      localStorage.removeItem(CACHE_KEY)
      return null
    }

    console.log("⚡ [Pricing] cache hit")
    return cached.products || null
  } catch (e) {
    console.warn("⚠️ [Pricing] cache invalid", e)
    return null
  }
}

const writeCache = (products) => {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        ts: Date.now(),
        products
      })
    )
    console.log("💾 [Pricing] cache saved")
  } catch (e) {
    console.warn("⚠️ [Pricing] cache write failed", e)
  }
}

/* =========================================================
   📡 FETCH PLANS (CACHE FIRST)
   ========================================================= */
const fetchProfPlans = async () => {
  console.log("💰 [Pricing] init")

  // ⚡ 1️⃣ cache instant
  const cached = readCache()
  if (cached) {
    products.value = cached
    plansReady.value = true
    return
  }

  // 🌍 2️⃣ réseau
  loading.value = true
  plansReady.value = false

  try {
    console.log("🌍 [Pricing] fetch from GAS")

    const res = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "listProfPlansWithPrices"
      })
    })

    const json = await res.json()
    console.log("💰 [Pricing] response", json)

    products.value = json.products || []
    plansReady.value = true

    writeCache(products.value)

    console.log(
      "✅ [Pricing] ready",
      products.value.map(p => ({
        droit: p.droit_code,
        prices: p.prices?.length || 0
      }))
    )
  } catch (e) {
    console.error("❌ [Pricing] fetch failed", e)
    products.value = []
    plansReady.value = false
  } finally {
    loading.value = false
  }
}

/* =========================================================
   💳 SUBSCRIBE
   ========================================================= */
const subscribe = async (droitCode) => {
  if (checkoutTarget.value) return

  // pas connecté → register
  if (!auth.user) {
    router.push("/register")
    return
  }

  // JWT lazy
  const jwt = await auth.ensureValidJwt()
  if (!jwt) {
    router.push("/login")
    return
  }

  const product = products.value.find(
    p => p.droit_code === droitCode
  )
  if (!product || !product.prices?.length) return

  checkoutTarget.value = droitCode

  try {
    const res = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "createCheckoutSessionProfPlan",
        prof_id: auth.user.prof_id,
        product_id: product.product_id,
        price_id: product.prices[0].price_id,
        prof_email: auth.user.email
      })
    })

    const json = await res.json()
    if (json.checkout_url) {
      window.location.href = json.checkout_url
    }
  } finally {
    checkoutTarget.value = null
  }
}



/* =========================================================
   🚀 INIT
   ========================================================= */
onMounted(fetchProfPlans)
</script>


<style scoped>
/* ================= BASE ================= */

.pricing-page {
  --bg: #0b0b0f;
  --panel: #13131a;
  --panel-soft: #1b1b25;
  --text: #f8fafc;
  --muted: #9ca3af;
  --accent: #f59e0b;
  --border: rgba(255,255,255,0.08);

  min-height: 100vh;
  overflow-y: auto;
  padding: clamp(4rem, 8vh, 6rem) 1.2rem 4rem;

  background: radial-gradient(1200px 600px at 50% -10%, #1a1a22, #0b0b0f);
  color: var(--text);
}

/* ================= HERO ================= */

.pricing-hero {
  max-width: 680px;
  margin: 0 auto 2.5rem;
  text-align: center;
}

.pricing-hero h1 {
  font-size: clamp(1.9rem, 4vw, 2.6rem);
  font-weight: 900;
  line-height: 1.15;
  margin-top: 0.8rem;
}

.pricing-hero p {
  margin-top: 0.6rem;
  font-size: 0.95rem;
  color: var(--muted);
}

.badge {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted);
  border: 1px solid var(--border);
}

/* ================= GRID ================= */

.pricing-grid {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.8rem;
}

/* ================= CARD ================= */

.pricing-card {
  background: linear-gradient(180deg, var(--panel), var(--panel-soft));
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 2rem 1.6rem;
  display: flex;
  flex-direction: column;
  opacity: 0.9;
}

.pricing-card h3 {
  font-size: 1.3rem;
  font-weight: 800;
}

.price {
  font-size: 2.4rem;
  font-weight: 900;
  margin-top: 0.5rem;
}

.price.highlight {
  color: var(--accent);
}

.anchor {
  font-size: 0.75rem;
  color: var(--muted);
}

.period {
  margin-top: -0.2rem;
  color: var(--muted);
}

.subtitle {
  font-size: 0.85rem;
  color: var(--muted);
  margin-top: -0.3rem;
}

/* ================= FEATURED ================= */

.pricing-card.featured {
  opacity: 1;
  border: 2px solid var(--accent);
  transform: scale(1.05);
  box-shadow: 0 28px 60px rgba(0,0,0,0.6);
}

.pill {
  position: absolute;
  top: -12px;
  right: 18px;
  background: var(--accent);
  color: #000;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
}

/* ================= LIST ================= */

.pricing-card ul {
  margin: 1.5rem 0 2rem;
  padding: 0;
  list-style: none;
  line-height: 1.7;
}

.pricing-card li {
  font-size: 0.95rem;
}

.pricing-card li.muted {
  color: var(--muted);
}

.pricing-card li.strong {
  font-weight: 700;
}

/* Accent uniquement pour Pro */
.pricing-card:not(.featured) .strong {
  color: var(--text);
}
.pricing-card.featured .strong {
  color: var(--accent);
}

/* ================= BUTTONS ================= */

.btn {
  border-radius: 14px;
  padding: 0.75rem 1.2rem;
  font-weight: 700;
  text-decoration: none;
  text-align: center;
}

.btn.full {
  width: 100%;
}

.btn.primary {
  background: var(--accent);
  color: #000;
}

.btn.ghost {
  border: 1px solid var(--border);
  color: var(--text);
}

/* ================= REASSURE ================= */

.reassure {
  margin-top: 0.6rem;
  font-size: 0.75rem;
  color: var(--muted);
  text-align: center;
}

/* ================= FOOT ================= */

.legal {
  margin-top: 2.5rem;
  text-align: center;
  font-size: 0.8rem;
  color: var(--muted);
}

/* ================= MOBILE ================= */

@media (max-width: 640px) {
  .pricing-card.featured {
    order: -1;
  }
}

/* =================== FREE ===================== */
/* Free = moins attirante */
.pricing-card:first-child {
  opacity: 0.85;
  filter: saturate(0.85);
}

@media (hover: hover) {
  .pricing-card:first-child:hover {
    opacity: 1;
    filter: none;
  }
}

.checkout-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  z-index: 999999; /* 🔥 au-dessus de tout */
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkout-modal {
  background: #111;
  border-radius: 16px;
  padding: 28px 32px;
  min-width: 260px;
  max-width: 90vw;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,.6);
  color: #fff;
}

.checkout-modal .title {
  margin-top: 12px;
  font-weight: 700;
  font-size: 1rem;
}

.checkout-modal .subtitle {
  margin-top: 4px;
  font-size: 0.85rem;
  opacity: 0.7;
}

/* spinner */
.spinner {
  width: 28px;
  height: 28px;
  margin: 0 auto;
  border: 3px solid rgba(255,255,255,.3);
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: spin .8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

</style>

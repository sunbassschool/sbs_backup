<template>
  <section class="stripe-revenus light">

    <!-- HEADER -->
    <header class="revenus-header">
      <div>
        <h1>Revenus</h1>
        <p class="subtitle">Vue d’ensemble de tes paiements</p>
      </div>
    </header>

        <!-- bouton stripe -->

    <div class="stripe-dashboard-access">
  <div>
    <h3>Dashboard Stripe</h3>
    <p>Gère tes paiements et virements sur Stripe</p>
  </div>

<button
  class="stripe-btn"
  @click="openStripeDashboard"
  :disabled="openingStripe"
>
  <template v-if="openingStripe">
    <span class="spinner small"></span>
    Ouverture…
  </template>
  <template v-else>
    Ouvrir Stripe
  </template>
</button>

</div>


    <!-- LOADING -->
  <div v-if="loading" class="revenus-loader">
  <span class="spinner"></span>
  <span class="text">Chargement des revenus…</span>
</div>





    <!-- CONTENT -->
    <template v-else>

<!-- STRIPE STATUS -->
<div class="stripe-status" :class="statusClass">
  <span class="dot"></span>
  <span class="label">{{ statusLabel }}</span>

  <button
    v-if="statusAction"
    class="action"
    @click="onStripeAction"
  >
    {{ statusAction }}
  </button>
</div>



      <!-- CARDS -->
   <div class="cards">
  <!-- BRUT -->
  <div class="card premium primary">
    <span class="label">Revenus encaissés</span>
    <span class="value">{{ euro(month.total) }}</span>
    <span class="hint">Total payé par tes élèves</span>
  </div>

  <!-- NET -->
  <div class="card premium success">
    <span class="label">Revenus nets</span>
    <span class="value">{{ euro(balance.pending) }}</span>
    <span class="hint">Après frais de paiement</span>
  </div>

  <!-- DISPONIBLE -->
  <div class="card premium info">
    <span class="label">Disponible au virement</span>
    <span class="value">{{ euro(balance.available) }}</span>
    <span class="hint">Transférable vers ton compte bancaire</span>
  </div>
</div>


   <!-- PAYMENTS -->
<div class="payments">

<button class="accordion-toggle" @click="open = !open">
  <span class="title">Historique des paiements</span>

  <span class="count">{{ payments.length }}</span>
  <i :class="open ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"></i>
</button>


  <transition name="accordion">
<div v-if="open" class="accordion-content">

      <div v-if="!payments.length" class="empty">
        Aucun paiement enregistré
      </div>

      <div v-else class="payments-list">
        <div
          v-for="p in payments"
          :key="p.id"
          class="payment-row"
        >
          <div class="left">
            <span class="date">{{ dateFR(p.date) }}</span>
      <span class="name" v-if="p.customer_name">
  {{ p.customer_name }}
</span>
<span class="email" v-else-if="p.customer_email">
  {{ p.customer_email }}
</span>

            <span class="id">{{ p.id }}</span>
          </div>

          <div class="right">
            <span class="amount">{{ euro(p.amount) }}</span>
            <span class="status success">Payé</span>
          </div>
        </div>
      </div>

    </div>
  </transition>
</div>


    </template>
  </section>
</template>


<script setup>
import { ref, watch, computed,watchEffect } from "vue"
import { useAuthStore } from "@/stores/authStore.js"
import { getProxyPostURL } from "@/config/gas"
const openingStripe = ref(false)

const auth = useAuthStore()
const proxyUrl = getProxyPostURL()
const euro = (c) => ((c || 0) / 100).toFixed(2) + " €"
const dateFR = (ts) =>
  ts ? new Date(ts * 1000).toLocaleDateString("fr-FR") : "—"
const open = ref(false)
const month = ref({ total: 0 })
const userId = computed(() => auth.user?.user_id || null)
const role = computed(() => auth.user?.role || null)

const loading = ref(false)
const balance = ref({
  available: 0,
  pending: 0,
  currency: "eur"
})
const payments = ref([])
const raw = ref(null)
const stripeStatus = ref(null)

const debug = true // passe à false quand OK

//----- CACHE SESSION STORAGE
const CACHE_TTL = 4 * 60 * 1000

const stripeStatusKey = computed(() =>
  userId.value ? `stripe_status_${userId.value}` : null
)
const cacheKey = `stripe_status_${userId.value}`
const cached = getCache(cacheKey)

// ---- RÈGLES ----
const status = computed(() => {
  if (!stripeStatus.value?.stripe_account_id) return "none"
  if (
    !stripeStatus.value.charges_enabled ||
    !stripeStatus.value.payouts_enabled
  ) return "incomplete"
  return "ready"
})


const statusLabel = computed(() => {
  if (status.value === "ready") return "Stripe connecté"
  if (status.value === "incomplete") return "Stripe à compléter"
  return "Stripe non connecté"
})

const statusClass = computed(() => {
  if (status.value === "ready") return "ok"
  if (status.value === "incomplete") return "warn"
  return "error"
})

const statusAction = computed(() => {
  if (status.value === "ready") return null
  if (status.value === "incomplete") return "Finaliser"
  return "Connecter"
})




console.group("💳 [StripeRevenusProf] INIT")
console.log("jwt:", auth.jwt ? "OK" : "MISSING")
console.groupEnd()


//-------- HELPERS
function getCache(key) {
  const raw = sessionStorage.getItem(key)
  if (!raw) return null

  const { data, ts } = JSON.parse(raw)
  if (Date.now() - ts > CACHE_TTL) {
    sessionStorage.removeItem(key)
    return null
  }
  return data
}
function openExternal(url) {
  if (window.matchMedia("(display-mode: standalone)").matches) {
    window.location.href = url
  } else {
    window.open(url, "_blank", "noopener")
  }
}

function setCache(key, data) {
  sessionStorage.setItem(
    key,
    JSON.stringify({ data, ts: Date.now() })
  )
}

// 🔁 attendre prof_id avant de fetch
watch(
  () => [auth.authReady, userId.value],
([ready, userIdVal]) => {
  if (!ready || !userIdVal) {
    console.log("⏳ attente authReady + user_id…")
    return
  }


    fetchRevenus()
    fetchStripeStatus()
  },
  { immediate: true }
)

watchEffect(() => {
  console.log("DEBUG auth:", {
    authReady: auth.authReady,
    user_id: userId.value,
    role: role.value
  })
})


async function fetchStripeStatus() {
const STRIPE_STATUS_KEY = computed(() =>
  userId.value ? `stripe_status_${userId.value}` : null
)

const cached = getCache(STRIPE_STATUS_KEY)

if (cached) {
  stripeStatus.value = cached
  return
}

  const res = await fetch(proxyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
  route: "stripeconnectstatus",
  user_id: userId.value,
  jwt: auth.jwt
})

  }).then(r => r.json())

  if (res.success) {
    stripeStatus.value = res
setCache(cacheKey, res)

  }
}

async function onStripeAction() {
  // réutilise ta route de login link
  const res = await fetch(proxyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      route: "createstripeloginlink",
      user_id: userId.value,
      jwt: auth.jwt
    })
  }).then(r => r.json())

  if (res.success && res.url) window.open(res.url, "_blank")
}

async function fetchRevenus() {
  if (!userId.value) {
    console.warn("🚫 fetchRevenus appelé sans user_id")
    return
  }

  const cacheKey = `stripe_revenus_${userId.value}`
  const cached = getCache(cacheKey)

  if (cached) {
    balance.value = cached.balance || balance.value
    payments.value = cached.payments || []
    month.value = cached.month || { total: 0 }
    return
  }


  loading.value = true

  try {
    const payload = {
      route: "getprofstripeoverview",
      user_id: userId.value,
      jwt: auth.jwt
    }

    console.log("➡️ payload envoyé:", payload)

    const res = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    console.log("⬅️ HTTP status:", res.status)

    const text = await res.text()
    console.log("⬅️ raw response:", text)

    raw.value = text

    let json
    try {
      json = JSON.parse(text)
    } catch (e) {
      console.error("❌ JSON parse error", e)
      return
    }

    console.log("📦 parsed json:", json)

    if (!json.success) {
      console.error("❌ backend error:", json)
      return
    }

    balance.value = json.balance || balance.value
    payments.value = json.payments || []
month.value = json.month || { total: 0 }
setCache(cacheKey, {
  balance: json.balance || balance.value,
  payments: json.payments || [],
  month: json.month || { total: 0 }
})


    console.log("✅ balance:", balance.value)
    console.log("✅ payments count:", payments.value.length)

  } catch (e) {
    console.error("🔥 fetchRevenus error:", e)
  } finally {
    loading.value = false
    console.groupEnd()
  }
}
async function openStripeDashboard() {
  if (openingStripe.value) return

  openingStripe.value = true

  try {
    const res = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "createstripeloginlink",
        user_id: userId.value,
        jwt: auth.jwt
      })
    }).then(r => r.json())

    if (res.success && res.url) {
      openExternal(res.url)
    } else {
      alert("Impossible d’ouvrir Stripe")
    }

  } catch (e) {
    console.error("❌ openStripeDashboard", e)
    alert("Erreur Stripe")
  } finally {
    openingStripe.value = false
  }
}


</script>


<style>
    /* GLOBAL */
.stripe-revenus.light {
  padding: 24px;
  background: #f8fafc;
  color: #0f172a;
}

/* HEADER */
.revenus-header h1 {
  font-size: 26px;
  margin: 0;
}

.subtitle {
  margin-top: 4px;
  font-size: 14px;
  color: #475569;
}

/* LOADER */
.loader {
  padding: 30px;
  text-align: center;
  color: #64748b;
}

/* =========================
   PREMIUM CARDS — LIGHT UI
   ========================= */
.cards{
  display:grid;
  grid-template-columns:repeat(3, minmax(0,1fr));
  gap:14px;

}

.card.premium{
  position:relative;
  background: linear-gradient(180deg, #ffffff 0%, #fbfbfc 100%);
  border:1px solid rgba(15, 23, 42, .10);
  border-radius:16px;
  padding:16px 16px 14px;
  box-shadow:
    0 10px 26px rgba(15, 23, 42, .06),
    0 2px 6px rgba(15, 23, 42, .04);
  display:flex;
  flex-direction:column;
  gap:6px;
  transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
  overflow:hidden;
}

.card.premium:hover{
  transform: translateY(-2px);
  border-color: rgba(15, 23, 42, .16);
  box-shadow:
    0 14px 34px rgba(15, 23, 42, .09),
    0 4px 10px rgba(15, 23, 42, .06);
}

.card.premium::before{
  content:"";
  position:absolute;
  inset:0;
  opacity:.06;
  pointer-events:none;
  background:
    radial-gradient(600px 140px at 10% 0%, rgba(0,0,0,.25), transparent 60%),
    radial-gradient(500px 120px at 90% 10%, rgba(0,0,0,.18), transparent 65%);
}

.card.premium .label{
  font-size:.78rem;
  text-transform:uppercase;
  letter-spacing:.06em;
  color:#334155;
  opacity:.75;
}

.card.premium .value{
  font-size:1.65rem;
  font-weight:800;
  line-height:1.15;
  color:#0f172a;
}

.card.premium .hint{
  font-size:.82rem;
  color:#475569;
  opacity:.9;
}

/* left accent + tiny top highlight */
.card.primary{ border-left:4px solid #f59e0b; }
.card.success{ border-left:4px solid #22c55e; }
.card.info{ border-left:4px solid #3b82f6; }

.card.primary::after,
.card.success::after,
.card.info::after{
  content:"";
  position:absolute;
  top:-40px;
  right:-40px;
  width:140px;
  height:140px;
  border-radius:999px;
  opacity:.10;
  filter: blur(0.2px);
  pointer-events:none;
}

.card.primary::after{ background: radial-gradient(circle, #f59e0b 0%, transparent 65%); }
.card.success::after{ background: radial-gradient(circle, #22c55e 0%, transparent 65%); }
.card.info::after{ background: radial-gradient(circle, #3b82f6 0%, transparent 65%); }

/* =========================
   RESPONSIVE
   ========================= */
@media (max-width: 992px){
  .cards{ grid-template-columns: repeat(2, minmax(0,1fr)); }
}

@media (max-width: 520px){
  .cards{ grid-template-columns: 1fr; gap:12px; }
  .card.premium{ padding:14px 14px 12px; border-radius:14px; }
  .card.premium .value{ font-size:1.45rem; }
  .card.premium .hint{ font-size:.8rem; }
}

/* Optional: reduce motion */
@media (prefers-reduced-motion: reduce){
  .card.premium{ transition:none; }
  .card.premium:hover{ transform:none; }
}


.card {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

.card.primary {
  border-color: #22c55e;
  box-shadow: 0 0 0 2px #22c55e15;
}

.label {
  font-size: 13px;
  color: #475569;
}

.value {
  font-size: 30px;
  font-weight: 800;
  margin: 6px 0;
}

.hint {
  font-size: 12px;
  color: #64748b;
}

/* PAYMENTS */
.payments h2 {
  font-size: 20px;
  margin-bottom: 14px;
}

.payments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-row {
  background: #ffffff;
  border-radius: 14px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.payment-row:hover {
  background: #f1f5f9;
}

/* LEFT */
.left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date {
  font-size: 14px;
  font-weight: 600;
}

.email {
  font-size: 13px;
  color: #475569;
}

.id {
  font-size: 11px;
  color: #94a3b8;
  font-family: monospace;
}

/* RIGHT */
.right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.amount {
  font-size: 16px;
  font-weight: 700;
}

.status {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
}

.status.success {
  background: #dcfce7;
  color: #15803d;
}

/* EMPTY */
.empty {
  padding: 30px;
  text-align: center;
  color: #64748b;
}
.accordion-toggle {
  position: relative;
  width: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px 44px 14px 16px;

  display: block;
  text-align: left;

  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  cursor: pointer;
}

/* titre */
.accordion-toggle .title {
  display: inline-block;
}

/* compteur à DROITE */
.accordion-toggle .count {
  position: absolute;
  right: 36px;
  top: 50%;
  transform: translateY(-50%);

  background: #e2e8f0;
  color: #334155;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
}

/* chevron tout à droite */
.accordion-toggle i {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
}



.accordion-content {
  margin-top: 12px;
}

/* animation */
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.25s ease;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}


@media (max-width: 420px) {
  .cards {
    grid-template-columns: 1fr;
  }
}
/* RESPONSIVE CARDS */
@media (max-width: 768px) {
  .cards {
    gap: 12px;
    margin: 20px 0 28px;
  }

  .card {
    padding: 14px;
  }

  .card-value,
  .value {
    font-size: 22px; /* au lieu de 30px */
  }

  .label {
    font-size: 12px;
  }

  .hint {
    font-size: 11px;
  }
}

@media (max-width: 420px) {
  .cards {
    grid-template-columns: 1fr;
  }

  .card-value,
  .value {
    font-size: 20px;
  }
}

.stripe-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  margin-bottom: 16px;
}

.stripe-status .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.stripe-status .label {
  font-weight: 600;
}

.stripe-status .action {
  margin-left: auto;
  background: transparent;
  border: 1px solid currentColor;
  padding: 6px 10px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

/* STATES */
.stripe-status.ok {
  color: #15803d;
}
.stripe-status.ok .dot {
  background: #22c55e;
}

.stripe-status.warn {
  color: #a16207;
}
.stripe-status.warn .dot {
  background: #f59e0b;
}

.stripe-status.error {
  color: #b91c1c;
}
.stripe-status.error .dot {
  background: #ef4444;
}
/* ✅ FIX iOS Safari – scroll page Revenus */
.stripe-revenus {
  min-height: calc(100dvh - 80px);
  overflow: visible;
}

.stripe-revenus::after {
  content: "";
  display: block;
  height: 1px;
}

.accordion-toggle {
  touch-action: pan-y;
}
.payments {
  flex-grow: 1;
    margin-top:10px;

}
.stripe-revenus {
  display: flex;
  flex-direction: column;
}
.spinner.small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .8s linear infinite;
  display: inline-block;
  margin-right: 6px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
/* =========================
   STRIPE BUTTON — PREMIUM
   ========================= */
.stripe-btn{
  position:relative;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  padding:12px 18px;
  min-height:44px;
  border-radius:14px;
  border:1px solid rgba(15,23,42,.14);
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  color:#0f172a;
  font-weight:700;
  font-size:.95rem;
  letter-spacing:.01em;
  cursor:pointer;
  box-shadow:
    0 10px 24px rgba(15,23,42,.08),
    0 2px 6px rgba(15,23,42,.05);
  transition:
    transform .15s ease,
    box-shadow .15s ease,
    border-color .15s ease,
    background .15s ease,
    opacity .15s ease;
}

/* hover / focus */
.stripe-btn:hover{
  transform: translateY(-1px);
  border-color: rgba(15,23,42,.22);
  box-shadow:
    0 14px 34px rgba(15,23,42,.12),
    0 4px 10px rgba(15,23,42,.08);
}

.stripe-btn:focus-visible{
  outline:none;
  box-shadow:
    0 0 0 3px rgba(59,130,246,.35),
    0 10px 24px rgba(15,23,42,.10);
}

/* active */
.stripe-btn:active{
  transform: translateY(0);
  box-shadow:
    0 6px 14px rgba(15,23,42,.12),
    0 2px 6px rgba(15,23,42,.08);
}

/* loading state */
.stripe-btn.loading{
  pointer-events:none;
  opacity:.85;
}

.stripe-btn.loading::before{
  content:"";
  width:16px;
  height:16px;
  border-radius:50%;
  border:2px solid rgba(15,23,42,.25);
  border-top-color:#0f172a;
  animation: stripe-spin .8s linear infinite;
}

/* success / accent (optional) */
.stripe-btn.primary{
  background: linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%);
  border-color: rgba(245,158,11,.35);
}

.stripe-btn.primary:hover{
  border-color: rgba(245,158,11,.55);
}

/* =========================
   RESPONSIVE
   ========================= */
@media (max-width: 520px){
  .stripe-btn{
    width:100%;
    padding:12px 14px;
    border-radius:12px;
  }
}

/* spinner keyframes */
@keyframes stripe-spin{
  to{ transform: rotate(360deg); }
}

</style>

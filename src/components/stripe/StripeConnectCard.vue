<template>
  <div class="card stripe-card">
   

    <!-- LOADING -->
    <p v-if="loading">🔄 Vérification Stripe…</p>

    <!-- READY -->
 <div v-else-if="stripeReady" class="state ok">
  

  <router-link
    to="/dashboard-prof/offres"
    class="cta-link"
  >
    ➕ Vendre mon premier cours
  </router-link>
   <router-link
    to="/prof/planning/create"
    class="cta-link"
  >
    ➕ Génerer un planning
  </router-link>
   <router-link
    to="/gestioneleves"
    class="cta-link"
  >
    ➕ Mes élèves
  </router-link>
</div>



<!-- PENDING -->
<div v-else-if="stripePending" class="state pending">
  <p>⏳ Configuration des paiements en cours</p>

  <p class="small">
    Tu as déjà commencé la configuration.<br />
    Stripe attend encore une vérification
    (identité, documents, IBAN…).
  </p>

  <button class="btn" @click="goToStripeConnect">
    Continuer la configuration Stripe
  </button>

  <button class="btn secondary" @click="checkStatus">
    Rafraîchir le statut
  </button>
</div>

<!-- NOT CONNECTED -->
<div v-else class="state warn">
  <p>❌ Paiements non activés</p>

  <button class="btn" @click="goToStripeConnect">
    Activer les paiements
  </button>
</div>



  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useAuthStore } from "@/stores/authStore"
import { getValidToken } from "@/utils/api.ts"
import { getProxyPostURL } from "@/config/gas"

const auth = useAuthStore()
const proxyUrl = getProxyPostURL()

const loading = ref(false)
const stripeReady = ref(false)
const stripeAccountId = ref(null)
const onboardingStarted = ref(false)
const onboardingLoading = ref(false)
const stripePending = ref(false)
// =====================================================
// CACHE STRIPE STATUS (SWR)
// =====================================================
const STRIPE_CACHE_TTL = 5 * 60 * 1000
const getStripeCacheKey = profId => `stripe_status_${profId}`

const loadStripeFromCache = (profId) => {
  try {
    const raw = sessionStorage.getItem(getStripeCacheKey(profId))
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.ts > STRIPE_CACHE_TTL) return null

    return parsed.data
  } catch {
    return null
  }
}

const saveStripeToCache = (profId, data) => {
  sessionStorage.setItem(
    getStripeCacheKey(profId),
    JSON.stringify({ ts: Date.now(), data })
  )
}

const clearStripeCache = (profId) => {
  sessionStorage.removeItem(getStripeCacheKey(profId))
}
const applyStripeState = (res) => {
  if (res?.stripe_ready === true) {
    stripeReady.value = true
    stripePending.value = false
    auth.user.stripe_ready = true
  } else if (res?.stripe_account_id) {
    stripeReady.value = false
    stripePending.value = true
    auth.user.stripe_ready = false
  } else {
    stripeReady.value = false
    stripePending.value = false
    auth.user.stripe_ready = false
  }

  stripeAccountId.value = res?.stripe_account_id || null
}
const checkStatusNetwork = async () => {
  loading.value = !stripeReady.value && !stripePending.value

  try {
    const jwt = await getValidToken()
    console.log("🟡 stripeconnectstatus → payload", {
      prof_id: auth.user.prof_id,
      jwt: jwt?.slice(0, 20) + "..."
    })

    const resp = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "stripeconnectstatus",
        jwt,
        prof_id: auth.user.prof_id
      })
    })

    console.log("🟡 stripeconnectstatus → HTTP", resp.status)

    const text = await resp.text()
    console.log("🟡 stripeconnectstatus → raw", text)

    const res = JSON.parse(text)
    console.log("🟢 stripeconnectstatus → parsed", res)

    applyStripeState(res)
    saveStripeToCache(auth.user.prof_id, res)

  } catch (e) {
    console.error("❌ stripeconnectstatus ERROR", e)
  } finally {
    loading.value = false
  }
}


// =====================================================
// 🔎 CHECK STATUS
// =====================================================
const checkStatus = () => {
  const profId = auth.user?.prof_id
  if (!profId) return

  // 1️⃣ cache immédiat
  const cached = loadStripeFromCache(profId)
  if (cached) {
    applyStripeState(cached)
    // 🔥 refresh arrière-plan
    checkStatusNetwork()
    return
  }

  // 2️⃣ pas de cache → réseau
  checkStatusNetwork()
}


// =====================================================
// 🔗 GO TO STRIPE CONNECT
// =====================================================
const goToStripeConnect = async () => {
  clearStripeCache(auth.user.prof_id)

  onboardingStarted.value = true
  onboardingLoading.value = true

  // 1️⃣ ouverture immédiate (anti popup blocker)
  const stripeWindow = window.open("about:blank", "_blank")

  // sécurité (au cas où)
  if (!stripeWindow) {
    onboardingLoading.value = false
    alert("Merci d’autoriser les popups pour continuer avec Stripe.")
    return
  }

  // 2️⃣ loader visuel (évite page blanche)
  stripeWindow.document.write(`
    <html>
      <head>
        <title>Connexion Stripe</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body {
            margin: 0;
            background: #0b0c0f;
            color: #e6e6e6;
            font-family: system-ui, -apple-system;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
          }
          .box { text-align: center; }
          .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(255,255,255,.2);
            border-top-color: #fb923c;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 12px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="box">
          <div class="spinner"></div>
          <div>Connexion sécurisée à Stripe…</div>
        </div>
      </body>
    </html>
  `)

  try {
    // 3️⃣ appel backend
    const jwt = await getValidToken()

    const resp = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "stripeconnectlink",
        jwt,
        prof_id: auth.user.prof_id
      })
    })

    const text = await resp.text()

    if (!text.trim().startsWith("{")) {
      throw new Error("Non-JSON response (GAS crash / HTML)")
    }

    const res = JSON.parse(text)

    // 4️⃣ redirection Stripe
    if (res?.onboarding_url) {
      stripeWindow.location.replace(res.onboarding_url)
    } else {
      stripeWindow.close()
    }

  } catch (e) {
    console.error("❌ stripeconnectlink ERROR", e)
    try { stripeWindow.close() } catch {}
  } finally {
    onboardingLoading.value = false
  }
}




// =====================================================
// 🔗 OPEN STRIPE DASHBOARD
// =====================================================
const openStripeDashboard = () => {
  console.log("🔗 openStripeDashboard")
  window.open("https://dashboard.stripe.com/", "_blank")
}

// =====================================================
// INIT
// =====================================================
onMounted(() => {
  console.log("💳 StripeConnectCard mounted")
  console.log("auth.user =", auth.user)
  checkStatus()
})
</script>

<style scoped>
/* =========================
   CARD
   ========================= */
.stripe-card {
  padding: 20px;
  background: #0b0c0f;
  border-radius: 18px;
  color: #e6e6e6;
}

/* =========================
   STATE
   ========================= */
.state {
  display: flex;
  flex-direction: column;
  gap:3px;
}

/* OK */
.state.ok {
  background: linear-gradient(
    180deg,
    #0b0c0f 0%,
    #0f1115 100%
  );
  border-radius: 16px;
  padding: 10px;
}

/* WARN */
.state.warn {
  background: #0f1115;
  border-radius: 16px;
  padding: 18px;
  color: #fca5a5;
}

/* =========================
   TEXT
   ========================= */
.state p {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
}

.small {
  font-size: 0.85rem;
  color: #b3b3b3;
}

/* =========================
   CTA
   ========================= */
.cta-link {
  align-self: flex-start;
  margin-top: 6px;
  padding: 6px 16px;
  border-radius: 999px;
  background: #fb923c; /* SBS orange */
  color: #0b0c0f;
  font-size: 0.7rem;
  font-weight: 500;
  text-decoration: none;
  transition: opacity 0.15s ease;
}
.cta-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;              /* espace icône / texte */
  text-align: center;
}

.cta-link:hover {
  opacity: 0.9;
}

/* =========================
   HINT
   ========================= */
.hint {
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(255,255,255,0.04);
  border-radius: 12px;
  color: #9a9a9a;
  font-size: 0.8rem;
}

/* =========================
   SPINNER
   ========================= */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.2);
  border-top-color: #fb923c;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

/* =========================
   TRANSITIONS
   ========================= */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}


</style>
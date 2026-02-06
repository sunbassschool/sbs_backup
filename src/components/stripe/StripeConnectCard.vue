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
<div v-else class="state state-warn-inline">
  <span class="state-icon">❌</span>
  <span class="state-text">Paiements non activés</span>
  <button class="btn btn-stripe" @click="goToStripeConnect">
    Activer
  </button>
</div>




  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue"
import { useAuthStore } from "@/stores/authStore.js"
import { getValidToken } from "@/utils/api.ts"
import { getProxyPostURL } from "@/config/gas"

const auth = useAuthStore()
const proxyUrl = getProxyPostURL()
const stripeActionLog = ref("")

const loading = ref(false)
const onboardingStarted = ref(false)
const onboardingLoading = ref(false)
const stripeReady = computed(() => auth.stripe.status === "ready")
const stripePending = computed(() => auth.stripe.status === "pending")

// =====================================================
// CACHE STRIPE STATUS (SWR)
// =====================================================
const STRIPE_CACHE_TTL = 5 * 60 * 1000
const getStripeCacheKey = userId => `stripe_status_${userId}`
const logStripe = (msg) => {
  stripeActionLog.value = msg
  console.log("💳 STRIPE:", msg)
}

const loadStripeFromCache = (userId) => {
  try {
    const raw = sessionStorage.getItem(getStripeCacheKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.ts > STRIPE_CACHE_TTL) return null
    return parsed.data
  } catch {
    return null
  }
}

const saveStripeToCache = (userId, data) => {
  sessionStorage.setItem(
    getStripeCacheKey(userId),
    JSON.stringify({ ts: Date.now(), data })
  )
}

const clearStripeCache = (userId) => {
  sessionStorage.removeItem(getStripeCacheKey(userId))
}

const applyStripeState = (res) => {
  let status = "off"

  if (res?.stripe_ready === true) status = "ready"
  else if (res?.stripe_account_id) status = "pending"

  auth.setStripeStatus({
    status,
    accountId: res?.stripe_account_id || null
  })
}

const checkStatusNetwork = async () => {
    if (auth.isLoggingOut) return   // ⛔ clé

  loading.value = !stripeReady.value && !stripePending.value
  logStripe("Vérification du statut Stripe…")

  try {
    const jwt = await getValidToken()

    logStripe("Contact du serveur…")

    const resp = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "stripeconnectstatus",
        jwt,
        user_id: auth.user.user_id
      })
    })

    logStripe(`Réponse serveur (${resp.status})`)

    const text = await resp.text()
    if (auth.isLoggingOut) return    // ⛔ réponse tardive ignorée


    if (!text.trim().startsWith("{")) {
      logStripe("Erreur serveur Stripe ❌")
      throw new Error("Non-JSON response")
    }

    const res = JSON.parse(text)
if (auth.isLoggingOut) return

    applyStripeState(res)
    saveStripeToCache(auth.user.user_id, res)
if (res.stripe_ready) {
  logStripe("Paiements Stripe activés ✅")

  const auth = useAuthStore()
if (auth.isLoggingOut) return

  // 🔥 SYNCHRO ONBOARDING
  auth.user = {
    ...(auth.user || {}),
    stripe_charges_enabled: true,
    stripe_account_id: res.stripe_account_id || auth.user?.stripe_account_id
  }
}
 else if (res.stripe_account_id) {
  logStripe("Compte Stripe créé — onboarding requis ⏳")

  // optionnel : explicite
  if (auth.onboardingSnapshot) {
    auth.onboardingSnapshot.stripeOk = false
  }

} else {
  logStripe("Stripe non initialisé ❌")

  if (auth.onboardingSnapshot) {
    if (auth.isLoggingOut) return

    auth.onboardingSnapshot.stripeOk = false
  }
}


  } catch (e) {
    if (auth.isLoggingOut) return

    console.error("❌ stripeconnectstatus ERROR", e)
    logStripe("Erreur de communication avec Stripe ❌")
  } finally {
    loading.value = false
  }
}



// =====================================================
// 🔎 CHECK STATUS
// =====================================================
const checkStatus = () => {
    if (!auth.authReady) return   // 🔒 clé

const userId = auth.user?.user_id
if (!userId) return

const cached = loadStripeFromCache(userId)
if (cached) {
  applyStripeState(cached)
  checkStatusNetwork()
  return
}

checkStatusNetwork()

}


// =====================================================
// 🔗 GO TO STRIPE CONNECT
// =====================================================
const goToStripeConnect = async () => {
  console.group("🧪 [STRIPE CONNECT] goToStripeConnect")
  console.log("👤 user_id =", auth?.user?.user_id)

  try {
    console.log("🧹 clearStripeCache")
    clearStripeCache(auth.user.user_id)

    onboardingStarted.value = true
    onboardingLoading.value = true
    console.log("🚀 onboarding flags set")

    // 1️⃣ ouverture immédiate
    console.log("🪟 window.open → about:blank")
    const stripeWindow = window.open("about:blank", "_blank")

    if (!stripeWindow) {
      console.error("🚫 Popup bloquée")
      onboardingLoading.value = false
      alert("Merci d’autoriser les popups pour continuer avec Stripe.")
      return
    }

    console.log("✅ Popup ouverte")

    // 2️⃣ loader
    try {
      stripeWindow.document.write(`<!DOCTYPE html>...`)
      console.log("🎨 Loader injecté")
    } catch (e) {
      console.warn("⚠️ Impossible d’écrire dans la popup", e)
    }

    // 3️⃣ JWT
    console.log("🔐 getValidToken()")
    const jwt = await getValidToken()
    console.log("🔐 JWT OK", jwt?.slice(0, 20) + "...")

    // 4️⃣ fetch backend
    const payload = {
      route: "stripeconnectlink",
      jwt,
      user_id: auth.user.user_id
    }

    console.log("📤 FETCH payload", payload)
    console.log("🌍 proxyUrl =", proxyUrl)

    const t0 = performance.now()
    const resp = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const t1 = performance.now()

    console.log(`⏱️ fetch done in ${(t1 - t0).toFixed(1)}ms`)
    console.log("📥 status =", resp.status)
    console.log("📥 headers =", [...resp.headers.entries()])

    const text = await resp.text()
    console.log("📥 raw response =", text)

    if (!text.trim().startsWith("{")) {
      console.error("💥 Non-JSON response (HTML / crash GAS)")
      throw new Error("non-json-response")
    }

    const res = JSON.parse(text)
    console.log("📦 parsed JSON =", res)

    // 5️⃣ redirection
    if (res?.onboarding_url) {
      console.log("➡️ redirect Stripe =", res.onboarding_url)
      stripeWindow.location.replace(res.onboarding_url)
    } else {
      console.error("❌ onboarding_url manquant")
      stripeWindow.close()
    }

  } catch (e) {
    console.error("🔥 stripeconnectlink FATAL", e)
  } finally {
    onboardingLoading.value = false
    console.log("🏁 onboardingLoading = false")
    console.groupEnd()
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
  watch(
    () => auth.authReady,
    (ready) => {
      if (!ready) return
      checkStatus()
    },
    { immediate: true }
  )
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

.state-warn-inline {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 12px;
  background: linear-gradient(180deg, #2a1f1f, #1c1414);
  border: 1px solid rgba(255, 80, 80, 0.25);
}

.state-warn-inline .state-icon {
  font-size: 18px;
}

.state-warn-inline .state-text {
  flex: 1;
  font-weight: 500;
  color: #ff9a9a;
}

.btn-stripe {
  padding: 8px 14px;
  border-radius: 9px;
  font-weight: 600;
  border: none;
  background: linear-gradient(135deg, #635bff, #4f46e5);
  color: #fff;
  cursor: pointer;
  white-space: nowrap;
}

</style>

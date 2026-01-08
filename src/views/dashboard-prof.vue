<template>
  <Layout>
    <div class="container-xxl mt-4">
      <div class="dashboard-wrapper">

        <!-- Loader -->
        <div v-if="loading" class="loader-container">
      <div class="dashboard-loader">
  <div class="spinner"></div>
<p class="loader-text">Chargement du tableau de bord…</p>
</div>

        </div>

        <!-- DASHBOARD PROF -->
        <div v-else class="fade-in">
           <OnboardingProfCard />
<div class="prof-dashboard">
  <div class="dashboard-grid">

    <!-- Élèves -->
    <div class="dash-card" @click="goToGestionEleves">
      <div class="icon-circle">
        <i class="bi bi-people"></i>
      </div>
      <div class="info">
<h3>{{ totalEleves }}</h3>
        <p>Élèves actifs</p>
      </div>
    </div>

    <!-- Cours à venir -->
    <div class="dash-card" @click="goToCours">
      <div class="icon-circle">
        <i class="bi bi-calendar-event"></i>
      </div>
      <div class="info">
        <h3>{{ upcomingCount }}</h3>
        <p>Cours à venir</p>
      </div>
    </div>

    <!-- Revenus -->
<div class="dash-card" @click="goToRevenus">
  <div class="icon-circle">
    <i class="bi bi-cash-stack"></i>
  </div>
  <div class="info">
    <h3>Revenus</h3>
    <p>Paiements & solde</p>
  </div>
</div>


    <!-- Demandes de report -->
    <div class="dash-card" @click="goToReports">
      <div class="icon-circle">
        <i class="bi bi-arrow-repeat"></i>
      </div>
      <div class="info">
        <h3>{{ pendingReports }}</h3>
        <p>Demandes à traiter</p>
      </div>
    </div>
<!-- Envoyer un document -->
<div class="dash-card send-doc" @click="goToSendDoc">
  <div class="icon-circle">
    <i class="bi bi-upload"></i>
  </div>
  <div class="info">
    <h3>Envoyer</h3>
    <p>Document à un élève</p>
  </div>
</div>


<!-- Partitions -->
<div class="dash-card" @click="goToPartitions">
  <div class="icon-circle">
    <i class="bi bi-file-earmark-music"></i>
  </div>

  <div class="info">
    <h3>{{ partitionsCount }}</h3>
    <p>
      Partitions<br />
      <small class="muted">Clique pour ajouter / gérer</small>
    </p>
  </div>
</div>



  </div>





  <!-- INVITE LINK BOX -->
<div   id="invite-link"
class="invite-box mt-3 fade-in">
  <h4 class="invite-title mb-2">🔗 Lien d’invitation</h4>
  <p class="invite-description">Partage ce lien pour que tes élèves se rattachent à toi.</p>

  <!-- Champ + bouton copier -->
  <div class="invite-row">
    <input
      type="text"
      class="invite-input"
      :value="inviteLink"
      readonly
      @click="$event.target.select()"
    />

    <button class="copy-btn" @click="copyLink">
      Copier
    </button>
  </div>

  <!-- Générer un nouveau lien -->
<button
  class="regen-btn mt-2 d-flex align-items-center justify-content-center"
  @click="regenInviteLink"
  :disabled="regenLoading"
>
  <span v-if="regenLoading" class="spinner-border spinner-border-sm me-2"></span>
  <span v-if="regenLoading">Génération...</span>
  <span v-else>🔄 Générer un nouveau lien</span>
</button>
<div class="miseenpage">
<StripeConnectCard />
</div>
</div>

</div>


        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
  import Layout from "@/views/Layout.vue";

import { ref, onMounted,watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import StripeConnectCard from "@/components/stripe/StripeConnectCard.vue"
import { getProxyGetURL, getProxyPostURL } from "@/config/gas"
import OnboardingProfCard from "@/components/onboarding/OnboardingProfCard.vue"

// === STORES ===
const auth = useAuthStore();
const router = useRouter();

// === STATE ===
const loading = ref(true);
const profName = ref("");
const profId = ref("");
const inviteLink = ref("");
const partitionsCount = ref(0);

const totalEleves = ref(0);
const upcomingCount = ref(0);
const pendingReports = ref(0);
const dashboardStore = useDashboardStore()

const TTL = 15 * 60 * 1000 // 15 min
const CACHE_PREFIX = "dashboard_cache_"

const regenLoading = ref(false);
const data = ref(null)
const goToRevenus = () => {
  router.push("/prof/revenus")
}

// === ROUTES ===
onMounted(() => {
  console.group("🧪 [DASHBOARD] onboarding hydration")

  console.log("auth.user =", auth.user)
  console.log("typeof fetchHasOffer =", typeof auth.fetchHasOffer)

  if (auth.user?.prof_id && typeof auth.fetchHasOffer === "function") {
    console.log("➡️ dashboard → call fetchHasOffer")
    auth.fetchHasOffer()
    auth.fetchHasSale()

  } else {
    console.warn("⛔ dashboard → fetchHasOffer NOT called", {
      prof_id: auth.user?.prof_id,
      fn: typeof auth.fetchHasOffer
    })
  }

  console.groupEnd()
})
// === HELPERS API ===


async function fetchPartitionsCount() {
  if (!auth.jwt || !profId.value) return

  console.group("🎵 FETCH PARTITIONS COUNT")

  try {
    const payload = {
      route: "getuploadsbyprof",
      jwt: auth.jwt,
      prof_id: profId.value
    }

    console.log("📤 PAYLOAD →", payload)

    const res = await fetch(getProxyPostURL(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    console.log("📡 HTTP STATUS →", res.status)

    const text = await res.text()

    let data
    try {
      data = JSON.parse(text)
    } catch (e) {
      console.error("❌ JSON PARSE ERROR", e)
      return
    }


    if (!data.success || !Array.isArray(data.uploads)) {
      console.warn("⚠️ Format invalide", data)
      return
    }

    // ⚠️ RÈGLE MÉTIER : partition = PDF dans le dossier partitions
    const PARTITIONS_FOLDER_ID = "d3c54982-b7d7-4383-8472-b66d2f82f913"

    const partitions = data.uploads.filter(
      u =>
        u.file_type === "application/pdf" &&
        u.folder_id === PARTITIONS_FOLDER_ID
    )



    partitionsCount.value = partitions.length
    console.log("✅ partitionsCount =", partitionsCount.value)

  } catch (e) {
    console.error("❌ fetchPartitionsCount ERROR", e)
  } finally {
    console.groupEnd()
  }
}



function goToSendDoc() {
  router.push({
    name: "EleveUploads",
    query: {
      mode: "send"
    }
  })
}
function goToCours() {
  router.push({ name: "cours" })
}

function goToGestionEleves() {
  router.push({ name: "GestionEleves" })
}
function goToPartitions() {
  router.push({ name: "PartitionsProf" })
}

async function refreshDashboard() {
await Promise.all([
  fetchEleves(),
  fetchPlanning(),
  fetchReports(),
  fetchInviteLink(),
  fetchPartitionsCount()
])


const payload = {
  totalEleves: totalEleves.value,
  upcomingCount: upcomingCount.value,
  pendingReports: pendingReports.value,
  inviteLink: inviteLink.value,
  partitionsCount: partitionsCount.value
}


  localStorage.setItem(
    CACHE_PREFIX + profId.value,
    JSON.stringify({
      data: payload,
      ts: Date.now()
    })
  )
}

function loadFromStore() {
  if (!profId.value) return false

  const raw = localStorage.getItem(CACHE_PREFIX + profId.value)
  if (!raw) return false

  try {
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > TTL) return false

    totalEleves.value = data.totalEleves ?? 0
    upcomingCount.value = data.upcomingCount ?? 0
    pendingReports.value = data.pendingReports ?? 0
    inviteLink.value = data.inviteLink ?? ""
    partitionsCount.value = data.partitionsCount ?? 0

    return true
  } catch {
    return false
  }
}


// ======================================================================
// 📌 API CALLS AVEC LOGS
// ======================================================================
async function copyLink() {
  if (!inviteLink.value) return

  try {
    await navigator.clipboard.writeText(inviteLink.value)
    console.log("✅ Lien copié :", inviteLink.value)
  } catch (err) {
    console.warn("⚠️ Clipboard API failed, fallback")

    // fallback vieux navigateurs
    const input = document.createElement("input")
    input.value = inviteLink.value
    document.body.appendChild(input)
    input.select()
    document.execCommand("copy")
    document.body.removeChild(input)
  }
}

async function fetchEleves() {
  if (!auth.jwt || !profId.value) return

  try {
    const res = await fetch(getProxyPostURL(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "getelevesbyprof",
        jwt: auth.jwt,
        prof_id: profId.value
      })
    })

    const data = await res.json()

    totalEleves.value =
      data?.eleves?.filter(e => e.statut === "inscrit").length || 0
auth.dashboardElevesCount = totalEleves.value

  } catch (err) {
    console.error("❌ fetchEleves ERROR:", err)
  }
}


async function fetchPlanning() {
  try {
    const jwt = auth.jwt
    if (!jwt || !profId.value) return

    console.log("📡 fetchPlanning() start")

 const res = await fetch(
  getProxyGetURL(
    `route=getplanningprof` +
    `&jwt=${encodeURIComponent(jwt)}` +
    `&prof_id=${encodeURIComponent(profId.value)}`
  )
)


    const data = await res.json()

    console.log("📨 fetchPlanning RESPONSE:", data)

    upcomingCount.value =
      data?.planning?.filter(p => p.status === "A_VENIR")?.length || 0
  } catch (err) {
    console.error("❌ fetchPlanning ERROR:", err)
  }
}


async function fetchReports() {
  try {
    const jwt = localStorage.getItem("jwt");

    console.log("📡 fetchReports() start");

 const res = await fetch(
  getProxyGetURL(
    `route=getreportsprof` +
    `&jwt=${encodeURIComponent(jwt)}` +
    `&prof_id=${encodeURIComponent(profId.value)}`
  )
)
;
    const data = await res.json();

    console.log("📨 fetchReports RESPONSE:", data);

    pendingReports.value =
      data?.reports?.filter(r => r.status === "DEMANDE")?.length || 0;
  } catch (err) {
    console.error("❌ fetchReports ERROR:", err);
  }
}

async function fetchInviteLink() {
  try {
    const jwt = localStorage.getItem("jwt");

    console.log("📡 fetchInviteLink() start");

  const res = await fetch(getProxyPostURL(), {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    route: "createInviteLink",
    jwt
  })
})
;

    const data = await res.json();

    console.log("📨 fetchInviteLink RESPONSE:", data);

    if (data.success) {
      inviteLink.value = data.invite_link;
    }
  } catch (err) {
    console.error("❌ fetchInviteLink ERROR:", err);
  }
}

async function regenInviteLink() {
  regenLoading.value = true
  await fetchInviteLink()

  localStorage.removeItem(CACHE_PREFIX + profId.value)

  regenLoading.value = false
}


// ======================================================================
// 🔗 Navigation
// ======================================================================
function goToEleves() {
  router.push("/prof-eleves");
}

function goToPlanning() {
  router.push("/prof-planning");
}

function goToReports() {
  router.push("/dashboardreports");
}
function isCacheFresh() {
  if (!profId.value) return false

  const raw = localStorage.getItem(CACHE_PREFIX + profId.value)
  if (!raw) return false

  try {
    const { ts } = JSON.parse(raw)
    return Date.now() - ts < TTL
  } catch {
    return false
  }
}

// ======================================================================
// 🚀 INIT
// ======================================================================
watch(
  () => auth.authReady,
  async (ready) => {
    if (!ready) return

    profId.value = auth.user?.prof_id || ""
    if (!profId.value) return

    const hasCache = loadFromStore()
    const cacheFresh = isCacheFresh()

    // ⚡ affichage immédiat
    loading.value = !hasCache

    // 🚫 cache OK → PAS DE FETCH
    if (cacheFresh) {
      loading.value = false
      return
    }

    // 🔄 cache absent ou expiré → fetch
    try {
      await refreshDashboard()
    } finally {
      loading.value = false
    }
  },
  { immediate: true }
)

</script>

<style scoped>

/* ============================================================================
   🌐 WRAPPER GÉNÉRAL
   ============================================================================ */
.dashboard-wrapper {
  padding-bottom: 40px;
}

/* ============================================================================
   🎨 TITRES
   ============================================================================ */
.dashboard-title {
  font-weight: bold;
  color: #ffb85c;
  text-shadow: 0 0 10px rgba(255, 150, 0, 0.25);
  margin-bottom: 25px;
}

.title {
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 0.9rem;
  opacity: 0.6;
  margin-bottom: 18px;
}

/* ============================================================================
   🔄 LOADER
   ============================================================================ */
.loader-container {
  text-align: center;
  margin-top: 40px;
  color: #fff;
}

/* Apparition fluide */
.fade-in {
  animation: fadeIn 0.25s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ============================================================================
   📊 DASHBOARD PROF
   ============================================================================ */
.prof-dashboard {
  padding: 10px 15px;
  color: #fff;
}

/* ============================================================================
   🧩 GRID PRINCIPALE (cartes)
   ============================================================================ */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* ============================================================================
   📦 CARDS (version minimaliste)
   ============================================================================ */
.dash-card {
  background: #1b1b1d;
  border: 1px solid #2a2a2c;
  border-radius: 10px;
  padding: 14px;

  display: flex;
  align-items: center;
  gap: 12px;

  transition: 0.15s ease;
  cursor: pointer;
}

.dash-card:hover {
  border-color: #ff6a00;
  background: #1e1e20;
}

/* Icône dans une petite pastille */
.icon-circle {
  background: #262628;
  width: 38px;
  height: 38px;
  border-radius: 8px;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 1.3rem;
  color: #ff6a00;
}

/* Texte dans les cards */
.info h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.info p {
  margin: 0;
  font-size: 0.75rem;
  opacity: 0.6;
}

/* ============================================================================
   🔗 INVITATION — BLOC PRINCIPAL
   ============================================================================ */
.invite-box {
  background: #111;
  border: 1px solid #262626;
  border-radius: 10px;
  padding: 14px 16px;
  margin-top: 20px;
}

.invite-title {
  color: #ffb85c;
  font-size: 1rem;
  font-weight: 600;
}

.invite-description {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-bottom: 10px;
}

/* ============================================================================
   🔗 INVITE — LIGNE INPUT + BOUTON COPIER
   ============================================================================ */
.invite-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.invite-input {
  flex: 1;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #333;
  background: #1a1a1a;
  color: #fff;
  font-size: 0.85rem;
}

/* Bouton copier */
.copy-btn {
  background: #ff6a00;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  color: #fff;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.copy-btn:hover {
  background: #ff7e26;
}

/* Générer un nouveau lien */
.regen-btn {
  background: #262626;
  border: 1px solid #333;
  width: 100%;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #ccc;
  cursor: pointer;
}

.regen-btn:hover {
  background: #2e2e2e;
}


/** bouton génération de lien */
.regen-btn[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}
.send-doc .icon-circle {
  color: #ff6a00;
  box-shadow: 0 0 10px rgba(255,106,0,0.25);
}
.dashboard-loader {
  min-height: 40vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #cfd3dc;
  font-weight: 500;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,.15);
  border-top-color: #e63946;
  border-radius: 50%;
  animation: spin .8s linear infinite;
}

p {
  margin-top: 6px;
  font-size: 13px;
  color: #ffffff;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
.loader-text {
  font-size: 13px;
  color: #cfd3dc;
  opacity: 0.85;
  letter-spacing: .3px;
  animation: fadePulse 1.2s ease-in-out infinite;
}

@keyframes fadePulse {
  0%, 100% { opacity: .4 }
  50% { opacity: .9 }
}

.container-xxl
{
  background-color: #141414;
}

.miseenpage
{
margin-top:10px;
}

.highlight-invite {
  box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.6);
  background: rgba(250, 204, 21, 0.08);
  transition: box-shadow 0.3s ease, background 0.3s ease;
}




@keyframes pulseInvite {
  0% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(250, 204, 21, 0); }
  100% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0); }
}

.highlight-invite {
  animation: pulseInvite 1.2s ease-out;
}

</style>

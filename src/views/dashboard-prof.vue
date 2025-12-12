<template>
  <Layout>
    <div class="container-xxl mt-4">
      <div class="dashboard-wrapper">

        <!-- Loader -->
        <div v-if="loading" class="loader-container">
          <div class="spinner-border custom-spinner"></div>
          <p>Chargement du tableau de bord...</p>
        </div>

        <!-- DASHBOARD PROF -->
        <div v-else class="fade-in">
<div class="prof-dashboard">
  <div class="dashboard-grid">

    <!-- Élèves -->
    <div class="dash-card" @click="goTo('prof-eleves')">
      <div class="icon-circle">
        <i class="bi bi-people"></i>
      </div>
      <div class="info">
<h3>{{ totalEleves }}</h3>
        <p>Élèves actifs</p>
      </div>
    </div>

    <!-- Cours à venir -->
    <div class="dash-card" @click="goTo('prof-planning')">
      <div class="icon-circle">
        <i class="bi bi-calendar-event"></i>
      </div>
      <div class="info">
        <h3>{{ upcomingCount }}</h3>
        <p>Cours à venir</p>
      </div>
    </div>

    <!-- Demandes de report -->
    <div class="dash-card" @click="goTo('prof-reports')">
      <div class="icon-circle">
        <i class="bi bi-arrow-repeat"></i>
      </div>
      <div class="info">
        <h3>{{ pendingReports }}</h3>
        <p>Demandes à traiter</p>
      </div>
    </div>

  </div>
  <!-- INVITE LINK BOX -->
<div class="invite-box mt-3 fade-in">
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

</div>

</div>

          
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import Layout from "@/views/Layout.vue";
import { useAuthStore } from "@/stores/authStore";

// === STORES ===
const auth = useAuthStore();
const router = useRouter();

// === STATE ===
const loading = ref(true);
const profName = ref("");
const profId = ref("");
const inviteLink = ref("");

const totalEleves = ref(0);
const upcomingCount = ref(0);
const pendingReports = ref(0);

const regenLoading = ref(false);

// === ROUTES ===
const routes = {
  GET: "AKfycbzZxvUx0RFAsAszO9bvA2zInIqbrWsntDw1YYZiHQ993nRYboPx266McgZrSH2RH2KpNw/exec",
  POST: "AKfycbzZxvUx0RFAsAszO9bvA2zInIqbrWsntDw1YYZiHQ993nRYboPx266McgZrSH2RH2KpNw/exec",
};

// === HELPERS API ===
function buildGet(params) {
  const qs = new URLSearchParams(params).toString();
  const base = `https://script.google.com/macros/s/${routes.GET}/exec?${qs}`;
  const finalUrl = `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(base)}`;

  console.log("🔵 GET URL:", finalUrl);
  return finalUrl;
}

function buildPost() {
  const base = `https://script.google.com/macros/s/${routes.POST}/exec`;
  const finalUrl = `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(base)}`;

  console.log("🟠 POST URL:", finalUrl);
  return finalUrl;
}

// ======================================================================
// 📌 API CALLS AVEC LOGS
// ======================================================================

async function fetchEleves() {
  try {
    const jwt = localStorage.getItem("jwt");

    console.log("📡 fetchEleves() start");

    const res = await fetch(
      buildGet({ route: "getelevesbyprof", jwt, prof_id: profId.value })
    );
    const data = await res.json();

    console.log("📨 fetchEleves RESPONSE:", data);

    totalEleves.value = data?.eleves?.length || 0;
  } catch (err) {
    console.error("❌ fetchEleves ERROR:", err);
  }
}

async function fetchPlanning() {
  try {
    const jwt = localStorage.getItem("jwt");

    console.log("📡 fetchPlanning() start");

    const res = await fetch(
      buildGet({ route: "getplanningprof", jwt, prof_id: profId.value })
    );
    const data = await res.json();

    console.log("📨 fetchPlanning RESPONSE:", data);

    upcomingCount.value = data?.planning?.length || 0;
  } catch (err) {
    console.error("❌ fetchPlanning ERROR:", err);
  }
}

async function fetchReports() {
  try {
    const jwt = localStorage.getItem("jwt");

    console.log("📡 fetchReports() start");

    const res = await fetch(
      buildGet({ route: "getreportsprof", jwt, prof_id: profId.value })
    );
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

    const res = await fetch(buildPost(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ route: "createInviteLink", jwt }),
    });

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
  console.log("🔄 regenInviteLink CLICKED");

  regenLoading.value = true;
  await fetchInviteLink();
  regenLoading.value = false;

  console.log("✅ regenInviteLink DONE, new link:", inviteLink.value);
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
  router.push("/prof-reports");
}

// ======================================================================
// 🚀 INIT
// ======================================================================
onMounted(async () => {
  console.log("🚀 DashboardProf mounted");

  profName.value = auth.user?.prenom || "";
  profId.value = auth.user?.prof_id || "";

  console.log("👤 PROF:", profName.value, " | ID:", profId.value);

  await Promise.all([
    fetchEleves(),
    fetchPlanning(),
    fetchReports(),
    fetchInviteLink(),
  ]);

  loading.value = false;

  console.log("✅ Dashboard loaded");
});
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

</style>

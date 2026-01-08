<template>
  <Layout>

    <div class="reports-page">
    <div class="container-xxl mt-4">
      <div ref="scrollContainer" class="refreshable-area">

        <!-- 🔄 Loader -->
        <div
          v-if="loading"
          class="d-flex justify-content-center align-items-center mt-5"
        >
          <div class="spinner-border custom-spinner" role="status"></div>
        </div>

        <!-- ========== DEMANDES EN ATTENTE ========== -->
<div class="section-header">
  <span class="section-dot"></span>
  <h4 class="section-title">Demandes en attente</h4>
  <span class="section-count" v-if="reportsPending.length > 0">
    {{ reportsPending.length }}
  </span>
</div>
<div class="search-wrapper">
  <input
    v-model="searchQuery"
    type="text"
    class="form-control search-input"
    placeholder="🔍 Rechercher un élève..."
  />
</div>


        <!-- ⚠️ Aucun report -->
        <div
          v-if="!loading && reportsPending.length === 0"
          class="alert alert-warning text-center mt-4"
        >
          Aucun report en attente ✔
        </div>

        <!-- 📋 Liste des reports -->
        <div v-if="!loading && reportsPending.length > 0" class="reports-grid">

          <div
            v-for="rep in reportsPending"
            :key="rep.id"
            class="card report-card shadow-sm text-light"
          >
            <h5 class="fw-bold mb-2">{{ rep.prenom }}</h5>

            <p class="mb-1">
              <span class="text-secondary">Cours prévu : </span>
              <strong>{{ formatDate(rep.course_date) }}</strong>
            </p>

            <p class="mb-1">
              <span class="text-secondary">Demande faite : </span>
              {{ formatDate(rep.date_request) }}
            </p>

            <p class="mb-1" v-if="rep.reason">
              <span class="text-secondary">Raison : </span>{{ rep.reason }}
            </p>

            <p class="mb-2" v-if="rep.message">
              <span class="text-secondary">Message élève : </span>{{ rep.message }}
            </p>

            <!-- 🔘 Boutons actions -->
            <div class="d-flex gap-2 mt-3">
              <button
                class="btn btn-success flex-fill"
                @click="openApproveModal(rep)"
              >
                ✔ Accepter
              </button>

              <button
                class="btn btn-danger flex-fill"
                @click="openRejectModal(rep)"
              >
                ✖ Refuser
              </button>
            </div>

          </div>
        </div>

        <!-- ========== HISTORIQUE ========== -->
        <h4
  class="section-title mt-4 history-toggle"
  @click="historyOpen = !historyOpen"
>
  📚 Historique des reports
  <span class="count">({{ reportsHistory.length }})</span>

  <span class="arrow">
    {{ historyOpen ? "▲" : "▼" }}
  </span>
</h4>


   <div
  v-if="historyOpen && !loading && reportsHistory.length === 0"
  class="alert alert-dark text-center mt-3"
>

          Aucun historique pour le moment.
        </div>

   <!-- Timeline seulement si ouvert -->
<div v-if="historyOpen && !loading && reportsHistory.length > 0" class="timeline">

 <div
  v-for="rep in reportsHistory"
  :key="rep.id"
  class="timeline-item"
>

  <!-- DOT -->
  <div class="timeline-dot"
    :class="{
      accepted: rep.status === 'ACCEPTE',
      refused: rep.status === 'REFUSE',
      pending: rep.status === 'DEMANDE'
    }"
  ></div>

  <!-- ===========================
       HEADER (toujours visible)
       =========================== -->
  <div class="timeline-header" @click="toggleOpen(rep)">

    <div class="header-left">
      <strong>{{ rep.prenom }}</strong>
      <span
        class="mini-status"
        :class="{
          accepted: rep.status === 'ACCEPTE',
          refused: rep.status === 'REFUSE'
        }"
      >
        {{ rep.status === 'ACCEPTE' ? "✔ Accepté" : "✖ Refusé" }}
      </span>
      <span class="mini-date">
        {{ formatDate(rep.course_date) }}
      </span>
    </div>

    <div class="header-right">
      <span class="arrow">{{ rep._open ? "▲" : "▼" }}</span>
    </div>

  </div>

  <!-- ===========================
       CONTENU (déplié)
       =========================== -->
  <div v-if="rep._open" class="timeline-content-expanded">

    <!-- Cours initial -->
    <div class="date-row" v-if="rep.status === 'ACCEPTE'">
      <span class="label">Cours initial :</span>
      <span class="value">{{ formatDate(rep.original_date || rep.date_request) }}</span>
    </div>

    <!-- Nouveau cours -->
    <div class="date-row">
      <span class="label">Cours reporté :</span>
      <span class="value">{{ formatDate(rep.course_date) }}</span>
    </div>

    <!-- Élève -->
    <div class="history-section" v-if="rep.reason || rep.message">
      <div class="section-title">📌 Élève</div>
      <p v-if="rep.reason" class="section-line">
        <span class="label">Raison :</span> {{ rep.reason }}
      </p>
      <p v-if="rep.message" class="section-line">
        <span class="label">Message :</span> {{ rep.message }}
      </p>
    </div>

    <!-- Prof -->
    <div class="history-section" v-if="rep.prof_response">
      <div class="section-title">🎸 Prof</div>
      <p class="section-line">{{ rep.prof_response }}</p>
    </div>

  </div>

</div>


</div>


      </div>
    </div>

    <!-- ========================== -->
    <!-- 🟧 MODALE ACCEPT REPORT -->
    <!-- ========================== -->
    <div
      v-if="showApproveModal"
      class="sbs-modal"
      @click.self="closeModals"
    >
      <div class="sbs-modal-content" @click.stop>

        <h5 class="mb-3">
          Nouvelle date pour {{ selectedReport?.prenom }}
        </h5>

        <p class="small text-secondary mb-2" v-if="selectedReport">
          Cours initialement le :
          <strong>{{ formatDate(selectedReport.course_date) }}</strong>
        </p>

        <label class="form-label fw-bold">Nouvelle date & heure</label>
        <input
          type="datetime-local"
          v-model="approveNewDate"
          class="form-control mb-3"
        />

        <label class="form-label fw-bold">Message (optionnel)</label>
        <textarea
          v-model="approveMessage"
          rows="3"
          class="form-control mb-3"
          placeholder="Ajouter un message au report…"
        ></textarea>

        <button
          class="btn btn-warning w-100 mb-2"
          @click="confirmApprove"
          :disabled="approveLoading"
        >
          <span v-if="!approveLoading">Valider le report ✔</span>
          <span v-else class="loader-inline"></span>
        </button>

        <button class="btn btn-secondary w-100" @click="closeModals">
          Annuler
        </button>

      </div>
    </div>

    <!-- ========================== -->
    <!-- 🟥 MODALE REJECT REPORT -->
    <!-- ========================== -->
    <div
      v-if="showRejectModal"
      class="sbs-modal"
      @click.self="closeModals"
    >
      <div class="sbs-modal-content" @click.stop>

        <h5 class="mb-3">
          Refuser le report pour {{ selectedReport?.prenom }}
        </h5>

        <p class="small text-secondary mb-2" v-if="selectedReport">
          Cours prévu le :
          <strong>{{ formatDate(selectedReport.course_date) }}</strong>
        </p>

        <label class="form-label fw-bold">Message (optionnel)</label>
        <textarea
          v-model="rejectMessage"
          rows="3"
          class="form-control mb-3"
          placeholder="Expliquer brièvement…"
        ></textarea>

        <button
          class="btn btn-danger w-100 mb-2"
          @click="confirmReject"
          :disabled="rejectLoading"
        >
          <span v-if="!rejectLoading">Refuser le report ✖</span>
          <span v-else class="loader-inline"></span>
        </button>

        <button class="btn btn-secondary w-100" @click="closeModals">
          Annuler
        </button>

      </div>
    </div>

    <!-- 🍞 Toast -->
    <div
      v-if="toast.show"
      :class="[
        'sbs-toast',
        toast.type === 'success' ? 'sbs-toast-success' : 'sbs-toast-error'
      ]"
    >
      {{ toast.message }}
    </div>

 </div> </Layout>
</template>


<script setup>
import { ref, computed, onMounted } from "vue";
import Layout from "@/views/Layout.vue";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore.js";

// ============================
// 🔌 CONFIG API + PROXY
// ============================
const routes = {
  POST: "AKfycbzxXlNmLmDu5IgGDc3aUNpmKfilJrGedFgYW9f4TN3wPte4TzVzlUBK0goVCuqORm_91w/exec"
};

const getProxyPostURL = (routeId) => {
  const baseURL = `https://script.google.com/macros/s/${routeId}`;
  return `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(baseURL)}`;
};

// ============================
// 🔐 AUTH
// ============================
const auth = useAuthStore();
const jwt = computed(() => auth.jwt);
//=============================
// Const pour accordéon de l'historique
const toggleOpen = (rep) => {
  rep._open = !rep._open;
};

// ============================
// 📡 DATA
// ============================
const scrollContainer = ref(null);
const reports = ref([]);
// 🔎 Recherche élève
const searchQuery = ref("");

// 🔎 Filtrage principal
const filteredReports = computed(() => {
  if (!searchQuery.value.trim()) return reports.value;

  const q = searchQuery.value.toLowerCase();
  return reports.value.filter(r =>
    r.prenom?.toLowerCase().includes(q)
  );
});

// 🔔 Reports en attente (filtrés)
const reportsPending = computed(() =>
  filteredReports.value.filter(r => r.status === "DEMANDE")
);

// menu accordeon historique repport
const historyOpen = ref(false);


// 🕒 Historique trié (filtré)
const reportsHistory = computed(() =>
  filteredReports.value
    .filter(r => r.status !== "DEMANDE")
    .sort((a, b) => new Date(b.date_request) - new Date(a.date_request))
);

const loading = ref(true);

const fetchReports = async () => {
  loading.value = true;

  try {
    const url = `https://script.google.com/macros/s/${routes.POST}?route=getReports`;
    const finalURL = `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(url)}`;

    const res = await axios.get(finalURL);
console.log("📥 fetchReports → data brute :", res.data);

   if (res.data.success && Array.isArray(res.data.reports)) {
  reports.value = res.data.reports.map(r => ({ ...r, _open: false }));
    console.log("📘 fetchReports → reports chargés :", reports.value);

}


  } catch (err) {
    console.error("Erreur getReports :", err);
    showToast("Erreur lors du chargement des reports", "error");
  }

  loading.value = false;
};

onMounted(() => {
  fetchReports();
});




// ============================
// 🟧 APPROVE REPORT
// ============================
const showApproveModal = ref(false);
const selectedReport = ref(null);
const approveNewDate = ref("");
const approveMessage = ref("");
const approveLoading = ref(false);

const openApproveModal = (rep) => {
  selectedReport.value = rep;
  approveNewDate.value = "";
  approveMessage.value = "";
  showApproveModal.value = true;
};

const confirmApprove = async () => {
      console.log("🟧 confirmApprove appelé !");

  if (!approveNewDate.value) {
    showToast("Choisis une date", "error");
    return;
  }

  approveLoading.value = true;

  try {
    const url = getProxyPostURL(routes.POST);

    const payload = {
      route: "approveReport",
      jwt: jwt.value,
      course_id: selectedReport.value.id,
      new_date: formatDateBackend(approveNewDate.value),
      response_message: approveMessage.value
    };
console.log("📡 Payload envoyé :", payload);
console.log("📡 URL :", url);

    const res = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" }

    });
console.log("📨 Réponse brute :", res.data);

    if (res.data.success) {
      selectedReport.value.status = "ACCEPTE";
    selectedReport.value.course_date = new Date(approveNewDate.value);
reports.value = [...reports.value];


      showToast("Report accepté ✔", "success");
      closeModals();
    }

    else {
      showToast(res.data.message || "Erreur lors de la validation", "error");
    }

  } catch (err) {
    console.error(err);
    showToast("Erreur réseau ❌", "error");
  }

  approveLoading.value = false;
};

// ============================
// 🟥 REJECT REPORT
// ============================
const showRejectModal = ref(false);
const rejectMessage = ref("");
const rejectLoading = ref(false);

const openRejectModal = (rep) => {
  selectedReport.value = rep;
  rejectMessage.value = "";
  showRejectModal.value = true;
};

const confirmReject = async () => {
  rejectLoading.value = true;

  try {
    const url = getProxyPostURL(routes.POST);

    const payload = {
      route: "rejectReport",
      jwt: jwt.value,
      course_id: selectedReport.value.id,
      response_message: rejectMessage.value
    };

    const res = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" }
    });

    if (res.data.success) {
  selectedReport.value.status = "REPORT_REFUSE"; // 🔥 la valeur backend exacte
      showToast("Report refusé ✖", "success");
      closeModals();
      await fetchReports();

    } else {
      showToast(res.data.message || "Erreur lors du refus", "error");
    }

  } catch (err) {
    console.error(err);
    showToast("Erreur réseau ❌", "error");
  }

  rejectLoading.value = false;
};

// ============================
// ❌ FERMETURE MODALES
// ============================
const closeModals = () => {
  showApproveModal.value = false;
  showRejectModal.value = false;
};

// ============================
// 🍞 TOAST SYSTEM
// ============================
const toast = ref({ show: false, type: "success", message: "" });

const showToast = (message, type = "success") => {
  toast.value = { show: true, message, type };
  setTimeout(() => (toast.value.show = false), 2200);
};

// ============================
// ⏱️ FORMATAGE DATES
// ============================
function formatDate(d) {
  if (!d) return "-";

  const date = new Date(d);
  if (isNaN(date.getTime())) return d;

  const jour = String(date.getDate()).padStart(2, "0");
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const annee = date.getFullYear();

  const heures = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${jour}/${mois}/${annee} à ${heures}h${minutes}`;
}


function formatDateBackend(v) {
  const d = new Date(v);
  return `${String(d.getDate()).padStart(2, "0")}/${
    String(d.getMonth() + 1).padStart(2, "0")
  }/${d.getFullYear()} ${
    String(d.getHours()).padStart(2, "0")
  }:${String(d.getMinutes()).padStart(2, "0")}`;
}
</script>

<style>
/* =====================================================
   🎧 iTUNES DARK – ROOT
   ===================================================== */
.reports-page {
  min-height: 100vh;
  background: #0e0e0f;        /* noir profond */
  color: #f2f2f2;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text",
               "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* neutralise bootstrap blanc */
.reports-page .container,
.reports-page .container-xxl {
  background: transparent !important;
}

/* =====================================================
   🔎 SEARCH
   ===================================================== */
.reports-page .form-control,
.reports-page .search-input {
  background: #1c1c1e !important;
  color: #f2f2f2 !important;
  border: 1px solid #2c2c2e;
  border-radius: 10px;
}

.reports-page .form-control::placeholder {
  color: #8e8e93;
}

/* =====================================================
   📢 ALERTS
   ===================================================== */
.reports-page .alert {
  background: #1c1c1e;
  border: 1px solid #2c2c2e;
  color: #f2f2f2;
}

/* =====================================================
   🧱 SECTIONS
   ===================================================== */
.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 28px 0 14px;
}

.section-dot {
  width: 8px;
  height: 8px;
  background: #ff9f0a; /* accent Apple */
  border-radius: 50%;
}

.section-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: .2px;
  color: #f2f2f2;
}

.section-count {
  margin-left: auto;
  background: #2c2c2e;
  color: #ff9f0a;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* =====================================================
   📦 CARDS
   ===================================================== */
.reports-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

@media (min-width: 720px) {
  .reports-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1100px) {
  .reports-grid { grid-template-columns: repeat(3, 1fr); }
}

.report-card {
  background: #1c1c1e;
  border: 1px solid #2c2c2e;
  border-radius: 14px;
  padding: 16px;
  color: #f2f2f2;
  transition: background .2s ease, transform .2s ease;
}

.report-card:hover {
  background: #2a2a2c;
  transform: translateY(-2px);
}

.report-card .text-secondary {
  color: #8e8e93 !important;
}

/* =====================================================
   📜 TIMELINE
   ===================================================== */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-left: 14px;
  padding-left: 18px;
  border-left: 1px solid #2c2c2e;
}

.timeline-item {
  position: relative;
  background: #1c1c1e;
  border: 1px solid #2c2c2e;
  border-radius: 14px;
  padding: 14px;
}

.timeline-dot {
  position: absolute;
  left: -26px;
  top: 18px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.timeline-dot.accepted { background: #30d158; }
.timeline-dot.refused  { background: #ff453a; }
.timeline-dot.pending  { background: #ff9f0a; }

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.timeline-content-expanded {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #2c2c2e;
  color: #d1d1d6;
}

/* =====================================================
   🪟 MODALES
   ===================================================== */
.sbs-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.6);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.sbs-modal-content {
  background: #1c1c1e;
  color: #f2f2f2;
  border: 1px solid #2c2c2e;
  border-radius: 16px;
  padding: 22px;
  width: 100%;
  max-width: 420px;
}

.sbs-modal-content input,
.sbs-modal-content textarea {
  background: #2c2c2e;
  color: #f2f2f2;
  border: 1px solid #3a3a3c;
}

/* =====================================================
   🔘 BOUTONS
   ===================================================== */
.reports-page .btn-secondary {
  background: #2c2c2e;
  border: none;
  color: #f2f2f2;
}

.reports-page .btn-success {
  background: #30d158;
  border: none;
  color: #000;
}

.reports-page .btn-danger {
  background: #ff453a;
  border: none;
  color: #fff;
}

</style>


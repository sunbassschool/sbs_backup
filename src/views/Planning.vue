<template>
  <Layout>
    <div class="container-xxl mt-4">
      <div ref="scrollContainer" class="refreshable-area">
      <div v-if="isRefreshing" class="refresh-spinner-overlay">
  <span class="spinner-border custom-spinner" role="status" aria-hidden="true"></span>
</div>

        <!-- 🔄 Loader pendant le chargement -->
        <div v-if="loading" class="d-flex justify-content-center align-items-center mt-5">
          <div class="spinner-border custom-spinner" role="status" style="width: 1.5rem; height: 1.5rem;">
            <span class="visually-hidden">Chargement...</span>
          </div>
        </div>

        <!-- ✅ Message si aucun cours trouvé -->
        <div v-if="!loading && upcomingCourses.length === 0" class="alert alert-warning text-center mt-3">
          <p class="mb-2">🎸 Aucun cours à venir pour le moment.</p>
          <RouterLink
            to="/eleve/offres"
            class="btn btn-sm mt-2 fw-bold"
            style="background-color: #333; color: white;"
          >
            🔓 Débloquer avec un abonnement
          </RouterLink>
        </div>

        <!-- ✅ Tableau des cours -->
        <div v-if="!loading && upcomingCourses.length > 0" class="table-responsive mt-3">
          <table class="table table-hover shadow-sm" style="font-size: 1rem;">
     <thead class="table-dark">
  <tr>
    <th scope="col" colspan="2" class="text-center">
      📅 Date & Heure
    </th>
  </tr>
</thead>


            <tbody>
         <tr 
  v-for="(row, index) in upcomingCourses" 
  :key="index"
  class="clickable-row"
  @click="openCourseMenu(row)"
  style="cursor: pointer;"
>
  <!-- Date -->
  <td>
   <strong>
  {{
    new Date(row.date).toLocaleString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).replace(",", " à")
  }}
</strong>

  </td>

  <!-- Badge statut -->
  <td class="text-end" style="width: 120px;">
    <span :class="['status-badge', statusClass(row.Status)]">
      {{ statusLabel(row.Status) }}
    </span>
  </td>
</tr>



            </tbody>
          </table>
        </div>
      </div>
    </div>

  <!-- MODALE MENU COURS -->
<div
  v-if="showCourseMenu"
  class="sbs-modal"
  @click.self="closeAllModals"
>
  <div class="sbs-modal-content" @click.stop>
    <h5 class="mb-3">Cours du {{ selectedCourse?.formattedDate }}</h5>

    <button class="btn btn-danger w-100 mb-2" @click="joinSelectedCourse">
      ➡ Rejoindre le cours
    </button>

    <button class="btn btn-warning w-100 mb-3" @click="openReportModal">
      ↻ Reporter ce cours
    </button>


<!-- bouton d'envoi pour l'upload -->
<button
  class="btn btn-primary w-100 mb-2"
  @click="openUploadModal"
>
  📎 Envoyer un fichier
</button>


    <button class="btn btn-secondary w-100" @click="closeCourseMenu">
      Annuler
    </button>
  </div>
</div>

<!-- MODALE REPORT -->
<div
  v-if="showReportModal"
  class="sbs-modal"
  @click.self="closeAllModals"
>
  <div class="sbs-modal-content" @click.stop>
    <h5 class="mb-3">Reporter le cours du {{ selectedCourse?.formattedDate }}</h5>

    <label class="form-label fw-bold">Raison</label>
    <select v-model="reportReason" class="form-select mb-3">
      <option value="">Choisir une raison</option>
      <option>Maladie</option>
      <option>Problème perso</option>
      <option>Imprévu</option>
      <option>Autre…</option>
    </select>

    <label class="form-label fw-bold">Message (optionnel)</label>
    <textarea
      v-model="reportMessage"
      class="form-control mb-3"
      rows="3"
      placeholder="Ajouter un message…"
    ></textarea>

    <button 
  class="btn btn-warning w-100 mb-2"
  @click="submitReport"
  :disabled="isSendingReport"
>
  <span v-if="!isSendingReport">📤 Envoyer la demande</span>

  <!-- Loader SunBass -->
  <span v-else class="loader-inline"></span>
</button>


    <button class="btn btn-secondary w-100" @click="closeReportModal">
      Annuler
    </button>
  </div>
</div>



<div 
  v-if="toast.show"
  :class="[
    'sbs-toast',
    toast.type === 'success' ? 'sbs-toast-success' : 'sbs-toast-error'
  ]"
>
  {{ toast.message }}
</div>
<!-- MODALE UPLOAD FICHIER -->
<div
  v-if="showUploadModal"
  class="sbs-modal"
  @click.self="closeUploadModal"
>
  <div class="sbs-modal-content" @click.stop>
    <h5 class="mb-3">
      📎 Fichier pour le cours du {{ selectedCourse?.formattedDate }}
    </h5>

    <input
      type="file"
      class="form-control mb-3"
      @change="onFileSelected"
    />

    <div v-if="uploadProgress > 0" class="progress mb-3">
      <div
        class="progress-bar"
        role="progressbar"
        :style="{ width: uploadProgress + '%' }"
      ></div>
    </div>

    <button
      class="btn btn-primary w-100 mb-2"
      :disabled="!selectedFile || isUploading"
      @click="uploadFile"
    >
      📤 Envoyer
    </button>

    <button class="btn btn-secondary w-100" @click="closeUploadModal">
      Annuler
    </button>
  </div>
</div>


  </Layout>
</template>

<script>
import Layout from "../views/Layout.vue";
import { useAuthStore } from "@/stores/authStore";

import axios from "axios";
import { ref, computed, onMounted, nextTick, watchEffect } from "vue";
import { useInstagramPullToRefresh } from "@/composables/useInstagramPullToRefresh";

import { usePullToRefresh } from "@/composables/usePullToRefresh";

export default {
  name: "Planning",
  components: { Layout },
  setup() {
    const log = (...args) => {
  console.log("📎 UPLOAD", ...args)
}

    // === URLs API ===
    const profId = computed(() => auth.user?.prof_id || "");

const routes = {
  POST: "AKfycbypPWCq2Q9Ro4YXaNnSSLgDrk6Jc2ayN7HdFDxvq4KuS2yxizow42ADiHrWEy0Eh1av9w/exec"
};

// === Helper POST via proxy ===
const getProxyPostURL = (routeId) => {
  const baseURL = `https://script.google.com/macros/s/${routeId}`;
  return `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(baseURL)}`;
};
const closeAllModals = () => {
  showCourseMenu.value = false;
  showReportModal.value = false;
};
// ====== ref pour upload file ====
const showUploadModal = ref(false)
const selectedFile = ref(null)
const uploadProgress = ref(0)
const isUploading = ref(false)
//============================
// Label affiché
const statusLabel = (status) => {
  switch (status) {
    case "fait":
      return "✔️ Fait";

    case "DEMANDE":
      return "⏳ En attente";

    case "REPORT_ACCEPTE":
      return "🔄 Report accepté";

    case "REPORT_REFUSE":
      return "📅 À venir";

    case "A_VENIR":
      return "📅 À venir";

    default:
      return "❔";
  }
};


// Classe CSS selon statut
const statusClass = (status) => {
  switch (status) {
    case "fait":
      return "status-done";

    case "DEMANDE":
      return "status-pending";

    case "REPORT_ACCEPTE":
      return "status-reported";

    case "REPORT_REFUSE":
      return "status-coming";

    case "A_VENIR":
      return "status-coming";

    default:
      return "status-unknown";
  }
};


const toast = ref({ show: false, message: "", type: "" });

const showToast = (message, type = "success") => {
  toast.value = { show: true, message, type };
  setTimeout(() => {
    toast.value.show = false;
  }, 2500);
};

    const planningData = ref([]);
    const loading = ref(true);
    const isRefreshing = ref(false); // 🆕
    const scrollContainer = ref(null);

   const auth = useAuthStore();

const email = computed(() => auth.user?.email || "");
const prenom = computed(() => auth.user?.prenom || "");
// 🔥 Correct : prof_id provenant du backend (recup_infos_membres)


const fetchPlanningData = async (forceApi = false) => {
  console.log("🚀 fetchPlanningData() appelé !");

if (!email.value || !profId.value) {
  console.log("⏳ Auth pas encore prête, retry dans 200ms...");
  setTimeout(() => fetchPlanningData(forceApi), 200);
  return;
}


const cacheKey = `planning_${email.value}_${profId.value}`;
  const cacheTimestampKey = `${cacheKey}_timestamp`;
  const cacheDuration = 24 * 60 * 60 * 1000;

  const cachedData = localStorage.getItem(cacheKey);
  const cacheTimestamp = localStorage.getItem(cacheTimestampKey);
  const cacheExpired = !cacheTimestamp || Date.now() - parseInt(cacheTimestamp, 10) > cacheDuration;

  if (cachedData && !cacheExpired && !forceApi) {
    try {
      const parsedData = JSON.parse(cachedData);
      if (parsedData.success && Array.isArray(parsedData.planning)) {
        console.log("⚡ Chargement depuis le cache");
        planningData.value = parsedData.planning;
        loading.value = false;
        return;
      }
    } catch (error) {
      console.error("❌ Erreur parsing cache :", error);
    }
  }

  // 👇 API call si cache expiré ou si forceApi est true
  try {
    console.log("🐥 FRONT → paramètres envoyés :", {
  email: email.value,
  profId: profId.value
});

    const baseURL = "https://script.google.com/macros/s/AKfycbypPWCq2Q9Ro4YXaNnSSLgDrk6Jc2ayN7HdFDxvq4KuS2yxizow42ADiHrWEy0Eh1av9w/exec";
const internalURL = `${baseURL}?route=planning&email=${encodeURIComponent(email.value)}&prof_id=${encodeURIComponent(profId.value)}`;
    const finalURL = `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(internalURL)}`;
    const response = await axios.get(finalURL);

    if (response.data.success && Array.isArray(response.data.planning)) {
      planningData.value = response.data.planning;
      localStorage.setItem(cacheKey, JSON.stringify(response.data));
      localStorage.setItem(cacheTimestampKey, Date.now().toString());
    }
  } catch (error) {
    console.error("❌ Erreur API :", error);
    alert("Erreur lors du chargement du planning.");
  } finally {
    loading.value = false;
  }
};


const handleRefresh = async () => {
  console.log("🔁 Rafraîchissement via scroll");
  isRefreshing.value = true; // 👈 affiche le loader
  await fetchPlanningData(true); // 👈 On force l'appel API
// 👈 appel direct, pas de cache
  isRefreshing.value = false; // 👈 stop le loader
};

const showCourseMenu = ref(false);
const showReportModal = ref(false);
const selectedCourse = ref(null);

const reportReason = ref("");
const reportMessage = ref("");
const isSendingReport = ref(false);

// 🔵 Ouvre le menu du cours quand on clique une ligne
const openCourseMenu = (course) => {
  console.log("📌 Cours sélectionné :", course);

  selectedCourse.value = course;
  showCourseMenu.value = true;
  
};

// 🔵 Ferme le menu principal
const closeCourseMenu = () => {
  showCourseMenu.value = false;
};

// 🔵 Rejoindre le cours depuis la modal
const joinSelectedCourse = () => {
  if (selectedCourse.value?.meet) {
    window.open(selectedCourse.value.meet, "_blank");
  }
  closeCourseMenu();
};

// 🔥 Ouvre la modal report
const openReportModal = () => {
  reportReason.value = "";
  reportMessage.value = "";
  showReportModal.value = true;
  closeCourseMenu();
};

// 🔥 Ferme modal report
const closeReportModal = () => {
  showReportModal.value = false;
};


// 📨 Envoi API → reportCourse()
const submitReport = async () => {
  if (!selectedCourse.value) return;

  if (!reportReason.value) {
    alert("Merci de choisir une raison.");
    return;
  }

  isSendingReport.value = true;

  try {
    const endpoint = routes.POST; // ID du script Apps Script
    const url = getProxyPostURL(endpoint); // 🔥 OBLIGATOIRE

    const payload = {
      route: "reportcourse",
      jwt: auth.jwt,
      course_id: selectedCourse.value.ID_Cours,
      reason: reportReason.value,
      message: reportMessage.value
    };

    console.log("📌 ID envoyé :", payload.course_id);
    console.log("📡 URL POST :", url);
    console.log("📦 Payload :", payload);

    const response = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" }
    });

  if (response.data.success) {
  showReportModal.value = false;
  showToast("Demande envoyée ✔", "success");
} else {
  showToast(response.data.message || "Erreur lors de l’envoi", "error");
}


  } catch (err) {
  console.error(err);
  showToast("Erreur réseau ❌", "error");
}


  isSendingReport.value = false;
};


function openUploadModal() {
  log("openUploadModal()")
  showCourseMenu.value = false
  showUploadModal.value = true
}


function closeUploadModal() {
  showUploadModal.value = false
  selectedFile.value = null
  uploadProgress.value = 0
}

function onFileSelected(event) {
  selectedFile.value = event.target.files[0]
  log("file selected", selectedFile.value?.name, selectedFile.value?.size)
}


async function uploadFile() {
  log("uploadFile() CLICK")

  if (!selectedFile.value) {
    log("❌ no file selected")
    return
  }

  if (!selectedCourse.value) {
    log("❌ no selectedCourse")
    return
  }

  isUploading.value = true

  try {
    // 1️⃣ récupérer le token d’upload

const endpoint = routes.POST
const url = getProxyPostURL(endpoint)

log("requesting upload token")

const response = await axios.post(url, {
  route: "getuploadtoken",
  jwt: auth.jwt,
  prof_id: auth.user.prof_id,
  cours_id: selectedCourse.value.ID_Cours,
  eleve_id: auth.user.user_id
})

log("token response", response.data)

if (!response.data || !response.data.token) {
  throw new Error("Token invalide ou manquant")
}

const token = response.data.token



    // 2️⃣ upload vers GoDaddy
    const formData = new FormData()
    formData.append("file", selectedFile.value)
    formData.append("token", token)
log("requesting upload token")

    const xhr = new XMLHttpRequest()
    xhr.open("POST", "https://www.sunbassschool.com/sbs-upload/upload.php")
log("token response", response.data)

    xhr.upload.onprogress = (e) => {
      log("progress", uploadProgress.value + "%")

      if (e.lengthComputable) {
        uploadProgress.value = Math.round((e.loaded / e.total) * 100)
      }
    }

xhr.onload = async () => {
  try {
    const result = JSON.parse(xhr.responseText)
    log("upload result", result)

    if (!result.success) {
      throw new Error("Upload PHP failed")
    }

    // 📌 Appel GAS pour persister l’upload
    const endpoint = routes.POST
    const url = getProxyPostURL(endpoint)

    const attachResponse = await axios.post(url, {
      route: "attachfiletocours",
      jwt: auth.jwt,
      cours_id: result.cours_id,
      prof_id: result.prof_id,
      eleve_id: result.eleve_id,
      file_url: result.url,
      file_name: result.name,
      file_size: result.size,
      file_type: selectedFile.value.type
    })

    log("attachfiletocours response", attachResponse.data)

    if (!attachResponse.data.success) {
      throw new Error("attachfiletocours failed")
    }

    showToast("Fichier envoyé ✔", "success")
    closeUploadModal()

  } catch (err) {
    log("❌ post-upload error", err)
    showToast("Erreur après upload ❌", "error")
  } finally {
    isUploading.value = false
  }
}


    xhr.onerror = () => {
      throw new Error("Upload échoué")
      log("upload error")

    }

    xhr.send(formData)

  } catch (err) {
      log("❌ upload failed", err)

    isUploading.value = false
    toast.message = "Erreur lors de l’envoi du fichier"
    toast.type = "error"
    toast.show = true
      showToast("Erreur upload ❌", "error")

  }
}


   watchEffect(() => {
  if (scrollContainer.value) {
    usePullToRefresh({
      container: scrollContainer,
      threshold: 60,
      onRefresh: handleRefresh
    });
  }
});


onMounted(async () => {
  await fetchPlanningData();
  await nextTick();

  if (scrollContainer.value) {
      useInstagramPullToRefresh({
    containerRef: scrollContainer,
    threshold: 50,
    onRefresh: handleRefresh
  });
  } else {
    console.warn("❌ scrollContainer est null");
  }
});


    const openMeet = (url) => {
      if (url) window.open(url, "_blank");
    };

    const upcomingCourses = computed(() => {
      const now = new Date();
      return planningData.value.filter((course) => {
        const courseDate = new Date(course.date || course.formattedDate);
        return courseDate >= now;
      });
    });

 return {
  planningData,
  loading,
  openMeet,
  upcomingCourses,
  scrollContainer,
  isRefreshing, // 👈 Ajout obligatoire
  // 🆕 Ajout obligatoire
  showCourseMenu,
  showReportModal,
  selectedCourse,
  reportReason,
  reportMessage,
  isSendingReport,

  openCourseMenu,
  closeCourseMenu,
  joinSelectedCourse,
  openReportModal,
  closeReportModal,
  submitReport,
  // 🔥 AJOUT ICI
  toast,
  showToast,
  showCourseMenu,
  showReportModal,
  closeAllModals,
    statusLabel,
  statusClass,
  showUploadModal,
selectedFile,
uploadProgress,
isUploading,

openUploadModal,
closeUploadModal,
onFileSelected,
uploadFile,
};

  },
};
</script>

<style scoped>
  /* STATUT DES COURS */
/* 🎯 STYLE BADGE PREMIUM */
/* 🌑 Base minimaliste */
.status-badge {
  display: inline-block;
  padding: 2px 6px;         /* 🔥 compact */
  font-size: 0.75rem;       /* 🔥 discret */
  font-weight: 500;         /* 🔥 léger */
  border-radius: 6px;       /* arrondi subtil */
  line-height: 1;           /* 🔥 n'augmente PAS la hauteur du tableau */
  white-space: nowrap;

  border: 1px solid transparent;
  background: transparent;  /* aucune couleur de fond */
}


/* 🟢 Fait */
.status-done {
  color: #4caf50;
  border-color: rgba(76, 175, 80, 0.4);
}

.status-pending {
  color: #bfa500;
  border-color: rgba(191, 165, 0, 0.4);
}

.status-reported {
  color: #008ea0;
  border-color: rgba(0, 142, 160, 0.4);
}

.status-refused {
  color: #c23a3a;
  border-color: rgba(194, 58, 58, 0.4);
}

.status-coming {
  color: #888;
  border-color: rgba(136, 136, 136, 0.4);
}

.status-unknown {
  color: #555;
  border-color: rgba(85, 85, 85, 0.3);
}



.refreshable-area {
  position: relative; /* ✅ Ajoute ça si manquant */
  overflow-y: auto;
  height: calc(100vh - 120px);
  -webkit-overflow-scrolling: touch;
  transition: transform 0.3s ease;
  will-change: transform;
}

.status-refused {
  background: #ffdddd;
  color: #b70000;
  border-left: 4px solid #b70000;
}

.custom-spinner {
  width: 1.2rem;
  height: 1.2rem;
  border-width: 0.15em;
  border-color: #8B0000 transparent #8B0000 transparent; /* rouge foncé */
  animation: custom-spin 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  opacity: 0.85; /* discrétion */
}

@keyframes custom-spin {
  0% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.1);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}

.vue3-pull-to-refresh__spinner {
  color: #dc3545; /* ou la couleur de ton thème */
}

/* ✅ Style amélioré */
h2 {
  font-weight: bold;
  color: #343a40;
}

/* ✅ Conteneur principal en pleine largeur */
.container-xxl {
  width: 100% !important;
  max-width: 100% !important;
  padding-left: 15px;
  padding-right: 15px;
}

/* ✅ S'assurer que tout le contenu est bien aligné sur toute la largeur */
.container-xxl > div {
  width: 100%;
}

/* ✅ Rendre le tableau fluide en responsive */
.table-responsive {
  width: 100%;
  overflow-x: auto;
}

/* ✅ Meilleure lisibilité du tableau */
.table {
  border-radius: 10px;
  overflow: hidden;
  width: 100%;
  font-size: 1rem;
}

.table th, .table td {
  padding: 15px;
  text-align: center;
  vertical-align: middle;
  white-space: nowrap;
}

.table th {
  background-color: #212529;
  color: #ffffff;
}

/* ✅ Effet au survol et curseur main */
.table-hover tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

/* ✅ Messages d'alerte en pleine largeur */
.alert {
  width: 100%;
  font-weight: bold;
  font-size: 1.1rem;
  text-align: center;
  padding: 20px;
}

/* ✅ Boutons en pleine largeur sur petits écrans */
.d-flex.justify-content-center.gap-3 {
  width: 100%;
  flex-wrap: wrap;
  justify-content: center;
}

.d-flex.justify-content-center.gap-3 .btn {
  flex: 1;
  min-width: 150px;
  max-width: 300px;
  text-align: center;
}

/* ✅ Adaptation mobile (≤ 768px) */
@media (max-width: 768px) {
  .table th, .table td {
    padding: 10px;
    font-size: 0.9rem;
  }
}

/* ✅ Adaptation très petits écrans (≤ 576px) */
@media (max-width: 576px) {
  .container-xxl {
    padding-left: 5px;
    padding-right: 5px;
  }

  .alert {
    font-size: 1rem;
    padding: 10px;
  }
}

.refresh-wrapper {
  max-height: 75vh; /* ajuste selon ton besoin */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* pour iOS */
  background-color: white;
  border-radius: 10px;
}

.refresh-inner {
  padding: 10px;
}
.refresh-spinner-overlay {
  position: sticky;
  top: 0px; /* Ajuste selon ton besoin visuel */
  display: flex;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
}
.sbs-toast {
  position: fixed;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  background: #2b2b2b;
  color: #fff;
  padding: 10px 18px;
  border-radius: 6px;
  font-size: 14px;

  max-width: 420px;     /* ✔️ beaucoup plus confortable */
  width: auto;          /* ✔️ s'adapte au contenu */
  white-space: normal;  /* ✔️ permet le retour à la ligne */
  text-align: center;

  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
  animation: fadein 0.2s ease-out, fadeout 0.3s ease-in 2.2s forwards;
  z-index: 9999;
}



.sbs-toast-success {
  background-color: #28a745; /* vert */
}

.sbs-toast-error {
  background-color: #dc3545; /* rouge */
}

@keyframes fadein {
  from { opacity: 0; transform: translate(-50%, 10px); }
  to   { opacity: 1; transform: translate(-50%, 0); }
}

@keyframes fadeout {
  to { opacity: 0; transform: translate(-50%, 10px); }
}

/* ---- Overlay ---- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(3px);
  z-index: 998;
}

/* ---- Base Modale ---- */
.sbs-modal {
  position: fixed;
  inset: 0;
  z-index: 999;

  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;

  /* 🔥 Overlay amélioré */
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);      /* flou visible */
  -webkit-backdrop-filter: blur(6px); /* iOS */

  animation: overlayFade 0.18s ease-out;
}

@keyframes overlayFade {
  from { opacity: 0; }
  to   { opacity: 1; }
}


.sbs-modal-content {
  background: #1a1a1a;
  color: #fff;
  width: 90%;
  max-width: 380px;
  padding: 22px;
  border-radius: 14px;

  /* Glow léger SunBass */
  box-shadow: 0 8px 32px rgba(255, 80, 0, 0.12);

  border: 1px solid rgba(255, 255, 255, 0.07);

  animation: modalPop 0.22s ease-out;
}

@keyframes modalPop {
  from { opacity: 0; transform: scale(0.94); }
  to   { opacity: 1; transform: scale(1); }
}


.sbs-modal-content h5 {
  color: #ffb85c; /* orange foncé SunBass */
  font-weight: bold;
}

/* ---- Animation ---- */
@keyframes modalFade {
  from { opacity: 0; transform: translateY(15px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ---- Form elements ---- */
.sbs-modal-content .form-select,
.sbs-modal-content .form-control {
  background: #111;
  color: #fff;
  border: 1px solid #333;
}

.loader-inline {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}


</style>


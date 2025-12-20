<template>
    <Layout>
      <div class="container mt-4">
 
<div class="filters-responsive mb-4">

  <!-- Filtre statut -->
  <select 
    v-model="filterStatut"
    class="filter-select-custom"
    @change="filterFeedbacks"
  >
    <option value="ALL">📋 Tous ({{ feedbacks.length }})</option>
    <option value="nonlu">🔴 Non lus ({{ countNonLu }})</option>
    <option value="attente">🕒 En attente ({{ countAttente }})</option>
    <option value="valide">🟢 Validés ({{ countValide }})</option>
  </select>

  <!-- Filtre mois -->
  <select 
    v-model="selectedMonth"
    class="filter-select-custom"
    @change="filterFeedbacks"
  >
    <option value="">Tous les mois</option>
    <option 
      v-for="month in availableMonths" 
      :key="month.value" 
      :value="month.value"
    >
      {{ month.label }}
    </option>
  </select>

</div>



        <!-- 🔄 Chargement -->
        <div v-if="feedbackLoading" class="text-center text-light">
          <div class="spinner-border custom-spinner"></div>
          <p>Chargement des feedbacks...</p>
        </div>
  
        <!-- ❌ Erreur -->
        <div v-if="feedbackError" class="alert alert-danger">
          {{ feedbackError }}
        </div>
  
        <!-- ✅ Feedbacks existants -->
        <div v-if="feedbacks.length && !feedbackLoading">
<div 
 v-for="fb in filteredFeedbacks"

  :key="fb.ID"
  class="dashboard-card bg-dark border border-secondary rounded-3 p-0 mb-4 shadow-sm"
>
<!-- ✅ En-tête cliquable -->
<div 
  class="feedback-header clickable px-3 py-2 d-flex justify-content-between align-items-center"
  @click="toggleFeedbackDetails(fb.ID)"
  style="cursor: pointer;"
>
  <div class="flex-grow-1 d-flex align-items-center gap-2">

    <!-- Badge type (Prof / Élève) -->
    <span class="badge"
          :class="fb.Type === 'Prof' ? 'bg-primary' : 'bg-secondary'">
      {{ fb.Type }}
    </span>

    <!-- ⭐ Nouveau badge STATUT -->
    <span class="badge"
          :class="{
            'bg-success': fb.Statut === 'Validé',
            'bg-warning text-dark': fb.Statut === 'En attente',
            'bg-danger': fb.Statut?.toLowerCase() === 'non lu'
          }">
      {{ fb.Statut }}
    </span>

    <!-- Nom du cours -->
    <span class="cours-title flex-grow-1 text-center">
      {{ fb.Nom_Cours || 'Feedback' }}
    </span>

    <!-- Date -->
    <span class="badge badge-date-cours">
      {{ formatDateCours(fb.Date_Cours, fb.Date_Publication) }} 📅
    </span>

  </div>

  <!-- Flèche -->
  <span 
    class="feedback-toggle-icon ms-3"
    :class="{ rotated: openedFeedbackId === fb.ID }"
  >
    ⯆
  </span>
</div>


  <!-- 📂 Contenu déplié -->
   <transition name="fade-slide">

  <div v-if="openedFeedbackId === fb.ID" class="p-4">
    <!-- contenu habituel ici -->
    <!-- 💬 Message complet -->
    <div 
      class="text-light mb-3 formatted-content" 
      v-html="nettoyerContenu(fb.contenuformate || fb.Contenu)"
    ></div>

    <!-- 🧾 Statut + Auteur -->
    <div class="d-flex justify-content-between align-items-center small text-muted mb-2">
      <span :class="fb.Statut === 'Validé' ? 'text-success' : 'text-warning'">
        {{ fb.Statut }}
      </span>
      <span>Par {{ fb.Auteur }}</span>
    </div>

    <!-- ✅ Marquer comme lu -->
<div v-if="fb.Statut !== 'Validé'" class="form-check mt-2">
      <input 
        class="form-check-input"
        type="checkbox"
        :id="'feedback-' + fb.ID"
        :checked="fb.Statut === 'Validé'"
        :disabled="fb.Statut === 'Validé'"
        @change="markAsRead(fb.ID)"
      >
      <label class="form-check-label text-light" :for="'feedback-' + fb.ID">
        Marquer comme lu
      </label>
    </div>

    <!-- 🗑️ Suppression -->
    <div v-if="fb.Auteur === email" class="text-end mt-2">
      <button class="btn btn-sm btn-danger" @click="deleteFeedback(fb.ID)">
        Supprimer 🗑️
      </button>
    </div>

    <!-- 🧾 Réponses -->
    <div v-if="fb.reponses?.length" class="mt-4">
      <div 
        v-for="rep in fb.reponses" 
        :key="rep.ID"
        class="bg-light text-dark p-3 mb-2 rounded border"
      >
        <div class="d-flex justify-content-between small mb-2">
          <strong>{{ rep.Type }}</strong>
          <small>{{ formatDate(rep.Date_Publication) }}</small>
        </div>
        <div class="formatted-content" v-html="nettoyerContenu(rep.contenuformate || rep.Contenu)"></div>
      </div>
    </div>

    <!-- ✍️ Champ de réponse -->
    <div class="mt-3">
      <textarea
        v-model="reponses[fb.ID]"
        class="form-control mb-2"
        rows="2"
        placeholder="Répondre à ce feedback..."
      ></textarea>
      <div class="d-flex justify-content-end">
        <button 
          class="btn btn-sm btn-outline-success"
          @click="sendReply(fb.ID)"
          :disabled="!reponses[fb.ID] || sendingReply[fb.ID]"
        >
          {{ sendingReply[fb.ID] ? "Envoi..." : "Répondre" }}
        </button>
    
      </div>
    </div>
  </div>
  </transition>
</div>
</div>
  
  <div class="question-card mb-4 p-0">
  <!-- 🔽 En-tête cliquable -->
  <div 
    class="question-card-header p-4 d-flex justify-content-between align-items-center clickable"
    @click="showNewFeedbackForm = !showNewFeedbackForm"
    style="cursor: pointer;"
  >
    <h4 class="question-card-title mb-0">✍️ Poser une question au prof</h4>
    <span 
      class="feedback-toggle-icon"
      :class="{ rotated: showNewFeedbackForm }"
    >⯆</span>
  </div>

  <!-- ✨ Contenu dépliable -->
  <transition name="fade-slide">
    <div v-if="showNewFeedbackForm" class="question-card-body p-4">
      <div class="editor-wrapper editor-light mb-4">
        <QuillEditor
          v-model:content="nouveauFeedback"
          content-type="html"
          theme="snow"
          placeholder="✍️ Écris ici ton message..."
          class="ql-light"
        />
      </div>

      <div class="d-flex justify-content-center mt-3">
        <button 
          class="btn btn-minimal-submit"
          @click="sendFeedback"
          :disabled="sendingFeedback || !nouveauFeedback.trim()"
        >
          <span v-if="!sendingFeedback">Envoyer ✉️</span>
          <span v-else class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          <span v-if="sendingFeedback">Envoi...</span>
        </button>
      </div>
    </div>
  </transition>


</div>

        <!-- ℹ️ Aucun feedback -->
        <div v-if="!feedbacks.length && !feedbackLoading" class="text-light text-center">
          Aucun feedback pour l’instant.
        </div>
  
        <!-- ✍️ Nouveau feedback -->
        
  
      </div>
    </Layout>
  </template>
  
  
  <script>
  import Layout from "../views/Layout.vue";
  import { useAuthStore } from "@/stores/authStore";

  import { getValidToken } from "@/utils/api.ts";
  import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';

  import { jwtDecode } from "jwt-decode";
  
  export default {
    name: "Feedback",
  components: {
  Layout,
  QuillEditor
},

    data() {
      return {
        reponses: {}, // Chaque feedback aura son champ texte
sendingReply: {},
openedFeedbacks: [],
selectedMonth: "",
openedFeedbackId: null,
showNewFeedbackForm: false,

        nouveauFeedback: "",
feedbackSentMessage: "",
sendingFeedback: false,
        feedbacks: [],
        feedbackLoading: false,
        feedbackError: null,
        filterStatut: "ALL",

        routes: {
          GET: "AKfycbzSdi_Gl1PBWPXdbZshmqJvM7cudH1DdxQK-kD-pMdImbIdc9EH9H07tLs8IOMN_Tv17g/exec",
          POST: "AKfycbzSdi_Gl1PBWPXdbZshmqJvM7cudH1DdxQK-kD-pMdImbIdc9EH9H07tLs8IOMN_Tv17g/exec",
        },
     email: null,
prenom: null,
userData: {},

      };
    },
  computed: {
filteredFeedbacks() {
  let list = this.feedbacks

  if (this.selectedMonth) {
    list = list.filter(fb => {
      const d = new Date(fb.Date_Cours || fb.Date_Publication)
      if (isNaN(d)) return false

      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      return key === this.selectedMonth
    })
  }

  if (this.filterStatut !== "ALL") {
    list = list.filter(fb => {
      const statut = (fb.Statut || "").toLowerCase()
      if (this.filterStatut === "nonlu") return statut === "non lu"
      if (this.filterStatut === "attente") return statut === "en attente"
      if (this.filterStatut === "valide") return statut === "validé"
      return true
    })
  }

  return list
}



,


 countNonLu() {
    return this.feedbacks.filter(fb =>
      (fb.Statut || "").toLowerCase() === "non lu"
    ).length;
  },

  countAttente() {
    return this.feedbacks.filter(fb =>
      (fb.Statut || "").toLowerCase() === "en attente"
    ).length;
  },

  countValide() {
    return this.feedbacks.filter(fb =>
      (fb.Statut || "").toLowerCase() === "validé"
    ).length;
  },
  availableMonths() {
    const uniqueMonths = new Set(
      this.feedbacks.map(fb => {
        const date = new Date(fb.Date_Cours || fb.Date_Publication);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      })
    );

    return [...uniqueMonths]
      .sort((a, b) => b.localeCompare(a)) // tri du plus récent au plus ancien
      .map(m => {
        const [year, month] = m.split("-");
        const label = new Date(`${year}-${month}-01`).toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "long"
        });
        return { value: m, label };
      });
  }
},

async mounted() {
  const auth = useAuthStore()

  this.email = auth.user?.email || null
  this.prenom = auth.user?.prenom || null
  this.userData = auth.user || {}

  await this.fetchFeedbacks()
  await this.$nextTick()

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  this.selectedMonth =
    this.availableMonths.find(m => m.value === currentMonth)?.value
    || this.availableMonths[0]?.value
    || ""
}


,

  
    methods: {
        async deleteFeedback(id) {
  if (!confirm("❗ Supprimer ce feedback ?")) return;

  const jwt = await getValidToken();
  if (!jwt) return;

  const url = this.getProxyPostURL(this.routes.POST);
  const payload = {
    route: "deletefeedback",
    jwt,
    feedback_id: Number(String(id).replace("ID", ""))
  };

  console.log("🧾 ID numérique final envoyé :", payload.feedback_id);
  console.log("📡 URL utilisée pour suppression :", url);
  console.log("📦 Payload complet :", payload);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (result.success) {
      console.log("🗑️ Feedback supprimé :", result.message);
      await this.fetchFeedbacks();
    } else {
      console.warn("❌ Erreur suppression :", result.message);
    }
  } catch (err) {
    console.error("❌ Erreur API deletefeedback :", err);
  }
}


,
initCurrentMonth() {
  if (!this.feedbacks.length) return

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const exists = this.feedbacks.some(fb => {
    const d = new Date(fb.Date_Cours || fb.Date_Publication)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    return key === currentMonth
  })

  if (exists) this.selectedMonth = currentMonth
}
,
setDefaultMonth() {
  if (!this.feedbacks.length) return;

  // mois actuel → format "2025-11"
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // vérifier si le mois existe dans les feedbacks
  const exists = this.availableMonths.find(m => m.value === currentMonth);

  if (exists) {
    this.selectedMonth = currentMonth;
  } else {
    this.selectedMonth = "";
  }
}
,
toggleFeedbackDetails(id) {
  this.openedFeedbackId = this.openedFeedbackId === id ? null : id;
}
,
formatDateCours(dateCours, datePublication) {
  const formatter = (dateString) => {
    const d = new Date(dateString);
    if (isNaN(d)) return null;

    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  if (dateCours) {
    const date = formatter(dateCours);
    if (date) return `Cours du ${date}`;
  }

  // fallback sur la date de publication
  if (datePublication) {
    const date = formatter(datePublication);
    if (date) return date;
  }

  return "Date inconnue";
}


,
getExcerpt(html) {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  const text = tempDiv.textContent || tempDiv.innerText || "";
  return text.slice(0, 100); // tu ajustes la longueur ici
}
,
nettoyerContenu(contenu) {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = contenu.replace(/&nbsp;/g, ' ');
  return tempDiv.innerHTML;
}

,
    async sendReply(feedbackId) {
  const texte = this.reponses[feedbackId]?.trim();
  if (!texte) return;

  this.sendingReply[feedbackId] = true;

  const jwt = await getValidToken();
  if (!jwt) return;

  const url = this.getProxyPostURL(this.routes.POST);
const auth = useAuthStore();

const payload = {
  route: "replytofeedback",
  jwt,
  feedback_id: Number(String(feedbackId).replace("ID", "")),
  contenu: texte,
id_eleve: auth.user?.id || auth.user?.email,
  prenom: auth.user?.prenom,
  email: auth.user?.email,   // 🔥 obligatoire !
  type: "Élève"
};



  console.log("📤 Payload envoyé pour reply:", payload);

  try {
    const res = await fetch(url, {
      method: "POST",
        headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (result.success) {
      this.reponses[feedbackId] = "";

      // 🔁 recharge la liste
      await this.fetchFeedbacks();

      // ✅ Valide automatiquement le feedback parent
      await this.markAsRead(feedbackId);
    } else {
      console.warn("❌ Erreur réponse feedback :", result);
    }

  } catch (err) {
    console.error("❌ Erreur API replytofeedback :", err);
  } finally {
    this.sendingReply[feedbackId] = false;
  }
}

,
async fetchFeedbacks() {
  this.feedbackLoading = true;
  this.feedbackError = null;

  const jwt = await getValidToken();
  if (!jwt) return;

  const url = this.getProxyURL(this.routes.GET, {
    route: "getfeedbacks",
    jwt,
    role: "admin"
  });

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.feedbacks) {
      this.feedbackError = "Aucun feedback trouvé.";
      return;
    }

    const all = data.feedbacks;
const auth = useAuthStore();
const idEleveActuel = auth.user?.id || auth.user?.email;

    // 🧠 Map des ID existants
    const allIds = new Set(all.map(fb => String(fb.ID)));

    // 🧹 fonction qui détecte un parent, même ancienne data
    const isParent = (fb) => {
      const idc = String(fb.ID_Cours || "").trim().toLowerCase();

      if (!idc || idc === "null" || idc === "") return true;

      // anciennes datas douteuses
      if (["prof", "sunny", "eleve", "cours", "test"].includes(idc)) return true;

      // si "IDxxx" mais n’existe pas → parent
      if (idc.startsWith("id") && !allIds.has(idc)) return true;

      return false;
    };

    // 🟦 feedbacks principaux
    const principaux = all.filter(fb =>
      isParent(fb) && fb.ID_Eleve === idEleveActuel
    );

    // 🟧 réponses
    const reponses = all.filter(fb =>
      !isParent(fb)
    );

    // 🧩 association
    this.feedbacks = principaux.reverse().map(parent => {

      const pid = String(parent.ID);
      const pidNum = pid.replace("ID", "");

      const reps = reponses.filter(rep => {
        const rc = String(rep.ID_Cours);
        return rc === pid || rc === pidNum;
      });

      return {
        ...parent,
        reponses: reps
      };
    });

  } catch (err) {
    console.error("❌ Erreur récupération feedbacks :", err);
    this.feedbackError = "Erreur de chargement.";
  } finally {
    this.feedbackLoading = false;
  }
}








,
  
      getProxyURL(routeId, params = {}) {
        const baseURL = `https://script.google.com/macros/s/${routeId}`;
        const query = new URLSearchParams(params).toString();
        const fullURL = `${baseURL}?${query}`;
        return `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(fullURL)}`;
      },
      getProxyPostURL(routeId) {
  const baseURL = `https://script.google.com/macros/s/${routeId}`;
  return `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(baseURL)}`;
},

      formatDate(dateString) {
        if (!dateString) return "Date inconnue";
        try {
          const date = new Date(dateString);
          return date.toLocaleString("fr-FR", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          });
        } catch (error) {
          return dateString;
        }
      },
      async sendFeedback() {
  if (!this.nouveauFeedback.trim()) return;

  this.sendingFeedback = true;
  this.feedbackSentMessage = "";

  const jwt = await getValidToken();
  if (!jwt) return;

  const url = this.getProxyPostURL(this.routes.POST);
const auth = useAuthStore();

const payload = {
  route: "addfeedback",
  jwt,
  id_cours: "",
id_eleve: auth.user?.id || auth.user?.email,
  prenom: auth.user?.prenom,
  email: auth.user?.email,   // 🔥 OBLIGATOIRE
  contenu: this.nouveauFeedback.trim(),
  type: "Élève"
};



  console.log("📡 URL POST brute :", this.getProxyPostURL(this.routes.POST));
console.log("🧾 Payload envoyé :", payload);

  try {
    const response = await fetch(url, {
      method: "POST",
        headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (result.success) {
      this.feedbackSentMessage = "✅ Feedback envoyé !";
      this.nouveauFeedback = "";
      await this.fetchFeedbacks(); // Recharge les feedbacks
    } else {
      console.warn("❌ Erreur API :", result.message);
    }
  } catch (error) {
    console.error("❌ Erreur d'envoi de feedback :", error);
  } finally {
    this.sendingFeedback = false;
    setTimeout(() => (this.feedbackSentMessage = ""), 3000);
  }
},
async markAsRead(feedbackId) {
  console.log("📤 feedbackId reçu dans front :", feedbackId, typeof feedbackId);

  const jwt = await getValidToken();
  if (!jwt) return;

  const cleanedId = typeof feedbackId === "string"
    ? Number(feedbackId.replace("ID", ""))
    : Number(feedbackId); // au cas où ce serait déjà un number

  const url = this.getProxyPostURL(this.routes.POST);
  const payload = {
    route: "validatefeedback",
    jwt,
    feedback_id: cleanedId
  };
console.log("📦 Payload envoyé pour validatefeedback :", payload);

  console.log("📦 Payload envoyé pour validation :", payload);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (result.success) {
      console.log("✅ Statut mis à jour :", result.message);
      await this.fetchFeedbacks(); // recharge les feedbacks
    } else {
      console.warn("❌ Erreur validation (backend) :", result);
    }
  } catch (err) {
    console.error("❌ Erreur API validatefeedback :", err);
  }
}


,
    }
  };
  </script>
  
  <style>.editor-light .ql-container {
  background-color: #ffffff;
  color: #000;
  border: 1px solid #ccc;
  border-radius: 6px;
  min-height: 150px;
}

.editor-light .ql-toolbar {
  background-color: #f8f9fa;
  border: 1px solid #ccc;
  border-bottom: none;
  border-radius: 6px 6px 0 0;
}

.ql-light .ql-editor {
  color: #000;
  font-size: 1rem;
}
.badge-date-cours {
  background-color: #ffeb3b; /* Jaune vif */
  color: #000 !important;    /* Texte bien noir, priorité haute */
  font-weight: bold;
  padding: 0.3em 0.6em;
  border-radius: 6px;
  font-size: 0.9em;
}

.feedback-header {
  background-color: #f0f0f0;
  padding: 0.75em 1em;
  border-radius: 6px;
  border: 1px solid #ddd;
  width: 100%;
}

.cours-title {
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 1em;
  color: #111;
  text-align: center;
}

.badge-date-cours {
  background-color: #ffeb3b;
  color: #000 !important;
  font-weight: bold;
  padding: 0.3em 0.6em;
  border-radius: 6px;
  font-size: 0.9em;
}

.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
.fade-slide-enter-to, .fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.feedback-toggle-icon {
  font-size: 1.4em;
  color: #636363;
  transition: transform 0.3s ease;
}

.feedback-toggle-icon.rotated {
  transform: rotate(180deg);
}

.question-card {
  background-color: #000000; /* fond sombre pour contraste */
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.question-card-header {
  background-color: #27292e;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #3a3b3f; /* séparation légère */
  border-radius: 8px 8px 0 0;       /* coin haut arrondi uniquement */
  margin-bottom: 0;                 /* ⬅️ empêche le gap entre header/body */
}

.question-card-title {
  color: #ffffff;
  font-size: 1.25rem;      /* légèrement plus grand */
  font-weight: 600;
}

.question-card-body {
  background-color: #ffffff;
  color: #333;
}

.editor-wrapper.editor-light .ql-container {
  background-color: #ffffff;
  color: #000;
  border: 1px solid #ccc;
  border-radius: 6px;
  min-height: 180px;
}

.btn-submit-feedback {
  background-color: #28a745;
  color: #fff;
  font-weight: bold;
  padding: 0.6em 1.2em;
  border: none;
  border-radius: 6px;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.btn-submit-feedback:disabled {
  background-color: #94d3a2;
  cursor: not-allowed;
}

.btn-submit-feedback:hover:not(:disabled) {
  background-color: #218838;
  transform: translateY(-2px);
}

.feedback-sent-message {
  color: #28a745;
  font-size: 0.95rem;
  font-weight: 500;
}
.header-bar {
  background-color: #27292e; /* gris sombre */
  padding: 1rem;
  border-radius: 6px;
}
/* conteneur global */
.filters-responsive {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

/* style du select (comme avant, dark, clean, sexy) */
.filter-select-custom {
  background-color: #27292e;
  color: white;
  border: 1px solid #3a3b3f;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.95rem;
  min-width: 180px;
  cursor: pointer;
}

/* option styling */
.filter-select-custom option {
  background-color: #1f1f1f;
  color: white;
  padding: 5px;
}

/* hover */
.filter-select-custom:hover {
  background-color: #32343a;
}

/* mobile responsive */
@media (max-width: 576px) {
  .filters-responsive {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-select-custom {
    width: 100%;
  }
}

</style>
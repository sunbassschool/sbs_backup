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
import { getProxyGetURL, getProxyPostURL } from "@/config/gas"

  import { getValidToken } from "@/utils/api.ts";
  import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';

  import { jwtDecode } from "jwt-decode";
  const FEEDBACK_TTL = 2 * 60 * 1000 // 2 minutes

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
selectedMonth: null,
openedFeedbackId: null,
showNewFeedbackForm: false,
    feedbackCacheKey: null,

        nouveauFeedback: "",
feedbackSentMessage: "",
sendingFeedback: false,
        feedbacks: [],
        feedbackLoading: false,
        feedbackError: null,
        filterStatut: "ALL",

    
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

  this.feedbackCacheKey = `feedback_${this.email || this.prenom}`

  // ⚡ affichage instantané
  const hasCache = this.loadFeedbackFromCache()

  // 🔄 refresh silencieux
  this.fetchFeedbacks({ silent: hasCache })

  await this.$nextTick()
}




,

  
    methods: {
  loadFeedbackFromCache() {
  if (!this.feedbackCacheKey) return false

  const raw = localStorage.getItem(this.feedbackCacheKey)
  if (!raw) return false

  try {
    const { data, ts, selectedMonth } = JSON.parse(raw)
    if (!Array.isArray(data)) return false
    if (Date.now() - ts > FEEDBACK_TTL) return false

    this.feedbacks = data
    this.selectedMonth = selectedMonth || ""
    this.feedbackLoading = false

    return true
  } catch {
    return false
  }
}
,

saveFeedbackToCache(list) {
  if (!this.feedbackCacheKey) return

  localStorage.setItem(
    this.feedbackCacheKey,
    JSON.stringify({
      data: list,
      selectedMonth: this.selectedMonth,
      ts: Date.now()
    })
  )
}
,

        async deleteFeedback(id) {
  if (!confirm("❗ Supprimer ce feedback ?")) return;

  const jwt = await getValidToken();
  if (!jwt) return;

  const url = getProxyPostURL()
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
      localStorage.removeItem(this.feedbackCacheKey)

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

  const url = getProxyPostURL()
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
localStorage.removeItem(this.feedbackCacheKey)

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
async fetchFeedbacks({ silent = false } = {}) {
  if (!silent) this.feedbackLoading = true
  this.feedbackError = null

  const jwt = await getValidToken()
  if (!jwt) return

  const url = getProxyGetURL(
    `route=getfeedbacks&jwt=${encodeURIComponent(jwt)}`
  )

  try {
    const res = await fetch(url)
    const data = await res.json()

    if (!Array.isArray(data.feedbacks)) {
      this.feedbackError = "Aucun feedback trouvé."
      return
    }

    const all = data.feedbacks
    const auth = useAuthStore()
    const idEleveActuel = auth.user?.id || auth.user?.email

    const allIds = new Set(all.map(fb => String(fb.ID)))

    const isParent = (fb) => {
      const idc = String(fb.ID_Cours || "").trim().toLowerCase()
      if (!idc || idc === "null") return true
      if (["prof", "sunny", "eleve", "cours", "test"].includes(idc)) return true
      if (idc.startsWith("id") && !allIds.has(idc)) return true
      return false
    }

    const principaux = all.filter(fb =>
      isParent(fb) && fb.ID_Eleve === idEleveActuel
    )

    const reponses = all.filter(fb => !isParent(fb))

    this.feedbacks = principaux.reverse().map(parent => {
      const pid = String(parent.ID)
      const pidNum = pid.replace("ID", "")

      return {
        ...parent,
        reponses: reponses.filter(rep => {
          const rc = String(rep.ID_Cours)
          return rc === pid || rc === pidNum
        })
      }
    })
// 🎯 recalage du mois affiché
if (
  !this.selectedMonth ||
  !this.availableMonths.some(m => m.value === this.selectedMonth)
) {
  this.selectedMonth = this.availableMonths[0]?.value || null
}

    // ✅ cache uniquement après succès
    this.saveFeedbackToCache(this.feedbacks)

  } catch (err) {
    console.error("❌ Erreur récupération feedbacks :", err)
    this.feedbackError = "Erreur de chargement."
  } finally {
    if (!silent) this.feedbackLoading = false
  }
}









,
  
  

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

  const url = getProxyPostURL()
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
      localStorage.removeItem(this.feedbackCacheKey)

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

  const url = getProxyPostURL()
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
      localStorage.removeItem(this.feedbackCacheKey)

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
  
  <<style>
/* ==================================================
   🍏 SBS DARK — iTunes / Apple Music Premium
   ================================================== */

:root {
  /* Accent Apple-like */
  --accent: #ffd54a;
  --accent-soft: rgba(255,213,74,0.12);

  /* Backgrounds */
  --bg-page: #0a0a0b;
  --bg-card: #141414;
  --bg-card-elevated: #1a1a1a;
  --bg-header: #1e1e1e;
  --bg-hover: #242424;

  /* Text */
  --text-main: #eaeaea;
  --text-muted: #9b9b9b;
  --text-faint: #6e6e6e;

  /* Borders */
  --border-subtle: rgba(255,255,255,0.08);
  --border-focus: rgba(255,213,74,0.5);

  /* Effects */
  --radius: 16px;
  --radius-sm: 10px;
  --shadow-card: 0 12px 40px rgba(0,0,0,0.55);
}

/* ==================================================
   FILTERS
   ================================================== */
.filters-responsive {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.filter-select-custom {
  appearance: none;
  background: linear-gradient(
    180deg,
    var(--bg-header),
    var(--bg-card)
  );
  color: var(--text-main);
  border: 1px solid var(--border-subtle);
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  letter-spacing: 0.02em;
  transition: all 0.25s ease;
}

.filter-select-custom:hover {
  background: var(--bg-hover);
  border-color: var(--border-focus);
}

.filter-select-custom option {
  background: #121212;
}

/* ==================================================
   FEEDBACK CARD
   ================================================== */
.dashboard-card {
  background: linear-gradient(
    180deg,
    var(--bg-card),
    var(--bg-card-elevated)
  );
  border-radius: var(--radius);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

/* ==================================================
   HEADER
   ================================================== */
.feedback-header {
  background: linear-gradient(
    135deg,
    var(--bg-header),
    transparent
  );
  border-bottom: 1px solid var(--border-subtle);
  transition: background 0.3s ease;
}

.feedback-header:hover {
  background: linear-gradient(
    135deg,
    var(--bg-hover),
    transparent
  );
}

.cours-title {
  font-weight: 500;
  font-size: 0.88rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
  text-align: center;
}

/* ==================================================
   BADGES
   ================================================== */
.badge {
  font-weight: 500;
  font-size: 0.68rem;
  padding: 0.35em 0.6em;
  border-radius: 999px;
}

.badge-date-cours {
  background: var(--accent-soft);
  color: var(--accent);
  border: 1px solid var(--border-focus);
  font-size: 0.68rem;
}

/* ==================================================
   TOGGLE ICON
   ================================================== */
.feedback-toggle-icon {
  color: var(--text-faint);
  font-size: 1.1rem;
  transition: transform 0.25s ease, color 0.2s ease;
}

.feedback-header:hover .feedback-toggle-icon {
  color: var(--text-main);
}

.feedback-toggle-icon.rotated {
  transform: rotate(180deg);
}

/* ==================================================
   CONTENT
   ================================================== */
.formatted-content {
  color: var(--text-main);
  line-height: 1.7;
  font-size: 0.92rem;
}

.small.text-muted {
  color: var(--text-muted) !important;
}

/* ==================================================
   RESPONSES
   ================================================== */
.bg-light.text-dark {
  background: #161616 !important;
  color: var(--text-main) !important;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

/* ==================================================
   QUESTION CARD
   ================================================== */
.question-card {
  background: #121212;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 14px;
  box-shadow: none;           /* ⬅️ plus de bloc massif */
}


.question-card-header {
  background: transparent;   /* ⬅️ plus de panneau */
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding: 14px 18px;
}



.question-card-title {
  font-size: 0.85rem;        /* ⬅️ réduit */
  font-weight: 500;
  color: #cfcfcf;
  letter-spacing: 0.08em;
  text-transform: uppercase; /* Apple section title */
}
.question-card-body {
  padding: 18px;
  background: transparent;
}
.feedback-toggle-icon {
  font-size: 0.9rem;         /* ⬅️ plus léger */
  opacity: 0.6;
}


/* ==================================================
   EDITOR
   ================================================== */
.editor-light .ql-container {
  background: #111111;
  color: var(--text-main);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  min-height: 170px;
}

.editor-light .ql-toolbar {
  background: #0d0d0d;
  border: 1px solid var(--border-subtle);
  border-bottom: none;
}

.ql-editor {
  font-size: 0.9rem;
}

/* ==================================================
   BUTTON
   ================================================== */
.btn-minimal-submit {
  background: linear-gradient(
    180deg,
    #ffe066,
    #ffd54a
  );
  color: #000;
  font-weight: 600;
  padding: 0.55em 1.8em;
  border-radius: 999px;
  border: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.btn-minimal-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(255,213,74,0.45);
}

.btn-minimal-submit:disabled {
  opacity: 0.5;
}

/* ==================================================
   TRANSITIONS
   ================================================== */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* ==================================================
   MOBILE
   ================================================== */
@media (max-width: 576px) {
  .filters-responsive {
    flex-direction: column;
  }

  .filter-select-custom {
    width: 100%;
  }
}


  </style>
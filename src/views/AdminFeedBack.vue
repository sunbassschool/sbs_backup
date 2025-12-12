<template>
    <Layout>
      <div class="container mt-4">
      





 

<div class="row g-4 mb-4 align-items-stretch">

<!-- 🌀 Affichage spinner pendant chargement -->
<!-- 🔄 Spinner UX doux -->
<div v-if="isLoadingEleves" class="loading-wrapper">
  <div class="dot-loader"></div>
 <div style="color: #b02a37; font-weight: 500;">
    Chargement des élèves...
  </div>
</div>



<!-- ✅ Colonne élève seulement après chargement -->
<div
  v-else
  :class="[
    'col-12',
    isFormReady ? 'col-md-4' : 'd-flex justify-content-center'
  ]"
>

  <transition name="fade">
    <div
      :class="[isFormReady ? 'card-style rounded' : 'vignette-ronde']"
      key="colonne1"
    >

    <!-- 👤 Avatar élève sélectionné -->
    <div v-if="selectedEleve" class="d-flex align-items-center mb-4 gap-3">
      <img
        :src="`https://ui-avatars.com/api/?name=${selectedEleve.prenom}+${selectedEleve.nom}&background=0D8ABC&color=fff&size=64`"
        alt="avatar"
        class="rounded-circle shadow"
        style="width: 64px; height: 64px;"
      />
      <div>
        <h6 class="mb-0">{{ selectedEleve.prenom }} {{ selectedEleve.nom }}</h6>
        <small class="text-muted">{{ selectedEleve.email }}</small>
      </div>
    </div>

    <!-- 🎯 Sélecteur d’élève -->
    <label class="form-label fw-bold">👤 Choisir un élève</label>
<select class="form-select mb-3" v-model="selectedEleveEmail" @change="handleEleveSelect">
  <option disabled value="">-- Sélectionne un élève --</option>
  <option value="ALL">📋 Tous les élèves</option>

  <optgroup label="✅ Élèves inscrits">
    <option v-for="e in eleves" :key="e.email" :value="e.email">
      {{ e.prenom }} {{ e.nom.toUpperCase() }}
    </option>
  </optgroup>

  <optgroup label="⚠️ Élèves non inscrits">
    <option v-for="e in elevesHorsInscrits" :key="e.email" :value="e.email">
      {{ e.prenom }} {{ e.nom.toUpperCase() }} ({{ e.statut }})
    </option>
  </optgroup>
</select>


 <!-- 📅 Partie affichée après choix élève -->
<div v-if="selectedEleve">

  <!-- 📅 Date du cours -->
  <div class="mb-3">
    <label class="form-label fw-bold">📅 Date du cours</label>
    <select
      class="form-select"
      v-model="dateCours"
    >
      <option disabled value="">-- Sélectionne une date --</option>
      <option
        v-for="d in datesCoursEleve"
        :key="d"
        :value="d"
      >
        {{ new Date(d).toLocaleString('fr-FR', {
            weekday: 'long', year: 'numeric', month: 'long',
            day: '2-digit', hour: '2-digit', minute: '2-digit'
        }) }}
      </option>
    </select>
  </div>

  <!-- 🎵 Nom du cours -->
  <div class="mb-3" v-if="dateCours">
    <label class="form-label fw-bold">🎵 Nom du cours</label>
    <input
      type="text"
      class="form-control"
      v-model="nomCours"
      placeholder="Ex. : Groove reggae"
    />
  </div>

  <!-- 📅 Mois -->
  <div class="mt-3" v-if="selectedEleve">
    <label class="form-label fw-bold">📅 Filtrer par mois</label>
    <select
      class="form-select mb-3"
      v-model="selectedMonth"
      :disabled="!availableMonths.length"
    >
      <option value="ALL">Tous les mois</option>
      <option
        v-for="month in availableMonths"
        :key="month"
        :value="month"
      >
        {{ formatMonthLabel(month) }}
      </option>
    </select>
  </div>
</div>
</div>


</transition>
</div>


 <!-- 💬 Colonne 2 : Feedback -->
<transition name="slide-fade">
  <div
    v-if="isFormReady"
    class="col-12 col-md-8"
  >

  <div class="card-style-editor bg-white text-dark p-4 rounded shadow-sm h-100 d-flex flex-column">
    

    <div v-if="canSendFeedback" class="editor-wrapper editor-light flex-grow-1 mb-3">
      <QuillEditor
        :key="selectedEleve?.email + feedbackSentMessage"
        v-model:content="nouveauFeedback"
        content-type="html"
        theme="snow"
        placeholder="✍️ Écris ici ton feedback pour cet élève..."
        class="ql-light"
      />
    </div>
<div v-else class="text-muted text-center fst-italic mb-3">
  ⚠️ Sélectionne un élève et une date de cours pour rédiger un feedback.
</div>

    <button
      class="btn btn-success w-100"
      @click="sendFeedback"
      :disabled="!nouveauFeedback || nouveauFeedback === '<p><br></p>'"
    >
      ✅ Envoyer le feedback
    </button>

    <div v-if="feedbackSentMessage" class="text-success mt-3 text-center">
      {{ feedbackSentMessage }}
    </div>
  </div>
</div></transition>
</div>





<!-- 💬 Liste des feedbacks -->
<div v-if="readyToShowFeedbacks && showGlobalFeedbacks && selectedEleve">



 
<div v-if="isLoadingFeedbacks" class="d-flex justify-content-center my-3">
  <div class="spinner-border text-danger spinner-border-sm" role="status" style="width: 1.5rem; height: 1.5rem;"></div>
</div>



  <div v-if="feedbacks.length">
    <div v-if="!selectedEleve" class="text-light fst-italic">
      🔍 Sélectionne un élève pour afficher ses feedbacks.
    </div>


   

<div
  id="pdf-content"
  v-show="selectedEleve"
  style="visibility: hidden; position: absolute; left: -9999px;"
>

 <h2>📋 Feedbacks pour {{ selectedEleve.prenom }} {{ selectedEleve.nom }}</h2>
  <div v-for="fb in feedbacks" :key="fb.ID" class="pdf-feedback">
    <p class="meta"><strong>{{ fb.Type }}</strong> — <em>{{ formatDate(fb.Date_Publication) }}</em></p>
    <hr />
    <div class="content" v-html="fb.contenuformate || fb.Contenu" />
  </div>

</div>


          <div v-for="fb in limitedFeedbacks" :key="fb.ID" class="bg-dark text-light border rounded p-3 mb-3">

            <!-- 🎖️ Auteur + Date + Suppr -->
<div class="d-flex justify-content-between align-items-center mb-2">
  <!-- Type + Prénom si global -->
  <div class="d-flex align-items-center">
    <strong class="me-2">{{ fb.Type }}</strong>
    <span class="badge bg-info text-dark" v-if="!selectedEleve">
      {{ fb.Prenom || 'Élève inconnu' }}
    </span>
  </div>

  <!-- Date + Delete -->
  <div class="d-flex align-items-center gap-2">
<small style="color: #ccc;">
  <i class="bi bi-clock me-1"></i>{{ formatDate(fb.Date_Publication) }}
</small>

    <button
      class="btn btn-sm p-0 text-danger border-0 bg-transparent"
      title="Supprimer le feedback"
      @click="confirmDeleteFeedback(fb)"
    >
      <i class="bi bi-trash-fill fs-5"></i>
    </button>
<button
  v-if="fb.Type === 'Prof'"
  class="btn btn-sm p-0 text-warning border-0 bg-transparent"
  @click="startEditFeedback(fb)"
>
  <i class="bi bi-pencil-square fs-5"></i>
</button>


<!-- ➕/➖ Toggle feedback -->
    <button
      class="btn btn-sm p-0 text-primary border-0 bg-transparent"
      title="Afficher ou réduire le contenu"
      @click="toggleFeedbackDetails(fb.ID)"
    >
      <i
        :class="openedFeedbacks.includes(fb.ID) ? 'bi bi-dash-square' : 'bi bi-plus-square'"
        class="fs-5"
      ></i>
    </button>

  </div>
</div>


<!-- 🚫 Masquer si édition en cours -->
<div
  class="formatted-content"
  v-if="!(isEditingFeedback && editingFeedbackId === fb.ID)"
>
  <template v-if="openedFeedbacks.includes(fb.ID)">
    <div v-html="fb.contenuformate || fb.Contenu"></div>
  </template>
  <template v-else>
    {{ getExcerpt(fb.contenuformate || fb.Contenu) }}...
  </template>
</div>

<!-- ✏️ Édition en cours -->
<div v-if="isEditingFeedback && editingFeedbackId === fb.ID" class="mt-3">
  <QuillEditor
    v-model:content="editingFeedbackContent"
    content-type="html"
    theme="snow"
  />
<button
  class="btn btn-outline-light btn-sm mt-2"
  @click="submitEditedFeedback"
  style="background: none; border: none; font-size: 0.85rem; padding: 4px 10px;"
>
  💾
</button>


</div>

<!-- 🔽 Réduire si feedback validé et ouvert -->
<span
  v-if="fb.Statut === 'Validé' && openedFeedbacks.includes(fb.ID)"
  class="text-info ms-2"
  style="cursor:pointer;"
  @click="toggleFeedbackDetails(fb.ID)"
>

</span>




<!-- 🧱 Ligne d'infos statuts + modif -->
<div class="d-flex justify-content-between align-items-center flex-wrap">
  <!-- 📛 Partie gauche : statuts -->
  <div class="d-flex align-items-center gap-2 flex-wrap">
    <span
      class="badge"
      :class="{
        'bg-success': fb.Statut === 'Validé',
        'bg-warning text-dark': fb.Statut === 'En attente',
        'bg-danger': fb.Statut?.toLowerCase() === 'non lu'
      }"
    >
      {{ fb.Statut }}
    </span>
  </div>

  <!-- 🛠️ Partie droite : dernière modif -->
<small
  v-if="fb?.Derniere_Modification && new Date(fb.Derniere_Modification).getTime() !== new Date(fb.Date_Publication).getTime()"
  class="text-light fst-italic"
  style="font-size: 0.85rem;"
>
  🛠️ modifié le {{ formatDate(fb.Derniere_Modification) }}
</small>


</div>



<!-- 🔁 Réponses -->
<div v-if="reponsesMap[fb.ID]?.length" class="mt-3">
 <div 
  v-for="rep in reponsesMap[fb.ID]" 
  :key="rep.ID"
  class="response-block"
  :class="rep.Type === 'Prof' ? 'prof' : 'eleve'"
>

  <div class="d-flex justify-content-between align-items-center">
    <div>
      <strong>{{ rep.Type }}</strong>
      <small class="ms-2">{{ formatDate(rep.Date_Publication) }}</small>
    </div>

    <!-- ✏️ Bouton modifier uniquement pour les réponses du prof -->
    <button
      v-if="rep.Type === 'Prof'"
      class="btn btn-sm p-0 text-warning border-0 bg-transparent"
      @click="startEditFeedback(rep, 'reply', fb.ID)"
      title="Modifier cette réponse"
    >
      <i class="bi bi-pencil-square fs-6"></i>
    </button>
    <button
  v-if="rep.Type === 'Prof'"
  class="btn btn-sm p-0 text-danger border-0 bg-transparent ms-2"
  @click="confirmDeleteReply(rep)"
  title="Supprimer cette réponse"
>
  <i class="bi bi-x-circle fs-5"></i>
</button>

  </div>

  <!-- 📝 Mode édition d’une réponse -->
<div v-if="isEditingFeedback && String(editingFeedbackId) === String(rep.ID)" class="mt-2">
    <QuillEditor
      v-model:content="editingFeedbackContent"
      content-type="html"
      theme="snow"
    />
    <button
      class="btn btn-outline-light btn-sm mt-2"
      @click="submitEditedFeedback"
    >
      💾 Enregistrer
    </button>
  </div>

  <!-- 📄 Affichage normal -->
  <div 
    v-else 
    class="formatted-content mt-2"
  v-html="rep.contenuformate || rep.Contenu"
  ></div>

</div>

</div>




<!-- ✍️ Zone de réponse (affichée uniquement si dépliée) -->
<div v-if="openedFeedbacks.includes(fb.ID)" class="mt-3">
  <QuillEditor
    v-model:content="replies[fb.ID]"
    content-type="html"
    theme="snow"
  />

  <button
    class="btn btn-sm btn-outline-success mt-2"
    @click="sendReply(fb)"
    :disabled="!replies[fb.ID] || replies[fb.ID] === '<p><br></p>' || sendingReply[fb.ID]"
  >
    {{ sendingReply[fb.ID] ? "Envoi..." : "Répondre" }}
  </button>
</div>


</div>



        </div>


</div>
<!-- 🔽 Afficher plus / Réduire -->
<div v-if="filteredFeedbacksByMonth.length > defaultFeedbackDisplayLimit" class="text-center mt-3">
  <!-- Afficher plus -->
  <button
    v-if="feedbackDisplayLimit < filteredFeedbacksByMonth.length"
    class="btn btn-outline-light btn-sm"
    @click="feedbackDisplayLimit += 5"
  >
    ➕ Afficher plus
  </button>

  <!-- Réduire -->
  <button
    v-else
    class="btn btn-outline-secondary btn-sm"
    @click="feedbackDisplayLimit = defaultFeedbackDisplayLimit"
  >
    ➖ Réduire
  </button>
</div>


      </div>
    </Layout>
  </template>
  
  <script>
import Layout from "@/views/Layout.vue";
import { getValidToken } from "@/utils/api.ts";
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import { useAuthStore } from "@/stores/authStore.js";

export default {
  name: "AdminFeedback",
  components: { Layout,    QuillEditor,
  },
  
  data() {
    return {
          auth: useAuthStore(), // ✅ AJOUT ICI

      eleves: [],
          elevesHorsInscrits: [], // ⬅️ Ajout ici

      showUnread: false,
      isLoadingFeedbacks: false,
feedbackDisplayLimit: 2,
defaultFeedbackDisplayLimit: 2,
isEditingFeedback: false,
editingFeedbackId: null,
editingFeedbackContent: "",

      showGlobalFeedbacks: true,
    readyToShowFeedbacks: false,
selectedMonth: 'ALL',
availableMonths: [],
nomCours: "",
    dateCours: "",
    datesCoursEleve: [],
      showGlobal: false,
      feedbacksAll: [], // historique complet
      showUnreadFeedbacks: false, // 🔁 toggle accordéon

      openedFeedbacks: [], // contient les ID des feedbacks "ouverts"
      selectedEleveEmail: "",

      filteredEleves: [],
      replies: {},
sendingReply: {},
reponsesMap: {}, // Regroupement des réponses par feedback ID
isLoadingEleves: false,

      selectedEleve: null,
      searchTerm: "",
      nouveauFeedback: "",
      feedbackSentMessage: "",
      feedbacks: [],
      apiURL: "https://script.google.com/macros/s/AKfycby42j_LaV8bh-0NzxW115MuRBNSrxMcZn2L5P1VZ4yG1qQBOrCENb_Ee6bLXKVcxWwEdg/exec"
    };
    
  },
    watch: {
    nouveauFeedback(newVal) {
      if (this.selectedEleve?.email) {
        localStorage.setItem(`feedback_draft_${this.selectedEleve.email}`, newVal);
      }
    }
  },
  computed: {
isFormReady() {
  // Si élève non inscrit, ne bloque pas sur la dateCours
  if (this.selectedEleve?.statut !== 'inscrit') {
    return !!this.selectedEleve;
  }
  return !!this.selectedEleve && !!this.dateCours;
}


,
limitedFeedbacks() {
  const limit = this.feedbackDisplayLimit;
  const all = this.filteredFeedbacksByMonth;

  return all.length > limit ? all.slice(0, limit) : all;
}

,
canSendFeedback() {
  return this.selectedEleve?.statut !== 'inscrit' || (!!this.selectedEleve && !!this.dateCours);
}
,
 filteredFeedbacksByMonth() {
  const feedbacks = this.selectedMonth === 'ALL'
    ? this.feedbacks
    : this.feedbacks.filter(fb => {
        const date = new Date(fb.Date_Publication);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return monthKey === this.selectedMonth;
      });

  // 🕒 Tri du plus récent au plus ancien
  return [...feedbacks].sort((a, b) => new Date(b.Date_Publication) - new Date(a.Date_Publication));
}


  },
  async mounted() {
    console.log("🔁 Chargement de la liste des élèves...");
    await this.fetchEleves();

  setTimeout(() => {
    this.readyToShowFeedbacks = true;
  }, 300);

  },
  methods: {
    getUnreadFeedbacks() {
  return this.feedbacksAll.filter(fb =>
    fb.Statut?.toLowerCase() === "non lu" &&
    !String(fb.ID_Cours).startsWith("ID") // ⚠️ on ignore les réponses
  );
}

,
confirmDeleteReply(rep) {
  if (confirm("Supprimer cette réponse ?")) {
    this.deleteReply(rep);
  }
}
,
async toggleHistorique() {
  this.showGlobalFeedbacks = !this.showGlobalFeedbacks;

  if (this.showGlobalFeedbacks && this.feedbacksAll.length === 0) {
    await this.fetchAllFeedbacks();

    this.readyToShowFeedbacks = true;
    if (this.selectedEleve) {
      this.filterFeedbacksForEleve(this.selectedEleve);
    }
  } else if (this.showGlobalFeedbacks && this.selectedEleve) {
    this.filterFeedbacksForEleve(this.selectedEleve);
  }
}


,
async deleteReply(rep) {
  const jwt = await getValidToken();

  const payload = {
    route: "deletefeedback",
    jwt,
    feedback_id: rep.ID // l’ID direct de la réponse
  };

  try {
    const res = await fetch(this.getProxyPostURL(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (!result.success) {
      console.warn("⚠️ Échec suppression :", result.message);
      return;
    }

    // Mise à jour locale
    await this.fetchFeedbacks();
    if (this.selectedEleve) {
      this.filterFeedbacksForEleve(this.selectedEleve);
    }

  } catch (err) {
    console.error("❌ Erreur deleteReply :", err);
  }
}
,
async updateFeedbackStatut(feedbackId, newStatut) {
  const jwt = await getValidToken();
  const cleanId = Number(
  String(this.editingFeedbackId).replace("ID", "")
);
  const payload = {
    route: "updatefeedback",
    jwt,
    feedback_id: String(feedbackId).replace("ID", ""),

    statut: newStatut
  };

  try {
    const res = await fetch(this.getProxyPostURL(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (!result.success) {
      console.warn("⚠️ Échec update statut :", result.message);
    }
  } catch (err) {
    console.error("❌ Erreur updateFeedbackStatut :", err);
  }
}
,
startEditFeedback(fb, type = "parent", parentId = null) {
  this.isEditingFeedback = true;
  this.editingFeedbackId = fb.ID;
  this.editingFeedbackType = type;     // "parent" ou "reply"
  this.editingFeedbackParentId = parentId; // utile pour recharger
  this.editingFeedbackContent = fb.contenuformate || fb.Contenu;

  if (!this.openedFeedbacks.includes(parentId || fb.ID)) {
    this.openedFeedbacks.push(parentId || fb.ID);
  }
}



,
async submitEditedFeedback() {
  const jwt = await getValidToken();

  const idClean = Number(String(this.editingFeedbackId).replace("ID", ""));

  const parentIdClean = this.editingFeedbackType === "reply"
    ? Number(String(this.editingFeedbackParentId).replace("ID", ""))
    : "";

  const payload = {
    route: "updatefeedback",
    jwt,
    feedback_id: idClean,
    id_cours: parentIdClean,
    contenu: this.editingFeedbackContent,
  };

  console.log("📤 Payload update :", payload);

  const res = await fetch(this.getProxyPostURL(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await res.json();
  console.log("📥 Retour update :", result);

  if (result.success) {
    this.isEditingFeedback = false;
    this.editingFeedbackId = null;
    this.editingFeedbackContent = "";
    await this.fetchFeedbacks();
    if (this.selectedEleve) this.filterFeedbacksForEleve(this.selectedEleve);
  }
}


,
toggleUnread() {
  this.showUnreadFeedbacks = !this.showUnreadFeedbacks;
  if (this.showUnreadFeedbacks && this.feedbacksAll.length === 0) {
    this.fetchAllFeedbacks();
  }
}
,

getExcerpt(html) {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  const text = temp.textContent || temp.innerText || "";
  return text.slice(0, 45);
}
,
formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-');
  return new Date(`${year}-${month}-01`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}
,
async handleEleveSelect() {
  if (this.selectedEleveEmail === "ALL") {
    this.selectedEleve = null;
    this.isLoadingFeedbacks = true;
    await this.fetchAllFeedbacks();
    this.isLoadingFeedbacks = false;
    this.readyToShowFeedbacks = true;
    this.feedbacks = this.feedbacksAll.reverse();
  } else {
    // 🛠️ CHANGEMENT ICI
    const eleve =
      this.eleves.find(e => e.email === this.selectedEleveEmail) ||
      this.elevesHorsInscrits.find(e => e.email === this.selectedEleveEmail);

    if (!eleve) return;

    this.selectedEleve = eleve;

    if (eleve.statut === "inscrit") {
      await this.fetchPlanningForEleve(eleve.email, eleve.prenom);
    } else {
      this.datesCoursEleve = []; // 💡 vide car pas de planning
    }

    this.searchTerm = `${eleve.prenom} ${eleve.nom}`;
    this.filteredEleves = [];
    this.nouveauFeedback = localStorage.getItem(`feedback_draft_${eleve.email}`) || "";

    this.isLoadingFeedbacks = true;

    if (!this.feedbacksAll.length) {
      await this.fetchAllFeedbacks();
    }

    this.filterFeedbacksForEleve(eleve);
    this.selectedMonth = "ALL";

    this.isLoadingFeedbacks = false;
    this.readyToShowFeedbacks = true;
  }
}




,
async fetchPlanningForEleve(emailVal, prenomVal) {
  const jwt = await getValidToken();
  const baseUrl = `${this.apiURL}?route=planning&email=${encodeURIComponent(emailVal)}&prenom=${encodeURIComponent(prenomVal)}&jwt=${encodeURIComponent(jwt)}`;
  const proxyUrl = `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(baseUrl)}`;

  try {
    const res = await fetch(proxyUrl);
    const data = await res.json();
    if (data.success && Array.isArray(data.planning)) {
      this.datesCoursEleve = data.planning
        .map(c => new Date(c.date))
        .filter(dt => !isNaN(dt))
        .sort((a, b) => b - a)
        .map(dt => dt.toISOString());
    } else {
      this.datesCoursEleve = [];
    }
  } catch (err) {
    console.error("❌ Erreur fetchPlanningForEleve :", err);
    this.datesCoursEleve = [];
  }
}

,
toggleFeedbackDetails(fbID) {
  if (this.openedFeedbacks.includes(fbID)) {
    this.openedFeedbacks = this.openedFeedbacks.filter(id => id !== fbID);
  } else {
    this.openedFeedbacks.push(fbID);
  }
}
,

async exportPDF() {
  const element = document.getElementById("pdf-content");

  if (!element) {
    console.error("❌ Élément PDF introuvable !");
    return;
  }

  // On rend visible temporairement
  element.style.visibility = "visible";
  element.style.position = "static";

  await this.$nextTick(); // S'assurer que tout est monté

  try {
    const html2pdf = (await import("html2pdf.js")).default;
    const opt = {
      margin:       0.5,
      filename:     `feedbacks_${this.selectedEleve.prenom}_${this.selectedEleve.nom}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    await html2pdf().set(opt).from(element).save();
  } catch (err) {
    console.error("❌ Erreur export PDF :", err);
  } finally {
    // On cache de nouveau
    element.style.visibility = "hidden";
    element.style.position = "absolute";
    element.style.left = "-9999px";
  }
}

,

async fetchEleves() {
  this.isLoadingEleves = true;

  const profId = this.auth.user?.prof_id;
  if (!profId) {
    console.warn("❌ prof_id manquant");
    this.isLoadingEleves = false;
    return;
  }

  const url = this.getProxyURL({ route: "geteleves" });

  try {
  console.log("👤 prof_id store :", this.auth.user?.prof_id);
console.log("🌐 URL geteleves :", url);

    const res = await fetch(url);
    const data = await res.json();
console.log("📥 geteleves RAW :", data);

const rows = Object.values(data).filter(
  e => typeof e === "object" && e.email
);

const profId = this.auth.user?.prof_id;
if (!profId) return;

// ✅ FILTRE PAR PROF
const elevesDuProf = rows.filter(e => e.prof_id === profId);

this.eleves = elevesDuProf
  .filter(e => e.statut === "inscrit")
  .sort((a, b) =>
    a.prenom.localeCompare(b.prenom, "fr", { sensitivity: "base" })
  );

this.elevesHorsInscrits = elevesDuProf
  .filter(e => e.statut !== "inscrit")
  .sort((a, b) =>
    a.prenom.localeCompare(b.prenom, "fr", { sensitivity: "base" })
  );


  } catch (err) {
    console.error("❌ Erreur geteleves :", err);
  } finally {
    this.isLoadingEleves = false;
  }
}



,
    resetEleveSelection() {
  this.selectedEleve = null;
  this.searchTerm = "";
  this.filteredEleves = [];
  this.organizeFeedbacks(this.feedbacksAll);
  console.log("🧪 contenuformate debug :", all.map(f => f.contenuformate));


}
,
confirmDeleteFeedback(fb) {
  if (confirm("Confirmer la suppression de ce feedback et ses réponses ?")) {
    this.deleteFeedback(fb);
  }
},

async deleteFeedback(fb) {
  const jwt = await getValidToken();
  const payload = {
  route: "deletefeedback",
  jwt,
feedback_id: String(fb.ID).replace("ID", "")
};

  const url = this.getProxyPostURL();

  console.log("🗑️ Tentative de suppression du feedback :", fb);
  console.log("📦 Payload envoyé :", payload);
  console.log("🌐 URL POST :", url);

  try {
    const res = await fetch(url, {
      method: "POST",
        headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    console.log("📥 Réponse du serveur :", result);

    if (result.success) {
      this.feedbacks = this.feedbacks.filter(f => f.ID !== fb.ID);
      delete this.reponsesMap[fb.ID];
    } else {
      alert("Erreur : " + (result.message || "Échec de suppression"));
    }
  } catch (err) {
    console.error("❌ Erreur lors de la suppression :", err);
    alert("Erreur de communication avec le serveur.");
  }
}

,
async fetchAllFeedbacks() {
  const jwt = await getValidToken();
  const url = this.getProxyURL({ route: "getfeedbacks", jwt });
  console.log("📡 URL pour historique global :", url);

  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("🧩 Feedbacks API (brut):", data);
    this.organizeFeedbacks(data.feedbacks || []);

    // ✅ Nouveau : filtrer immédiatement si un élève est sélectionné
    if (this.selectedEleve) {
      this.filterFeedbacksForEleve(this.selectedEleve);
    }

    console.log("📊 feedbacksAll complet :", this.feedbacksAll);
    console.log("🧪 Feedbacks non lus trouvés :", this.getUnreadFeedbacks());
    console.log("📥 Feedbacks initiaux :", this.feedbacks.length);
  } catch (err) {
    console.error("❌ Erreur fetchAllFeedbacks :", err);
  }
}

,
    filterEleves() {
      const term = this.searchTerm.toLowerCase();
      this.filteredEleves = this.eleves.filter(e =>
        `${e.prenom} ${e.nom} ${e.email}`.toLowerCase().includes(term)
      );
    },
async selectEleve(eleve) {
  console.log("👤 Élève sélectionné :", eleve);
  this.selectedEleve = eleve;
  this.searchTerm = `${eleve.prenom} ${eleve.nom}`;
  this.filteredEleves = [];

  const cached = localStorage.getItem(`feedback_draft_${eleve.email}`);
  this.nouveauFeedback = cached || "";

  // 🔁 Charger les feedbacks globaux s’ils ne sont pas encore en mémoire
await this.fetchAllFeedbacks();
this.filterFeedbacksForEleve(eleve);



  this.showGlobalFeedbacks = true;
  this.readyToShowFeedbacks = true;
}


,
    async fetchFeedbacks() {
      const jwt = await getValidToken();
      const url = this.getProxyURL({
        route: "getfeedbacks",
        jwt,
        id_eleve: this.selectedEleve.email
      });

      console.log("📡 URL utilisée pour getfeedbacks :", url);
      try {
        const res = await fetch(url);
        const data = await res.json();
        console.log("📥 Feedbacks reçus :", data);
        this.organizeFeedbacks(data.feedbacks || []);

      } catch (err) {
        console.error("❌ Erreur lors du fetch getfeedbacks :", err);
      }
    },
async sendFeedback() {
  const jwt = await getValidToken();
  const contenu = this.nouveauFeedback.trim();

const payload = {
  route: "addfeedback",
  jwt,
  id_cours: "", // 🔥 DOIT être vide = feedback principal
  id_eleve: this.selectedEleve.email,
  prenom: this.selectedEleve.prenom,
  contenu,
  type: "Prof",
  nom_cours: this.nomCours || "(non précisé)",
  date_cours: this.dateCours || new Date().toISOString()
};




  // ------------------------------------------------------
  // 🔥 1) AFFICHAGE INSTANTANÉ DU NOUVEAU FEEDBACK (optimiste)
  // ------------------------------------------------------
  const tempID = `TEMP-${Date.now()}`;

  const tempFeedback = {
    ID: tempID,
    ID_Eleve: this.selectedEleve.email,
    contenuformate: contenu,
    Contenu: contenu,
    Date_Publication: new Date().toISOString(),
    Type: "Prof",
    Statut: "En attente",
    Prenom: this.selectedEleve.prenom
  };

  // ➕ On l’ajoute immédiatement en haut de la liste :
  this.feedbacks.unshift(tempFeedback);
  this.selectedMonth = "ALL";


  // ------------------------------------------------------
  // 🧹 2) Nettoyage visuel de l’éditeur
  // ------------------------------------------------------
  this.feedbackSentMessage = "✅ Feedback envoyé !";
  this.nouveauFeedback = "";
  localStorage.removeItem(`feedback_draft_${this.selectedEleve.email}`);

  // ------------------------------------------------------
  // 📡 3) Envoi réel au serveur
  // ------------------------------------------------------
  try {
    
const fullURL = this.getProxyPostURL();
console.log("🌐 URL d’envoi POST :", fullURL);
console.log("📤 Envoi feedback au backend :", payload);
    const res = await fetch(this.getProxyPostURL(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    console.log("📥 Réponse addfeedback :", result);

    if (!result.success) throw new Error("Échec retour serveur");
} catch (err) {
  console.warn("⚠️ Erreur API :", err);

  if (err instanceof TypeError) {
    // 🌐 Probablement un timeout ou un souci de CORS
    this.feedbackSentMessage = "✅ Feedback probablement envoyé (réponse trop lente)";
  } else {
    this.feedbackSentMessage = "❌ Erreur : feedback non envoyé";
  }
}


  // ------------------------------------------------------
  // 🔄 4) Rechargement propre depuis le serveur
  //    (le feedback TEMP sera remplacé par le vrai)
  // ------------------------------------------------------
  this.isLoadingFeedbacks = true;
  await this.fetchFeedbacks();
  await new Promise(resolve => setTimeout(resolve, 800)); // ⏳ pause 800ms

  this.filterFeedbacksForEleve(this.selectedEleve);
  this.isLoadingFeedbacks = false;

  setTimeout(() => (this.feedbackSentMessage = ""), 3000);
}

,
    formatDate(dateStr) {
      const d = new Date(dateStr);
      return d.toLocaleString("fr-FR");
    },
    getProxyURL(params) {
      const base = `${this.apiURL}?` + new URLSearchParams(params).toString();
      return `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(base)}`;
    },
organizeFeedbacks(all) {
  console.log("📊 DONNÉES BRUTES ALL :", all);

  this.feedbacksAll = all;

  // Convertit ID et ID_Cours en numériques pour comparaison
  const normalizeId = (raw) => Number(String(raw).replace("ID", "")) || 0;

  // Ajout de colonnes normalisées
  all.forEach(fb => {
    fb.ID_num = normalizeId(fb.ID);
    fb.ID_Cours_num = normalizeId(fb.ID_Cours);
  });

  // Liste des IDs parents existants
  const parents = new Set(all.map(f => f.ID_num));

  // 1️⃣ Principaux = ID_Cours vide OU null OU 0
  //    mais PAS si ID_Cours_num correspond à un parent
  const principaux = all.filter(fb => {
    const noParentValue = !fb.ID_Cours || fb.ID_Cours === "" || fb.ID_Cours_num === 0;
    const isFakePrincipal = !noParentValue && parents.has(fb.ID_Cours_num);
    return noParentValue && !isFakePrincipal;
  });

  // 2️⃣ Réponses = ID_Cours renseigné ET ID_Cours_num existe comme parent
  const reponses = all.filter(fb =>
    fb.ID_Cours &&
    fb.ID_Cours !== "" &&
    fb.ID_Cours_num !== 0 &&
    parents.has(fb.ID_Cours_num)
  );

  // Tri des principaux par date
  this.feedbacks = principaux.sort((a, b) =>
    new Date(b.Date_Publication) - new Date(a.Date_Publication)
  );

  // Regroupement des réponses
  const map = {};
  for (const rep of reponses) {
    const parentId = rep.ID_Cours_num;
    if (!map[parentId]) map[parentId] = [];
    map[parentId].push(rep);
  }

  this.reponsesMap = map;

  console.log("🟩 Principaux :", principaux);
  console.log("🟦 Réponses :", map);
}



,
filterFeedbacksForEleve(eleve) {
  const idEleve = eleve.email;

  // Normalisation ID & ID_Cours
  const normalizeId = raw => Number(String(raw).replace("ID", "")) || 0;

  // Ajout des champs numériques
  this.feedbacksAll.forEach(fb => {
    fb.ID_num = normalizeId(fb.ID);
    fb.ID_Cours_num = normalizeId(fb.ID_Cours);
  });

  // Liste des IDs principaux existants
  const parents = new Set(this.feedbacksAll.map(f => f.ID_num));

  // 1️⃣ Feedbacks principaux filtrés pour cet élève
  const principaux = this.feedbacksAll.filter(fb => {
    const isForEleve = fb.ID_Eleve === idEleve;

    const noParentValue =
      !fb.ID_Cours || fb.ID_Cours === "" || fb.ID_Cours_num === 0;

    const isFakePrincipal =
      !noParentValue && parents.has(fb.ID_Cours_num);

    return isForEleve && noParentValue && !isFakePrincipal;
  });

  // 2️⃣ Réponses associées
  const reponses = this.feedbacksAll.filter(fb =>
    fb.ID_Cours &&
    fb.ID_Cours !== "" &&
    fb.ID_Cours_num !== 0 &&
    parents.has(fb.ID_Cours_num)
  );

  // Tri du plus récent au plus ancien
  this.feedbacks = principaux.sort(
    (a, b) => new Date(b.Date_Publication) - new Date(a.Date_Publication)
  );

  // 3️⃣ Regroupement des réponses
  const map = {};
  for (const rep of reponses) {
    const parentId = rep.ID_Cours_num;
    if (!map[parentId]) map[parentId] = [];
    map[parentId].push(rep);
  }

  this.reponsesMap = map;

  // Mise à jour des mois disponibles
  this.generateAvailableMonths();
}

,
generateAvailableMonths() {
  const monthsSet = new Set();
  for (const fb of this.feedbacks) {
    const d = new Date(fb.Date_Publication);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthsSet.add(key);
  }

  // Trie par date décroissante
  this.availableMonths = Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
}
,
async sendReply(fb) {
  const texte = this.replies[fb.ID]?.trim();
  if (!texte) return;

  this.sendingReply = { ...this.sendingReply, [fb.ID]: true };


  const jwt = await getValidToken();
  const payload = {
    route: "replytofeedback",
    jwt,
    feedback_id: fb.ID,
    contenu: texte,
    id_eleve: fb.ID_Eleve,
    prenom: fb.Prenom,
    type: "Prof"
  };

  const url = this.getProxyPostURL();
  console.log("📤 Réponse envoyée :", payload);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (result.success) {
      this.replies[fb.ID] = "";
        await this.updateFeedbackStatut(fb.ID, "Validé");

      await this.fetchFeedbacks();
    } else {
      console.warn("❌ Échec envoi :", result);
    }
  } catch (err) {
    console.error("❌ Erreur sendReply :", err);
  } finally {
    this.sendingReply = { ...this.sendingReply, [fb.ID]: false };

  }
}
,
    getProxyPostURL() {
      return `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(this.apiURL)}`;
    }
  }
};
</script>

  
  <style scoped>
.vignette-ronde {
  max-width: 500px;
  width: 100%;
  min-height: 500px; /* augmente si besoin */
  border-radius: 5%;
  background-color: #f5f6f7;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start; /* ou center si tout tient */
  align-items: center;
  text-align: center;
  animation: vignettePop 0.4s ease;
  transition: all 0.3s ease-in-out;
}


.card-style select.form-select,
.vignette-ronde select.form-select {
  padding: 4px 8px;
  font-size: 0.85rem;
}
.card-style select.form-select,
.vignette-ronde select.form-select,
.card-style input.form-control,
.vignette-ronde input.form-control {
  max-width: 260px;
  width: 100%;
}

.vignette-ronde .form-select,
.vignette-ronde .form-control {
  width: 100%;
  max-width: 260px; /* 🧠 Limite visuelle confortable */
  margin-left: auto;
  margin-right: auto;
}

/** animation colonnes 1 et 2  */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.4s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

@keyframes vignettePop {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

  .vignette-selection {
  max-width: 500px;
  width: 100%;
  border-radius: 20rem;
  background-color: #f5f6f7;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease-in-out;
  animation: vignettePop 0.4s ease;
}

@keyframes vignettePop {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

  .btn-sm.p-0.bg-transparent:hover {
  opacity: 0.85;
  transform: scale(1.1);
}

  .editor-wrapper {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.editor-wrapper .ql-container {
  flex-grow: 1;
}

  .card-style h6 {
  font-size: 1rem;
  font-weight: 600;
}

.card-style small {
  font-size: 0.85rem;
  color: #6c757d;
}

  .unread-topics .topic-line {
  transition: background-color 0.2s ease-in-out;
  border-left: 4px solid #ffc107;
  border-radius: 3px;
}
.unread-topics .topic-line:hover {
  background-color: #2d2d2d;
}
@media (max-width: 576px) {
  .unread-topics .topic-line {
    flex-direction: column;
    align-items: flex-start;
  }
  .unread-topics .topic-line button {
    margin-top: 0.5rem;
    width: 100%;
  }
}

.animated-list {
  animation: fadeInList 0.25s ease-in;
}

@keyframes fadeInList {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.list-group-item {
  background-color: #1e1e1e;
  color: #f1f1f1;
  border: none;
  transition: background-color 0.2s ease;
}

.list-group-item:hover {
  background-color: #2c2c2c;
}




  .formatted-content {
  white-space: pre-wrap;
  line-height: 1.6;
  font-size: 0.95rem;
  color: #e0e0e0;
}

.response-block {
  background-color: #1f1f1f;
  border-left: 4px solid #6c757d;
  padding: 10px 15px;
  margin-top: 10px;
  border-radius: 4px;
}

.response-block strong {
  color: #81c784; /* vert léger pour "Prof" ou autre */
}

.response-block small {
  color: #b0b0b0;
  font-size: 0.8rem;
}

  .formatted-content {
  white-space: pre-wrap;
  line-height: 1.5;
}

  .list-group-item {
    background-color: #222;
    color: #fff;
  }
  .list-group-item:hover {
    background-color: #333;
  }
  .response-block.prof {
  border-left-color: #4caf50; /* vert */
}

.response-block.eleve {
  border-left-color: #2196f3; /* bleu */
}

.response-block strong {
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
}
.input-group-text {
  border-radius: 0.375rem 0 0 0.375rem;
}

input.form-control {
  border-radius: 0 0.375rem 0.375rem 0;
}

.scroll-zone {
  max-height: 500px;
  overflow-y: auto;
}

.scroll-zone::-webkit-scrollbar {
  width: 8px;
}
.scroll-zone::-webkit-scrollbar-thumb {
  background-color: #888;
  border-radius: 4px;
}
.scroll-zone::-webkit-scrollbar-thumb:hover {
  background-color: #aaa;
}

.topic-line:hover {
  background-color: #2d2d2d;
}


@media (max-width: 576px) {
  .container {
    max-height: calc(100vh - 100px); /* Ajuste selon la taille de ton header/footer */
    overflow-y: auto;
    padding-bottom: 80px; /* Laisse de la marge pour les boutons en bas */
  }

  .editor-light .ql-container {
    min-height: 150px !important;
  }

  button.btn-success {
    width: 100%; /* Pleine largeur pour meilleure accessibilité */
    font-size: 1rem;
  }
}
.card-style {
  background-color: #f5f6f7;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 2rem; /* ✅ assure le même padding que vignette-ronde */
  transition: all 0.3s ease-in-out;
}


.card-style:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-style label {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.card-style select,
.card-style button {
  font-size: 0.95rem;
}

  </style>
  <style>
  /* Quill en light mode */
  .editor-light .ql-container {
    background-color: #ffffff;
    color: #000;
    border: 1px solid #ccc;
    border-radius: 6px;
  }
  
  .editor-light .ql-toolbar {
    background-color: #f8f9fa;
    border: 1px solid #ccc;
    border-bottom: none;
    border-radius: 6px 6px 0 0;
  }
  

  .pdf-feedback {
  page-break-after: always;
}
.pdf-feedback {
  padding: 25px;
  margin-bottom: 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: "Arial", sans-serif;
  background-color: #fdfdfd;
  page-break-after: always;
}

#pdf-content h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.pdf-feedback .meta {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 15px;
}

.pdf-feedback .content {
  font-size: 1rem;
  color: #222;
  line-height: 1.6;
}
/* Quill en light mode */
.editor-light .ql-container {
  background-color: #ffffff;
  color: #000;
  border: 1px solid #ccc;
  border-radius: 6px;
  min-height: 150px;
}


  </style>
  <style>
.ql-light .ql-container {
  background-color: #fff !important;
  color: #000 !important;
  border: 1px solid #ccc;
  border-radius: 6px;
  min-height: 150px;
}

.ql-light .ql-toolbar {
  background-color: #f8f9fa;
  border: 1px solid #ccc;
  border-bottom: none;
  border-radius: 6px 6px 0 0;
}

.ql-light .ql-editor {
  color: #000 !important;
  font-size: 1rem;
}
.editor-light .ql-container {
  background-color: #fff !important;
  color: #000 !important;
  border-radius: 6px;
}

.editor-light .ql-editor {
  color: #000 !important;
}
.loading-wrapper {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.dot-loader {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: red;
  animation: pulse 1s infinite ease-in-out;
  margin-bottom: 0.75rem;
}

.loading-text {
  font-style: italic;
  color: #ccc;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(0.9);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.3);
    opacity: 1;
  }
}

</style>

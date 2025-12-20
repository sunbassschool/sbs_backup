<template>
    <Layout>
      <div class="container mt-4">
        
  
        <!-- 🔄 Loading -->
        <div v-if="loading" class="text-center text-light">
          <div class="spinner-border custom-spinner"></div>
          <p>Chargement des élèves...</p>
        </div>
  
        <!-- ❌ Erreur -->
        <div v-if="error" class="alert alert-danger">{{ error }}</div>
  
        <!-- ✅ Élèves -->
        <div v-if="eleves.length && !loading" class="row g-3">
<div
  v-for="(eleve, index) in eleves"
  :key="eleve.email"
  class="col-12 col-md-6"
>

<div
  class="modern-card"
  :class="{
    'eleve-abandon': eleve.statut?.toLowerCase() === 'abandon',

    'eleve-inscrit': eleve.statut === 'inscrit'
  }"
>


    <div class="card-header">
      <h5 class="name">{{ eleve.prenom }} {{ eleve.nom }}</h5>
      
      <button class="toggle-btn" @click="toggleExpand(eleve.email)">
        {{ expanded[eleve.email] ? '–' : '+' }}
      </button>
    </div>

    <transition name="fade-slide">
      <div v-if="expanded[eleve.email]" class="card-details">
        <div v-for="champ in champs" :key="champ.key" class="field">
          <label>{{ champ.label }}</label>

     <div
  v-if="!editing[eleve.email + champ.key]"
  class="field-display d-flex justify-content-between align-items-center"
  @click="enableEdit(eleve.email, champ.key)"
>
  <span>{{ eleve[champ.key] || '—' }}</span>
  <span
    v-if="updated[eleve.email + '_' + champ.key]"
    class="text-success ms-2"
    style="font-size: 0.9rem;"
  >
    ✔️
  </span>
</div>


         <!-- Mode édition -->
 <div v-else>
  <!-- 🟩 STATUT -->
  <select
    v-if="champ.key === 'statut'"
    v-model="eleve.statut"
    @blur="updateEleve(eleve); disableEdit(eleve.email, champ.key)"
    @change="$event.target.blur()"
    class="form-select bg-dark text-light"
  >
    <option value="inscrit">inscrit</option>
    <option value="abandon">abandon</option>
  </select>

  <!-- 🟦 TRIMESTRE -->
  <select
    v-else-if="champ.key === 'trimestre'"
    v-model="eleve.trimestre"
    @blur="updateEleve(eleve); disableEdit(eleve.email, champ.key)"
    @change="$event.target.blur()"
    class="form-select bg-dark text-light"
  >
    <option value="trimestre 1">trimestre 1</option>
    <option value="trimestre 2">trimestre 2</option>
    <option value="trimestre 3">trimestre 3</option>
  </select>

  <!-- Autres champs -->
  <input
    v-else
    :type="champ.type"
    v-model="eleve[champ.key]"
    @blur="updateEleve(eleve); disableEdit(eleve.email, champ.key)"
    @keyup.enter="$event.target.blur()"
  />
</div>

</div>
      </div>
    </transition>
  </div>
</div>

        </div>
  
        <!-- ℹ️ Aucun élève -->
        <div v-if="!eleves.length && !loading" class="text-center text-light">
          Aucun élève trouvé.
        </div>
      </div>
    </Layout>
  </template>
  
  <script>
  import Layout from "@/views/Layout.vue";
  import { getValidToken } from "@/utils/api.ts";
  import { useAuthStore } from "@/stores/authStore.js";
import { useGestionElevesStore } from "@/stores/gestionElevesStore"

  export default {
    name: "GestionEleves",
    components: { Layout },
    data() {
      return {
            auth: useAuthStore(),   // ← nécessaire sinon this.auth = undefined
store: useGestionElevesStore(),

        editing: {},
         updated: {},
        expanded: {}
,
champs: [
  { key: "email", label: "Email", type: "text" },
  { key: "telephone", label: "Téléphone", type: "text" },
  { key: "statut", label: "Statut", type: "text" },
  { key: "objectif", label: "Objectif", type: "text" },
  { key: "trimestre", label: "Trimestre", type: "text" },
  { key: "cursus", label: "Cursus", type: "text" },
  { key: "drive", label: "Lien Google Drive", type: "text" },
  { key: "youtube", label: "Lien Playlist YouTube", type: "text" }
],
        eleves: [],
        loading: false,
        error: null,
        apiURL: "https://script.google.com/macros/s/AKfycbwWyqUjn5e_ZGHwTU14Xp-QD_Ljll4-XHjr-04lMjcuffqlzLXwn40rHMMYd9Zr-iyOTA/exec"
      };
    },
    async mounted() {
  const hasCache = this.loadFromStore()
  this.loading = !hasCache

  this.fetchEleves().finally(() => {
    this.loading = false
  })
}
,
    methods: {
    async fetchEleves() {
  this.error = null;

  const jwt = await getValidToken();
  if (!jwt) {
    this.error = "JWT non valide.";
    this.loading = false;
    return;
  }

  const profId = this.auth.user?.prof_id;
  if (!profId) {
    this.error = "prof_id manquant.";
    this.loading = false;
    return;
  }

  const base = this.apiURL + `?route=getelevesbyprof&jwt=${jwt}&prof_id=${profId}`;

  const url = `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(base)}`;

 try {
  const res = await fetch(url)
  const result = await res.json()
  console.log("📦 Résultat brut getelevesbyprof :", result)

  if (result?.success && Array.isArray(result.eleves)) {
    this.eleves = result.eleves.sort((a, b) => {
      if (a.statut === b.statut) return 0
      return a.statut === "inscrit" ? -1 : 1
    })

    this.saveToStore()
  } else {
    this.error = result.message || "Format inattendu reçu depuis le serveur."
  }

} catch (err) {
  console.error("❌ Erreur fetchEleves :", err)
  this.error = "Erreur de connexion au serveur."
}
finally {
    this.loading = false;
  }
}
,

loadFromStore() {
  const TTL = 2 * 60 * 1000
  if (!this.store.eleves) return false
  if (Date.now() - this.store.ts > TTL) return false

  this.eleves = this.store.eleves
  return true
},
saveToStore() {
  this.store.eleves = this.eleves
  this.store.ts = Date.now()
},


      toggleExpand(email) {
        this.expanded = { ...this.expanded, [email]: !this.expanded[email] };

}
,
      getProxyPostURL(route) {
  return `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(route)}`;
}
,
enableEdit(email, key) {
    this.editing = { ...this.editing, [email + key]: true };

},
disableEdit(email, key) {
    this.editing = { ...this.editing, [email + key]: false };

}
,
async updateEleve(eleve) {
  const jwt = await getValidToken();
  if (!jwt) {
    alert("JWT invalide ou expiré.");
    return;
  }

  const url = this.getProxyPostURL(this.apiURL);
 const payload = {
  route: "updateelevecomplet",
  jwt,
  prof_id: this.auth.user.prof_id,   // ← obligatoire multi-prof
  email: eleve.email,
  nom: eleve.nom,
  prenom: eleve.prenom,
  telephone: eleve.telephone,
  statut: eleve.statut,
  objectif: eleve.objectif,
  trimestre: eleve.trimestre,
  cursus: eleve.cursus,
  drive: eleve.drive,
  youtube: eleve.youtube
};


  console.log("📤 Payload envoyé à updateelevecomplet :", payload);
  console.log("🌐 URL POST :", url);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    console.log("📥 Réponse reçue :", result);

   if (result.success) {
  // Marque le champ comme mis à jour
  for (const key of Object.keys(eleve)) {
    if (this.editing[eleve.email + key]) {
      this.updated[eleve.email + "_" + key] = true;
      setTimeout(() => {
        this.$delete(this.updated, eleve.email + "_" + key);
      }, 1500);
    }
  }
}
else {
      console.warn("❌ Erreur de mise à jour :", result.message || "Aucun message retourné");
      alert("Erreur : " + (result.message || "Aucun message retourné"));
    }
  } catch (err) {
    console.error("❌ Erreur API updateEleve :", err);
    alert("Erreur de communication avec le serveur.");
  }
}


    }
  };
  </script>
  
  <style scoped>
  .card {
    transition: transform 0.2s ease;
  }
  .card:hover {
    transform: scale(1.01);
  }

.editable-field {
  padding: 4px 6px;
  background: #1e1e1e;
  border-radius: 4px;
  cursor: pointer;
  color: #ccc;
}
.editable-field:hover {
  background: #2a2a2a;
}

.modern-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 0px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  color: #eaeaea;
  backdrop-filter: blur(6px);
  transition: transform 0.2s ease;
}

.modern-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.name {
  font-size: 1.2rem;
  font-weight: 500;
  color: #ffffff;
  margin: 0;
}

.toggle-btn {
  background: none;
  border: 1px solid #666;
  color: #ccc;
  font-size: 1rem;
  border-radius: 6px;
  width: 26px;
  height: 26px;
  line-height: 1;
    padding: 0;

  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background-color: rgba(255, 255, 255, 0.945);
   color: #ff0000;
  cursor: pointer;
}

.card-details {
  margin-top: 1rem;
}

.field {
  margin-bottom: 10px;
}

.field label {
  font-size: 0.75rem;
  color: #aaa;
  display: block;
  margin-bottom: 3px;
}

.field-display {
  background-color: #1e1e1e;
  border-radius: 6px;
  padding: 6px 8px;
  color: #ccc;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.field-display:hover {
  background-color: #2a2a2a;
}

input {
  background-color: #ffffff;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 6px 8px;
  color: #eee;
  width: 100%;
  outline: none;
  transition: border 0.2s ease;
}

input:focus {
  border-color: #64b5f6;
}

/* Transition for expand/collapse */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
/* Minimalist style when card is collapsed */
.modern-card.minimal {
  padding: 5px 5px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: none;
  background-color: rgba(255, 255, 255, 0.015);
  transition: all 0.3s ease;
}


.modern-card.minimal:hover {
  background-color: rgba(255, 255, 255, 0.035);
  transform: none;
}

.modern-card .name {
  font-size: 1.05rem;
  font-weight: 500;
  margin: 0;
}
.eleve-abandon {
  opacity: 0.6;
  background: rgba(255, 0, 0, 0.05);
  border: 1px solid #ff4d4d;
}

.eleve-abandon:hover {
  background: rgba(255, 0, 0, 0.1);
  transform: none;
}
.eleve-inscrit {
  background: rgba(0, 255, 0, 0.04);
  border: 1px solid #00aa00;
}

.eleve-inscrit:hover {
  background: rgba(0, 255, 0, 0.06);
}
input,
select {
  background-color: #ffffff !important;
  color: #000000 !important;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 6px 8px;
  width: 100%;
}

input:focus,
select:focus {
  border-color: #64b5f6;
  outline: none;
}

  </style>
  
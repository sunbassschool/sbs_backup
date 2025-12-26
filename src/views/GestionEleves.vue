<template>
    <Layout>
      <div class="container mt-4">
        
  
        <!-- 🔄 Loading -->
       <div v-if="loading" class="sbs-loading">
  <div class="sbs-spinner"></div>
  <span class="sbs-loading-text">Chargement des élèves…</span>
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
        apiURL: "https://script.google.com/macros/s/AKfycbypPWCq2Q9Ro4YXaNnSSLgDrk6Jc2ayN7HdFDxvq4KuS2yxizow42ADiHrWEy0Eh1av9w/exec"
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

  console.group("👥 FETCH ÉLÈVES");

  try {
    // ===================================================
    // 🔐 JWT
    // ===================================================
    const jwt = await getValidToken();
    console.log("🔐 jwt présent =", !!jwt);

    if (!jwt) {
      throw new Error("JWT non valide");
    }

    // ===================================================
    // 👤 PROF ID
    // ===================================================
    const profId = this.auth?.user?.prof_id;
    console.log("👤 prof_id =", profId);

    if (!profId) {
      throw new Error("prof_id manquant");
    }

    // ===================================================
    // 🌐 URL PROXY (POST)
    // ===================================================
    const url =
      `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(this.apiURL)}`;

    console.log("🌐 POST URL =", url);

    // ===================================================
    // 📦 PAYLOAD
    // ===================================================
    const payload = {
      route: "getelevesbyprof",
      jwt,
      prof_id: profId
    };

    console.log("📤 PAYLOAD =", payload);

    // ===================================================
    // 🚀 FETCH
    // ===================================================
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log("📶 HTTP status =", res.status);

    const raw = await res.text();
    console.log("📥 RAW RESPONSE =", raw);

    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      throw new Error("JSON invalide renvoyé par le serveur");
    }

    console.log("📦 PARSED =", result);

    // ===================================================
    // ✅ TRAITEMENT
    // ===================================================
    if (result?.success && Array.isArray(result.eleves)) {
      console.log("✅ élèves reçus =", result.eleves.length);

      this.eleves = result.eleves.sort((a, b) => {
        if (a.statut === b.statut) return 0;
        return a.statut === "inscrit" ? -1 : 1;
      });

      this.saveToStore();
    } else {
      throw new Error(result?.message || "Format inattendu");
    }

  } catch (err) {
    console.error("❌ FETCH ÉLÈVES ERROR =", err);
    this.error = err.message || "Erreur de connexion au serveur";
  } finally {
    this.loading = false;
    console.groupEnd();
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
 /* ===================================================
   🎛️ GLOBAL TUNING (compact SBS)
   =================================================== */

.card {
  transition: transform 0.15s ease;
}

.card:hover {
  transform: scale(1.005);
}

/* ===================================================
   🧱 CARD ÉLÈVE (COMPACT)
   =================================================== */

.modern-card {
  background: rgba(255, 255, 255, 0.025);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 6px;
  box-shadow: none;
  color: #e6e6e6;
  backdrop-filter: none;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: background-color 0.15s ease;
}

.modern-card:hover {
  background: rgba(255, 255, 255, 0.045);
  transform: none;
}

/* ===================================================
   🧠 HEADER
   =================================================== */

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.name {
  font-size: 0.95rem;
  font-weight: 500;
  color: #ffffff;
  margin: 0;
  line-height: 1.2;
}

/* ===================================================
   🔘 TOGGLE
   =================================================== */

.toggle-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #bbb;
  font-size: 0.85rem;
  border-radius: 6px;
  width: 22px;
  height: 22px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  cursor: pointer;
}

/* ===================================================
   📦 CONTENU DÉPLIÉ
   =================================================== */

.card-details {
  margin-top: 6px;
}

/* ===================================================
   🏷️ FIELDS
   =================================================== */

.field {
  margin-bottom: 4px;
}


.field label {
  font-size: 0.6rem;
  color: #8f8f8f;
  margin-bottom: 1px;
  letter-spacing: 0.03em;
}


.field-display,
.editable-field {
  padding: 2px 4px;      /* ⬅️ ULTRA COMPACT */
  font-size: 0.75rem;
  border-radius: 3px;
  line-height: 1.2;
}


.field-display:hover,
.editable-field:hover {
  background-color: #2a2a2a;
}

/* ===================================================
   ✏️ INPUTS (compact & SBS)
   =================================================== */

input,
select {
  padding: 2px 4px;
  font-size: 0.75rem;
  border-radius: 3px;
}


input:focus,
select:focus {
  border-color: #ff9800; /* accent SBS */
  outline: none;
}

/* ===================================================
   🧩 ÉTATS ÉLÈVES
   =================================================== */

.eleve-abandon {
  opacity: 0.65;
  background: rgba(255, 0, 0, 0.04);
  border: 1px solid rgba(255, 77, 77, 0.4);
}

.eleve-inscrit {
  background: rgba(0, 255, 0, 0.035);
  border: 1px solid rgba(0, 170, 0, 0.5);
}

/* ===================================================
   🔽 MODE MINIMAL (liste dense)
   =================================================== */

.modern-card.minimal {
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.015);
  border-radius: 8px;
  box-shadow: none;
}

.modern-card.minimal:hover {
  background: rgba(255, 255, 255, 0.03);
}

/* ===================================================
   🎞️ TRANSITIONS
   =================================================== */

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
.card-details {
  margin-top: 4px;
}
.modern-card {
  padding: 8px 10px;
}
.modern-card.minimal {
  padding: 4px 6px;
}

/* ===============================
   🔄 SBS LOADING
   =============================== */

.sbs-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 0;
  color: #b5b5b5;
  font-size: 0.8rem;
}

/* Spinner circulaire */
.sbs-spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-top-color: #fb923c; /* 🔥 accent SBS */
  animation: sbs-spin 0.7s linear infinite;
}

/* Animation */
@keyframes sbs-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Texte */
.sbs-loading-text {
  line-height: 1;
  color:#fb923c
}

  </style>
  
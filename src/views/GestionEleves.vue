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
      <!-- ========================= -->
<!-- 👥 LISTE LIGHT DES ÉLÈVES -->
<!-- ========================= -->
<div
  v-if="eleves.length && !loading && !selectedEleve"
  class="eleves-grid"
>
  <div
    v-for="eleve in eleves"
    :key="eleve.email"
    class="modern-card eleve-row"
    @click="selectEleve(eleve)"
  >
<div class="eleve-row">
  <div class="eleve-line">
    <strong class="eleve-name">
      {{ eleve.prenom }} {{ eleve.nom }}
    </strong>

    <span
      class="eleve-badge"
      :class="eleve.statut === 'inscrit' ? 'ok' : 'ko'"
    >
      {{ eleve.statut }}
    </span>
  </div>
</div>

  </div>
</div>


<!-- ========================= -->
<!-- 👤 DÉTAIL ÉLÈVE (LAZY) -->
<!-- ========================= -->
<div v-if="selectedEleve && !loading" class="modern-card">
  <div class="card-header d-flex justify-content-between align-items-center">
    <h5 class="mb-0">
      {{ selectedEleve.prenom }} {{ selectedEleve.nom }}
    </h5>

    <button
      class="btn btn-sm btn-outline-light"
      @click="selectedEleve = null"
    >
      ← Retour
    </button>
  </div>

  <div class="card-details">
    <div
      v-for="champ in champs"
      :key="champ.key"
      class="field"
    >
      <label>{{ champ.label }}</label>

      <!-- SELECTS -->
      <select
        v-if="champ.key === 'statut'"
        v-model="selectedEleve.statut"
        class="form-select bg-dark text-light"
        @blur="updateEleve(selectedEleve)"
      >
        <option value="inscrit">inscrit</option>
        <option value="abandon">abandon</option>
      </select>

      <select
        v-else-if="champ.key === 'trimestre'"
        v-model="selectedEleve.trimestre"
        class="form-select bg-dark text-light"
        @blur="updateEleve(selectedEleve)"
      >
        <option value="trimestre 1">trimestre 1</option>
        <option value="trimestre 2">trimestre 2</option>
        <option value="trimestre 3">trimestre 3</option>
      </select>

      <!-- INPUTS -->
      <input
        v-else
        :type="champ.type"
        v-model="selectedEleve[champ.key]"
        @blur="updateEleve(selectedEleve)"
      />
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
import { getProxyPostURL } from "@/config/gas";

  export default {
    name: "GestionEleves",
    components: { Layout },
    data() {
      return {
            auth: useAuthStore(),   // ← nécessaire sinon this.auth = undefined
store: useGestionElevesStore(),
selectedEleve: null,

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
],
        eleves: [],
        loading: false,
        error: null,
      };
    },
mounted() {
  const hasCache = this.loadFromStore()

  // UI instantanée si cache
  this.loading = !hasCache

  // fetch silencieux
  this.fetchEleves({ silent: hasCache })
}

,
    methods: {
sortEleves(list) {
  return [...list].sort((a, b) => {
    if (a.statut === b.statut) return 0
    return a.statut === "inscrit" ? -1 : 1
  })
}
,
    selectEleve(eleve) {
  // clone → pas de rerender de toute la liste
  this.selectedEleve = JSON.parse(JSON.stringify(eleve))
}
,
async fetchEleves({ silent = false } = {}) {
  if (!silent) this.loading = true
  this.error = null

  console.group("👥 FETCH ÉLÈVES")

  try {
    // ===================================================
    // 🔐 JWT
    // ===================================================
    const jwt = await getValidToken()
    if (!jwt) throw new Error("JWT non valide")

    // ===================================================
    // 👤 PROF ID
    // ===================================================
    const profId = this.auth?.user?.prof_id
    if (!profId) throw new Error("prof_id manquant")

    // ===================================================
    // 🌐 URL PROXY
    // ===================================================

const url = getProxyPostURL()

    // ===================================================
    // 📦 PAYLOAD
    // ===================================================
    const payload = {
      route: "getelevesbyprof",
      jwt,
      prof_id: profId
    }

    // ===================================================
    // 🚀 FETCH
    // ===================================================
  const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
})

    if (!res.ok) throw new Error("Erreur réseau")

    const result = await res.json()
    if (!result?.success || !Array.isArray(result.eleves)) {
      throw new Error(result?.message || "Format invalide")
    }

    // ===================================================
    // 🔄 DIFF (SWR)
    // ===================================================
const incoming = this.sortEleves(result.eleves)
    const current = this.eleves || []

    const same =
      incoming.length === current.length &&
      incoming.every((e, i) =>
        e.email === current[i]?.email &&
        JSON.stringify(e) === JSON.stringify(current[i])
      )

    if (!same) {
      this.eleves = incoming
      this.saveToStore()
    }

  } catch (err) {
    console.error("❌ FETCH ÉLÈVES ERROR =", err)
    if (!silent) {
      this.error = err.message || "Erreur serveur"
    }
  } finally {
    if (!silent) this.loading = false
    console.groupEnd()
  }
}



,

loadFromStore() {
  const TTL = 5 * 60 * 1000
  const profId = this.auth?.user?.prof_id
  if (!profId) return false

  // 🔒 SAFE GUARD
  if (!this.store.elevesByProf || !this.store.tsByProf) {
    return false
  }

  const cached = this.store.elevesByProf[profId]
  const ts = this.store.tsByProf[profId]

  if (!cached || !ts) return false
  if (Date.now() - ts > TTL) return false

  this.eleves = cached
  return true
}

,
saveToStore() {
  const profId = this.auth?.user?.prof_id
  if (!profId) return

  // 🔒 init si absent
  if (!this.store.elevesByProf) this.store.elevesByProf = {}
  if (!this.store.tsByProf) this.store.tsByProf = {}

this.store.elevesByProf[profId] = this.sortEleves(this.eleves)
  this.store.tsByProf[profId] = Date.now()
}

,


      toggleExpand(email) {
        this.expanded = { ...this.expanded, [email]: !this.expanded[email] };

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

const url = getProxyPostURL();
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
  const profId = this.auth?.user?.prof_id
  if (!profId) return

  // 🔹 update liste locale
  const i = this.eleves.findIndex(e => e.email === eleve.email)
  if (i !== -1) {
    this.eleves[i] = { ...eleve }
  }

  // 🔹 update cache Pinia
  if (this.store.elevesByProf?.[profId]) {
    this.store.elevesByProf[profId][i] = { ...eleve }
    this.store.tsByProf[profId] = Date.now()
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
  font-size: 1.05rem;
  font-weight: 600;
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
  font-size: 0.8rem;
  color: #8f8f8f;
  margin-bottom: 1px;
  letter-spacing: 0.03em;
}


.field-display,
.editable-field {
  padding: 2px 4px;      /* ⬅️ ULTRA COMPACT */
  font-size: 0.9rem;
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
.eleve-row {
  cursor: pointer;
  transition: background 0.15s ease;
}
.eleve-row:hover {
  background: rgba(255,255,255,0.05);
}
.eleves-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

@media (max-width: 768px) {
  .eleves-grid {
    grid-template-columns: 1fr;
  }
}

.eleve-badge {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.eleve-badge.ok {
  background: #198754; /* vert */
  color: #fff;
}

.eleve-badge.ko {
  background: #6c757d; /* gris */
  color: #fff;
}
.eleve-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.eleve-name {
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.eleve-detail {
  max-width: 640px;   /* 👈 largeur utile */
  margin: 0 auto;
}

@media (min-width: 769px) {
  .eleve-detail {
    position: fixed;
    right: 0;
    top: 0;
    height: 100vh;
    width: 420px;
    margin: 0;
    border-radius: 0;
  }
}


  </style>
  
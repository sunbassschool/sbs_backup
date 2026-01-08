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
:key="eleve.user_id"
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
  return [...list]
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

  if (!eleve?.user_id) {
    alert("Identifiant élève manquant.");
    return;
  }

  const url = getProxyPostURL();

  const payload = {
    route: "updateelevecomplet",
    jwt,
    prof_id: this.auth.user.prof_id,

    // ✅ clé primaire
    eleve_id: eleve.user_id,

    // champs éditables
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

  console.log("📤 Payload updateEleveComplet :", payload);
  console.log("🌐 URL POST :", url);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    console.log("📥 Réponse API :", result);

    if (!result.success) {
      console.warn("❌ Erreur update élève :", result.message);
      alert(result.message || "Erreur lors de la mise à jour.");
      return;
    }

    const profId = this.auth?.user?.prof_id;
    if (!profId) return;

    // 🔹 update liste locale (UUID)
    const i = this.eleves.findIndex(e => e.user_id === eleve.user_id);
    if (i !== -1) {
      this.eleves[i] = { ...eleve };
    }

    // 🔹 update cache Pinia
    if (this.store.elevesByProf?.[profId] && i !== -1) {
      this.store.elevesByProf[profId][i] = { ...eleve };
      this.store.tsByProf[profId] = Date.now();
    }

  } catch (err) {
    console.error("❌ Erreur API updateEleve :", err);
    alert("Erreur de communication avec le serveur.");
  }
}



    }
  };
  </script>

<style>
/* ===================================================
   🎨 SBS ITUNES DARK PRO — DESIGN TOKENS
   =================================================== */

:root {
  --bg-main: #0b0d10;
  --bg-card: rgba(255,255,255,0.03);
  --bg-hover: rgba(255,255,255,0.055);
  --bg-panel: rgba(255,255,255,0.045);

  --border-soft: rgba(255,255,255,0.08);
  --border-focus: rgba(251,146,60,0.8);

  --text-main: #e8e8e8;
  --text-muted: #9aa0a6;
  --text-soft: #7a7f86;

  --accent: #fb923c;
  --accent-soft: rgba(251,146,60,0.15);

  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 10px;
}

/* ===================================================
   🧱 LISTE ÉLÈVES — GRID DENSE
   =================================================== */

.eleves-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

@media (max-width: 768px) {
  .eleves-grid {
    grid-template-columns: 1fr;
  }
}

/* ===================================================
   🧾 CARD ÉLÈVE (LISTE)
   =================================================== */

.modern-card.eleve-row {
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  padding: 6px 8px;
  color: var(--text-main);
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease;
}

.modern-card.eleve-row:hover {
  background: var(--bg-hover);
  border-color: rgba(255,255,255,0.18);
}

/* ===================================================
   🧠 LIGNE ÉLÈVE
   =================================================== */

.eleve-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.eleve-name {
  font-size: 0.88rem;
  font-weight: 500;
  letter-spacing: 0.2px;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===================================================
   🏷️ BADGE STATUT (FIN & PREMIUM)
   =================================================== */

.eleve-badge {
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.eleve-badge.ok {
  background: rgba(40, 167, 69, 0.18);
  color: #9be7b3;
  border: 1px solid rgba(40,167,69,0.45);
}

.eleve-badge.ko {
  background: rgba(108,117,125,0.25);
  color: #cfd3d7;
  border: 1px solid rgba(108,117,125,0.4);
}

/* ===================================================
   👤 PANNEAU DÉTAIL ÉLÈVE
   =================================================== */

.eleve-detail,
.modern-card:not(.eleve-row) {
  background: var(--bg-panel);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  max-width: 640px;
  margin: 0 auto;
}

@media (min-width: 769px) {
  .eleve-detail,
  .modern-card:not(.eleve-row) {
    position: fixed;
    right: 0;
    top: 0;
    height: 100vh;
    width: 420px;
    margin: 0;
    border-radius: 0;
  }
}

/* ===================================================
   🧠 HEADER DÉTAIL
   =================================================== */

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-soft);
}

.card-header h5 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-main);
}

/* ===================================================
   🧾 FIELDS (ULTRA DENSE & CLEAN)
   =================================================== */

.card-details {
  margin-top: 10px;
}

.field {
  margin-bottom: 6px;
}

.field label {
  display: block;
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-soft);
  margin-bottom: 2px;
}

/* ===================================================
   ✏️ INPUTS / SELECTS — iTunes-like
   =================================================== */

input,
select {
  width: 100%;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-xs);
  padding: 4px 6px;
  font-size: 0.78rem;
  color: var(--text-main);
  transition: border-color 0.12s ease, background 0.12s ease;
}

input:hover,
select:hover {
  background: rgba(255,255,255,0.07);
}

input:focus,
select:focus {
  outline: none;
  border-color: var(--border-focus);
  background: rgba(251,146,60,0.08);
}

/* ===================================================
   🔄 LOADING — PREMIUM MINIMAL
   =================================================== */

.sbs-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 0;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.sbs-spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.15);
  border-top-color: var(--accent);
  animation: sbs-spin 0.7s linear infinite;
}

@keyframes sbs-spin {
  to { transform: rotate(360deg); }
}

.sbs-loading-text {
  color: var(--accent);
}

/* ===================================================
   🎞️ TRANSITIONS — SUBTILES
   =================================================== */

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-3px);
}

/* ===================================================
   🪟 MODALE DÉTAIL ÉLÈVE — CENTRÉE DESKTOP
   =================================================== */

@media (min-width: 769px) {
  .modern-card:not(.eleve-row) {
    position: fixed;
    top: 50%;
    left: 50%;
    right: auto;
    transform: translate(-50%, -50%);

    width: 440px;
    max-width: calc(100vw - 32px);
    max-height: calc(100vh - 96px); /* header safe */

    height: auto;
    overflow-y: auto;

    border-radius: 12px;
  }
}

</style>

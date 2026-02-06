<template>
    <Layout>
      <div class="container mt-4">


        <!-- 🔄 Loading -->
<SBSLoading
  v-if="loading"
  label="Chargement des élèves..."
/>


        <!-- ❌ Erreur -->
        <div v-if="error" class="alert alert-danger">{{ error }}</div>

        <!-- ✅ Élèves -->
      <!-- ========================= -->
<!-- 👥 LISTE LIGHT DES ÉLÈVES -->
<!-- ========================= -->
<!-- ========================= -->
<!-- 🎯 ONGLETS FILTRES -->
<!-- ========================= -->
<div v-if="!loading && !selectedEleve" class="mb-3">
  <div class="btn-group w-100" role="group">
    <button
      type="button"
      class="btn"
      :class="filtreStatut === 'tous' ? 'btn-primary' : 'btn-outline-light'"
      @click="filtreStatut = 'tous'"
    >
      Tous ({{ eleves.length }})
    </button>
    <button
      type="button"
      class="btn"
      :class="filtreStatut === 'inscrits' ? 'btn-success' : 'btn-outline-light'"
      @click="filtreStatut = 'inscrits'"
    >
      Inscrits ({{ elevesInscrits.length }})
    </button>
    <button
      type="button"
      class="btn"
      :class="filtreStatut === 'abandons' ? 'btn-danger' : 'btn-outline-light'"
      @click="filtreStatut = 'abandons'"
    >
      Abandons ({{ elevesAbandons.length }})
    </button>
  </div>
</div>

<!-- ========================= -->
<!-- 👥 LISTE LIGHT DES ÉLÈVES -->
<!-- ========================= -->
<div
  v-if="elevesFiltres.length && !loading && !selectedEleve"
  class="eleves-grid"
>


  <div
    v-for="eleve in elevesFiltres"
    :key="eleve.user_id"
    class="modern-card eleve-row"
    @click="selectEleve(eleve)"
  >

<!-- avatar -->
 <div class="eleve-content">
      <!-- 🖼️ AVATAR -->
      <div class="eleve-avatar">
        <img
          v-if="eleve.avatar_url"
          :src="eleve.avatar_url"
          :alt="`${eleve.prenom} ${eleve.nom}`"
          @error="handleImageError"
        />
        <div v-else class="avatar-fallback">
          {{ getInitiales(eleve) }}
        </div>
      </div>

<!-- infos -->
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
  </div></div>
</div>


<!-- ========================= -->
<!-- 👤 DÉTAIL ÉLÈVE (LAZY) -->
<!-- ========================= -->
<div v-if="selectedEleve && !loading" class="modern-card">

<div class="overlay" @click.self="closeEleve">
  <div class="eleve-modal">

    <!-- HEADER -->
    <div class="modal-header">
      <button class="btn-back" @click="closeEleve">←</button>
      <h5>{{ selectedEleve.prenom }} {{ selectedEleve.nom }}</h5>
    </div>

    <!-- CONTENT -->
    <div class="modal-body">
      <div
        v-for="champ in champs"
        :key="champ.key"
        class="field"
      >
        <label>{{ champ.label }}</label>

        <select
          v-if="champ.key === 'statut'"
          v-model="selectedEleve.statut"
            class="select-field"

          @change="updateEleve(selectedEleve)"
        >
          <option value="inscrit">inscrit</option>
          <option value="abandon">abandon</option>
        </select>

        <select
          v-else-if="champ.key === 'trimestre'"
          v-model="selectedEleve.trimestre"
            class="select-field"

          @change="updateEleve(selectedEleve)"
        >
          <option value="trimestre 1">trimestre 1</option>
          <option value="trimestre 2">trimestre 2</option>
          <option value="trimestre 3">trimestre 3</option>
        </select>

        <input
          v-else
          :type="champ.type"
          v-model="selectedEleve[champ.key]"
          @blur="updateEleve(selectedEleve)"
        />
      </div>
    </div>

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
import SBSLoading from "@/components/SBSLoading.vue";

  export default {
    name: "GestionEleves",
    components: { Layout, SBSLoading },
    data() {
      return {
            auth: useAuthStore(),   // ← nécessaire sinon this.auth = undefined
store: useGestionElevesStore(),
selectedEleve: null,
filtreStatut: "tous", // ← AJOUTE CETTE LIGNE
originalEleve: null,

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
  window.addEventListener("keydown", this.onKeyDown)

  // UI instantanée si cache
  this.loading = !hasCache

  // fetch silencieux
  this.fetchEleves({ silent: hasCache })
}

,
beforeUnmount() {
  window.removeEventListener("keydown", this.onKeyDown)
},
computed: {
elevesInscrits() {
    return this.eleves
      .filter(e => e.statut !== "abandon")
      .sort((a, b) => {
        const nomA = `${a.nom} ${a.prenom}`.toLowerCase();
        const nomB = `${b.nom} ${b.prenom}`.toLowerCase();
        return nomA.localeCompare(nomB);
      });
  },
  elevesAbandons() {
    return this.eleves
      .filter(e => e.statut === "abandon")
      .sort((a, b) => {
        const nomA = `${a.nom} ${a.prenom}`.toLowerCase();
        const nomB = `${b.nom} ${b.prenom}`.toLowerCase();
        return nomA.localeCompare(nomB);
      });
  },
  elevesFiltres() {
    if (this.filtreStatut === "inscrits") return this.elevesInscrits;
    if (this.filtreStatut === "abandons") return this.elevesAbandons;

    // Pour "tous" : inscrits d'abord, puis abandons
    return [
      ...this.elevesInscrits,
      ...this.elevesAbandons
    ];
  }
},

    methods: {
sortEleves(list) {
  return [...list]
}

,
 onKeyDown(e) {
    if (e.key === "Escape" && this.selectedEleve) {
      this.closeEleve()
    }
  },

getInitiales(eleve) {
  const prenom = (eleve.prenom || "").trim()
  const nom = (eleve.nom || "").trim()

  const initPrenom = prenom.charAt(0).toUpperCase()
  const initNom = nom.charAt(0).toUpperCase()

  return `${initPrenom}${initNom}` || "?"
},

handleImageError(event) {
  // Masque l'image cassée
  event.target.style.display = "none"
},
hasUnsavedChanges() {
  return JSON.stringify(this.selectedEleve) !== JSON.stringify(this.originalEleve)
}
,
 selectEleve(eleve) {
  this.originalEleve = JSON.parse(JSON.stringify(eleve))
  this.selectedEleve = JSON.parse(JSON.stringify(eleve))
}

,
closeEleve() {
  this.selectedEleve = null
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
hasEleveChanged(eleve) {
  if (!this.originalEleve) return true

  const keys = [
    "email",
    "nom",
    "prenom",
    "telephone",
    "statut",
    "objectif",
    "trimestre",
    "cursus",
    "drive",
    "youtube"
  ]

  return keys.some(k => eleve[k] !== this.originalEleve[k])
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
  if (!this.hasEleveChanged(eleve)) return
const prevEleves = JSON.parse(JSON.stringify(this.eleves))

  const jwt = await getValidToken()
  if (!jwt || !eleve?.user_id) return

  const keys = [
    "email",
    "nom",
    "prenom",
    "telephone",
    "statut",
    "objectif",
    "trimestre",
    "cursus",
    "drive",
    "youtube"
  ]

  const diff = {}
  keys.forEach(k => {
    if (eleve[k] !== this.originalEleve[k]) {
      diff[k] = eleve[k]
    }
  })

  if (Object.keys(diff).length === 0) return
this.eleves = this.eleves.map(e =>
  e.user_id === eleve.user_id ? { ...e, ...diff } : e
)
this.saveToStore()

  const payload = {
    route: "updateelevecomplet",
    jwt,
    prof_id: this.auth.user.prof_id,
    eleve_id: eleve.user_id,
    ...diff
  }

  const res = await fetch(getProxyPostURL(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })

const result = await res.json()
if (!result.success) {
  this.eleves = prevEleves
  this.saveToStore()
  return alert(result.message)
}


  this.originalEleve = JSON.parse(JSON.stringify(eleve))
  this.eleves = this.eleves.map(e =>
  e.user_id === eleve.user_id ? { ...eleve } : e
)

this.saveToStore()

}




    }
  };
  </script>

<style scoped>
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

  --text-main: #ffffff;
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
color:white;
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
  color:white;
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
  color:white;
  max-width: 640px;
  margin: 0 auto;
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
/* 🔒 FIX select fermé après sélection */
select {
  background: rgba(255,255,255,0.07);
  color: #ffffff !important;
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



/* style pour la liste d'élève */
/* ========================= */
/* 🎯 ONGLETS FILTRES PREMIUM */
/* ========================= */
.btn-group {
  display: flex;
  gap: 8px;
  padding: 4px;
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.08);
}

.btn-group .btn {
  flex: 1;
  border-radius: 8px !important;
  border: none;
  padding: 10px 20px;
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0.3px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.btn-group .btn-primary {
  background: rgba(255,255,255,0.18);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.btn-group .btn-success {
  background: linear-gradient(135deg, #34c759 0%, #30d158 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(52,199,89,0.3);
}

.btn-group .btn-danger {
  background: linear-gradient(135deg, #ff453a 0%, #ff3b30 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(255,69,58,0.3);
}

.btn-group .btn-outline-light {
  background: transparent;
  color: rgba(255,255,255,0.6);
}

.btn-group .btn-outline-light:hover {
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.9);
}

/* ========================= */
/* 👥 GRILLE ÉLÈVES PREMIUM */
/* ========================= */
.eleves-grid {
  display: grid;
  gap: 16px;
  margin-top: 24px;
}

@media (max-width: 767px) {
  .eleves-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .eleves-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1200px) {
  .eleves-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* ========================= */
/* 📇 CARTE ÉLÈVE PREMIUM */
/* ========================= */
.modern-card.eleve-row {
  cursor: pointer;
  padding: 10px;
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.06);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.modern-card.eleve-row::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(255,255,255,0.1) 50%,
    transparent 100%
  );
}

.modern-card.eleve-row:hover {
  background: rgba(255,255,255,0.08);
  transform: translateY(-4px) scale(1.02);
  box-shadow:
    0 8px 32px rgba(0,0,0,0.4),
    0 0 0 1px rgba(255,255,255,0.1);
}

.modern-card.eleve-row:active {
  transform: translateY(-2px) scale(1.01);
}

.eleve-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.eleve-name {
  font-size: 17px;
  font-weight: 500;
  color: #fff;
  letter-spacing: -0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.eleve-badge {
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.eleve-badge.ok {
  background: linear-gradient(135deg, #34c759 0%, #30d158 100%);
  color: #fff;
}

.eleve-badge.ko {
  background: linear-gradient(135deg, #ff453a 0%, #ff3b30 100%);
  color: #fff;
}

/* ========================= */
/* 🎭 ANIMATIONS SMOOTH */
/* ========================= */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.eleves-grid > * {
  animation: fadeInUp 0.5s ease backwards;
}

.eleves-grid > *:nth-child(1) { animation-delay: 0.05s; }
.eleves-grid > *:nth-child(2) { animation-delay: 0.1s; }
.eleves-grid > *:nth-child(3) { animation-delay: 0.15s; }
.eleves-grid > *:nth-child(4) { animation-delay: 0.2s; }
.eleves-grid > *:nth-child(5) { animation-delay: 0.25s; }
.eleves-grid > *:nth-child(6) { animation-delay: 0.3s; }


/* ===================================================
   🖼️ AVATAR ÉLÈVE — PREMIUM
   =================================================== */

.eleve-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.eleve-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;

  background: linear-gradient(135deg, var(--accent) 0%, #ff6b35 100%);

  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.eleve-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: 0.5px;

  background: linear-gradient(135deg, var(--accent) 0%, #ff6b35 100%);
}

.eleve-info {
  flex: 1;
  min-width: 0;
}

.eleve-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

/* ===============================
   OVERLAY SORTIE MODALE
   =============================== */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
}


/* la carte reste clean */
.overlay .card-details {
  width: 90%;
  max-width: 820px;
  max-height: 90vh;
  overflow-y: auto;
}


.eleve-modal {
  width: 92%;
  max-width: 640px;
  max-height: 88vh;
  background: var(--bg-panel);
  border: 1px solid var(--border-soft);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
  display: flex;
  flex-direction: column;
  animation: fadeInUp 0.25s ease;
}

/* HEADER */
.modal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-soft);
}

.modal-header h5 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

/* bouton retour */
.btn-back {
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border-soft);
  color: white;
  border-radius: 8px;
  padding: 4px 8px;
  cursor: pointer;
}

.btn-back:hover {
  background: rgba(255,255,255,0.12);
}

/* BODY */
.modal-body {
  padding: 14px 16px;
  overflow-y: auto;
}
.select-field {
  width: 100%;
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-xs);
  padding: 6px;
  font-size: 0.78rem;
  color: var(--text-main);
}

/* IMPORTANT : options */
.select-field option {
  background: #0b0d10;        /* fond sombre réel */
  color: #ffffff;             /* texte lisible */
}

/* hover/focus */
.select-field:focus {
  outline: none;
  border-color: var(--border-focus);
  background: rgba(251,146,60,0.1);
}

</style>

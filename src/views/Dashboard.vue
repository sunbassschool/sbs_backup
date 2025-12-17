<template>
  <Layout>

    <!-- 🧱 Loader global -->
   <!-- 🔥 OVERLAY : s’affiche PAR-DESSUS le dashboard -->
    <div
      v-if="!dashboardReady"
      class="dashboard-overlay-loader"
    >
      <div class="loader-box">
        <div class="logout-spinner"></div>
        <p class="logout-text">Chargement de ton compte...</p>
      </div>
    </div>
  <!-- 🔥 OVERLAY spécial récupération cache / API -->
  <div v-if="isLoading" class="dashboard-overlay-loader">
    <div class="logout-container">
      <div class="logout-spinner"></div>
      <p class="logout-text">Récupération de tes données...</p>
    </div>
  </div>
    <!-- 🧩 TON CONTENU EXACT, NON MODIFIÉ -->
        <div class="container d-flex flex-column align-items-center justify-content-center">


      <div class="content">
        <div
          v-for="(card, index) in cards"
          :key="index"
          class="fade-in position-relative"
          :class="{ 'first-card': index === 0 }"
        >
          <div class="dashboard-card rounded-3 p- d-flex align-items-center">
            <i :class="card.icon" class="icon me-3"></i>
            <div>
              <h3 class="h5 mb-1 d-flex align-items-center">
                {{ card.title }}
              </h3>
              <div class="text-muted mb-0">
                <component
                  v-if="card.renderAsComponent"
                  :is="card.renderAsComponent"
                />
                <p v-else v-html="card.text"></p>
              </div>
            </div>
          </div>

          <!-- Bloc note -->
         <div
  v-if="index === cards.length - 1"
  class="dashboard-card rounded-3 p-3 d-flex flex-column"
>

            <h3 class="h5 mb-2">🎶 📝 Bloc note</h3>

 <div
  v-if="!noteReady"
  class="form-control mt-2 loading-indicator"
  style="min-height: 150px; display: flex; align-items: center; justify-content: center;"
>
              ⏳ Chargement de ta note...
            </div>

            <textarea
              v-else
              v-model="note"
              class="form-control mt-2"
              placeholder="Écris ta note ici..."
              rows="5"
              @input="onNoteInput"
            ></textarea>

            <div class="d-flex justify-content-end mt-1">
              <button
                class="btn refresh-note-btn d-flex align-items-center gap-2 px-3 py-1"
                @click="fetchNote(true)"
                :disabled="isRefreshingNote"
                :class="{ 'no-border': isRefreshingNote }"
              >
                <span v-if="!isRefreshingNote">📥 Charger la dernière note</span>
                <span
                  v-else
                  class="custom-spinner"
                  role="status"
                  aria-hidden="true"
                ></span>
              </button>
            </div>

            <div class="clear-note-container">
              <i
                v-if="note.length"
                @click.stop="clearNote"
                class="bi bi-x-circle clear-note-btn"
              ></i>
            </div>
          </div>
        </div>
      </div>

    </div>

  </Layout>
</template>



<script>
import Layout from "../views/Layout.vue";
import { jwtDecode } from "jwt-decode";
import {
  getCache,
  setCache,
  clearCache,
  shouldUpdateCache
} from "@/utils/cacheManager.js";
import {
  getUserInfoFromJWT,
  getValidToken
} from "@/utils/api.ts";
import { useAuthStore } from "@/stores/authStore.js";
import router from "@/router/index.ts";
import { onBeforeRouteLeave } from "vue-router";
import { h, resolveComponent, markRaw } from "vue";

export default {
  name: "Dashboard",
  components: { Layout },

data() {
  const auth = useAuthStore();
  
  const email = localStorage.getItem("email") || "";
  const prenom = localStorage.getItem("prenom") || "";

  // 🔹 On calcule immédiatement la note en cache
  const noteKey = prenom ? `userNote_${prenom}` : null;
  const cachedNote = noteKey ? localStorage.getItem(noteKey) : null;
  const hasNoteCache = cachedNote !== null; // "" compte comme cache valide

  return {
    note: "",              // toujours initialisé vide
noteReady: false,      // le vrai indicateur d’API terminée

    dashboardReady: false,
    auth,
    email,
    prenom,

    cacheKey: `dashboard_${email}`,

    // 📝 NOTE
    note: hasNoteCache ? cachedNote : "",
    noteReady: hasNoteCache,          // ✅ si cache → pas de loader
    isNoteLoading: !hasNoteCache,     // loader seulement si pas de cache
    noteLoadedFromCache: hasNoteCache,

    isRefreshingNote: false,
    isLoading: true,
    cards: [],

    destroyed: false,
    debounceTimer: null,
noteLoadedFromCache: false,

    routes: {
      GET: "AKfycbzeh9vGiTKbzVXhE5NmI03Zg8zhEjbL-7UUJU-bbpYMBP4GNsBKqVRtb782ED2yIe8ODw/exec",
      POST: "AKfycbzeh9vGiTKbzVXhE5NmI03Zg8zhEjbL-7UUJU-bbpYMBP4GNsBKqVRtb782ED2yIe8ODw/exec"
    }
  };
},



  computed: {
    isLoggedIn() {
      return !!this.auth.jwt && !!this.auth.user;
    },
  },

  // -----------------------------
  //      NAVIGATION LEAVE
  // -----------------------------
  setup() {
    onBeforeRouteLeave((to, from, next) => {
      const auth = useAuthStore();
      const prenom = auth.user?.prenom || localStorage.getItem("prenom");

      const noteKey = `userNote_${prenom}`;
      const cached = localStorage.getItem(noteKey) || "";
      const note = this?.note?.trim?.() || "";

      if (!auth.jwt || !note || note === cached) return next();

      this.saveNoteImmediately()
        .finally(() => next());
    });
  },

  // -----------------------------
  //     MOUNTED
  // -----------------------------
async mounted() {
  // --------------------------------------------------
  // 🔗 helper global upload
  // --------------------------------------------------
  window.goToUploadsAndOpenModal = (coursId) => {
    router.push({
      path: "/mes-uploads",
      query: {
        cours_id: coursId,
        openUpload: "1",
      },
    });
  };

  const auth = this.auth;
  if (auth.isLoggingOut || this.destroyed) return;

  await this.$nextTick();

  // --------------------------------------------------
  // 1️⃣ Identité fallback (sécurité)
  // --------------------------------------------------
  if (!this.email) this.email = getUserInfoFromJWT()?.email || "";
  if (!this.prenom) this.prenom = getUserInfoFromJWT()?.prenom || "";

  // --------------------------------------------------
  // 2️⃣ NOTE — affichage instantané si cache
  // --------------------------------------------------
  const noteKey = `userNote_${this.prenom}`;
  const cachedNote = localStorage.getItem(noteKey);

  if (cachedNote !== null) {
    this.note = cachedNote;
    this.noteReady = true;
    this.isNoteLoading = false;
  } else {
    this.note = "";
    this.noteReady = false;
    this.isNoteLoading = true;
  }

  this.noteLoadedFromCache = cachedNote !== null;

  // 🔄 sync silencieux avec l’API
  this.syncNoteWithAPI();

  // --------------------------------------------------
  // 3️⃣ DASHBOARD — cache
  // --------------------------------------------------
  const cachedDashboard = getCache(this.cacheKey);

  const hasPlanningCache =
    cachedDashboard &&
    (Array.isArray(cachedDashboard.planning) ||
      cachedDashboard.planning === undefined); // élève sans prof OK

  const hasObjectif = auth.user?.objectif !== undefined;

  // --------------------------------------------------
  // 4️⃣ 🚀 RENDER IMMÉDIAT si cache exploitable
  // --------------------------------------------------
  if (hasPlanningCache && hasObjectif) {
    this.updateData(cachedDashboard || {});
    this.dashboardReady = true;

    // 🔄 refresh en arrière-plan (non bloquant)
    this.fetchFromAPI(true);
    return;
  }

  // --------------------------------------------------
  // 5️⃣ FALLBACK — pas de cache exploitable
  // --------------------------------------------------
  this.isLoading = true;

  try {
    await this.loadUserData(); // peut utiliser le cache
    await this.fetchFromAPI(true);
  } finally {
    this.isLoading = false;
    this.dashboardReady = true;
  }
}




,

  beforeUnmount() {
    this.destroyed = true;
  },

  // -----------------------------
  //     METHODS
  // -----------------------------
  methods: {
    // -------------------------
    //   NOTE SYSTEME
    // -------------------------
    async onNoteInput() {
      const key = `userNote_${this.prenom}`;
      localStorage.setItem(key, this.note);

      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.updateNote();
      }, 1200);
    },

async syncNoteWithAPI() {
  const auth = this.auth;
  const jwt = auth.jwt; // 🔥 jamais getValidToken()

  if (!jwt) {
    this.noteReady = true; // ✅ on libère le loader même sans token
    return;
  }

  const url = this.getProxyURL(this.routes.GET, {
    route: "getnote",
    jwt
  });

  try {
    const raw = await fetch(url).then(r => r.text());
    const data = JSON.parse(raw);

    const newNote = data.note || data?.notes?.[0]?.note || "";
    const key = `userNote_${this.prenom}`;

    // ✅ Toujours écrire le résultat API (même vide)
    this.note = newNote;
    localStorage.setItem(key, newNote);

  } catch (e) {
    console.error("❌ syncNote error:", e);
  } finally {
    // ✅ LE POINT LE PLUS IMPORTANT
    this.noteReady = true;
    this.isNoteLoading = false;
  }
}

,

    async fetchNote(force = false) {
      const key = `userNote_${this.prenom}`;
      this.isRefreshingNote = force;

      if (!force && this.note) {
        return;
      }

      await this.syncNoteWithAPI();
      this.isRefreshingNote = false;
    },

    async updateNote() {
      const jwt = await getValidToken();
      if (!jwt) return;

      const url = this.getProxyPostURL(this.routes.POST);
      const payload = {
        route: "updatenote",
        jwt,
        note: this.note.trim()
      };

      try {
        await fetch(url, {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" }
        });
      } catch (e) {
        console.error("❌ updateNote:", e);
      }
    },

    async saveNoteImmediately() {
      await this.updateNote();
    },

    clearNote() {
      const key = `userNote_${this.prenom}`;
      this.note = "";
      localStorage.setItem(key, "");
      this.updateNote();
    },
// méthode pour redirection 
goToUploads() {
  this.$router.push("/eleve-uploads")
}
,
    // -------------------------
    //  PLANNING / CARDS
    // -------------------------
    async loadUserData() {
      const cached = getCache(this.cacheKey);

      if (this.isCacheValid(cached)) {
        this.updateData(cached);
        return;
      }

      await this.fetchFromAPI(true);
    },

    async fetchFromAPI(force = false) {
      if (!force && !shouldUpdateCache(this.cacheKey)) return;

      const jwt = await getValidToken();
      if (!jwt) return router.replace("/login");

  const url = this.getProxyURL(this.routes.GET, {
  route: "planning",
  jwt,
  email: this.email,
  prof_id: this.auth.user?.prof_id
});


      try {
        const raw = await fetch(url).then(r => r.text());
        const data = JSON.parse(raw);

        setCache(this.cacheKey, {
  ...data,
  role: this.auth.user?.role,
  prof_id: this.auth.user?.prof_id
});

        this.updateData(data);
      } catch (e) {
        console.error("❌ fetchFromAPI:", e);
      } finally {
        this.isLoading = false;
      }
    },

    // -------------------------
    //  UPDATE CARDS
    // -------------------------
updateData(data = {}) {
  // 🛡️ NORMALISATION TOTALE
  const planning = Array.isArray(data.planning) ? data.planning : [];
  const user = data.user && typeof data.user === "object" ? data.user : {};

  // 🧠 USER (sans écraser role / prof_id)
  if (Object.keys(user).length) {
    this.auth.user = {
      ...this.auth.user,
      ...user,
      role: this.auth.user?.role,
      prof_id: this.auth.user?.prof_id,
    };
  }

  // 🕒 DATE
  const now = new Date();

  // 🚫 STATUTS INTERDITS
  const bannedStatuses = new Set([
    "FAIT",
    "TERMINE",
    "TERMINEE",
    "ANNULÉ",
    "ANNULE",
    "REPORT_REFUSE",
    "REFUSE",
  ]);

  // 🔍 DEBUG SAFE
  console.log(
    "🔍 STATUTS REÇUS:",
    planning.map(c => c?.status || c?.statut || "")
  );

  // 🎯 PROCHAIN COURS
  const prochain = planning
    .filter(c => {
      const s = (c?.status || c?.statut || "")
        .toString()
        .toUpperCase()
        .trim();
      return s && !bannedStatuses.has(s);
    })
    .filter(c => {
      const d = new Date(c?.date);
      return !isNaN(d) && d > now;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;

  // 🧱 CARDS (TOUJOURS VALIDE)
const hasProf = !!this.auth.user?.prof_id;

this.cards = [
  {
    icon: "bi bi-calendar-event",
    title: "Prochain Cours",
    text: prochain
      ? this.renderProchainCours(prochain)
      : this.renderNoCourse(),
  },

  // 👇 CARD UNIQUEMENT SI PROF
  ...(hasProf
    ? [{
        icon: "bi bi-upload",
        title: "Envoyer un fichier",
        text: prochain
          ? `
            🎼 Partitions, audio, vidéo…<br>
            <div
              onclick="window.goToUploadsAndOpenModal('${prochain.ID_Cours}')"
              class="planning-bouton"
              style="margin-top:8px"
            >
              📎 Envoyer un fichier
            </div>
          `
          : `
            🎼 Partitions, audio, vidéo…<br>
             <div
            onclick="window.goToUploadsAndOpenModal(null)"
            class="planning-bouton"
            style="margin-top:8px"
          >
            📁 Accéder aux documents
          </div>
          `
      }]
    : []),

  {
    icon: "bi bi-flag",
    title: "Objectif actuel",
    text: this.auth.user?.objectif || "🎯 Aucun objectif défini",
  },
];


  // ✅ FIN PROPRE
  this.isLoading = false;
  this.dashboardReady = true;
}


,

    renderNoCourse() {
      return `
        🎸 Aucun cours prévu.<br>
        <div onclick="window.vueRouterPush('/Abonnements')" class="planning-bouton">
          📅 Réserver
        </div>
      `;
    },

    renderProchainCours(c) {
      return `
        📅 ${this.getDayName(c.date)} ${this.getFormattedDate(c.date)} à ${this.getFormattedTime(c.date)}
        <br>
        <button onclick="window.open('${c.meet}','_blank')" class="btn-join-course">🎥 Rejoindre</button>
      `;
    },

    // -------------------------
    // HELPERS
    // -------------------------
    isCacheValid(d) {
      if (!d) return false;
      return Array.isArray(d.planning) || d.objectif;
    },

    getProxyURL(route, params) {
      const qs = new URLSearchParams(params).toString();
      const base = `https://script.google.com/macros/s/${route}?${qs}`;
      return `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(base)}`;
    },

    getProxyPostURL(route) {
      const base = `https://script.google.com/macros/s/${route}`;
      return `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(base)}`;
    },

   getDayName(d) {
  return ["dim.","lun.","mar.","mer.","jeu.","ven.","sam."][new Date(d).getDay()];
}
,

    getFormattedDate(d) {
      const f = new Date(d);
      return `${f.getDate().toString().padStart(2,"0")}/${(f.getMonth()+1).toString().padStart(2,"0")}/${f.getFullYear()}`;
    },

    getFormattedTime(d) {
      const f = new Date(d);
      return `${f.getHours().toString().padStart(2,"0")}h${f.getMinutes().toString().padStart(2,"0")}`;
    },
  }
};
</script>




<style scoped>
.alert-badge {
  margin-top: 10px;
  font-size: 0.9rem;
  font-weight: bold;
  color: #ff3c00;
  animation: pulseAlert 1.5s infinite;
}

@keyframes pulseAlert {
  0% { opacity: 1; }
  50% { opacity: 0.5; transform: scale(1.05); }
  100% { opacity: 1; }
}


.btn-join-course:hover {
  background-color: #ff5722;
  box-shadow: 0 6px 15px rgba(255, 87, 34, 0.5);
}

.course-info {
  color: #ffc107;
  margin-bottom: 10px;
  font-weight: 500;
}

.note-update-msg {
  font-size: 0.85rem;
  color: #ffffff;
  padding: 4px 8px;
  margin-top: 10px;
  text-align: right;
  background: rgba(0, 255, 174, 0.08);
  border: 1px solid rgba(0, 255, 174, 0.2);
  border-radius: 6px;
  animation: fadeMessage 3s ease-in-out forwards;
  display: inline-block;
}

@keyframes fadeMessage {
  0%   { opacity: 0; transform: translateY(-5px); }
  10%  { opacity: 1; transform: translateY(0); }
  90%  { opacity: 1; }
  100% { opacity: 0; transform: translateY(-5px); }
}

.refresh-note-btn {
  font-size: 0.9rem;
  margin-top:8%;
  background-color: rgba(255, 255, 255, 0.08);
  color: #ffffffcc;
  border: 1px solid #ffffff33;
  border-radius: 6px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.refresh-note-btn.no-border {
  border: none !important; /* ✅ Supprime totalement la bordure */
  background: transparent !important; /* Facultatif si tu veux full clean */
  box-shadow: none !important;
}


.refresh-note-btn:hover {
  background-color: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  
  border:none;
 
}

.refresh-note-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner-border {
  width: 1rem;
  height: 1rem;
  
  color: #ff8c00;
}

@keyframes fadeBlink {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.animate-fade {
  animation: fadeBlink 1.5s infinite;
}

.custom-spinner {
  width: 14px;
  height: 14px;
  background-color: #ff1e00;
  border-radius: 50%;
  display: inline-block;
  animation: pulseSpinner 0.9s ease-in-out infinite;
}

@keyframes pulseSpinner {
  0% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.4); opacity: 0.6; }
  100% { transform: scale(1); opacity: 0.9; }
}



@media (max-width: 768px) {
  
  .dashboard-card {
    padding: 7px !important; /* 📏 Réduction du padding général */
    min-height: auto !important; /* ✅ Évite un agrandissement inutile */
    display: flex;
    align-items: center;
  }

  .dashboard-card .icon {
    font-size: 1.5rem; /* 📏 Réduit la taille de l’icône */
    margin-right: 5px; /* ✅ Réduit l’espace entre l’icône et le texte */
  }

  .dashboard-card h3 {
    margin-bottom: 2px !important; /* ✅ Évite un grand espace sous le titre */
    font-size: 1rem; /* 📏 Taille réduite du titre */
    color: #aaaaaa;
  }

  .dashboard-card p {
    margin-bottom: 0 !important; /* ✅ Supprime l’espace sous le texte */
    font-size: 0.9rem; /* 📏 Texte légèrement plus compact */
  }







  .dashboard-card div {
    margin: 0 !important; /* ✅ Supprime tout espace autour du bloc texte */
    padding: 0 !important;
  }
  .dashboard-card .icon {
  background-color: rgba(92, 92, 92, 0.226); /* 🎨 Couleur de fond */
  padding: 2px; /* ✅ Ajoute un espace autour de l’icône */
  border-radius: 50%; /* ✅ Arrondi pour un effet bouton */
}
.dashboard-card .icon {
  color: #ff3c00; /* 🎨 Couleur de l'icône */
}
}
h3 {
  font-size: 1.2rem;
  font-weight: bold;
  color: #ffffff; /* Un orange motivant */
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
}

h3::after {
  content: "";
  display: block;
  width: 50px;
  height: 2px;
  background: #ff8c00;
  margin-top: 5px;
  transition: width 0.3s ease-in-out;
}

h3:hover::after {
  width: 100px;
}

textarea.form-control {
  min-height: 150px; /* ✅ Taille minimale */
  max-height: 400px; /* ✅ Taille max pour éviter qu'il prenne tout l’écran */
  height: auto; /* ✅ Permet l'agrandissement */
  overflow-y: auto !important; /* ✅ Active le scroll si nécessaire */
  resize: vertical; /* ✅ L’utilisateur peut agrandir la zone */
  
  font-family: 'Patrick Hand', cursive;
  font-size: 1.2rem;
  background: #ffffff;
  border: 2px solid #d4a373;
  padding: 15px;
  width: 100%;
  line-height: 1.6;
  color: #3d3d3d;
  border-radius: 5px;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.1);
  
  white-space: pre-wrap;
  animation: fadeInText 1s ease-out;
  caret-color: #3d3d3d; /* ✅ Affiche un vrai curseur */
}


/* Ajout du curseur animé */
textarea.form-control {
  font-family: 'Patrick Hand', cursive;
  font-size: 1.2rem;
  background: #ffffff;
  border: 2px solid #d4a373;
  padding: 15px;
  min-height: 150px;
  width: 100%;
  line-height: 1.6;
  color: #3d3d3d;
  border-radius: 5px;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.1);
  
  white-space: pre-wrap;
  animation: fadeInText 1s ease-out;
  caret-color: #3d3d3d; /* ✅ Affiche un vrai curseur */
}
@media (max-width: 768px) { /* Ou toute autre taille selon ton besoin */
  .container {
    display: flex;
    margin-top: -12%;
    flex-direction: column;
    align-items: center;
    justify-content: center; /* Centrage vertical */
    padding: 40px 20px;
    background-color: rgb(0, 0, 0);
    min-height: 100vh; /* Toute la hauteur de la fenêtre */
  }
}
/* Animation d'apparition progressive */
@keyframes fadeInText {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* ✅ Animation du curseur natif */
textarea.form-control:focus {
  caret-color: #070707; /* 🔥 Curseur rouge/orange pour coller au thème */
  animation: blinkCursor 0.8s infinite;
}

/* ✅ Effet de clignotement (du vrai curseur, sans border-right) */
@keyframes blinkCursor {
  50% {
    caret-color: transparent;
  }
}



textarea.form-control:focus {
  border-color: #ff8c00;
  box-shadow: 0px 0px 10px rgba(255, 140, 0, 0.6);
  background: #ffffff; /* Effet papier légèrement jauni */
}

.text-danger {
  color: red !important;
}


/* 📅 Bouton discret pour la date */
/* 📅 Bouton cliquable pour la date */
.meet-button {
  display: inline-block;
  background: rgba(255, 140, 0, 0.15);
  padding: 8px 12px;
  border-radius: 8px;
  text-decoration: none !important;
  font-weight: bold;
  color: #ff8c00 !important;
  transition: background 0.3s ease-in-out, color 0.3s ease-in-out;
  text-align: center;
  font-size: 1rem;
  cursor: pointer;
}

.planning-link {
  text-decoration: none !important;
  text-decoration‑thickness: 2px !important;
  text-underline-offset: 3px !important;
  color: #ff8c00 !important;
}


/* 🔥 FORCER la couleur du texte dans tous les états possibles */



/* 🔄 Bouton de mise à jour du cache */
.update-cache-btn {
  position: absolute;
  top: 10px;
  right: 0px;
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #ffffff;
  cursor: pointer;
  transition: opacity 0.3s ease-in-out;
  padding: 5px;
}

.update-cache-btn:hover {
  opacity: 0.7;
}

/* Conteneur principal */
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* Centrage vertical */
  padding: 40px 20px;
  background-color: rgb(15, 15, 15);

  width: 100%; /* Pleine largeur */
}

.loading-indicator {
  font-size: 0.9rem;
  color: #ff8c00;
  animation: fadeInOut 1s infinite alternate;
}

@keyframes fadeInOut {
  from { opacity: 1; }
  to { opacity: 0.5; }
}

/* Contenu centré et limité */
.content {
  width: 100%;
   flex-grow:1;
  max-width: 800px;
  text-align: center;
  padding-bottom: 100px; /* ✅ Ajoute de l’espace sous le contenu */

}

/* Message d'accueil */
.text-center {
  color: #ffffff;
}

/* Cartes */
/* 📌 Style général des cartes */
.dashboard-card {
  max-height: 350px; /* ✅ Hauteur maximale du bloc */
  overflow-y: hidden; /* 👈 change ça */
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05)); /* Effet verre */
  border: 1px solid rgba(255, 255, 255, 0.2); /* Bordure subtile */
  box-shadow: 4px 4px 15px rgba(0, 0, 0, 0.3), inset -4px -4px 10px rgba(255, 255, 255, 0.05); /* Ombre douce */
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 10px;
  border-radius: 12px; /* Coins légèrement arrondis */
  margin: 15px 0; /* Ajout d’espace entre les cartes */
  width: 100%;
  color:white;
  transition: all 0.3s ease-in-out;
  backdrop-filter: blur(8px); /* Effet de flou pour le style "Glassmorphism" */
}

/* ✨ Effet au survol */
.dashboard-card:hover {
  transform: translateY(-5px);
  box-shadow: 6px 6px 20px rgba(0, 0, 0, 0.5), inset -2px -2px 8px rgba(255, 255, 255, 0.05);
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.192), rgba(255, 255, 255, 0.07));
}

/* 🟠 Icônes plus visibles */
.icon {
  font-size: 2.5rem;
  color: #ff8c00; /* Icône colorée pour plus d’impact */
  background: rgba(255, 140, 0, 0.15);
  padding: 10px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 55px;
  height: 55px;
  margin-right: 15px;
}
.this.card

/* 📌 Amélioration des titres */
.dashboard-card h3 {
  font-size: 1.2rem;
  font-weight: bold;
  color: white!important;
}

/* 📌 Texte plus lisible */
.dashboard-card p {
  font-size: 14px;
  color: #fff!important;
  
  font-weight: 400; /* Poids de police normal */
   text-align: left; /* Alignement naturel */
  line-height: 1.5; /* Espacement optimal */
  letter-spacing: 0.3px; /* Espacement subtil pour la lisibilité */
  transition: color 0.3s ease-in-out;
  
}


/* 🔥 Barre animée sous le texte */
.dashboard-card p::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 0;
  height: 2px;
  background-color: #a33400;
  transition: width 0.3s ease-in-out;
}

.dashboard-card:hover p {
  color: #ff8c00;
}

.dashboard-card:hover p::after {
  width: 100%;
}

@media (max-width: 768px) {
  .dashboard-card {
    min-width: 100%;
  }
}

.dashboard-card:hover p {
  text-shadow: 0 0 15px rgba(255, 140, 0, 0.9);
}
.dashboard-card p::first-letter {
  font-size: 1.1rem;
  font-weight: bold;
  color: #ff3c00; /* Première lettre en orange */
}
/* 🔽 Séparateur entre les cartes */
.separator {
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
  margin: 20px 0;
}


/* Effet d'apparition fluide */
.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Style des boutons */
button {
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 5px;
  transition: background-color 0.3s ease-in-out;
}

.btn-primary {
  background-color: #1e90ff;
  border: none;
  color: white;
}

.btn-secondary {
  background-color: #444;
  border: none;
  color: white;
}

button:hover {
  opacity: 0.8;
}

/* Ajustement du texte */
.text-light {
  color: #bbb;
}
@media screen and (width: 768px) and (height: 1024px) {
  .container {
    padding-top: 120px !important; /* égal à la hauteur du header */
  }
}


.planning-link::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 0;
  height: 2px;
  background-color: #ff8c00;
  transition: width 0.3s ease;
}

.planning-link:hover::after {
  width: 100%;
}

.planning-link:hover {
  color: #ffa73c;
  text-shadow: 0 0 5px rgba(255, 140, 0, 0.5);
}
.feedback-link {
  display: inline-block;
  margin-top: 10px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #00ffae; /* 🟢 Un vert fluo type Spotify */
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.feedback-link::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 0;
  height: 2px;
  background-color: #00ffae;
  transition: width 0.3s ease;
}

.feedback-link:hover::after {
  width: 100%;
}

.feedback-link:hover {
  color: #3effc2;
  text-shadow: 0 0 6px rgba(0, 255, 174, 0.5);
}
.feedback-link,
.planning-link {
  display: inline-block;
  margin-top: 10px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #00ffae;
  text-decoration: underline; /* 💡 underline direct */
  text-underline-offset: 3px; /* ✅ plus joli visuellement */
  text-decoration-thickness: 1.5px;
  cursor: pointer;
  transition: color 0.3s ease, text-shadow 0.3s ease;
}

.feedback-link:hover,
.planning-link:hover {
  color: #3effc2;
  text-shadow: 0 0 6px rgba(0, 255, 174, 0.5);
}
.dashboard-card p .planning-link::after {
  display: none !important;
}

</style>
<style>
/* Styles globaux ici */
.planning-link {
  text-decoration: none;
  font-weight: bold;
  color: #ff8c00;
  cursor: pointer;
}

.planning-link:hover {
  color: #ffa73c;
  text-shadow: 0 0 5px rgba(255, 140, 0, 0.5);
}
.no-course-text {
  color: #f0f0f0; /* 🔆 Couleur claire pour fond sombre */
  font-weight: 500;
  font-size: 0.95rem;
}
.planning-bouton {
  display: inline-block;
  font-weight: 500;
  color: #212529;
  background-color: #ffc107;
  border: 1px solid #ffc107;
  padding: 0.25rem 0.6rem; /* 🔽 réduit le padding */
  font-size: 0.9rem; /* 🔽 réduit la taille du texte */
  line-height: 1.3; /* 🔽 réduit l'espacement vertical */
  border-radius: 0.3rem;
  transition: background-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  user-select: none;
}

.planning-bouton:hover {
  background-color: #ffca2c;
  border-color: #ffc720;
  color: #212529;
  text-decoration: none;
  box-shadow: 0 0 0 0.2rem rgba(255, 193, 7, 0.5);
}
.btn-join-course {
  display: inline-block;
  background-color: #ff3c00;
  color: white;
  font-size: 1rem;
  
  border: none;
  border-radius: 15px;
  padding: 1px 10px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: background-color 0.3s ease-in-out;
  
}
.meet-button-wrapper {
  position: relative;
  display: inline-block;
}

.meet-button.urgent {
  background-color: #ff0000cc;
  color: #fff;
  font-weight: bold;
  border: 2px solid #ff0000;
  border-radius: 10px;
  
}

.pulse-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 12px;
  height: 12px;
  background: red;
  border-radius: 50%;
  animation: pulsePing 1.2s infinite;
}

@keyframes pulsePing {
  0% {
    transform: scale(0.9);
    opacity: 0.8;
  }
  70% {
    transform: scale(1.6);
    opacity: 0;
  }
  100% {
    transform: scale(0.9);
    opacity: 0.8;
  }
}
.logout-container-wrapper {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 99999;
  pointer-events: none;
}

.logout-container {
  
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #121212, #1e1e1e);
  color: #ff4c4c;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #ff4c4c33;
  box-shadow: 0 0 10px rgba(255, 76, 76, 0.25);
  border-radius: 6px;
  animation: fadeIn 0.3s ease-in-out;
  white-space: nowrap;
}

.logout-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ff4c4c55;
  border-top: 2px solid #ff7f50;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

.logout-text {
  margin: 0;
  color: #ff7f50;
  text-shadow: 0 0 3px rgba(255, 127, 80, 0.3);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.dashboard-overlay-loader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999999;
}


</style>
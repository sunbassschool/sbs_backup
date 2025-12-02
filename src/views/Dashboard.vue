<template>
  <Layout>
    <div class="container d-flex flex-column align-items-center justify-content-center">
      
   <!-- 🔄 Spinner affiché pendant le chargement principal (pas juste la note) -->
<div v-if="isLoading && !isNoteLoading" class="logout-container-wrapper">
  <div class="logout-container">
    <div class="logout-spinner"></div>
    <p class="logout-text">Chargement de ton compte...</p>
  </div>
</div>



      <!-- 🔒 Si l'élève n'est pas connecté -->
  <!-- Plus besoin de condition, Layout gère tout -->


      <!-- ✅ Contenu principal si l'élève est connecté -->
<div v-if="!isLoading || isNoteLoading" class="content">


        <div 
          v-for="(card, index) in cards" 
          :key="index" 
          class="fade-in position-relative"
          :class="{ 'first-card': index === 0 }"
        >
          <div class="dashboard-card rounded-3 p-4 d-flex align-items-center">
            <i :class="card.icon" class="icon me-3"></i>
            <div>
              <h3 class="h5 mb-1 d-flex align-items-center">
                {{ card.title }}

                <!-- 🔄 Bouton mise à jour visible uniquement sur la première carte -->
                


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
          
          <div v-if="index === 1" class="dashboard-card rounded-3 p-4 d-flex flex-column">
            <h3 class="h5 mb-2">🎶 📝 Bloc note</h3>
           
      <div v-if="isNoteLoading" class="form-control mt-2 loading-indicator" style="min-height: 150px; display: flex; align-items: center; justify-content: center;">
  ⏳ Chargement de ta note...
</div>
<textarea
  v-else
  v-model="note"
  class="form-control mt-2"
  placeholder="Écris ta note ici..."
  rows="5"
  @input="onNoteInput">
</textarea>

<div class="d-flex justify-content-end mt-1">
  <button 
  class="btn refresh-note-btn d-flex align-items-center gap-2 px-3 py-1"
  @click="fetchNote(true)"
  :disabled="isRefreshingNote"
  :class="{ 'no-border': isRefreshingNote }"
>
  <span v-if="!isRefreshingNote">📥 Charger la dernière note</span>
  <span v-else class="custom-spinner" role="status" aria-hidden="true"></span>
</button>

</div>



  
  <div class="clear-note-container">
  <i 
    v-if="note.length" 
    @click.stop="clearNote" 
    class="bi bi-x-circle clear-note-btn">
  </i>
</div>



  
</div>
         
          
        </div>
      </div>

    </div>
  </Layout>
</template>


<script>
import Layout from "../views/Layout.vue";
import { jwtDecode } from "jwt-decode"; // 📌 Ajout du décodage du JWT
import { getCache, setCache, clearCache, shouldUpdateCache } from "@/utils/cacheManager.js";
import { getToken, getUserInfoFromJWT, getValidToken, refreshToken  } from "@/utils/api.ts";
import { useAuthStore } from "@/stores/authStore.ts"; // 👈 importe ton store
import { onBeforeRouteLeave } from "vue-router";

import { h, resolveComponent, onUnmounted, onMounted, getCurrentInstance } from "vue";
import router from "@/router/index.ts"

import { Picker } from "emoji-mart-vue-fast";
export default {
  setup() {
    const { proxy } = getCurrentInstance();
    const auth = useAuthStore();

    onBeforeRouteLeave((to, from, next) => {
      const prenom = auth.user?.prenom || localStorage.getItem("prenom") || "";
      
      const noteKey = `userNote_${prenom}`;
      const cached = localStorage.getItem(noteKey) || "";
      
      const note = proxy.note?.trim?.() || "";
      const saving = proxy.saving;

      if (
        saving ||
        !auth.jwt ||
        note === "" ||
        note === cached.trim()
      ) {
        return next();
      }

      proxy.saveNoteImmediately()
        .catch(err => console.warn("Erreur saveNote async :", err))
        .finally(() => next());
    });
  }
,

  name: "Dashboard",
  components: { Layout },
  data() {
    
    const rawPrenom = sessionStorage.getItem("prenom") || localStorage.getItem("prenom") || "";
const prenom = decodeURIComponent(rawPrenom);
const cacheKey = `userData_${prenom}`;


  const cacheExpirationKey = `${cacheKey}_expiration`;

  return{
    prenom,  // ✅ Assure que `prenom` est défini avant l'utilisation des clés
    cacheKey, // ✅ Stocke avec la bonne valeur
    cacheExpirationKey, // ✅ Même chose ici
    noteUpdatedMessage: "", // ✅ Message temporaire de succès

    cards: [],
    isLoading: true,
    note: "", // Note de l'élève
    email: "",
    lastSaved: null,
    isRefreshingNote: false,
isNoteLoading: true,

    saveCountdown: 0, // Timer avant la prochaine sauvegarde auto

    cacheDuration: 24 * 60 * 60 * 1000,
    apiBaseURL: "https://cors-proxy-sbs.vercel.app/api/proxy?url=",
    routes: {
      GET: "AKfycbw-LmDbIdL0asIu5WrQcskGh1J2Pr_ZxxepoUsC5B5yWpo_WDDH0MqzrFZAPMm0Tyls-A/exec",
       POST: "AKfycbw-LmDbIdL0asIu5WrQcskGh1J2Pr_ZxxepoUsC5B5yWpo_WDDH0MqzrFZAPMm0Tyls-A/exec"
    }
  };
}
,
computed: {
  isLoggedIn() {
    const auth = useAuthStore();
    return !!auth.jwt && !!auth.user; // Vérifie que le JWT existe ET que l'utilisateur est chargé
  }
,
  userData() {
    const storedData = localStorage.getItem("userData_");
    return storedData ? JSON.parse(storedData) : {}; 
  },








}
,
  
async mounted() {
this.isNoteLoading = true; // ✅ DIRECTEMENT AU DÉBUT
  const auth = useAuthStore();
  this.email = localStorage.getItem("email") || getUserInfoFromJWT()?.email || "";
  
// ✅ Récupération sûre du prénom
let prenom = localStorage.getItem("prenom") || sessionStorage.getItem("prenom");
if (!prenom) {
  const email = this.email;
  const rawData = localStorage.getItem(`userData_${email}`);
  try {
    const parsed = JSON.parse(rawData);
    prenom = parsed?.prenom || "";
    if (prenom) {
      localStorage.setItem("prenom", prenom); // 🔒 on le stocke pour les prochaines fois
    }
  } catch (e) {
    console.warn("❌ Impossible de parser userData pour récupérer le prénom");
  }
}
this.prenom = prenom;

  if (auth.isLoggingOut) {
    console.warn("⛔ Dashboard bloqué : logout en cours");
    return;
  }

  const role = this.getUserRole();
  if (role === "user") {
    console.log("⛔ Rôle adhérent détecté → on affiche les cartes non inscrit");
    this.displayError();
    this.isLoading = false;
    this.isNoteLoading = false;
    return;
  }

  window.vueRouterPush = this.$router.push;

  const now = Date.now();
  const lastVisit = parseInt(sessionStorage.getItem("dashboardLastVisit"), 10) || 0;
  const maxAge = 10 * 60 * 1000;
  const isFresh = now - lastVisit < maxAge && sessionStorage.getItem("dashboardLoadedOnce");

  try {
    // ✅ Chargement principal
    await this.loadUserData(); // ⏳ ici le prénom est dispo
    this.isLoading = false;

    // ✅ Chargement de la note utilisateur (après avoir prénom)
    this.isNoteLoading = true;
    const noteKey = `userNote_${this.prenom}`;
    const cachedNote = localStorage.getItem(noteKey);

    if (cachedNote) {
      console.log("🧠 Note trouvée dans localStorage :", cachedNote);
      this.note = cachedNote;
    } else {
      await this.syncNoteWithAPI();
      const freshNote = localStorage.getItem(noteKey) || "";
      this.note = freshNote;
      console.log("🔁 Note mise à jour depuis l'API");
    }

    

  } catch (err) {
    console.error("❌ Erreur durant mounted :", err);
  } finally {
    this.isNoteLoading = false;
    this.isLoading = false;
  }

  // 🔄 MAJ cache
  setTimeout(() => {
    if (!auth.isLoggingOut) {
      this.forceUpdateCache();
    }
  }, 1000);

  // 📆 Planning
  const planningKey = `userPlanning_${this.prenom}`;
  const planningData = localStorage.getItem(planningKey);
  if (!planningData || !this.isValidJson(planningData)) {
    await this.fetchFromAPI(true);
  }

  // ✅ Marqueur de visite
  sessionStorage.setItem("dashboardLoadedOnce", "true");
  sessionStorage.setItem("dashboardLastVisit", now.toString());

  // 🔁 Sync JWT entre tabs
  const currentJWT = sessionStorage.getItem("jwt") || localStorage.getItem("jwt");
 window.addEventListener("storage", async (event) => {
  if (useAuthStore().isLoggingOut) return;

  if (event.key === "jwt" && event.oldValue !== event.newValue) {
    console.log("🔄 [storage] JWT changé (autre tab ?), refresh forcé...");
    await this.fetchNote();
    await this.fetchFromAPI(true);
  }
});


  // 🔗 Redirection vers planning
  this.$nextTick(() => {
    const link = document.getElementById("planning-link");
    if (link) {
      link.addEventListener("click", () => {
        this.$router.push("/Planning");
      });
    } else {
      console.warn("🚫 Lien 'planning-link' non trouvé.");
    }
  });

  this.handlePlanningClick = (e) => {
    if (e.target && e.target.id === "planning-link") {
      this.$router.push("/Planning");
    }
  };
}

,

  beforeRouteEnter(to, from, next) {
    next(vm => {
      vm.loadNoteFromCacheThenSync(); // 🔁 Recharge la note à chaque retour
    });
  },
beforeUnmount() {
  window.removeEventListener("beforeunload", this.saveNoteOnUnload);

  

},
  methods: {
      isValidJson(str) {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  },
isCourseSoon(dateString) {
  if (!dateString) return false;

  try {
    const courseDate = new Date(dateString);
    if (isNaN(courseDate)) return false;

    const now = new Date();
    const diffMinutes = (courseDate - now) / (1000 * 60);
    return diffMinutes > 0 && diffMinutes <= 30;
  } catch (e) {
    console.warn("⛔ isCourseSoon → date invalide :", dateString);
    return false;
  }
}


,
  getObjectif() {
    const fromPrenom = JSON.parse(localStorage.getItem(`userData_${this.prenom}`) || "{}").objectif;
    const fromEmail = JSON.parse(localStorage.getItem(`userData_${this.email}`) || "{}").objectif;
    
    const fromUserInfos = JSON.parse(localStorage.getItem(`userInfos_${this.prenom}`) || "{}").objectif;

    return (
      fromPrenom ||
      fromEmail ||
      fromUserInfos ||
      "🎯 Aucun objectif défini"
    );
  },
  createRouterLinkCard(text, route) {
  return {
    render() {
      const RouterLink = resolveComponent("router-link");
      return h("span", { class: "no-course-text" }, [
        text,
        h("br"),
        "👉 ",
        h(RouterLink, { to: route, class: "planning-link" }, { default: () => "Réserver un cours maintenant" })
      ]);
    }
  };
}
,
attachPlanningLink() {
  const el = document.getElementById("planning-link");
  console.log("attachPlanningLink called — el:", el);
  if (el) {
    el.addEventListener("click", () => {
      console.log("planning-link clicked");
      this.$router.push("/planning");
    });
  } else {
    console.warn("🚫 Lien 'planning-link' non trouvé.");
  }
}

,
    async saveNoteOnUnload(event) {
        if (this.note.trim() !== "" && this.isLoggedIn) {
            console.log("💾 Sauvegarde de la note avant de quitter la page...");
            await this.updateNote(); // 🔥 Force l'envoi de la note avant le départ
        }
    },
    getProxyPostURL(route) {
  const baseURL = `https://script.google.com/macros/s/${route}`;
  return `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(baseURL)}`;
},
    getProxyURL(route, params = {}) {
  const baseURL = `https://script.google.com/macros/s/${route}`;
  const query = new URLSearchParams(params).toString();
  const fullURL = `${baseURL}?${query}`;
  return `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(fullURL)}`;
},
    getUserRole() {
    let jwt = sessionStorage.getItem("jwt") || localStorage.getItem("jwt");
    if (!jwt) return null;

    try {
      let decoded = jwtDecode(jwt);
      return decoded.role || "user"; // Retourne "user" par défaut si absent
    } catch (error) {
      console.error("❌ Erreur lors du décodage du JWT :", error);
      return null;
    }
  },
    syncCache(event) {
    if (event.key === `userData_${this.prenom}`) {
      console.log("🔄 Mise à jour du cache détectée dans un autre onglet, rechargement des données...");
      this.loadUserData();
    }
  },
  insertEmoji(event) {
      this.note += event.detail.unicode; // Ajoute l'emoji à la fin du texte
    },
async loadUserData() {
  const cachedData = getCache(this.cacheKey);
  console.log("📂 Données récupérées du cache :", cachedData);

  const isValid = this.isCacheValid(cachedData);
  console.log("✅ Cache valide ?", isValid);

  if (isValid) {
    this.updateData(cachedData);

    const planningKey = `userPlanning_${this.prenom}`;
    const planningData = localStorage.getItem(planningKey);
    if (planningData) {
      const parsed = JSON.parse(planningData);
      cachedData.planning = parsed.planning;
      cachedData.prochainCours = parsed.prochainCours;

      this.updateData(cachedData); // re-update si planning dispo
    }

    localStorage.setItem(this.cacheKey, JSON.stringify(cachedData));
    return true;
  }

  console.warn("⚠️ Cache invalide ou expiré, appel API forcé !");
  await this.fetchFromAPI(true);
  return false;
}







,
onNoteInput() {
  const noteKey = `userNote_${this.prenom}`;
  localStorage.setItem(noteKey, this.note); // ✅ Màj immédiate

  if (this.debounceTimer) clearTimeout(this.debounceTimer);
  this.debounceTimer = setTimeout(() => {
    this.updateNote(); // 🔄 Appel différé
  }, 1200);
}

,
formatDateISO(isoString) {
  if (!isoString) return "Date inconnue";

  const dateObj = new Date(isoString);
  
  // Vérification si la date est invalide
  if (isNaN(dateObj.getTime())) {
    console.error("❌ Date invalide détectée :", isoString);
    return "Date invalide";
  }

  const options = { weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" };
  
  return dateObj.toLocaleString("fr-FR", options);
}
,

getDayName(dateString) {
  if (!dateString) return "";

  const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const dateObj = new Date(dateString);

  if (isNaN(dateObj)) return "Date invalide";

  return days[dateObj.getDay()];
}
,

getFormattedDate(dateString) {
  if (!dateString) return "";
  const dateObj = new Date(dateString);
  if (isNaN(dateObj)) return "Date invalide";

  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();

  return `${day}/${month}/${year}`;
},

getFormattedTime(dateString) {
  if (!dateString) return "";
  const dateObj = new Date(dateString);
  if (isNaN(dateObj)) return "Heure invalide";

  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");

  return `${hours}h${minutes}`;
},



getMonthName(monthNumber) {
  const months = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"
  ];
  
  return months[parseInt(monthNumber, 10) - 1];
}
,
async forceUpdateCache(options = {}) {
  const { forcePlanning = false } = options;

  try {
    console.log("🔄 forceUpdateCache appelée");
    await this.fetchFromAPI(forcePlanning);
  } catch (err) {
    console.error("❌ Erreur forceUpdateCache :", err);
  }
}



,
async loadNoteFromCacheThenSync() {
  this.isNoteLoading = true; // ✅ Démarre le chargement

  const noteKey = `userNote_${this.prenom}`;
  const cachedNote = localStorage.getItem(noteKey);

  if (cachedNote) {
    this.note = cachedNote;
    console.log("🧠 Note trouvée dans localStorage :", this.note);
    this.isNoteLoading = false; // ✅ On affiche le champ car on a une note
  } else {
    console.log("❌ Aucune note en cache, on attend la sync...");
    try {
      await this.syncNoteWithAPI(); // 🕒 Attend la réponse API
      const freshNote = localStorage.getItem(noteKey) || "";
      this.note = freshNote;
    } catch (e) {
      console.warn("⚠️ Erreur durant sync API :", e);
    } finally {
      this.isNoteLoading = false;
    }
  }
}




,
async syncNoteWithAPI() {
  const jwt = await getValidToken();
  if (!jwt) return;

  const proxyURL = this.getProxyURL(this.routes.GET, {
    route: "getnote",
    jwt
  });

  this.isNoteLoading = true;

  try {
    const response = await fetch(proxyURL, { cache: "no-store" });
    const contentType = response.headers.get("content-type") || "";
    const raw = await response.text();

    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}: ${raw}`);
      return;
    }

    if (!contentType.includes("application/json")) {
      console.error("❌ Réponse non-JSON :", raw);
      return;
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("❌ JSON invalide :", e);
      return;
    }

    const newNote = data.note || data.notes?.[0]?.note || "";
    const noteKey = `userNote_${this.prenom}`;
    const cachedNote = localStorage.getItem(noteKey);

    console.log("📌 Note key utilisée :", noteKey);
    console.log("🧠 Note trouvée dans localStorage :", cachedNote);

    // On commence par afficher ce qui existe déjà
    this.note = cachedNote || "";

    // 🧹 ————————————————————————————————————————————
    //     Si la note API est VIDE → on supprime la carte & la note
    // ——————————————————————————————————————————————
    if (!newNote.trim()) {
      console.log("ℹ️ Note API vide → suppression éventuelle de la carte.");

      // Remove card if exists
      this.cards = this.cards.filter(c => c.title !== "Ta dernière note");

      // Clean local cache
      localStorage.setItem(noteKey, "");

      this.note = "";
      return;
    }

    // 🟢 Si la note API est NON vide mais différente → mise à jour
    if (newNote !== cachedNote) {
      console.log("🔁 Nouvelle note reçue :", newNote);

      this.note = newNote;
      localStorage.setItem(noteKey, newNote);

      // 🔄 Met à jour ou crée la carte
      const existing = this.cards.find(c => c.title === "Ta dernière note");

      if (existing) {
        existing.text = newNote;
      } 
    } else {
      console.log("🟢 Note inchangée");
    }

  } catch (err) {
    console.error("❌ Erreur API note :", err);
  } finally {
    this.isNoteLoading = false;
    console.log("✅ Fin du chargement de la note");
  }
}


,
async fetchNote(forceRefresh = false) {
  console.log("📝 Vérification de la note...");

  const noteKey = `userNote_${this.prenom}`;
  this.isRefreshingNote = forceRefresh;
this.isNoteLoading = true;

  // 🔁 Si pas de force refresh, charge la note du cache dédié
if (!forceRefresh) {
  const localNote = localStorage.getItem(noteKey);
  if (localNote) {
    this.note = localNote;
    console.log("🟢 Note chargée localement");
    // ❌ surtout pas de return !
  }
}



  // 🔐 Vérification JWT
const auth = useAuthStore();
let jwt = auth.jwt || sessionStorage.getItem("jwt") || localStorage.getItem("jwt");

if (!jwt) {
  console.warn("🧪 Aucun JWT détecté, tentative getValidToken()…");
  jwt = await getValidToken();
}

if (!jwt) {
  console.warn("🔒 JWT manquant ou invalide, redirection !");
  router.replace("/login");
  return;
}

auth.jwt = jwt; // sync si jamais obtenu depuis getValidToken


  const proxyURL = this.getProxyURL(this.routes.GET, { route: "getnote", jwt });
  console.log("📡 URL de la requête API corrigée : ", proxyURL);

  try {
    const response = await fetch(proxyURL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      },
    });

   const text = await response.text();

if (text.startsWith('<!DOCTYPE html>')) {
  console.warn("❌ Réponse HTML détectée à la place de JSON !");
  console.warn("🧾 HTML reçu :", text.slice(0, 100));
  return; // ou affiche un toast d'erreur
}

const data = JSON.parse(text); // à faire ensuite
    console.log("📡 Data payload reçue :", data);

    if (data.note !== undefined || (data.notes && data.notes.length)) {
      const noteFromAPI = data.note || data.notes[0].note || "";
      this.note = noteFromAPI;

      localStorage.setItem(noteKey, this.note); // ✅ Sauvegarde séparée

      this.noteUpdatedMessage = "✅ Note mise à jour !";
      setTimeout(() => {
        this.noteUpdatedMessage = "";
      }, 3000);
    }
  } catch (error) {
    console.error("❌ Erreur API Bloc-Note :", error);
  } finally {
  this.saving = false;
  this.isRefreshingNote = false;
  this.isNoteLoading = false; // ← 🔥 C'est CE flag qui fait basculer l'affichage du champ textarea
  this.isLoading = false;
}

}




,
// 🔥 Autosave de la note (avec délai pour éviter spam API)
async updateNote() {
  const noteKey = `userNote_${this.prenom}`;
  localStorage.setItem(noteKey, this.note.trim()); // sauvegarde locale immédiate

  const jwt = await getValidToken();
  if (!jwt) {
    console.warn("🔒 JWT expiré ou absent → autosave annulée");
    return;
  }

  // Empêche plusieurs autosaves simultanées
  if (this.debounceTimer) clearTimeout(this.debounceTimer);

  this.debounceTimer = setTimeout(async () => {
    this.saving = true;

    try {
      const url = this.getProxyPostURL(this.routes.POST);
      const payload = {
        route: "updatenote",
        jwt,
        note: this.note.trim()
      };

      console.log("📤 Autosave note :", payload);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("✅ Autosave API :", data);

      if (data.status !== "success") {
        console.error("❌ Autosave API error :", data.message);
      }
    } catch (error) {
      console.error("❌ Autosave Bloc-Note erreur :", error);
    } finally {
      this.saving = false;
    }
  }, 1500); // <-- délai autosave plus fluide
}, // 🔥 Mettre à jour la note en temps réel (autosave)

// ⚡ Sauvegarde immédiate de la note (pour changement de page)
async saveNoteImmediately() {
  const noteKey = `userNote_${this.prenom}`;
  localStorage.setItem(noteKey, this.note.trim()); // sauvegarde locale

  // ✅ Utilise le JWT déjà présent dans le store si possible
  let jwt = this.$store?.jwt || this.jwt; // ou authStore.jwt si Pinia
  if (!jwt || isJwtExpired(jwt)) {
    // ⚠️ JWT absent ou expiré → essaie un refresh, mais sans boucle infinie
    jwt = await refreshToken(); // refreshToken gère déjà le verrou
    if (!jwt) {
      console.warn("🔒 JWT expiré → impossible de sauvegarder immédiatement");
      return;
    }
  }

  this.saving = true;

  try {
    const url = this.getProxyPostURL(this.routes.POST);
    const payload = {
      route: "updatenote",
      jwt,
      note: this.note.trim()
    };

    console.log("📤 SAUVEGARDE INSTANTANÉE de la note :", payload);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("✅ Réponse API instantanée :", data);

    if (data.status !== "success") {
      console.error("❌ Erreur sauvegarde immédiate :", data.message);
    }
  } catch (error) {
    console.error("❌ Erreur sauvegarde instantanée :", error);
  } finally {
    this.saving = false;
  }
}
,



async fetchStudentData() {
  const cachedData = localStorage.getItem(this.cacheKey);
  const cacheExpiration = parseInt(localStorage.getItem(this.cacheExpirationKey), 10);

  if (cachedData && cacheExpiration && Date.now() < cacheExpiration) {
    try {
      const parsedData = JSON.parse(cachedData);
      console.log("⚡ Chargement rapide depuis le cache.");
      this.updateData(parsedData);
      this.isLoading = false;
      return;
    } catch (error) {
      console.error("❌ Erreur parsing cache :", error);
      this.clearCache(); // Supprime le cache corrompu
    }
  }

  await this.fetchFromAPI();
}

,
clearNote() {
  console.log("🧹 Nettoyage de la note...");
  const noteKey = `userNote_${this.prenom}`;
  
  this.note = ""; // Reset UI
  localStorage.removeItem(noteKey); // ✅ Supprime la clé dédiée

  // 🔐 Envoi à l'API si connecté
  const jwt = sessionStorage.getItem("jwt") || localStorage.getItem("jwt");
  if (jwt) {
    this.sendEmptyFeedbackInBackground(jwt);
  } else {
    console.warn("🚫 Non connecté, note vidée localement uniquement.");
  }
}


,

formatDate(dateString) {
  if (!dateString) return "Date inconnue";

  const [day, month, yearAndTime] = dateString.split("/");
  const [year, time] = yearAndTime.split(" ");

  return `📅 ${day}/${month}/${year} à ${time}`;
}
,
async sendEmptyFeedbackInBackground(jwt) {
  try {
    const url = this.getProxyPostURL(this.routes.POST);
    const payload = { route: "updatenote", jwt, note: "" };
    console.log("📤 Envoi de la note vide :", payload);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("✅ Réponse API mise à jour :", data);

    if (data.status === "success") {
      console.log("✅ Note supprimée avec succès !");
    } else {
      console.error("❌ Erreur suppression :", data.message);
    }
  } catch (error) {
    console.error("❌ Erreur API ClearNote :", error);
  }
}

,
async fetchFromAPI(forceRefresh = false) {
  const auth = useAuthStore();
  if (auth.isLoggingOut) return;

  if (sessionStorage.getItem(`nonInscrit_${this.prenom}`)) {
    console.log("⛔ Élève identifié comme non inscrit, on évite l’API.");
    this.displayError();
    this.isLoading = false;
    return;
  }

  const nonInscritTime = parseInt(sessionStorage.getItem(`nonInscrit_${this.prenom}`), 10);
  const now = Date.now();
  const retryAfter = 5 * 60 * 1000;

  if (!isNaN(nonInscritTime) && now - nonInscritTime < retryAfter) {
    console.log("⛔️ Élève déjà détecté comme non inscrit récemment. API ignorée.");
    this.displayError();
    this.isLoading = false;
    return;
  }

  if (!forceRefresh && !shouldUpdateCache(this.cacheKey, this.cacheDuration)) {
    console.log("✅ Cache encore valide, pas d'appel API.");
    return;
  }

  let cachedData = JSON.parse(localStorage.getItem(this.cacheKey)) || {};
  if (!this.email) this.email = localStorage.getItem("email");
  if (!this.prenom) this.prenom = localStorage.getItem("prenom");

  if (!this.email || !this.prenom) {
    console.warn("⚠️ Email ou prénom manquant, récupération via JWT...");
    const userInfo = getUserInfoFromJWT();
    if (userInfo.email) this.email = userInfo.email;
    if (userInfo.prenom) this.prenom = userInfo.prenom;
  }

  if (!this.email || !this.prenom) {
    console.error("❌ Email et prénom introuvables.");
    this.isLoading = false;
    return;
  }

  const jwt = await getValidToken();
  if (!jwt) {
    console.warn("🔒 JWT expiré ou absent, redirection !");
    router.replace("/login");
    return;
  }

  try {
    let fixedPrenom = this.prenom;
    try {
      fixedPrenom = decodeURIComponent(escape(fixedPrenom));
    } catch (e) {
      console.warn("⚠️ Pas besoin de corriger UTF-8, prénom lisible.");
    }

    const encodedPrenom = encodeURIComponent(fixedPrenom);
    const url = this.getProxyURL(this.routes.GET, {
      route: "planning",
      jwt,
      email: this.email,
      prenom: encodedPrenom
    });

    console.log("📡 URL API :", url);

    const response = await fetch(url, { cache: "no-store" });

    const contentType = response.headers.get("content-type") || "";
    const rawText = await response.text();

    if (!response.ok || !contentType.includes("application/json")) {
      console.warn("⚠️ Réponse non-JSON ou status HTTP erreur :", response.status, contentType);
      console.warn("🔎 Contenu brut reçu :", rawText.slice(0, 200));
      this.isLoading = false;
      return;
    }

    const data = JSON.parse(rawText);
    console.log("📡 Data payload reçue :", data);

    if (data.error === "Élève non inscrit") {
      sessionStorage.setItem(`nonInscrit_${this.prenom}`, Date.now().toString());
      console.warn("ℹ️ Élève connecté mais pas encore inscrit à un cours.");
      this.displayError();
      this.isLoading = false;
      return;
    }

    if (data.error === "Aucune donnée trouvée pour cet utilisateur") {
      console.warn("ℹ️ Utilisateur sans données (pas encore actif ?)");
      this.cards = [
        {
          icon: "bi bi-calendar-event",
          title: "Prochain Cours",
          text: `🎸 Aucun cours prévu pour le moment.<br>
            <div class="planning-bouton" onclick="window.vueRouterPush && window.vueRouterPush('/Abonnements')"> 📅 Réserver un cours </div>`
        },
        {
          icon: "bi bi-flag",
          title: "Objectif actuel",
          text: `🎯 Aucun objectif défini.<br>
            👉 Prends un cours pour qu’on le définisse ensemble.`
        }
      ];
      this.isLoading = false;
      return;
    }

    const payload = data;

    Object.keys(payload).forEach(key => {
      if (payload[key] !== null && payload[key] !== undefined) {
        cachedData[key] = payload[key];
      }
    });

    localStorage.setItem(this.cacheKey, JSON.stringify(cachedData));
    console.log("📦 Données avant updateData :", cachedData);
    this.updateData(cachedData);
  } catch (error) {
    console.error("❌ Erreur API (fetchFromAPI) :", error);
  } finally {
    this.isLoading = false;
  }
}










,


isCacheValid(data) {
  console.log("🧪 Vérif validité cache :", data);

  if (!data || typeof data !== "object") {
    console.error("❌ Cache invalide détecté : Données absentes ou incorrectes.");
    return false;
  }

  if (data.status === "error" || data.error) {
    if (data.error === "Aucun lien Meet trouvé") {
      console.warn("⚠️ Aucun lien Meet trouvé, mais ce n'est pas une erreur critique.");
      return true;
    }

    console.error("❌ Cache invalide détecté :", data.error || data.message);
    return false;
  }

  // 🔍 On récupère aussi les données utilisateur secondaires (objectif, drive, etc)
  const userInfosKey = `userInfos_${this.prenom}`;
  const userInfos = JSON.parse(localStorage.getItem(userInfosKey) || "{}");

  const hasValidObjectif =
    typeof data.objectif === "string" ||
    typeof userInfos.objectif === "string";

  const hasValidPlanning =
    Array.isArray(data.planning) &&
    data.planning.some(c => {
      const d = new Date(c.date);
      return d instanceof Date && !isNaN(d);
    });

  console.log("📆 planning ok ?", hasValidPlanning);
  console.log("🎯 objectif ok ?", hasValidObjectif);

  // ✅ N'importe lequel suffit pour considérer le cache valide
  return hasValidPlanning || hasValidObjectif;
}
,

    updateData(data) {
      console.log("🧠 updateData appelée avec :", data);
  console.trace("🧵 Trace appel updateData");
if (this.cards.some(card => card.renderAsComponent) && !this.$route.meta.forceRefresh) {
  return;
}


      if (sessionStorage.getItem(`nonInscrit_${this.prenom}`)) {
  console.log("✅ Élève non inscrit → cards = version spéciale avec objectif si dispo");

  const userInfosKey = `userInfos_${this.prenom}`;
  const userInfos = JSON.parse(localStorage.getItem(userInfosKey) || "{}");

  const objectif = userInfos.objectif || `
  Ton objectif musical n'a pas encore été défini.<br>
  🧭 <div 
    class='planning-bouton mt-2 d-inline-block' 
    onclick="window.vueRouterPush && window.vueRouterPush('/Abonnements')"
  >
    Prendre un cours
  </div> 
`;

if (this.cards.some(card => card.renderAsComponent)) {
  console.log("🛑 Cartes personnalisées déjà définies (non inscrit), on ne les écrase pas.");
  return;
}

  this.cards = [
    {
      icon: "bi bi-calendar-event",
      title: "Prochain Cours",
     text: `🎸 Aucun cours prévu pour le moment.<br>
<div class="planning-bouton" onclick="window.vueRouterPush && window.vueRouterPush('/Abonnements')"> 📅 Réserver un cours </div>

                `
    },
    {
      icon: "bi bi-flag",
      title: "Objectif actuel",
  text: this.getObjectif()
    }
  ];

  return; // 🚫 Stoppe ici pour ne pas injecter d'autres données
}

      console.log("🧠 updateData() appelée avec :", data);
    console.log("📌 Mise à jour des cartes...");
    console.log("📡 Data reçue :", data);

;
    // 🔍 Récupération du cache actuel
    let cachedData = localStorage.getItem(this.cacheKey);
    cachedData = cachedData ? JSON.parse(cachedData) : {};

    let userInfosKey = `userInfos_${this.prenom}`;
    let cachedInfos = localStorage.getItem(userInfosKey);
    cachedInfos = cachedInfos ? JSON.parse(cachedInfos) : {};

    // 🔄 Fusion des anciennes et nouvelles données (hors espace_google_drive et playlist_youtube)
    const updatedData = { 
        ...cachedData,
        ...data,
    };

  // ✅ Stocker espace_google_drive, playlist_youtube et objectif dans userInfos_{prenom}
  if (data.espace_google_drive !== undefined) {
        cachedInfos.espace_google_drive = data.espace_google_drive;
    }
    if (data.playlist_youtube !== undefined) {
        cachedInfos.playlist_youtube = data.playlist_youtube;
    }
    if (data.objectif !== undefined) {
        cachedInfos.objectif = data.objectif; // 🔥 Sauvegarde de l'objectif
    }

    console.log("💾 Sauvegarde du cache mise à jour :", updatedData);
    localStorage.setItem(this.cacheKey, JSON.stringify(updatedData));
// ✅ Sauvegarde planning & prochainCours séparément
if (updatedData.planning || updatedData.prochainCours) {
  const planningKey = `userPlanning_${this.prenom}`;
  const planningData = {
    planning: updatedData.planning,
    prochainCours: updatedData.prochainCours,
  };
  localStorage.setItem(planningKey, JSON.stringify(planningData));
}

    console.log("💾 Sauvegarde des infos séparées :", cachedInfos);
    localStorage.setItem(userInfosKey, JSON.stringify(cachedInfos));

    // 📌 Mise à jour des cartes (exemple pour Dashboard)
 // 📌 Mise à jour des cartes (exemple pour Dashboard)
if (!Array.isArray(updatedData.planning) || updatedData.planning.length === 0) {
  this.cards = [
    {
      icon: "bi bi-calendar-event",
      title: "Prochain Cours",
      renderAsComponent: {
 render() {
  const RouterLink = resolveComponent("router-link"); // 👈 Résout le composant correctement

  return h("span", { class: "no-course-text" }, [

    "🎸 Aucun cours prévu pour le moment.",
    h("br"),
    "👉 ",
    h(
      RouterLink,
      { to: "/Abonnements", class: "planning-link" },
      { default: () => "Réserver un cours maintenant" }
    )
  ]);
}
      }
    },
    {
      icon: "bi bi-flag",
      title: "Objectif actuel",
      text: updatedData.objectif || "🎯 Aucun objectif défini"
    }
  ];
  return;
}



    // 📌 Trouver le prochain cours
    const now = new Date();
const prochainCours = updatedData.planning.find(cours => new Date(cours.date) > now);
updatedData.prochainCours = prochainCours; // ✅ injecte dans ce que tu sauvegardes

localStorage.setItem(this.cacheKey, JSON.stringify(updatedData)); // ✅ tu stockes bien ce qu’il faut
console.log("💾 Sauvegarde du cache mise à jour :", updatedData);


    if (!prochainCours) {
        this.cards = [
            {
                icon: "bi bi-calendar-event",
                title: "Prochain Cours",
                text: `🎸 Aucun cours prévu pour le moment.<br>
<div class="planning-bouton" onclick="window.vueRouterPush && window.vueRouterPush('/Abonnements')"> 📅 Réserver un cours </div>

                `
            },
            {
                icon: "bi bi-flag",
                title: "Objectif actuel",
                 text: this.getObjectif()
            }
        ];
        return;
    }

    console.log("🎯 Prochain cours sélectionné :", prochainCours);

    this.cards = [
    {
        icon: "bi bi-calendar-event",
        title: "Prochain Cours",
text: `
  <div class="course-date mb-2">
    📅 ${this.getDayName(prochainCours.date)} ${this.getFormattedDate(prochainCours.date)} à ${this.getFormattedTime(prochainCours.date)}
  </div>

  <div class="meet-button-wrapper">
    <button class="btn-join-course ${this.isCourseSoon(prochainCours.date) ? 'urgent' : ''}"
      onclick="window.open('${prochainCours.meet}', '_blank')">
      🎥 Rejoindre le cours
    </button>
    ${this.isCourseSoon(prochainCours.date) ? '<div class="pulse-badge"></div>' : ''}
  </div>

  <div class="planning-link mt-2" onclick="window.vueRouterPush && window.vueRouterPush('/planning')">
    📅 Voir le planning des cours
  </div>

  <div class="planning-link" onclick="window.vueRouterPush && window.vueRouterPush('/feedback')">
    💬 Voir mon dernier feedback
  </div>
`



    },
        {
            icon: "bi bi-flag",
            title: "Objectif actuel",
  text: this.getObjectif() // ✅ utilise la computed !
        }
    ];
    this.$nextTick(() => this.attachPlanningLink()); // ✅ ICI !

}








,

displayError() {
  const prenom = this.prenom || localStorage.getItem("prenom") || "";
  const userInfosKey = `userInfos_${prenom}`;
  console.log("🔑 Clé recherchée dans localStorage :", userInfosKey);

const userInfosRaw = localStorage.getItem(userInfosKey);
const userDataRaw = localStorage.getItem(`userData_${this.email}`); // ✅ fallback
const userInfos = JSON.parse(userInfosRaw || "{}");
const userData = JSON.parse(userDataRaw || "{}");

const objectif =
  userInfos.objectif ||
  userData.objectif ||
  `
    Ton objectif musical n'a pas encore été défini.<br>
  `;

 this.cards = [
  {
    icon: "bi bi-calendar-event",
    title: "Prochain Cours",
renderAsComponent: this.createRouterLinkCard("Tu n'as pas encore de cours prévu.", "/Abonnements")

  },
  {
    icon: "bi bi-flag",
    title: "Objectif actuel",
    text: objectif
  }
];

}

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

</style>
// ============================================================================
// 🏛️ AUTH STORE — VERSION PRO
// Gère : JWT, RefreshToken, SessionID, User, Cache, Auto-Refresh Silent
// Compatibilité totale avec Apps Script (refresh, recupinfosmembres, logout).
// ============================================================================

import { defineStore } from "pinia";
import { readKV, saveSessionData, getSessionIdFromDB } from "@/utils/AuthDBManager.ts";
import {
  getValidToken,
  refreshToken,
  logoutUser,
  isJwtExpired,
  decodeJwt
} from "@/utils/api.ts";
const REFRESH_OWNER_KEY = "sbs_refresh_owner"
const REFRESH_PING_KEY  = "sbs_refresh_ping"
const SAFE_USER_CACHE_KEYS = [
  "prenom",
  "nom",
  "email",
  "telephone",
  "objectif",
  "playlist_youtube",
  "espace_google_drive",
  "avatar"
]

let _refreshTimer = null;
let _refreshPromise = null;

// ============================================================================
// 🏛️ STORE
// ============================================================================
export const useAuthStore = defineStore("auth", {

  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------
  state: () => ({
    menuOpen: false,
 jwtReady: false,
    jwt: localStorage.getItem("jwt") || null,
    refreshToken: localStorage.getItem("refreshToken") || null,
    sessionId: localStorage.getItem("sessionId") || null,

    user: null,                 // Données utilisateur
    role: null,                 // Rôle utilisateur (admin / adherent / etc)

    pendingReportsCount: 0,     // nombre de demandes de report de cours en attente

    impersonateStudent: localStorage.getItem("impersonateStudent") === "true",

    authReady: false,           // L'app est prête
               // Le JWT est prêt pour l'UI
    authLoading: false,         // Flag de chargement (login / fetch user ...)

    isRefreshingToken: false,   // Flag pour empêcher un double refresh simultané
    refreshFailed: false,       // Indique si un refresh a échoué (1 fois)
    isLoggingOut: false,        // Flag pour empêcher double logout
    isInitDone: false,          // initAuth est terminé

    _refreshInterval: null,     // Timer pour auto-refresh
  }),

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------
  getters: {
    // ✅ Est-ce que l'utilisateur est considéré comme connecté ?
    isLoggedIn(state) {
      // 1) Pas de JWT → non connecté
      if (!state.jwt) return false;

      // 2) Si on est en train de refresh → on considère la session comme active
      if (state.isRefreshingToken) return true;

      // 3) Si logout en cours → non connecté
      if (state.isLoggingOut) return false;

      // 4) Si init terminé, user doit être chargé
      if (state.isInitDone && !state.user) return false;

      // 5) Vérifier l’expiration du token (payload.exp)
      try {
        const payload = JSON.parse(atob(state.jwt.split('.')[1]));
        return Date.now() < payload.exp * 1000;
      } catch {
        // JWT mal formé → non connecté
        return false;
      }
    },

    // 👑 Est-ce que l'utilisateur est admin (et pas en mode impersonation) ?
    isAdmin: (state) => {
      if (!state.user) return false;
      if (state.impersonateStudent) return false;
      return state.user.role === "admin";
    },

    // 👨‍🏫 Est-ce que l'utilisateur est prof (ou admin + prof_id) ?
    isProf(state) {
      if (!state.user) return false;
      if (state.impersonateStudent) return false;
      return state.user.role === "prof" || (state.user.role === "admin" && state.user.prof_id);
    },

    // 👨‍🎓 Est-ce que l'utilisateur est un élève ?
    isEleve(state) {
      if (!state.user) return false;
      return state.user.role === "eleve";
    },

    // 🔥 Indique si le JWT arrive à expiration dans moins de 5 minutes
    needsRefresh: (state) => {
      if (!state.jwt) return false;
      try {
        const payload = JSON.parse(atob(state.jwt.split('.')[1]));
        const expiresIn = payload.exp * 1000 - Date.now();
        return expiresIn < 5 * 60 * 1000; // 5 minutes
      } catch {
        return false;
      }
    }
  },

  // --------------------------------------------------------------------------
  // ACTIONS
  // --------------------------------------------------------------------------
  
  actions: {
    // ⏏️ Ouvre ou ferme le menu de navigation
    toggleMenu() {
      this.menuOpen = !this.menuOpen;
      localStorage.setItem("menuOpen", this.menuOpen ? "true" : "false");
    },

    // 🎭 Active ou désactive le mode “impersonation” de l’élève
    toggleImpersonateStudent() {
      this.impersonateStudent = !this.impersonateStudent;
      // (on ne stocke pas dans LS ici, mais tu peux le faire si besoin)
    },

    // 📥 Charge le nombre de demandes de report de cours via un endpoint externe
    async fetchPendingReports() {
      try {
        const jwt = this.jwt;
        if (!jwt) return;

        const url = `https://script.google.com/macros/s/AKfycbyEXzfQ7iiR7TE-R0kaSZ7HBp_2TyOThRhqXm4_B6knM52AN3z3OEy5xIUgYLMAsaMOGw/exec?route=getReports&jwt=${encodeURIComponent(jwt)}`;
        const proxy = `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(url)}`;

        const res = await fetch(proxy);
        const data = await res.json();

        if (data.success && Array.isArray(data.reports)) {
          this.pendingReportsCount = data.reports.filter(r => r.status === "DEMANDE").length;
        }
      } catch (e) {
        console.error("❌ fetchPendingReports error:", e);
      }
    },

    // ♻️ Essaye de restaurer la session depuis IndexedDB (ou fallback localStorage)
async restoreSessionFromStorage() {
  // ⚠️ NE PAS TOUCHER sessionId s’il est déjà défini
  if (this.sessionId) {
    console.warn("🔒 SessionId déjà présent, restauration ignorée :", this.sessionId);
    return;
  }

  const jwtDB = await readKV("jwt");
  const rtDB = await readKV("refreshToken");
  const sidDB = await readKV("sessionId");

  const jwt = localStorage.getItem("jwt") ?? jwtDB ?? null;
  const rt = localStorage.getItem("refreshToken") ?? rtDB ?? null;
  const sid = localStorage.getItem("sessionId") ?? sidDB ?? null;

  this.jwt = jwt;
  this.refreshToken = rt;

  if (sid) {
    this.sessionId = sid;
    console.log("♻️ sessionId restauré :", sid);
  }
}

,

    // 🧪 (Compat legacy) Permet de définir un JWT manuellement depuis l'extérieur (ex: api.ts)
    setUserToken(jwt) {
      this.jwt = jwt;
      localStorage.setItem("jwt", jwt);
    },

    // 💾 Sauvegarde sécurisée des infos de session (jwt, refreshToken, sessionId, sans user)
    async setSessionData({ jwt, refreshToken, sessionId, userData = null }) {
      // Mise à jour du JWT si fourni
      if (jwt) {
        this.jwt = jwt;
        localStorage.setItem("jwt", jwt);
      }

      // Mise à jour du refreshToken si fourni
      if (refreshToken) {
        this.refreshToken = refreshToken;
        localStorage.setItem("refreshToken", refreshToken);
      }

      // Détermination de la sessionId finale
    // 🔥 SOURCE DE VÉRITÉ = BACKEND
if (!sessionId) {
  throw new Error("❌ sessionId manquant depuis le backend")
}
if (this.sessionId && this.sessionId !== sessionId) {
  console.warn("⚠️ sessionId différent détecté ! Ancien =", this.sessionId, "| Nouveau =", sessionId)
}
this.sessionId = sessionId
localStorage.setItem("sessionId", sessionId)



      // Si des données user sont fournies, on fusionne avec l'existant
      if (userData) {
        this.user = { ...(this.user || {}), ...userData };
      }

      // Sauvegarde dans IndexedDB (sans userData complet)
      await saveSessionData({
        jwt: this.jwt || "",
        refreshToken: this.refreshToken || "",
        sessionId: this.sessionId || "",
        userData: null
      });
    },

    // 👤 Récupère les données utilisateur depuis l'API (Apps Script) en utilisant JWT
   async fetchUserData() {
  if (!this.jwt) return false;

  const jwtString = typeof this.jwt === "string" ? this.jwt : this.jwt?.jwt;
  if (!jwtString || typeof jwtString !== "string") {
    console.warn("⛔ fetchUserData : JWT invalide :", this.jwt);
    return false;
  }

  const routeID = "AKfycbyEXzfQ7iiR7TE-R0kaSZ7HBp_2TyOThRhqXm4_B6knM52AN3z3OEy5xIUgYLMAsaMOGw";
  const rawUrl = `https://script.google.com/macros/s/${routeID}/exec?route=recupinfosmembres&jwt=${encodeURIComponent(jwtString)}`;
  const url = `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(rawUrl)}`;

  this.authLoading = true;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data?.email) {
      console.warn("⚠️ fetchUserData : données invalides");
      return false;
    }

    // 1️⃣ Décodage JWT → source prioritaire pour role & prof
    const payload = decodeJwt(jwtString);

    const jwtRole = payload?.role ?? null;
    const jwtProfId = payload?.prof_id ?? null;
    const jwtUserId = payload?.user_id ?? null;

    // 🔥 Harmonisation rôle : backend renvoie "statut", JWT renvoie "role"
let finalRole = null;

// 1) Role du JWT prioritaire
if (jwtRole) {
  finalRole = jwtRole;
}

// 2) Sinon role backend via "statut"
else if (data.statut) {
  finalRole = data.statut.toLowerCase(); // ADMIN → admin
}

// 3) Fallback : data.role
else if (data.role) {
  finalRole = data.role.toLowerCase();
}

    // 2️⃣ User final (clean)
    const builtUser = {
      ...data,

      playlist_youtube: data.youtube || "",
      espace_google_drive: data.drive || "",
      objectif: data.objectif || "",

      // 🆕 ID utilisateur (depuis backend Membres ou JWT en fallback)
      user_id: data.user_id ?? jwtUserId ?? null,

      // 🆕 PROF_ID (backend → sinon JWT → jamais ancient store)
prof_id:
  data.prof_id !== undefined && data.prof_id !== ""
    ? data.prof_id
    : jwtProfId ?? this.user?.prof_id ?? null,

      // 🆕 ROLE (JWT > backend)
role: finalRole,
    };

    // 3️⃣ Mise à jour du store
this.user = {
  ...(this.user || {}),
  ...builtUser,

  // 🔒 IDs canoniques
  user_id: this.user?.user_id ?? builtUser.user_id ?? null,

  prof_id:
    builtUser.prof_id !== undefined && builtUser.prof_id !== null
      ? builtUser.prof_id
      : this.user?.prof_id ?? null,
};


const cacheUser = {}
for (const key of SAFE_USER_CACHE_KEYS) {
  if (builtUser[key] !== undefined) {
    cacheUser[key] = builtUser[key]
  }
}
    // 4️⃣ Cache local
    localStorage.setItem(`userData_${data.email}`, JSON.stringify(builtUser));

    return true;

  } catch (err) {
    console.error("❌ fetchUserData error :", err);
    return false;
  } finally {
    this.authLoading = false;
  }
}
,

    // 🔄 Rafraîchit le JWT + éventuellement refreshToken & sessionId
    // retry = true permet un second essai après échec
 async refreshJwt() {
  if (!this.isInitDone) {
  console.warn("⏸️ refresh ignoré → init en cours");
  return this.jwt;
}

  if (this.isLoggingOut) {
    console.warn("⛔ refreshJwt annulé → logout en cours");
    return null;
  }

  if (this.isRefreshingToken) {
    console.warn("⏳ refreshJwt ignoré → déjà en cours");
    return null;
  }

  this.isRefreshingToken = true;
  console.log("🔄 refreshJwt → start");

  try {
const result = await refreshToken({
  refreshToken: this.refreshToken,
  sessionId: this.sessionId,
  deviceId: this.sessionId // OK temporaire
});
    console.log("🧪 refreshJwt result =", result);

    // ⛔ STOP NET si refresh invalide
if (!result || !result.jwt || typeof result.jwt !== "string") {
  console.warn("❌ refreshJwt: refresh invalide → session conservée")
  this.refreshFailed = true

  if (!this.jwt || isJwtExpired(this.jwt)) {
    this.stopAutoRefresh()
  }

  return this.jwt || null
}


    // ✅ SUCCÈS RÉEL
    this.jwt = result.jwt;
    this.refreshToken = result.refreshToken || this.refreshToken;
    this.sessionId = result.sessionId || this.sessionId;

    localStorage.setItem("jwt", this.jwt);
    if (this.refreshToken)
      localStorage.setItem("refreshToken", this.refreshToken);
    if (this.sessionId)
      localStorage.setItem("sessionId", this.sessionId);

    localStorage.setItem(REFRESH_PING_KEY, Date.now().toString());

    const payload = decodeJwt(this.jwt);
    console.log("🧠 refreshJwt payload =", payload);

   // ❌ NE RIEN TOUCHER DANS user AU REFRESH
// ❌ NE PAS TOUCHER authReady / jwtReady

this.refreshFailed = false;


    //await saveSessionData({
     // jwt: this.jwt,
     // refreshToken: this.refreshToken,
     // sessionId: this.sessionId,
   // });

    console.log("✅ refreshJwt succès → JWT mis à jour");
    return this.jwt;

  } catch (err) {
  console.error("⚠️ refreshJwt FAILED (session conservée)", err)

  this.refreshFailed = true

  // ⛔ arrêt auto-refresh SEULEMENT si plus de JWT valide
  if (!this.jwt || isJwtExpired(this.jwt)) {
    console.warn("⛔ AutoRefresh stoppé → session réellement invalide")
    this.stopAutoRefresh()
  }

  return this.jwt || null
}
 finally {
    this.isRefreshingToken = false;
    console.log("🔚 refreshJwt → end");
  }
}
,

    // ⏰ Planifie l’auto‑refresh du JWT avant expiration (avec timer)



startAutoRefresh() {
  const REFRESH_OWNER_KEY = "sbs_refresh_owner"
  const OWNER_TTL = 15000 // 15s
const payload = decodeJwt(this.jwt)
const expMs = payload?.exp ? payload.exp * 1000 : 0
const now = Date.now()

const LEEWAY = 60_000
const MIN_DELAY = 15_000
const MAX_DELAY = 10 * 60_000

let REFRESH_DELAY = expMs - now - LEEWAY
REFRESH_DELAY = Math.max(MIN_DELAY, Math.min(REFRESH_DELAY, MAX_DELAY))

  // =====================================================
  // 🧱 GUARDS
  // =====================================================
  if (!this.isInitDone) {
    console.log("⏸️ [AutoRefresh] init non terminée")
    return
  }

  if (this.refreshFailed) {
    console.log("⛔ [AutoRefresh] désactivé → refreshFailed")
    return
  }

  if (!this.jwt) {
    console.log("⛔ [AutoRefresh] annulé → pas de JWT")
    return
  }

  // =====================================================
  // 🧠 TAB ID
  // =====================================================
  let tabId = sessionStorage.getItem("tab_id")
  if (!tabId) {
    tabId = crypto.randomUUID()
    sessionStorage.setItem("tab_id", tabId)
  }

  // =====================================================
  // 👑 OWNER / FOLLOWER (AVANT toute action)
  // =====================================================

  let owner = null

  const rawOwner = localStorage.getItem(REFRESH_OWNER_KEY)
  if (rawOwner) {
    try {
      owner = JSON.parse(rawOwner)
    } catch {
      localStorage.removeItem(REFRESH_OWNER_KEY)
      owner = null
    }
  }

  const ownerExpired = !owner?.ts || (now - owner.ts > OWNER_TTL)

  // takeover si onglet actif
  if (document.visibilityState === "visible" && document.hasFocus()) {
    owner = null
  }

  if (!owner || ownerExpired || owner.tabId === tabId) {
    localStorage.setItem(
      REFRESH_OWNER_KEY,
      JSON.stringify({ tabId, ts: now })
    )
    console.log("👑 [AutoRefresh] OWNER")
  } else {
    console.log("👂 [AutoRefresh] FOLLOWER")
    return
  }

  // =====================================================
  // 🧹 CLEAN TIMER (OWNER ONLY)
  // =====================================================
  if (_refreshTimer) {
    clearTimeout(_refreshTimer)
    _refreshTimer = null
  }

  // =====================================================
  // ⏳ DELAY
  // =====================================================
  console.log("🧪 [AutoRefresh] ARMÉ (delay = 5s)")

  _refreshTimer = setTimeout(async () => {
    console.log("🔥 [AutoRefresh] TIMER FIRED")

    if (this.isLoggingOut) {
      console.log("⛔ [AutoRefresh] abort → logout")
      return
    }

    if (!navigator.onLine) {
      console.log("📡 [AutoRefresh] offline → attente réseau")
      window.addEventListener(
        "online",
        () => this.startAutoRefresh(),
        { once: true }
      )
      return
    }

    if (this.isRefreshingToken) {
      console.log("⏳ [AutoRefresh] refresh déjà en cours → skip")
      return
    }

    // heartbeat owner
    localStorage.setItem(
      REFRESH_OWNER_KEY,
      JSON.stringify({ tabId, ts: Date.now() })
    )

    console.log("🔄 [AutoRefresh] déclenché")

    const jwt = await this.refreshJwt()

  if (!jwt) {
  console.warn("⛔ [AutoRefresh] refresh KO → arrêt")
  this.stopAutoRefresh()
  return
}


    console.log("✅ [AutoRefresh] succès → replanification")
    this.startAutoRefresh()

  }, REFRESH_DELAY)
}


,

stopAutoRefresh() {
  if (_refreshTimer) {
    clearTimeout(_refreshTimer)
    _refreshTimer = null
  }
}
,
    // 🔐 Déconnexion complète (backend + nettoyage local)
    async logout() {
      if (this.isLoggingOut) return;

      this.isLoggingOut = true;
      localStorage.setItem("logout_in_progress", "true");

      try {
        await logoutUser(); // appels backend / Apps Script
      } catch (err) {
        console.warn("⚠️ logoutUser erreur :", err);
      }

      // Nettoyage des données sensibles
      this.jwt = null;
      this.user = null;

      ["jwt", "refreshToken", "sessionId"].forEach(k => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });

      this.isLoggingOut = false;
      localStorage.removeItem("logout_in_progress");
    },

    // 🚀 Initialisation complète de l’auth à l'ouverture de l'app
    async initAuth() {
      this.authLoading = true;

      // 1️⃣ Restauration locale (IndexedDB / localStorage)
      await this.restoreSessionFromStorage();
      let jwt = this.jwt;


      // 2️⃣ Si JWT présent, vérifier sa validité avant tout
      const jwtIsValid = jwt && !isJwtExpired(jwt);

      if (!jwtIsValid) {
        // Essayer d'obtenir un token valide via API
        jwt = await getValidToken();
   if (!jwt) {
  // 🔥 Refresh KO → on purge tout
  this.jwt = null;
  this.user = null;

  this.refreshToken = null;
  this.sessionId = null;
  localStorage.removeItem("jwt");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("sessionId");

  this.jwtReady = true;
  this.authReady = true;
  this.authLoading = false;
  this.isInitDone = true;
  return;
}

      }
window.addEventListener("storage", (e) => {
  if (e.key !== REFRESH_PING_KEY) return

  console.log("🔄 JWT mis à jour dans un autre onglet")

  const jwt = localStorage.getItem("jwt")
  if (jwt) {
    const auth = useAuthStore()
    auth.jwt = jwt
  }
})

      // 3️⃣ Normalisation du JWT (string)
      const finalJwt = typeof jwt === "string" ? jwt : jwt?.jwt;
      this.jwt = finalJwt;
      localStorage.setItem("jwt", finalJwt);

      // 4️⃣ Le JWT est prêt → l’app peut s’afficher
      this.jwtReady = true;
      this.authReady = true;

      // Petit délai pour laisser Reactivity faire effet
      await new Promise(r => setTimeout(r, 0));

      // 5️⃣ Extraire infos du JWT
     const payload = decodeJwt(finalJwt);
const email = payload?.email;

this.user = {
  role: payload?.role ?? null,
  user_id: payload?.user_id ?? null,
  prof_id: payload?.prof_id ?? null
}
console.log("🟢 AFTER JWT BUILD", JSON.parse(JSON.stringify(this.user)))




      // 6️⃣ Charger le cache utilisateur si existant
      const cacheKey = email ? `userData_${email}` : null;
      const cached = cacheKey ? localStorage.getItem(cacheKey) : null;

      if (cached) {
       const cachedUser = JSON.parse(cached)
console.log("🟠 BEFORE CACHE MERGE", {
  base: JSON.parse(JSON.stringify(this.user)),
  cached: JSON.parse(cached)
})

// 🔥 MERGE SAFE (jamais toucher aux IDs canoniques)
const safeCache = {}

for (const key of SAFE_USER_CACHE_KEYS) {
  if (cachedUser[key] !== undefined) {
    safeCache[key] = cachedUser[key]
  }
}

this.user = {
  ...safeCache,

  // 🔒 identité = JWT ONLY
  user_id: this.user.user_id,
  prof_id: this.user.prof_id,
  role: this.user.role,
}
if (
  cachedUser.user_id ||
  cachedUser.prof_id ||
  cachedUser.role
) {
  console.warn("🧹 Cache utilisateur legacy détecté → ignoré", cachedUser)
}

;

console.log("🔵 AFTER CACHE MERGE", JSON.parse(JSON.stringify(this.user)))


        // En parallèle, récupérer des données fraîches
        setTimeout(() => this.fetchUserData(), 0);

      } else {
        // Pas de cache => fetch immédiat
        const data = await this.fetchUserData();
        if (data) Object.assign(this.user, data);
      }

      // 7️⃣ Charger le nombre de reports en attente
      setTimeout(() => this.fetchPendingReports(), 0);

      // 8️⃣ Si on a un refreshToken + sessionId, lancer l’auto‑refresh
      const rt = localStorage.getItem("refreshToken");
      const sid = localStorage.getItem("sessionId");
     this.authLoading = false;
this.isInitDone = true;

if (rt && sid && this.user?.email) {
  console.log("🚀 initAuth → startAutoRefresh (session complète)")
  this.startAutoRefresh();
} else {
  console.warn("⚠️ initAuth : session incomplète → pas d’auto-refresh")
}


    },
  }
});

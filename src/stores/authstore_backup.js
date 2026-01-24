// ============================================================================
// 🏛️ AUTH STORE — VERSION PRO
// Gère : JWT, RefreshToken, SessionID, User, Cache, Auto-Refresh Silent
// Compatibilité totale avec Apps Script (refresh, recupinfosmembres, logout).
// ============================================================================

import { defineStore } from "pinia";
import { gasPost } from "@/config/gas"
import { decodeJwt } from "@/utils/jwt"
import { readKV, saveSessionData, getSessionIdFromDB } from "@/utils/AuthDBManager.ts";
import {
  getValidToken,
  refreshToken,
  logoutUser,
  isJwtExpired,
  decodeJwt
} from "@/utils/api.ts";

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

    jwt: localStorage.getItem("jwt") || null,
    refreshToken: localStorage.getItem("refreshToken") || null,
    sessionId: localStorage.getItem("sessionId") || null,

    user: null,                 // Données utilisateur
    role: null,                 // Rôle utilisateur (admin / adherent / etc)

    pendingReportsCount: 0,     // notif repport de cours

    impersonateStudent: localStorage.getItem("impersonateStudent") === "true",

    authReady: false,           // App prête
    jwtReady: false,            // JWT prêt pour UI
    authLoading: false,         // Loader interne

    isRefreshingToken: false,   // Flag anti-double refresh
    refreshFailed: false,       // Refresh échoué 1x ?
    isLoggingOut: false,        // Protection double logout
    isInitDone: false,          // initAuth terminé

    _refreshInterval: null,     // Timer refresh auto
  }),



  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------
  getters: {

isLoggedIn(state) {
  // 1) JWT absent → déconnecté
  if (!state.jwt) return false;

  // 2) Refresh en cours → session considérée active !
  if (state.isRefreshingToken) return true;

  // 3) Logout en cours → non connecté
  if (state.isLoggingOut) return false;

  // 4) User doit être présent si initAuth est terminé
  if (state.isInitDone && !state.user) return false;

  // 5) Vérification expiration JWT
  try {
    const payload = JSON.parse(atob(state.jwt.split('.')[1]));
    return Date.now() < payload.exp * 1000;
  } catch {
    return false;
  }
}
,

    isAdmin: (state) => {
      if (!state.user) return false;
      if (state.impersonateStudent) return false;
      return state.user.role === "admin";
    },

    isProf(state) {
  if (!state.user) return false;
  if (state.impersonateStudent) return false;
  return state.user.role === "prof" || (state.user.role === "admin" && state.user.prof_id);
},

isEleve(state) {
  if (!state.user) return false;
  return state.user.role === "eleve";
},


    // 🔥 PRO : Refresh seulement si expiration < 5 minutes
    needsRefresh: (state) => {
      if (!state.jwt) return false;
      try {
        const payload = JSON.parse(atob(state.jwt.split('.')[1]));
        const expiresIn = payload.exp * 1000 - Date.now();
        return expiresIn < 5 * 60 * 1000; // 5 minutes
      } catch { return false; }
    }
  },



  // --------------------------------------------------------------------------
  // ACTIONS
  // --------------------------------------------------------------------------
  actions: {
toggleMenu() {
  this.menuOpen = !this.menuOpen;
  localStorage.setItem("menuOpen", this.menuOpen ? "true" : "false");
},

toggleImpersonateStudent() {
  this.impersonateStudent = !this.impersonateStudent;
},

  // -----------------------------------------------------------------------
    // FECH pour récupérer les infos sur
    // les demandes de repport de cours
    // -----------------------------------------------------------------------
async fetchPendingReports() {
  try {
    const jwt = this.jwt;
    if (!jwt) return;

    const url = `https://script.google.com/macros/s/AKfycbzZxvUx0RFAsAszO9bvA2zInIqbrWsntDw1YYZiHQ993nRYboPx266McgZrSH2RH2KpNw/exec?route=getReports&jwt=${encodeURIComponent(jwt)}`;
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



    // -----------------------------------------------------------------------
    // 🔄 RESTORE SESSION
    // Récupère JWT + RefreshToken + SessionId depuis IndexedDB si existants
    // -----------------------------------------------------------------------
async restoreSessionFromStorage() {
  const jwtDB = await readKV("jwt")
  const rtDB = await readKV("refreshToken")
  const sidDB = await readKV("sessionId")
  const userDB = await readKV("user")

  const jwt = localStorage.getItem("jwt") || jwtDB || null
  const rt = localStorage.getItem("refreshToken") || rtDB || null
  const sid = localStorage.getItem("sessionId") || sidDB || null
  const user = userDB || null

  this.jwt = jwt
  this.refreshToken = rt
  this.sessionId = sid

  if (user) {
    this.user = user
  }

  if (jwt && rt && sid) {
    await saveSessionData({
      jwt,
      refreshToken: rt,
      sessionId: sid,
      user
    })
  } else {
    console.warn("⚠️ Session incomplète → pas d’écriture IndexedDB")
  }
}
,

// -----------------------------------------------------------------------
// (Compat legacy) setUserToken utilisé par api.ts
// -----------------------------------------------------------------------
setUserToken(jwt) {
  this.jwt = jwt;
  localStorage.setItem("jwt", jwt);
},

 // -----------------------------------------------------------------------
// 🔒 SAVE SESSION (optimisé + préservation de user complet)
// -----------------------------------------------------------------------
async setSessionData({ jwt, refreshToken, sessionId, userData = null }) {

  // 1) JWT
  if (jwt) {
    this.jwt = jwt;
    localStorage.setItem("jwt", jwt);
  }

  // 2) Refresh
  if (refreshToken) {
    this.refreshToken = refreshToken;
    localStorage.setItem("refreshToken", refreshToken);
  }

  // 3) SessionID
  const finalSessionId =
    sessionId ||
    this.sessionId ||
    localStorage.getItem("sessionId") ||
    (await getSessionIdFromDB());

  if (finalSessionId) {
    this.sessionId = finalSessionId;
    localStorage.setItem("sessionId", finalSessionId);
  }

  // 4) Mise à jour du store utilisateur (fusion locale)
  if (userData) {
    this.user = {
      ...(this.user || {}),
      ...userData
    };
  }

  // 5) 🔥 IMPORTANT :
  // Pendant le LOGIN → ne pas écraser userData complet dans IndexedDB.
  // On enregistre QUE la session. Le vrai user est chargé après par initAuth.

   saveSessionData({
    jwt: this.jwt || "",
    refreshToken: this.refreshToken || "",
    sessionId: this.sessionId || "",
    userData: null  // ⬅️ on N’ÉCRIT PAS user ici
  });
}
,



    // -----------------------------------------------------------------------
    // 👤 CHARGEMENT USER (API)
    // Appelé au lancement ou lors d’un refresh.
    // -----------------------------------------------------------------------

async fetchUserData() {
  if (!this.jwt) return false

  const jwtString =
    typeof this.jwt === "string" ? this.jwt : this.jwt?.jwt

  if (!jwtString) return false

  this.authLoading = true

  try {
    const res = await gasPost("recup_infos_membres", {
      jwt: jwtString
    })

    if (!res?.email) {
      console.warn("⚠️ fetchUserData : données invalides", res)
      return false
    }

    // priorité JWT
    const payload = decodeJwt(jwtString)

    const builtUser = {
      ...res,

      playlist_youtube: res.youtube || "",
      espace_google_drive: res.drive || "",
      objectif: res.objectif || "",

      role: payload?.role ?? res.role,
      prof_id: payload?.prof_id ?? res.prof_id,

      privileges: Array.isArray(res.privileges)
        ? res.privileges
        : []
    }

    this.user = {
      ...(this.user || {}),
      ...builtUser
    }

    localStorage.setItem(
      `userData_${res.email}`,
      JSON.stringify(builtUser)
    )

    return true

  } catch (e) {
    console.error("❌ fetchUserData", e)
    return false

  } finally {
    this.authLoading = false
  }
}
,

    async refreshJwt(retry = false) {

  if (this.isLoggingOut) return null;
  if (this.isRefreshingToken) return null;

  this.isRefreshingToken = true;

  try {
    const result = await refreshToken();
    // result = { jwt: "...", refreshToken: "...", sessionId: "..." }

    if (!result || (!result.jwt && typeof result !== "string")) {
      throw new Error("JWT manquant après refresh");
    }

    // 🟢 Extraction safe du JWT string
    const jwtString =
      typeof result === "string"
        ? result
        : result.jwt;

    if (!jwtString || typeof jwtString !== "string") {
      throw new Error("JWT invalide (pas une string)");
    }
    // 🟢 Mise à jour JWT propre
    this.jwt = jwtString;
    localStorage.setItem("jwt", jwtString);

    // 🟢 Refresh Token (si fourni)
    if (result.refreshToken) {
      this.refreshToken = result.refreshToken;
      localStorage.setItem("refreshToken", result.refreshToken);
    }

    // 🟢 SessionId (si fourni)
    if (result.sessionId) {
      this.sessionId = result.sessionId;
      localStorage.setItem("sessionId", result.sessionId);
    }

    // 🟢 Décodage pour garder store cohérent (évite le logout intempestif)
  // 🆕 Mise à jour role + prof_id depuis JWT
const payload = decodeJwt(jwtString);

if (!this.user) this.user = {};
if (payload?.role) this.user.role = payload.role;
if (payload?.prof_id) this.user.prof_id = payload.prof_id;



if (payload?.prof_id) this.user.prof_id = payload.prof_id;



    // ⚠️ IMPORTANT : marquer la session comme toujours active
    this.refreshFailed = false;

    // 🟢 Correction du flag interne qui cassait isLoggedIn()
    this.authReady = true;
    this.jwtReady = true;
// 🔥 Sauvegarde complète dans IndexedDB (obligatoire)
await saveSessionData({
  jwt: this.jwt,
  refreshToken: this.refreshToken,
  sessionId: this.sessionId,
});

    return jwtString;


  } catch (err) {

    console.error("❌ refreshJwt error :", err);
    this.refreshFailed = true;

    if (!retry) {
      setTimeout(() => {
        if (!this.isLoggingOut) this.refreshJwt(true);
      }, 5000);
    } else {
      this.logout();
    }

    return null;

  } finally {
    this.isRefreshingToken = false;
  }
}
,



    // -----------------------------------------------------------------------
    // 🔁 AUTO-REFRESH (TOUTES LES 60 SEC)
    // Vérifie juste le seuil "expires < 5 minutes"
    // -----------------------------------------------------------------------
 startAutoRefresh() {
  // 🔄 Nettoyage ancien timer
  if (_refreshTimer) {
    clearTimeout(_refreshTimer);
    _refreshTimer = null;
  }

  const jwt = this.jwt;
  if (!jwt) return;

  const payload = decodeJwt(jwt);
  const exp = payload?.exp ? payload.exp * 1000 : null;

  if (!exp) return;

  const now = Date.now();

  // 🧠 On refresh 2 minutes avant expiration
  const refreshDelay = Math.max(exp - now - 120000, 5000);

  console.log("⏳ Auto-refresh dans", Math.round(refreshDelay / 1000), "sec");

  _refreshTimer = setTimeout(async () => {
    // 🛑 Si logout → stop
    if (this.isLoggingOut) {
      console.log("⛔ Auto-refresh annulé : logout en cours");
      return;
    }

    // 📶 Offline → attendre retour réseau
    if (!navigator.onLine) {
      console.warn("📡 Offline → auto-refresh suspendu");
      window.addEventListener("online", () => this.startAutoRefresh(), { once: true });
      return;
    }

    // 🧪 éviter refresh multiples
    if (_refreshPromise) {
      console.log("⏳ Refresh déjà en cours → on attend");
      await _refreshPromise;
      this.startAutoRefresh();
      return;
    }

    console.log("🔄 Auto-refresh lancé…");

    _refreshPromise = refreshToken()
.then(async (newJwt) => {
  if (!newJwt?.jwt) {
    console.error("❌ Refresh impossible → logout…");
    await this.logout();
    return null;
  }

  // 🔥 Mise à jour store
  this.jwt = newJwt.jwt;
  localStorage.setItem("jwt", newJwt.jwt);

  if (newJwt.refreshToken)
    localStorage.setItem("refreshToken", newJwt.refreshToken);

  if (newJwt.sessionId)
    localStorage.setItem("sessionId", newJwt.sessionId);

  // 🔥 Mise à jour IndexedDB (OBLIGATOIRE)
  await saveSessionData({
    jwt: newJwt.jwt,
    refreshToken: newJwt.refreshToken,
    sessionId: newJwt.sessionId,
  });

  console.log("✅ Refresh OK → replanning");

  return newJwt.jwt;
})


      .catch((err) => {
        console.error("⚠️ Erreur refresh :", err);
      })
      .finally(() => {
        _refreshPromise = null;
        this.startAutoRefresh(); // Replanification intelligente
      });

    await _refreshPromise;

  }, refreshDelay);
},




    // -----------------------------------------------------------------------
    // 🔐 LOGOUT PRO
    // -----------------------------------------------------------------------
    async logout() {
      if (this.isLoggingOut) return;

      this.isLoggingOut = true;
      localStorage.setItem("logout_in_progress", "true");

      try {
        await logoutUser(); // Backend (Apps Script)
      } catch (err) {
        console.warn("⚠️ logoutUser erreur :", err);
      }

      // Nettoyage
      this.jwt = null;
      this.user = null;

      ["jwt", "refreshToken", "sessionId"].forEach(k => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });

      this.isLoggingOut = false;
      localStorage.removeItem("logout_in_progress");
    },



async initAuth() {
  this.authLoading = true;

  // 1️⃣ Restauration locale (super rapide)
  await this.restoreSessionFromStorage();
  let jwt = this.jwt;

  // 2️⃣ Vérifier AVANT tout si le JWT est encore valide
  const jwtIsValid = jwt && !isJwtExpired(jwt);

  if (!jwtIsValid) {
    jwt = await getValidToken();
    if (!jwt) {
      this.jwt = null;
      this.user = null;
      this.jwtReady = true;
      this.authReady = true;
      this.authLoading = false;
      this.isInitDone = true;
      return;
    }
  }

  // 3️⃣ Normalisation
  const finalJwt = typeof jwt === "string" ? jwt : jwt?.jwt;
  this.jwt = finalJwt;
  localStorage.setItem("jwt", finalJwt);

  // 4️⃣ On peut maintenant afficher l'app
  this.jwtReady = true;
  this.authReady = true;

  await new Promise(r => setTimeout(r, 0));

  // 5️⃣ Extraction des infos JWT
  const payload = decodeJwt(finalJwt);
  const email = payload?.email;

  // 🔥 On ne crée pas un user vide
  this.user = this.user ?? {};

  // 🔥 Le JWT est PRIORITAIRE (source de vérité)
  if (payload?.role) this.user.role = payload.role;
  if (payload?.prof_id) this.user.prof_id = payload.prof_id;

  // 6️⃣ Chargement du cache si présent
  const cacheKey = email ? `userData_${email}` : null;
  const cached = cacheKey ? localStorage.getItem(cacheKey) : null;

  if (cached) {
    const cachedUser = JSON.parse(cached);

    Object.assign(this.user, {
      ...cachedUser,
      role: this.user.role,         // 🔒 on ne touche jamais à role
      prof_id: this.user.prof_id    // 🔒 idem
    });

    // Refresh API en arrière-plan
    setTimeout(() => this.fetchUserData(), 0);

  } else {
    // Pas de cache → fetch direct
    const data = await this.fetchUserData();
    if (data) Object.assign(this.user, data);
  }

  // 7️⃣ pending reports
  setTimeout(() => this.fetchPendingReports(), 0);

  // 8️⃣ Auto refresh
  const rt = localStorage.getItem("refreshToken");
  const sid = localStorage.getItem("sessionId");

  if (rt && sid) {
    this.startAutoRefresh();
  }

  this.authLoading = false;
  this.isInitDone = true;
}

,
  }
});

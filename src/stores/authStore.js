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

    pendingReportsCount: 0,     // nombre de demandes de report de cours en attente

    impersonateStudent: localStorage.getItem("impersonateStudent") === "true",

    authReady: false,           // L'app est prête
    jwtReady: false,            // Le JWT est prêt pour l'UI
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

        const url = `https://script.google.com/macros/s/AKfycbxpZtZQq9TVZZGEt2SilXH9RQ1liviv1TYIgC6gm6O7P6lba0xR8mKyxLSW3VVJNS6m5w/exec?route=getReports&jwt=${encodeURIComponent(jwt)}`;
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
      const jwtDB = await readKV("jwt");
      const rtDB = await readKV("refreshToken");
      const sidDB = await readKV("sessionId");

      const jwt = localStorage.getItem("jwt") || jwtDB || null;
      const rt = localStorage.getItem("refreshToken") || rtDB || null;
      const sid = localStorage.getItem("sessionId") || sidDB || null;

      this.jwt = jwt;
      this.refreshToken = rt;
      this.sessionId = sid;

      // Si la session est complète, on sauvegarde dans IndexedDB
      if (jwt && rt && sid) {
        await saveSessionData({ jwt, refreshToken: rt, sessionId: sid });
      } else {
        console.warn("⚠️ Session incomplète → pas d’écriture IndexedDB");
      }
    },

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
      const finalSessionId =
        sessionId ||
        this.sessionId ||
        localStorage.getItem("sessionId") ||
        (await getSessionIdFromDB());

      if (finalSessionId) {
        this.sessionId = finalSessionId;
        localStorage.setItem("sessionId", finalSessionId);
      }

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

  const routeID = "AKfycbxpZtZQq9TVZZGEt2SilXH9RQ1liviv1TYIgC6gm6O7P6lba0xR8mKyxLSW3VVJNS6m5w";
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
    async refreshJwt(retry = false) {
      if (this.isLoggingOut) return null;
      if (this.isRefreshingToken) return null;

      this.isRefreshingToken = true;

      try {
        const result = await refreshToken();
        // result attendu = { jwt: "...", refreshToken: "...", sessionId: "..." }

        if (!result || (!result.jwt && typeof result !== "string")) {
          throw new Error("JWT manquant après refresh");
        }

        const jwtString = typeof result === "string" ? result : result.jwt;

        if (!jwtString || typeof jwtString !== "string") {
          throw new Error("JWT invalide (pas une string)");
        }

        // Mise à jour du JWT
        this.jwt = jwtString;
        localStorage.setItem("jwt", jwtString);
localStorage.setItem(REFRESH_PING_KEY, Date.now().toString())

        // Mise à jour du refreshToken si fourni
        if (result.refreshToken) {
          this.refreshToken = result.refreshToken;
          localStorage.setItem("refreshToken", result.refreshToken);
        }

        // Mise à jour du sessionId si fourni
        if (result.sessionId) {
          this.sessionId = result.sessionId;
          localStorage.setItem("sessionId", result.sessionId);
        }

        // Décodage pour garder user cohérent (role, prof_id)
        const payload = decodeJwt(jwtString);

        if (!this.user) this.user = {};
        if (payload?.role) this.user.role = payload.role;
        if (payload?.prof_id) this.user.prof_id = payload.prof_id;

        // Marquer la session comme OK
        this.refreshFailed = false;
        this.authReady = true;
        this.jwtReady = true;

        // Sauvegarde complète dans IndexedDB
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
    },

    // ⏰ Planifie l’auto‑refresh du JWT avant expiration (avec timer)
startAutoRefresh() {
  const REFRESH_OWNER_KEY = "sbs_refresh_owner"
  const OWNER_TTL = 15000 // 15 sec

  // =====================================================
  // 🧠 TAB ID STABLE
  // =====================================================
  let tabId = sessionStorage.getItem("tab_id")
  if (!tabId) {
    tabId = crypto.randomUUID()
    sessionStorage.setItem("tab_id", tabId)
  }

  // =====================================================
  // 🧹 CLEAN TIMER
  // =====================================================
  if (_refreshTimer) {
    clearTimeout(_refreshTimer)
    _refreshTimer = null
  }

  // =====================================================
  // 🔐 JWT CHECK
  // =====================================================
  if (!this.jwt) {
    console.log("⛔ [AutoRefresh] annulé → pas de JWT")
    return
  }

  const payload = decodeJwt(this.jwt)
  const exp = payload?.exp ? payload.exp * 1000 : null
  if (!exp) {
    console.log("⛔ [AutoRefresh] annulé → exp manquant")
    return
  }

  // =====================================================
  // 👑 OWNER / FOLLOWER AVEC TTL
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

 const now = Date.now()
const ownerExpired = !owner?.ts || (now - owner.ts > OWNER_TTL)

// 🔥 takeover immédiat si seul onglet actif
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
  // ⏳ DELAY (TEST / PROD)
  // =====================================================
  // const refreshDelay = Math.max(exp - now - 120000, 5000) // PROD
const refreshDelay = Math.max(exp - now - 120000, 5000) // 2 min avant exp


  console.log(
    "⏳ [AutoRefresh] programmé dans",
    Math.round(refreshDelay / 1000),
    "sec"
  )

  // =====================================================
  // 🔁 TIMER
  // =====================================================
  _refreshTimer = setTimeout(async () => {
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
      this.startAutoRefresh()
      return
    }

    // heartbeat owner
    localStorage.setItem(
      REFRESH_OWNER_KEY,
      JSON.stringify({ tabId, ts: Date.now() })
    )

    console.log("🔄 [AutoRefresh] déclenché")

    try {
      await this.refreshJwt()
      console.log("✅ [AutoRefresh] succès")
    } catch (err) {
      console.error("❌ [AutoRefresh] erreur", err)
    } finally {
      this.startAutoRefresh()
    }
  }, refreshDelay)
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
Object.assign(this.user, {
  ...cachedUser,

  // 🔒 identités protégées
  user_id: this.user.user_id,
  prof_id: this.user.prof_id,
  role: this.user.role,
})
;
if (
  this.user.user_id &&
  this.user.prof_id &&
  this.user.user_id === this.user.prof_id
) {
  console.error("💥 ID CORROMPU APRÈS CACHE", {
    user_id: this.user.user_id,
    prof_id: this.user.prof_id,
    cachedUser
  })
}
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
      if (rt && sid) {
        this.startAutoRefresh();
      }

      this.authLoading = false;
      this.isInitDone = true;
    },
  }
});

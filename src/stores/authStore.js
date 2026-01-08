// ============================================================================
// 🏛️ AUTH STORE — VERSION PRO
// Gère : JWT, RefreshToken, SessionID, User, Cache, Auto-Refresh Silent
// Compatibilité totale avec Apps Script (refresh, recupinfosmembres, logout).
// ============================================================================
import { getProxyGetURL,getProxyPostURL,gasPost   } from "@/config/gas"
import { getDeviceId } from "@/utils/device"
import router from "@/router/index.ts"

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


//store generique a clean
export const useAuthStore = defineStore("auth", {

  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------
  state: () => ({
      stripe_ready: null,
  elevesByProf: {},
  tsByProf: {},
  hasActiveOfferByProf: {},
dashboardElevesCount: 0,
isLoggingIn: false,

hasSaleByProf: {},
 stripe: {
    status: "unknown", // unknown | off | pending | ready
    accountId: null,
    lastCheck: 0
  },
    menuOpen: false,
 jwtReady: false,
    jwt: localStorage.getItem("jwt") || null,
    refreshToken: localStorage.getItem("refreshToken") || null,
    sessionId: localStorage.getItem("sessionId") || null,

    user: null,                 // Données utilisateur
    role: null,                 // Rôle utilisateur (admin / adherent / etc)
  prof_id: null,   // ✅ AJOUT

    pendingReportsCount: 0,     // nombre de demandes de report de cours en attente

    impersonateStudent: localStorage.getItem("impersonateStudent") === "true",

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
authReady(state) {
  if (!state.jwt) return false
  if (!state.user) return false
  if (!state.user.role) return false

  // prof / admin → prof_id obligatoire
  if (["prof", "admin"].includes(state.user.role)) {
    return !!state.user.prof_id
  }

  return true
},
onboardingSnapshot: (state) => {
  const profId = state.user?.prof_id

  const stripeOk =
    state.stripe?.status === "ready" &&
    !!state.stripe?.accountId

  const hasStudent =
    (state.dashboardElevesCount || 0) > 0

  const hasOffer =
    state.hasActiveOfferByProf?.[profId]

  const hasSale =
    state.hasSaleByProf?.[profId] === true

  const isReady =
    typeof hasOffer === "boolean"

  const completed =
    [stripeOk, hasStudent, hasOffer, hasSale].filter(Boolean).length

  return {
    stripeOk,
    hasStudent,
    hasOffer,
    hasSale,
    completed,
    isDone: hasSale === true,
    isReady
  }
}


,
onboardingNextAction(state) {
  const profId = state.user?.prof_id
  if (!profId) return null

  const stripeOk = state.stripe?.status === "connected"
  const hasStudent = (state.dashboardElevesCount || 0) > 0
  const hasOffer = !!state.hasActiveOfferByProf?.[profId]
  const hasSale = !!state.hasSaleByProf?.[profId]

  if (!stripeOk) {
    return {
      key: "stripe",
      label: "Connecter les paiements",
      cta: "Connecter Stripe",
      action: "stripe"
    }
  }

  if (!hasStudent) {
    return {
      key: "student",
      label: "Inviter ton premier élève",
      cta: "Inviter",
      action: "invite"
    }
  }

  if (!hasOffer) {
    return {
      key: "offer",
      label: "Créer ta première offre",
      cta: "Créer une offre",
      action: "offer"
    }
  }

  if (!hasSale) {
    return {
      key: "sale",
      label: "Obtenir ta première vente",
      cta: "Voir comment vendre",
      action: "sale"
    }
  }

  return null
}
,
getters: {
  isStripeReady: state => state.stripe.status === "ready"
}
,
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
async fetchHasOffer() {
  console.group("🟡 [ONBOARDING] fetchHasOffer")

  try {
    console.log("1️⃣ state.prof_id =", this.prof_id)
    console.log("1️⃣ user.prof_id =", this.user?.prof_id)

    const profId = this.prof_id || this.user?.prof_id
    if (!profId) {
      console.warn("⛔ NO profId → abort fetchHasOffer")
      console.groupEnd()
      return
    }

    console.log("2️⃣ profId utilisé =", profId)

    const jwt = await getValidToken()
    console.log("3️⃣ JWT OK ?", !!jwt)

    if (!jwt) {
      console.warn("⛔ NO JWT → abort fetchHasOffer")
      console.groupEnd()
      return
    }

    const payload = {
      route: "hasactiveproduct",
      jwt,
      prof_id: profId
    }

    console.log("4️⃣ payload envoyé =", payload)

    const proxyUrl = getProxyPostURL()
    console.log("5️⃣ proxyUrl =", proxyUrl)

    const res = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    console.log("6️⃣ fetch response status =", res.status)

    const json = await res.json()
    console.log("7️⃣ response JSON =", json)

    if (json?.success !== true) {
      console.warn("⛔ GAS returned error", json)
      this.hasActiveOfferByProf[profId] = false
      console.groupEnd()
      return
    }

    this.hasActiveOfferByProf[profId] = json.hasOffer === true

    console.log(
      "8️⃣ STORE UPDATED → hasActiveOfferByProf =",
      JSON.stringify(this.hasActiveOfferByProf, null, 2)
    )

  } catch (e) {
    console.error("❌ fetchHasOffer CRASH", e)
  } finally {
    console.groupEnd()
  }
}

,
setStripeStatus({ status, accountId }) {
  this.stripe.status = status
  this.stripe.accountId = accountId || null
  this.stripe.lastCheck = Date.now()
}
,
async fetchHasSale() {
  console.log("🟡 [ONBOARDING] fetchHasSale")

  const profId = this.user?.prof_id
  if (!profId) return

  const jwt = await getValidToken()
  if (!jwt) return

  const res = await fetch(getProxyPostURL(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      route: "hassalebyprof",
      jwt,
      prof_id: profId
    })
  })

  const json = await res.json()
  this.hasSaleByProf[profId] = json.hasSale === true
}
,
    // 🎭 Active ou désactive le mode “impersonation” de l’élève
    toggleImpersonateStudent() {
      this.impersonateStudent = !this.impersonateStudent;
      // (on ne stocke pas dans LS ici, mais tu peux le faire si besoin)
    },
    hardLogoutReset() {
  // verrous
  this.isLoggingOut = true
  this.isRefreshingToken = false
  this.isInitDone = false
  this.jwtReady = false

  // cœur auth
  this.jwt = null
  this.refreshToken = null
  this.sessionId = null
  this.user = null
  this.role = null
  this.prof_id = null

  // flags
  this.refreshFailed = false
  this.impersonateStudent = false
}
,
setLoginSuccess({ jwt, user }) {
  this.jwt = jwt
  this.jwtReady = true
  this.user = user
  this.isInitDone = true
  this.refreshFailed = false
}
,

    // 📥 Charge le nombre de demandes de report de cours via un endpoint externe
   async fetchPendingReports() {
  try {
const jwt = await this.ensureValidJwt()
    if (!jwt) return

    const url = getProxyGetURL(
      `route=getReports&jwt=${encodeURIComponent(jwt)}`
    )

    const res = await fetch(url)
    const data = await res.json()

    if (data.success && Array.isArray(data.reports)) {
      this.pendingReportsCount =
        data.reports.filter(r => r.status === "DEMANDE").length
    }

  } catch (e) {
    console.error("❌ fetchPendingReports error:", e)
  }
},

    // ♻️ Essaye de restaurer la session depuis IndexedDB (ou fallback localStorage)
async restoreSessionFromStorage() {
  // 🔒 STRIPE = runtime only → reset
  this.stripe = {
    status: "unknown",
    accountId: null,
    lastCheck: 0
  }

  // ⚠️ session déjà hydratée → skip
  if (this.sessionId) {
    console.warn("🔒 SessionId déjà présent, restauration ignorée :", this.sessionId)
    return
  }

  // ⚡ fast-path localStorage
  const jwtLS = localStorage.getItem("jwt")
  const rtLS  = localStorage.getItem("refreshToken")
  const sidLS = localStorage.getItem("sessionId")

  if (jwtLS || rtLS || sidLS) {
    this.jwt = jwtLS ?? null
    this.refreshToken = rtLS ?? null

    if (sidLS) {
      this.sessionId = sidLS
      console.log("♻️ sessionId restauré (LS) :", sidLS)
    }
    return
  }

  // 🧯 fallback IndexedDB (parallèle)
  const [jwtDB, rtDB, sidDB] = await Promise.all([
    readKV("jwt"),
    readKV("refreshToken"),
    readKV("sessionId")
  ])

  this.jwt = jwtDB ?? null
  this.refreshToken = rtDB ?? null

  if (sidDB) {
    this.sessionId = sidDB
    console.log("♻️ sessionId restauré (DB) :", sidDB)
  }
}



,

async ensureValidJwt() {
  if (this.isLoggingOut) return null
  if (!this.jwt) return null

  // ✅ JWT encore valide
  if (!isJwtExpired(this.jwt)) {
    return this.jwt
  }

  // ⏳ refresh déjà en cours → on attend
  if (this.isRefreshingToken) {
    while (this.isRefreshingToken) {
      await new Promise(r => setTimeout(r, 50))
    }
    return this.jwt && !isJwtExpired(this.jwt) ? this.jwt : null
  }

  // 🔄 refresh nécessaire
  const refreshed = await this.refreshJwt()
  return refreshed && !isJwtExpired(refreshed) ? refreshed : null
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

const url = getProxyGetURL(
  `route=recupinfosmembres&jwt=${encodeURIComponent(jwtString)}`
)
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
 if (this.isLoggingOut) {
  console.warn("⛔ refreshJwt annulé → logout");
  return null;
}


  if (this.isLoggingOut) {
    console.warn("⛔ refreshJwt annulé → logout en cours")
    return null
  }

  if (this.isRefreshingToken) {
    console.warn("⏳ refreshJwt ignoré → déjà en cours")
    return this.jwt
  }

  this.isRefreshingToken = true
  console.log("🔄 refreshJwt → start")

  try {
    const result = await refreshToken({
      refreshToken: this.refreshToken,
      sessionId: this.sessionId,
      deviceId: getDeviceId() // ✅ CORRECT
    })

    console.log("🧪 refreshJwt result =", result)

    // ❌ réponse invalide → on garde la session
if (!result || !result.jwt || typeof result.jwt !== "string") {

  // 🔥 CAS SAIN : backend refuse le refresh mais JWT encore valide
  if (this.jwt && !isJwtExpired(this.jwt)) {
    console.log("🟡 refresh refusé (SESSION_LOST) mais JWT valide → OK")
    return this.jwt
  }

// ❌ CAS GRAVE : JWT expiré + refresh refusé
// ❌ CAS GRAVE : JWT expiré + refresh refusé
console.warn("⛔ refresh KO + JWT expiré → session morte")

this.refreshFailed = true
this.stopAutoRefresh()

try {
  if (typeof this.$reset === "function") this.$reset()
} catch {}

localStorage.clear()
sessionStorage.clear()
sessionStorage.setItem("AUTH_ABORTED", "1")

// 🔥 REDIRECTION OBLIGATOIRE
router.replace("/login")

return null
}


    // ✅ SUCCÈS
    this.jwt = result.jwt
    this.refreshToken = result.refreshToken || this.refreshToken
    this.sessionId = result.sessionId || this.sessionId

    localStorage.setItem("jwt", this.jwt)
    if (this.refreshToken) localStorage.setItem("refreshToken", this.refreshToken)
    if (this.sessionId) localStorage.setItem("sessionId", this.sessionId)

    const payload = decodeJwt(this.jwt)
    console.log("🧠 refreshJwt payload =", payload)

    this.refreshFailed = false
    console.log("✅ refreshJwt succès → JWT mis à jour")

    return this.jwt

  } catch (err) {
    console.error("⚠️ refreshJwt FAILED (session conservée)", err)

    // arrêt auto-refresh seulement si session réellement morte
    if (!this.jwt || isJwtExpired(this.jwt)) {
      this.refreshFailed = true
      console.warn("⛔ AutoRefresh stoppé → JWT expiré")
      this.stopAutoRefresh()
    }

    return this.jwt || null

  } finally {
    this.isRefreshingToken = false
    console.log("🔚 refreshJwt → end")
  }
}
,

    // ⏰ Planifie l’auto‑refresh du JWT avant expiration (avec timer)


startAutoRefresh() {
  const REFRESH_OWNER_KEY = "sbs_refresh_owner"
  const OWNER_TTL = 15_000 // 15s
  const LEEWAY = 60_000    // 1 min avant exp
  const MIN_DELAY = 15_000
  const MAX_DELAY = 10 * 60_000

  // ===============================
  // 🔒 PRÉ-CHECKS
  // ===============================
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

  // ===============================
  // 🧠 JWT TIMING
  // ===============================
  const payload = decodeJwt(this.jwt)
  const expMs = payload?.exp ? payload.exp * 1000 : 0
  const now = Date.now()

  let delay = expMs - now - LEEWAY
  delay = Math.max(MIN_DELAY, Math.min(delay, MAX_DELAY))

  // ===============================
  // 🧠 TAB ID
  // ===============================
  let tabId = sessionStorage.getItem("tab_id")
  if (!tabId) {
    tabId = crypto.randomUUID()
    sessionStorage.setItem("tab_id", tabId)
  }

  // ===============================
  // 👑 OWNER / FOLLOWER
  // ===============================
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

  // l’onglet visible reprend la main
  if (document.visibilityState === "visible" && document.hasFocus()) {
    owner = null
  }

  if (!owner || ownerExpired || owner.tabId === tabId) {
    localStorage.setItem(
      REFRESH_OWNER_KEY,
      JSON.stringify({ tabId, ts: now })
    )

    console.log("👑 [AutoRefresh] OWNER", {
      tabId,
      visibility: document.visibilityState,
      focused: document.hasFocus()
    })
  } else {
    console.log("👂 [AutoRefresh] FOLLOWER", {
      myTab: tabId,
      ownerTab: owner.tabId,
      age: now - owner.ts,
      visibility: document.visibilityState,
      focused: document.hasFocus()
    })
    return
  }

  // ===============================
  // 🧹 CLEAN TIMER
  // ===============================
  if (_refreshTimer) {
    clearTimeout(_refreshTimer)
    _refreshTimer = null
  }

  console.log(`⏱️ [AutoRefresh] armé (delay = ${Math.round(delay / 1000)}s)`)

  // ===============================
  // ⏱️ TIMER
  // ===============================
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

    // ===============================
    // 🔐 GARDE-FOU FINAL
    // ===============================
    if (!isJwtExpired(this.jwt)) {
      console.log("⏭️ [AutoRefresh] JWT encore valide → replanification")
      this.startAutoRefresh()
      return
    }

    // ===============================
    // 🔄 REFRESH
    // ===============================
    console.log("🔄 [AutoRefresh] déclenché")

    const jwt = await this.refreshJwt()

    if (!jwt) {
      console.warn("⛔ [AutoRefresh] refresh KO → arrêt")
      this.stopAutoRefresh()
      return
    }

    console.log("✅ [AutoRefresh] JWT rafraîchi → replanification")
    this.startAutoRefresh()

  }, delay)
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
if (this.isLoggingIn) {
  console.log("⏸️ initAuth ignoré → login en cours")
  return false
}



  console.log("🔐 initAuth start")

  this.stripe = {
    status: "unknown",
    accountId: null,
    lastCheck: 0
  }

  this.authLoading = true
// 🧊 accès public SI PAS DE JWT EN STORAGE
const storedJwt = localStorage.getItem("jwt")

if (!storedJwt) {
  console.log("🧊 Aucun JWT en storage → accès public")

  this.authLoading = false
  this.isInitDone = true

  requestAnimationFrame(() => {
    window.__HIDE_SPLASH__?.()
  })

  return false
}


  // 🛑 anti-boucle (uniquement si déjà logout définitif)
if (sessionStorage.getItem("AUTH_ABORTED")) {
  console.warn("🛑 initAuth skipped (AUTH_ABORTED)")

  this.authLoading = false
  this.isInitDone = true

  requestAnimationFrame(() => {
    window.__HIDE_SPLASH__?.()
  })

  window.vueRouterPush?.("/login")
  return false
}


  try {
    // 1️⃣ restore session
    await this.restoreSessionFromStorage()
    let jwt = this.jwt

    // 2️⃣ check expiration
    let expired = false
    try {
      expired = jwt ? isJwtExpired(jwt) : false
    } catch {
      expired = true
    }

    // 3️⃣ refresh si possible
    if (jwt && expired) {
      console.log("🔄 JWT expiré → refresh")
      try {
        jwt = await this.refreshJwt()
      } catch (e) {
        console.warn("⚠️ refreshJwt failed", e)
        jwt = null
      }
    }

    const refreshToken = localStorage.getItem("refreshToken")

    // 4️⃣ si jwt absent MAIS refresh possible → on laisse vivre
    if (!jwt && refreshToken) {
      console.log("⏳ JWT absent mais refresh possible → init OK (temp)")
      this.authLoading = false
      this.isInitDone = true
      requestAnimationFrame(() => {
  window.__HIDE_SPLASH__?.()
})
      return true
    }



    // 6️⃣ normalisation JWT
    const finalJwt =
      typeof jwt === "string"
        ? jwt
        : (jwt && jwt.jwt) || null

    if (!finalJwt) {
      console.warn("⛔ JWT invalide après normalisation")
      this.authLoading = false
      this.isInitDone = true
      requestAnimationFrame(() => {
  window.__HIDE_SPLASH__?.()
})
      return false
    }

    this.jwt = finalJwt
    localStorage.setItem("jwt", finalJwt)
    this.jwtReady = true

    // 7️⃣ decode payload
    const payload = decodeJwt(finalJwt) || {}

    this.user = {
      role: payload.role ?? null,
      user_id: payload.user_id ?? null,
      prof_id: payload.prof_id ?? null
    }

    // 👨‍🏫 fetch prof (NON BLOQUANT)
    if (["prof", "admin"].includes(this.user.role) && this.user.prof_id) {
      const profStore = useProfStore()
      setTimeout(() => {
        profStore.fetchProf(true)
      }, 0)
    }

    // 8️⃣ fetchs non bloquants
    setTimeout(() => {
      try { this.fetchUserData() } catch {}
    }, 0)

    setTimeout(() => {
      try { this.fetchPendingReports() } catch {}
    }, 0)

    setTimeout(() => {
      try {
        if (this.user?.prof_id) this.fetchHasOffer()
      } catch {}
    }, 0)

    // 9️⃣ auto-refresh
    const sid = localStorage.getItem("sessionId")
    if (refreshToken && sid && this.jwt) {
      console.log("🚀 startAutoRefresh")
      this.startAutoRefresh()
    }

    this.authLoading = false
    this.isInitDone = true
    requestAnimationFrame(() => {
  window.__HIDE_SPLASH__?.()
})
    console.log("🟢 initAuth OK")
    return true

  } catch (err) {
    console.error("❌ initAuth crash", err)

    try {
      if (typeof this.$reset === "function") this.$reset()
    } catch {}

    localStorage.clear()
    sessionStorage.clear()
    sessionStorage.setItem("AUTH_ABORTED", "1")

    this.authLoading = false
    this.isInitDone = true
    requestAnimationFrame(() => {
  window.__HIDE_SPLASH__?.()
})
    return false
  }
}


,
  }
});

// store prof
export const useProfStore = defineStore("prof", {
  state: () => ({
    prof: null,
    ready: false
  }),

  actions: {
async fetchProf(force = false) {
  if (this.ready && !force) return

  const auth = useAuthStore()

  const profId =
    auth.user?.prof_id ||
    auth.prof_id

  if (!profId) {
    console.warn("👨‍🏫 fetchProf: no prof_id", auth.user)
    return
  }

  if (!auth.jwt) {
    console.warn("👨‍🏫 fetchProf: no jwt")
    return
  }

  console.log("👨‍🏫 fetchProf START", profId)

  const res = await gasPost("getProfByUser", {
    jwt: auth.jwt,
    prof_id: profId
  })

  console.log("👨‍🏫 RAW RES =", res)

  if (!res?.success) {
    console.error("❌ fetchProf error", res?.error)
    this.prof = null
    this.ready = false
    return
  }

  this.prof = res.prof
  this.ready = true

  console.log("👨‍🏫 PROF AFTER SET =", this.prof)
}

,

    refreshProf() {
      this.ready = false
      this.prof = null
      return this.fetchProf()
    }
  }
});



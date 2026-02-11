// ============================================================================
// 🏛️ AUTH STORE — VERSION PRO
// Gère : JWT, RefreshToken, SessionID, User, Cache, Auto-Refresh Silent
// Compatibilité totale avec Apps Script (refresh, recupinfosmembres, logout).
// ============================================================================
import { getProxyGetURL,getProxyPostURL,gasPost   } from "@/config/gas.ts"
import { getCachedUser } from "@/utils/userCache.ts"
import { backgroundFetch } from "@/utils/backgroundFetcher"

import { getDeviceId } from "@/utils/device"
import router from "@/router/index.ts"
import {buildUserFromJwt} from "@/utils/jwt_manager.js"
import { defineStore } from "pinia";
import { setCachedUser } from "@/utils/userCache.ts"

import { readKV, saveSessionData, getSessionIdFromDB } from "@/utils/AuthDBManager.ts";
import {
  getValidToken,
  refreshToken,
  logoutUser,
  isJwtExpired,
  safeIsJwtExpired,
  decodeJwt
} from "@/utils/api.ts";
const ONBOARDING_TTL = 30 * 60 * 1000
const onboardingCacheKey = (profId) =>
  `onboarding_prof_${profId}`

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
  "avatar_url"
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
      authReady: false,
      _prewarmDone: false,
authFullyReady: false,

          isLoggingOut: false,
            privilegesStatus: "pending", // "pending" | "active" | "expired"
             userLoaded: false,
_onboardingResolved: false,
  user: null,
userLoaded: false,
postAuthResolved: false,
  onboardingStable: false,
  upgradeCTA: null,
      stripe_ready: null,
  elevesByProf: {},
  tsByProf: {},
  hasActiveOfferByProf: {},
dashboardElevesCount: null,
isLoggingIn: false,
    refreshPromise: null,

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
      authReadyLight: false, // 👈 JWT + user mini ok

    isInitDone: false,          // initAuth est terminé

    _refreshInterval: null,     // Timer pour auto-refresh
  }),

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------
  getters: {
    pricingReady(state) {
  const profId = state.user?.prof_id
  if (!profId) return false

  return (
    state.jwtReady === true &&
    typeof state.hasActiveOfferByProf?.[profId] === "boolean" &&
    typeof state.hasSaleByProf?.[profId] === "boolean"
  )
}
,
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
onboardingReady(state) {
  const profId = state.user?.prof_id
  if (!profId) return false

  const stripeKnown =
    !!state.user && (
      state.user.stripe_charges_enabled === true ||
      state.user.stripe_charges_enabled === false ||
      !state.user.stripe_account_id
    )

  return (
    stripeKnown &&
    typeof state.dashboardElevesCount === "number" &&
    typeof state.hasActiveOfferByProf?.[profId] === "boolean" &&
    typeof state.hasSaleByProf?.[profId] === "boolean"
  )
}

,

onboardingSnapshot: (state) => {
  const profId = state.user?.prof_id
const stripeOk = state.stripe.status === "ready"



const hasStudent =
  typeof state.dashboardElevesCount === "number" &&
  state.dashboardElevesCount > 0





  const hasOffer =
    state.hasActiveOfferByProf?.[profId] === true

  const hasSale =
    state.hasSaleByProf?.[profId] === true
const stripeKnown = state.stripe.status !== "unknown"

const isReady =
  typeof hasOffer === "boolean" &&
  typeof hasSale === "boolean" &&
  typeof state.dashboardElevesCount === "number"



 const completed =
  [stripeOk, hasStudent, hasOffer, hasSale].filter(v => v === true).length


  const isDone =
    stripeOk && hasStudent && hasOffer && hasSale

  return {
    stripeOk,
    hasStudent,
    hasOffer,
    hasSale,
    completed,
    isDone,
    isReady
  }
}



,
onboardingNextAction(state) {
  if (!state.authReady) return null
  if (state.onboarding?.completed === true) return null

  const profId = state.user?.prof_id
  if (!profId) return null

const stripeOk = !!(
  state.user?.stripe_account_id &&
  state.user?.stripe_charges_enabled === true
)
  const hasStudent = (state.dashboardElevesCount || 0) > 1
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
  isStripeReady: state =>
    state.stripe.status === "ready",
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
    const profId = this.prof_id || this.user?.prof_id
    if (!profId) return

    const res = await fetch(getProxyPostURL(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "hasactiveproduct",
        prof_id: profId
      })
    })

    const json = await res.json()
    this.hasActiveOfferByProf[profId] = json?.hasOffer === true

  } catch (e) {
    console.error("❌ fetchHasOffer CRASH", e)
  } finally {
    console.groupEnd()
  }
}
,

  showUpgradeCTA(payload) {
    this.upgradeCTA = payload
  },
  hideUpgradeCTA() {
    this.upgradeCTA = null
  },
setStripeStatus({ status, accountId }) {
  this.stripe.status = status
  this.stripe.accountId = accountId || null
  this.stripe.lastCheck = Date.now()
}
,
async fetchHasSale() {
  console.log("🟡 [ONBOARDING] fetchHasSale")

  try {
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
  } catch (e) {
    console.error("❌ fetchHasSale failed", e)
  }
}

,
    // 🎭 Active ou désactive le mode “impersonation” de l’élève
    toggleImpersonateStudent() {
      this.impersonateStudent = !this.impersonateStudent;
      // (on ne stocke pas dans LS ici, mais tu peux le faire si besoin)
    },
  hardLogoutReset() {
  // ❌ aucun flag ici

  // auth core
  this.jwt = null
  this.refreshToken = null
  this.sessionId = null
  this.user = null
  this.role = null
  this.prof_id = null

  // états internes
  this.jwtReady = false
  this.isRefreshingToken = false
  this.refreshFailed = false
  this.impersonateStudent = false

  // 🔥 IMPORTANT
  // authReady NE DOIT PAS ÊTRE TOUCHÉ ICI
}
,
setLoginSuccess({ jwt, user }) {
  this.jwt = jwt
  this.jwtReady = true

  this.user = {
    ...user,
    privileges: Array.isArray(user?.privileges)
      ? user.privileges
      : [],
    quota_mb: Number(user?.quota_mb) || 0
  }

  this.isInitDone = true
  this.refreshFailed = false
}

,

    // 📥 Charge le nombre de demandes de report de cours via un endpoint externe
async fetchPendingReports() {
  try {
    const jwt = await this.ensureValidJwt()
    if (!jwt) return
    if (this.isLoggingOut) return

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
  // 🔐 tokens
  const jwtDB = await readKV("jwt")
  const rtDB  = await readKV("refreshToken")
  const sidDB = await readKV("sessionId")

  const jwt = localStorage.getItem("jwt") || jwtDB || null
  const rt  = localStorage.getItem("refreshToken") || rtDB || null
  const sid = localStorage.getItem("sessionId") || sidDB || null

  this.jwt = jwt
  this.refreshToken = rt
  this.sessionId = sid
  // 🔐 état métier INCONNU tant que serveur pas passé
if (jwt) {
  if (!this.privilegesStatus || this.privilegesStatus === "pending") {
  this.privilegesStatus = "loading"
}
}
// 🔒 sécurité : JWT sans refreshToken = session invalide
if (jwt && !rt) {
  console.warn("⛔ JWT présent sans refreshToken → logout")
  await logoutUser()
  return false
}


  // 👤 USER = TOUJOURS reconstruit depuis JWT
  if (jwt && !this.user) {
    this.user = buildUserFromJwt(jwt)
    console.log("👤 user reconstruit depuis JWT (restore)")
  }
// ⚡ CACHE USER (si dispo)
if (jwt) {
  const payload = decodeJwt(jwt)
  const cachedUser = getCachedUser(payload.email)

if (cachedUser) {
this.user = {
  ...(this.user || {}),
  ...cachedUser,
  quota_mb: Number(cachedUser.quota_mb) || 0, // ✅
  avatar_url:
    cachedUser.avatar_url ?? this.user?.avatar_url,
  playlist_youtube:
    cachedUser.playlist_youtube ?? this.user?.playlist_youtube,
  espace_google_drive:
    cachedUser.espace_google_drive ?? this.user?.espace_google_drive
}



  // ⚠️ uniquement si POSITIF
if (cachedUser.abo === "active" || (cachedUser.privileges?.length || 0) > 0) {
  this.privilegesStatus = "active"
} else {
  // ✅ état connu (pas premium)
  this.privilegesStatus = "expired"
}


  console.log("⚡ user hydraté depuis cache (optimiste)")
}

}
  // 💾 sync IndexedDB (tokens seulement)
  if (jwt && rt && sid) {
    await saveSessionData({
      jwt,
      refreshToken: rt,
      sessionId: sid
    })
  } else {
    console.warn("⚠️ Session incomplète → pas d’écriture IndexedDB")
  }
}



,
async restoreSessionFromPayload({ jwt, refreshToken, sessionId, email }) {
  if (!jwt || !refreshToken || !sessionId) {
    console.warn("⚠️ restoreSessionFromPayload incomplet")
    return false
  }

  // 🔐 mémoire
  this.jwt = jwt
  this.refreshToken = refreshToken
  this.sessionId = sessionId

  // 👤 user depuis JWT
  this.user = buildUserFromJwt(jwt)

  // 🔄 statut privilèges (inconnu tant que backend pas passé)
  if (!this.privilegesStatus || this.privilegesStatus === "pending") {
  this.privilegesStatus = "loading"
}

  // ⚡ cache user (optimiste)
  const payload = decodeJwt(jwt)
  const cachedUser = payload?.email ? getCachedUser(payload.email) : null
  if (cachedUser) {
this.user = {
  ...(this.user || {}),
  ...cachedUser,

    quota_mb: Number(cachedUser.quota_mb) || 0, //
  avatar_url:
    cachedUser.avatar_url ?? this.user?.avatar_url,

  playlist_youtube:
    cachedUser.playlist_youtube ?? this.user?.playlist_youtube,

  espace_google_drive:
    cachedUser.espace_google_drive ?? this.user?.espace_google_drive
}


    if (cachedUser.abo === "active" || (cachedUser.privileges?.length || 0) > 0) {
      this.privilegesStatus = "active"
    }
  }

  // 💾 persistance
  localStorage.setItem("jwt", jwt)
  localStorage.setItem("refreshToken", refreshToken)
  localStorage.setItem("sessionId", sessionId)

  await saveSessionData({
    jwt,
    refreshToken,
    sessionId
  })

  // 📣 notify UI / watchers
  window.dispatchEvent(new Event("user-data-updated"))

  console.log("✅ session restaurée depuis magic link")
  return true
}

,

async ensureValidJwt() {
  if (this.isLoggingOut) return null

  // ⛔ session incomplète
  if (!this.jwt || !this.refreshToken || !this.sessionId) {
    return null
  }

  // ✅ JWT encore valide
  if (!safeIsJwtExpired(this.jwt)) {
    return this.jwt
  }

  // ⏳ refresh déjà en cours
  if (this.refreshPromise) {
    await this.refreshPromise
    return this.jwt || null
  }

  // 🔄 refresh nécessaire
  await this.refreshJwt()

  // ❌ refresh KO
  if (!this.jwt) return null

  return this.jwt
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
  user: this.user   // ✅ clé user
      });
    },

    // 👤 Récupère les données utilisateur depuis l'API (Apps Script) en utilisant JWT

async fetchUserData() {
  if (!this.jwt) return false

  const jwtString =
    typeof this.jwt === "string" ? this.jwt : this.jwt?.jwt
  if (!jwtString) return false

  this.authLoading = true

  // ⛔ ne PAS repasser à loading si l'état est déjà connu
  if (
    this.privilegesStatus !== "active" &&
    this.privilegesStatus !== "expired"
  ) {
    this.privilegesStatus = "loading"
  }

  try {
    const res = await gasPost("recup_infos_membres", { jwt: jwtString })
    const data = res?.data ?? res
    if (!data?.email) return false

    const payload = decodeJwt(jwtString)

 const onboarding_done = Boolean(
  data.onboarding_done === true ||
  data.onboarding_done === "TRUE" ||
  data.onboarding_done === 1
)


const builtUser = {
  ...data,
  avatar_url: data.avatar_url || "",
  playlist_youtube: data.youtube || "",
  espace_google_drive: data.drive || "",
  objectif: data.objectif || "",
  role: data.role ?? payload?.role,
  prof_id: data.prof_id ?? payload?.prof_id,
  onboarding_done,
  privileges: Array.isArray(data.privileges) ? data.privileges : [],
  quota_mb: Number(data.quota_mb) || 0   // ✅ ICI
}


    // ✅ source de vérité user
    this.user = builtUser
    this.userLoaded = true
    this.onboardingResolved = true

    // ✅ cache UX
    localStorage.setItem(
      "onboarding_done",
      onboarding_done ? "true" : "false"
    )

    // ✅ état privilèges FINAL (connu)
    this.privilegesStatus =
      builtUser.abo === "active" || builtUser.privileges.length > 0
        ? "active"
        : "expired"

    return true

  } catch (e) {
    console.error("❌ fetchUserData error", e)

    // ⚠️ en cas d'erreur, on considère l'état comme connu (non premium)
    this.privilegesStatus = "expired"
    return false

  } finally {
  this.privilegesStatus =
    this.privilegesStatus === "loading"
      ? "expired"
      : this.privilegesStatus

  this.authLoading = false
}

}




,

    // 🔄 Rafraîchit le JWT + éventuellement refreshToken & sessionId
    // retry = true permet un second essai après échec
async refreshJwt() {
  // ⛔ aborts
  if (this.isLoggingOut || this.refreshFailed) {
    console.warn("⛔ refreshJwt annulé")
    return null
  }

  // 🔒 VERROU GLOBAL (PRIORITAIRE)
  if (this.refreshPromise) {
    console.warn("⏳ refreshJwt → attente promesse existante")
    return await this.refreshPromise
  }

  // 🔥 pose le verrou AVANT tout async
  this.isRefreshingToken = true

  this.refreshPromise = (async () => {
    console.log("🔄 refreshJwt → start")

    try {
      const result = await refreshToken({
        refreshToken: this.refreshToken,
        sessionId: this.sessionId,
        deviceId: getDeviceId()
      })

  if (!result || typeof result.jwt !== "string") {
  if (this.jwt && !safeIsJwtExpired(this.jwt)) {
    console.warn("⚠️ refresh KO mais JWT encore valide → IGNORE")
    return this.jwt
  }

  console.warn("⛔ refresh KO + JWT expiré → HARD LOGOUT")
  this.refreshFailed = true
  this.stopAutoRefresh()
  await logoutUser()
  return null
}

      // ✅ mise à jour session
      this.jwt = result.jwt
      this.refreshToken = result.refreshToken || this.refreshToken
      this.sessionId = result.sessionId || this.sessionId

      localStorage.setItem("jwt", this.jwt)
      if (this.refreshToken) {
        localStorage.setItem("refreshToken", this.refreshToken)
      }
      if (this.sessionId) {
        localStorage.setItem("sessionId", this.sessionId)
      }

      this.refreshFailed = false
      console.log("✅ refreshJwt succès")
      return this.jwt

    } catch (err) {
      console.error("⚠️ refreshJwt FAILED", err)

      if (!this.jwt || safeIsJwtExpired(this.jwt)) {
        this.refreshFailed = true
        this.stopAutoRefresh()
      }

      return this.jwt || null

    } finally {
      this.isRefreshingToken = false
      this.refreshPromise = null
      console.log("🔚 refreshJwt → end")
    }
  })()

  return await this.refreshPromise
}
,

    // ⏰ Planifie l’auto‑refresh du JWT avant expiration (avec timer)




startAutoRefresh() {
  const LEEWAY = 3 * 60_000
  const MIN_DELAY = 15_000
  const MAX_DELAY = 10 * 60_000

  console.group("⏰ [AutoRefresh] start")

  // ===============================
  // 🧱 GUARDS
  // ===============================
  if (!this.isInitDone || this.isLoggingOut || this.refreshFailed || !this.jwt) {
    console.log("⛔ guard stop")
    console.groupEnd()
    return
  }

  if (this._autoRefreshArmed) {
    console.log("⏳ auto-refresh déjà armé")
    console.groupEnd()
    return
  }

  // ===============================
  // 🧠 JWT TIMING
  // ===============================
  const payload = decodeJwt(this.jwt)
  const expMs = payload?.exp ? payload.exp * 1000 : 0
  const now = Date.now()

  if (!expMs) {
    console.warn("⚠️ exp JWT introuvable")
    console.groupEnd()
    return
  }

  let delay = expMs - now - LEEWAY
  delay = Math.max(MIN_DELAY, Math.min(delay, MAX_DELAY))

  console.log("🧠 JWT timing", {
    exp: new Date(expMs).toISOString(),
    now: new Date(now).toISOString(),
    delaySec: Math.round(delay / 1000)
  })

  // ===============================
  // 🧹 CLEAN TIMER
  // ===============================
  if (_refreshTimer) {
    clearTimeout(_refreshTimer)
    _refreshTimer = null
  }

  // ===============================
  // ⏱️ ARM TIMER
  // ===============================
  this._autoRefreshArmed = true
  console.log("⏱️ timer armé")

  _refreshTimer = setTimeout(async () => {
    console.group("🔥 [AutoRefresh] TIMER FIRED")
    this._autoRefreshArmed = false

    if (this.isLoggingOut || this.refreshFailed) {
      console.log("⛔ abort")
      console.groupEnd()
      return
    }

    if (!navigator.onLine) {
      console.log("📡 offline → attente réseau")
      window.addEventListener("online", () => this.startAutoRefresh(), { once: true })
      console.groupEnd()
      return
    }

    if (this.refreshPromise) {
      console.log("⏳ refresh déjà en cours")
      console.groupEnd()
      return
    }

    // ===============================
    // 🔄 REFRESH
    // ===============================
    console.log("🔄 refreshJwt() call")
    const jwt = await this.refreshJwt()

    if (!jwt) {
      if (this.jwt && !safeIsJwtExpired(this.jwt)) {
        console.warn("⚠️ refresh KO mais JWT valide → retry")
        this.startAutoRefresh()
        console.groupEnd()
        return
      }

      console.warn("⛔ refresh KO + JWT expiré → stop")
      this.stopAutoRefresh()
      console.groupEnd()
      return
    }

    console.log("✅ refresh OK → replanification")
    this.startAutoRefresh()
    console.groupEnd()
  }, delay)

  console.groupEnd()
}






,
invalidateOnboardingCache() {
  if (!this.prof_id) return
  localStorage.removeItem(onboardingCacheKey(this.prof_id))
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



async restoreFast() {
  this.authLoading = true

  if (sessionStorage.getItem("AUTH_ABORTED")) {
    this.authReady = !!this.jwt
    this.authLoading = false
    return false
  }

  await this.restoreSessionFromStorage()

  // ⛔ TRIPLET OBLIGATOIRE
  if (!this.jwt || !this.refreshToken || !this.sessionId) {
    console.warn("⛔ restoreFast aborted: tokens incomplets")
    this.authReady = false
    this.authLoading = false
    return false
  }

  // user minimal sync
  this.user = buildUserFromJwt(this.jwt)
  this.user.onboarding_done ??= false
  this.prof_id = this.user.prof_id || null

  // ✅ ready uniquement si JWT OK
  this.authReady = true
  this.authLoading = false
  return true
}


,
async finalizeAuthAsync() {
  try {
    // 🔐 JWT / refresh
    let jwt = this.jwt
    if (jwt && safeIsJwtExpired(jwt)) {
      jwt = await this.refreshJwt()
      if (!jwt) return
    }
    this.jwt = jwt

    // 👤 user + privileges
    const ok = await this.fetchUserData()
    if (!ok || !this.user) return

    // 🔁 onboarding / données secondaires (non bloquant)
const tasks = []

if (["prof", "admin"].includes(this.user.role) && this.user.prof_id) {
  tasks.push(useProfStore().fetchProf(true))
}

tasks.push(
  this.fetchHasOffer(),
  this.fetchHasSale(),
  this.fetchPendingReports()
)

if (typeof this.fetchStripeStatus === "function") {
  tasks.push(this.fetchStripeStatus())
}

await Promise.allSettled(tasks)


    // 🔒 ÉTAT FINAL GARANTI (anti-skeleton)
    if (this.privilegesStatus === "loading" || !this.privilegesStatus) {
      this.privilegesStatus =
        this.user.abo === "active" || (this.user.privileges?.length ?? 0) > 0
          ? "active"
          : "expired"
    }

    this.authFullyReady = true
    this.jwtReady = true
    console.log("🟢 AUTH FULLY READY")



  } catch (e) {
    console.error("❌ finalizeAuthAsync error", e)
  }
}




,
// 🚀 Initialisation complète de l’auth au boot app
// 🚀 Initialisation complète de l’auth au boot app (SAFE)
// 🚀 Initialisation auth V2 (FAST BOOT + ASYNC FINALIZE)
async initAuth() {
  if (this._initAuthRunning) {
  console.warn("⛔ initAuth déjà en cours → skip")
  return this._initPromise
}

if (this.isInitDone) {
  console.warn("⛔ initAuth déjà terminé → skip")
  return true
}

  console.log("🔐 initAuth → START")

  if (this._initAuthRunning) return this._initPromise

  this._initAuthRunning = true
  this._initPromise = (async () => {

    this.authLoading = true

    // 🔒 NE PAS casser l’UI si déjà initialisée
    if (!this.isInitDone) {
      this.authReady = false
      this.authReadyLight = false
    }

    try {
      const hasSession = await this.restoreFast()

      // onboarding cache sync OK
      const cached = localStorage.getItem("onboarding_done")
      if (cached === "true") {
        this.user = { ...(this.user || {}), onboarding_done: true }
      }

      // 🔁 hydratation réelle en background
    // 🔁 hydratation réelle en background
if (hasSession) {
  // ⚠️ NE PAS await → sinon le router attend
  this.finalizeAuthAsync()
}


      console.log("🟢 initAuth → SUCCESS")
      return true

    } catch (e) {
      console.error("❌ initAuth CRASH", e)
      return false

    } finally {
      // ✅ ready seulement si pas déjà prêt
      if (!this.authReadyLight) this.authReadyLight = true
      if (!this.authReady) this.authReady = true

      this.authLoading = false
      this.isInitDone = true
      this._initAuthRunning = false

      if (this.jwt && !_refreshTimer && !this.refreshFailed) {
        this.startAutoRefresh()
      }

      console.log("🏁 initAuth → END")
    }
  })()

  return this._initPromise
}








,

// =============================
// 🧼 FIN PROPRE initAuth
// =============================
_endInitAuth(cb) {
  this.authLoading = false
  this.isInitDone = true
  this.authReady = true

cb?.()

  console.log("🏁 initAuth → END (authReady = true)")
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
  console.log("🧠 auth.user AFTER fetchProf", auth.user)

}

,

    refreshProf() {
      this.ready = false
      this.prof = null
      return this.fetchProf()
    }
  }
});



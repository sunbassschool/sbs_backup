// ============================================================================
// 🏛️ AUTH STORE — VERSION PRO
// Gère : JWT, RefreshToken, SessionID, User, Cache, Auto-Refresh Silent
// Compatibilité totale avec Apps Script (refresh, recupinfosmembres, logout).
// ============================================================================
import { getProxyGetURL,getProxyPostURL,gasPost   } from "@/config/gas.ts"

import { getDeviceId } from "@/utils/device"
import router from "@/router/index.ts"
import {buildUserFromJwt} from "@/utils/jwt_manager.js"
import { defineStore } from "pinia";
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
      authReady: false,
  onboardingReady: false,
  upgradeCTA: null,
      stripe_ready: null,
  elevesByProf: {},
  tsByProf: {},
  hasActiveOfferByProf: {},
dashboardElevesCount: null,
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



onboardingSnapshot: (state) => {
  const profId = state.user?.prof_id

  const stripeOk =
    state.stripe?.status === "ready" &&
    !!state.stripe?.accountId

const hasStudent =
  state.dashboardElevesCount > 0 ||
  state.dashboardElevesCount == null




  const hasOffer =
    state.hasActiveOfferByProf?.[profId] === true

  const hasSale =
    state.hasSaleByProf?.[profId] === true

  const isReady =
    typeof hasOffer === "boolean" &&
    typeof hasSale === "boolean"

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

    const jwt = await getValidToken()
    if (!jwt) return

    const res = await fetch(getProxyPostURL(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "hasactiveproduct",
        jwt,
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
  } finally {
    this.onboardingReady = true
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

  // 👤 USER = TOUJOURS reconstruit depuis JWT
  if (jwt && !this.user) {
    this.user = buildUserFromJwt(jwt)
    console.log("👤 user reconstruit depuis JWT (restore)")
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
  // 🔐 set en mémoire
  this.jwt = jwt
  this.refreshToken = refreshToken
  this.sessionId = sessionId

  // 👤 user depuis JWT
  this.user = buildUserFromJwt(jwt)

  // 💾 persistance
  localStorage.setItem("jwt", jwt)
  localStorage.setItem("refreshToken", refreshToken)
  localStorage.setItem("sessionId", sessionId)

  await saveSessionData({
    jwt,
    refreshToken,
    sessionId
  })

  console.log("✅ session restaurée depuis magic link")
}
,

async ensureValidJwt() {
  if (this.isLoggingOut) return null
  if (!this.jwt) return null

  // ✅ JWT encore valide
  if (!safeIsJwtExpired(this.jwt)) {
    return this.jwt
  }

  // ⏳ refresh déjà en cours → on attend
  if (this.isRefreshingToken) {
    while (this.isRefreshingToken) {
      await new Promise(r => setTimeout(r, 50))
    }
    return this.jwt && !safeIsJwtExpired(this.jwt) ? this.jwt : null
  }

  // 🔄 refresh nécessaire
  const refreshed = await this.refreshJwt()
  return refreshed && !safeIsJwtExpired(refreshed) ? refreshed : null
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

  try {
    const res = await gasPost("recup_infos_membres", { jwt: jwtString })

    // 🔧 support GAS flat OU { data }
    const data = res?.data ?? res

    if (!data?.email) {
      console.warn("⚠️ fetchUserData : données invalides", res)
      return false
    }

    const payload = decodeJwt(jwtString)

    const builtUser = {
      ...data,

      playlist_youtube: data.youtube || "",
      espace_google_drive: data.drive || "",
      objectif: data.objectif || "",

      // priorité JWT
      role: payload?.role ?? data.role,
      prof_id: payload?.prof_id ?? data.prof_id,

      privileges: Array.isArray(data.privileges)
        ? data.privileges
        : []
    }

    this.user = {
      ...(this.user || {}),
      ...builtUser
    }

    localStorage.setItem(
      `userData_${data.email}`,
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

    // 🔄 Rafraîchit le JWT + éventuellement refreshToken & sessionId
    // retry = true permet un second essai après échec
async refreshJwt() {
  if (this.isLoggingOut || this.refreshFailed) {
    console.warn("⛔ refreshJwt annulé")
    return null
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



  // 🔥 SESSION MORTE
console.warn("⛔ refresh KO + JWT expiré → HARD LOGOUT GLOBAL")
await logoutUser()
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
    if (!this.jwt || safeIsJwtExpired(this.jwt)) {
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
  const LEEWAY = 60_000        // refresh 1 min avant exp
  const MIN_DELAY = 15_000
  const MAX_DELAY = 10 * 60_000

  console.group("⏰ [AutoRefresh] start")

  // ===============================
  // 🧱 GUARDS
  // ===============================
  if (!this.isInitDone) {
    console.log("⛔ init non terminée")
    console.groupEnd()
    return
  }

  if (this.isLoggingOut || this.refreshFailed) {
    console.log("⛔ logout ou refreshFailed")
    console.groupEnd()
    return
  }

  if (!this.jwt) {
    console.log("⛔ pas de JWT")
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
    console.warn("⚠️ exp JWT introuvable → abort")
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
    console.log("🧹 ancien timer nettoyé")
  }

  // ===============================
  // ⏱️ ARM TIMER
  // ===============================
  console.log("⏱️ timer armé")

  _refreshTimer = setTimeout(async () => {
    console.group("🔥 [AutoRefresh] TIMER FIRED")

    // ---------- GUARDS TIMER ----------
    if (this.isLoggingOut || this.refreshFailed) {
      console.log("⛔ abort (logout / refreshFailed)")
      console.groupEnd()
      return
    }

    if (!navigator.onLine) {
      console.log("📡 offline → attente réseau")
      window.addEventListener(
        "online",
        () => this.startAutoRefresh(),
        { once: true }
      )
      console.groupEnd()
      return
    }

    if (this.isRefreshingToken) {
      console.log("⏳ refresh déjà en cours → skip")
      console.groupEnd()
      return
    }

    // ---------- REFRESH ----------
    console.log("🔄 refreshJwt() call")
    const jwt = await this.refreshJwt()

    if (!jwt) {
      console.warn("⛔ refresh KO → arrêt définitif")
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

// 🚀 Initialisation complète de l’auth au boot app
// 🚀 Initialisation complète de l’auth au boot app (SAFE)
async initAuth() {
  console.log("🔐 initAuth → START")

  // =============================
  // 🔒 LOCK
  // =============================
  if (this._initAuthRunning) return false
  this._initAuthRunning = true

  // =============================
  // 🌍 APP TOUJOURS VISIBLE
  // =============================
  this.authReady = false          // ⚠️ JAMAIS remis à false
  this.authLoading = true
  this.jwtReady = false
  this.isInitDone = false

  const end = () => {
    this.authLoading = false
    this.isInitDone = true
    this._initAuthRunning = false
    console.log("🏁 initAuth → END")
  }

  // =============================
  // ⛔ ABORTS
  // =============================
  if (this.isLoggingOut || this.isLoggingIn) {
    end()
    return false
  }

  const storedJwt = localStorage.getItem("jwt")
if (!storedJwt || sessionStorage.getItem("AUTH_ABORTED")) {
  this.authReady = true   // 👈 AUTH PRÊTE (guest)
  end()
  return false
}


  try {
    // =============================
    // 1️⃣ RESTORE SESSION
    // =============================
    await this.restoreSessionFromStorage()

    let jwt = this.jwt
    let expired = true
    try {
      expired = jwt ? isJwtExpired(jwt) : true
    } catch {}

    // =============================
    // 2️⃣ REFRESH SI BESOIN
    // =============================
    if (jwt && expired) {
      jwt = await this.refreshJwt()
      if (!jwt) {
        await logoutUser("refresh_failed")
        end()
        return false
      }
    }

    // =============================
    // 3️⃣ NORMALISATION JWT
    // =============================
    const finalJwt =
      typeof jwt === "string"
        ? jwt
        : (jwt && jwt.jwt) || null

 if (!finalJwt) {
  await logoutUser("jwt_missing_after_restore")
  end()
  return false
}


    this.jwt = finalJwt
    localStorage.setItem("jwt", finalJwt)
    this.jwtReady = true

    const ok = await this.fetchUserData()
if (!ok) {
  await logoutUser("fetch_user_failed")
  end()
  return false
}

    // =============================
    // 4️⃣ USER MINIMAL (SYNC)
    // =============================
    const payload = decodeJwt(finalJwt) || {}

// ✅ USER GARANTI
if (!this.user && finalJwt) {
  this.user = buildUserFromJwt(finalJwt)
}


    this.prof_id = this.user.prof_id || null

    // =============================
    // 5️⃣ FETCH MÉTIER (ASYNC / NON BLOQUANT)
    // =============================
    if (!this.onboardingReady) {
      const tasks = []

      if (["prof", "admin"].includes(this.user.role) && this.user.prof_id) {
        const profStore = useProfStore()
        tasks.push(profStore.fetchProf(true))
        tasks.push(this.fetchHasOffer())
      }

      tasks.push(this.fetchPendingReports())

  Promise.allSettled(tasks)
  .catch(() => {}) // sécurité
  .finally(() => {
    this.onboardingReady = true
    console.log("🧠 onboarding ready (forced)")
  })

    }

    // =============================
    // 6️⃣ AUTO REFRESH
    // =============================
    const refreshToken = localStorage.getItem("refreshToken")
    const sessionId = localStorage.getItem("sessionId")
    if (refreshToken && sessionId) {
      this._shouldStartAutoRefresh = true
    }

    // =============================
    // 7️⃣ REDIRECT LOGIN
    // =============================
    if (router.currentRoute.value.name === "login") {
      router.replace(
        ["prof", "admin"].includes(this.user.role)
          ? "/dashboard-prof"
          : "/dashboard"
      )
    }
this.authReady = true

    console.log("🟢 initAuth → SUCCESS")
    end()
    return true

  } catch (e) {
    console.error("❌ initAuth CRASH", e)
    localStorage.clear()
    sessionStorage.clear()
    sessionStorage.setItem("AUTH_ABORTED", "1")
    end()
    return false
  }
}


,

// =============================
// 🧼 FIN PROPRE initAuth
// =============================
_endInitAuth(cb) {
  this.authLoading = false
  this.isInitDone = true
  this.authReady = true

  requestAnimationFrame(() => {
    window.__HIDE_SPLASH__?.()
    cb?.()
  })

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



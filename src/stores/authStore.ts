// src/stores/authStore.ts
import { defineStore } from "pinia";
import {
  getValidToken,
  updateJWTInIndexedDB,
  getUserInfoFromJWT,
  getRefreshTokenFromDB,
  refreshToken as apiRefreshToken,
  logoutUser,checkForStoredTokens
} from "@/utils/api.ts";

interface User {
  email: string;
  prenom: string;
  role: string;
  abonnement: string;
  // — ajoute d'autres champs si tu en as dans les données utilisateur
  [key: string]: any;
}
interface RefreshResponse {
  jwt: string;
  refreshToken: string;
  sessionId?: string;
}

export interface AuthState {
  menuOpen: boolean;
  impersonateStudent: boolean;
  user: User | null;
  jwt: string | null;
  refreshToken: string | null;
  authLoading: boolean;
  refreshFailed: boolean;
  isInitDone: boolean;
sessionId: string | null;

  isRefreshingToken: boolean;
  forceRefresh: number;
  lastRefreshAttempt: number;
sidebarIsVisible: boolean;

  isLoggingOut: boolean;
  authReady: boolean; // <-- AJOUT ICI

  /** interne — ne pas persister */
  _refreshInterval?: number;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    authReady: false,

    menuOpen: false,
    impersonateStudent: localStorage.getItem("impersonateStudent") === "true",
    user: null,
    jwt: null,
    sessionId: null,

    refreshToken: null,
    authLoading: false,
    refreshFailed: false,
    isInitDone: false,
    isRefreshingToken: false,
    forceRefresh: 0,
    lastRefreshAttempt: 0,
    isLoggingOut: false,
    _refreshInterval: undefined,
    sidebarIsVisible: true,

  }),

  getters: {
    isLoggedIn: (state): boolean => {
      if (!state.jwt) return false;
      try {
        const payload = JSON.parse(atob(state.jwt.split(".")[1]));
        return Date.now() < payload.exp * 1000;
      } catch (e) {
        return false;
      }
    },
    isAdmin: (state): boolean => {
      if (!state.user) return false;
      if (state.impersonateStudent) return false;
      return state.user.role === "admin";
    },
    isReady: (state): boolean => {
      return !!state.user;
    },
    needsRefresh: (state): boolean => {
      if (!state.jwt) return false;
      try {
        const payload = JSON.parse(atob(state.jwt.split(".")[1]));
        const expiresIn = payload.exp * 1000 - Date.now();
        return expiresIn < 10_000; // < 10s
      } catch {
        return false;
      }
    },
  },

  actions: {
    toggleMenu(force: boolean | null = null) {
      if (force === true) {
        this.menuOpen = true;
      } else if (force === false) {
        this.menuOpen = false;
      } else {
        this.menuOpen = !this.menuOpen;
      }
    },
setSessionId(id: string) {
  this.sessionId = id;
}
,
    toggleImpersonateStudent() {
      this.impersonateStudent = !this.impersonateStudent;
      localStorage.setItem("impersonateStudent", this.impersonateStudent ? "true" : "false");
    },

    setImpersonate(value: boolean) {
      this.impersonateStudent = value;
      localStorage.setItem("impersonateStudent", value ? "true" : "false");
    },

setUserToken(token: string) {
  this.jwt = token;
  localStorage.setItem("jwt", token);
  sessionStorage.setItem("jwt", token);
  updateJWTInIndexedDB(token); // ✅ Persistance PWA
},

    setRefreshToken(token: string) {
      this.refreshToken = token;
    },

   async fetchUserData(): Promise<void> {
  if (!this.jwt || !this.user?.prenom) {
    console.warn("fetchUserData: pas de JWT ou pas de user.prenom");
    return;
  }

  try {
    const prenom = this.user.prenom;
    const apiBase = "https://script.google.com/macros/s/";
    const routeID = "AKfycbw-LmDbIdL0asIu5WrQcskGh1J2Pr_ZxxepoUsC5B5yWpo_WDDH0MqzrFZAPMm0Tyls-A";
    const url = `${apiBase}${routeID}/exec?route=recupinfosmembres&jwt=${encodeURIComponent(
      this.jwt
    )}&prenom=${encodeURIComponent(prenom)}`;
    const finalURL = `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(url)}`;

    const res = await fetch(finalURL);
    const contentType = res.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const raw = await res.text();
      console.error("❌ Réponse non JSON reçue :", raw);
      return;
    }

    const data = await res.json();

    if (!data.error) {
      this.user = { ...this.user, ...data };
      localStorage.setItem("userData_" + prenom, JSON.stringify(data));
      console.log("✅ Données utilisateur mises à jour via API :", this.user);
    } else {
      console.warn("⚠️ fetchUserData: réponse API avec erreur :", data);
    }
  } catch (e) {
    console.error("❌ Erreur fetchUserData :", e);
  } finally {
  
  }
}
,
async loadUser(): Promise<boolean | void> {
  console.log("🔄 Chargement des infos utilisateur...");

  try {
    // 1️⃣ Charger un JWT valide si possible
    const validJwt = await getValidToken();
    this.jwt = validJwt || null;

    // 2️⃣ Charger refreshToken depuis DB ou fallback local
    let refresh = await getRefreshTokenFromDB();

    if (!refresh) {
      const localRefresh = localStorage.getItem("refreshToken");
      if (localRefresh) {
        console.log("🟠 refreshToken trouvé en localStorage (fallback)");
        refresh = localRefresh;
      }
    }

    // 3️⃣ Aucun token → pas logué
    if (!this.jwt && !refresh) {
      console.warn("⚠️ Aucun token trouvé dans loadUser().");
      this.authLoading = false;
      this.refreshFailed = true;
      return;
    }

    // 4️⃣ Refresh dispo mais pas de JWT → tenter refresh
    if (!this.jwt && refresh) {
      console.log("🔁 Tentative de refresh via refreshToken local");
      
      const newJwt = await this.refreshJwt();
      if (!newJwt) {
        console.error("🚨 Impossible de rafraîchir. Déconnexion.");
        logoutUser();
        return;
      }

      this.jwt = newJwt;
    }

    // 5️⃣ JWT présent → tenter de décoder
    let userInfo = this.jwt ? getUserInfoFromJWT(this.jwt) : null;

    if (!userInfo) {
      console.warn("⚠️ JWT invalide → tentative de refresh...");

      const newJwt = await this.refreshJwt();
      if (!newJwt) {
        console.error("🚨 Aucun JWT valide même après refresh. Déconnexion.");
        logoutUser();
        return;
      }

      this.jwt = newJwt;
      userInfo = getUserInfoFromJWT(newJwt);

      if (!userInfo) {
        console.error("🚨 JWT rafraîchi toujours invalide. Déconnexion.");
        logoutUser();
        return;
      }
    }

    // 6️⃣ Mettre à jour user + refreshToken
    this.user = userInfo;
    this.refreshToken = refresh || null;

    console.log("✅ Utilisateur mis à jour via JWT :", this.user);

    return true;

  } catch (err) {
    console.error("❌ Erreur loadUser() :", err);
    logoutUser();
  }
}
,

async refreshJwt(): Promise<string | null> {
  if (this.isRefreshingToken) return null;
  this.isRefreshingToken = true;

  // Indique à l'UI qu'un refresh est en cours
  sessionStorage.setItem("refreshInProgress", "true");
  sessionStorage.setItem("refreshDuration", "0"); 

  const start = performance.now();

  try {
    const result = await apiRefreshToken(); // <= OBJET
    if (!result || !result.jwt) throw new Error("JWT manquant dans le refresh");

    const jwtString = result.jwt; // <= EXTRACTION STRING

    // Mise à jour du token principal
    this.setUserToken(jwtString);

    // Mise à jour refresh + sessionId
    if (result.refreshToken) {
      this.refreshToken = result.refreshToken;
      localStorage.setItem("refreshToken", result.refreshToken);
    }

    if (result.sessionId) {
      this.sessionId = result.sessionId;
      localStorage.setItem("sessionId", result.sessionId);
    }

    // Durée réelle pour l'UI
    const duration = performance.now() - start;
    sessionStorage.setItem("refreshDuration", duration.toFixed(0));

    return jwtString; // <= ON RENVOIE QUE LA STRING

  } catch (err) {
    console.error("❌ Refresh JWT échoué :", err);
    this.refreshFailed = true;
    return null;

  } finally {
    this.isRefreshingToken = false;
    sessionStorage.removeItem("refreshInProgress");
    sessionStorage.removeItem("refreshDuration");
  }
}

,

    triggerRefresh() {
      this.forceRefresh = Date.now();
    },

  async initAuth() {
  console.log("🔵 initAuth lancé");
  this.authLoading = true;

  try {
    // 🔍 Récupérer depuis localStorage si getValidToken() ne le fait pas déjà
    let token = await getValidToken();

    if (!token) {
      const saved = localStorage.getItem("jwt");
      if (saved) {
        console.log("📦 JWT restauré depuis localStorage");
        token = saved;
      }
    }

    const hasStoredTokens = await checkForStoredTokens();

    if (token) {
      this.jwt = token;
      const ok = await this.loadUser();
      console.log("🔵 loadUser OK ?", ok);
    } else {
      if (hasStoredTokens) {
        console.log("⛔ Tokens attendus mais invalides → vraie déconnexion");
        await logoutUser();
      } else {
        console.log("🔕 Aucun token stocké → on reste simplement non connecté");
        this.jwt = null;
        this.user = null;
      }
    }
  } catch (err) {
    console.warn("⚠️ initAuth erreur :", err);
  } finally {
    this.authLoading = false;
    this.isInitDone = true;
  }
}

,setUser(userData: Partial<User>) {
this.user = {
  ...(this.user || {}),
  ...(userData || {})
} as User;

}
,
    
  },
});

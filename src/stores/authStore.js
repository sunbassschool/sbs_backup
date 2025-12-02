import { defineStore } from "pinia";
  import { readKV } from "@/utils/AuthDBManager";


import { getValidToken, getUserInfoFromJWT, refreshToken, logoutUser,decodeJwt  } from "@/utils/api.ts";
import { saveSessionData, getSessionIdFromDB } from "@/utils/AuthDBManager.ts"; // 👈 Chemin à adapter si besoin
window.saveSessionData = saveSessionData;
window.readKV = readKV;


export const useAuthStore = defineStore("auth", {
state: () => ({
    refreshToken: localStorage.getItem("refreshToken") || null,

  menuOpen: false,
  impersonateStudent: localStorage.getItem("impersonateStudent") === "true",
  user: null,
  jwt: localStorage.getItem("jwt") || null,     // ← 🆕 FIX
  authLoading: false,
  refreshFailed: false,
  isInitDone: false,
  isRefreshingToken: false,
  lastRefreshAttempt: 0

}),


  getters: {
    isLoggedIn: (state) => {
      if (!state.jwt) return false;
      try {
        const payload = JSON.parse(atob(state.jwt.split('.')[1]));
        return Date.now() < payload.exp * 1000;
      } catch {
        return false;
      }
    },
    isReady: (state) => !!state.user,

isAdmin: (state) => {
  // Tant que user n’est pas chargé, on ne retourne rien
  if (!state.user) return false;

  // Si en mode élève, masquer admin
  if (state.impersonateStudent) return false;

  // Sinon rôle normal
  return state.user?.role === "admin";
},


  needsRefresh: (state) => {
  if (!state.jwt) return false;
  try {
    const payload = JSON.parse(atob(state.jwt.split('.')[1]));
    const expiresIn = payload.exp * 1000 - Date.now();

    console.log("⏱️ expiresIn =", expiresIn, "ms");

    return expiresIn < 10_000; // ⏳ Seulement si < 4 min
  } catch {
    return false;
  }
}

  },

  actions: {
async setSessionData({ jwt, refreshToken, sessionId, userData = null }) {
  if (jwt) {
    this.jwt = jwt;
    localStorage.setItem("jwt", jwt);
  }

  if (refreshToken) {
    this.refreshToken = refreshToken;
    localStorage.setItem("refreshToken", refreshToken);
    sessionStorage.setItem("refreshToken", refreshToken);
  }

  // ✅ Toujours garder la session existante si aucune nouvelle session
  const sessionIdToSave = sessionId?.trim() || this.sessionId || localStorage.getItem("sessionId") || (await getSessionIdFromDB());

  if (sessionIdToSave) {
    this.sessionId = sessionIdToSave;
    localStorage.setItem("sessionId", sessionIdToSave);
    sessionStorage.setItem("sessionId", sessionIdToSave);
  }

  try {
    await saveSessionData({
      jwt: this.jwt || "",
      refreshToken: this.refreshToken || "",
      sessionId: this.sessionId || "", // ← maintenant jamais vide
      userData,
    });
  } catch (err) {
    console.error("❌ Erreur saveSessionData :", err);
  }
}


,
ensureUserLoaded() {
  if (this.user && this.user.email) return; // déjà chargé

  const jwt = this.jwt || localStorage.getItem("jwt") || sessionStorage.getItem("jwt");
  if (!jwt) {
    console.warn("⛔ Pas de JWT trouvé dans ensureUserLoaded()");
    return;
  }

  const apiBase = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";
  const query = `?route=recupinfosmembres&jwt=${encodeURIComponent(jwt)}`;
  const fullUrl = `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(apiBase + query)}`;

  return fetch(fullUrl)
    .then(res => res.json())
    .then(data => {
      if (data?.email) {
        this.user = data;
        localStorage.setItem(`userData_${data.email}`, JSON.stringify(data));
        window.dispatchEvent(new CustomEvent("userDataUpdated", { detail: data }));
        console.log("✅ ensureUserLoaded → données chargées");
      } else {
        console.warn("⚠️ Données utilisateur invalides depuis l'API :", data);
      }
    })
    .catch(err => {
      console.error("❌ Erreur réseau dans ensureUserLoaded :", err);
    });
}
,
    startAutoRefresh() {
  if (this._refreshInterval) return;

  this._refreshInterval = setInterval(async () => {
    if (this.needsRefresh && !this.isRefreshingToken) {
      console.log("♻️ Refresh auto déclenché (timer)");
      await this.refreshJwt();
    }
  }, 60_000); // toutes les 60 secondes
}
,
    toggleMenu(force = null) {
  if (force === true) {
    this.menuOpen = true;
  } else if (force === false) {
    this.menuOpen = false;
  } else {
    this.menuOpen = !this.menuOpen;
  }
},
toggleImpersonateStudent() {
  this.impersonateStudent = !this.impersonateStudent;
  console.log("🔄 impersonateStudent =", this.impersonateStudent);
  localStorage.setItem("impersonateStudent", this.impersonateStudent);
}

,
setRefreshToken(token) {
  localStorage.setItem("refreshToken", token);
  sessionStorage.setItem("refreshToken", token);
}
,
setImpersonate(value) {
  this.impersonateStudent = value;
  localStorage.setItem("impersonateStudent", value);
}
,
// Méthode pour définir le token utilisateur
async setUserToken(token) {
  this.jwt = token;
  localStorage.setItem("jwt", token);

  await this.setSessionData({ jwt: token });

  console.log("JWT mis à jour :", token);
},

// Mise à jour du RefreshToken
async setRefreshToken(token) {
  this.refreshToken = token;
  localStorage.setItem("refreshToken", token);
  sessionStorage.setItem("refreshToken", token);

  await this.setSessionData({ refreshToken: token });

  console.log("RefreshToken mis à jour :", token);
},

// Mise à jour du SessionId
async setSessionId(sessionId) {
  localStorage.setItem("sessionId", sessionId);
  sessionStorage.setItem("sessionId", sessionId);

  await this.setSessionData({ sessionId });

  console.log("SessionId mis à jour :", sessionId);
},


async loadUser(forceApi = false) {
  if (this.user?.email && !forceApi) {
    console.log("🛑 Utilisateur déjà chargé, skip API.");
    return true;
  }

  console.log("🔄 Chargement des infos utilisateur...");

  try {
    const jwt = this.jwt || await getValidToken();
    this.jwt = jwt;

    if (!this.jwt) {
      console.warn("⚠️ Aucun JWT valide trouvé → logout");
      this.jwt = null;
      return false;
    }

    const rawUser = getUserInfoFromJWT(this.jwt);
    if (!rawUser) {
      console.warn("⚠️ JWT ne contient pas les infos → tentative API...");
      return await this.fetchUserData(); // retourne directement le succès
    }

    if (rawUser?.prenom) {
      try {
        rawUser.prenom = decodeURIComponent(escape(rawUser.prenom));
      } catch (err) {
        console.warn("⚠️ UTF-8 prénom incorrect :", rawUser.prenom);
      }
    }

    this.user = { ...rawUser };
    console.log("🧾 Utilisateur depuis JWT :", this.user);

    return await this.fetchUserData(); // retourne le résultat final

  } catch (error) {
    console.error("❌ Erreur loadUser() :", error);
    return false;
  }
}



,
async fetchUserData() {
  if (!this.jwt || typeof this.jwt !== 'string' || !this.jwt.includes('.')) {
    console.warn("⛔ JWT invalide dans fetchUserData :", this.jwt);
    return false;
  }

  this.authLoading = true;

  const routeID = "AKfycbw7aU_Z20EZKV8AytvPPYMhTLxtQNegdpg5ImFeiGqY35jKfRB0gk3pIhXTOFS7NaCTZA";
  const buildUrl = (jwt) => {
    const rawUrl = `https://script.google.com/macros/s/${routeID}/exec?route=recupinfosmembres&jwt=${encodeURIComponent(jwt)}`;
    return `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(rawUrl)}`;
  };

  let attempt = 0;
  while (attempt < 2) {
    const finalUrl = buildUrl(this.jwt);
    console.log("🧪 URL API finale :", finalUrl);
    console.log("📡 fetchUserData appelé avec :", { jwt: this.jwt });

    try {
      const res = await fetch(finalUrl);
      const data = await res.json();
      console.log("📦 Données brutes de l’API :", data);

      if (data?.email) {
        localStorage.setItem("email", data.email);
        if (data.prenom) localStorage.setItem("prenom", data.prenom);

        const mapped = {
          ...data,
          playlist_youtube: data.youtube || "",
          espace_google_drive: data.drive || "",
          objectif: data.objectif || "",
        };

        this.user = { ...this.user, ...mapped };
        const cacheKey = `userData_${data.email}`;
        localStorage.setItem(cacheKey, JSON.stringify(this.user));

        console.log("✅ Données utilisateur enrichies via API :", this.user);
        return true; // ✅ SUCCÈS
      }

      else if (data?.message === 'JWT expiré') {
        console.warn("⚠️ JWT expiré, tentative de refresh...");
        const newJwt = await refreshToken();

        if (!newJwt) {
          console.error("❌ Impossible de rafraîchir le token");
          return false;
        }

        this.jwt = newJwt;
        attempt++;
        continue;
      }

      else {
        console.warn("⚠️ fetchUserData : données incomplètes ou invalides :", data);
        return false;
      }

    } catch (e) {
      console.error("❌ Exception fetchUserData :", e);
      return false;
    } finally {
      this.authLoading = false;
    }
  }

  return false; // ❌ si on sort de la boucle sans succès
}

,
async refreshJwt(retry = false) {
  if (this.isLoggingOut) {
  console.warn("⛔ refreshJwt() annulé : déconnexion déjà en cours");
  return null;
}

  if (this.isRefreshingToken) return null;
  this.isRefreshingToken = true;

  // ✅ Signale à l'interface qu'un refresh est en cours
  sessionStorage.setItem("refreshInProgress", "true");
  sessionStorage.setItem("refreshDuration", "0"); // valeur par défaut

  const start = performance.now(); // 🕒 début du timer

  try {
    const newJwt = await refreshToken(); // 👈 ton appel réel à l'API

    if (!newJwt || typeof newJwt !== "string") {
      throw new Error("JWT manquant ou invalide pendant le refresh");
    }

    this.setUserToken(newJwt);

    const duration = performance.now() - start;
    sessionStorage.setItem("refreshDuration", duration.toFixed(0)); // durée en ms

    this.refreshFailed = false;
    return newJwt;

  } catch (err) {
    console.error("❌ Échec du refresh JWT :", err);
    this.refreshFailed = true;

   if (!retry) {
  console.warn("🕒 Nouvelle tentative dans 5 secondes...");

  setTimeout(() => {
    // ⛔ On vérifie qu'on n'est pas en train de se déconnecter
    if (this.isLoggingOut || localStorage.getItem("logout_in_progress") === "true") {
      console.warn("⛔ Annulation de la relance : logout en cours");
      return;
    }

    this.refreshJwt(true);
  }, 5000);

} else {
  console.error("🔥 Deuxième échec → déconnexion");

  setTimeout(() => {
    // ⛔ On évite un logout multiple
    if (this.isLoggingOut || localStorage.getItem("logout_in_progress") === "true") {
      console.warn("⛔ Logout déjà en cours");
      return;
    }

    this.logout();
  }, 2000);
}


    return null;

  } finally {
    this.isRefreshingToken = false;
    sessionStorage.removeItem("refreshInProgress");
    sessionStorage.removeItem("refreshDuration"); // 🧼 nettoyage
  }
},




logout: async function () {
  if (this.isLoggingOut || localStorage.getItem("logout_in_progress") === "true") {
    console.log("🚫 Logout déjà en cours — annulé.");
    return;
  }

  this.isLoggingOut = true;
  localStorage.setItem("logout_in_progress", "true");

  console.log("🚪 Déconnexion en cours...");

  try {
    await logoutUser(); // 👈 Clean session serveur + redirection
  } catch (err) {
    console.warn("⚠️ Erreur lors du logout serveur :", err);
  }

  // Nettoyage
  this.jwt = null;
  this.user = null;

  ['jwt', 'refreshToken', 'sessionId'].forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  this.isLoggingOut = false;
  localStorage.removeItem("logout_in_progress");

  console.log("✅ Déconnexion réussie");

  // Optionnel : router.replace("/login");
}

,

    triggerRefresh() {
      if (!this.isRefreshingToken) {
        console.log("🔄 Tentative de rafraîchissement...");
        this.refreshJwt();  // Appeler le rafraîchissement si aucun rafraîchissement n'est en cours
      } else {
        console.log("🛑 Rafraîchissement déjà en cours...");
      }
    },

async initAuth() {
  console.log("🔵 initAuth lancé");

  try {
    const token = await getValidToken();
    console.log("🔵 étape 2 : token reçu ?", token);

    if (token) {
      this.jwt = token;

      // 🧠 Planification d'un refresh anticipé
      try {
        const payload = decodeJwt(token); // ou decodeJwtWithoutVerify()
        const now = Date.now();
        const exp = payload.exp * 1000;
        const timeBeforeRefresh = exp - now - 60000; // 60 sec avant

        if (timeBeforeRefresh > 0) {
          console.log(`🕓 Refresh auto prévu dans ${Math.round(timeBeforeRefresh / 1000)} sec`);
          setTimeout(() => {
            console.log("🔄 Refresh anticipé déclenché");
            this.refreshToken();
          }, timeBeforeRefresh);
        } else {
          console.warn("⏱️ Le token expire bientôt → refresh immédiat");
          this.refreshToken();
        }
      } catch (e) {
        console.warn("⚠️ Impossible de décoder le JWT pour planifier le refresh :", e);
      }

      // 🚀 Chargement utilisateur immédiat (non bloquant)
      const userPromise = this.loadUser();
      this.authLoading = true;

      userPromise.then(success => {
        if (this.user?.email) {
          localStorage.setItem("email", this.user.email);
        }
        if (this.user?.prenom) {
          localStorage.setItem("prenom", this.user.prenom);
        }

        if (!success) {
          console.warn("⚠️ User load failed despite valid token");
        }
      }).catch(err => {
        console.warn("⚠️ Erreur lors de loadUser :", err);
      }).finally(() => {
        this.authLoading = false;
      });

    } else {
      console.log("🔵 Aucun token → pas connecté");
    }

  } catch (err) {
    console.warn("⚠️ initAuth erreur :", err);
  } // Ajout d'un flag séparé pour loader non-blockant
this.authLoading = true;

try {
  const token = await getValidToken();
  if (token) {
    this.jwt = token;

    // Planification refresh anticipé
    try {
      const payload = decodeJwt(token);
      const now = Date.now();
      const exp = payload.exp * 1000;
      const timeBeforeRefresh = exp - now - 60000;
      if (timeBeforeRefresh > 0) {
        setTimeout(() => this.refreshToken(), timeBeforeRefresh);
      } else {
        this.refreshToken();
      }
    } catch (e) { console.warn("⚠️ Impossible de décoder JWT:", e); }

    // Chargement utilisateur
    await this.loadUser().catch(err => console.warn("⚠️ loadUser erreur :", err));
  }
} catch (err) {
  console.warn("⚠️ initAuth erreur :", err);
} finally {
  // Fin du loader non-blockant
  this.authLoading = false;

  // L'app est prête à s'afficher même si user n'est pas encore chargé
  this.isInitDone = true;
  this.isRefreshingToken = false;

  if (this.showOverlay !== undefined) this.showOverlay = false;

  this.startAutoRefresh();
}

}

,




  }
});

<template>
  <div class="layout-container" :class="{ 'with-sidebar': sidebarIsVisible }">

    <!-- ========================================================= -->
    <!-- 🟥 1) SIDEBAR (Desktop uniquement)                        -->
    <!-- ========================================================= -->
    <aside
      class="sidebar"
      :class="{ isCollapsed: isSidebarCollapsed, hidden: isMobile }"
    >
      <!-- Logo -->
      <div class="sidebar-logo">
        <img :src="logoUrl" class="sidebar-main-logo" alt="SunBassSchool" />
      </div>

      <!-- ======================== -->
      <!-- MENU : ÉLÈVE (non admin / non prof) -->
      <!-- ======================== -->
      <nav class="sidebar-nav">
<!-- ======================== -->
<!-- MENU : PUBLIC (non connecté) -->
<!-- ======================== -->
<template v-if="!isLoggedIn">
 

  <router-link to="/videos" class="sidebar-link">
    <i class="bi bi-film"></i>
    <span>Vidéos</span>
  </router-link>

  <router-link to="/partitions" class="sidebar-link">
    <i class="bi bi-music-note-beamed"></i>
    <span>Partitions</span>
  </router-link>

  <router-link to="/BassTuner" class="sidebar-link">
    <i class="bi bi-music-note"></i>
    <span>Accordeur</span>
  </router-link>
</template>

        <!-- Élève : bouton "Prendre un cours" externe -->
        <a
          v-if="isLoggedIn && isEleve"
          class="sidebar-link btn-cours"
          href="https://www.sunbassschool.com/step/inscription-aux-cours-en-visio/"
          target="_blank"
        >
          <i class="bi bi-play-circle"></i>
          <span>Prendre un cours</span>
        </a>

        <router-link v-if="isLoggedIn && isEleve" to="/dashboard" class="sidebar-link">
          <i class="bi bi-house-door"></i>
          <span>Accueil</span>
        </router-link>

        <router-link v-if="isLoggedIn && isEleve" to="/moncompte" class="sidebar-link">
          <i class="bi bi-person-circle"></i>
          <span>Mon compte</span>
        </router-link>

        <router-link v-if="isLoggedIn && isEleve" to="/videos" class="sidebar-link">
          <i class="bi bi-film"></i>
          <span>Vidéos</span>
        </router-link>

        <router-link v-if="isLoggedIn && isEleve" to="/planning" class="sidebar-link">
          <i class="bi bi-calendar-check"></i>
          <span>Plannings</span>
        </router-link>

        <router-link v-if="isLoggedIn && isEleve" to="/replay" class="sidebar-link">
          <i class="bi bi-play-btn"></i>
          <span>Replay</span>
        </router-link>

        <router-link v-if="isLoggedIn && isEleve" to="/Feedback" class="sidebar-link">
          <i class="bi bi-chat-left-text"></i>
          <span>Feedback</span>
        </router-link>

        <router-link v-if="isLoggedIn && isEleve" to="/videos" class="sidebar-link">
  <i class="bi bi-film"></i>
  <span>Vidéos</span>
</router-link>

<router-link v-if="isLoggedIn && isEleve" to="/partitions" class="sidebar-link">
  <i class="bi bi-music-note-beamed"></i>
  <span>Partitions</span>
</router-link>

<router-link v-if="isLoggedIn && isEleve" to="/BassTuner" class="sidebar-link">
  <i class="bi bi-music-note"></i>
  <span>Accordeur</span>
</router-link>


        <!-- ======================== -->
        <!-- MENU : PROF (prof ou admin) -->
        <!-- ======================== -->
        <router-link v-if="isProf" to="/dashboard-prof" class="sidebar-link">
          <i class="bi bi-speedometer2"></i>
          <span>Dashboard Prof</span>
        </router-link>

        <router-link v-if="isProf" to="/FeedBackProf" class="sidebar-link">
          <i class="bi bi-chat-left-dots"></i>
          <span>Feedbacks Élèves</span>
        </router-link>

        <router-link v-if="isProf" to="/gestioneleves" class="sidebar-link">
          <i class="bi bi-people"></i>
          <span>Gestion Élèves</span>
        </router-link>

        <!-- 🔥 AJOUT POUR PROF -->
<router-link v-if="isProf" to="/CreatePlanning" class="sidebar-link">
  <i class="bi bi-calendar-event"></i>
  <span>Créer un planning</span>
</router-link>

<router-link v-if="isProf" to="/cours" class="sidebar-link">
  <i class="bi bi-wrench-adjustable"></i>
  <span>Gestion des cours</span>
</router-link>

        <!-- ======================== -->
        <!-- MENU : ADMIN ONLY -->
        <!-- ======================== -->
        <router-link v-if="isAdmin" to="/AdminFeedBack" class="sidebar-link">
          <i class="bi bi-shield-lock"></i>
          <span>Feedbacks Admin</span>
        </router-link>

        <router-link v-if="isAdmin" to="/CreatePlanning" class="sidebar-link">
          <i class="bi bi-calendar-event"></i>
          <span>Créer un planning</span>
        </router-link>

        <router-link v-if="isAdmin" to="/register-cursus" class="sidebar-link">
          <i class="bi bi-person-plus"></i>
          <span>Ajouter un élève</span>
        </router-link>

        <router-link v-if="isAdmin" to="/cours" class="sidebar-link">
          <i class="bi bi-wrench-adjustable"></i>
          <span>Cours <span v-if="pendingCount > 0">({{ pendingCount }})</span></span>
        </router-link>

      </nav>
    </aside>

    <!-- Bouton collapse desktop -->
    <button
      v-if="!isMobile"
      class="toggle-menu-btn"
      @click="toggleSidebar"
    >
      <i :class="isSidebarCollapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-left'"></i>
    </button>

    <!-- ========================================================= -->
    <!-- 🟦 2) HEADER (mobile + desktop)                           -->
    <!-- ========================================================= -->
    <header class="hero-banner">
      <div class="hero-content">

        <!-- Logo desktop -->
        <img
          v-if="!isMobile"
          :src="logoUrl"
          class="logo"
          alt="SunBassSchool"
        />

        <!-- Logo mobile si pas connecté -->
        <img
          v-if="showResponsiveLogo"
          :src="logoUrl"
          class="logo responsive-logo"
        />

        <!-- Burger menu mobile -->
        <button class="menu-btn" v-if="isMobile" @click="authStore.toggleMenu()">
          <i class="bi bi-list"></i>
        </button>

        <!-- Boutons mobile : compte + logout -->
        <div v-if="isLoggedIn && isMobile" class="mobile-account-actions">
          <router-link to="/moncompte">
            <i class="bi bi-person-circle"></i>
          </router-link>
          <button @click="handleLogout">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        </div>

        <!-- Installer PWA -->
        <button v-if="showInstallButton" @click="installPWA" class="install-btn">📥</button>

        <!-- Titre / Slogan -->
        <div class="hero-text">
          <h1 class="hero-title">SunBassAPP</h1>
          <p class="hero-subtitle">L'école de basse en ligne qui groove</p>
        </div>

        <!-- Auth desktop -->
        <div v-if="!isLoggedIn && !isMobile" class="desktop-auth-buttons">
          <router-link to="/login" class="btn-auth login-btn">Se connecter</router-link>
          <router-link to="/registerform" class="btn-auth trial-btn">Essai Gratuit</router-link>
        </div>

        <!-- Abonnement + compte desktop -->
        <div v-if="isLoggedIn && !isMobile" class="account-info-block">
          <router-link to="/moncompte" class="account-link">
            <i class="bi bi-person-gear"></i>
          </router-link>
          

          <div v-if="user?.statut" class="subscription-badge mt-2">
            <template v-if="isSubscribed">
              <span class="badge bg-success">✅ Abonné</span>
            </template>
            <template v-else>
   <router-link
  :to="{ name: 'Abonnements' }"
  class="subscription-badge-link"
>
  ❌ Non abonné
</router-link>


            </template>
          </div>
        </div>

      </div>
    </header>

    <!-- ========================================================= -->
    <!-- 🟩 3) MENU MOBILE (overlay)                               -->
    <!-- ========================================================= -->
    <div v-if="showMenu" class="menu-overlay" @click="toggleMenu">


    </div>
  <!-- ========================================================= -->
     <!-- ========================================================= -->
        <!-- ========================================================= -->
    <div class="mobile-menu" :class="{ active: showMenu }">
      <!-- 🔵 PUBLIC (non connecté) -->
<template v-if="!isLoggedIn">


  <router-link to="/videos" class="nav-link">
    <i class="bi bi-film"></i><span>Vidéos</span>
  </router-link>

  <router-link to="/partitions" class="nav-link">
    <i class="bi bi-music-note-beamed"></i><span>Partitions</span>
  </router-link>

  <router-link to="/BassTuner" class="nav-link">
    <i class="bi bi-music-note"></i><span>Accordeur</span>
  </router-link>
    <router-link to="/login" class="nav-link">
    <i class="bi bi-box-arrow-in-right"></i><span>Se connecter</span>
  </router-link>

  <router-link to="/registerform" class="nav-link">
    <i class="bi bi-person-plus"></i><span>S'inscrire</span>
  </router-link>

  <hr />
</template>


      <!-- Sub badge -->
      <div v-if="user && isMobile" class="subscription-badge mt-2 mb-2" style="text-align:center;">
        <span v-if="isSubscribed" class="badge bg-success">✅ Abonné</span>
        <a v-else href="https://www.sunbassschool.com" target="_blank" class="badge bg-danger">❌ Non abonné</a>
      </div>

      <!-- Élève -->
      <router-link v-if="isEleve" to="/dashboard" class="nav-link">
        <i class="bi bi-house"></i><span>Accueil</span>
      </router-link>

      <router-link v-if="isEleve" to="/moncompte" class="nav-link">
        <i class="bi bi-person"></i><span>Mon compte</span>
      </router-link>

      <router-link v-if="isEleve" to="/Feedback" class="nav-link">
        <i class="bi bi-chat-left"></i><span>Feedback</span>
      </router-link>

      <router-link v-if="isEleve" to="/planning" class="nav-link">
        <i class="bi bi-calendar-check"></i><span>Plannings</span>
      </router-link>

      <router-link v-if="isEleve" to="/replay" class="nav-link">
        <i class="bi bi-play-btn"></i><span>Replay</span>
      </router-link>

      <router-link v-if="isEleve" to="/videos" class="nav-link">
  <i class="bi bi-film"></i><span>Vidéos</span>
</router-link>

<router-link v-if="isEleve" to="/partitions" class="nav-link">
  <i class="bi bi-music-note-beamed"></i><span>Partitions</span>
</router-link>

<router-link v-if="isEleve" to="/BassTuner" class="nav-link">
  <i class="bi bi-music-note"></i><span>Accordeur</span>
</router-link>


      <!-- Prof -->
      <router-link v-if="isProf" to="/dashboard-prof" class="nav-link">
        <i class="bi bi-speedometer2"></i><span>Dashboard</span>
      </router-link>

      <router-link v-if="isProf" to="/FeedBackProf" class="nav-link">
        <i class="bi bi-chat"></i><span>Mes Feedbacks </span>
      </router-link>

      <router-link v-if="isProf" to="/gestioneleves" class="nav-link">
        <i class="bi bi-people"></i><span>Mes élèves</span>
      </router-link>

      <router-link v-if="isProf" to="/CreatePlanning" class="nav-link">
  <i class="bi bi-calendar-event"></i><span>Créer planning</span>
</router-link>

<router-link v-if="isProf" to="/cours" class="nav-link">
  <i class="bi bi-tools"></i><span>Gestion des cours</span>
</router-link>
      <!-- Admin -->
      <router-link v-if="isAdmin" to="/AdminFeedBack" class="nav-link">
        <i class="bi bi-pencil-square"></i><span>Feedbacks Admin</span>
      </router-link>

      <router-link v-if="isAdmin" to="/CreatePlanning" class="nav-link">
        <i class="bi bi-calendar-event"></i><span>Planning</span>
      </router-link>

      <router-link v-if="isAdmin" to="/register-cursus" class="nav-link">
        <i class="bi bi-person-plus"></i><span>Ajouter élève</span>
      </router-link>

      <router-link v-if="isAdmin" to="/cours" class="nav-link">
        <i class="bi bi-tools"></i><span>Cours</span>
      </router-link>

 

    </div>

    <!-- ========================================================= -->
    <!-- 🟨 4) CONTENU PRINCIPAL                                   -->
    <!-- ========================================================= -->
    <main class="page-content" :class="{ collapsed: isSidebarCollapsed }">
      <slot></slot>
    </main>

    <!-- Refresh overlay / warnings -->
    <div v-if="refreshFailed" class="error-message">
      ⚠️ Session expirée, veuillez vous reconnecter.
    </div>

    <div v-if="tookTooLong" class="slow-warning">
      ⏱️ Cela prend plus de temps que prévu…
    </div>
<!-- ========================================================= -->
<!-- 🔁  MODE IMPERSONATION (ADMIN ↔ ÉLÈVE)                   -->
<!-- ========================================================= -->
<div v-if="isRealAdmin" class="impersonate-toggle">
  <label class="switch-mode-toggle">
    <input
      type="checkbox"
      :checked="authStore.impersonateStudent"
      @change="authStore.toggleImpersonateStudent()"
    />
    <span class="slider"></span>
    <span class="label-text">
      {{ authStore.impersonateStudent ? '👤 Élève' : '👑 Admin' }}
    </span>
  </label>
</div>

  </div>
</template>






<script>
/* ============================================================================
   📦 IMPORTS
   ============================================================================ */
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  watch
} from "vue";

import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore.js";
import {
  logoutUser,
  isJwtExpired
} from "@/utils/api.ts";

import MiniMetronome from "@/components/MiniMetronome.vue";
import logo from "@/assets/logo.PNG";

/* ============================================================================
   🌐 SESSION EXPIRED GLOBAL FLAG
   ============================================================================ */
export const visible = ref(false);
export function showSessionExpired() {
  visible.value = true;
}
export function hideSessionExpired(delay = 3000) {
  setTimeout(() => (visible.value = false), delay);
}

/* ============================================================================
   🎛️ LAYOUT COMPONENT
   ============================================================================ */
export default {
  name: "Layout",
  components: { MiniMetronome },

  setup() {
    /* ------------------------------------------------------------------------
       🧩 STORES & ROUTERS
    ------------------------------------------------------------------------ */
    const authStore = useAuthStore();
    const router = useRouter();
    const route = useRoute();

    console.log("💥 USER STORE (Layout):", authStore.user);

/* ------------------------------------------------------------------------
   👤 USER & ROLES — VERSION SAAS MULTI-PROF (FIX CASE-SENSITIVE)
------------------------------------------------------------------------ */

// Normaliser le rôle en minuscule
const role = computed(() => (authStore.user?.role || "").toLowerCase());

const user = computed(() => authStore.user);

const pendingCount = computed(() => authStore.pendingReportsCount);

const isLoggedIn = computed(() => !!authStore.jwt);

/* ADMIN réel = toujours vrai si role = admin (même en impersonation) */
const isRealAdmin = computed(() => role.value === "admin");

/* Admin visible → sauf en mode 'voir comme élève' */
const isAdmin = computed(() => {
  if (authStore.impersonateStudent) return false;
  return role.value === "admin";
});

/* Prof = prof OU admin */
const isProf = computed(() =>
  ["prof", "admin"].includes(authStore.user?.role)
);

/* Élève = ni admin visible, ni prof */
const isEleve = computed(() =>
  isLoggedIn.value && !isAdmin.value && !isProf.value
);




    /* ------------------------------------------------------------------------
       🛠️ UI STATES
    ------------------------------------------------------------------------ */
    const isMobile = ref(window.innerWidth <= 1024);
    const isSidebarCollapsed = ref(false);
    const sidebarIsVisible = computed(
      () => !isMobile.value && !isSidebarCollapsed.value && authStore.jwt
    );

    const showMenu = computed(() => authStore.menuOpen);
    const logoUrl = ref(logo);
    const showResponsiveLogo = ref(false);

    const showOverlay = ref(false);
    const tookTooLong = ref(false);
    const logoutMessage = ref("");

    const showSwipeHint = ref(false);

    /* ------------------------------------------------------------------------
       📱 PWA INSTALL HANDLING
    ------------------------------------------------------------------------ */
    const deferredPrompt = ref(null);
    const showInstallButton = ref(false);

    function handleBeforeInstallPrompt(e) {
      deferredPrompt.value = e;
      showInstallButton.value = true;
    }

    function installPWA() {
      if (!deferredPrompt.value) return;
      deferredPrompt.value.prompt();
      deferredPrompt.value = null;
    }

    /* ------------------------------------------------------------------------
       🧮 ABONNEMENT
    ------------------------------------------------------------------------ */
    const isSubscribed = computed(() => {
      const statut = (user.value?.statut || "").toLowerCase();
      return ["abonné", "payant", "inscrit", "actif"].includes(statut) &&
        !!user.value?.fin_acces;
    });

    const formattedFinAcces = computed(() => {
      if (!user.value?.fin_acces) return "Non défini";
      return new Date(user.value.fin_acces).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
    });

    /* ------------------------------------------------------------------------
       📏 RESPONSIVE HANDLERS
    ------------------------------------------------------------------------ */
    const checkMobile = () =>
      (isMobile.value = window.innerWidth <= 1024);

    const toggleMenu = () => authStore.toggleMenu();
    const toggleSidebar = () => (isSidebarCollapsed.value = !isSidebarCollapsed.value);

    /* ------------------------------------------------------------------------
       🔐 LOGOUT
    ------------------------------------------------------------------------ */
    async function handleLogout() {
      await logoutUser();
      authStore.$reset();
    }

    /* ------------------------------------------------------------------------
       📱 MOBILE SWIPE HANDLING
    ------------------------------------------------------------------------ */
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = e => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = e => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipeGesture();
    };

    function handleSwipeGesture() {
      const deltaX = touchEndX - touchStartX;
      if (Math.abs(deltaX) > 50) {
        deltaX > 0 ? showSidebar() : hideSidebar();
      }
    }

    function showSidebar() {
      if (!authStore.jwt) return;
      if (isMobile.value) authStore.menuOpen = true;
    }

    function hideSidebar() {
      if (isMobile.value) authStore.menuOpen = false;
    }

    /* ------------------------------------------------------------------------
       🔥 ON MOUNT
    ------------------------------------------------------------------------ */
    onMounted(() => {
      // Correctif CSS post-update user
      window.addEventListener("user-data-updated", () => {
        setTimeout(() => {
          const el = document.querySelector("main");
          if (el && !el.classList.contains("page-content")) {
            el.classList.add("page-content");
          }
        }, 50);
      });

      // Responsive & PWA
      window.addEventListener("resize", checkMobile);
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      // Touch gestures
      window.addEventListener("touchstart", handleTouchStart, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);

      // Auto-close mobile menu when tapping a link
      const mobileMenu = document.querySelector(".mobile-menu");
      if (mobileMenu) {
        mobileMenu.addEventListener("click", e => {
          if (e.target.closest(".nav-link")) authStore.menuOpen = false;
        });
      }

      // Hint swipe first time
      if (isMobile.value && !localStorage.getItem("seenSwipeHint")) {
        showSwipeHint.value = true;
        localStorage.setItem("seenSwipeHint", "true");
        setTimeout(() => (showSwipeHint.value = false), 5000);
      }

      window.addEventListener("session-expired", e => {
        logoutMessage.value = e.detail;
        setTimeout(() => (logoutMessage.value = ""), 2000);
      });
    });

    /* ------------------------------------------------------------------------
       🔥 ON UNMOUNT
    ------------------------------------------------------------------------ */
    onUnmounted(() => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    });

    /* ------------------------------------------------------------------------
       🌀 REFRESH TOKEN OVERLAY
    ------------------------------------------------------------------------ */
    const authLoading = computed(() => authStore.isRefreshingToken);
    const refreshFailed = computed(() => authStore.refreshFailed);
    const isRefreshing = computed(() => authStore.isRefreshingToken);

    watch(authLoading, val => {
  showOverlay.value = false // ⛔ désactiver overlay global
      document.body.classList.toggle("loading-active", val);

      if (val) {
        setTimeout(() => {
          if (authLoading.value) tookTooLong.value = true;
        }, 5000);
      } else {
        tookTooLong.value = false;
      }
    });

    /* ------------------------------------------------------------------------
       🚨 JWT LOST → Redirect to login
    ------------------------------------------------------------------------ */
    watch(
      () => authStore.jwt,
      (newVal, oldVal) => {
        if (!newVal && oldVal && !authStore.isLoggingOut &&
          localStorage.getItem("logout_in_progress") !== "true") {
          logoutMessage.value = "Session expirée. Veuillez vous reconnecter.";
        }
      }
    );

    /* ============================================================================
       📤 EXPORTS TO TEMPLATE
       ============================================================================ */
    return {
      /* State & store */
      authStore,
      user,
      isLoggedIn,
      isAdmin,
      isProf,
      isEleve,
      isRealAdmin,
      pendingCount,

      /* UI */
      isMobile,
      sidebarIsVisible,
      isSidebarCollapsed,
      toggleSidebar,
      toggleMenu,
      showMenu,
      showOverlay,
      showResponsiveLogo,

      logoUrl,

      /* Subscription */
      isSubscribed,
      formattedFinAcces,

      /* PWA */
      showInstallButton,
      installPWA,

      /* Logout */
      handleLogout,

      /* Swipe */
      showSwipeHint,

      /* Refresh token overlay */
      refreshFailed,
      authLoading,
      isRefreshing,
      tookTooLong,
      logoutMessage
    };
  }
};
</script>










<style scoped>
.impersonate-toggle {
  position: fixed;
  bottom: 10px;
  right: 10px;
  z-index: 10000;
  background: rgba(255, 255, 255, 0.85); /* plus propre en foncé sur fond sombre */
  border: none;
  padding: 6px 10px;
  border-radius: 8px;
  box-shadow: 0 0 8px rgba(255,255,255,0.2);
}

.switch-mode-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.switch-mode-toggle input[type="checkbox"] {
  display: none;
}

.switch-mode-toggle .slider {
  width: 30px;
  height: 20px;
  background-color: #ccc;
  border-radius: 10px;
  position: relative;
  transition: background 0.3s ease;
}

.switch-mode-toggle .slider::before {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  height: 16px;
  width: 16px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.switch-mode-toggle input:checked + .slider {
  background-color: #4caf50;
}

.switch-mode-toggle input:checked + .slider::before {
  transform: translateX(20px);
}

.switch-mode-toggle .label-text {
  font-weight: bold;
  font-size: 0.9rem;
}

html, body {
  height: 100%;
  margin: 0;
}

.page-content {
  flex: 1 1 auto;
  overflow-y: auto;
}



/* ✅ Style général du menu latéral */
.sidebar {
    position: relative;
  overflow: hidden; /* ⛔️ empêche la tirette de dépasser */

  left: 0;
  top: 0;
  bottom: 0;
  width: 250px;
  background: #121212;
  padding: 0px;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease-in-out; /* ✅ Animation fluide */
  z-index: 1100;
}

/* ✅ Mode réduit (caché) */
.sidebar.isCollapsed {
  width: 10px;
}

/* ✅ Bouton pour afficher/masquer la sidebar */
.toggle-menu-btn {
  position: absolute;
  top: 50%;
  left: 252px;
  transform: translateY(-50%);
  width: 18px;
  height: 120px;
  background: #414141; /* Orange vif */
  border: none;
  border-radius: 12px; /* Coins légèrement arrondis pour un effet moderne */
  display: flex;
  justify-content: center;
  align-items: center;
  color: rgb(255, 255, 255);
  font-size: 15px;
  font-weight: bold;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  z-index: 1200;
}
.sidebar.isCollapsed {
  transform: translateX(-100%); /* ✅ Cache la sidebar en la déplaçant hors de l'écran */
}
.toggle-menu-btn i {
  font-size: 20px;
}

/* ✅ Hover */
.toggle-menu-btn:hover {
  background: #b9360a; /* Rouge foncé au hover */
  box-shadow: none;
}
/* ✅ Quand la sidebar est réduite, le bouton reste visible */

.sidebar.isCollapsed + .toggle-menu-btn {
  left: 20px; /* Ramène le bouton vers la gauche */
}





@media screen and (max-width: 1025px) {
  /* ✅ Correction pour l'affichage du menu hamburger */
  .mobile-menu {
    position: fixed;
    top: 80px; /* ✅ Ajusté pour ne pas être coupé par le header */
    left: 0;
    width: 100%;
    height: calc(100% - 80px); /* ✅ Prend tout l’espace sous le header */
    background: #000000;
    opacity: 95%; /* ✅ Améliorer la lisibilité */
    text-align: center;
    display: flex;
    
    flex-direction: column;
    padding: 20px;
    box-shadow: 4px 0px 10px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s ease-in-out;
    z-index: 999;
    overflow-y: auto; /* ✅ Ajoute un scroll si nécessaire */
  }

  /* ✅ Modifier l'affichage des liens */
  .mobile-menu .nav-link {
    display: flex;
    flex-direction: row; /* ✅ Aligner en ligne plutôt qu'en colonne */
    align-items: center;
    justify-content: center;
    color: white;
    font-family: "Poppins", sans-serif;
    font-weight: 700 !important;
    font-size: 16px;
    padding: 5px;
    text-decoration: none;
    transition: all 0.3s ease-in-out;
  }

  .mobile-menu .nav-link i {
    font-size: 20px;
    margin-right: 10px; /* ✅ Ajouter un petit espace entre l'icône et le texte */
  }

  /* ✅ Ajouter un effet de survol */
  .mobile-menu .nav-link:hover {
    background: rgb(241, 105, 15);
    color: black;
  }

  /* ✅ Séparateurs pour une meilleure lisibilité */
  .mobile-menu a:not(:last-child),
  .mobile-menu .nav-link:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.3);
    padding-bottom: 8px;
    margin-bottom: 8px;
  }
}

@media screen and (max-width: 1024px) {
  .menu-btn {
    position: absolute; /* ✅ S'assurer qu'il reste bien positionné */
    left: 10px; /* ✅ Distance du bord gauche */
    top: 15px; /* ✅ Distance du haut */
    font-size: 32px !important; /* ✅ Taille uniforme */
    color: rgb(255, 255, 255) !important; /* ✅ Couleur */
    background-color: transparent;
    border: none;
    display: flex !important; /* ✅ Toujours affiché */
    align-items: center;
    justify-content: center;
  }

  /* ✅ Supprimer tout padding ou margin parasite */
  .hero-banner {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 120px; /* ✅ Taille adaptée */
    display: flex;
    align-items: center;
    padding-left: 10px; /* ✅ Ajustement */
  }

  /* ✅ Correction pour empêcher tout décalage */
  .hero-content {
    display: flex;
    justify-content: flex-start; /* ✅ Force l'alignement à gauche */
    align-items: center;
    width: 100%;
    max-width: 1200px;
  }
}

/* ✅ Affichage uniquement en mode Desktop */
@media screen and (max-width: 1366px) {  
  .social-buttons {
    display: none !important; /* 🔥 Empêche toute réapparition */
  }
}


/* ✅ Conteneur des boutons sociaux */
.social-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding: 15px 0;
  margin-top: 10px;
}

/* ✅ Style des icônes */
.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 22px;
  color: white;
  transition: transform 0.3s ease-in-out, background 0.3s ease-in-out;
}

/* ✅ Couleurs spécifiques */
.facebook { background: #3b5998; }
.instagram { background: #e4405f; }
.youtube { background: #ff0000; }
.tiktok { background: #000000; }

/* ✅ Effet hover */
.social-link:hover {
  transform: scale(1.1);
  filter: brightness(1.2);
}


/* ✅ Boutons d'authentification sur desktop */
.desktop-auth-buttons {
  display: flex;
  gap: 15px;
  position: absolute;
  right: 5%;
}

.btn-auth {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: bold;
  text-transform: uppercase;
  text-decoration: none;
  transition: background 0.3s ease-in-out;
}

.login-btn {
  background: none;
  border: 2px solid white;
  color: white;
}

.login-btn:hover {
  background: white;
  color: black;
}

.trial-btn {
  background: #f1c40f;
  color: black;
}

.trial-btn:hover {
  background: #ffdd57;
}



/* ✅ S'assure qu'elle s'affiche UNIQUEMENT en mobile */




@media screen and (min-width: 1024px) {
  .hero-banner .logo {
    display: none !important;
  }
}
@media screen and (min-width: 1024px) {
  .hero-banner .auth-buttons {
    display: none !important;
  }
}


/* ✅ MENU LATÉRAL GAUCHE (STYLE SPOTIFY) */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 250px;
  height: 100vh; /* S'étend sur toute la hauteur */
  background: #121212;
  padding: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.3);
  z-index: 1100;
  overflow-y: auto; /* Active le scroll si besoin */
  transition: transform 0.4s ease-in-out; /* ✅ Animation fluide */
  transform: translateX(0);
  
}
.sidebar::-webkit-scrollbar {
  width: 8px; /* ✅ Taille fine et élégante */
}

.sidebar::-webkit-scrollbar-track {
  background: transparent; /* ✅ Pas de fond visible */
}

.sidebar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3); /* ✅ Barre semi-transparente */
  border-radius: 10px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5); /* ✅ Plus visible au survol */
}

/* ✅ Applique à TOUS les scrollbars sur le site */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent; /* ✅ Support Firefox */
}

/* ✅ Style des scrollbars pour Chrome, Edge et Safari */
*::-webkit-scrollbar {
  width: 10px; /* ✅ Taille fine et élégante */
}

/* ✅ Fond du scrollbar */
*::-webkit-scrollbar-track {
  background: #0a0a0a; /* ✅ Fond noir subtil */
  border-radius: 10px;
}

/* ✅ Barre de défilement */
*::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(255, 0, 0, 0.7), rgba(255, 120, 0, 0.7)); /* ✅ Dégradé rouge/orange */
  border-radius: 10px;
  box-shadow: 0px 0px 10px rgba(255, 69, 0, 0.75); /* ✅ Effet lumineux */
}

/* ✅ Effet au survol */
*::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(255, 0, 0, 1), rgba(255, 120, 0, 1)); /* ✅ Plus vif */
}


/* ✅ Logo en haut du menu */
.sidebar-logo {
  text-align: center;
  margin-bottom: 20px;
}

.sidebar-main-logo {
  width: 150px;
  height: auto;
  filter: brightness(1.2);
  transition: transform 0.2s ease-in-out;
}

.sidebar-main-logo:hover {
  transform: scale(1.1);
}

/* ✅ Navigation */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ✅ Style des liens */
.sidebar-link {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 15px;
  border-radius: 8px;
  color: #b3b3b3;
  font-size: 18px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease-in-out;
}

.sidebar-link i {
  font-size: 24px;
  font-weight: bold; /* ✅ Rend l'icône plus épaisse */
  transition: transform 0.2s ease-in-out, color 0.3s ease-in-out;
}

.sidebar-link span {
  font-weight: bold; /* ✅ Épaissit aussi le texte des liens */
}


.sidebar-link:hover,
.sidebar-link.router-link-exact-active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.sidebar-link:hover i {
  transform: scale(1.2);
  color:rgb(240, 56, 10); /* Vert Spotify */
}

/* ✅ Déconnexion */
.sidebar-link.logout {
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: #ff4d4d;
}

.sidebar-link.logout:hover {
  background: rgba(255, 77, 77, 0.2);
}

/* ✅ Masquer sur mobile */
@media screen and (max-width: 1024px) {
  .sidebar {
    display: none; /* ❌ Cache la sidebar sur iPad */
  }
  
  .menu-btn {
    display: flex !important; /* ✅ Affiche le bouton hamburger */
  }
  @media screen and (max-width: 1024px) {
  .menu-btn {
    font-size: 32px !important; /* ✅ Même taille pour iPad et iPhone */
    color: rgb(255, 255, 255) !important;  /* ✅ Couleur forcée */
    background-color: transparent;
    border:none;
    display: flex !important; /* ✅ S'assurer qu'il est bien affiché */
    align-items: center;
    justify-content: center;
  }
  
  /* ✅ Corrige les styles spécifiques aux appareils Apple */
  .menu-btn:focus {
    outline: none !important; /* 🔄 Supprime le contour bleu sur iOS */
  }
}
}

@media screen and (min-width: 768px) and (max-width: 1366px) { 
  .navbar-container {
    display: flex !important; /* ✅ Forcer l'affichage du menu */
  }
}

@media screen and (min-width: 768px) and (max-width: 1024px) {
  .mobile-menu {
    position: fixed;
    top: 80px; /* ✅ Descend le menu sous le header */
    left: 0;
    width: 100%;
    height: calc(100% - 80px); /* ✅ Prend tout l’espace sous le header */
    background: #000000;
    opacity: 88%;
    
    flex-direction: column;
    padding: 15px;
    margin-top:3%;
    box-shadow: 4px 0px 10px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s ease-in-out;
    z-index: 999; /* ✅ Passe bien au-dessus */
    overflow-y: auto; /* ✅ Ajoute un scroll si besoin */
  }
}






.slide-enter-active, .slide-leave-active {
  transition: transform 0.5s ease-in-out;
}

/* Test avec une transition simple */
.slide-enter {
  transform: translateX(100%);
}

.slide-leave-to {
  transform: translateX(-100%);
}


/* ✅ Style du bouton de déconnexion dans le header */
.logout-btn {
  background: none;
  border: none;
  color: rgb(241, 28, 0);
  font-size: 26px;
  cursor: pointer;
  position: absolute;
  
  top: 20%;
 
  transition: color 0.3s ease-in-out, transform 0.2s ease-in-out;
}

.logout-btn:hover {
  color: #383838; /* Rouge clair au survol */
  transform: scale(1.1);
}

@media screen and (min-width: 1025px) {
  .logout-btn {
    display: inline-block !important; /* ✅ Afficher sur desktop */
  }
}


/* ✅ CONTAINER PRINCIPAL */
.layout-container {
  display: flex;
  flex-direction: row; /* ✅ Garde uniquement celui-ci */
  background-color: #000000;
    height: 100vh;

  width: 100%;
  max-width: 100vw;
  overflow: hidden;
}

@media screen and (min-width: 1024px) {
  .page-content {
    margin-left: 250px; /* même largeur que ta sidebar */

  }

}


/* ✅ HEADER AMÉLIORÉ */
.hero-banner {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  padding-top:20px;
  height: 120px;
  background-color:rgb(0, 0, 0);

  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  z-index: 1050;
  padding: 0 0px;
}

/* ✅ CONTENU DU HEADER */
.hero-content {
  display: flex;
  align-items: center;
  width: 65%;
  max-width: 1200px;
}

/* ✅ LOGO */
.logo {
  height: 0px;
  margin-left:20%;
  width: auto;
}

/* ✅ TEXTE DU HEADER */
.hero-text {
  flex-grow: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 15px;
}
.sidebar:not(.isCollapsed) ~ .hero-banner .hero-text {
  margin-left: px; /* ✅ Ajuste pour compenser l’espace de la sidebar */
}

/* ✅ Lorsque la sidebar est réduite */
.sidebar.isCollapsed ~ .hero-banner .hero-text {
  margin-left: 35px; /* ✅ Réduit l’espace pour recentrer le texte */
}
/* ✅ TITRE PRINCIPAL (plus grand et plus impactant) */
.hero-title {
  font-family: "Poppins", sans-serif;
  font-size: 2.5rem; /* Augmenté pour plus de présence */
  font-weight: 800; /* Très gras pour un effet percutant */
  color: white;
  text-transform: uppercase;
  letter-spacing: 2px; /* Espacement accentué */
  text-shadow: 0px 3px 15px rgba(255, 255, 255, 0.3); /* Ombre plus visible */
  margin: 0;
  margin-top:20px;
}

/* ✅ SOUS-TITRE (plus lisible et aéré) */
.hero-subtitle {
  font-size: 1.2rem; /* Taille augmentée pour meilleure lecture */
  font-weight: 500; /* Un peu plus gras */
  color: #d3d3d3; /* Gris plus clair pour plus de lisibilité */
  text-transform: uppercase;
  letter-spacing: 1,5px;
  text-align: center;
  margin-top: 10px;
  opacity: 0.9; /* Effet plus lisible */
  
}



/* ✅ BOUTONS DU HEADER */
.auth-buttons {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 15px;
}

/* ✅ STYLE BOUTON "PRENDRE UN COURS" */
.btn-cours {
  background-color: #f1c40f;
  color: black !important;
  font-weight: bold;
  padding: 8px 15px;
  border-radius: 8px;
  text-transform: uppercase;
  font-size: 20px;
  transition: background 0.3s ease-in-out;
}

.btn-cours:hover {
  background-color: #ffdd57;
}
.fullwidth {
  max-width: 100vw;
  width: 100%;
  padding: 0;
  margin: 0;
}

/* ✅ STYLE DES AUTRES BOUTONS */
.nav-link {
  display: flex;
  flex-direction: column;
  gap:-2px;
  align-items: center;
  color: white;
  text-decoration: none;
  font-size: 12px;
  font-family: "Poppins", sans-serif; 
  font-weight: 700 !important; /* Très gras */


  padding: 15px;
  transition: all 0.3s ease-in-out;
}

.nav-link i {
  font-size: 22px;
    font-family: "Poppins", sans-serif; 
  font-weight: 700 !important; /* Très gras */
  transition: transform 0.2s ease-in-out, color 0.3s ease-in-out, text-shadow 0.3s ease-in-out;
}

.nav-link:hover,
.nav-link.router-link-exact-active {
  color:rgb(250, 9, 9); /* Vert Spotify */
    font-family: "Poppins", sans-serif; 
  font-weight: 700 !important; /* Très gras */
  text-shadow: 0px 0px 10px rgba(243, 14, 14, 0.8); /* Glow vert subtil */
}
.nav-link.logout {
  background-color: transparent;
  border: none;
  cursor: pointer;
}
.nav-link:hover i,
.nav-link.router-link-exact-active i {
  transform: scale(1.1);
}
.nav-link:active {
  transform: translateY(2px); /* Effet d'enfoncement */
}

.nav-link.logout:hover {
  color: #ff4d4d;
  text-shadow: 0px 0px 10px rgba(255, 77, 77, 0.8);
}

/* ✅ CONTENU PRINCIPAL */
.page-content {
  flex-grow: 1;
 
  overflow-y: auto;
  width: 100%;
  max-width: 100vw;
  background-color: #000 !important;
  padding: 0px;
  padding-top: 0px;
  padding-bottom: 0px;
  margin-top: 100px;
  box-sizing: border-box;
}


.navbar-nav .nav-link {

   /* ✅ Taille fixe pour éviter les micro-ajustements */

  
}
.navbar-nav .nav-link:active {
  transform: none !important;
}
.navbar-nav .nav-link:hover,
.navbar-nav .nav-link.router-link-exact-active {
  transform: none !important; /* 🔥 Empêche tout redimensionnement */
  text-shadow: none !important; /* 🔥 Évite l'effet de tremblement */
}
@media screen and (min-width: 1024px) {
  .navbar-container {
    height: 0px; /* Ajuste la hauteur pour Desktop */
  }

  .navbar-nav .nav-link {
  
  
  text-transform: uppercase;
  font-family: "Poppins", sans-serif;
}


 
}

@media screen and (min-width: 1024px) {
  .logo {
    height: 100px;
    max-width: 220px;
    transition: transform 0.3s ease-in-out, filter 0.3s ease-in-out;
  }
   



  .logo:hover {
    transform: scale(1.1); /* Zoom léger */
    filter: brightness(1.2); /* Légère mise en valeur */
  }
  .btn-cours {
  background-color: #f1c40f;
  color: black !important;
  font-weight: bold;
  padding: 8px 15px;
  border-radius: 8px;
  text-transform: uppercase;
  font-size: 20px;
  transition: background 0.3s ease-in-out;
}
}


/* ✅ MENU FIXE EN BAS */
/* ✅ Footer toujours visible, même sur desktop */
.navbar-container {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 80px; /* Ajuste selon ta maquette */
  background: linear-gradient(to top, #101010, #181818); 
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}


.loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px 20px;
  border-radius: 5px;
  font-size: 18px;
  font-weight: bold;
}

.loading-container {
  position: fixed;  /* Rend le loader toujours visible */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);  /* Centre parfaitement */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8); /* Fond légèrement opaque pour la visibilité */
  z-index: 1000; /* Assure que le loader passe au-dessus */
}

.spinner-border {
  width: 2rem;
  height: 2rem;
  color: red !important;
}


.navbar-nav {
 
  
  flex-direction: row;
  

}

.nav-item {
  
  text-align: center;
}

/* ✅ BOUTON INSTALLATION PWA */
  .install-btn {
    position: absolute;
    background:none;
    border:none;
    top: 10px; /* Ajuste la distance du haut */
    right: 15px; /* Distance par rapport au bord droit */
    font-size: 22px; /* Ajuste la taille de l’icône */
    z-index: 1100; /* S'assure qu'elle passe au-dessus des autres éléments */
  }

  .hero-subtitle {
    margin-top: 20px; /* Ajoute de l’espace sous le titre */
  }

.install-btn:hover {
  transform: scale(1.2);
  color: #f1c40f;
}

/* ✅ MENU RESPONSIVE */
/* ✅ Overlay semi-transparent quand le menu est ouvert */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
}

/* ✅ Menu latéral qui arrive depuis la gauche */
.mobile-menu {
  position: fixed;
  top: 75px; /* Juste sous le header */
  left: -40%; /* Caché en dehors de l'écran */
  width: 38%;
  height: calc(100% - 75px);
  background: #000000;
  display: flex;
  opacity: 88%;
  text-align: center;
  flex-direction: column;
  padding: 15px;
  box-shadow: 4px 0px 10px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease-in-out; /* ✅ Animation fluide */
  z-index: 999;
}
.mobile-menu a:not(:last-child),
.mobile-menu .nav-link:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.3); /* Ligne séparatrice */
  padding-bottom: 8px; /* Espacement */
  margin-bottom: 8px;
}

/* ✅ Quand le menu est actif, il glisse à gauche */
.mobile-menu.active {
  text-align: center;
  transform: translateX(100%); /* ✅ Slide depuis la gauche */
}


/* ✅ Style des liens dans le menu */
.mobile-menu .nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
    font-family: "Poppins", sans-serif; 
  font-weight: 700 !important; /* Très gras */
  font-size: 15px;
  text-decoration: none;
  transition: all 0.3s ease-in-out;
  padding: 5px;
}

.mobile-menu .nav-link i {
  font-size: 13x; /* ✅ Taille des icônes */
    font-family: "Poppins", sans-serif; 
  font-weight: 700 !important; /* Très gras */
  margin-right: 0px; /* ✅ Ajout d'espace entre l'icône et le texte */
}

.mobile-menu .nav-link:hover {
  background:rgb(241, 105, 15);
  color: black;
}

.fullscreen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.fullscreen .page-content {
  flex-grow: 1;
  width: 100%;
  max-width: 100vw;
  height: auto; /* 🔄 Laisse flex gérer */
  padding: 0;
   height: 100vh; /* prend toute la hauteur visible */
  padding-bottom: 0; /* supprime l’espace réservé au footer inexistant */


  overflow-x: hidden;
}


.fullscreen header,
.fullscreen footer {
  display: none;
}
/* ✅ Spécifique iOS Safari : sécurise l'espace en bas */
@supports (-webkit-touch-callout: none) {


.navbar-container {
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 70px;
  background: #181818;
  padding-bottom: env(safe-area-inset-bottom); /* espace iPhone X+ */
}

}
.navbar-container {
  z-index: 9999; /* au-dessus de tout */
}

@media screen and (max-width: 768px) {
.hero-banner {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 80px; /* Réduction de la hauteur pour un look plus compact */
  background: #000000; /* Fond noir uni, plus propre */
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3); /* Ombre subtile */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
  padding: 0 20px;
}

 .hero-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 90%;
  max-width: 1200px;
}
.hero-text {
  flex-grow: 1;
  text-align: center;
}
.hero-title {
  font-size: 1.6rem;
  font-weight: bold;
  color: white;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.hero-subtitle {
  font-size: 0.9rem;
  color: #ca0000;
  text-transform: uppercase;
}

  
  .logo {
    margin-left:0%;
  }


/* ✅ Bouton du menu hamburger */
.menu-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: white;
  margin-left:-%;
  transition: transform 0.2s ease-in-out;
}
@media screen and (max-width: 1024px) {
  .page-content {
    margin-left: 0px !important; /* ✅ Supprime tout décalage forcé */
    width: 100vw !important; /* ✅ Forcer la pleine largeur */
    max-width: 100vw !important; /* ✅ Empêcher toute limitation */
    padding: 0 !important; /* ✅ Supprimer les marges internes */
margin-top:80px;
 
  }
}


/* ✅ Animation du menu hamburger */
.menu-btn:hover {
  transform: scale(1.1);
  color:rgb(185, 73, 29); /* Vert Spotify */
}

.hero-text {
  flex-grow: 1;  
  display: flex;
  flex-direction: column;
  align-items: center; /* ✅ Centre horizontalement */
  justify-content: center; /* ✅ Centre verticalement */
  text-align: center; /* ✅ Texte centré */
  width: 100%; /* ✅ Assure que ça prend tout l’espace */
  margin: 0 auto; /* ✅ Centrage parfait */
  margin-left:0;
}
.hero-subtitle {
  font-size: 0.85rem;
  color: #9b9b9b;
  text-transform: uppercase;
  margin-top: 1px;
  position: relative;
  overflow: hidden;
  display: inline-block;
  opacity: 0; /* Départ transparent */
  transform: translateY(20px); /* Texte part en bas */
  animation: fadeInUp 1s ease-out forwards; /* Animation de fade et translation */
}

@keyframes fadeInUp {
  to {
    opacity: 1; /* Le texte devient visible */
    transform: translateY(0); /* Retour à sa position normale */
  }
}



.btn-cours {
  font-size: 10px !important;
  display: none !important;
  }






  /* ✅ Adapter "Mon Espace" en icône */
  .auth-buttons .mon-espace {
    display: flex !important;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    color: white !important;
    padding: 10px;
    border-radius: 50%;
    font-size: px;
    width: 40px;
    height: 40px;
  }

  /* ✅ Cacher le texte et garder uniquement l’icône */
  .auth-buttons .mon-espace span {
    display: none !important;
  }

  /* ✅ Agrandir l’icône */
  .auth-buttons .mon-espace i {
    font-size: 24px !important;
    display: none !important;
  }

  /* ✅ Correction : FORCER LE MENU BAS À RESTER VISIBLE */
.navbar-container {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 80px;
  background: linear-gradient(to top, #101010, #181818); /* Dégradé subtil */
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.4); /* Ombre adoucie */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;

}




  .navbar-nav {
    display: flex !important;
    justify-content: space-around;
    font-size:17px;
    align-items: center;
    width: 100%;
  }
}
@media screen and (max-width: 1024px) {
  .page-content {
    margin-left: 0; /* ✅ Plus de sidebar en mobile, donc pas de décalage */
    width: 100%; /* Pleine largeur */

  }
  .navbar-container {
    height: 70px; /* Augmenté pour plus de confort */
  }

  /* ✅ Taille des icônes et du texte */
  .navbar-nav .nav-link {
    font-size: 11px; /* 🔺 Augmente la taille du texte */
    font-weight: 500; /* 🔺 Texte plus épais */
    text-transform: uppercase;
    font-family: "Poppins", sans-serif;
    margin-top:-10px;
  }

  .navbar-nav .nav-link i {
    font-size: 30px; /* 🔺 Icônes plus grandes */
    margin-bottom: -10px; /* 🔺 Ajoute un peu d’espace */
  }

  /* ✅ Ajustement du padding pour améliorer l'accessibilité */
  .navbar-nav .nav-link {
    padding: 15px 10px; /* 🔺 Augmente la zone cliquable */
  }

 

}
.mobile-menu {
  padding-bottom: calc(20px + env(safe-area-inset-bottom)); /* espace pour iPhone X+ */
}
.mobile-menu {
  z-index: 1200; /* plus haut que le footer */
}
@media screen and (max-width: 768px) {
  .mobile-menu .nav-link {
    padding: 6px 8px;
    font-size: 14px;
  }
}

.account-info-block {
  position: absolute;
  top: 10px;
  right: 5%;
  display: flex;
  flex-direction: row;
  margin-top:10px;
  align-items: center;
  gap: 15px; /* espace entre les icônes */
  z-index: 1051; /* plus haut que .hero-banner si nécessaire */
}


.loading-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background-color: rgba(0,0,0,0.9);
  color: white;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
}
.session-expired-banner {
  background-color: #ffcccc;
  color: #a00;
  text-align: center;
  padding: 12px;
  font-weight: bold;
  border-bottom: 2px solid #a00;
}

body.loading-active {
  overflow: hidden;
}
.refresh-overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999999;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  font-weight: bold;
}
</style>
<style>
.logout-toast {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: #ff5e00;
  color: white;
  padding: 12px 24px;
  border-radius: 6px;
  box-shadow: 0 0 10px rgba(0,0,0,0.2);
  z-index: 9999;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: white;
  font-size: 1.2rem;
}

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.overlay .slow-warning {
  margin-top: 20px;
  color: #ffb3b3;
  font-size: 1rem;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.session-expired {
  position: fixed;
  top: 0;
  width: 100%;
  background: #ff4d4d;
  color: white;
  padding: 12px;
  text-align: center;
  z-index: 999999;
  font-weight: bold;
}
.session-expired {
  position: fixed;
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
  background: #ff4d4f;
  color: white;
  padding: 12px 20px;
  border-radius: 6px;
  z-index: 999999;
  font-weight: bold;
  box-shadow: 0 0 10px #ff4d4f;
}
.session-expired-overlay {
  background: rgba(0, 0, 0, 0.85); /* Plus foncé */
  z-index: 999999; /* Au-dessus de tout */
}

.session-expired-overlay .message {
  font-size: 1.3rem;
  color: #f52121;
  font-weight: bold;
  text-align: center;
  margin-top: 15px;
}
.mobile-account-actions {
  position: absolute;
  top: 15px;
  right: 10px;
  display: flex;
  gap: 12px;
  align-items: center;
  z-index: 1100;
}

.mobile-account-actions i {
  font-size: 22px;
  color: rgb(255, 255, 255);

  transition: transform 0.2s ease;
}

.mobile-account-actions i:hover {
  transform: scale(1.1);
  color: #ff1e00;
}

.mobile-account-actions button {
  background: none;
  border: none;
  cursor: pointer;
}
.page-content > *:last-child {
  margin-bottom: 0 !important;
}
.swipe-hint {
  position: fixed;
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
  font-size: 48px;
  color: white;
  animation: swipe-fade 2s ease-in-out infinite;
  z-index: 9999;
  pointer-events: none; /* Ne gêne pas le swipe réel */
}

@keyframes swipe-fade {
  0% {
    transform: translateY(-50%) translateX(0);
    opacity: 0.2;
  }
  50% {
    transform: translateY(-50%) translateX(10px);
    opacity: 1;
  }
  100% {
    transform: translateY(-50%) translateX(0);
    opacity: 0.2;
  }
}
.page-content.collapsed {
  margin-left: 00px;
  width: calc(100% - 30px);
}
.account-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top:10px;
  margin-left:-50px;
  font-size: 2rem;
  color: white;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.3s ease-in-out, transform 0.2s ease-in-out;
}

.account-link:hover {
  color: #ca300a;
  transform: scale(1);
}
.hero-banner {
  padding-top: env(safe-area-inset-top);
  background: #000 !important;
}

.subscription-badge a {
  text-decoration: none;
}
.subscription-badge-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #dc3545;
  color: #fff;
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 600;
  text-decoration: none;
  font-size: 0.85rem;
}
.subscription-badge-link:hover {
  background: #bb2d3b;
}

</style>
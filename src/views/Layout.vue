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
  <RouterLink to="/cours-de-basse-en-ligne">
    <img
      :src="logoUrl"
      class="sidebar-main-logo"
      alt="SunBassSchool"
    />
  </RouterLink>
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
<router-link
  v-if="isLoggedIn && isEleve"
  to="/eleve/offres"
  class="sidebar-link btn-cours"
>
  <i class="bi bi-play-circle"></i>
  <span>Prendre un cours</span>
</router-link>


        <router-link v-if="isLoggedIn && isEleve" to="/dashboard" class="sidebar-link">
          <i class="bi bi-house-door"></i>
          <span>Accueil</span>
        </router-link>

        <router-link v-if="isLoggedIn && isEleve" to="/moncompte" class="sidebar-link">
          <i class="bi bi-person-circle"></i>
          <span>Mon compte</span>
        </router-link>
   <router-link v-if="isEleve" to="/mes-uploads" class="sidebar-link">
        <i class="bi bi-calendar-check"></i><span>Drive</span>
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
          <span>Accueil</span>
        </router-link>
                <router-link v-if="isAdmin" to="/admin" class="sidebar-link">
          <i class="bi bi-speedometer2"></i>
          <span>Admin</span>
        </router-link>

<router-link v-if="isProf" to="/dashboard-prof/offres" class="sidebar-link">
<i class="bi bi-bag"></i>
  <span>Mes offres</span>
</router-link>

        <router-link v-if="isProf" to="/FeedBackProf" class="sidebar-link">
          <i class="bi bi-chat-left-dots"></i>
          <span>Messagerie</span>
        </router-link>

        <router-link v-if="isProf" to="/gestioneleves" class="sidebar-link">
          <i class="bi bi-people"></i>
          <span>Gestion Élèves</span>
        </router-link>

        <!-- 🔥 AJOUT POUR PROF -->
<router-link v-if="isProf" to="/prof/planning/create" class="sidebar-link">
  <i class="bi bi-calendar-event"></i>
  <span>Créer un planning</span>
</router-link>

<router-link v-if="isProf" to="/cours" class="sidebar-link">
  <i class="bi bi-wrench-adjustable"></i>
  <span>Mes cours</span>
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
   <RouterLink to="/cours-de-basse-en-ligne" class="hero-text">
  <h1 class="hero-title">SunBassAPP</h1>
  <p class="hero-subtitle">L'école de basse qui groove.</p>
</RouterLink>

        <!-- Auth desktop -->
        <div v-if="!isLoggedIn && !isMobile" class="desktop-auth-buttons">
          <router-link to="/login" class="btn-auth login-btn">Se connecter</router-link>
          <router-link to="/register" class="btn-auth trial-btn">s'inscrire</router-link>
        </div>

        <!-- Abonnement + compte desktop -->
          <div v-if="isLoggedIn && !isMobile" class="account-info-block">
            <!-- CTA PROF -->
<div class="cta_header">
  <!-- RIEN tant que pas prêt -->
  <span v-if="!auth.isInitDone" class="sub-pill placeholder"></span>

  <!-- CONTENU (fade-in) -->
  <transition name="fade">
    <router-link
      v-if="auth.isInitDone && !hasPrivileges && auth.user?.role === 'prof'"
      :to="{ name: 'pricing' }"
      class="sub-pill cta"
    >
      Passer Premium
    </router-link>

    <router-link
      v-else-if="auth.isInitDone && !hasPrivileges && auth.user && !['prof','admin'].includes(auth.user.role)"
      to="/eleve/offres"
      class="sub-pill cta"
    >
      Non abonné
    </router-link>

    <span
      v-else-if="auth.isInitDone && hasPrivileges && isPro"
      class="sub-pill pro"
    >
      ⭐ Premium
    </span>

    <span
      v-else-if="auth.isInitDone && hasPrivileges"
      class="sub-pill subscriber"
    >
      Abonné
    </span>
  </transition>
</div>


          <router-link to="/moncompte" class="account-link">
            <i class="bi bi-person-gear"></i>
          </router-link>

        </div>




      </div>
    </header>

    <!-- ========================================================= -->
    <!-- 🟩 3) MENU MOBILE (overlay)                               -->
    <!-- ========================================================= -->
<div
  v-if="showMenu"
  class="menu-overlay"
  @click="closeMenu"
></div>

<div
  class="mobile-menu"
  :class="{ active: showMenu }"
  @click.stop
>


  <!-- 🔴 CTA GLOBAL -->
  <router-link
    to="/eleve/offres"
    class="nav-link nav-cta-cours"
  >
    <i class="bi bi-play-circle-fill"></i>
    <span>Prendre un cours</span>
  </router-link>

  <hr class="cta-separator" />

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

  <router-link to="/register" class="nav-link">
    <i class="bi bi-person-plus"></i><span>S'inscrire</span>
  </router-link>

  <hr />
</template>


      <!-- Sub badge -->
  <router-link
  v-if="!hasPrivileges && auth.user?.role === 'prof'"
  :to="{ name: 'pricing' }"
  class="account-badge upgrade"
>
  Passer Premium
</router-link>

<router-link
  v-else-if="!hasPrivileges && auth.user && auth.user.role !== 'prof' && auth.user.role !== 'admin'"
  to="/eleve/offres"
  class="sub-pill cta"
>
  Non abonné
</router-link>


<span
  v-else-if="hasPrivileges && isPro"
  class="account-badge premium"
>
  ⭐ Premium
</span>

<span
  v-else-if="hasPrivileges"
  class="account-badge subscriber"
>
  Abonné
</span>


      <!-- Élève -->
      <router-link v-if="isEleve" to="/dashboard" class="nav-link">
        <i class="bi bi-house"></i><span>Accueil</span>
      </router-link>
      <router-link v-if="isEleve" to="/Feedback" class="nav-link">
        <i class="bi bi-chat-left"></i><span>Feedback</span>
      </router-link>
           <router-link v-if="isEleve" to="/replay" class="nav-link">
        <i class="bi bi-play-btn"></i><span>Replay</span>
      </router-link>


      <router-link v-if="isEleve" to="/planning" class="nav-link">
        <i class="bi bi-calendar-check"></i><span>Plannings</span>
      </router-link>

   <router-link v-if="isEleve" to="/mes-uploads" class="nav-link">
        <i class="bi bi-calendar-check"></i><span>Drive</span>
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
        <router-link v-if="isAdmin" to="/admin" class="nav-link">
          <i class="bi bi-speedometer2"></i>
          <span>Admin</span>
        </router-link>
        <router-link v-if="isProf" to="/dashboard" class="nav-link">
        <i class="bi bi-house"></i><span>Accueil</span>
      </router-link>
      <router-link v-if="isProf" to="/dashboard-prof" class="nav-link">
        <i class="bi bi-speedometer2"></i><span>Dashboard</span>
      </router-link>

      <router-link v-if="isProf" to="/FeedBackProf" class="nav-link">
        <i class="bi bi-chat"></i><span>Feedbacks </span>
      </router-link>
   <router-link v-if="isProf" to="/mes-uploads" class="nav-link">
        <i class="bi bi-calendar-check"></i><span>Drive</span>
      </router-link>
      <router-link v-if="isProf" to="/gestioneleves" class="nav-link">
        <i class="bi bi-people"></i><span>Mes élèves</span>
      </router-link>
<router-link v-if="isProf" to="/cours" class="nav-link">
  <i class="bi bi-tools"></i><span>Mes cours</span>
</router-link>
      <router-link v-if="isProf" to="/prof/planning/create" class="nav-link">
  <i class="bi bi-calendar-event"></i><span>Créer planning</span>
</router-link>
   <router-link v-if="isProf" to="/dashboard-prof/offres" class="nav-link">
<i class="bi bi-bag"></i><span>Mes offres</span>
</router-link>




    </div>

    <!-- ========================================================= -->
    <!-- 🟨 4) CONTENU PRINCIPAL                                   -->
    <!-- ========================================================= -->
    <main class="page-content" :class="{ collapsed: isSidebarCollapsed }">


<!-- A ACTIVER POUR DEBUG UNIQUEMENT
      <pre
  style="
    background:#300;
    color:#ff6b6b;
    border:1px solid #ff3b3b;
    padding:12px;
    font-size:12px;
    margin-top:12px;
    border-radius:6px;
    max-height:300px;
    overflow:auto;
  "
>
🔥 AUTH STORE DEBUG 🔥
{{ JSON.stringify(auth.$state, null, 2) }}
</pre>

-->
      <slot></slot>
    </main>




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
    const auth = useAuthStore();

    const router = useRouter();
    const route = useRoute();


/* ------------------------------------------------------------------------
   👤 USER & ROLES — VERSION SAAS MULTI-PROF (FIX CASE-SENSITIVE)
------------------------------------------------------------------------ */

// Normaliser le rôle en minuscule
const role = computed(() => (authStore.user?.role || "").toLowerCase());

const isPro = computed(() =>
  auth.user?.privileges?.includes("pro")
)
;
const user = computed(() => authStore.user);

const pendingCount = computed(() => authStore.pendingReportsCount);

const isLoggedIn = computed(() => !!authStore.jwt);
const hasPrivileges = computed(() =>
  authStore.privilegesStatus === "active"
)

;
/* ADMIN réel = toujours vrai si role = admin (même en impersonation) */
const isRealAdmin = computed(() => role.value === "admin");

/* Admin visible → sauf en mode 'voir comme élève' */
const isAdmin = computed(() =>
  authStore.user?.role === "admin" && !authStore.impersonateStudent
)

;

/* Prof = prof OU admin */
const isProf = computed(() =>
  ["prof", "admin"].includes(authStore.user?.role)
)
;

/* Élève = ni admin visible, ni prof */
const isEleve = computed(() =>
  isLoggedIn.value && !isProf.value
)
;

/*=================CLOSE MENU MOBILE */
const closeMenu = () => {
  if (authStore.menuOpen) {
    authStore.menuOpen = false
  }
};



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

      // SWIPE MENU HUMBERGER
// window.addEventListener("touchstart", handleTouchStart, { passive: false });
// window.addEventListener("touchend", handleTouchEnd);

      // Auto-close mobile menu when tapping a link
      const mobileMenu = document.querySelector(".mobile-menu");
      if (mobileMenu) {
        mobileMenu.addEventListener("click", e => {
          if (e.target.closest(".nav-link")) authStore.menuOpen = false;
        });
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
// window.removeEventListener("touchstart", handleTouchStart);
// window.removeEventListener("touchend", handleTouchEnd);

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
      auth,
      isPro,
      hasPrivileges,
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
      logoutMessage,

      /* close menu */
        closeMenu,

    };
  }
};
</script>










<style scoped>
  .cta
  {
    border:none;
  }
html, body {
  margin: 0;
  padding: 0;
  background: #000 !important;

  /* 🔥 FIX SCROLL VERTICAL */
  height: 100%;
  overflow: hidden;
  position: fixed;
  width: 100%;

  /* Désactive le bounce scroll iOS */
  overscroll-behavior: none;
  -webkit-overflow-scrolling: auto;
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
/* ✅ Bouton pour afficher/masquer la sidebar */
.toggle-menu-btn {
  position: fixed; /* ✅ CHANGÉ de absolute à fixed */
  top: 50%;
  left: 232px; /* ✅ Position initiale (250px sidebar - 18px pour centrage) */
  transform: translateY(-50%);

  width: 28px;
  height: 56px;
  background: #0b0c0f;
  border: 1px solid #1f2933;
  border-radius: 999px;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #fb923c;
  cursor: pointer;
  z-index: 1200;

  box-shadow: 0 6px 20px rgba(0,0,0,0.4);
  transition: left 0.3s ease, background 0.15s ease, transform 0.15s ease; /* ✅ AJOUT transition sur left */
}

.toggle-menu-btn:hover {
  background: #111318;
  transform: translateY(-50%) scale(1.05);
}

.sidebar.isCollapsed {
  transform: translateX(-100%); /* ✅ Cache la sidebar en la déplaçant hors de l'écran */
}
.toggle-menu-btn i {
  font-size: 14px;
}

/* ✅ Hover */
.toggle-menu-btn:hover {
  background: #b9360a; /* Rouge foncé au hover */
  box-shadow: none;
}
/* ✅ Quand la sidebar est réduite, le bouton reste visible */

.sidebar.isCollapsed + .toggle-menu-btn {
  left: 1px; /* Ramène le bouton vers la gauche */
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

  }
}

@media screen and (max-width: 1024px) {
  .menu-btn {
    position: absolute; /* ✅ S'assurer qu'il reste bien positionné */
    left: 0px; /* ✅ Distance du bord gauche */
    top: 0px; /* ✅ Distance du haut */
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








/* ✅ Boutons d'authentification sur desktop */
.desktop-auth-buttons {
  display: flex;
  gap: 15px;
  position: absolute;
  right: 5%;
}

/* base commune */
.btn-auth {
  padding: 6px 14px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.75rem;
  letter-spacing: .04em;
  text-transform: uppercase;
  text-decoration: none;
  transition: background-color .2s ease, color .2s ease, transform .1s ease;
}

/* login */
.login-btn {
  background: transparent;
  border: 1.5px solid #fff;
  color: #fff;
}

.login-btn:hover {
  background: #fff;
  color: #000;
}

/* trial */
.trial-btn {
  background: #f1750f;
  border: 1.5px solid #f1750f;
  color: #000;
}

.trial-btn:hover {
  background: #ffe057;
  border-color: #ffdd57;
}

.btn-auth:active {
  transform: scale(0.97);
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
  background: rgba(255, 255, 255, 0.12);
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
  flex-direction: row;
  background-color: #000000;
  height: 100vh;
  height: 100dvh; /* iOS modern */
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
  background-color: #d44b0b;
  color: black !important;
  font-weight: bold;
  padding: 8px 15px;
  border-radius: 8px;
  text-transform: uppercase;
  font-size: 20px;
  transition: background 0.3s ease-in-out;
}
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
  z-index: 1200;
    pointer-events: auto;

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
  z-index: 1201;
}
.mobile-menu a:not(:last-child),
.mobile-menu .nav-link:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.3); /* Ligne séparatrice */
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



}
@media screen and (max-width: 1024px) {
  .page-content {
    margin-left: 0; /* ✅ Plus de sidebar en mobile, donc pas de décalage */
    width: 100%; /* Pleine largeur */

  }

}


@media screen and (max-width: 768px) {
  .mobile-menu .nav-link {
    padding: 6px 8px;
    font-size: 14px;
  }
}

.account-info-block {
  position: absolute;
  top: px;
  right: 5%;
  display: flex;
  flex-direction: row;
  margin-top:10px;
  align-items: center;
  gap: 20px; /* espace entre les icônes */
  z-index: 1051; /* plus haut que .hero-banner si nécessaire */
}
.account-info-block .cta_header {
  margin-right: 50px;
  margin-top:10px;
}



body.loading-active {
  overflow: hidden;
}


.account-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;          /* ✅ centrage horizontal */
  padding: .45rem .9rem;
  min-height: 28px;                 /* ✅ centrage vertical stable */
  border-radius: 999px;             /* vrai CTA */
  font-size: .75rem;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
  transition: background .15s ease, transform .12s ease, box-shadow .12s ease;
}

/* CTA */
/* =========================
   ACCOUNT BADGE (GLOBAL)
   ========================= */
.account-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-height: 30px;
  padding: .45rem 1rem;

  border-radius: 999px;
  font-size: .75rem;
  font-weight: 600;
  letter-spacing: .02em;
  line-height: 1;

  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;

  transition:
    background .18s ease,
    color .18s ease,
    box-shadow .18s ease,
    transform .15s ease;
}

/* =========================
   CTA — UPGRADE
   ========================= */
.account-badge.upgrade {
  background: linear-gradient(135deg, #6f7cff, #8b95ff);
  color: #fff;

  box-shadow:
    0 2px 6px rgba(120,130,255,.35),
    0 0 0 0 rgba(120,130,255,.5);

  animation: cta-pulse 2.6s ease-in-out infinite;
}

.account-badge.upgrade:hover {
  transform: translateY(-1px);
  box-shadow:
    0 6px 14px rgba(120,130,255,.45),
    0 0 0 4px rgba(120,130,255,.15);
  animation-play-state: paused;
}

/* =========================
   PREMIUM
   ========================= */
.account-badge.premium {
  background: linear-gradient(135deg, #f5c542, #f0a500);
  color: #1a1a1a;

  box-shadow: 0 2px 6px rgba(245,197,66,.35);
}

/* =========================
   ABONNÉ
   ========================= */
.account-badge.subscriber {
  background: linear-gradient(135deg, #1f3a2e, #21483a);
  color: #7fffd4;

  box-shadow:
    inset 0 0 0 1px rgba(127,255,212,.35),
    0 2px 6px rgba(0,0,0,.25);
}

/* =========================
   MICRO ANIMATION
   ========================= */
@keyframes cta-pulse {
  0% {
    box-shadow:
      0 2px 6px rgba(120,130,255,.35),
      0 0 0 0 rgba(120,130,255,.4);
  }
  70% {
    box-shadow:
      0 2px 6px rgba(120,130,255,.35),
      0 0 0 6px rgba(120,130,255,0);
  }
  100% {
    box-shadow:
      0 2px 6px rgba(120,130,255,.35),
      0 0 0 0 rgba(120,130,255,0);
  }
}

/* CTA principal menu mobile */
.nav-cta-cours {
  background: linear-gradient(135deg, #ff7a18, #ff3d00);
  color: #fff;
  font-weight: 600;
  border-radius: 10px;
  margin: 12px 16px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 6px 18px rgba(255, 61, 0, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.nav-cta-cours i {
  font-size: 1.2rem;
}

.nav-cta-cours:active {
  transform: scale(0.97);
  box-shadow: 0 3px 10px rgba(255, 61, 0, 0.25);
}

/* séparation visuelle */
.cta-separator {
  border: none;
  height: 1px;
  background: rgba(255,255,255,0.08);
  margin: 8px 0 12px;
}


</style>
<style>
/* ===============================
   🔒 GLOBAL SCROLL & ZOOM FIX
   =============================== */
html {
  overflow: hidden;
  height: 100%;
  position: fixed;
  width: 100%;
  margin: 0;
  padding: 0;
  background: #000 !important;
}

body {
  overflow: hidden;
  height: 100%;
  position: fixed;
  width: 100%;
  margin: 0;
  padding: 0;
  overscroll-behavior: none;
  -webkit-overflow-scrolling: auto;
}

#app {
  overflow: hidden;
  height: 100vh;
  height: 100dvh; /* iOS modern */
  width: 100%;
}


/* 🔥 Réactive la sélection pour les inputs */
input,
textarea,
select,
[contenteditable] {
  touch-action: auto;
}


/* ===============================
   LOGOUT TOAST
   =============================== */
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


/* ===============================
   OVERLAY
   =============================== */
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


/* ===============================
   MOBILE ACCOUNT ACTIONS
   =============================== */
.mobile-account-actions {
  position: absolute;
  top: 5px;
  right: -8px;
  display: flex;
  gap: 0px;
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


/* ===============================
   PAGE CONTENT SPACING FIX
   =============================== */
.page-content > *:last-child {
  margin-bottom: 0 !important;
}


/* ===============================
   SWIPE HINT
   =============================== */
.swipe-hint {
  position: fixed;
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
  font-size: 48px;
  color: white;
  animation: swipe-fade 2s ease-in-out infinite;
  z-index: 9999;
  pointer-events: none;
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


/* ===============================
   PAGE CONTENT COLLAPSED
   =============================== */
.page-content.collapsed {
  margin-left: 0px;
  width: calc(100% - 30px);
}


/* ===============================
   ACCOUNT LINK
   =============================== */
.account-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  margin-left: -50px;
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


/* ===============================
   HERO BANNER SAFE AREA
   =============================== */
.hero-banner {
  padding-top: env(safe-area-inset-top);
  background: #000 !important;
}


/* ===============================
   SUBSCRIPTION BADGE
   =============================== */
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


/* ===============================
   BODY LOADING STATE
   =============================== */
body.loading-active {
  overflow: hidden;
}


/* ===============================
   MOBILE OVERFLOW FIX
   =============================== */
@media (max-width: 1024px) {
  html, body, #app {
    overflow-x: hidden !important;
  }
}
.badge-premium {
  background: linear-gradient(135deg, #f5c16c, #f0a500);
  color: #000;
}

.badge-free {
  background: #2c2c2c;
  color: #bbb;
}

.badge-link {
  text-decoration: none;
}

.sub-pill {
  display: inline-flex;
  align-items: center;
  padding: .35rem .7rem;
  border-radius: 999px;
  font-size: .75rem;
  font-weight: 600;
}

/* CTA */
.sub-pill.cta {
  background: #2a2a2a;
  color: #fff;
  border: 1px solid #3a3a3a;
  text-decoration: none;
}
.sub-pill.cta:hover { background: #333; }

/* PREMIUM */
.sub-pill.pro {
  background: linear-gradient(135deg, #f5c542, #f0a500);
  color: #1a1a1a;
}

/* ABONNÉ */
.sub-pill.subscriber {
  background: #1f3a2e;
  color: #7fffd4;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .15s ease, transform .15s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(-2px);
}
.fade-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.sub-pill.placeholder {
  width: 72px;
  height: 26px;
  opacity: 0;
}

.hero-text{
  text-decoration: none;
  color: inherit;
  display: block;
  cursor: pointer;
}
</style>

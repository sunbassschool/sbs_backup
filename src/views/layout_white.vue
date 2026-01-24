<template>
  <div class="layout-container" :class="{ 'with-sidebar': sidebarIsVisible }">

    <!-- SIDEBAR Desktop -->
    <aside class="sidebar" :class="{ isCollapsed: isSidebarCollapsed, hidden: isMobile }">
      <div class="sidebar-logo">
        <img :src="logoUrl" class="sidebar-main-logo" alt="Teachy.pro" />
      </div>

      <nav class="sidebar-nav">
        <!-- PUBLIC -->
        <template v-if="!isLoggedIn">
          <router-link to="/videos" class="sidebar-link">
            <i class="bi bi-film"></i><span>Vidéos</span>
          </router-link>
          <router-link to="/partitions" class="sidebar-link">
            <i class="bi bi-music-note-beamed"></i><span>Partitions</span>
          </router-link>
          <router-link to="/BassTuner" class="sidebar-link">
            <i class="bi bi-music-note"></i><span>Accordeur</span>
          </router-link>
        </template>

        <!-- ÉLÈVE -->
        <router-link v-if="isLoggedIn && isEleve" to="/eleve/offres" class="sidebar-link btn-cours">
          <i class="bi bi-play-circle"></i><span>Prendre un cours</span>
        </router-link>
        <router-link v-if="isLoggedIn && isEleve" to="/dashboard" class="sidebar-link">
          <i class="bi bi-house-door"></i><span>Accueil</span>
        </router-link>
        <router-link v-if="isLoggedIn && isEleve" to="/moncompte" class="sidebar-link">
          <i class="bi bi-person-circle"></i><span>Mon compte</span>
        </router-link>
        <router-link v-if="isEleve" to="/mes-uploads" class="sidebar-link">
          <i class="bi bi-cloud-upload"></i><span>Drive</span>
        </router-link>
        <router-link v-if="isLoggedIn && isEleve" to="/planning" class="sidebar-link">
          <i class="bi bi-calendar-check"></i><span>Plannings</span>
        </router-link>
        <router-link v-if="isLoggedIn && isEleve" to="/replay" class="sidebar-link">
          <i class="bi bi-play-btn"></i><span>Replay</span>
        </router-link>
        <router-link v-if="isLoggedIn && isEleve" to="/Feedback" class="sidebar-link">
          <i class="bi bi-chat-left-text"></i><span>Feedback</span>
        </router-link>
        <router-link v-if="isLoggedIn && isEleve" to="/videos" class="sidebar-link">
          <i class="bi bi-film"></i><span>Vidéos</span>
        </router-link>
        <router-link v-if="isLoggedIn && isEleve" to="/partitions" class="sidebar-link">
          <i class="bi bi-music-note-beamed"></i><span>Partitions</span>
        </router-link>
        <router-link v-if="isLoggedIn && isEleve" to="/BassTuner" class="sidebar-link">
          <i class="bi bi-music-note"></i><span>Accordeur</span>
        </router-link>

        <!-- PROF -->
        <router-link v-if="isProf" to="/dashboard-prof" class="sidebar-link">
          <i class="bi bi-speedometer2"></i><span>Dashboard Prof</span>
        </router-link>
        <router-link v-if="isAdmin" to="/admin" class="sidebar-link">
          <i class="bi bi-gear"></i><span>Admin</span>
        </router-link>
        <router-link v-if="isProf" to="/dashboard-prof/offres" class="sidebar-link">
          <i class="bi bi-bag"></i><span>Ma boutique</span>
        </router-link>
        <router-link v-if="isProf" to="/FeedBackProf" class="sidebar-link">
          <i class="bi bi-chat-left-dots"></i><span>Feedbacks Élèves</span>
        </router-link>
        <router-link v-if="isProf" to="/gestioneleves" class="sidebar-link">
          <i class="bi bi-people"></i><span>Gestion Élèves</span>
        </router-link>
        <router-link v-if="isProf" to="/prof/planning/create" class="sidebar-link">
          <i class="bi bi-calendar-event"></i><span>Créer un planning</span>
        </router-link>
        <router-link v-if="isProf" to="/cours" class="sidebar-link">
          <i class="bi bi-wrench-adjustable"></i><span>Gestion des cours</span>
        </router-link>
      </nav>
    </aside>

    <!-- Toggle sidebar button -->
    <button v-if="!isMobile" class="toggle-menu-btn" @click="toggleSidebar">
      <i :class="isSidebarCollapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-left'"></i>
    </button>

    <!-- HEADER -->
    <header class="hero-banner">
      <div class="hero-content">
        <img v-if="!isMobile" :src="logoUrl" class="logo" alt="Teachy.pro" />
        <img v-if="showResponsiveLogo" :src="logoUrl" class="logo responsive-logo" />

        <button class="menu-btn" v-if="isMobile" @click="authStore.toggleMenu()">
          <i class="bi bi-list"></i>
        </button>

        <div v-if="isLoggedIn && isMobile" class="mobile-account-actions">
          <router-link to="/moncompte"><i class="bi bi-person-circle"></i></router-link>
          <button @click="handleLogout"><i class="bi bi-box-arrow-right"></i></button>
        </div>

        <button v-if="showInstallButton" @click="installPWA" class="install-btn">📥</button>

        <div class="hero-text">
          <h1 class="hero-title">Teachy.pro</h1>
          <p class="hero-subtitle">La plateforme tout-en-un pour les profs indépendants.</p>
        </div>

        <div v-if="!isLoggedIn && !isMobile" class="desktop-auth-buttons">
          <router-link to="/login" class="btn-auth login-btn">Se connecter</router-link>
          <router-link to="/register" class="btn-auth trial-btn">Essai Gratuit</router-link>
        </div>

        <div v-if="isLoggedIn && !isMobile" class="account-info-block">
          <router-link to="/moncompte" class="account-link">
            <i class="bi bi-person-gear"></i>
          </router-link>
          <div v-if="user?.statut" class="subscription-badge">
            <span v-if="isSubscribed" class="badge bg-success">✅ Abonné</span>
            <router-link v-else :to="{ name: 'eleve-offres' }" class="subscription-badge-link">
              ❌ Non abonné
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <!-- MENU MOBILE -->
    <div v-if="showMenu" class="menu-overlay" @click="closeMenu" @touchend="closeMenu"></div>
    <div class="mobile-menu" :class="{ active: showMenu }" @click.stop @touchend.stop>
      <template v-if="!isLoggedIn">
        <router-link to="/videos" class="nav-link"><i class="bi bi-film"></i><span>Vidéos</span></router-link>
        <router-link to="/partitions" class="nav-link"><i class="bi bi-music-note-beamed"></i><span>Partitions</span></router-link>
        <router-link to="/BassTuner" class="nav-link"><i class="bi bi-music-note"></i><span>Accordeur</span></router-link>
        <router-link to="/login" class="nav-link"><i class="bi bi-box-arrow-in-right"></i><span>Se connecter</span></router-link>
        <router-link to="/register" class="nav-link"><i class="bi bi-person-plus"></i><span>S'inscrire</span></router-link>
      </template>

      <div v-if="user && isMobile" class="subscription-badge">
        <span v-if="isSubscribed" class="badge bg-success">✅ Abonné</span>
        <a v-else href="https://www.sunbassschool.com" target="_blank" class="badge bg-danger">❌ Non abonné</a>
      </div>

      <!-- Élève mobile -->
      <router-link v-if="isEleve" to="/dashboard" class="nav-link"><i class="bi bi-house"></i><span>Accueil</span></router-link>
      <router-link v-if="isEleve" to="/Feedback" class="nav-link"><i class="bi bi-chat-left"></i><span>Feedback</span></router-link>
      <router-link v-if="isEleve" to="/replay" class="nav-link"><i class="bi bi-play-btn"></i><span>Replay</span></router-link>
      <router-link v-if="isEleve" to="/planning" class="nav-link"><i class="bi bi-calendar-check"></i><span>Plannings</span></router-link>
      <router-link v-if="isEleve" to="/mes-uploads" class="nav-link"><i class="bi bi-cloud-upload"></i><span>Drive</span></router-link>
      <router-link v-if="isEleve" to="/videos" class="nav-link"><i class="bi bi-film"></i><span>Vidéos</span></router-link>
      <router-link v-if="isEleve" to="/partitions" class="nav-link"><i class="bi bi-music-note-beamed"></i><span>Partitions</span></router-link>
      <router-link v-if="isEleve" to="/BassTuner" class="nav-link"><i class="bi bi-music-note"></i><span>Accordeur</span></router-link>

      <!-- Prof mobile -->
      <router-link v-if="isProf" to="/dashboard" class="nav-link"><i class="bi bi-house"></i><span>Accueil</span></router-link>
      <router-link v-if="isProf" to="/dashboard-prof" class="nav-link"><i class="bi bi-speedometer2"></i><span>Dashboard</span></router-link>
      <router-link v-if="isProf" to="/FeedBackProf" class="nav-link"><i class="bi bi-chat"></i><span>Feedbacks</span></router-link>
      <router-link v-if="isProf" to="/mes-uploads" class="nav-link"><i class="bi bi-cloud-upload"></i><span>Drive</span></router-link>
      <router-link v-if="isProf" to="/gestioneleves" class="nav-link"><i class="bi bi-people"></i><span>Mes élèves</span></router-link>
      <router-link v-if="isProf" to="/cours" class="nav-link"><i class="bi bi-tools"></i><span>Mes cours</span></router-link>
      <router-link v-if="isProf" to="/prof/planning/create" class="nav-link"><i class="bi bi-calendar-event"></i><span>Créer planning</span></router-link>
      <router-link v-if="isProf" to="/dashboard-prof/offres" class="nav-link"><i class="bi bi-bag"></i><span>Ma boutique</span></router-link>
    </div>

    <!-- CONTENU PRINCIPAL -->
    <main class="page-content" :class="{ collapsed: isSidebarCollapsed }">
      <slot></slot>
    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore.js";
import { logoutUser, isJwtExpired } from "@/utils/api.ts";
import MiniMetronome from "@/components/MiniMetronome.vue";
import logo from "@/assets/teachy.png";

export default {
  name: "Layout",
  components: { MiniMetronome },
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();
    const route = useRoute();

    const role = computed(() => (authStore.user?.role || "").toLowerCase());
    const user = computed(() => authStore.user);
    const pendingCount = computed(() => authStore.pendingReportsCount);
    const isLoggedIn = computed(() => !!authStore.jwt);
    const isRealAdmin = computed(() => role.value === "admin");
    const isAdmin = computed(() => {
      if (authStore.impersonateStudent) return false;
      return role.value === "admin";
    });
    const isProf = computed(() => ["prof", "admin"].includes(authStore.user?.role));
    const isEleve = computed(() => isLoggedIn.value && !isAdmin.value && !isProf.value);

    const closeMenu = () => {
      if (authStore.menuOpen) authStore.menuOpen = false;
    };

    const isMobile = ref(window.innerWidth <= 1024);
    const isSidebarCollapsed = ref(false);
    const sidebarIsVisible = computed(() => !isMobile.value && !isSidebarCollapsed.value && authStore.jwt);
    const showMenu = computed(() => authStore.menuOpen);
    const logoUrl = ref(logo);
    const showResponsiveLogo = ref(false);
    const showOverlay = ref(false);
    const tookTooLong = ref(false);
    const logoutMessage = ref("");
    const showSwipeHint = ref(false);

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

    const isSubscribed = computed(() => {
      const statut = (user.value?.statut || "").toLowerCase();
      return ["abonné", "payant", "inscrit", "actif"].includes(statut) && !!user.value?.fin_acces;
    });

    const formattedFinAcces = computed(() => {
      if (!user.value?.fin_acces) return "Non défini";
      return new Date(user.value.fin_acces).toLocaleDateString("fr-FR", {
        day: "2-digit", month: "long", year: "numeric"
      });
    });

    const checkMobile = () => (isMobile.value = window.innerWidth <= 1024);
    const toggleMenu = () => authStore.toggleMenu();
    const toggleSidebar = () => (isSidebarCollapsed.value = !isSidebarCollapsed.value);

    async function handleLogout() {
      await logoutUser();
      authStore.$reset();
    }

    onMounted(() => {
      window.addEventListener("user-data-updated", () => {
        setTimeout(() => {
          const el = document.querySelector("main");
          if (el && !el.classList.contains("page-content")) {
            el.classList.add("page-content");
          }
        }, 50);
      });
      window.addEventListener("resize", checkMobile);
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
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

    onUnmounted(() => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    });

    const authLoading = computed(() => authStore.isRefreshingToken);
    const refreshFailed = computed(() => authStore.refreshFailed);
    const isRefreshing = computed(() => authStore.isRefreshingToken);

    watch(authLoading, val => {
      showOverlay.value = false;
      document.body.classList.toggle("loading-active", val);
      if (val) {
        setTimeout(() => {
          if (authLoading.value) tookTooLong.value = true;
        }, 5000);
      } else {
        tookTooLong.value = false;
      }
    });

    watch(() => authStore.jwt, (newVal, oldVal) => {
      if (!newVal && oldVal && !authStore.isLoggingOut &&
        localStorage.getItem("logout_in_progress") !== "true") {
        logoutMessage.value = "Session expirée. Veuillez vous reconnecter.";
      }
    });

    return {
      authStore, user, isLoggedIn, isAdmin, isProf, isEleve, isRealAdmin, pendingCount,
      isMobile, sidebarIsVisible, isSidebarCollapsed, toggleSidebar, toggleMenu, showMenu,
      showOverlay, showResponsiveLogo, logoUrl, isSubscribed, formattedFinAcces,
      showInstallButton, installPWA, handleLogout, showSwipeHint, refreshFailed,
      authLoading, isRefreshing, tookTooLong, logoutMessage, closeMenu
    };
  }
};
</script>

<style>
/* DESIGN SYSTEM - TONS CLAIRS */
:root {
  --primary: #4F46E5;
  --primary-light: #818CF8;
  --secondary: #06B6D4;
  --accent: #F59E0B;
  --success: #10B981;
  --danger: #EF4444;
  --bg-main: #F9FAFB;
  --bg-card: #FFFFFF;
  --text-primary: #111827;
  --text-secondary: #6B7280;
  --text-muted: #9CA3AF;
  --border: #E5E7EB;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 10px 25px rgba(0,0,0,0.1);
  --radius: 12px;
}

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg-main) !important;
  height: 100%;
  overflow: hidden;
  position: fixed;
  width: 100%;
  font-family: 'Inter', -apple-system, sans-serif;
}

.layout-container {
  display: flex;
  height: 100vh;
  background: var(--bg-main);
  overflow: hidden;
}

/* SIDEBAR */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 280px;
  background: var(--bg-card);
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1100;
  overflow: hidden;
}

.sidebar.isCollapsed {
  transform: translateX(-100%);
}

.sidebar-logo {
  text-align: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border);
}

.sidebar-main-logo {
  width: 160px;
  height: auto;
  transition: transform 0.2s;
}

.sidebar-main-logo:hover {
  transform: scale(1.05);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  padding-right: 8px;
}

.sidebar-nav::-webkit-scrollbar {
  width: 6px;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 10px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius);
  color: var(--text-secondary);
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}

.sidebar-link i {
  font-size: 20px;
  min-width: 20px;
}

.sidebar-link:hover {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(6, 182, 212, 0.08));
  color: var(--primary);
  transform: translateX(4px);
}

.sidebar-link.router-link-exact-active {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  font-weight: 600;
  box-shadow: var(--shadow-md);
}

.sidebar-link.btn-cours {
  background: linear-gradient(135deg, var(--accent), #FBBF24);
  color: white;
  font-weight: 600;
  margin: 8px 0 16px;
  box-shadow: var(--shadow-md);
}

.sidebar-link.btn-cours:hover {
  transform: scale(1.02);
  box-shadow: var(--shadow-lg);
}

.toggle-menu-btn {
  position: fixed;
  top: 50%;
  left: 264px;
  transform: translateY(-50%);
  width: 32px;
  height: 64px;
  background: white;
  border: 1px solid var(--border);
  border-radius: 0 var(--radius) var(--radius) 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  cursor: pointer;
  z-index: 1200;
  box-shadow: var(--shadow-md);
  transition: all 0.3s;
}

.toggle-menu-btn:hover {
  background: var(--primary);
  color: white;
}

.sidebar.isCollapsed + .toggle-menu-btn {
  left: 0;
}

/* HEADER */
.hero-banner {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 80px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 0 24px;
}

.hero-content {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 1400px;
  gap: 24px;
}

.logo {
  height: 50px;
  margin-left: 280px;
}

.hero-text {
  flex: 1;
  text-align: center;
}

.hero-title {
  font-size: 1.8rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  letter-spacing: -0.5px;
}

.hero-subtitle {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin: 4px 0 0;
  font-weight: 500;
}

.desktop-auth-buttons {
  display: flex;
  gap: 12px;
}

.btn-auth {
  padding: 10px 24px;
  border-radius: var(--radius);
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  font-size: 14px;
}

.login-btn {
  background: white;
  border: 2px solid var(--primary);
  color: var(--primary);
}

.login-btn:hover {
  background: var(--primary);
  color: white;
}

.trial-btn {
  background: linear-gradient(135deg, var(--accent), #FBBF24);
  color: white;
  border: none;
  box-shadow: var(--shadow-md);
}

.trial-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.account-info-block {
  display: flex;
  align-items: center;
  gap: 16px;
}

.account-link {
  font-size: 1.8rem;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.account-link:hover {
  color: var(--primary);
}

.subscription-badge {
  font-size: 0.85rem;
  font-weight: 600;
}

.badge {
  padding: 6px 12px;
  border-radius: 20px;
  text-decoration: none;
}

.bg-success {
  background: var(--success);
  color: white;
}

.subscription-badge-link {
  background: var(--danger);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  text-decoration: none;
  display: inline-block;
}

.install-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

/* MOBILE */
.menu-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: var(--text-primary);
  cursor: pointer;
}

.mobile-account-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.mobile-account-actions i {
  font-size: 24px;
  color: var(--text-secondary);
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 998;
}

.mobile-menu {
  position: fixed;
  top: 80px;
  left: -100%;
  width: 80%;
  max-width: 320px;
  height: calc(100% - 80px);
  background: var(--bg-card);
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-shadow: var(--shadow-lg);
  transition: left 0.3s;
  z-index: 999;
  overflow-y: auto;
}

.mobile-menu.active {
  left: 0;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  color: var(--text-secondary);
  font-weight: 500;
  text-decoration: none;
  border-radius: var(--radius);
  transition: all 0.2s;
}

.nav-link i {
  font-size: 20px;
}

.nav-link:hover {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(6, 182, 212, 0.08));
  color: var(--primary);
}

/* MAIN CONTENT */
.page-content {
  flex: 1;
  margin-top: 80px;
  margin-left: 280px;
  overflow-y: auto;
  background: var(--bg-main);
  padding: 24px;
}

.page-content.collapsed {
  margin-left: 0;
}

@media (max-width: 1024px) {
  .sidebar {
    display: none;
  }

  .toggle-menu-btn {
    display: none;
  }

  .logo {
    margin-left: 0;
    height: 40px;
  }

  .page-content {
    margin-left: 0;
    width: 100%;
  }

  .hero-banner {
    padding: 0 16px;
  }

  .desktop-auth-buttons {
    display: none;
  }

  .account-info-block {
    display: none;
  }
}
</style>

<style>
html {
  overflow: hidden;
  height: 100%;
  position: fixed;
  width: 100%;
}

body {
  overflow: hidden;
  height: 100%;
  position: fixed;
  width: 100%;
  overscroll-behavior: none;
}

#app {
  overflow: hidden;
  height: 100vh;
  width: 100%;
}

input, textarea, select, [contenteditable] {
  touch-action: auto;
}

.logout-toast {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--danger);
  color: white;
  padding: 12px 24px;
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  z-index: 9999;
}

body.loading-active {
  overflow: hidden;
}

* {
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}
</style>

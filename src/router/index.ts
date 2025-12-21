import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/authStore.js";
import { watch } from "vue";

type AnyStore = ReturnType<typeof useAuthStore> & Record<string, any>;

// =============================================================
// 📌 Pages (import)
// =============================================================
import HomeView from "@/views/HomeView.vue";
import IntroView from "@/views/IntroView.vue";
import BassTuner from "@/views/BassTuner.vue";
import Dashboard from "@/views/Dashboard.vue";
import Partitions from "@/views/Partitions.vue";
import Planning from "@/views/Planning.vue";
import Replay from "@/views/Replay.vue";
import Videos from "@/views/Videos.vue";
import Cours from "@/views/Cours.vue";
import Login from "@/views/Login.vue";
import MonEspace from "@/views/MonEspace.vue";
import RegisterForm from "@/views/RegisterForm.vue";
import Prendreuncours from "@/views/Prendreuncours.vue";
import RegisterCursus from "@/views/RegisterCursus.vue";
import ForgotPassword from "@/views/ForgotPassword.vue";
import ResetPassword from "@/views/resetPassword.vue";
import Metronome from "@/views/Metronome.vue";
import MesRessources from "@/views/MesRessources.vue";
import Feedback from "@/views/Feedback.vue";
import FeedBackProf from "@/views/AdminFeedBack.vue";
import GestionEleves from "@/views/GestionEleves.vue";
import AdminFeedback from "@/views/AdminFeedback.vue";
import moncompte from "@/views/moncompte.vue";
import dashboardreports from "@/views/dashboardreports.vue";
import LinkProf from "@/views/LinkProf.vue";
import DashboardProf from "@/views/dashboard-prof.vue";
import Abonnements from "@/views/Abonnements.vue";
import NotFound from "@/views/NotFound.vue";
import UploadFile from '@/views/UploadFile.vue'
import createplanning from "@/views/createplanning.vue"


// =============================================================
// 🌍 Base URL (prod = /app/)
// =============================================================
const baseUrl = import.meta.env.MODE === "production" ? "/app/" : "/";

const router = createRouter({
  history: createWebHistory(baseUrl),

  routes: [
    // =========================================================
    // 🏠 ROOT → redirige selon login
    // =========================================================
    {
      path: "/",
      name: "root-redirect",
      redirect: () => {
        const store = useAuthStore() as AnyStore;
        return store.isLoggedIn ? { name: "dashboard" } : { name: "login" };
      },
    },

    // =========================================================
    // 🛂 AUTH
    // =========================================================
    { path: "/login", name: "login", component: Login },
    { path: "/forgot-password", name: "Forgotpassword", component: ForgotPassword },
    { path: "/reset-password", name: "Resetpassword", component: ResetPassword },

    // =========================================================
    // 👑 ADMIN ONLY
    // =========================================================
    {
      path: "/register-cursus",
      name: "RegisterCursus",
      component: RegisterCursus,
      meta: { requiresAuth: true, role: "admin" },
    },

    {
      path: "/AdminFeedback",
      name: "AdminFeedback",
      component: AdminFeedback,
      meta: { requiresAuth: true, role: "admin" },
    },
    {
      path: "/dashboardreports",
      name: "dashboardreports",
      component: dashboardreports,
      meta: { requiresAuth: true, role: "admin" },
    },


    // =========================================================
    // 👨‍🏫 PROF (et ADMIN aussi)
    // =========================================================
    {
      path: "/dashboard-prof",
      name: "dashboard-prof",
      component: DashboardProf,
      meta: { requiresAuth: true, requiresProf: true },
    },
    {
      path: "/GestionEleves",
      name: "GestionEleves",
      component: GestionEleves,
      meta: { requiresAuth: true, requiresProf: true },
    },
    {
      path: "/FeedBackProf",
      name: "FeedBackProf",
      component: FeedBackProf,
      meta: { requiresAuth: true, requiresProf: true },
    },

        {
      path: "/cours",
      name: "cours",
      component: Cours,
      meta: { requiresAuth: true, requiresProf: true },
    },




{
    path: "/prof/planning/create",
    name: "createplanning",
    component: createplanning,
    meta: { requiresAuth: true, requiresProf: true },
    },



    // =========================================================
    // 👤 USER (tout utilisateur connecté)
    // =========================================================
    { path: "/dashboard", name: "dashboard", component: Dashboard, meta: { requiresAuth: true } },
    { path: "/mon-espace", name: "mon-espace", component: MonEspace, meta: { requiresAuth: true } },
    { path: "/planning", name: "planning", component: Planning, meta: { requiresAuth: true } },
    { path: "/replay", name: "replay", component: Replay, meta: { requiresAuth: true } },
        { path: "/LinkProf", name: "LinkProf", component: LinkProf, meta: { requiresAuth: true } },

    {
  path: '/upload-test',
  name: 'UploadTest',
  component: UploadFile,
  meta: {
    requiresAuth: true
  }
},
{
  path: "/mes-uploads",
  name: "EleveUploads",
  component: () => import("@/views/EleveUploads.vue"),
  meta: { requiresAuth: true }
}
,
    { path: "/moncompte", name: "moncompte", component: moncompte, meta: { requiresAuth: true } },
    { path: "/MesRessources", name: "MesRessources", component: MesRessources },

    // =========================================================
    // 🌐 PUBLIC
    // =========================================================
    {
  path: "/register",
  component: () => import("@/views/RegisterChoice.vue")
},
{
  path: "/register/prof",
  component: () => import("@/views/RegisterProf.vue")
},
    { path: "/intro", name: "intro", component: IntroView },
    { path: "/Feedback", name: "Feedback", component: Feedback },
    { path: "/FeedBackProf", name: "FeedBackProf", component: FeedBackProf },
    { path: "/home", name: "home", component: HomeView },
    { path: "/partitions", name: "partitions", component: Partitions },
    { path: "/videos", name: "videos", component: Videos },
    { path: "/Metronome", name: "Metronome", component: Metronome },
    { path: "/BassTuner", name: "BassTuner", component: BassTuner },
    { path: "/prendreuncours", name: "prendreuncours", component: Prendreuncours },

    { path: "/registerform", name: "registerform", component: RegisterForm },
        { path: "/Abonnements", name: "Abonnements", component: Abonnements },


    // =========================================================
    // ❌ 404
    // =========================================================
    { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFound },
  ],
});


// =============================================================
// 🔐 GLOBAL GUARD MULTI-PROF / ADMIN
// =============================================================
router.beforeEach(async (to, from) => {
  const store = useAuthStore();

  const hasJwt = !!store.jwt;
  const hasUser = !!store.user;
  const isLoggedIn = hasJwt && hasUser;
  const requiresAuth = to.meta.requiresAuth === true;

  // ============================
  // LOGIN toujours accessible
  // ============================
  if (to.name === "login") return true;

  // ============================
  // Attente authReady
  // ============================
  if (!store.authReady) {
    await new Promise((resolve) =>
      watch(
        () => store.authReady,
        (v) => v === true && resolve(true),
        { immediate: false }
      )
    );
  }

  // ============================
  // Route PROTÉGÉE → login si pas connecté
  // ============================
  if (requiresAuth && !isLoggedIn) {
    return { name: "login" };
  }

// ============================
// Route PROF (admin autorisé aussi)
// ============================
if (to.meta.requiresProf) {
  const role = store.user?.role ?? ""

  if (!["prof", "admin"].includes(role)) {
    return { path: "/" }
  }
}


  // ============================
  // Route ADMIN
  // ============================
  if (to.meta.role === "admin" && store.user?.role !== "admin") {
    return { path: "/" };
  }

  return true;
});

export default router;

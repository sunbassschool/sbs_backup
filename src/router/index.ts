import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/authStore.js";
import { watch } from "vue";

type AnyStore = ReturnType<typeof useAuthStore> & Record<string, any>;

// =============================================================
// 📌 Pages (import)
// =============================================================
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
  name: "root",
  redirect: () => {
    const store = useAuthStore()

    // 🔒 pas loggé
    if (!store.jwt) {
      return { path: "/login" }
    }

    const role = store.user?.role ?? ""

    // 👨‍🏫 prof / admin
    if (role === "prof" || role === "admin") {
      return { path: "/dashboard-prof" }
    }

    // 👤 élève
    return { path: "/dashboard" }
  }
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
  path: "/prof/revenus",
  name: "ProfRevenus",
  component: () => import("@/views/dashboard-prof/ProfRevenus.vue"),
  meta: { requiresAuth: true, role: "prof" }
}
,
{
  path: "/prof/partitions",
  name: "PartitionsProf",
  component: () => import("@/views/Partitions_prof.vue"),
  meta: {
    requiresAuth: true,
    role: "prof"
  }
}
,

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

{
  path: "/stripe-success",
  name: "stripe-success",
  component: () => import("@/components/stripe/StripeSucess.vue"),
  meta: {
    requiresAuth: true,
    requiresProf: true
  }
},
{
  path: "/stripe-success-eleve",
  name: "stripe-success-eleve",
  component: () => import("@/components/stripe/StripeSucessEleve.vue"),
  meta: { requiresAuth: true }
}
,
{
  path: "/mes-achats",
  name: "mes-achats",
  component: () => import("@/views/eleve/MesAchats.vue"),
  meta: { requiresAuth: true }
}
,


{
  path: "/dashboard-prof/offres",
  name: "dashboard-prof-offres",
  component: () => import("@/views/dashboard-prof/Offres.vue"),
  meta: {
    requiresAuth: true,
    requiresProf: true
  }
},
{
  path: "/eleve/offres",
  name: "eleve-offres",
  component: () => import("@/views/eleve/OffresEleve.vue"),
  meta: {
    requiresAuth: true,
    requiresEleve: true
  }
}
,

    // =========================================================
    // 👤 USER (tout utilisateur connecté)
    // =========================================================
    { path: "/dashboard", name: "dashboard", component: Dashboard, meta: { requiresAuth: true } },
    { path: "/mon-espace", name: "mon-espace", component: MonEspace, meta: { requiresAuth: true } },
    { path: "/planning", name: "planning", component: Planning, meta: { requiresAuth: true } },
    { path: "/replay", name: "replay", component: Replay, meta: { requiresAuth: true } },
        { path: "/LinkProf", name: "LinkProf", component: LinkProf, meta: { requiresAuth: true } },
{
  path: "/partitions",
  name: "PartitionsEleve",
  component: () => import("@/views/PartitionsEleve.vue"),
  meta: {
    requiresAuth: true,
  }
},

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
    { path: "/partitions", name: "partitions", component: Partitions },
    { path: "/videos", name: "videos", component: Videos },
    { path: "/Metronome", name: "Metronome", component: Metronome },
{
  path: "/BassTuner",
  component: () => import("@/views/Layout.vue"),
  children: [
    {
      path: "",
      name: "BassTuner",
      component: () => import("@/views/BassTuner.vue")
    }
  ]
},
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
// 🔐 GLOBAL GUARD MULTI-PROF / ADMIN + STRIPE
// =============================================================
router.beforeEach(async (to) => {
  const store = useAuthStore()
  const isLoggedIn = !!store.jwt
  const requiresAuth = to.meta.requiresAuth === true

  // ⛔ login interdit si déjà connecté
  if (to.name === "login" && isLoggedIn) {
    return {
      path: store.user?.role === "prof" ? "/dashboard-prof" : "/dashboard"
    }
  }

  // ✅ routes publiques
  if (!requiresAuth) return true

  // ⏳ attendre authReady uniquement pour routes protégées
  if (!store.authReady) {
    await new Promise(resolve =>
      watch(() => store.authReady, v => v && resolve(true))
    )
  }

  // 🔐 non connecté
  if (!isLoggedIn) {
    return { name: "login" }
  }

  // 👨‍🏫 prof
  if (
    to.meta.requiresProf &&
    !["prof", "admin"].includes(store.user?.role ?? "")
  ) {
    return { path: "/" }
  }

  // 👑 admin
  if (to.meta.role === "admin" && store.user?.role !== "admin") {
    return { path: "/" }
  }

  // =============================================================
  // 💳 STRIPE GUARD (OFFRES UNIQUEMENT)
  // =============================================================
  if (
    to.path === "/dashboard-prof/offres" &&
    store.user?.role === "prof"
  ) {
    // stripe_ready doit être explicitement true
 if (
  to.path === "/dashboard-prof/offres" &&
  store.user?.role === "prof" &&
  store.user?.stripe_ready === false // ⚠️ seulement false
) {
  console.warn("⛔ Accès Offres bloqué : Stripe non prêt")
  return { path: "/dashboard-prof" }
}

  }

  return true
})



export default router;

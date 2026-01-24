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
import UploadFile from '@/views/UploadFile.vue';
import MagicAccess from "@/views/MagicAccess.vue";
import createplanning from "@/views/createplanning.vue"


// =============================================================
// 🌍 Base URL (prod = /app/)
// =============================================================
const baseUrl = import.meta.env.MODE === "production" ? "/app/" : "/";

const router = createRouter({
  history: createWebHistory(baseUrl),

  scrollBehavior(to, from, savedPosition) {
    // ✅ ancres
    if (to.hash) {
      return { el: to.hash, behavior: "smooth" }
    }

    // ✅ back/forward
    if (savedPosition) return savedPosition

    // on laisse le reset landing se faire dans afterEach (plus fiable)
    return { top: 0 }
  },

  routes: [

{
  path: "/",
  name: "root",
  component: () => import("@/views/RootLoader.vue")
}
,
{
  path: "/home",
  name: "home",
  component: () => import("@/views/home.vue"),
    meta: { layout: "landing" }

}
,
{
  path: "/pricing",
  name: "pricing",
  component: () => import("@/views/pricing.vue"),
    meta: { layout: "landing" }

}
,
{
  path: "/cours-de-basse-en-ligne",
  name: "cours-de-basse-en-ligne",
  component: () => import("@/views/cartflow/cours-de-basse-en-ligne.vue"),
    meta: { layout: "landing" }

}
,



{
  path: "/offerpage",
  name: "offerpage",
  component: () => import("@/views/cartflow/OfferPage.vue"),
    meta: { layout: "landing" }

}
,
{
  path: "/magic-access",
  name: "magic-access",
  component: MagicAccess,
  meta: {
    layout: "landing"
  }
}
,

{
  path: "/secure-account",
  component: () => import("@/views/SecureAccount.vue")
}
,


{
  path: "/thankyou",
  name: "thankyou",
  component: () => import("@/views/cartflow/ThankYou.vue")
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
  path: "/admin",
  name: "Admin",
  component: () => import("@/views/Admin.vue"),
  meta: { requiresAuth: true, role: "admin" }
},

    {
      path: "/AdminFeedback",
      name: "AdminFeedback",
      component: AdminFeedback,
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
      path: "/dashboardreports",
      name: "dashboardreports",
      component: dashboardreports,
      meta: { requiresAuth: true, role: "prof" },
    },
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
{ path: "/feedback", name: "Feedback", component: Feedback, meta: { requiresAuth: true } },
{ path: "/feedback-prof", name: "feedBackProf", component: FeedBackProf, meta: { requiresAuth: true } },

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
// 🔐 GLOBAL GUARD MULTI-PROF / ADMIN + STRIPE
// =============================================================
router.beforeEach((to) => {
  const store = useAuthStore()

  if (store.isLoggingOut) return true

  // ⛔ rien tant que l’auth n’est pas prête
  if (!store.authReady) return true

  // 🎯 ROOT → dashboard selon état
if (to.path === "/") {
 if (!store.jwt) {
    return {
      path: "/offerpage",
      query: { funnel: "cours_basse" },
      replace: true
    }
  }

  // ⏳ user pas encore hydraté → on attend
  const role = store.user?.role
  if (!role) {
    return true
  }

  if (["prof", "admin"].includes(role)) {
    return { path: "/dashboard-prof", replace: true }
  }

  return { path: "/dashboard", replace: true }
}


  const requiresAuth = to.meta.requiresAuth === true
  const isLoggedIn = !!store.jwt

  if (!requiresAuth) return true

  if (!isLoggedIn) {
    return { name: "login", replace: true }
  }

  const role = store.user?.role

  if (to.meta.requiresProf && !["prof", "admin"].includes(role)) {
    return { path: "/" }
  }

  if (to.meta.role === "admin" && role !== "admin") {
    return { path: "/" }
  }

  return true
})







export default router;

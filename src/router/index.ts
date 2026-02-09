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
import onboarding from "@/views/OnBoardingEleve.vue";
import Planning from "@/views/Planning.vue";
import Replay from "@/views/Replay.vue";
import Videos from "@/views/Videos.vue";
import Login from "@/views/Login.vue";
import MonEspace from "@/views/MonEspace.vue";
import ForgotPassword from "@/views/ForgotPassword.vue";
import ResetPassword from "@/views/resetPassword.vue";
import Feedback from "@/views/Feedback.vue";
import moncompte from "@/views/moncompte.vue";
import DashboardProf from "@/views/dashboard-prof.vue";
import NotFound from "@/views/NotFound.vue";
import MagicAccess from "@/views/MagicAccess.vue";
import createplanning from "@/views/createplanning.vue"


// =============================================================
// 🌍 Base URL (prod = /app/)
// =============================================================
const getCachedOnboarding = () =>
  localStorage.getItem("onboarding_done") === "true"

console.log(
  "💾 cache onboarding_done =",
  localStorage.getItem("onboarding_done")
)
const router = createRouter({
history: createWebHistory("/"),

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
// PUBLIC SANS JWT
{
  path: "/",
  component: () => import("@/views/RootLoader.vue")
}



,

{
  path: "/secure-account",
  component: () => import("@/views/SecureAccount.vue"),
  meta: { public: true, layout: "landing" }
}

,
{
  path: "/home",
  component: () => import("@/views/home.vue"),
  meta: { public: true, layout: "landing" }
},
{
  path: "/pricing",
  name: "pricing", // 👈 MANQUANT
  component: () => import("@/views/pricing.vue"),
  meta: { public: true, layout: "landing" }
}
,
{
  path: "/cours-de-basse-en-ligne",
  component: () => import("@/views/cartflow/cours-de-basse-en-ligne.vue"),
  meta: { public: true, layout: "landing" }
},
{
  path: "/offerpage",
  component: () => import("@/views/cartflow/OfferPage.vue"),
  meta: { public: true, layout: "landing" }
}
,

{
  path: "/magic-access",
  component: MagicAccess,
  meta: { public: true, layout: "landing" }
},
{
  path: "/thankyou",
  component: () => import("@/views/cartflow/ThankYou.vue"),
  meta: { public: true }
},
{
  path: "/register",
  component: () => import("@/views/RegisterChoice.vue"),
  meta: { public: true, guestOnly: true }
},
{
  path: "/register/prof",
  component: () => import("@/views/RegisterProf.vue"),
  meta: { public: true, guestOnly: true }
},

{
  path: "/registerform",
  component: () => import("@/views/RegisterForm.vue"),
  meta: { public: true }
},

{
  path: "/login",
  component: Login,
  meta: { public: true, guestOnly: true }
},
{
  path: "/forgot-password",
  component: ForgotPassword,
  meta: { public: true }
},
{
  path: "/reset-password",
  component: ResetPassword,
  meta: { public: true }
},
{
  path: "/intro",
  component: IntroView,
  meta: { public: true }
},

{
  path: "/videos",
  component: Videos,
  meta: { public: true }
},
{
  path: "/partitions",
  component: Partitions,
  meta: { public: true }
},


{
  path: "/basstuner",
  component: BassTuner,
  meta: { public: true }
}
,

// AUTH
{
  path: "/mes-uploads",
  name: "EleveUploads",
  component: () => import("@/views/EleveUploads.vue"),
  meta: { requiresAuth: true }
},


{
  path: "/feedback",
  component: Feedback,
  meta: { requiresAuth: true }
}
,

{
  path: "/linkProf",
  name: "linkProf",
  component: () => import("@/views/LinkProf.vue"),
  meta: { requiresAuth: true }
},

{
  path: "/eleve/offres",
  component: () => import("@/views/eleve/OffresEleve.vue"),
  meta: { requiresAuth: true }
}
,
{
  path: "/dashboard",
  component: Dashboard,
  meta: { requiresAuth: true }
},
{
  path: "/mon-espace",
  component: MonEspace,
  meta: { requiresAuth: true }
},
{
  path: "/planning",
  component: Planning,
  meta: { requiresAuth: true }
},
{
  path: "/replay",
  component: Replay,
  meta: { requiresAuth: true }
},
{
  path: "/moncompte",
  component: moncompte,
  meta: { requiresAuth: true }
},
{
  path: "/onboarding",
  component: () => import("@/views/OnBoardingEleve.vue"),
  meta: {
    requiresAuth: true,
    requiresOnboarding: true
  }
}

,
{
  path: "/mes-achats",
  component: () => import("@/views/eleve/MesAchats.vue"),
  meta: { requiresAuth: true }
},
{
  path: "/stripe-success-eleve",
  component: () => import("@/components/stripe/StripeSucessEleve.vue"),
  meta: { requiresAuth: true }
},


// PROF ADMIN
{
  path: "/admin",
  name: "admin",
  component: () => import("@/views/Admin.vue"),
  meta: {
    requiresAuth: true,
    requiresPrivilege: "admin"
  }
}

,
{
  path: "/admin/InAppMessagesAdmin",
  name: "InAppMessagesAdmin",
  component: () => import("@/components/admin/InAppMessagesAdmin.vue"),
  meta: { requiresAuth: true,     requiresPrivilege: "admin",layout: "landing" }
}
,


{
  path: "/gestioneleves",
  name: "GestionEleves",
  component: () => import("@/views/GestionEleves.vue"),
  meta: { requiresAuth: true, requiresProf: true }
},
{
  path: "/FeedBackProf",
  name: "FeedBackProf",
  component: () => import("@/views/AdminFeedBack.vue"),
  meta: { requiresAuth: true, requiresProf: true }
},
{
  path: "/cours",
  name: "cours",
  component: () => import("@/views/Cours.vue"),
  meta: { requiresAuth: true, requiresProf: true }
},
{
  path: "/dashboard-prof",
  component: DashboardProf,
  meta: { requiresAuth: true, requiresProf: true }
},
{
  path: "/prof/revenus",
  component: () => import("@/views/dashboard-prof/ProfRevenus.vue"),
  meta: { requiresAuth: true, requiresProf: true }
},
{
  path: "/dashboard-prof/offres",
  component: () => import("@/views/dashboard-prof/Offres.vue"),
  meta: { requiresAuth: true, requiresProf: true }
},
{
  path: "/prof/planning/create",
  component: createplanning,
  meta: { requiresAuth: true, requiresProf: true }
},
{
  path: "/stripe-success",
  component: () => import("@/components/stripe/StripeSucess.vue"),
  meta: { requiresAuth: true, requiresProf: true }
},

{
  path: "/dashboardreports",
  component: () => import("@/views/dashboardreports.vue"),
  meta: { requiresAuth: true, requiresProf: true }
},

// 404


  ],
});


router.beforeEach((to) => {
  const store = useAuthStore()

  // ⏳ attendre que l'état soit prêt
  if (!store.authReady || (store.jwt && !store.userLoaded)) {
    return true
  }

  const isLogged = !!store.jwt
  const isProf = ["prof", "admin"].includes(store.user?.role)

  // invité
  if (!isLogged) {
    if (to.meta?.public) return true
    return { path: "/cours-de-basse-en-ligne", replace: true }
  }



  // onboarding
  const onboardingDone = store.user?.onboarding_done === true

  if (!isProf && !onboardingDone && to.path !== "/onboarding") {
    return { path: "/onboarding", replace: true }
  }

  if (isProf && to.path === "/onboarding") {
    return { path: "/dashboard-prof", replace: true }
  }

  // privilèges
  const required = to.meta?.requiresPrivilege
  if (required) {
    const privileges = store.user?.privileges || []
    const hasPrivilege = Array.isArray(required)
      ? required.some(p => privileges.includes(p))
      : privileges.includes(required)

    if (!hasPrivilege) {
      store.showUpgradeCTA({
        privilege: Array.isArray(required) ? required[0] : required
      })
      return false
    }
  }

  return true
})




























export default router;

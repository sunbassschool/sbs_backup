import { createRouter, createWebHistory } from "vue-router";
import {
  getValidToken,isJwtValid 
} from "@/utils/api.js";

// Vues
import HomeView from "@/views/HomeView.vue";
import IntroView from "@/views/IntroView.vue";
import BassTuner from "@/views/BassTuner.vue";
import Dashboard from "@/views/Dashboard.vue";
import Partitions from "@/views/Partitions.vue";
import Planning from "@/views/Planning.vue";
import Replay from "@/views/Replay.vue";
import Videos from "@/views/Videos.vue";
import Cours from "@/views/Cours.vue";
import Register from "@/views/Register.vue";
import Login from "@/views/Login.vue";
import MonEspace from "@/views/MonEspace.vue";
import RegisterForm from "@/views/RegisterForm.vue";
import Prendreuncours from "@/views/Prendreuncours.vue";
import RegisterCursus from "@/views/RegisterCursus.vue";
import CreatePlanning from "@/views/CreatePlanning.vue";
import ForgotPassword from "@/views/ForgotPassword.vue";
import ResetPassword from "@/views/resetPassword.vue";
import Metronome from "@/views/Metronome.vue";
import MesRessources from "@/views/MesRessources.vue";
import Feedback from "@/views/Feedback.vue";
import FeedBackProf from "@/views/FeedBackProf.vue";
import GestionEleves from "@/views/GestionEleves.vue";
import AdminFeedback from "@/views/AdminFeedback.vue";
import moncompte from "@/views/moncompte.vue";
import Abonnements from "@/views/Abonnements.vue";
import { useAuthStore } from "@/stores/authStore";
import { isLoggingOut } from "@/utils/api.ts";
import NotFound from "@/views/NotFound.vue";


// Base URL
const baseUrl = import.meta.env.MODE === "production" ? "/app/" : "/";

const router = createRouter({
  history: createWebHistory(baseUrl),
  routes: [
       {
  path: "/",
  name: "root-redirect",
  redirect: () => {
    const store = useAuthStore();
    return store.isLoggedIn ? { name: "dashboard" } : { name: "login" };
  }
},



    { path: "/register-cursus", name: "RegisterCursus", component: RegisterCursus, meta: { requiresAuth: true, role: "admin" } },
    { path: "/reset-password", name: "Resetpassword", component: ResetPassword },
    { path: "/MesRessources", name: "MesRessources", component: MesRessources },
    { path: "/forgot-password", name: "Forgotpassword", component: ForgotPassword },
    { path: "/Createplanning", name: "CreatePlanning", component: CreatePlanning, meta: { requiresAuth: true, role: "admin" } },
    { path: "/cours", name: "cours", component: Cours, meta: { requiresAuth: true, role: "admin" } },
    { path: "/AdminFeedback", name: "AdminFeedback", component: AdminFeedback, meta: { requiresAuth: true, role: "admin" } },

    { path: "/mon-espace", name: "mon-espace", component: MonEspace, meta: { requiresAuth: true } },
    { path: "/intro", name: "intro", component: IntroView },
    { path: "/Feedback", name: "Feedback", component: Feedback },
    { path: "/FeedBackProf", name: "FeedBackProf", component: FeedBackProf },
    { path: "/home", name: "home", component: HomeView },
    { path: "/partitions", name: "partitions", component: Partitions },
    { path: "/register", name: "register", component: Register },
    { path: "/registerform", name: "registerform", component: RegisterForm },

    { path: "/planning", name: "planning", component: Planning, meta: { requiresAuth: true } },
    { path: "/replay", name: "replay", component: Replay, meta: { requiresAuth: true } },

    { path: "/videos", name: "videos", component: Videos },

    { path: "/dashboard", name: "dashboard", component: Dashboard, meta: { requiresAuth: true, forceRefresh: true } },

    { path: "/login", name: "login", component: Login },

    { path: "/prendreuncours", name: "prendreuncours", component: Prendreuncours },

    { path: "/Metronome", name: "Metronome", component: Metronome },
    { path: "/BassTuner", name: "BassTuner", component: BassTuner },

    { path: "/GestionEleves", name: "GestionEleves", component: GestionEleves },

    { path: "/moncompte", name: "moncompte", component: moncompte, meta: { requiresAuth: true } },
    { path: "/Abonnements", name: "Abonnements", component: Abonnements },
      { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFound }, // 👈 à la fin

  ],
});

router.beforeEach(async (to) => {
  const store = useAuthStore();

  // 💡 Lance initAuth sans bloquer la navigation
  if (!store.isInitDone) {
    console.log("🚀 initAuth lancé sans blocage...");
    store.initAuth(); // 🔄 Ne pas await !
  }

  // ⛔ Blocage si logout en cours
  if (store.isLoggingOut && to.name !== "login") {
    console.warn("⛔ Navigation bloquée car logout en cours");
    return false;
  }

  const requiresAuth = !!to.meta.requiresAuth;
  const isOnLogin = to.name === "login";
  const hasJwt = store.isLoggedIn;

  // 🔁 Si connecté, empêche accès à /login
  if (isOnLogin && hasJwt) return { path: "/" };

  // 🔓 Route publique → OK
  if (!requiresAuth) return true;

  // 🔐 Route protégée → pas connecté ? → attend `isInitDone`
  if (!hasJwt && store.isInitDone) return { path: "/login" };

  // 👤 Si connecté sans user (et pas logout) → on charge
  if (!store.user && hasJwt && !store.isLoggingOut) {
    store.loadUser(); // Optionnel si déjà déclenché par initAuth
  }

  return true;
});













export default router;

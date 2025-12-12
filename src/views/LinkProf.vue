<template>
  <Layout>
    <div class="container py-5 text-center text-light">

      <!-- Loader -->
      <div v-if="loading">
        <div class="spinner-border custom-spinner"></div>
        <p class="mt-3">Connexion à ton professeur...</p>
      </div>

      <!-- Erreur -->
      <div v-else-if="error" class="alert alert-danger">
        ❌ {{ error }}
        <br><br>
        <button class="btn btn-secondary mt-2" @click="goDashboard">
          Retour au tableau de bord
        </button>
      </div>

      <!-- Succès -->
      <div v-else class="alert alert-success">
        🎉 Tu es maintenant rattaché à ton professeur !
        <br><br>
        <button class="btn btn-primary mt-2" @click="goDashboard">
          Accéder à mon espace
        </button>
      </div>

    </div>
  </Layout>
</template>

<script>
import Layout from "@/views/Layout.vue";
import { useAuthStore } from "@/stores/authStore.js";
import router from "@/router/index.ts";
import { getValidToken } from "@/utils/api.ts";

export default {
  name: "LinkProf",
  components: { Layout },

  data() {
    return {
      loading: true,
      error: null,

      routes: {
        POST: "AKfycbyWwPxBmmP2K3CkZV7Q8q_nbAVMb3sNMeTQKrB-fFaqMBV-TqhkOenmGp7Koa--t0y4lw/exec"
      }
    };
  },

  async mounted() {
    const auth = useAuthStore();

    // 1️⃣ Vérifier connexion
    if (!auth.jwt) {
      // si non connecté, redirection vers login AVEC INVITE
      const invite = this.$route.query.invite || "";
      return router.replace(`/login?invite=${invite}`);
    }

    // 2️⃣ Récupérer token ?invite=
    const invite = this.$route.query.invite;
    if (!invite) {
      this.error = "Lien d'invitation invalide.";
      this.loading = false;
      return;
    }

    try {
      const jwt = await getValidToken();
      if (!jwt) {
        this.error = "Impossible de valider ton compte.";
        this.loading = false;
        return;
      }

      // 3️⃣ Appel API
      const url = this.getProxyPostURL(this.routes.POST);
      const payload = {
        route: "linkexistingusertoprof",
        jwt,
        invite
      };

      const res = await fetch(url, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
      });

      const raw = await res.text();
      const json = JSON.parse(raw);

      if (!json.success) {
        this.error = json.message || "Erreur lors de l'association.";
      }

    } catch (err) {
      console.error("❌ link-prof error:", err);
      this.error = "Une erreur est survenue.";
    }

    this.loading = false;
  },

  methods: {
    goDashboard() {
      router.push("/dashboard");
    },

    getProxyPostURL(route) {
      const base = `https://script.google.com/macros/s/${route}`;
      return `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(base)}`;
    }
  }
};
</script>

<style scoped>
.custom-spinner {
  width: 2rem;
  height: 2rem;
}
</style>

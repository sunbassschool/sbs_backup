<template>
  <Layout>
    <div class="container py-5 text-center text-light">

      <!-- Loader -->
      <div v-if="loading">
        <div class="spinner-border custom-spinner"></div>
        <p class="mt-3">Traitement du lien d'invitation...</p>
      </div>

      <!-- Résultat -->
      <div v-else>
        <h2 class="mb-3">🔗 Test Lien Prof</h2>

        <div v-if="error" class="alert alert-danger">
          ❌ {{ error }}
        </div>

        <div v-else class="alert alert-success">
          🎉 Élève lié au prof avec succès !
          <br><br>
          <strong>Prof ID :</strong> {{ result?.prof_id }} <br>
          <strong>Email élève :</strong> {{ result?.student }}
        </div>
      </div>

    </div>
  </Layout>
</template>

<script>
import Layout from "@/views/Layout.vue";
import { useAuthStore } from "@/stores/authStore.js";
import { getValidToken } from "@/utils/api.ts";

export default {
  name: "TestLinkProf",
  components: { Layout },

  data() {
    return {
      loading: true,
      error: null,
      result: null,

      routes: {
        POST: "AKfycbyWwPxBmmP2K3CkZV7Q8q_nbAVMb3sNMeTQKrB-fFaqMBV-TqhkOenmGp7Koa--t0y4lw/exec"
      }
    };
  },

  async mounted() {
    const auth = useAuthStore();

    // 1️⃣ Vérif connexion
    if (!auth.jwt) {
      this.error = "Utilisateur non connecté.";
      this.loading = false;
      return;
    }

    // 2️⃣ Extraire token ?invite=xxxx
    const invite = this.$route.query.invite;
    if (!invite) {
      this.error = "Aucun token d'invitation fourni.";
      this.loading = false;
      return;
    }

    try {
      const jwt = await getValidToken();
      if (!jwt) {
        this.error = "Impossible de valider le JWT.";
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
        this.error = json.message || "Erreur inconnue.";
      } else {
        this.result = json;
      }

    } catch (err) {
      console.error("❌ Test link prof error:", err);
      this.error = "Erreur lors de l'appel API.";
    }

    this.loading = false;
  },

  methods: {
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

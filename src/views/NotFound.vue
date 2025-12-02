<template>
  <Layout>
    <div class="container d-flex justify-content-center align-items-center mt-5">
      <div class="card shadow p-5 text-center not-found-card">
      
        <p class="lead-text">Oups ! Cette page est introuvable.</p>
        <p class="sub-text">L'URL que vous avez saisie n'existe pas ou a été déplacée.</p>
        <router-link to="/" class="btn-auth trial-btn mt-4">
  🏠 Retour à l'accueil
</router-link>

      </div>
    </div>
  </Layout>
</template>

<script>
import Layout from "@/views/Layout.vue";

export default {
  name: "NotFound",
  components: {
    Layout,
  },
};
</script>

<style scoped>
.not-found-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  max-width: 600px;
  margin: auto;
  animation: fadeInUp 0.8s ease-in-out;
}

.big-text {
  font-size: 4rem;
  font-weight: 900;
  background: linear-gradient(135deg, #ff8c00, #ff5e00);
  -webkit-background-clip: text;
  color: transparent;
  text-shadow: 0px 4px 10px rgba(255, 92, 0, 0.5);
  animation: zoomIn 0.5s ease-in-out;
}

.lead-text {
  font-size: 1.5rem;
  font-weight: bold;
  margin-top: 10px;
}

.sub-text {
  color: #ccc;
  font-size: 1rem;
  margin-bottom: 30px;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes zoomIn {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>

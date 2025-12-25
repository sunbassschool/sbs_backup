<template>
  <Layout>
    <div class="stripe-success-eleve">

      <!-- SUCCESS -->
      <template v-if="isSuccess">
        <h2>✅ Paiement confirmé</h2>

        <p class="text">
          Ton paiement a bien été pris en compte.
        </p>

        <p class="muted">
          Tu peux maintenant accéder à tes contenus.
        </p>

        <div class="actions">
          <button class="btn" @click="goDashboard">
            Accéder à mon espace
          </button>
        </div>
      </template>

      <!-- CANCEL / ERROR -->
      <template v-else>
        <h2>❌ Paiement non finalisé</h2>

        <p class="text">
          Le paiement n’a pas été complété.
        </p>

        <p class="muted">
          Tu peux réessayer quand tu veux.
        </p>

        <div class="actions">
          <button class="btn" @click="goOffres">
            Retour aux offres
          </button>
        </div>
      </template>

    </div>
  </Layout>
</template>

<script setup>
import Layout from "@/views/Layout.vue"
import { useRoute, useRouter } from "vue-router"

const route = useRoute()
const router = useRouter()

const isSuccess = route.query.success === "1"

const goDashboard = () => {
  router.push("/dashboard")
}

const goOffres = () => {
  router.push("/eleve/offres")
}
</script>

<style scoped>
.stripe-success-eleve {
  max-width: 600px;
  margin: auto;
  padding: 40px 20px;
  text-align: center;
  color: #fff;
}

h2 {
  margin-bottom: 16px;
}

.text {
  font-size: 1.05em;
  margin-bottom: 8px;
}

.muted {
  opacity: 0.7;
  margin-bottom: 24px;
}

.actions {
  display: flex;
  justify-content: center;
}

.btn {
  background: #ffffff;
  color: #000;
  border-radius: 8px;
  padding: 10px 18px;
  font-weight: 500;
}
</style>

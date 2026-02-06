<template>
  <Layout>
    <div class="stripe-success">
      <h2>✅ Connexion Stripe enregistrée</h2>

      <p class="info">
        Ton compte Stripe est bien lié à SunBassSchool.
      </p>

      <p class="warning">
        ⏳ Stripe peut encore demander une vérification
        (pièce d’identité, IBAN, informations légales).
      </p>

      <div class="actions">
        <button class="btn" @click="checkStripe">
          Vérifier l’état de mon compte
        </button>

     <button class="btn primary" @click="goDashboard">
  Retour au dashboard
</button>

      </div>

      <p v-if="loading" class="loading">
        🔄 Vérification en cours…
      </p>

      <p v-if="ready" class="ok">
        🎉 Paiements activés ! Tu peux maintenant vendre tes cours.
      </p>

      <p v-if="pending" class="pending">
        ⏳ Configuration Stripe toujours en cours.<br />
        Clique sur <b>Continuer la configuration Stripe</b> depuis ton dashboard.
      </p>
    </div>
  </Layout>
</template>

<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/authStore.js"
import { getValidToken } from "@/utils/api.ts"
import { getProxyPostURL } from "@/config/gas"
  import Layout from "@/views/Layout.vue";
import { onMounted } from "vue"

const router = useRouter()
const auth = useAuthStore()
const proxyUrl = getProxyPostURL()

const loading = ref(false)
const ready = ref(false)
const pending = ref(false)

const checkStripe = async () => {
  loading.value = true
  ready.value = false
  pending.value = false

  try {
    const jwt = await getValidToken()

    const res = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "stripeconnectstatus",
        jwt,
        prof_id: auth.user.prof_id
      })
    }).then(r => r.json())

    if (res.stripe_ready) {
      ready.value = true
    } else {
      pending.value = true
    }

  } catch (e) {
    console.error(e)
    pending.value = true
  } finally {
    loading.value = false
  }
}

const goDashboard = () => {
  router.push("/dashboard-prof")
}

onMounted(() => {
  if (!auth.user || auth.user.role !== "prof") {
    router.replace("/login")
  }
})
</script>

<style scoped>
.stripe-success {
  max-width: 520px;
  margin: 40px auto;
  padding: 24px;
  text-align: center;
}

.info {
  margin-top: 12px;
}

.warning {
  margin-top: 12px;
  color: #e67e22;
}

.actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.loading {
  margin-top: 16px;
}

.ok {
  margin-top: 16px;
  color: #2ecc71;
}

.pending {
  margin-top: 16px;
  color: #f1c40f;
}
</style>

<template>
  <Layout>
    <div class="register-container">
      <h2 class="h2-immersive">🚀 Créer ton espace prof</h2>

      <form @submit.prevent="submitForm" class="card p-4 shadow">

        <!-- Email -->
        <div class="mb-3">
          <label class="form-label">Adresse e-mail</label>
          <input
            v-model="email"
            type="email"
            class="form-control"
            required
          />
          <small v-if="emailError" class="text-danger">{{ emailError }}</small>
        </div>

        <!-- Prénom -->
        <div class="mb-3">
          <label class="form-label">Prénom</label>
          <input
            v-model="prenom"
            type="text"
            class="form-control"
            required
          />
        </div>

        <!-- Mot de passe -->
        <div class="mb-3 password-container">
          <label class="form-label">Code d’accès</label>
          <input
            v-model="codeAcces"
            type="password"
            class="form-control"
            required
          />
        </div>

        <!-- Confirmation -->
        <div class="mb-3 password-container">
          <label class="form-label">Confirmer le code d’accès</label>
          <input
            v-model="confirmCodeAcces"
            type="password"
            class="form-control"
            required
          />
          <small v-if="confirmPasswordError" class="text-danger">
            {{ confirmPasswordError }}
          </small>
        </div>

        <!-- CGU -->
        <div class="mb-3 form-check">
          <input
            v-model="cguAccepted"
            type="checkbox"
            class="form-check-input"
            id="cgu"
            required
          />
          <label class="form-check-label" for="cgu">
            J’accepte les conditions d’utilisation
          </label>
        </div>

        <!-- Bouton -->
        <button
          type="submit"
          class="btn btn-primary w-100"
          :disabled="isLoading"
        >
          <span v-if="isLoading">
            <i class="fas fa-spinner fa-spin"></i> Création…
          </span>
          <span v-else>Créer mon compte</span>
        </button>

        <!-- Messages -->
        <div v-if="message" class="success-message mt-3">
          ✅ {{ message }}
        </div>
        <div v-if="errorMessage" class="error-message mt-3">
          ❌ {{ errorMessage }}
        </div>

        <!-- Honeypot -->
        <input v-model="botField" style="display:none" />
      </form>
    </div>
  </Layout>
</template>

<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
import Layout from "@/views/Layout.vue"
import { getProxyPostURL } from "@/config/gas";

const router = useRouter()

const email = ref("")
const prenom = ref("")
const codeAcces = ref("")
const confirmCodeAcces = ref("")
const cguAccepted = ref(false)
const botField = ref("")

const isLoading = ref(false)
const message = ref("")
const errorMessage = ref("")
const emailError = ref("")
const confirmPasswordError = ref("")
const validateEmail = () => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  emailError.value = regex.test(email.value) ? "" : "Adresse e-mail invalide"
}

const submitForm = async () => {
  if (botField.value) return

  errorMessage.value = ""
  message.value = ""

  validateEmail()
  if (emailError.value) return

  if (codeAcces.value !== confirmCodeAcces.value) {
    confirmPasswordError.value = "Les mots de passe ne correspondent pas."
    return
  } else {
    confirmPasswordError.value = ""
  }

  if (!cguAccepted.value) {
    errorMessage.value = "Merci d’accepter les conditions."
    return
  }

  isLoading.value = true

  try {
    const response = await fetch(getProxyPostURL(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "registerprof",
        email: email.value,
        prenom: prenom.value,
        codeAcces: codeAcces.value
      })
    })

    const result = await response.json()
    console.log("📦 registerProf =", result)

    if (!result.success) {
      errorMessage.value = result.message || "Erreur serveur"
      return
    }

    message.value = "Compte professeur créé avec succès"

    setTimeout(() => {
      router.push("/login")
    }, 1000)

  } catch (e) {
    console.error(e)
    errorMessage.value = "Impossible de contacter le serveur"
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.register-container {
  max-width: 520px;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
}

.card {
  background: rgba(255,255,255,0.08);
  border-radius: 14px;
  color: white;
}

.form-label {
  color: white;
  font-weight: bold;
}

input {
  text-align: center;
}

.success-message {
  background: #28a745;
  color: white;
  padding: 10px;
  border-radius: 8px;
}

.error-message {
  background: #dc3545;
  color: white;
  padding: 10px;
  border-radius: 8px;
}

.btn-primary {
  background: #ff3300;
  border: none;
}
</style>

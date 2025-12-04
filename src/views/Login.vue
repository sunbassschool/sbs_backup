<template>
  <Layout>
    <div v-if="!authCheckInProgress" class="container d-flex justify-content-center align-items-center mt-5">
      <div class="row justify-content-center w-200">
        <div class="w-100 mx-auto">
          <div class="card shadow">
            <Form @submit="onSubmit" :validation-schema="schema" :initial-values="initialValues">
              <div class="mb-3">
                <label for="email" class="form-label">Adresse e-mail</label>
                <Field name="email" type="email" id="email" class="form-control" />
                <ErrorMessage name="email" class="text-danger small"/>
              </div>

              <div class="mb-3">
                <label for="password" class="form-label">Mot de passe</label>
                <Field name="password" type="password" id="password" class="form-control" />
                <ErrorMessage name="password" class="text-danger small"/>
              </div>

              <!-- Honeypot -->
              <Field name="botField" type="hidden" />

              <button type="submit" class="btn btn-primary" :disabled="loading">
                <span v-if="!loading">Se connecter</span>
                <span v-else>Connexion en cours… <span class="spinner" /></span>
              </button>

              <div class="login-links mt-3">
                <router-link to="/forgot-password" class="login-link">Mot de passe oublié ?</router-link>
                <span class="separator">|</span>
                <router-link to="/registerform" class="login-link">S’inscrire</router-link>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/authStore.ts'
import { jwtDecode } from 'jwt-decode'
import Layout from '@/views/Layout.vue'
import {
  verifyIndexedDBSetup,
  checkAndRestoreTokens,
  restoreUserInfo,
  isJwtExpired,
  refreshToken
} from '@/utils/api.ts'
import { saveSessionData } from '@/utils/AuthDBManager'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const toast = useToast()
const router = useRouter()

const loading = ref(false)
const postLoginLoading = ref(false)

const auth = useAuthStore()

const initialValues = {
  email: localStorage.getItem("email") || sessionStorage.getItem("email") || "",
  password: "",
  botField: ""
}

const schema = yup.object({
  email: yup.string().required("L’e-mail est requis").email("Format invalide"),
  password: yup.string().required("Mot de passe requis").min(4, "Min 4 caractères"),
  botField: yup.string().max(0)
})

onMounted(() => {
  (async () => {
    try {
      await verifyIndexedDBSetup()
      await checkAndRestoreTokens()
      await restoreUserInfo()

      let jwt = localStorage.getItem("jwt") || sessionStorage.getItem("jwt")
      if (jwt && !isJwtExpired(jwt)) {
        router.replace("/dashboard")
        return
      }

      const refreshTokenExists = localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken")
      if (refreshTokenExists && (!jwt || isJwtExpired(jwt))) {
        const newJwt = await refreshToken()
        if (newJwt) {
          router.replace("/dashboard")
          return
        }
      }
    } catch (e) {
      console.warn("Session restore error:", e)
    }
  })()
})

async function sha256(text) {
  const buffer = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest("SHA-256", buffer)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function onSubmit(values) {
  if (values.botField) {
    toast.error("Erreur : bot détecté.")
    return
  }

  loading.value = true
  try {
    const hashedPassword = await sha256(values.password)
    const deviceInfo = `${navigator.platform} - ${navigator.userAgent}`
    const apiURL = "https://cors-proxy-sbs.vercel.app/api/proxy?url=https://script.google.com/macros/s/AKfycbw7aU_Z20EZKV8AytvPPYMhTLxtQNegdpg5ImFeiGqY35jKfRB0gk3pIhXTOFS7NaCTZA/exec"

    const response = await fetch(apiURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": window.location.origin
      },
      body: JSON.stringify({
        route: "login",
        email: values.email,
        password: hashedPassword,
        deviceInfo
      })
    })

    const data = await response.json()
    if (!data.jwt) throw new Error(data?.message || "Échec de connexion")



   await auth.setSessionData({
  jwt: data.jwt,
  refreshToken: data.refreshToken,
  sessionId: data.sessionId,
  userData: {
    prenom: jwtDecode(data.jwt)?.prenom || '',
    email: jwtDecode(data.jwt)?.email || ''
  }
})


router.replace("/dashboard") // Redirection immédiate

// 🔁 Lancement du chargement utilisateur en arrière-plan (non bloquant)
auth.loadUser().catch(err => {
  console.warn("⚠️ Chargement utilisateur en échec après login :", err)
})

  } catch (error) {
    toast.error(error.message || "Erreur serveur.")
    const card = document.querySelector('.card')
    if (card) {
      card.classList.add('shake')
      setTimeout(() => card.classList.remove('shake'), 500)
    }
  } finally {
    loading.value = false
  }
}
</script>






<style scoped>
/* Shake animation */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
}

.shake {
  animation: shake 0.5s ease-in-out;
}

/* Style pour les erreurs de champ */
.text-danger {
  font-size: 0.78rem;
  color: #ff4d4d;
  margin-top: 4px;
  text-align: center;
}

.go-text {
  font-size: 0.78rem;
  font-weight: 500;
  line-height: 1.1;

}


input.form-control {
  height: 32px;
  padding: 4px 10px;
  font-size: 0.85rem;
  border-radius: 4px;
    max-width: 180px; /* limite large si besoin */

  border: 1px solid rgba(200, 200, 200, 0.5);
  background: rgba(255, 255, 255, 0.95);
  text-align: center; /* ou center si tu préfères */
  transition: all 0.2s ease-in-out;
}

input.form-control:focus {
  border-color: #ff8c00;
  box-shadow: none;
  animation: glow 1s infinite alternate;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.success-feedback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.checkmark-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: inline-block;
  border: 4px solid #4caf50;
  position: relative;
  animation: pop 0.3s ease-in-out;
}

.checkmark {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 40px;
  border-right: 4px solid #4caf50;
  border-bottom: 4px solid #4caf50;
  transform: translate(-50%, -50%) rotate(45deg);
  animation: draw 0.5s ease-in-out forwards;
}


@keyframes draw {
  0% {
    height: 0;
    width: 0;
  }
  100% {
    height: 25px;
    width: 12px;
  }
}

@keyframes pop {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.container
{text-align:center;}
.h2-immersive {
  font-weight: bold;
    animation: fadeIn 1.2s ease-in-out;
   /* Empêche le retour à la ligne */
  text-transform: uppercase; /* Force les majuscules */
  white-space: nowrap; /* Empêche le retour à la ligne */

  text-align: center;
  font-size: 1rem;
  background: linear-gradient(135deg,rgb(255, 255, 255),rgb(172, 172, 172));
  -webkit-background-clip: text;
  color: transparent; /* Texte en dégradé */
  text-shadow: 0px 4px 10px rgba(126, 126, 126, 0.5);
  padding: 10px;
  border-radius: 8px;
  display: inline-block;
  transition: transform 0.2s ease-in-out;
}
@media (max-width: 576px) { /* Ajuste sur mobiles */
  .h2-immersive {
    font-size: 1.5rem;
  }
}

@keyframes fadeIn {
  0% { opacity: 0; transform: translateY(-20px); }
  100% { opacity: 1; transform: translateY(0); }
}

.h2-immersive:hover {
  transform: scale(1.05); /* Effet zoom léger */
}

.container {
  max-width: 90% !important; /* S'étend à 90% de l’écran */
  width: 100%;
}

.loading-container {
  width: 100%;
  height: 6px;
  background-color: rgb(0, 0, 0);
  border-radius: 3px;
  border: 2px solid #1b1b1b; /* Couleur du contour */
  overflow: hidden;
  position: relative;
}

.loading-bar {
  height: 100%;
  background: linear-gradient(90deg, #ff5100, #ff5e00);
  transition: width 0.4s ease-in-out;
  border-radius: 3px;
  position: relative;
}

.loading-bar::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 15%;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
  filter: blur(3px);
  opacity: 0.8;
  animation: shine 1.5s ease-in-out;
}

@keyframes shine {
  0% {
    left: -15%;
  }
  100% {
    left: 100%;
  }
}



.card {
  border-radius: 12px;
  max-width: 150%;
  width: 100%;
  background: rgba(255, 255, 255, 0.1); /* Légère transparence */
  backdrop-filter: blur(10px); /* Effet de flou pour un look moderne */
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  padding:35px;
  color: #fff;
}

.card h2 {
  font-weight: bold;
  color: #fff; /* Blanc pour fond sombre */
  text-align: center;
}

input {
  border-radius: 0px; /* Suppression des angles arrondis */
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  color: black;
  border: 1px solid rgba(200, 200, 200, 0.5); /* Bordure plus discrète */
  padding: 8px; /* Réduction de l’espace interne */
  font-size: 0.9rem; /* Réduction de la taille du texte */
  height: 36px; /* Hauteur plus compacte */
}

input:focus {
  border-color: #ff8c00;
  box-shadow: none; /* Supprime l’effet de focus flou */
}

.form-label {
   text-align: center;
  display: block;
  width: 100%;
  font-weight: bold;
  color: #fff;
}

/**bouton go */

.btn-primary {
  background: #a12000 !important;
  border: none;
  padding: 4px 10px;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  border-radius: 6px;
  color: #fff;
  letter-spacing: 0.4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  width: fit-content;
  margin: 0 auto;
}

.btn-primary:hover {
  background: #ff3300 !important;
}

.btn-primary:active {
  background: #741700 !important;
  transform: scale(0.98);
}







.forgot-password-link {
  color: #ff8c00;
  font-weight: bold;
  text-decoration: none;
}

.forgot-password-link:hover {
  text-decoration: underline;
}

/* Effet focus animé */
@keyframes glow {
  0% { box-shadow: 0 0 5px rgba(255, 140, 0, 0.5); }
  50% { box-shadow: 0 0 20px rgba(255, 140, 0, 0.8); }
  100% { box-shadow: 0 0 5px rgba(255, 140, 0, 0.5); }
}

input:focus {
  animation: glow 1s infinite alternate;
}

/* Ajustement global */
.container {
  margin-top: 50px;
}

/* Empêcher Chrome de stocker les mots de passe */
input:-webkit-autofill {
  background-color: transparent !important;
}
.btn-auth.trial-btn {
  display: inline-block;
  background: linear-gradient(135deg, #ff5e00, #ff8c00);
  color: #fff !important;
  font-weight: bold;
  padding: 8px 14px;
  border-radius: 4px;
  font-size: 0.85rem;
  text-transform: uppercase;
  text-decoration: none;
  box-shadow: 0 0 8px rgba(255, 100, 0, 0.3);
  transition: all 0.3s ease;
  line-height: 1.2;
  height: 34px;
}

.btn-auth.trial-btn:hover {
  background: linear-gradient(135deg, #ff8c00, #ff5e00);
  box-shadow: 0 0 12px rgba(255, 100, 0, 0.5);
  transform: scale(1.05);
}


.btn-auth.trial-btn:hover {
  background: linear-gradient(135deg, #ff8c00, #ff5e00);
  box-shadow: 0 0 18px rgba(255, 100, 0, 0.6);
  transform: scale(1.07);
}

.shake {
  animation: shake 0.4s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  50% { transform: translateX(6px); }
  75% { transform: translateX(-4px); }
}
/* ✅ Responsive layout amélioré */
@media (max-width: 768px) {
  .container {
    margin-top: 30px;
  }

  .card {
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    max-width: 95vw; /* Limite la largeur */
  }

  input {
    font-size: 1rem;
    height: 42px;
  }

  .btn-primary {
    font-size: 1rem;
    padding: 12px;
  }

  .h2-immersive {
    font-size: 1.3rem;
  }

  .btn-auth.trial-btn {
    font-size: 0.9rem;
    padding: 10px 18px;
  }

  .form-label {
    font-size: 0.95rem;
     text-align: center;
  display: block;
  width: 100%;
  }
}

.mb-3 {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  width: 100%;
}

.mb-3 .form-label {
 text-align: center;
  display: block;
  width: 100%;
}

.card .mb-3 input.form-control {
  width: 80% !important;
  max-width: 280px;
  margin: 0 auto;
}



/* ✅ Pour très petits écrans */
@media (min-width: 481px) {
  .mb-3 {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: nowrap;
  }

  .mb-3 .form-label {
    flex: 0 0 120px;
    white-space: nowrap;
    margin: 0;
  }

  .mb-3 input {
    flex: 1 1 0;
    min-width: 0;
  }
}
.login-links {
  text-align: center;
  margin-top: 20px;
  font-size: 0.85rem;
  color: #ccc;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
    white-space: nowrap; /* Empêche le ? de passer à la ligne */

}

.login-link {
  color: #b92f1d;
  font-weight: bold;
  text-decoration: none;
  transition: color 0.3s ease;
}

.login-link:hover {
  color: #ff4e00;
  text-decoration: underline;
}

.separator {
  color: #999;
}
.text-center {
  margin-top: -28px !important; /* ou 4px si trop serré */
}
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 8px;
  display: inline-block;
  vertical-align: middle;
  margin-top:10px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

</style>

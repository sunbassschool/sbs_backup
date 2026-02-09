<template>
  <Layout>

    <!-- 🟡 SUCCESS -->
    <div v-if="loginSuccess" class="login-status-box">
      <div class="login-status-title">Connexion réussie</div>
<div class="login-status-text">{{ statusText }}</div>
      <span class="login-status-spinner"></span>
    </div>

    <!-- 🟠 PROCESSING -->
    <div v-else-if="loginProcessing" class="login-status-box">
      <div class="login-status-title">Connexion</div>
<div class="login-status-text">{{ statusText }}</div>
      <span class="login-status-spinner"></span>
    </div>

    <!-- 🟢 FORM -->
    <div v-else class="container d-flex justify-content-center align-items-center mt-5">
      <div class="row justify-content-center w-200">
        <div class="w-100 mx-auto">
          <div class="card shadow">

            <Form
              @submit="onSubmit"
              :validation-schema="schema"
              :initial-values="initialValues"
            >

              <div class="mb-3">
                <label for="email" class="form-label">Adresse e-mail</label>
                <Field
                  name="email"
                  id="email"
                  type="email"
                  class="form-control"
                  autocomplete="username"
                />
                <ErrorMessage name="email" class="text-danger small" />
              </div>

              <div class="mb-3">
                <label for="password" class="form-label">Mot de passe</label>
                <Field
                  name="password"
                  id="password"
                  type="password"
                  class="form-control"
                  autocomplete="current-password"
                />
                <ErrorMessage name="password" class="text-danger small" />
              </div>

              <Field name="botField" type="hidden" />

              <button type="submit" class="btn btn-primary" :disabled="loading">
                <span v-if="!loading">Se connecter</span>
                <span v-else>
                  Connexion en cours…
                  <span class="spinner" />
                </span>
              </button>

              <div class="login-links mt-3">
                <router-link to="/forgot-password" class="login-link">
                  Mot de passe oublié ?
                </router-link>
                <span class="separator">|</span>
                <router-link to="/register" class="login-link">
                  S’inscrire
                </router-link>
              </div>

            </Form>

          </div>
        </div>
      </div>
    </div>

  </Layout>
</template>


<script setup>
import { nextTick, ref } from "vue"
import { Form, Field, ErrorMessage } from "vee-validate"

import { getDeviceId } from "@/utils/device.ts"
import { getProxyPostURL,gasPost } from "@/config/gas.ts"
import * as yup from 'yup'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/authStore.js'
import { jwtDecode } from 'jwt-decode'
import Layout from '@/views/Layout.vue'
import { useRouter } from 'vue-router'




const loginSuccess = ref(false)
const loginProcessing = ref(false)

const toast = useToast()
const router = useRouter()
const deviceId = getDeviceId()
console.log("📱 deviceId envoyé au backend :", deviceId)

const statusText = ref("")

const loading = ref(false)

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



async function sha256(text) {
  const buffer = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest("SHA-256", buffer)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function loginApi({ email, hashedPassword, deviceId }) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(getProxyPostURL(), {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "login",
        email,
        password: hashedPassword,
        device_id: deviceId,
        device_info: navigator.userAgent
      })
    })

    if (!res.ok) throw new Error("Erreur serveur")

    let data
    try {
      data = await res.json()
    } catch {
      throw new Error("Réponse invalide")
    }

    if (!data.jwt) throw new Error(data.message || "Login échoué")

    return data
  } finally {
    clearTimeout(timeout)
  }
}

async function onSubmit(values) {
  const T0 = performance.now()
  console.group("🚀 [LOGIN FLOW]")
  console.time("⏱️ LOGIN TOTAL")

  auth.isLoggingIn = true
  loginProcessing.value = true
  loading.value = true
  statusText.value = "Vérification des identifiants…"
  await nextTick()

  try {
    // 🛑 bot
    if (values.botField) throw new Error("Bot détecté")

    // 🔐 hash
    console.time("LOGIN sha256")
    const hashedPassword = await sha256(values.password)
    console.timeEnd("LOGIN sha256")

    // 🌐 login API
    statusText.value = "Connexion sécurisée…"
    console.time("LOGIN loginApi")
    const data = await loginApi({
      email: values.email,
      hashedPassword,
      deviceId
    })
    console.timeEnd("LOGIN loginApi")

  

    // ✅ feedback succès
    loginProcessing.value = false
    loginSuccess.value = true
    statusText.value = "Connexion réussie"
    const successShownAt = performance.now()

    // 🧾 JWT
    console.time("LOGIN jwtDecode")
    const payload = jwtDecode(data.jwt)
    console.timeEnd("LOGIN jwtDecode")
    console.log("🧾 JWT payload", payload)

    // 💾 cache léger
    console.time("LOGIN localStorage")
    localStorage.setItem("email", payload.email || "")
    localStorage.setItem("prenom", payload.prenom || "")
    console.timeEnd("LOGIN localStorage")

    // 🧠 session
    console.time("LOGIN setSessionData")
    auth.setSessionData({
      jwt: data.jwt,
      refreshToken: data.refreshToken,
      sessionId: data.sessionId,
      userData: data.user
    })
    console.timeEnd("LOGIN setSessionData")

    auth.isLoggingOut = false
    auth.refreshFailed = false
    sessionStorage.removeItem("AUTH_ABORTED")
    localStorage.removeItem("session_expired")

    // ⏳ HYDRATATION (POINT CLÉ)
    console.time("LOGIN fetchUserData")
    await auth.fetchUserData()
    console.timeEnd("LOGIN fetchUserData")

    console.log("🧠 user hydrated", {
      role: auth.user?.role,
      onboarding: auth.user?.onboarding_done
    })

    // ✅ TRIGGER ROUTING
const role = auth.user?.role
const isProf = ["prof", "admin"].includes(role)
const onboardingDone = auth.user?.onboarding_done === true

if (isProf) {
  router.replace("/dashboard-prof")
} else {
  router.replace(onboardingDone ? "/dashboard" : "/onboarding")
}
    // ⏱️ UX min
    const MIN_SUCCESS_MS = 400
    const elapsed = performance.now() - successShownAt
    if (elapsed < MIN_SUCCESS_MS) {
      await new Promise(r => setTimeout(r, MIN_SUCCESS_MS - elapsed))
    }

    // ❌ PAS DE ROUTER ICI
    // → le beforeEach / RootLoader décide

  } catch (err) {
    console.error("❌ [LOGIN ERROR]", err)
    loginProcessing.value = false
    loginSuccess.value = false
    statusText.value = ""
    toast.error(err.message || "Erreur serveur")
  } finally {
    loading.value = false
    auth.isLoggingIn = false
    console.timeEnd("⏱️ LOGIN TOTAL")
    console.log("🏁 LOGIN END", Math.round(performance.now() - T0), "ms")
    console.groupEnd()
  }
}









</script>






<style scoped>
/* =====================================================
   SBS – Login (même vibe que RegisterChoice cards)
   ===================================================== */

/* PAGE WRAP (remplace le gros Bootstrap mt-5 etc) */
.container {
  max-width: 520px !important;
  width: 100%;
  margin: 0 auto !important;
  padding: 32px 14px 44px;
  text-align: center;
}

/* BOX STATUS (success/processing) = même carte */
.login-status-box {
  max-width: 520px;
  margin: 80px auto 0;
  padding: 22px 18px;
  border-radius: 16px;

  background: linear-gradient(
    180deg,
    rgba(255,255,255,0.07),
    rgba(255,255,255,0.015)
  );
  border: 1px solid rgba(255,255,255,0.10);
  backdrop-filter: blur(10px);
  color: #fff;

  box-shadow: 0 14px 36px rgba(0,0,0,0.6);
    /* ✅ CENTRAGE */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.login-status-title {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: .35px;
  margin-bottom: 6px;
}

.login-status-text {
  font-size: .85rem;
  color: rgba(255,255,255,0.65);
}

.login-status-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.25);
  border-top-color: rgba(255,160,60,0.95);
  border-radius: 50%;
  display: inline-block;
  margin-top: 12px;
  animation: spin .6s linear infinite;
}

/* CARD FORM */
.card {
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  margin: 0 auto;

  padding: 22px 18px;

  background: linear-gradient(
    180deg,
    rgba(255,255,255,0.07),
    rgba(255,255,255,0.015)
  );
  border: 1px solid rgba(255,255,255,0.10);
  backdrop-filter: blur(10px);
  color: #fff;

  box-shadow: 0 14px 36px rgba(0,0,0,0.6);

  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 44px rgba(0,0,0,0.65);
}

/* FORM LAYOUT */
.mb-3 {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  width: 100%;
  margin-bottom: 16px !important;
}

.form-label {
  display: block;
  width: 100%;
  text-align: center;
  font-weight: 700;
  font-size: .82rem;
  letter-spacing: .2px;
  color: rgba(255,255,255,0.9);
}

/* INPUTS = sobres + premium */
input.form-control {
  width: 100%;
  max-width: 320px;
  margin: 0 auto;

  height: 40px;
  padding: 8px 12px;
  border-radius: 10px;

  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  color: #fff;

  text-align: center;

  outline: none;
  transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
}

input.form-control::placeholder {
  color: rgba(255,255,255,0.45);
}

input.form-control:focus {
  border-color: rgba(255,160,60,0.9);
  box-shadow: 0 0 0 2px rgba(255,160,60,0.16);
  background: rgba(255,255,255,0.075);
}

/* Erreurs */
.text-danger {
  font-size: .78rem;
  color: #ff5a5a;
  margin-top: 2px;
  text-align: center;
}

/* BOUTON = CTA premium (proche des cards) */
.btn.btn-primary {
  border: 0;
  border-radius: 12px;

  padding: 10px 14px;
  font-size: .82rem;
  font-weight: 800;
  letter-spacing: .35px;
  text-transform: uppercase;

  color: #fff;
  background: linear-gradient(135deg, #a12000, #ff4e00);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  box-shadow: 0 10px 26px rgba(0,0,0,0.45);
  transition: transform .15s ease, filter .15s ease, box-shadow .15s ease;
  margin: 6px auto 0;
}

.btn.btn-primary:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
  box-shadow: 0 14px 32px rgba(0,0,0,0.55);
}

.btn.btn-primary:active {
  transform: scale(.985);
}

.btn.btn-primary:disabled {
  opacity: .65;
  cursor: not-allowed;
  transform: none;
}

/* spinner inline */
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

/* LINKS */
.login-links {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  white-space: nowrap;

  font-size: .85rem;
  color: rgba(255,255,255,0.6);
}

.login-link {
  color: rgba(255,160,60,0.95);
  font-weight: 800;
  text-decoration: none;
  transition: opacity .15s ease, transform .15s ease;
}

.login-link:hover {
  opacity: 1;
  transform: translateY(-1px);
  text-decoration: underline;
}

.separator {
  color: rgba(255,255,255,0.25);
}

/* Autofill (dark) */
input:-webkit-autofill {
  -webkit-text-fill-color: #fff !important;
  box-shadow: 0 0 0 1000px rgba(20,20,20,0.8) inset !important;
  border: 1px solid rgba(255,255,255,0.12) !important;
}

/* responsive: aligne label / input en ligne sur écran large */
@media (min-width: 520px) {
  .mb-3 {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .mb-3 .form-label {
    flex: 0 0 140px;
    margin: 0;
    white-space: nowrap;
    text-align: left;
    color: rgba(255,255,255,0.85);
  }

  .mb-3 input.form-control {
    flex: 1 1 auto;
    max-width: 320px;
    margin: 0;
    text-align: left;
  }
}

/* petits écrans */
@media (max-width: 360px) {
  .login-links {
    font-size: .8rem;
    gap: 8px;
  }
}

@keyframes spin { to { transform: rotate(360deg); } }

/* optionnel: shake si tu l'utilises déjà */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
.shake { animation: shake .45s ease-in-out; }



</style>

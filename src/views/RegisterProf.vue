<template>
  <Layout>
    <div class="register-container">
      <h2 class="h2-immersive">Créer ton espace prof</h2>

      <!-- Progress -->
      <div class="progress-container">
        <div class="progress-bar" :style="{ width: progress }"></div>
      </div>
<div class="form-shell">

<form
  class="card"
  @submit.prevent="submitForm"
  :aria-busy="isLoading"
>


        <!-- STEP 1 -->
        <transition name="fade">
          <div v-if="step === 1">
            <label>Email</label>
            <input ref="emailInput" v-model.trim="email" type="email" required />

            <label>Prénom</label>
            <input v-model.trim="prenom" type="text" required />

            <button class="btn-primary" @click.prevent="nextStep">
              Continuer
            </button>
          </div>
        </transition>

        <!-- STEP 2 -->
        <transition name="fade">
          <div v-if="step === 2">
            <label>Code d’accès</label>
            <div class="password-wrapper">
              <input
                ref="passwordInput"
                :type="showPassword ? 'text' : 'password'"
                v-model="codeAcces"
                required
              />
              <span @click="showPassword = !showPassword">👁</span>
            </div>

            <label>Confirmation</label>
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="confirmCodeAcces"
              required
            />

           <button
  type="button"
  class="btn-back"
  @click="step--"
>
  Retour
</button>

            <button class="btn-primary" @click.prevent="nextStep">
              Continuer
            </button>
          </div>
        </transition>

        <!-- STEP 3 -->
        <transition name="fade">
        <div v-if="step === 3">
  <div class="cgu">
    <input
      id="cgu"
      type="checkbox"
      v-model="cguAccepted"
    />
    <label for="cgu">J’accepte les CGU</label>
  </div>

  <button
    type="button"
    class="btn-back"
    @click="step--"
  >
    Retour
  </button>

  <button
    class="btn-primary"
    type="submit"
    :disabled="isLoading"
  >
    {{ isLoading ? "Création..." : "Créer mon compte" }}
  </button>
</div>

        </transition>

        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="success">{{ successMessage }}</p>

      </form></div>
    </div>
  </Layout>
</template>


<script setup>
import { ref, computed, nextTick, watch  } from "vue"
import { useRouter } from "vue-router"
import Layout from "@/views/Layout.vue"
import { getProxyPostURL } from "@/config/gas.ts"

const router = useRouter()
const emailInput = ref(null)
const passwordInput = ref(null)
// ─── STATE (TOUJOURS EN PREMIER) ───
const step = ref(1)

const email = ref("")
const prenom = ref("")
const codeAcces = ref("")
const confirmCodeAcces = ref("")
const cguAccepted = ref(false)

const showPassword = ref(false)
const isLoading = ref(false)

const errorMessage = ref("")
const successMessage = ref("")

// ─── COMPUTED ───
const progress = computed(() => `${step.value * 33}%`)

// ─── METHODS ───
const nextStep = () => {
  errorMessage.value = ""

  if (step.value === 1) {
    if (!email.value || !prenom.value) {
      errorMessage.value = "Champs requis manquants"
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      errorMessage.value = "Email invalide"
      return
    }
  }

  if (step.value === 2) {
    if (codeAcces.value !== confirmCodeAcces.value) {
      errorMessage.value = "Les codes ne correspondent pas"
      return
    }
  }

  step.value++
}

const submitForm = async () => {
  if (!cguAccepted.value) {
    errorMessage.value = "Merci d’accepter les conditions"
    return
  }

  isLoading.value = true
  errorMessage.value = ""

  try {
    const res = await fetch(getProxyPostURL(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "registerprof",
        email: email.value.trim(),
        prenom: prenom.value.trim(),
        codeAcces: codeAcces.value
      })
    })

    const raw = await res.text()
    if (!raw.startsWith("{")) throw new Error("GAS crash")

    const json = JSON.parse(raw)
    if (!json.success) {
      errorMessage.value = json.message || "Erreur serveur"
      return
    }

    successMessage.value = "Compte créé avec succès"
    setTimeout(() => router.push("/login"), 1000)

  } catch (e) {
    console.error(e)
    errorMessage.value = "Impossible de contacter le serveur"
  } finally {
    isLoading.value = false
  }
}

watch(step, async (newStep) => {
  await nextTick()

  if (newStep === 1 && emailInput.value) {
    emailInput.value.focus()
  }

  if (newStep === 2 && passwordInput.value) {
    passwordInput.value.focus()
  }
})
</script>


<style>

  /* ======================================================
   NAVIGATION / BOUTON RETOUR
   ====================================================== */

/* Flèche auto avant le texte */
.btn-back::before {
  content: "← ";
}

.btn-back {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.75);
  font-size: 0.9rem;
  padding: 6px 0;
  margin-bottom: 10px;
  cursor: pointer;
  text-align: left;
}

.btn-back:hover {
  color: #ff3300;
  text-decoration: underline;
}


/* ======================================================
   CONTAINER GLOBAL
   ====================================================== */

.register-container {
  max-width: 520px;
  margin: auto;
  padding: 20px;
  text-align: center; /* base centrée */
}

/* Titre immersif */
.h2-immersive {
  font-weight: 800;
  text-transform: uppercase;
  background: linear-gradient(135deg,#fff,#aaa);
  -webkit-background-clip: text;
  color: transparent;
}


/* ======================================================
   SHELL PREMIUM (fond + liseré)
   ====================================================== */

.form-shell {
  max-width: 420px;
  margin: 30px auto 0;
  padding: 2px;              /* liseré */
  border-radius: 16px;
  background: linear-gradient(
    145deg,
    rgba(255,255,255,0.25),
    rgba(255,255,255,0.05)
  );

  /* 🔴 Glow SBS léger */
  box-shadow:
    0 0 0 1px rgba(255,51,0,0.15),
    0 0 18px rgba(255,51,0,0.25);
}

.form-shell:hover {
  box-shadow:
    0 0 0 1px rgba(255,51,0,0.25),
    0 0 26px rgba(255,51,0,0.35);
  transition: box-shadow .25s ease;
}


/* ======================================================
   CARTE FORMULAIRE (fond noir premium)
   ====================================================== */

.form-shell .card {
  margin: 0;
  padding: 32px 28px;
  border-radius: 14px;
  background: linear-gradient(
    180deg,
    rgba(20,20,20,0.95),
    rgba(10,10,10,0.95)
  );
  border: 1px solid rgba(255,255,255,0.08);
  color: white;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.05),
    0 20px 40px rgba(0,0,0,0.6);
}


/* ======================================================
   STRUCTURE DU FORMULAIRE
   ====================================================== */

form.card {
  display: flex;
  flex-direction: column;
  align-items: center; /* centre tous les champs */
}

/* Largeur uniforme des éléments */
form.card label,
form.card input,
form.card .password-wrapper,
form.card button {
  width: 100%;
  max-width: 360px;
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}


/* ======================================================
   LABELS & INPUTS
   ====================================================== */

label {
  margin: 12px 0 4px;
}

/* Inputs texte uniquement (checkbox exclue) */
input:not([type="checkbox"]):not([type="radio"]) {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: none;
  text-align: center;
}

/* Focus SBS */
input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(255,51,0,.35);
}


/* ======================================================
   PASSWORD
   ====================================================== */

.password-wrapper {
  position: relative;
}

.password-wrapper span {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  opacity: .7;
}

.password-wrapper span:hover {
  opacity: 1;
}


/* ======================================================
   PROGRESS BAR
   ====================================================== */

.progress-container {
  height: 6px;
  background: #444;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: #ff3300;
  transition: width .4s cubic-bezier(.4,0,.2,1);
}


/* ======================================================
   BOUTONS
   ====================================================== */

.btn-primary {
  margin-top: 15px;
  width: 100%;
  background: #ff3300;
  color: white;
  padding: 12px;
  border-radius: 8px;
  border: none;
}

.btn-primary:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.btn-secondary {
  margin-top: 10px;
  background: transparent;
  border: 1px solid #aaa;
  color: white;
  padding: 10px;
  border-radius: 8px;
}


/* ======================================================
   CGU
   ====================================================== */

.cgu {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 18px 0 12px;
}

.cgu input[type="checkbox"] {
  width: auto;
  padding: 0;
  margin: 0;
}

.cgu label {
  margin: 0;
  font-size: .85rem;
  color: rgba(255,255,255,.85);
  cursor: pointer;
}


/* ======================================================
   FEEDBACKS
   ====================================================== */

.error {
  color:#ff4d4d;
  margin-top:10px;
  text-align: center;
  animation: shake .25s ease;
}

.success {
  color:#2ecc71;
  margin-top:10px;
}


/* Animation erreur */
@keyframes shake {
  0% { transform: translateX(0) }
  25% { transform: translateX(-4px) }
  50% { transform: translateX(4px) }
  75% { transform: translateX(-2px) }
  100% { transform: translateX(0) }
}


/* ======================================================
   TRANSITIONS
   ====================================================== */

.fade-enter-active {
  transition: all .3s ease;
}

.fade-enter-from {
  opacity:0;
  transform: translateY(10px);
}


/* ======================================================
   MOBILE
   ====================================================== */

@media (max-width: 480px) {
  .form-shell {
    margin-top: 16px;
  }
}

/* ======================================================
   LOADING BAR (submit)
   ====================================================== */



.loading-bar {
  height: 4px;
  width: 100%;
  margin-bottom: 14px;

  background: linear-gradient(
    90deg,
    transparent,
    #ff3300,
    transparent
  );
  background-size: 200% 100%;
  animation: loadingMove 1.1s linear infinite;
  border-radius: 2px;
}


.form-shell {
  position: relative; /* OBLIGATOIRE */
}


@keyframes loadingMove {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: 200px 0;
  }
}
form.card[aria-busy="true"] {
  pointer-events: none;
  opacity: .9;
}
/* ======================================================
   LOADING BAR – SAFE MODE (pseudo-element)
   ====================================================== */

form.card {
  position: relative;
  overflow: hidden;
}

/* Barre visible UNIQUEMENT pendant loading */
form.card[aria-busy="true"]::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;

  height: 4px;
  width: 100%;

  background: linear-gradient(
    90deg,
    transparent,
    #ff3300,
    transparent
  );
  background-size: 200% 100%;
  animation: loadingMove 1s linear infinite;

  z-index: 10;
}


</style>
<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/authStore.js"
import { gasPost } from "@/config/gas"
import MarketingHeader from "@/components/MarketingHeader.vue"

const router = useRouter()
const auth = useAuthStore()

const password = ref("")
const loading = ref(false)
const error = ref<string | null>(null)
const prenom = ref("")

const submit = async () => {
  error.value = null

  if (prenom.value.trim().length < 2) {
    error.value = "Prénom invalide"
    return
  }

  if (password.value.length < 8) {
    error.value = "8 caractères minimum"
    return
  }

  loading.value = true

  try {
    const json = await gasPost("setPasswordFromMagic", {
      jwt: auth.jwt,
      password: password.value,
      prenom: prenom.value.trim()
    })

    if (!json?.ok) {
      throw new Error(json?.error?.message || "Erreur inconnue")
    }

    router.replace("/mes-achats")

  } catch (e: any) {
    console.error("❌ setPasswordFromMagic", e)

    error.value =
      e.message === "GAS_TIMEOUT" || e.message === "GAS_DOWN"
        ? "Serveur momentanément indisponible"
        : e.message

  } finally {
    loading.value = false
  }
}



const skip = () => {
  router.replace("/mes-achats")
}
</script>

<template>
      <!-- HEADER MARKETING -->
  <MarketingHeader />
<div v-if="loading" class="premium-loader">
  <div class="loader-content">
    <div class="spinner"></div>
    <p class="loader-text">Finalisation du compte… redirection en cours</p>
  </div>
</div>


  <div class="secure-page">
    <div class="secure-card">
      <h1 class="title">
        Sécurise ton <span class="accent">compte</span>
      </h1>
         <p class="lead">
        Juste ton prénom, pour personnaliser ton espace.
      </p>
<input
  type="text"
  class="password-input"
  placeholder="Prénom"
  v-model="prenom"
  autofocus
  @keyup.enter="submit"
/>


      <p class="lead">
        Crée un mot de passe pour te reconnecter facilement plus tard.
      </p>

<input
  type="password"
  class="password-input"
  placeholder="Mot de passe (8 caractères minimum)"
  v-model="password"
  @keyup.enter="submit"
/>


<div v-if="error" class="error shake">
        {{ error }}
      </div>

<button
  class="btn btn-primary w-100"
  :disabled="loading || !prenom || password.length < 8"
  @click="submit"
>
  <span v-if="!loading">Définir mon mot de passe</span>
  <span v-else>Création en cours…</span>

</button>
<p class="trust">
  🔒 Données sécurisées — accès immédiat
</p>



    </div>
  </div>
</template>

<style scoped>
/* =========================
   THEME (landing aligned)
========================= */
.secure-page {
  --bg: #0b0b0f;
  --panel: #13131a;
  --panel-soft: #1b1b25;
  --text: #f8fafc;
  --muted: #9ca3af;
  --accent: #f59e0b;
  --border: rgba(255,255,255,0.08);

  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(1200px 600px at 50% -10%, #1a1a22, #0b0b0f);
  color: var(--text);
  padding: 2rem 1.2rem;
}

/* =========================
   CARD
========================= */
.secure-card {
  width: 100%;
  max-width: 420px;
  text-align: center;

  background: linear-gradient(180deg, var(--panel), var(--panel-soft));
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 2.4rem 2rem;

  box-shadow:
    0 20px 50px rgba(0,0,0,0.45),
    inset 0 1px 0 rgba(255,255,255,0.03);
}

/* =========================
   CONTENT
========================= */
.title {
  font-size: 1.9rem;
  font-weight: 900;
  margin-bottom: 0.6rem;
}

.title .accent {
  color: var(--accent);
}

.lead {
  font-size: 0.95rem;
  color: var(--muted);
  line-height: 1.6;
  margin-bottom: 1.6rem;
}

/* =========================
   INPUT
========================= */
.password-input {
  width: 100%;
  background: #0b0b0f;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 0.7rem 0.8rem;
  color: var(--text);
  margin-bottom: 0.8rem;
}

.password-input:focus {
  outline: none;
  border-color: rgba(245,158,11,0.5);
}

/* =========================
   ERROR
========================= */
.error {
  color: #f87171;
  font-size: 0.85rem;
  margin-bottom: 0.8rem;
}

/* =========================
   BUTTONS
========================= */
.btn {
  border-radius: 14px;
  font-weight: 800;
  padding: 0.7rem 1.4rem;
}

.btn-primary {
  background: var(--accent);
  color: #000;
}

.btn-link {
  background: transparent;
  color: var(--muted);
  font-size: 0.8rem;
  margin-top: 0.6rem;
}

.btn-link:hover {
  color: var(--text);
}

/* =========================
   MOBILE
========================= */
@media (max-width: 480px) {
  .secure-card {
    padding: 2rem 1.4rem;
  }
}

.premium-loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.loader-text {
  margin: 0;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.75);
  letter-spacing: 0.3px;
}
.premium-loader .spinner {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.15);
  border-top-color: var(--accent-color, #ff5100);
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.shake {
  animation: shake 0.35s ease;
}

@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  50% { transform: translateX(4px); }
  75% { transform: translateX(-2px); }
  100% { transform: translateX(0); }
}

.password-input::placeholder {
  color: rgba(255,255,255,0.35);
}

.password-input::placeholder {
  text-align: center;
}
.password-input {
  text-align: center;
}
.secure-card {
  animation: fadeUp 0.45s ease both;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.password-input:focus {
  box-shadow: 0 0 0 3px rgba(245,158,11,0.15);
}
body:has(.premium-loader) {
  overflow: hidden;
}
.trust {
  margin-top: 0.8rem;
  font-size: 0.75rem;
  color: var(--muted);
}
.secure-page {
  padding-bottom: calc(2rem + env(safe-area-inset-bottom));
}

</style>

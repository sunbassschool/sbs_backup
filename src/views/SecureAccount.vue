<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/authStore.js"
import { getProxyPostURL } from "@/config/gas.ts"
import MarketingHeader from "@/components/MarketingHeader.vue"

const router = useRouter()
const auth = useAuthStore()

const password = ref("")
const loading = ref(false)
const error = ref<string | null>(null)

const submit = async () => {
  error.value = null
  if (password.value.length < 8) {
    error.value = "8 caractères minimum"
    return
  }

  loading.value = true
  try {
    const res = await fetch(getProxyPostURL(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "setPasswordFromMagic",
        jwt: auth.jwt,
        password: password.value
      })
    })

    const json = await res.json()
    if (!json.ok) throw new Error(json.error?.message)

    router.replace("/mes-achats")
  } catch (e: any) {
    error.value = e.message
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
  <div class="secure-page">
    <div class="secure-card">
      <h1 class="title">
        Sécurise ton <span class="accent">compte</span>
      </h1>

      <p class="lead">
        Crée un mot de passe pour te reconnecter facilement plus tard.
      </p>

      <input
        type="password"
        class="password-input"
        placeholder="Mot de passe (8 caractères minimum)"
        v-model="password"
      />

      <div v-if="error" class="error">
        {{ error }}
      </div>

      <button
        class="btn btn-primary w-100"
        :disabled="loading"
        @click="submit"
      >
        Définir mon mot de passe
      </button>

      <button
        class="btn btn-link w-100"
        :disabled="loading"
        @click="skip"
      >
        Passer cette étape
      </button>
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
</style>

<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useAuthStore } from "@/stores/authStore.js"
import { getProxyPostURL } from "@/config/gas.ts"
import MarketingHeader from "@/components/MarketingHeader.vue"

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  const token = route.query.token as string | undefined

  if (!token) {
    error.value = "Lien invalide"
    loading.value = false
    return
  }

  try {
    const res = await fetch(getProxyPostURL(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "magicLogin",
        token,
        device_info: navigator.userAgent,
        deviceId: localStorage.getItem("deviceId") || ""
      })
    })

    const json = await res.json()
    if (!json.ok) throw new Error(json.error?.message || "Magic link invalide")

    await auth.restoreSessionFromPayload({
      jwt: json.data.jwt,
      refreshToken: json.data.refreshToken,
      sessionId: json.data.sessionId,
      email: json.data.email
    })

    router.replace("/secure-account")
  } catch (e: any) {
    console.error("❌ magic-access", e)
    error.value = e.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
       <!-- HEADER MARKETING -->
  <MarketingHeader />
  <div class="magic-page">
    <div class="magic-card">
      <!-- LOADING -->
      <div v-if="loading" class="state">
        <div class="spinner"></div>
        <h2>Connexion en cours…</h2>
        <p class="muted">Vérification du lien sécurisé</p>
      </div>

      <!-- ERROR -->
      <div v-else-if="error" class="state">
        <h2>❌ Erreur</h2>
        <p class="error">{{ error }}</p>

        <button class="btn btn-primary" @click="$router.push('/login')">
          Aller au login
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* =========================
   THEME
========================= */
.magic-page {
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
.magic-card {
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
   STATES
========================= */
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
}

.state h2 {
  font-size: 1.3rem;
  font-weight: 800;
}

.muted {
  font-size: 0.85rem;
  color: var(--muted);
}

.error {
  font-size: 0.9rem;
  color: #f87171;
  margin-bottom: 1rem;
}

/* =========================
   SPINNER
========================= */
.spinner {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.12);
  border-top-color: var(--accent);
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* =========================
   BUTTON
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

/* =========================
   MOBILE
========================= */
@media (max-width: 480px) {
  .magic-card {
    padding: 2rem 1.4rem;
  }
}
</style>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from "vue"
import { useRouter, useRoute } from "vue-router"
import { useAuthStore } from "@/stores/authStore.js"
import { getProxyPostURL } from "@/config/gas"
import MarketingHeader from "@/components/MarketingHeader.vue"

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const emailFromUrl = computed(() =>
  typeof route.query.email === "string" ? route.query.email : null
)

const isPending = computed(() => route.query.pending === "1")
const showSupport = ref(false)

let timer: any = null
let tries = 0
const MAX_TRIES = 12 // ~30s

onMounted(() => {
  // 🔧 fix landing-mode
  document.documentElement.classList.remove("landing-mode")
  document.body.classList.remove("landing-mode")

  if (!isPending.value) return

timer = setInterval(async () => {
  tries++
  console.log("⏳ POLL try", tries)

const email = emailFromUrl.value
if (!email) {
  console.warn("⚠️ no email in URL yet")
  return
}
  console.log("📧 email used =", email)

  try {
    const r = await fetch(getProxyPostURL(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "checkAccessStatus",
        email
      })
    })

    console.log("🌐 HTTP status =", r.status)

    const text = await r.text()
    console.log("📦 RAW RESPONSE =", text)

    let json
    try {
      json = JSON.parse(text)
    } catch (e) {
      console.error("❌ JSON PARSE FAILED")
      return
    }

    console.log("📡 PARSED RESPONSE =", json)

    if (json.ok && json.data?.active === true) {
      console.log("✅ ACCESS ACTIVE → redirect")
      clearInterval(timer)
      router.replace("/thankyou")
      return
    }

    console.log("⌛ still pending (active =", json.data?.active, ")")

    if (tries >= MAX_TRIES) {
      console.warn("⚠️ TIMEOUT pending")
      clearInterval(timer)
      showSupport.value = true
    }

  } catch (e) {
    console.error("❌ FETCH ERROR", e)
  }
}, 2500)

})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>



<template>
   <MarketingHeader />

<div class="thankyou-page">
  <div class="thankyou-card">

    <div class="icon">
      {{ isPending ? "⏳" : "✅" }}
    </div>

    <h1 class="title">
      {{ isPending ? "Activation en cours…" : "Paiement " }}
      <span v-if="!isPending" class="accent">confirmé</span>
    </h1>

    <p class="lead" v-if="isPending">
      Ton paiement est bien passé.
      Nous finalisons l’activation de ton accès (quelques secondes).
    </p>



    <div class="actions" v-if="!isPending">
      <button class="btn btn-primary" @click="router.push('/')">
        Accéder à mon espace
      </button>
    </div>

    <p class="note" v-if="isPending">
      Cette page se mettra à jour automatiquement.
    </p>


<p class="note" v-if="showSupport">
  L’activation prend plus de temps que prévu.
  Contacte le support si le problème persiste.
</p>

  </div>
</div>

</template>

<style scoped>
/* =========================
   THEME (landing aligned)
========================= */
.thankyou-page {
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
.thankyou-card {
  width: 100%;
  max-width: 520px;
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
.icon {
  font-size: 2.4rem;
  margin-bottom: 0.8rem;
}

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

.note {
  margin-top: 1.4rem;
  font-size: 0.75rem;
  color: var(--muted);
}

/* =========================
   CTA
========================= */
.actions {
  display: flex;
  justify-content: center;
}

.btn {
  border-radius: 14px;
  font-weight: 800;
  padding: 0.7rem 1.4rem;
}

.btn-primary {
  background: var(--accent);
  color: #000;
}

/* link */
.app-link {
  color: var(--accent);
  font-weight: 700;
  text-decoration: none;
}

.app-link:hover {
  text-decoration: underline;
}

/* =========================
   MOBILE
========================= */
@media (max-width: 480px) {
  .thankyou-card {
    padding: 2rem 1.4rem;
  }
}
</style>

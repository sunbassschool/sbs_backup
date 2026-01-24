<script setup lang="ts">
import { useRouter } from "vue-router"
import MarketingHeader from "@/components/MarketingHeader.vue"

const router = useRouter()
</script>

<template>
    <!-- HEADER MARKETING -->
  <MarketingHeader />
  <div class="thankyou-page">
    <div class="thankyou-card">
      <div class="icon">✅</div>

      <h1 class="title">
        Paiement <span class="accent">confirmé</span>
      </h1>

<p class="lead">
  Ton suivi pédagogique se fera directement sur
  <a
    href="https://sunbassschool.com/app"
    target="_blank"
    rel="noopener"
    class="app-link"
  >
    l’application
  </a>.
  Consulte ton email pour activer ton accès et débuter le cursus.
</p>



      <div class="actions">
        <button class="btn btn-primary" @click="router.push('/')">
          Accéder à mon espace
        </button>
      </div>

      <p class="note">
        Un email de confirmation vient de t’être envoyé afin d'activer ton espace sur l'application
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

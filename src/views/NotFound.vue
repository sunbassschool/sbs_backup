<script setup lang="ts">
import MarketingHeader from "@/components/MarketingHeader.vue"
import { useHead } from "@vueuse/head"

useHead({
  title: "404 – Page introuvable",
  meta: [{ name: "robots", content: "noindex" }]
})
</script>

<template>
  <MarketingHeader />

  <div class="notfound-page">
    <div class="notfound-card">
      <span class="badge">Erreur 404</span>

      <h1>
        Cette page n’existe pas.
      </h1>

      <p>
        Le lien est incorrect ou la page a été déplacée.
      </p>

      <router-link to="/" class="cta-main">
        Retour à l’accueil
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.notfound-page {
  --bg: #0b0b0f;
  --panel: #13131a;
  --panel-soft: #1b1b25;
  --text: #f8fafc;
  --muted: #9ca3af;
  --accent: #f59e0b;
  --border: rgba(255,255,255,0.08);

  min-height: 100dvh;
  display: flex;
  justify-content: center;
  align-items: center;

  background: radial-gradient(
    1200px 600px at 50% -10%,
    #1a1a22,
    #0b0b0f
  );

  color: var(--text);
  padding: 2rem;
}

.notfound-card {
  background: linear-gradient(180deg, var(--panel), var(--panel-soft));
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 3rem 2.5rem;
  text-align: center;
  max-width: 520px;

  box-shadow:
    0 30px 70px rgba(0,0,0,0.45);
}

.badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 1rem;
}

h1 {
  font-size: 2rem;
  font-weight: 900;
  margin-bottom: 1rem;
}

p {
  color: var(--muted);
  margin-bottom: 2rem;
}

.cta-main {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 0.75rem 1.6rem;
  font-size: 0.85rem;
  font-weight: 900;

  color: #0b0b0f;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);

  border-radius: 999px;
  text-decoration: none;

  box-shadow:
    0 10px 30px rgba(245,158,11,0.35),
    inset 0 1px 0 rgba(255,255,255,0.35);

  transition: transform 0.15s ease;
}

.cta-main:hover {
  transform: translateY(-2px);
}
</style>

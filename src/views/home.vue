<template>
    <MarketingHeader />

  <section class="landing-page">

    <!-- HERO -->
<header class="hero">
  <span class="badge">Conçu par un prof, pour les profs indépendants</span>

  <h1>
    Gère tes cours, élèves et paiements<br />
    <span>sans perdre de temps ni d’argent</span>
  </h1>

  <div class="hero-actions">
    <RouterLink to="/register" class="btn primary">
      Commencer gratuitement
    </RouterLink>
  </div>
</header>


    <!-- BENEFITS -->
<section class="benefits">
  <article>
    <h3>📅 Moins d’oublis</h3>
    <p>
      Planning clair, reports simples.<br />
      <strong>Moins de cours perdus.</strong>
    </p>
  </article>

  <article>
    <h3>💳 Tu encaisses sans relancer</h3>
    <p>
      Paiements et abonnements intégrés.<br />
      <strong>Plus d'impayés.</strong>
    </p>
  </article>

  <article>
    <h3>📂 Fichiers accessibles</h3>
    <p>
      Ressources centralisées pour chaque élève.<br />
      <strong>Moins de messages, moins de bazar.</strong>
    </p>
  </article>

  <article>
    <h3>🎸 Image pro</h3>
    <p>
      Une app à ton nom, pas un bricolage.<br />
      <strong>Tu inspires confiance.</strong>
    </p>
  </article>
</section>


    <!-- HOW -->
    <section class="how">
      <h2>Comment ça marche</h2>

<ol>
  <li>Tu t’inscris gratuitement</li>
  <li>Tu créer une offre de cours et l'élève souscrit</li>
  <li>Tu utilises les différentes fonctionnalités pour la gestion de tes cours </li>
</ol>


    </section>

    <!-- CTA -->
    <section class="cta-inline">
  <h3>
    Commence gratuitement.<br />
    <span></span>
  </h3>

  <RouterLink to="/register" class="btn primary">
    Créer mon compte
  </RouterLink>

  <p class="muted">
    Aucun engagement • Annulable à tout moment
  </p>
</section>


    <!-- TARGET -->
    <section class="target">
      <h2>Conçu pour</h2>

      <ul>
        <li>✔️ Professeurs de musique</li>
        <li>✔️ Studios indépendants</li>
        <li>✔️ Formateurs indépendants</li>
      </ul>
    </section>

    <!-- CTA -->
 <section class="cta">
 <h2>
Prêt à simplifier ton activité dès aujourd’hui ?
</h2>


  <RouterLink to="/register" class="btn primary big">
    Créer mon compte gratuitement
  </RouterLink>

  <p class="muted">
    Aucun engagement • Annulable à tout moment
  </p>
</section>


  </section>
</template>
<script setup>
import MarketingHeader from "@/components/MarketingHeader.vue"
</script>

<style scoped>
.landing-page {
  --bg: #0b0b0f;
  --panel: #13131a;
  --panel-soft: #1b1b25;
  --text: #f8fafc;
  --muted: #9ca3af;
  --accent: #f59e0b;
  --border: rgba(255,255,255,0.08);

  background: radial-gradient(1200px 600px at 50% -10%, #1a1a22, #0b0b0f);
  color: var(--text);
  padding: clamp(4rem, 8vh, 8rem) 1.2rem;
}

/* HERO */
.hero {
  max-width: 760px;
  margin: clamp(2rem, 6vh, 4rem) auto 0;
  text-align: center;
}

.hero h1 {
  margin-top: 0.8rem;
  font-size: clamp(2rem, 4vw, 2.8rem);
}
.hero .hero-actions {
  margin-top: 1.6rem;
}
.hero h1 span {
  color: var(--accent);
}
.hero-note {
  margin-top: 0.8rem;
  font-size: 0.85rem;
  color: var(--muted);
}
.hero p {
  margin-top: 1.2rem;
  color: var(--muted);
  font-size: 1.05rem;
}

.hero-actions {
  margin-top: 2.4rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* BENEFITS */
.benefits {
  margin: clamp(3rem, 6vh, 5rem) auto 0;
  max-width: 1000px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: clamp(1.2rem, 3vw, 1.6rem);
}

.benefits article {
  background: linear-gradient(180deg, var(--panel), var(--panel-soft));
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.3rem 1.4rem;
}

.benefits h3 {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.3rem;
}

.benefits p {
  font-size: 0.9rem;
  line-height: 1.45;
}
@media (hover: hover) {
  .benefits article:hover {
    border-color: rgba(245,158,11,0.4);
  }
}


/* HOW */
.how {
  margin: 6rem auto 0;
  max-width: 720px;
  text-align: center;
}

.how h2 {
  font-size: 1.6rem;
  font-weight: 800;
}

.how ol {
  margin-top: 2rem;
  list-style: none;
  padding: 0;
  counter-reset: step;
}

.how li {
  counter-increment: step;
  margin-bottom: 1rem;
}

.how li::before {
  content: counter(step) ". ";
  color: var(--accent);
  font-weight: 800;
}

/* TARGET */
.target {
  margin: 5rem auto 0;
  text-align: center;
}

.target ul {
  margin-top: 1.5rem;
  list-style: none;
  padding: 0;
}

.target li {
  font-size: 0.95rem;
  margin-bottom: 0.4rem;
}


/* CTA */
.cta {
  margin-top: 6rem;
  text-align: center;
}

.cta h2 {
  font-size: 1.8rem;
  font-weight: 900;
}

.cta span {
  color: var(--accent);
}

/* UI */
.badge {
  display: inline-block;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  font-weight: 600;
  background: transparent;
    border: 1px solid var(--border);

  color: var(--muted);
}

.btn {
  border-radius: 14px;
  padding: 0.75rem 1.2rem;
  font-weight: 700;
  text-decoration: none;
}

.btn.primary {
  background: var(--accent);
  color: #000;
}

.btn.ghost {
  border: 1px solid var(--border);
  color: var(--text);
}

.btn.big {
  padding: 1rem 1.6rem;
}
.benefits strong {
  color: var(--text);
  font-weight: 700;
}

.cta-inline {
  margin: 4rem auto 0;
  text-align: center;
}

.cta-inline h3 {
  font-size: 1.4rem;
  font-weight: 800;
}

.cta-inline span {
  color: var(--accent);
}

.cta-inline .muted {
  margin-top: 0.6rem;
  font-size: 0.85rem;
  color: var(--muted);
}

</style>

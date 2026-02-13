
<script setup lang="ts">
import { ref } from "vue"
import LeadCapture from "@/components/lead/LeadCapture.vue"
import MarketingHeader from "@/components/MarketingHeader.vue"
import { useHead } from "@vueuse/head"
const BOOK_URL = "https://www.sunbassschool.com/sbs-upload/uploads/da325b2c-ff5d-45ea-9c57-156896fdb198/de7ed9f1-fd21-43d7-b6d1-016325f9a827/e8736eda-1d39-49bc-a35c-c01f0d3ea9b6.png"
const VIDEO_URL = "https://www.sunbassschool.com/sbs-upload/uploads/da325b2c-ff5d-45ea-9c57-156896fdb198/de7ed9f1-fd21-43d7-b6d1-016325f9a827/4cc7754e-099c-4ffa-86fc-38d4c0686a9b.mp4"
const POSTER_URL = "https://www.sunbassschool.com/sbs-upload/uploads/da325b2c-ff5d-45ea-9c57-156896fdb198/de7ed9f1-fd21-43d7-b6d1-016325f9a827/f67ab0ae-c710-43b9-bfaa-313563a8e826.png"
useHead({
  title: "Masterclass basse gratuite – Harmonie & improvisation | SunBassSchool",
  meta: [
    {
      name: "description",
      content:
        "Masterclass basse gratuite (vidéo + livret PDF) pour comprendre l’harmonie à la basse, construire des lignes solides et développer un groove naturel. Accès immédiat."
    },

    // Open Graph
    {
      property: "og:title",
      content: "Masterclass basse gratuite – Harmonie & groove"
    },
    {
      property: "og:description",
      content:
        "Accède gratuitement à une vidéo + livret PDF pour apprendre quoi jouer dans un morceau et développer ton groove à la basse."
    },
    {
      property: "og:type",
      content: "website"
    },
    {
      property: "og:url",
      content: "https://sunbassschool.com/masterclass"
    },
    {
      property: "og:image",
      content: BOOK_URL
    },

    // Twitter
    {
      name: "twitter:card",
      content: "summary_large_image"
    },
    {
      name: "twitter:title",
      content: "Masterclass basse gratuite"
    },
    {
      name: "twitter:description",
      content:
        "Vidéo + livret PDF offerts pour comprendre l’harmonie et le groove à la basse."
    },
    {
      name: "twitter:image",
      content: BOOK_URL
    }
  ],

  link: [
    {
      rel: "canonical",
      href: "https://sunbassschool.com/masterclass"
    }
  ]
})

const showModal = ref(false)
const PRODUCT_ID = "FREE_MASTERCLASS_001"

const open = () => {
  showModal.value = true
  document.body.style.overflow = "hidden"
}

const close = () => {
  showModal.value = false
  document.body.style.overflow = ""
}
</script>
<template>
  <!-- HEADER MARKETING -->
  <MarketingHeader />

  <div class="masterclass-page">

    <!-- HERO -->
<section class="mc-hero">

  <div class="mc-hero-inner">

    <!-- LEFT -->
    <div class="mc-copy">
      <span class="mc-badge">
        🎁 Masterclass gratuite · Vidéo + Livret PDF
      </span>

      <h1 class="mc-title">
        Masterclass basse gratuite – Harmonie & rythme
<br />
        <span>à la basse</span>
      </h1>

      <p class="mc-sub">
        Comprends enfin quoi jouer, quand le jouer,
        et construis des lignes mélodiques
        au service du morceau.
      </p>

      <ul class="mc-points">
        <li>✔ Approche claire et moderne</li>
        <li>✔ Harmonie adaptée à la basse</li>
        <li>✔ Tous niveaux</li>
      </ul>

      <button class="mc-cta" @click="open">
Recevoir la masterclass gratuite
      </button>
    </div>

    <!-- RIGHT -->
    <div class="mc-media">



   <div class="mc-video">
<video
  :src="VIDEO_URL"
  controls
  preload="metadata"
  playsinline
  :poster="POSTER_URL"
></video>

</div>


    </div>

  </div>

</section>
<div class="mc-separator"></div>

<section class="mc-included">

  <div class="mc-included-inner">

    <div class="mc-book-visual">
      <img
        :src="BOOK_URL"
        alt="Livret PDF masterclass basse – notation et tablature"
      />
    </div>

    <div class="mc-book-copy">
     <h2>Un livret pédagogique structuré en 2 volets</h2>

<p>
  En plus de la vidéo, tu reçois un livret complet
  qui te guide étape par étape dans la construction
  de ton improvisation.
</p>

<h3>Volet harmonique</h3>
<ul>
  <li>✔ Repérage précis de la gamme de référence (G majeur)</li>
  <li>✔ Travail des accords de 10ème adaptés à la basse</li>
  <li>✔ Association réservoir de notes & accords</li>
  <li>✔ Exercices progressifs + improvisations guidées</li>
</ul>

<h3>Volet rythmique</h3>
<ul>
  <li>✔ Travail des débits binaires et ternaires</li>
  <li>✔ Ghost-notes & accents</li>
  <li>✔ Mélanges rythmiques contrôlés</li>
  <li>✔ Mise en pratique en groove réel</li>
</ul>

<p>
  Une méthode complète pour relier harmonie,
  direction mélodique et groove.
</p>


      <button class="mc-cta" @click="open">
        Recevoir gratuitement
      </button>
    </div>

  </div>

</section>

<div class="mc-separator"></div>

    <!-- PROBLÈME -->
    <section class="section text">
      <h2>Pourquoi tes lignes de basse manquent de clarté</h2>

      <p>
        Beaucoup de bassistes connaissent des gammes,
        des plans et des exercices…
      </p>
      <p>
        Mais ne savent pas réellement quoi jouer
        dans un morceau.
      </p>
      <p>
        Résultat : des lignes brouillonnes,
        peu articulées et parfois déconnectées
        de la musique.
      </p>
    </section>

    <!-- PROMESSE -->
    <section class="section text">
      <h2>Ce qui manque à la plupart des bassistes</h2>

      <p>
        Le problème n’est pas la technique.
      </p>
      <p>
        Le vrai manque, ce sont des repères
        harmoniques et rythmiques solides.
      </p>
      <p>
        Ce sont ces deux piliers qui donnent
        du sens à une ligne de basse.
      </p>
    </section>

    <!-- PROGRAMME -->
    <section class="section program">
      <h2>Ce que tu vas apprendre dans cette masterclass basse</h2>

      <div class="cards">
        <div class="card">
          <h3>Harmonie appliquée à la basse</h3>
          <p>
            Comprendre les gammes et les accords
            pour choisir les bonnes notes
            dans chaque contexte musical.
          </p>
        </div>

        <div class="card">
          <h3>Construction de lignes mélodiques</h3>
          <p>
            Relier les notes entre elles,
            créer des phrases claires,
            musicales et cohérentes.
          </p>
        </div>

        <div class="card">
          <h3>Rythme & groove</h3>
          <p>
            Maîtriser débits, accents et ghost-notes
            pour installer un groove solide et naturel.
          </p>
        </div>
      </div>
    </section>

    <!-- RÉSULTAT -->
    <section class="section text">
      <h2>Ce que ça va changer dans ton jeu</h2>

      <p>Tu comprends quoi jouer.</p>
      <p>Tu comprends quand le jouer.</p>
      <p>
        Tes lignes deviennent plus simples,
        plus efficaces et réellement musicales.
      </p>
    </section>
    <section class="section internal-acquis">

  <h2>Concrètement, après cette masterclass :</h2>

  <div class="acquis-grid">
<div class="acquis-card">
  <div class="acquis-icon">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="9" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="3" stroke-width="1.5"/>
    </svg>
  </div>
  <h3>Tu te sens libre sur tout le manche</h3>
      <p>
        Grâce à la compréhension des degrés et des intervalles,
        tout devient logique.
        Tu sais toujours où tu es dans l’harmonie.
        Plus de blocage mental.
        Plus de peur de jouer la mauvaise note.
      </p>
    </div>

 <div class="acquis-card">
  <div class="acquis-icon">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M3 12h18" stroke-width="1.5"/>
      <circle cx="6" cy="12" r="2" stroke-width="1.5"/>
      <circle cx="18" cy="12" r="2" stroke-width="1.5"/>
    </svg>
  </div>  <h3>Tu sais quoi jouer dans un morceau</h3>

      <p>
        Tu construis des lignes cohérentes,
        stables et musicales,
        sans dépendre de positions apprises par cœur.
        Chaque note a une intention.
      </p>
    </div>

 <div class="acquis-card">
  <div class="acquis-icon">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M4 12c2-6 6-6 8 0s6 6 8 0" stroke-width="1.5"/>
    </svg>
  </div>
  <h3>Ton groove devient plus naturel</h3>
      <p>
        En comprenant les débits, les accents
        et les ghost-notes,
        tu ne calcules plus le rythme :
        tu le ressens.
        Ton jeu gagne en stabilité et en profondeur.
      </p>
    </div>
<div class="acquis-card">
  <div class="acquis-icon">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="3" stroke-width="1.5"/>
      <path d="M8 12h8" stroke-width="1.5"/>
    </svg>
  </div>
  <h3>Tu as une vraie méthode de progression</h3>
      <p>
        Une porte d’entrée claire pour travailler
        harmonie et rythme ensemble.
        Tu progresses avec un système,
        pas au hasard.
      </p>
    </div>

  </div>

</section>
<section class="section text internal-bridge">
  <h2>Aller plus loin après la masterclass</h2>
 <p>
  Cette masterclass pose les bases.
  Si tu veux approfondir la méthode complète,
  structurer ton jeu et gagner en liberté sur le long terme,
  la formation dédiée va beaucoup plus loin.
</p>

   <a href="/improvisationcadentielle" class="bridge-cta">
  Découvrir la formation complète
</a>

</section>


    <!-- CIBLE SEO -->
    <section class="section text">
      <h2>À qui s’adresse cette masterclass basse ?</h2>

      <p>
        Cette masterclass s’adresse aux bassistes débutants,
        intermédiaires et avancés qui souhaitent mieux comprendre
        l’harmonie à la basse, développer leur groove
        et construire des lignes solides dans tous les styles.
      </p>

      <p>
        Que tu joues en groupe, en studio ou en solo,
        savoir quoi jouer et quand le jouer
        est essentiel pour progresser durablement.
      </p>

<p>
  Elle convient également aux musiciens qui souhaitent
  apprendre l’improvisation à la basse
  et comprendre l’harmonie à la basse
  de manière claire et structurée.
</p>


    </section>

    <!-- FAQ SEO -->
    <section class="section text">
      <h2>Questions fréquentes</h2>

      <h3>La masterclass basse est-elle vraiment gratuite ?</h3>
      <p>
        Oui. L’accès à la vidéo et au livret PDF est entièrement gratuit.
      </p>

      <h3>Faut-il connaître le solfège ?</h3>
      <p>
        Non. Les notions sont expliquées simplement
        et applicables immédiatement à la basse.
      </p>

      <h3>Quel niveau faut-il avoir ?</h3>
      <p>
        Elle convient aux bassistes débutants comme intermédiaires
        souhaitant structurer leur jeu.
      </p>
    </section>

    <!-- CTA FINAL -->
    <section class="section text" style="text-align:center">
      <p style="margin-bottom:1.8rem">
        🎁 Accès gratuit immédiat + livret pédagogique offert
      </p>

      <button class="btn primary xl" @click="open">
        Accéder à la masterclass
      </button>
    </section>

  </div>

  <!-- MODALE -->
  <Teleport to="body">
    <div v-if="showModal" class="mc-modal-layer" @click.self="close">
      <div class="mc-modal">
        <button class="mc-close" @click="close">×</button>
        <LeadCapture :productId="PRODUCT_ID" />
      </div>
    </div>
  </Teleport>
</template>


<style scoped>

/* ======================================================
   THEME — DARK PREMIUM CLEAN
====================================================== */

:root {
  --bg-1: #050509;
  --bg-2: #0c0f1a;

  --accent-1: #f59e0b;
  --accent-2: #f17863;

  --text-main: #f8fafc;
  --text-soft: #cbd5e1;
  --text-muted: #94a3b8;

  --border-soft: rgba(255,255,255,0.08);
}

/* ======================================================
   PAGE WRAPPER (SCROLL FIX PROPRE)
====================================================== */

.masterclass-page {
  min-height: 100vh;
  overflow-x: hidden;
padding-top:20px;
  background:
    linear-gradient(180deg, rgba(5,5,9,0.96), rgba(5,5,9,0.98)),
    url("/bg-masterclass.png");

  background-size: cover;
  background-position: center top;
  background-attachment: fixed;

  color: var(--text-main);
}
/* ======================================================
   SECTION SEPARATOR — DARK PREMIUM
====================================================== */

.mc-separator {
  position: relative;
  width: 100%;
  max-width: 900px;
  margin: 4rem auto;

  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255,255,255,0.08),
    transparent
  );
}

/* léger glow central subtil */
.mc-separator::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);

  width: 120px;
  height: 1px;

  background: rgba(245,158,11,0.25);
}

/* ======================================================
   HERO
====================================================== */

.hero {
  position: relative;
  padding: clamp(4rem, 8vh, 6rem) 1.2rem 3rem;
  text-align: center;
  max-width: 900px;
  margin: 0 auto;
}

.hero::after {
  content: "";
  position: absolute;
  inset: -100px;
  background:
    radial-gradient(circle at center,
      rgba(245,158,11,0.15),
      transparent 70%);
  z-index: -1;
}

.title {
  font-size: clamp(2.2rem, 5vw, 3rem);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.5px;
}

.title span {
  background: linear-gradient(90deg, var(--accent-1), var(--accent-2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  margin: 1.6rem auto 2.6rem;
  max-width: 720px;
  font-size: 1.08rem;
  line-height: 1.7;
  color: var(--text-soft);
}

/* ======================================================
   BADGES
====================================================== */

.badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.8rem;
  list-style: none;
  padding: 0;
  margin: 0 0 2.8rem;
}

.badges li {
  font-size: 0.72rem;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border-soft);
  backdrop-filter: blur(6px);
}

/* ======================================================
   BUTTONS (CTA PREMIUM)
====================================================== */

.btn {
  border: none;
  cursor: pointer;
  border-radius: 999px;
  font-weight: 700;
  transition: all 0.25s ease;
}

.btn.primary {
  background: linear-gradient(90deg, var(--accent-1), var(--accent-2));
  color: #fff;
  box-shadow: 0 8px 24px rgba(245,158,11,0.25);
}

.btn.primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(241, 127, 99, 0.35);
}

.btn.xl {
  padding: 0.95rem 2.2rem;
  font-size: 1rem;
}

/* ======================================================
   SECTIONS — VERSION PLUS DENSE
====================================================== */

.section {
  padding: 2rem 1.2rem; /* ↓ réduit */
  max-width: 900px;
  margin: 0 auto;
}

.section h2 {
  font-size: 1.9rem;
  font-weight: 900;
  margin-bottom: 1rem; /* ↓ réduit */
  text-align: center;
}

.section h3 {
  font-size: 1.1rem;
  font-weight: 800;
  margin: 1.2rem 0 0.4rem; /* ↓ réduit */
}

.section.text p {
  max-width: 720px;
  margin: 0 auto 0.9rem; /* ↓ réduit */
  line-height: 1.7; /* légèrement plus compact */
  color: var(--text-soft);
}

/* alternance légère */
.section:nth-of-type(even) {
  background: rgba(255,255,255,0.02);
  border-top: 1px solid var(--border-soft);
  border-bottom: 1px solid var(--border-soft);
}

/* ======================================================
   PROGRAM CARDS
====================================================== */

.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.8rem;
}

.card {
  position: relative;
  padding: 2rem 1.6rem;
  border-radius: 18px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border-soft);
  backdrop-filter: blur(8px);
  transition: all 0.25s ease;
}

.card:hover {
  transform: translateY(-6px);
  border-color: rgba(245,158,11,0.4);
}

.card h3 {
  background: linear-gradient(90deg, var(--accent-1), var(--accent-2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.card p {
  font-size: 0.92rem;
  line-height: 1.65;
  color: var(--text-soft);
}

/* ======================================================
   CTA SECTION FINAL
====================================================== */

.section:last-of-type {
  padding-bottom: 6rem;
}

/* ======================================================
   MODAL
====================================================== */

.mc-modal-layer {
  position: fixed;
  inset: 0;
  z-index: 9999;

  background:
    radial-gradient(circle at center,
      rgba(0,0,0,0.7),
      rgba(0,0,0,0.92));

  backdrop-filter: blur(8px);

  display: flex;
  align-items: center;
  justify-content: center;
}

.mc-modal {
  background: linear-gradient(180deg, #111827, #050509);
  border: 1px solid var(--border-soft);
  border-radius: 22px;
  padding: 36px;
  min-width: 320px;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
  animation: fadeIn 0.25s ease;
}

.mc-close {
  position: absolute;
  top: 16px;
  right: 20px;
  background: none;
  border: none;
  font-size: 1.4rem;
  color: var(--text-muted);
  cursor: pointer;
}

.mc-close:hover {
  color: var(--accent-1);
}

/* ======================================================
   ANIMATIONS
====================================================== */

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ======================================================
   RESPONSIVE
====================================================== */

@media (max-width: 900px) {
  .cards {
    grid-template-columns: 1fr;
  }

  .hero {
    padding-top: 3.5rem;
  }

  .section h2 {
    font-size: 1.6rem;
  }
}
/* ======================================================
   HERO WRAPPER
====================================================== */

.mc-hero {
  padding: clamp(3rem, 6vh, 5rem) 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* ======================================================
   GRID LAYOUT
====================================================== */

.mc-hero-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}

/* ======================================================
   COPY
====================================================== */

.mc-badge {
  display: inline-block;
  font-size: 0.75rem;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  margin-bottom: 1.2rem;
}

.mc-title {
  font-size: clamp(2.2rem, 4vw, 3rem);
  font-weight: 900;
  line-height: 1.1;
  margin-bottom: 1.2rem;
}

.mc-title span {
  color: #f59e0b;
}

.mc-sub {
  color: #cbd5e1;
  line-height: 1.7;
  margin-bottom: 1.6rem;
  max-width: 480px;
}

.mc-points {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem;
  color: #cbd5e1;
}

.mc-points li {
  margin-bottom: 0.6rem;
}

/* ======================================================
   CTA
====================================================== */

.mc-cta {
  background: #f59e0b;
  color: #0b0b12;
  border: none;
  padding: 14px 28px;
  border-radius: 999px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mc-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(245,158,11,0.25);
}

/* ======================================================
   MEDIA SIDE
====================================================== */

.mc-media {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
}

/* BOOK */

.mc-book img {
  max-width: 240px;
  width: 100%;
  height: auto;
  filter: drop-shadow(0 20px 40px rgba(0,0,0,0.6));
}

/* VIDEO */

.mc-video video {
  width: 100%;
  max-width: 480px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.08);
  background: #000;
}

/* ======================================================
   RESPONSIVE
====================================================== */

@media (max-width: 900px) {

  .mc-hero-inner {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .mc-sub {
    margin: 0 auto 1.6rem;
  }

  .mc-points {
    text-align: left;
    max-width: 320px;
    margin: 0 auto 2rem;
  }

  .mc-media {
    margin-top: 2rem;
  }

  .mc-book img {
    max-width: 200px;
  }

}

/* ======================================================
   INCLUDED SECTION
====================================================== */

.mc-included {
  padding: 4rem 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
}

.mc-included-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}

.mc-book-visual {
  text-align: center;
}

.mc-book-visual img {
  max-width: 360px;   /* plus grand */
  width: 100%;
  height: auto;

  filter: drop-shadow(0 40px 80px rgba(0,0,0,0.65));

  transition: transform 0.3s ease;
}

/* léger effet premium au hover */
.mc-book-visual img:hover {
  transform: translateY(-6px);
}


.mc-book-copy h2 {
  font-size: 1.8rem;
  font-weight: 900;
  margin-bottom: 1rem;
}

.mc-book-copy p {
  color: #cbd5e1;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.mc-book-copy ul {
  list-style: none;
  padding: 0;
  margin-bottom: 1.5rem;
  color: #cbd5e1;
}

.mc-book-copy li {
  margin-bottom: 0.6rem;
}

/* Responsive */

@media (max-width: 900px) {
  .mc-included-inner {
    grid-template-columns: 1fr;
    text-align: center;
  }
}
/* ======================================================
   HERO VIDEO — IMPACT DESKTOP
====================================================== */

.mc-video {
  width: 100%;
  max-width: 720px; /* plus large */
}

.mc-video video {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 18px;

  border: 1px solid rgba(255,255,255,0.08);

  background: #000;

  box-shadow:
    0 30px 70px rgba(0,0,0,0.65),
    0 0 0 1px rgba(255,255,255,0.04) inset;

  transition: transform 0.25s ease;
}

/* léger effet immersion */
.mc-video video:hover {
  transform: scale(1.02);
}

.section:nth-of-type(even) {
  background: rgba(255,255,255,0.025);
  border-radius: 28px;
  padding: 3.5rem 2rem;
  box-shadow:
    0 20px 50px rgba(0,0,0,0.35),
    inset 0 0 0 1px rgba(255,255,255,0.04);
}
.section:last-of-type {
  margin-top: 4rem;
  padding-top: 4rem;
  border-top: 1px solid rgba(255,255,255,0.08);
}
/* ======================================================
   PREMIUM BRIDGE SECTION
====================================================== */

.internal-bridge {
  position: relative;
  max-width: 880px;
  margin: 5rem auto;
  padding: 4rem 2.5rem;

  text-align: center;

  border-radius: 28px;

  background:
    radial-gradient(circle at 50% 0%,
      rgba(245,158,11,0.18),
      rgba(245,158,11,0.05) 40%,
      rgba(255,255,255,0.02) 100%
    );

  border: 1px solid rgba(245,158,11,0.35);

  box-shadow:
    0 40px 100px rgba(0,0,0,0.6),
    inset 0 0 0 1px rgba(255,255,255,0.05);
}

.internal-bridge h2 {
  font-size: 2rem;
  font-weight: 900;
  margin-bottom: 1.4rem;
}

.internal-bridge p {
  font-size: 1.05rem;
  line-height: 1.8;
  color: var(--text-soft);
  max-width: 640px;
  margin: 0 auto;
}

.internal-bridge a {
  display: inline-block;
  margin-top: 1.8rem;
  padding: 0.9rem 2rem;

  border-radius: 999px;
  font-weight: 800;
  text-decoration: none;

  background: linear-gradient(90deg, var(--accent-1), var(--accent-2));
  color: #fff;

  box-shadow: 0 12px 32px rgba(245,158,11,0.35);

  transition: all 0.25s ease;
}

.internal-bridge a:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 40px rgba(245,158,11,0.5);
}

/* ======================================================
   TRANSFORMATION BLOCK — PREMIUM
====================================================== */

.internal-acquis {
  margin: 6rem auto;
  padding: 4.5rem 2.5rem;
  max-width: 1050px;

  border-radius: 32px;

  background:
    radial-gradient(circle at 50% 0%,
      rgba(245,158,11,0.15),
      rgba(245,158,11,0.05) 40%,
      rgba(255,255,255,0.02) 100%
    );

  border: 1px solid rgba(245,158,11,0.35);

  box-shadow:
    0 50px 120px rgba(0,0,0,0.7),
    inset 0 0 0 1px rgba(255,255,255,0.05);

  text-align: center;
}

.internal-acquis h2 {
  font-size: 2.1rem;
  font-weight: 900;
  margin-bottom: 3.5rem;
}

.acquis-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2.2rem;
}

.acquis-card {
  padding: 2.4rem 2rem;
  border-radius: 24px;

  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);

  backdrop-filter: blur(8px);

  transition: all 0.25s ease;
}

.acquis-card:hover {
  transform: translateY(-6px);
  border-color: rgba(245,158,11,0.5);
}

.acquis-card h3 {
  font-size: 1.15rem;
  font-weight: 800;
  margin-bottom: 1rem;

  background: linear-gradient(90deg, var(--accent-1), var(--accent-2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.acquis-card p {
  font-size: 0.98rem;
  line-height: 1.8;
  color: var(--text-soft);
}

/* Responsive */

@media (max-width: 900px) {
  .acquis-grid {
    grid-template-columns: 1fr;
  }

  .internal-acquis {
    padding: 3rem 1.5rem;
  }
}
/* ======================================================
   ACQUIS ICON STYLE
====================================================== */

.acquis-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 1.4rem;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 14px;

  background: rgba(245,158,11,0.12);
  border: 1px solid rgba(245,158,11,0.4);

  color: var(--accent-1);

  transition: all 0.25s ease;
}

.acquis-icon svg {
  width: 22px;
  height: 22px;
}

.acquis-card:hover .acquis-icon {
  transform: translateY(-4px);
  box-shadow: 0 12px 25px rgba(245,158,11,0.35);
}


</style>

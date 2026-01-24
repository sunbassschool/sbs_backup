<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue"
import { useRoute,useRouter  } from "vue-router"
import { useAuthStore } from "@/stores/authStore"
import { getProxyPostURL } from "@/config/gas"
import MarketingHeader from "@/components/MarketingHeader.vue"
import { useHead } from '@vueuse/head'
import { gasPost } from "@/config/gas"

import EmbeddedCheckout from "@/components/cartflow/Payments/EmbeddedCheckout.vue"
import OfferSelector from "@/components/cartflow/Payments/OfferSelector.vue"
import OfferRecap from "@/components/cartflow/Payments/OfferRecap.vue"
import PaymentElement from "@/components/cartflow/Payments/PaymentElement.vue"
const route = useRoute()
const router = useRouter()
const funnel =
  (route.query.funnel as string) || "cours_basse"
const auth = useAuthStore()

useHead({
  title: 'Cours de basse en ligne avec professeur | SunBassSchool',
  meta: [
    {
      name: 'description',
      content:
        'Cours de basse en ligne en visioconférence avec professeur expérimenté. Formation personnalisée, suivi via SunBassApp et accès immédiat.'
    }
  ],
  link: [
    {
      rel: "canonical",
      href: "https://www.sunbassschool.com/"
    }
  ]
})
// =====================
// STATE
// =====================
const offers = ref<any[]>([])
const selectedOffer = ref<any | null>(null)

const guestEmail = ref("")
const clientSecret = ref<string | null>(null)
  const setupCustomerId = ref<string | null>(null)

const loading = ref(false)
const error = ref<string | null>(null)

const onStripeSuccess = async (res) => {
  console.log("🟢 STRIPE SUCCESS CALLBACK", res)

  // ===============================
  // 💸 ONE-TIME
  // ===============================
  if (selectedOffer.value?.pricing_mode === "one_time") {
    const pi = res?.paymentIntent
    if (!pi || pi.status !== "succeeded") {
      console.error("❌ PAYMENT FAILED", pi)
      return
    }

    console.log("✅ ONE-TIME PAID", pi.id)
    router.push("/thankyou")
    return
  }

  // ===============================
  // 🔁 SUBSCRIPTION
  // ===============================
  const si = res?.setupIntent
  if (!si || !si.payment_method || !setupCustomerId.value) {
    console.error("❌ SETUP FLOW INCOMPLET")
    return
  }

  const payload = {
    route: "createSubscriptionFromSetup",
    offer_code: selectedOffer.value.product_id,
    email: resolvedEmail.value,
    customer_id: setupCustomerId.value,
    payment_method: si.payment_method
  }

  const r = await fetch(getProxyPostURL(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })

  const json = await r.json()
  if (!json.ok) {
    console.error("❌ SUB FAILED", json)
    return
  }

  router.push("/thankyou")
}








const onStripeError = (msg) => {
  error.value = msg
}



const onPaymentSuccess = (pi) => {
  console.log("🎉 paiement confirmé", pi)

  // reset UI
  clientSecret.value = null

  // redirect
  router.push("/thankyou") // ou page succès
}
const offersLoading = ref(true)

// =====================
// COMPUTED
// =====================
const resolvedEmail = computed(() =>
  auth.user?.email || guestEmail.value.trim()
)

// =====================
// FETCH OFFERS
// =====================
onMounted(async () => {
  document.documentElement.classList.add("landing-mode")
document.body.classList.add("landing-mode")

  console.log("🟢 [OfferPage] mount → fetch offers")

  const counter = document.querySelector(".stat-counter");
  if (!counter) return;

  const target = Number(counter.dataset.target);
  let current = 0;

  const duration = 1200; // ms
  const steps = 60;
  const increment = target / steps;

  const interval = setInterval(() => {
    current += increment;
    if (current >= target) {
      counter.textContent = target;
      clearInterval(interval);
    } else {
      counter.textContent = Math.floor(current);
    }
  }, duration / steps);


  try {
console.log("➡️ POST getOffersForCheckout", {
  route: "getOffersForCheckout",
  funnel
})


    const res = await fetch(getProxyPostURL(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
   body: JSON.stringify({
  route: "getOffersForCheckout",
  funnel
})

    })
console.log("OFFERS", offers.value)

    console.log("⬅️ response status", res.status)

    const json = await res.json()

    console.log("📦 response json", json)

    if (!json.ok) {
      throw new Error(json.error?.message || "Erreur chargement offres")
    }

    offers.value = json.data
    console.log("✅ offers loaded", offers.value)

  } catch (e: any) {
    console.error("❌ fetch offers failed", e)
    error.value = e.message
  }
  finally {
    offersLoading.value = false
  }
})


onUnmounted(() => {
  document.documentElement.classList.remove("landing-mode")
  document.body.classList.remove("landing-mode")
})

// =====================
// CREATE PAYMENT INTENT
// =====================
const createIntent = async () => {
  console.log("🟢 [createIntent] called")

  error.value = null

  if (!selectedOffer.value || !resolvedEmail.value) {
    console.warn("⛔ abort: missing offer or email")
    return
  }

  loading.value = true

  try {
    const isSubscription =
      selectedOffer.value.pricing_mode === "subscription"

    const payload = isSubscription
      ? {
          route: "createEmbeddedSetupIntent",
          offer_code: selectedOffer.value.product_id,
          email: resolvedEmail.value
        }
      : {
          route: "createEmbeddedIntent",
          offer_code: selectedOffer.value.product_id,
          email: resolvedEmail.value
        }

    console.log("➡️ POST", payload.route, payload)

    const res = await fetch(getProxyPostURL(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    console.log("⬅️ HTTP status", res.status)

    const json = await res.json()
    console.log("💳 response", json)

    if (!json.ok) {
      throw new Error(json.error?.message || "Erreur paiement")
    }

    clientSecret.value = json.data.client_secret
    // 🔥 STOCKE LE CUSTOMER ICI
setupCustomerId.value = json.data.customer_id
    console.log("✅ clientSecret SET =", clientSecret.value)

  } catch (e: any) {
    console.error("❌ createIntent failed", e)
    error.value = e.message
  } finally {
    loading.value = false
  }
}



</script>


<template>
    <!-- HEADER MARKETING -->
  <MarketingHeader />
  <div class="offer-page">
    <div class="offer-container">

      <!-- ===== COLONNE MARKETING ===== -->
      <div class="offer-copy">
        <span class="badge">🎸 Formation basse en ligne</span>

        <h1 class="offer-title">
          Cours de basse en ligne avec <span class="accent">accompagnement </span>personnalisé.
        </h1>
        <h2>Ne tourne plus en rond et perfectionne ton jeu de basse</h2>
        <p class="hero-proof">
  Déjà +60 élèves accompagnés en individuel depuis 2017
</p>


<!-- 🎥 VIDEO PROMO -->
<div class="hero-video">
<video
  src="https://www.sunbassschool.com/wp-content/uploads/2023/11/promo-cours-en-visio.mp4"
  autoplay
  muted
  loop
  playsinline
  controls
>
</video>

</div>
      </div>


      <!-- ===== COLONNE CHECKOUT ===== -->
       <div class="offer-checkout-wrapper">



       <p class="offer-lead">
      Des cours de basse structurés, progressifs et concrets pour enfin
      <strong>comprendre ce que tu joues</strong> et progresser vite,
      quel que soit ton niveau.
    </p>

    <ul class="benefits">
      <li>✅ Méthode claire</li>
      <li>✅ Groove, timing, harmonie expliqués simplement</li>
      <li>✅ Exercices guidés + applications musicales réelles</li>
      <li>✅ Accès immédiat et illimité</li>
    </ul>

    <div class="proof">
      <p>🎯 Pour bassistes débutants à avancés</p>
      <p>⏱️ Progresse dès la première semaine</p>
      <p>🔒 Paiement 100 % sécurisé</p>
    </div>

  <div class="guarantee-badge">
  <span class="icon">✔</span>
  <div class="text">
    <strong>Garantie satisfait ou remboursé 14 jours</strong>
    <span>Tu testes sans risque.</span>
  </div>
</div>

</div>
    </div>

 <!-- CONTENU FULL WIDTH -->
  <section class="offer-content">
<div class="fade-separator with-cta">
  <a href="#checkout" class="separator-cta">
Prendre un cours de basse  </a>
</div>


<section class="content-block block-a">

  <div class="two-cols">
<!-- TEXTE-->
<div class="col-text">
  <h2>Un accompagnement personnalisé, pas un simple cours</h2>

  <p class="intro">
    Envie d’un vrai cadre pour progresser à la basse ?
    Le cours en visio te permet d’avancer avec méthode et clarté.
  </p>

  <ul class="features">
    <li>
       <strong>Objectif clair</strong> défini ensemble lors d’un entretien dédié
    </li>
    <li>
       <strong>Planning personnalisé</strong>, évolutif, avec un objectif précis par cours
    </li>
    <li>
       <strong>Application dédiée</strong> pour centraliser feedbacks, messages, audio, vidéo et documents
    </li>
  </ul>




<a href="#checkout" class="cta-main">
        Démarrer mon suivi personnalisé
      </a>
    </div>

    <!-- DIAPORAMA -->
    <div class="col-media">
      <!-- placeholder diapo -->
      <div class="diapo-placeholder">
        📄 Exemple de planning personnalisé
      </div>
    </div>

  </div>

</section>
<div class="fade-separator"></div>

<section class="content-block block-b">

  <h2 class="block-title">
    Une vidéo vaut mieux que 1000 mots
  </h2>

  <div class="video-wide">
    <iframe
      src="https://www.youtube.com/embed/mA_VBByeixg"
      title="Présentation cours de basse"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
  </div>
<div class="video-cta">
  <a href="#checkout" class="cta-secondary">
    Accéder aux cours maintenant
  </a>
</div>

</section>



<!-- BLOC C -->
<div class="fade-separator"></div>

<section class="content-block block-a bio-block">

  <div class="two-cols">

    <!-- PHOTO -->
    <div class="bio-photo">
      <img
        src="https://i.ibb.co/8L3qDSVD/IMG-0866-jpeg.jpg"
        alt="Sunny Adroit – professeur de basse"
      />
    </div>

    <!-- TEXTE -->
    <div class="bio-text">
      <h2>Qui suis-je ?</h2>

      <h3 class="bio-name">Sunny Adroit</h3>

      <p>
        Musicien de scène depuis plus de 13 ans, j’ai construit mon parcours
        entre concerts, transmission et recherche de sens dans la pratique musicale.
      </p>

      <p>
        J’enseigne depuis 2017 au sein d’un centre de formation professionnelle
        de musique à Toulouse, où j’ai accompagné des élèves aux profils très variés.
      </p>

      <p>
        Ces dernières années, je me suis tourné vers la pédagogie digitale
        et les cours en visioconférence, afin d’offrir plus de flexibilité
        et un meilleur suivi aux élèves.
      </p>

      <p>
        Aujourd’hui, je suis convaincu que le numérique est une vraie opportunité
        pour apprendre mieux, à condition de garder une pédagogie humaine,
        structurée et musicale.
      </p>
    </div>

  </div>

  <!-- STATS -->
  <div class="bio-stats">
    <div class="stat">
      <strong>+40</strong>
      <span>élèves accompagnés<br />en individuel</span>
    </div>

    <div class="stat">
      <strong>+500</strong>
      <span>concerts<br />live</span>
    </div>
  </div>

</section>




<!-- COMPTEUR D ABO-->
<div class="fade-separator with-cta">
  <router-link
    to="/cours-de-basse-en-ligne"
    class="separator-cta secondary"
  >
    Cours de basse en ligne
  </router-link>

  <a href="#checkout" class="separator-cta">
    Prendre un cours de basse
  </a>
</div>


<section class="content-block block-b stat-block">

  <p class="stat-label">
    Nombre d’abonnements trimestriels<br />
    <span>des élèves ayant rejoint l’aventure</span>
  </p>

  <div
    class="stat-counter"
    data-target="45"
  >
    0
  </div>

  <p class="stat-note">
    * données mises à jour régulièrement
  </p>

</section>

<div class="fade-separator"></div>

<section class="content-block block-a">

  <h2 class="block-title">
Ce que l'on pourrait travailler ensemble  </h2>

  <div class="video-wide">
    <iframe
      src="https://www.youtube.com/embed/JDtSIuszjJc?start=5"
      title="Extrait cours de basse en visio"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
  </div>

  <div class="video-cta">
    <a href="#checkout" class="cta-secondary">
      Rejoindre l’accompagnement
    </a>
  </div>

</section>


<!-- CITATION FORTE-->
<div class="fade-separator"></div>

<section class="method-block">

  <!-- CITATION -->
  <h2 class="method-title">
    Il n’a jamais été aussi simple<br />
    de prendre un cours de basse.
  </h2>

  <!-- ÉTAPES -->
  <div class="method-grid">

    <div class="method-card">
      <span class="method-num">01</span>
      <h3>Un entretien</h3>
      <p>
        Un entretien offert de 30 minutes
        pour t’aider à formuler clairement ton objectif.
      </p>
    </div>

    <div class="method-card">
      <span class="method-num">02</span>
      <h3>Un objectif</h3>
      <p>
        L’objectif devient notre fil rouge
        pour construire un planning cohérent.
      </p>
    </div>

    <div class="method-card">
      <span class="method-num">03</span>
      <h3>Un planning</h3>
      <p>
        Chaque séance est cadrée,
        tu sais toujours quoi travailler et pourquoi.
      </p>
    </div>

    <div class="method-card">
      <span class="method-num">04</span>
      <h3>Des résultats</h3>
      <p>
        Tu mesures ta progression
        et te situes clairement par rapport au point de départ.
      </p>
    </div>

  </div>

</section>


<!-- TEMOIGNAGE -->
<div class="fade-separator"></div>

<section class="content-block block-a testimonials-block">

  <h2 class="block-title">
    Ce qu’en pensent les élèves
  </h2>

  <div class="testimonials-grid">

    <div class="testimonial">
      <p class="quote">
        Prof de très bonne qualité pédagogique avec une grande capacité
        d’adaptation et d’écoute. Il se démarque par une excellente
        connaissance de son instrument et un caractère éclectique affirmé.
      </p>

      <div class="author">
        <span class="like">
  <i class="bi bi-star-fill"></i>
</span>

        <div>
          <strong>Farid Diraf</strong>
          <span>élève bassiste</span>
        </div>
      </div>
    </div>

    <div class="testimonial">
      <p class="quote">
        Très bon pédagogue et musicien de talent. Sunny montre souvent
        l’exemple et donne des références musicales pertinentes pour
        approfondir le travail technique.
      </p>

      <div class="author">
        <span class="like">
  <i class="bi bi-star-fill"></i>
</span>

        <div>
          <strong>Cyril Galy</strong>
          <span>élève bassiste</span>
        </div>
      </div>
    </div>

    <div class="testimonial">
      <p class="quote">
        Fort de son expérience live et studio, Sunny propose un programme
        personnalisé en fonction de vos objectifs, avec un cheminement clair.
      </p>

      <div class="author">
        <span class="like">
  <i class="bi bi-star-fill"></i>
</span>

        <div>
          <strong>Corentin Lrl</strong>
          <span>élève batteur</span>
        </div>
      </div>
    </div>

    <div class="testimonial">
      <p class="quote">
        Sunny est un professeur incroyable ! Passionné, à l’écoute,
        très arrangeant et très talentueux. Merci pour la motivation !
      </p>

      <div class="author">
        <span class="like">
  <i class="bi bi-star-fill"></i>
</span>

        <div>
          <strong>Yoann Danier</strong>
          <span>batteur</span>
        </div>
      </div>
    </div>

    <div class="testimonial">
      <p class="quote">
        Je savais pas quoi bosser, maintenant j’ai un plan clair chaque semaine.
        il saura vous faire progresser 🙂
      </p>

      <div class="author">
        <span class="like">
  <i class="bi bi-star-fill"></i>
</span>

        <div>
          <strong>Samuel Gonthier</strong>
          <span>élève bassiste</span>
        </div>
      </div>
    </div>

  </div>

</section>


 <!-- separator -->
<div class="fade-separator"></div>

<section class="faq-block">
  <h2>FAQ – Cours de basse en ligne</h2>

  <article class="faq-item">
    <h3>À qui s’adressent les cours de basse en ligne ?</h3>
    <p>
      Les cours s’adressent aux bassistes débutants, intermédiaires et avancés
      ayant déjà une base musicale. Le format visio n’est pas adapté si tu n’as
      jamais pratiqué la musique.
    </p>
  </article>

  <article class="faq-item">
    <h3>Comment se déroulent les cours de basse en visio ?</h3>
    <p>
      Les cours sont individuels, en visioconférence, d’une durée d’une heure,
      à raison d’un cours par semaine.
    </p>
  </article>

  <article class="faq-item">
    <h3>Que travaille-t-on pendant les cours ?</h3>
    <p>
      Technique de basse, groove, rythme, harmonie et répertoire
      (rock, funk, jazz…), selon ton niveau et tes objectifs.
    </p>
  </article>

  <article class="faq-item">
    <h3>Y a-t-il un suivi entre les cours ?</h3>
    <p>
      Oui. Après chaque séance, le professeur dépose un feedback détaillé,
      les exercices à travailler, le replay du cours et les ressources
      directement sur SunBassApp.
    </p>
  </article>

  <article class="faq-item">
    <h3>Les cours de basse en ligne sont-ils efficaces ?</h3>
    <p>
      Oui. Grâce à un encadrement structuré, un suivi précis et des retours
      objectifs, le format en ligne permet de progresser efficacement,
      même avec peu de temps disponible.
    </p>
  </article>
</section>


<div class="fade-separator"></div>

  </section>

  </div>
<div id="checkout_bg">
<section class="checkout-section" id="checkout">

  <div class="checkout-card">

    <!-- HEADER -->
    <div class="checkout-header">
      <h2>S'inscrire aux cours de basse aujourd'hui</h2>
      <p>
        Choisis ta formule et accède immédiatement
        à l’accompagnement.
      </p>
    </div>

    <!-- erreurs -->
    <div v-if="error" class="checkout-error">
      {{ error }}
    </div>

    <!-- ÉTAPE 1 : OFFRE -->
    <div class="checkout-step">
      <span class="step-label">1 · Formule</span>

      <OfferSelector
        v-if="!clientSecret"
        :offers="offers"
        :loading="offersLoading"
        v-model="selectedOffer"
      />
    </div>

    <!-- ÉTAPE 2 : EMAIL -->
    <div
      v-if="selectedOffer && !auth.user?.email && !clientSecret"
      class="checkout-step"
    >
      <span class="step-label">2 · Email</span>

      <div class="email-field">
        <label>Email</label>
        <input
          v-model="guestEmail"
          type="email"
          placeholder="email@exemple.com"
          autocomplete="email"
        />
      </div>
      <p class="email-note">
  *Aucun spam. Juste l’accès à tes cours et ton suivi.
</p>

    </div>

    <!-- ÉTAPE 3 : RÉCAP -->
    <div
      v-if="selectedOffer && resolvedEmail && !clientSecret"
      class="checkout-step"
    >
      <span class="step-label">3 · Récapitulatif</span>

      <OfferRecap
        :offer="selectedOffer"
        @pay="createIntent"
      />
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="checkout-overlay">
      <div class="overlay-box">
        <div class="spinner"></div>
        <p>Préparation du paiement sécurisé…</p>
        <span>Merci de patienter quelques secondes</span>
      </div>
    </div>

    <!-- STRIPE -->
 <PaymentElement
  v-if="clientSecret"
  :client-secret="clientSecret"
  :mode="selectedOffer.pricing_mode === 'subscription' ? 'setup' : 'payment'"
  @success="onStripeSuccess"
  @error="onStripeError"
/>


    <!-- FOOTER -->
    <div class="checkout-footer">
      🔐 Paiement sécurisé · Accès immédiat
    </div>

  </div>

</section>
</div>
</template>


<style scoped>
/* =========================
   THEME (aligné landing)
========================= */
.offer-page {
  --bg: #0b0b0f;
  --panel: #13131a;
  --panel-soft: #1b1b25;
  --text: #f8fafc;
  --muted: #9ca3af;
  --accent: #f59e0b;
  --border: rgba(255,255,255,0.08);
margin-top:25px;
  min-height: 100dvh;
  display: flex;
  justify-content: center;
    flex-direction: column; /* ← C’EST ÇA LA CLÉ */

  align-items: flex-start;
    overflow-x: hidden; /* sécurité */

  background: radial-gradient(1200px 600px at 50% -10%, #1a1a22, #0b0b0f);
  color: var(--text);
  padding: clamp(3rem, 6vh, 6rem) 1.2rem;
}
.offer-page {
  --block-a: rgba(255,255,255,0.02);
  --block-b: rgba(255,255,255,0.04);
}


.offer-container {
  margin: 0 auto; /* 👈 recentre le hero */
}

.offer-content {

  margin: 3.5rem auto 0;
}

/* bloc */
.block-a {
  background: var(--block-a);
  margin-top:35px;
}

.block-b {
  background: var(--block-b);
}

.content-block {
    max-width: none;

  border-radius: 18px;
  padding: 3rem 1.2rem;
}


/* =========================
   LAYOUT
========================= */
.offer-container {
  width: 100%;
  max-width: 1100px;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: clamp(2rem, 4vw, 3rem);
}

/* =========================
   LEFT – MARKETING
========================= */
.offer-copy {
  display: flex;
  flex-direction: column;
  justify-content: flex-start; /* au lieu de center */
  margin-bottom:-70px
}

.offer-copy .badge {
  align-self: flex-start;
}

.offer-title {
  font-size: clamp(2rem, 4vw, 2.6rem);
  font-weight: 900;
  line-height: 1.15;
}

.offer-title .accent {
  color: var(--accent);
}

.offer-lead {
  font-size: 1.05rem;
  line-height: 1.65;
  color: var(--muted);
  margin-top:55px;
  margin-bottom: 1.8rem;
}


.benefits {
  list-style: none;
  padding: 0;
  margin: 0 0 1.6rem;
}

.benefits li {
  margin-bottom: 0.6rem;
  font-size: 0.95rem;
}

.proof {
  font-size: 0.85rem;
  color: var(--muted);
  margin-bottom: 1.2rem;
}

.guarantee {
  font-size: 0.85rem;
  color: var(--accent);
  font-weight: 700;
}

/* =========================
   RIGHT – CHECKOUT
========================= */
.offer-checkout {
  background: linear-gradient(180deg, var(--panel), var(--panel-soft));
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 1.8rem;
  box-shadow:
    0 20px 50px rgba(0,0,0,0.45),
    inset 0 1px 0 rgba(255,255,255,0.03);
      position: sticky;
  top: 100px;
}

.checkout-title {
  font-size: 1.2rem;
  font-weight: 800;
  margin-bottom: 1rem;
}

/* =========================
   EMAIL
========================= */
.email-field {
  margin-top: 1.2rem;
}

.email-field label {
  font-size: 0.8rem;
  color: var(--muted);
  display: block;
  margin-bottom: 0.3rem;
}

.email-field input {
  width: 100%;
  background: #0b0b0f;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.65rem 0.75rem;
  color: var(--text);
}

.email-field input:focus {
  outline: none;
  border-color: rgba(245,158,11,0.5);
}

/* =========================
   CHECKOUT NOTE / STATUS
========================= */
.checkout-note {
  margin-top: 1.2rem;
  font-size: 0.75rem;
  color: var(--muted);
  text-align: center;
}

.error {
  color: #f87171;
  font-size: 0.85rem;
  margin-bottom: 0.8rem;
}

/* =========================
   CTA BUTTONS (reuse global)
========================= */
.btn {
  border-radius: 14px;
  font-weight: 800;
}

.btn-primary {
  background: var(--accent);
  color: #000;
}

/* =========================
   MOBILE
========================= */
@media (max-width: 768px) {
  .offer-container {
    grid-template-columns: 1fr;
  }

  .offer-copy {
    text-align: center;
  }

  .offer-copy .badge {
    align-self: center;
  }
}

/* ===== CHECKOUT LOADING OVERLAY ===== */
.checkout-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;

  display: flex;
  align-items: center;
  justify-content: center;

  background: linear-gradient(
    180deg,
    rgba(11,11,15,0.85),
    rgba(11,11,15,0.95)
  );

  backdrop-filter: blur(4px);
  border-radius: 22px;
}

.overlay-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;

  padding: 1.6rem 1.8rem;
  background: linear-gradient(180deg, var(--panel), var(--panel-soft));
  border: 1px solid var(--border);
  border-radius: 18px;

  box-shadow:
    0 20px 50px rgba(0,0,0,0.45);
}

.overlay-box p {
  font-weight: 700;
  font-size: 0.95rem;
}

.overlay-box span {
  font-size: 0.75rem;
  color: var(--muted);
}

/* spinner réutilisable */
.spinner {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.12);
  border-top-color: var(--accent);
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* video promo */
.hero-video {
  margin: 1.5rem 0;
  max-width: 680px;
}

.hero-video video {
  width: 100%;
  border-radius: 12px;
}

.offer-container {
  align-items: start;
}

.offer-checkout-wrapper {
  align-self: start;
}

.offer-checkout {
  position: sticky;
  top: 100px;
}
.offer-content .offer-checkout {
  max-width: 680px;
  margin: 0 auto;
}


/* separator */
.fade-separator {
  height: 1px;
  width: 100%;
  max-width: 680px;
  margin: 3rem auto 2rem;
  background: linear-gradient(
    to right,
    transparent,
    rgba(255,255,255,0.25),
    transparent
  );
}


/* bloc diapo */
.two-cols {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 3rem;
  align-items: center;
    max-width: 1100px;
  margin: 0 auto;
}

.col-text p {
  color: var(--muted);
  margin-bottom: 1rem;
  line-height: 1.6;
}

.col-media {
  display: flex;
  align-items: center;
  justify-content: center;
}

.diapo-placeholder {
  width: 100%;
  height: 380px;
  background: linear-gradient(180deg, var(--panel), var(--panel-soft));
  border: 1px solid var(--border);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .two-cols {
    grid-template-columns: 1fr;
  }

  .col-text {
    text-align: center;
  }
}

/* CTA */
.cta-main {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;

  margin-top: 1.8rem;
  padding: 0.85rem 1.6rem;

  font-size: 0.9rem;
  font-weight: 800;
  letter-spacing: 0.02em;

  color: #0b0b0f;
  background: linear-gradient(
    135deg,
    #fbbf24,
    #f59e0b
  );

  border-radius: 999px;
  border: none;
  text-decoration: none;

  box-shadow:
    0 10px 30px rgba(245,158,11,0.35),
    inset 0 1px 0 rgba(255,255,255,0.35);

  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.cta-main:hover {
  transform: translateY(-1px);
  box-shadow:
    0 14px 38px rgba(245,158,11,0.45),
    inset 0 1px 0 rgba(255,255,255,0.45);
}

.cta-main:active {
  transform: translateY(0);
  box-shadow:
    0 6px 18px rgba(245,158,11,0.3),
    inset 0 1px 0 rgba(255,255,255,0.25);
}
/* TEXTE */
.col-text .intro {
  color: var(--muted);
  margin-bottom: 1.2rem;
  line-height: 1.6;
}

.features {
  list-style: none;
  padding: 0;
  margin: 0 0 1.6rem;
}

.features li {
  margin-bottom: 0.7rem;
  font-size: 0.95rem;
  line-height: 1.5;
}


/* separator + CTA */
.fade-separator.with-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.2rem;

  margin: 2.5rem auto 2rem;
  max-width: 680px;
}

.fade-separator.with-cta::before,
.fade-separator.with-cta::after {
  content: "";
  flex: 1;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(255,255,255,0.25),
    transparent
  );
}

/* CTA intégré */
.separator-cta {
  position: relative;
  z-index: 1;

  padding: 0.6rem 1.4rem;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  color: #0b0b0f;
  background: linear-gradient(
    135deg,
    #fbbf24,
    #f59e0b
  );

  border-radius: 999px;
  border: none;
  text-decoration: none;
  white-space: nowrap;

  box-shadow:
    0 6px 18px rgba(245,158,11,0.45),
    inset 0 1px 0 rgba(255,255,255,0.45);

  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.separator-cta:hover {
  transform: translateY(-1px);
  box-shadow:
    0 10px 26px rgba(245,158,11,0.55),
    inset 0 1px 0 rgba(255,255,255,0.55);
}

/* .guarantee */
.guarantee-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;

  margin-top: 1.6rem;
  padding: 0.6rem 1rem;

  background: rgba(245,158,11,0.08);
  border: 1px solid rgba(245,158,11,0.35);
  border-radius: 14px;

  font-size: 0.8rem;
  line-height: 1.3;
}

.guarantee-badge .icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--accent);
  color: #0b0b0f;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 0.75rem;
}

.guarantee-badge .text strong {
  display: block;
  color: var(--accent);
  font-weight: 800;
}

.guarantee-badge .text span {
  color: var(--muted);
  font-size: 0.75rem;
}

/* bloc b */
.block-b {
  background: var(--block-b);
}

.block-title {
  text-align: center;
  font-size: 1.9rem;
  font-weight: 900;
  margin-bottom: 2rem;
}

.video-wide {
  position: relative;
  max-width: 1100px;
  margin: 0 auto;
  padding-top: 56.25%; /* 16:9 */
  border-radius: 18px;
  overflow: hidden;

  box-shadow:
    0 25px 60px rgba(0,0,0,0.45);
}

.video-wide iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.video-cta {
  display: flex;
  justify-content: center;
  margin-top: 1.8rem;
}

.cta-secondary {
  padding: 0.6rem 1.4rem;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  color: var(--accent);
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.45);
  border-radius: 999px;

  text-decoration: none;

  transition: background 0.15s ease, transform 0.15s ease;
}

.cta-secondary:hover {
  background: rgba(245,158,11,0.2);
  transform: translateY(-1px);
}

/* BIO */
.bio-block {
  padding: 4rem 1.2rem;
}

.bio-photo {
  display: flex;
  align-items: center;
  justify-content: center;
}

.bio-photo img {
  width: 70%;
  max-width: 220px;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  border-radius: 18px;

  box-shadow:
    0 25px 60px rgba(0,0,0,0.45);
}

.bio-text h2 {
  font-size: 1.9rem;
  font-weight: 900;
  margin-bottom: 0.4rem;
}

.bio-name {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--accent);
  margin-bottom: 1.4rem;
}

.bio-text p {
  color: var(--muted);
  line-height: 1.65;
  margin-bottom: 1rem;
}

.bio-stats {
  display: flex;
  justify-content: center;
  gap: 4rem;
  margin-top: 3rem;
}

.stat {
  text-align: center;
}

.stat strong {
  font-size: 2.4rem;
  font-weight: 900;
  color: var(--accent);
  display: block;
}

.stat span {
  font-size: 0.85rem;
  color: var(--muted);
  line-height: 1.3;
}


/* compteur d'abo */
.stat-block {
  text-align: center;
  padding: 4rem 1.2rem;
}

.stat-label {
  font-size: 1rem;
  font-weight: 700;
  color: var(--muted);
  margin-bottom: 1.2rem;
}

.stat-label span {
  font-size: 0.8rem;
  font-weight: 500;
}

.stat-counter {
  font-size: clamp(3rem, 8vw, 4.5rem);
  font-weight: 900;
  color: var(--accent);
  line-height: 1;
  letter-spacing: -0.03em;
}

.stat-note {
  margin-top: 1rem;
  font-size: 0.7rem;
  color: var(--muted);
}


/* citation forte */
.method-block {
  padding: 4rem 1.2rem;
  text-align: center;
}

/* citation */
.method-title {
  max-width: 900px;
  margin: 0 auto 3rem;
  margin-top:-40px;
  font-size: clamp(2rem, 4vw, 2.6rem);
  font-weight: 900;
  line-height: 1.2;
}

/* grille */
.method-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.8rem;
  max-width: 1100px;
  margin: 0 auto;
}

/* cartes */
.method-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 1.6rem 1.4rem;
  text-align: left;
}

.method-num {
  display: block;
  font-size: 1.4rem;
  font-weight: 900;
  color: var(--accent);
  margin-bottom: 0.6rem;
}

.method-card h3 {
  font-size: 1rem;
  font-weight: 800;
  margin-bottom: 0.4rem;
}

.method-card p {
  font-size: 0.9rem;
  color: var(--muted);
  line-height: 1.5;
}
@media (max-width: 900px) {
  .method-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 520px) {
  .method-grid {
    grid-template-columns: 1fr;
  }

  .method-card {
    text-align: center;
  }
}
.method-card {
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease;
}

.method-card:hover {
  transform: translateY(-4px);
  background: rgba(255,255,255,0.05);
  border-color: rgba(245,158,11,0.35);

  box-shadow:
    0 12px 30px rgba(0,0,0,0.35);
}
.method-card:hover .method-num {
  color: #fbbf24;
}

/* témoignage */
.testimonials-block {
  padding: 4rem 1.2rem;
}

.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.8rem;
  max-width: 1100px;
  margin: 0 auto;
}

.testimonial {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 1.6rem 1.4rem;

  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.quote {
  font-size: 0.9rem;
  color: var(--muted);
  line-height: 1.55;
  margin-bottom: 1.4rem;
}

.author {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.like {
  font-size: 1.2rem;
}

.author strong {
  display: block;
  font-size: 0.85rem;
}

.author span {
  font-size: 0.75rem;
  color: var(--muted);
}
.like i {
  color: rgba(245,158,11,0.8);
  font-size: 0.98rem;
  display: flex;
  align-items: center;
}


.checkout_bg
{
  background-color:black;
}
/* checkout section */
.checkout-section {
    background: rgb(255, 255, 255);

  padding: 4rem 1.2rem 5rem;
}

.checkout-card {
  max-width: 680px;
  margin: 0 auto;

  background: linear-gradient(180deg, var(--panel), var(--panel-soft));
  border: 1px solid var(--border);
  border-radius: 24px;

  padding: 2.2rem 2rem;

  box-shadow:
    0 30px 70px rgba(0,0,0,0.45);
}

/* header */
.checkout-header {
  text-align: center;
  margin-bottom: 2rem;
}

.checkout-header h2 {
  font-size: 1.6rem;
  font-weight: 900;
  margin-bottom: 0.4rem;
}

.checkout-header p {
  font-size: 0.9rem;
  color: var(--muted);
}

/* étapes */
.checkout-step {
  margin-bottom: 1.6rem;
}

.step-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 0.6rem;
}

/* erreurs */
.checkout-error {
  background: rgba(248,113,113,0.12);
  border: 1px solid rgba(248,113,113,0.35);
  border-radius: 12px;
  padding: 0.6rem 0.8rem;
  font-size: 0.8rem;
  margin-bottom: 1.2rem;
}

/* footer */
.checkout-footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.75rem;
  color: var(--muted);
}
.email-note {
  font-size: 0.7rem;
  color: var(--muted);
  margin-top: 0.3rem;
}
.offer-page,
.offer-container,
.offer-content,
.content-block,
 {
  max-width: 100%;
  overflow-x: hidden;
}


/* RESPONSIVE CODE */
@media (max-width: 768px) {
  .offer-page {
    align-items: center;
    padding: 2.2rem 1rem;
  }

  .offer-container {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}
@media (max-width: 768px) {
  .offer-copy {
    margin-bottom: 0;
  }
}
@media (max-width: 768px) {
  .hero-video {
    max-width: 100%;
  }
}
@media (max-width: 768px) {
  .offer-checkout {
    position: static;
    top: auto;
  }
}
@media (max-width: 768px) {
  .offer-title {
    font-size: 1.9rem;
    text-align: center;
  }

  .offer-lead {
    margin-top: 1.2rem;
    text-align: center;
  }

  .benefits,
  .proof {
    text-align: left;
  }

  .content-block {
    padding: 2rem 1rem;
  }
}

@media (max-width: 768px) {
  .testimonials-grid {
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }
}

/* FAQ BLOC */
.faq-block {
  max-width: 900px;
  margin: 4rem auto 0;
  padding: 2.5rem 1.2rem;
}

.faq-block h2 {
  text-align: center;
  font-size: 1.8rem;
  font-weight: 900;
  margin-bottom: 2.5rem;
}

.faq-item {
  margin-bottom: 1.6rem;
}

.faq-item h3 {
  font-size: 1rem;
  font-weight: 800;
  margin-bottom: 0.4rem;
}

.faq-item p {
  font-size: 0.9rem;
  color: var(--muted);
  line-height: 1.6;
}
@media (max-width: 768px) {
  .fade-separator.with-cta {
    flex-direction: column;
    gap: 0.8rem;
  }
}

</style>

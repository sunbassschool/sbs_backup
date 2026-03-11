<script setup lang="ts">
type StripeSuccessRes = {
  paymentIntent?: any
  setupIntent?: any
}

import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useAuthStore } from "@/stores/authStore.js"
import { getProxyPostURL, gasPost } from "@/config/gas"
import { useHead } from "@vueuse/head"
import MarketingFooter from "@/components/MarketingFooter.vue"

import MarketingHeader from "@/components/MarketingHeader.vue"
import OfferSelector from "@/components/cartflow/Payments/OfferSelector.vue"
import OfferRecap from "@/components/cartflow/Payments/OfferRecap.vue"
import PaymentElement from "@/components/cartflow/Payments/PaymentElement.vue"

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)
const openFaq = ref<number | null>(null)

const toggleFaq = (index: number) => {
  openFaq.value = openFaq.value === index ? null : index
}

const faqItems = [
  {
    q: "Ce module convient-il aux débutants ?",
    a: "Oui. Les principes sont expliqués étape par étape et applicables immédiatement à la basse."
  },
  {
 q: "Faut-il connaître le solfège ?",
  a: "Non. Tu n’as pas besoin de savoir lire la musique. Tout est expliqué de manière visuelle et pratique, directement sur le manche, avec des exemples simples et une vidéo explicative détaillée."
  },
  {
    q: "Est-ce adapté à tous les styles ?",
    a: "Oui. Les principes d’improvisation cadentielle fonctionnent en jazz, pop, funk et musique actuelle."
  }
]

const stickyCta = ref<HTMLElement | null>(null)
let checkoutObserver: IntersectionObserver | null = null
let shown = false
let onScroll: ((this: Window, ev: Event) => any) | null = null

// =====================
// SEO
// =====================
useHead({
  title: "Improvisation à la basse – Méthode cadentielle pour solos mélodiques | SunBassSchool",
  meta: [
    {
      name: "description",
      content:
        "Apprends l’improvisation à la basse grâce à une méthode cadentielle claire et musicale. Harmonie appliquée, solos mélodiques et direction rythmique. Accès immédiat."
    },
    {
      property: "og:title",
      content: "Improvisation cadentielle à la basse"
    },
    {
      property: "og:description",
      content:
        "Une méthode claire pour improviser des solos mélodiques et cohérents à la basse."
    },
    {
      property: "og:type",
      content: "website"
    },
    {
      property: "og:url",
      content: "https://www.sunbassschool.com/improvisationcadentielle"
    }
  ],
  link: [
    {
      rel: "canonical",
      href: "https://www.sunbassschool.com/improvisationcadentielle"
    }
  ],
  script: [
  {
    key: "impro-video-schema",
    type: "application/ld+json",
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": "Improvisation à la basse – Méthode cadentielle",
      "description":
        "Présentation de la méthode d’improvisation cadentielle à la basse pour construire des solos mélodiques et cohérents.",
      "thumbnailUrl": "https://www.sunbassschool.com/wp-content/uploads/2023/11/promo-cours-en-visio.jpg",
      "uploadDate": "2026-02-20T00:00:00+01:00",
      "datePublished": "2026-02-20T00:00:00+01:00",
"duration": "PT1M41S",
      "contentUrl": "https://www.sunbassschool.com/wp-content/uploads/2023/11/promo-cours-en-visio.mp4",
      "embedUrl": "https://www.sunbassschool.com/improvisationcadentielle"
    })
  }
]
})



// =====================
// CONST
// =====================
const funnel =
  (route.query.funnel as string) || "improvisation_cadentielle"
// =====================
// STATE
// =====================
const offers = ref<any[]>([])
const selectedOffer = ref<any | null>(null)

const guestEmail = ref("")
const clientSecret = ref<string | null>(null)
const setupCustomerId = ref<string | null>(null)

const preparing = ref(false)
const paying = ref(false)
const paymentDone = ref(false)
const subscriptionInProgress = ref(false)
const checkoutLocked = ref(false)

const offersLoading = ref(true)
const error = ref<string | null>(null)

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
 await nextTick()
  requestAnimationFrame(() => {
    const targets = [
      document.scrollingElement,
      document.documentElement,
      document.body,
      document.querySelector("#app"),
      document.querySelector(".offer-page"),
    ].filter(Boolean) as HTMLElement[]

    targets.forEach(t => (t.scrollTop = 0))
    window.scrollTo(0, 0)
  })
  document.documentElement.classList.add("landing-mode")
  document.body.classList.add("landing-mode")

  try {
    const res = await fetch(getProxyPostURL(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "getOffersForCheckout",
        funnel
      })
    })

    const json = await res.json()
    if (!json.ok) throw new Error(json.error?.message || "Erreur chargement offres")

    offers.value = json.data
  } catch (e: any) {
    error.value = e.message
  } finally {
    offersLoading.value = false
  }

    const el = stickyCta.value
  const checkoutEl = document.getElementById("checkout")
  if (!el) return

  // 1) apparition retardée (1.2s)
  setTimeout(() => {
    el.classList.add("is-visible")
    shown = true
  }, 1200)

  // 2) changement de texte après scroll
onScroll = () => {
  if (!el || !shown) return
  el.textContent =
    window.scrollY > 420
      ? "🎸 Rejoindre les cours"
      : "🎸 Voir les formules"
}

  window.addEventListener("scroll", onScroll, { passive: true })

  // 3) hide auto quand checkout visible
  if (checkoutEl) {
    checkoutObserver = new IntersectionObserver(
      ([entry]) => {
        if (!el) return
        el.style.opacity = entry.isIntersecting ? "0" : "1"
        el.style.pointerEvents = entry.isIntersecting ? "none" : "auto"
      },
      { threshold: 0.25 }
    )
    checkoutObserver.observe(checkoutEl)}
})

onUnmounted(() => {
  document.documentElement.classList.remove("landing-mode")
  document.body.classList.remove("landing-mode")

  if (onScroll) {
    window.removeEventListener("scroll", onScroll)
  }

  checkoutObserver?.disconnect()
})



// =====================
// SCROLL RECAP
// =====================
const onContinue = () => {
  requestAnimationFrame(() => {
    document.getElementById("recap")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    })
  })
}

// =====================
// CREATE INTENT
// =====================
const createIntent = async () => {
  if (checkoutLocked.value) return
  if (!selectedOffer.value || !resolvedEmail.value) return

  checkoutLocked.value = true
  preparing.value = true
  error.value = null

  try {
    const isSubscription =
      selectedOffer.value.pricing_mode === "subscription"

    const json = await gasPost(
      isSubscription
        ? "createEmbeddedSetupIntent"
        : "createEmbeddedIntent",
      {
        product_id: selectedOffer.value.product_id,
        droit_code: selectedOffer.value.droit_code,
        email: resolvedEmail.value
      }
    )

    if (!json?.ok) throw new Error("Erreur paiement")

    clientSecret.value =
      json.data?.client_secret || json.client_secret

    setupCustomerId.value =
      json.data?.customer_id || json.customer_id
  } catch (e: any) {
    checkoutLocked.value = false
    error.value = e.message
  } finally {
    preparing.value = false
  }
}

// =====================
// STRIPE CALLBACKS
// =====================
const onStripeSuccess = async (res: StripeSuccessRes) => {
  // ONE TIME
if (selectedOffer.value?.pricing_mode === "one_time") {
  const pi = res?.paymentIntent
  if (pi?.status !== "succeeded") return
  if (paymentDone.value) return

  paymentDone.value = true
  paying.value = false

  // 🔥 GOOGLE ADS CONVERSION (ONE TIME)
  if (window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: 'AW-17922401091/EIv7CNWHpfEbEMPGiOJC',
      transaction_id: pi.id,
      value: pi.amount / 100,
      currency: pi.currency.toUpperCase()
    })
  }

  router.replace("/thankyou")
  return
}


  // SUBSCRIPTION
  if (paymentDone.value) return
  paymentDone.value = true

  const si = res?.setupIntent
  if (!si || si.status !== "succeeded") return
  if (!setupCustomerId.value) return
  if (subscriptionInProgress.value) return

  subscriptionInProgress.value = true

  await gasPost("createSubscriptionFromSetup", {
    product_id: selectedOffer.value.product_id,
    droit_code: selectedOffer.value.droit_code,
    email: resolvedEmail.value,
    customer_id: setupCustomerId.value,
    setup_intent_id: si.id
  })

  router.replace(
    `/thankyou?pending=1&email=${encodeURIComponent(resolvedEmail.value)}`
  )
}

const onStripeError = (msg: string) => {
  error.value = msg
  checkoutLocked.value = false
  paying.value = false
}

// =====================
// DEBUG
// =====================
watch(paying, v => console.log("🧠 paying =", v))
</script>

<template>
  <MarketingHeader />

  <div class="offer-page">
    <!-- HERO -->
    <div class="offer-container">
      <!-- LEFT -->
      <div class="offer-copy">
        <span class="badge">🎸 Module pédagogique – Basse soliste</span>

        <h1 class="offer-title">
        Improvisation à la basse :
<span class="accent">méthode cadentielle</span> pour solos mélodiques
        </h1>
<p class="seo-intro">
  Méthode complète pour apprendre à improviser à la basse
  en utilisant les cadences harmoniques et une vraie direction mélodique.
</p>

        <p class="hero-proof">
          Développe l’aspect <strong>mélodique</strong> de tes solos et deviens
          un vrai soliste audible, cohérent et musical.
        </p>
        <p class="hero-bridge">
  Si tu préfères un accompagnement individualisé avec suivi
  et feedback en direct, découvre aussi mes
  <a href="/cours-de-basse-en-ligne">
    cours de basse en ligne personnalisés
  </a>.
</p>

        <div class="hero-video">
          <video
            src="https://www.sunbassschool.com/wp-content/uploads/2023/11/promo-cours-en-visio.mp4"
            autoplay
            muted
            loop
            playsinline
            preload="none"
          ></video>
        </div>

        <div class="proof">
          <p>🎵 Approche moderne & musicale</p>
          <p>🧠 Harmonie pensée pour la tessiture réelle de la basse</p>
          <p>🎯 Tous niveaux · aucun prérequis théorique lourd</p>
        </div>

        <a href="#checkout" class="cta-main">Commencer la méthode</a>
      </div>

      <!-- RIGHT -->
      <div class="offer-checkout-wrapper">
        <p class="offer-lead">
          Pendant longtemps, les solos de basse étaient inutiles,
          inaudibles, prétexte à discuter avec son voisin.
          <br /><br />
          Aujourd’hui, la <strong>connaissance harmonique</strong> est une qualité
          recherchée chez les bassistes.
          <br />
          <strong>On nous entend enfin.</strong>
        </p>

        <ul class="benefits">
          <li>✅ Solos mélodiques et audibles</li>
          <li>✅ Direction claire dans l’impro</li>
          <li>✅ Connexion rythme & harmonie</li>
          <li>✅ Compréhension réelle du manche</li>
        </ul>

        <div class="guarantee-badge">
          <span class="icon">✔</span>
          <div class="text">
            <strong>Méthode reproductible</strong>
            <span>pas de plans, pas de par cœur</span>
          </div>
        </div>


      </div>
    </div>

    <!-- CONTENT -->
    <section class="offer-content">
      <!-- BLOCK A : PROBLÈME -->
      <section class="content-block block-a">
        <div class="two-cols">
          <div class="col-text">
            <h2>Pourquoi tant de solos sonnent faux ?</h2>

            <p class="intro">
              Dans l’enseignement traditionnel de la basse, il existe
              un décalage énorme entre le contenu pédagogique
              et la réalité de la basse moderne.
            </p>

            <ul class="features">
              <li>❌ Harmonie pensée pour le piano</li>
              <li>❌ Tessiture réelle jamais exploitée</li>
              <li>❌ Rythme et harmonie traités séparément</li>
            </ul>

            <p class="intro">
              Résultat : des solos techniques,
              mais sans discours musical clair.
            </p>
            <p class="mini-bridge">
  Si tu veux d’abord comprendre les bases de manière simple,
  tu peux commencer par la
  <a href="/masterclass">
    masterclass basse gratuite
  </a>.
</p>
          </div>

          <div class="col-media">
            <div class="diapo-placeholder">
              🎵 Solos techniques ≠ solos mélodiques
            </div>
          </div>
        </div>
      </section>

      <div class="fade-separator"></div>

      <!-- BLOCK B : PROMESSE -->
      <section class="content-block block-b">
        <h2 class="block-title">
          Une approche simple, logique et musicale
        </h2>

        <p class="intro" style="max-width: 820px; margin: 0 auto; text-align:center">
          Ce module te donne les outils pour improviser avec une
          <strong>intention mélodique claire</strong>,
          en reliant enfin harmonie, rythme et direction.
        </p>

        <div class="video-cta">
          <a href="#checkout" class="cta-secondary">
            Accéder au module
          </a>
        </div>
      </section>

      <div class="fade-separator"></div>

      <!-- BLOCK A : CONTENU -->
      <section class="content-block block-a">
        <div class="two-cols">
          <div class="col-text">
            <h2>Ce que tu vas travailler</h2>

            <ul class="features">
              <li>
                <strong>Cadences</strong> : cadrer tes improvisations avec
                des suites harmoniques simples et mémorisables.
              </li>
              <li>
                <strong>Chant intérieur</strong> : construire une vraie mélodie
                à partir des top-notes et accords de 10e.
              </li>
              <li>
                <strong>Rampes de lancement</strong> :
                relier chaque note cible avec logique et fluidité.
              </li>
            </ul>

            <p class="intro">
              Tu sais toujours où tu vas,
              et pourquoi tu joues chaque note.
            </p>
          </div>

          <div class="col-media">
            <div class="diapo-placeholder">
              🚀 Direction · Mélodie · Cohérence
            </div>
          </div>
        </div>
      </section>

      <div class="fade-separator"></div>
<section class="content-block block-b impro-explain">
  <div class="explain-inner">

    <h2>Comment improviser à la basse sans jouer au hasard ?</h2>

    <p>
      Improviser à la basse ne consiste pas à enchaîner des gammes.
      Cette méthode repose sur les <strong>cadences harmoniques</strong>,
      la compréhension des accords et la construction
      d’un discours mélodique cohérent.
    </p>

    <p>
      Tu apprends à relier harmonie et rythme pour créer
      de vrais solos audibles et musicaux,
      quel que soit le style.
    </p>

    <div class="explain-bridge">
      <p>
        Pour aller plus loin avec un travail encadré et personnalisé,
        ces principes peuvent être approfondis dans le cadre de
        <a href="/cours-de-basse-en-ligne">
          cours de basse en ligne personnalisés
        </a>.
      </p>
    </div>

  </div>
</section>

      <div class="fade-separator"></div>

      <!-- BLOCK B : RÉSULTATS -->
      <section class="content-block block-b">
        <h2 class="block-title">Résultats concrets</h2>

        <div class="method-grid">
          <div class="method-card">
            <span class="method-num">01</span>
            <h3>Solos mélodiques</h3>
            <p>Tu improvises avec un vrai discours musical.</p>
          </div>

          <div class="method-card">
            <span class="method-num">02</span>
            <h3>Manche compris</h3>
            <p>Les positions deviennent logiques et connectées.</p>
          </div>

          <div class="method-card">
            <span class="method-num">03</span>
            <h3>Fluidité rythmique</h3>
            <p>Harmonie et groove fonctionnent ensemble.</p>
          </div>

          <div class="method-card">
            <span class="method-num">04</span>
            <h3>Autonomie</h3>
            <p>Tu improvises sans dépendre de plans appris.</p>
          </div>
        </div>
      </section>

      <div class="fade-separator with-cta">
        <a href="#checkout" class="separator-cta">J’en profite</a>
      </div>
<section class="content-block block-b faq-premium">
  <h2 class="block-title">Questions fréquentes</h2>

  <div class="faq-item" v-for="(item, i) in faqItems" :key="i">
    <button
      class="faq-question"
      @click="toggleFaq(i)"
      :class="{ open: openFaq === i }"
    >
      <span>{{ item.q }}</span>
      <span class="icon">+</span>
    </button>

    <div
      class="faq-answer"
      v-show="openFaq === i"
    >
      <p>{{ item.a }}</p>
    </div>
  </div>
</section>

<section class="content-block block-b business-bridge">
  <h2>Aller encore plus loin</h2>

  <p class="intro" style="max-width:820px;margin:0 auto;text-align:center">
    Ce module t’apporte une méthode claire.
    Si tu souhaites travailler tes solos en direct,
    corriger tes erreurs et progresser plus vite,
    tu peux aussi rejoindre mes
    <a href="/cours-de-basse-en-ligne">
      cours de basse en ligne personnalisés
    </a>
    en visioconférence.
  </p>

  <div class="video-cta">
    <a href="/cours-de-basse-en-ligne" class="cta-secondary">
      Voir les cours en ligne
    </a>
  </div>
</section>

      <!-- OFFRE -->
      <section class="content-block block-a">
        <h2 class="block-title">Offre de lancement</h2>

        <p class="intro" style="text-align:center">
          🎁 <strong>–50%</strong> avec le code de réduction<br />
          Offre limitée dans le temps
        </p>

        <div class="video-cta">
          <a href="#checkout" class="cta-main">J’en profite maintenant</a>
        </div>
      </section>
    </section>
  </div>

  <!-- CHECKOUT -->
  <div id="checkout_bg">
    <section class="checkout-section" id="checkout">
      <div class="checkout-card">
        <div class="checkout-header">
          <h2>Accéder au module aujourd’hui</h2>
          <p>Accès immédiat · Paiement sécurisé</p>
        </div>

        <OfferSelector
          v-if="!clientSecret"
          :offers="offers"
          :loading="offersLoading"
          v-model="selectedOffer"
        />
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
</div>

        <OfferRecap
          v-if="selectedOffer && resolvedEmail && !clientSecret"
          :offer="selectedOffer"
          @pay="createIntent"
        />

        <PaymentElement
          v-if="clientSecret && !paymentDone"
          :client-secret="clientSecret"
          :mode="selectedOffer?.pricing_mode === 'one_time' ? 'payment' : 'setup'"
          :email="resolvedEmail"
          @paying="paying = $event"
          @success="onStripeSuccess"
          @error="onStripeError"
        />

        <div class="checkout-footer">
          🔐 Paiement sécurisé · Accès immédiat
        </div>
      </div>
    </section>
  </div>

  <!-- CTA STICKY MOBILE -->
  <a href="#checkout" class="cta-sticky-mobile" ref="stickyCta">
    🎸 Accéder au module
  </a>
  <MarketingFooter />

</template>


<style scoped>

.bio-photo img {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  height: auto;
}

/* =========================
   THEME (copié offer page)
========================= */
.offer-page {
--bg: #0b0b0f;
--panel: #13131a;
--panel-soft: #1b1b25;

  --text: #f8fafc;
  --muted: #9ca3af;
  --accent: #f59e0b;
  --border: rgba(255,255,255,0.08);

  --block-a: rgba(180, 22, 22, 0.02);
  --block-b: rgba(255,255,255,0.04);

  margin-top: 25px;
  min-height: 100dvh;
  display: flex;
  justify-content: center;
  flex-direction: column;
align-items: flex-start;
  background: radial-gradient(1200px 600px at 50% -10%, #000000, #0b0b0f);
  color: var(--text);
  padding: clamp(3rem, 6vh, 6rem) 1.2rem;
  overflow-x: hidden;
}

.offer-container {
  width: 100%;
  max-width: 1100px;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: clamp(2rem, 4vw, 3rem);
  align-items: start;
  margin: 0 auto;
}

.offer-copy {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.offer-copy .badge {
  align-self: flex-start;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.35);
  color: var(--accent);
  font-weight: 900;
  font-size: 0.75rem;
  letter-spacing: 0.03em;
}

.offer-title {
  font-size: clamp(2rem, 4vw, 2.6rem);
  font-weight: 900;
  line-height: 1.15;
  margin: 1rem 0 0.6rem;
}

.offer-title .accent {
  color: var(--accent);
}

.hero-proof {
  color: var(--muted);
  margin: 0.2rem 0 1rem;
  font-size: 0.95rem;
}

.hero-video {
  margin: 1.2rem 0 1rem;
  max-width: 680px;
}

.hero-video video {
  width: 100%;
  border-radius: 12px;
}

.offer-lead {
  font-size: 1.05rem;
  line-height: 1.65;
  color: var(--muted);
  margin: 0 0 1.2rem;
}

.benefits {
  list-style: none;
  padding: 0;
  margin: 0 0 1.2rem;
}

.benefits li {
  margin-bottom: 0.6rem;
  font-size: 0.95rem;
}

.proof {
  font-size: 0.85rem;
  color: var(--muted);
  margin-top: 0.8rem;
}

.offer-checkout-wrapper {
  align-self: start;
  margin-top:140px;
}

.guarantee-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  margin-top: 0.6rem;
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

/* CONTENT */
.offer-content {
  width: 100%;
  margin: 3.5rem auto 0;
}

.content-block {
  border-radius: 18px;
  padding: 3rem 1.2rem;
  max-width: none;
}

.block-a {
  background: rgba(255,255,255,0.02);
}

.block-b {
  background: rgba(255,255,255,0.04);
}


.fade-separator {
  height: 1px;
  width: 100%;
  max-width: 680px;
  margin: 3rem auto 2rem;
  background: linear-gradient(
    to right,
    transparent,
    rgba(255,255,255,0.12),
    transparent
  );
}


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
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent);
}

.separator-cta {
  padding: 0.6rem 1.4rem;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #0b0b0f;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-radius: 999px;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: 0 6px 18px rgba(245,158,11,0.45), inset 0 1px 0 rgba(255,255,255,0.45);
}

.cta-main {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  margin-top: 1.2rem;
  padding: 0.85rem 1.8rem;

  font-size: 0.9rem;
  font-weight: 800;
  letter-spacing: 0.02em;

  color: #111;
  background: linear-gradient(
    90deg,
    rgba(245,158,11,0.95),
    rgba(241,120,99,0.95)
  );

  border-radius: 999px;
  text-decoration: none;

  box-shadow: 0 10px 28px rgba(245,158,11,0.25);

  transition: all 0.25s ease;
}

.cta-main:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 40px rgba(245,158,11,0.35);
}


.video-cta {
  display: flex;
  justify-content: center;
  gap: 0.8rem;
  margin-top: 1.8rem;
  flex-wrap: wrap;
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
}

/* Two cols blocks */
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

/* Method grid (reuse) */
.block-title {
  text-align: center;
  font-size: 1.9rem;
  font-weight: 900;
  margin-bottom: 2rem;
}

.method-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.8rem;
  max-width: 1100px;
  margin: 0 auto;
}

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

/* Bio */
.bio-block {
  padding: 4rem 1.2rem;
}

.bio-photo img {
  width: 70%;
  max-width: 220px;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  border-radius: 18px;
  box-shadow: 0 25px 60px rgba(0,0,0,0.45);
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
  gap: 2.5rem;
  margin-top: 3rem;
  flex-wrap: wrap;
}

.stat {
  text-align: center;
}

.stat strong {
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--accent);
  display: block;
}

.stat span {
  font-size: 0.85rem;
  color: var(--muted);
  line-height: 1.3;
}

/* FAQ */
.faq-block {
  max-width: 900px;
  margin: 0 auto;
}

.faq-block h2 {
  text-align: center;
  font-size: 1.8rem;
  font-weight: 900;
  margin-bottom: 2.2rem;
}

.faq-item {
  margin-bottom: 1.4rem;
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

/* Checkout wrapper */
#checkout_bg {
  background: #fff;
  padding: 4rem 1.2rem 5rem;
}

.checkout-card {
  max-width: 680px;
  margin: 0 auto;
  background: linear-gradient(180deg, var(--panel), var(--panel-soft));
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 2.2rem 2rem;
  box-shadow: 0 30px 70px rgba(0,0,0,0.45);
}

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

/* Responsive */
@media (max-width: 768px) {
  .offer-page {
    padding: 2.2rem 1rem;
  }

  .offer-container {
    grid-template-columns: 1fr;
    width: 100%;
    gap: 2rem;
  }

  .offer-copy {
    text-align: center;
  }

  .offer-copy .badge {
    align-self: center;
  }

  .hero-video {
    max-width: 100%;
  }

  .two-cols {
    grid-template-columns: 1fr;
    gap: 1.6rem;
  }

  .col-text {
    text-align: center;
  }

  .diapo-placeholder {
    height: 260px;
  }
}

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
  box-shadow: 0 20px 50px rgba(0,0,0,0.45);
}

.spinner {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.12);
  border-top-color: var(--accent);
  animation: spin 0.9s linear infinite;
}
.seo-hook {
  max-width: 780px;
  margin: 2.5rem auto 2.5rem;
  padding: 0 1rem;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #e5e7eb; /* visible sur fond noir */
  text-align: center;
  opacity: 0.85;
}

/* =========================
   CTA STICKY MOBILE
========================= */
.cta-sticky-mobile {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom) + 0.6rem);
  left: 50%;
  transform: translateX(-50%) translateY(16px) scale(0.98);
  z-index: 9999;

  display: none;
  align-items: center;
  justify-content: center;

  padding: 0.85rem 1.6rem;
  min-width: 220px;

  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #0b0b0f;
  font-weight: 900;
  font-size: 0.9rem;
  letter-spacing: 0.02em;
  text-decoration: none;

  border-radius: 999px;
  box-shadow:
    0 10px 28px rgba(245,158,11,0.45),
    inset 0 1px 0 rgba(255,255,255,0.4);

  opacity: 0;
  transition:
    opacity 0.25s ease,
    transform 0.25s cubic-bezier(.2,.8,.2,1);
}

/* visible */
.cta-sticky-mobile.is-visible {
  opacity: 1;
  transform: translateX(-50%) translateY(0) scale(1);
}

/* Mobile only */
@media (max-width: 768px) {
  .cta-sticky-mobile {
    display: inline-flex;
  }
}


.hero-bridge {
  margin: 0.8rem 0 1.2rem;
  font-size: 0.9rem;
  color: var(--muted);
  line-height: 1.6;
}

.hero-bridge a,
.business-bridge a {
  color: var(--accent);
  font-weight: 700;
  text-decoration: none;
  border-bottom: 1px solid rgba(245,158,11,0.4);
  transition: all 0.2s ease;
}

.hero-bridge a:hover,
.business-bridge a:hover {
  border-bottom-color: var(--accent);
  color: #fff;
}
.business-bridge {
  background: rgba(245,158,11,0.06);
  border: 1px solid rgba(245,158,11,0.25);
  border-radius: 20px;
  padding: 3rem 1.6rem;
  max-width: 900px;
  margin: 3rem auto;
  text-align: center;
}

.business-bridge h2 {
  font-size: 1.7rem;
  font-weight: 900;
  margin-bottom: 1rem;
}

.business-bridge .cta-secondary {
  margin-top: 1.6rem;
}


.impro-explain {
  padding: 4.5rem 1.2rem;
}

.explain-inner {
  max-width: 820px;
  margin: 0 auto;
  text-align: left;
}

.impro-explain h2 {
  font-size: 1.8rem;
  font-weight: 900;
  margin-bottom: 1.4rem;
}

.impro-explain p {
  color: var(--muted);
  line-height: 1.7;
  margin-bottom: 1.2rem;
  font-size: 0.95rem;
}

.explain-bridge {
  margin-top: 2rem;
  padding: 1.4rem 1.6rem;
  background: rgba(255,255,255,0.03);
  border-left: 3px solid var(--accent);
  border-radius: 12px;
}

.explain-bridge p {
  margin: 0;
  font-size: 0.9rem;
}
.explain-bridge a {
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
  border-bottom: 1px solid rgba(245,158,11,0.4);
  transition: all 0.2s ease;
}

.explain-bridge a:hover {
  color: #fff;
  border-bottom-color: var(--accent);
}

/* ========================
   FAQ PREMIUM ACCORDION
======================== */

.faq-premium {
  max-width: 820px;
  margin: 0 auto;
  padding: 4rem 1.2rem;
}

.faq-item {
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.faq-question {
  width: 100%;
  background: none;
  border: none;
  color: var(--text);
  padding: 1.2rem 0;
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  text-align: left;
}

.faq-question .icon {
  font-size: 1.2rem;
  color: var(--accent);
  transition: transform 0.25s ease;
}

.faq-question.open .icon {
  transform: rotate(45deg);
}

.faq-answer {
  padding-bottom: 1.2rem;
}

.faq-answer p {
  color: var(--muted);
  font-size: 0.92rem;
  line-height: 1.7;
}

.mini-bridge {
  margin-top: 1.4rem;
  font-size: 0.85rem;
  color: var(--muted);
}

.mini-bridge a {
  color: var(--accent);
  text-decoration: none;
  border-bottom: 1px solid rgba(245,158,11,0.4);
  transition: all 0.2s ease;
}

.mini-bridge a:hover {
  border-bottom-color: var(--accent);
  color: #fff;
}

</style>

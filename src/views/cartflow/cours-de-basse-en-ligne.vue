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
import { defineAsyncComponent } from "vue"

declare global {
  interface Window {
    dataLayer: any[]
    __gtagLoaded?: boolean
  }
}
const GA4_ID = "G-X8PE6LC5ED"
const ADS_ID = "AW-17922401091"


const loadGtag = () => {
  if ((window as any).__gtagLoaded) return
  ;(window as any).__gtagLoaded = true

  window.dataLayer = window.dataLayer || []

  function gtag(...args: any[]) {
    window.dataLayer.push(args)
  }

  window.gtag = gtag

  const script = document.createElement("script")
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`
  document.head.appendChild(script)

  gtag("js", new Date())
  gtag("config", GA4_ID)
  gtag("config", ADS_ID)
}
const heroVideo = ref<HTMLVideoElement | null>(null)
const showVideo = ref(false)

const startVideo = () => {
  showVideo.value = true
  nextTick(() => {
    heroVideo.value?.play()
  })
}
const setupDeferredAnalytics = () => {
  // fallback après 3s
  const timer = window.setTimeout(loadGtag, 3000)

  const trigger = () => {
    clearTimeout(timer)
    loadGtag()
    window.removeEventListener("pointerdown", trigger)
    window.removeEventListener("scroll", trigger)
    window.removeEventListener("keydown", trigger)
  }

  window.addEventListener("pointerdown", trigger, { once: true })
  window.addEventListener("scroll", trigger, { once: true })
  window.addEventListener("keydown", trigger, { once: true })
}






const OfferSelector = defineAsyncComponent(() =>
  import("@/components/cartflow/Payments/OfferSelector.vue")
)

const OfferRecap = defineAsyncComponent(() =>
  import("@/components/cartflow/Payments/OfferRecap.vue")
)

const PaymentElement = defineAsyncComponent(() =>
  import("@/components/cartflow/Payments/PaymentElement.vue")
)
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)

const stickyCta = ref<HTMLElement | null>(null)
let shown = false
let onScroll: ((this: Window, ev: Event) => any) | null = null

// =====================
// SEO
// =====================
useHead({
  title: "Cours de basse en ligne personnalisés – Professeur professionnel en visio | SunBassSchool",
  meta: [
    {
      name: "description",
      content:
        "Cours de basse en ligne personnalisés avec un musicien professionnel. Programme structuré, feedback précis, replay et suivi sur SunBassApp. Dès 6 mois de pratique."
    },
    {
      name: "robots",
      content: "index, follow"
    }
  ],
  link: [
    {
      rel: "canonical",
      href: "https://www.sunbassschool.com/cours-de-basse-en-ligne"
    }
  ],
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Les cours de basse en ligne sont-ils efficaces ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Oui. Avec un cadre clair, des consignes précises et un suivi structuré, le format visio est très efficace. SunBassApp permet de garder un fil conducteur : feedbacks, devoirs, replay et ressources."
            }
          },
          {
            "@type": "Question",
            "name": "Quel niveau faut-il pour démarrer ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Il faut idéalement au moins 6 mois de basse (autodidacte ou école). Si vous n’avez jamais joué de musique, il est préférable de commencer avec un autre cadre avant la visio."
            }
          },
          {
            "@type": "Question",
            "name": "Que travaille-t-on pendant les cours ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Technique, groove, timing, harmonie et répertoire (rock, funk, jazz…). Le contenu est personnalisé selon le niveau et les objectifs."
            }
          },
          {
            "@type": "Question",
            "name": "Quel matériel faut-il ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Une basse, un ampli, un téléphone ou ordinateur avec webcam et une bonne connexion internet suffisent."
            }
          },
          {
            "@type": "Question",
            "name": "Y a-t-il des devoirs entre les cours ?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Oui. En fin de séance, les objectifs de la semaine sont définis et déposés sur SunBassApp avec le feedback, les ressources et le replay du cours."
            }
          }
        ]
      })
    },
{
  type: "application/ld+json",
  children: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": "Cours de basse en ligne personnalisés",
    "description": "Cours de basse en ligne personnalisés avec professeur professionnel en visioconférence.",
    "thumbnailUrl": "https://www.sunbassschool.com/hero-cours-basse(1).webp",
    "uploadDate": "2026-02-20T00:00:00+01:00",
    "datePublished": "2026-02-20T00:00:00+01:00",
    "duration": "PT6M19S",
    "contentUrl": "https://www.sunbassschool.com/sbs-upload/uploads/da325b2c-ff5d-45ea-9c57-156896fdb198/b4c34e3c-9187-409d-ad84-30bb7731e735/a8414182-681d-438e-89e7-0e000f7ef44e.mp4",
    "embedUrl": "https://www.sunbassschool.com/cours-de-basse-en-ligne"
  })
}
  ]
})



// =====================
// CONST
// =====================
const funnel =
  (route.query.funnel as string) || "cours_basse"
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
  setupDeferredAnalytics()

  setTimeout(() => {
    showVideo.value = true
  }, 2000)

  await nextTick()

  requestAnimationFrame(() => {
    window.scrollTo(0, 0)
  })

  document.documentElement.classList.add("landing-mode")
  document.body.classList.add("landing-mode")

  // 🔥 Lazy load OFFERS uniquement quand checkout visible
  const checkoutEl = document.getElementById("checkout")

  if (checkoutEl) {
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return

        observer.disconnect()

        if (!offers.value.length) {
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
            if (!json.ok) throw new Error("Erreur chargement offres")

            offers.value = json.data
          } catch (e: any) {
            error.value = e.message
          } finally {
            offersLoading.value = false
          }
        }
      },
      { threshold: 0.2 }
    )

    observer.observe(checkoutEl)
  }

  // Sticky CTA logique existante
  const el = stickyCta.value
  if (!el) return

  setTimeout(() => {
    el.classList.add("is-visible")
    shown = true
  }, 1200)

  onScroll = () => {
    if (!el || !shown) return
    el.textContent =
      window.scrollY > 420
        ? "🎸 Rejoindre les cours"
        : "🎸 Voir les formules"
  }

  window.addEventListener("scroll", onScroll, { passive: true })
})



onUnmounted(() => {
  document.documentElement.classList.remove("landing-mode")
  document.body.classList.remove("landing-mode")

  if (onScroll) {
    window.removeEventListener("scroll", onScroll)
  }

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
        <span class="badge">🎸 Cours individuels en visioconférence</span>

<h1 class="offer-title">
  Cours de basse <span class="accent">en ligne personnalisés</span>
</h1>
<p class="hero-sub">
  Avec un professeur musicien professionnel
</p>



<div class="hero-stats">
  <div class="stat-item">
    <strong>50+</strong>
    <span>élèves accompagnés</span>
  </div>
  <div class="stat-sep"></div>
  <div class="stat-item">
    <strong>10 ans</strong>
    <span>d’enseignement</span>
  </div>
  <div class="stat-sep"></div>
  <div class="stat-item">
    <strong>15 ans</strong>
    <span>musicien professionnel</span>
  </div>
</div>


<div class="hero-video">
  <div v-if="!showVideo" class="video-cover" @click="startVideo">
    <img
      src="/hero-cours-basse(1).webp"
      alt="Cours de basse en ligne personnalisés"
      width="680"
      height="382"
      fetchpriority="high"
    />
    <div class="play-btn">▶</div>
  </div>

  <video
    v-else
    ref="heroVideo"
    src="https://www.sunbassschool.com/sbs-upload/uploads/da325b2c-ff5d-45ea-9c57-156896fdb198/b4c34e3c-9187-409d-ad84-30bb7731e735/a8414182-681d-438e-89e7-0e000f7ef44e.mp4"
    muted
    playsinline
    controls
    preload="metadata"
     poster="/hero-cours-basse(1).webp"
  />
</div>

        <div class="proof">
          <p>🎯 Niveau requis : 6 mois de basse minimum (autodidacte ou école)</p>
          <p>⏱️ 1h / semaine · 100% individuel</p>
          <p>📱 Matériel : basse + ampli + téléphone + bonne connexion</p>
        </div>

        <a href="#checkout" class="cta-main">Voir les formules</a>
      </div>

      <!-- RIGHT -->
      <div class="offer-checkout-wrapper">
        <p class="offer-lead">
          Une pédagogie <strong>terrain</strong>, guidée par un musicien actif :
          des consignes précises, un plan clair, et un suivi qui te fait avancer
          semaine après semaine.
        </p>

        <ul class="benefits">
          <li>✅ Technique (propreté, endurance, précision)</li>
          <li>✅ Groove & timing (placement, feel, régularité)</li>
          <li>✅ Harmonie (comprendre ce que tu joues)</li>
          <li>✅ Répertoire (rock, funk, jazz, etc.)</li>
        </ul>
<p class="internal-link-block">
  Si tu veux approfondir spécifiquement l’improvisation et la compréhension des cadences,
  découvre ma <a href="/improvisationcadentielle">formation complète sur l’improvisation à la basse</a>.
</p>

        <div class="guarantee-badge">
          <span class="icon">✔</span>
          <div class="text">
            <strong>Suivi sur SunBassApp</strong>
            <span>replay, feedback, devoirs et ressources centralisés</span>
          </div>
        </div>

        <div class="video-cta" style="margin-top: 1.4rem">
          <a href="#contact" class="cta-secondary">Poser une question</a>
        </div>
      </div>
    </div>

    <!-- CONTENT -->
    <section class="offer-content">
      <div class="fade-separator with-cta">
        <a href="#checkout" class="separator-cta">Rejoindre les cours</a>
      </div>

      <!-- BLOCK A : POUR QUI -->
      <section class="content-block block-a">
        <div class="two-cols">
          <div class="col-text">
            <h2>Pour qui sont ces cours de basse en ligne ?</h2>

            <p class="intro">
              Si tu as déjà une base (au moins 6 mois), que tu veux progresser sérieusement
              et arrêter de tourner en rond, ces cours sont faits pour toi.
            </p>

            <ul class="features">
              <li><strong>Débutant +</strong> : tu joues déjà quelques morceaux, tu veux une méthode et des repères.</li>
              <li><strong>Intermédiaire</strong> : tu bloques sur le groove, la régularité, l’harmonie, les styles.</li>
              <li><strong>Avancé</strong> : tu veux affiner, structurer, gagner en musicalité et en efficacité.</li>
            </ul>

            <p class="intro">
              ⚠️ Si tu n’as <strong>jamais joué de musique</strong>, je te recommande de démarrer en présentiel
              ou avec un cadre différent avant de passer en visio.
            </p>

            <a href="#checkout" class="cta-main">Choisir une formule</a>
          </div>

          <div class="col-media">
            <div class="diapo-placeholder">📄 Exemple de programme personnalisé</div>
          </div>
        </div>
      </section>

      <div class="fade-separator"></div>

      <!-- BLOCK B : MÉTHODE -->
      <section class="content-block block-b">
        <h2 class="block-title">Une méthode simple : du concret, du feedback, un plan</h2>

        <div class="method-grid">
          <div class="method-card">
            <span class="method-num">01</span>
            <h3>Tu joues</h3>
            <p>On part de ton jeu réel : ton son, ton timing, tes habitudes.</p>
          </div>

          <div class="method-card">
            <span class="method-num">02</span>
            <h3>Consignes précises</h3>
            <p>Workshop terrain : consignes claires pour corriger et solidifier.</p>
          </div>

          <div class="method-card">
            <span class="method-num">03</span>
            <h3>Suite du programme</h3>
            <p>On avance sur ton parcours : technique, groove, harmonie, styles.</p>
          </div>

          <div class="method-card">
            <span class="method-num">04</span>
            <h3>Devoirs & suivi</h3>
            <p>Fin de cours : objectifs semaine + ressources + replay sur SunBassApp.</p>
          </div>
        </div>

        <div class="video-cta">
          <a href="#checkout" class="cta-secondary">Je veux un plan clair</a>
        </div>
      </section>

      <div class="fade-separator"></div>

      <!-- BLOCK A : DÉROULÉ -->
      <section class="content-block block-a">
        <div class="two-cols">
          <div class="col-text">
            <h2>Déroulé d’un cours (1h)</h2>

            <ul class="features">
              <li><strong>5–10 min</strong> : questions + retour sur les devoirs, tu joues, je diagnostique.</li>
              <li><strong>~15 min</strong> : workshop pratique (consignes précises, corrections, approfondissement).</li>
              <li><strong>~15 min</strong> : on entame la suite du programme (technique / groove / harmonie / style).</li>
              <li><strong>5 min</strong> : objectifs + devoirs de la semaine.</li>
            </ul>

            <p class="intro">
              L’avantage : tu ne fais pas “au hasard”. Chaque séance s’inscrit dans un fil conducteur,
              avec des objectifs mesurables.
            </p>
          </div>

          <div class="col-media">
            <div class="diapo-placeholder">🎥 Replay + feedback + ressources (SunBassApp)</div>
          </div>
        </div>
      </section>

      <div class="fade-separator"></div>

      <!-- BLOCK B : PROFIL -->
      <section class="content-block block-b bio-block">
        <div class="two-cols">
          <div class="bio-photo">
         <img
  src="https://i.ibb.co/8L3qDSVD/IMG-0866-jpeg.jpg"
  alt="Sunny Adroit – professeur de basse et musicien professionnel"
  width="250"
  height="250"
  loading="lazy"
  decoding="async"
/>

          </div>

          <div class="bio-text">
            <h2>Pourquoi travailler avec moi ?</h2>

            <h3 class="bio-name">Sunny Adroit</h3>

            <p>
              Je cumule la double casquette : <strong>musicien professionnel actif</strong> (activité principale)
              et <strong>pédagogue</strong> depuis 10 ans.
            </p>

            <p>
              Ça veut dire : un transfert de connaissances <strong>actuel</strong>, concret, issu de la scène,
              du studio et d’une culture musicale large.
            </p>

            <p>
              Formation : <strong>DEM Jazz (mention très bien)</strong> + <strong>Licence de musicologie Jazz</strong> à Toulouse.
              Et surtout : beaucoup de styles joués (rock, funk, jazz…).
            </p>
          </div>
        </div>

        <div class="bio-stats">
          <div class="stat">
            <strong>10 ans</strong>
            <span>pédagogie</span>
          </div>
          <div class="stat">
            <strong>15 ans</strong>
            <span>musicien pro</span>
          </div>
          <div class="stat">
            <strong>50+</strong>
            <span>élèves suivis</span>
          </div>
        </div>
      </section>

      <div class="fade-separator with-cta">
        <a href="#checkout" class="separator-cta">S’inscrire</a>
      </div>
<section class="content-block block-b internal-offer">
  <h2>Commencer gratuitement</h2>
  <p>
    Tu veux déjà améliorer ton groove et ta compréhension harmonique ?
    Télécharge la <a href="/masterclass">masterclass basse gratuite (PDF + vidéo)</a>
    pour poser des bases solides.
  </p>
</section>

      <!-- FAQ SEO -->
      <section class="content-block block-a faq-block">
        <h2>FAQ – Cours de basse en ligne</h2>

        <article class="faq-item">
          <h3>Les cours de basse en ligne sont-ils efficaces ?</h3>
          <p>
            Oui. Avec un cadre clair, des consignes précises et un suivi structuré,
            le format visio est très efficace. SunBassApp permet de garder un fil conducteur :
            feedbacks, devoirs, replay et ressources.
          </p>
        </article>

        <article class="faq-item">
          <h3>Quel niveau faut-il pour démarrer ?</h3>
          <p>
            Il faut idéalement <strong>au moins 6 mois de basse</strong> (autodidacte ou école).
            Si tu n’as jamais joué de musique, je ne recommande pas de commencer directement en visio.
          </p>
        </article>

        <article class="faq-item">
          <h3>Que travaille-t-on pendant les cours ?</h3>
          <p>
            Technique, groove/timing, harmonie et répertoire (rock, funk, jazz…).
            Le contenu s’adapte à ton niveau et à tes objectifs.
          </p>
        </article>

        <article class="faq-item">
          <h3>Quel matériel faut-il ?</h3>
          <p>
            Une basse, un ampli, un téléphone (ou ordinateur) et une bonne connexion.
          </p>
        </article>

        <article class="faq-item">
          <h3>Y a-t-il des devoirs entre les cours ?</h3>
          <p>
            Oui. En fin de séance, je donne les objectifs de la semaine, et je dépose sur SunBassApp
            le feedback, les devoirs, les ressources et le replay du cours.
          </p>
        </article>
      </section>

      <div class="fade-separator"></div>

      <!-- CONTACT CTA -->
      <section class="content-block block-b" id="contact">
        <h2 class="block-title">Une question avant de t’inscrire ?</h2>
        <p class="intro" style="max-width: 800px; margin: 0 auto; text-align: center;">
          Si tu veux vérifier que le format est adapté à ton niveau et à ton objectif,
          tu peux me contacter rapidement. Je te réponds avec une reco claire.
        </p>

        <div class="video-cta" style="margin-top: 1.8rem;">
          <a href="#checkout" class="cta-secondary">Voir les formules</a>
          <a href="mailto:contact@sunbassschool.com" class="cta-secondary">Me contacter</a>
        </div>
      </section>
    </section>
  </div>

  <!-- SEO SÉMANTIQUE -->
<p class="seo-hook">
  Ces cours de basse en ligne en visioconférence s’adressent aux bassistes souhaitant
  travailler avec un professeur de basse à distance, dans un cadre structuré et personnalisé.
</p>

  <!-- CHECKOUT (réutilise ton bloc existant) -->
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
<!-- OVERLAY preparation paiement -->
<div v-if="preparing" class="checkout-overlay">
  <div class="overlay-box">
    <div class="spinner"></div>
    <p>Connexion au paiement sécurisé…</p>
    <span>Merci de patienter</span>
  </div>
</div>

<!-- OVERLAY paiement -->
<div v-if="paying" class="checkout-overlay">
  <div class="overlay-box">
    <div class="spinner"></div>
    <p>Paiement en cours…</p>
    <span>Ne fermez pas la page</span>
  </div>
</div>

    <!-- STRIPE -->
<Transition name="slide-fade">
  <PaymentElement
    v-if="clientSecret && !paymentDone"
    :client-secret="clientSecret"
    :mode="selectedOffer?.pricing_mode === 'one_time' ? 'payment' : 'setup'"
    :email="resolvedEmail"
    @paying="paying = $event"
    @success="onStripeSuccess"
    @error="onStripeError"
  />
</Transition>


    <!-- FOOTER -->
    <div class="checkout-footer">
      🔐 Paiement sécurisé · Accès immédiat
    </div>

  </div>

</section>
</div>
<!-- CTA STICKY MOBILE -->
<!-- CTA STICKY MOBILE -->
<a
  href="#checkout"
  class="cta-sticky-mobile"
  ref="stickyCta"
>
  🎸 Voir les formules
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
    max-width: 680px;

}
.offer-title {
  letter-spacing: -0.02em;
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
  background: var(--block-a);
}

.block-b {
  background: var(--block-b);
}

.fade-separator {
  height: 1px;
  width: 100%;
  max-width: 680px;
  margin: 3rem auto 2rem;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent);
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
  gap: 0.6rem;
  margin-top: 1.2rem;
  padding: 0.85rem 1.6rem;
  font-size: 0.9rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #0b0b0f;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-radius: 999px;
  text-decoration: none;
  box-shadow: 0 10px 30px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.35);
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

/* =========================
   INTERNAL SEO BLOCKS
========================= */

.internal-link-block {
  margin-top: 1.4rem;
  padding: 1.2rem 1.4rem;
  border-radius: 16px;
  background: linear-gradient(
    180deg,
    rgba(255,255,255,0.04),
    rgba(255,255,255,0.02)
  );
  border: 1px solid rgba(255,255,255,0.08);
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--muted);
  max-width: 680px;
}

.internal-link-block a {
  color: var(--accent);
  font-weight: 700;
  text-decoration: none;
  border-bottom: 1px solid rgba(245,158,11,0.4);
  transition: all 0.2s ease;
}

.internal-link-block a:hover {
  color: #fbbf24;
  border-color: #fbbf24;
}

/* Bloc masterclass gratuit */

.internal-offer {
  text-align: center;
  padding: 3.2rem 1.2rem;
  border-radius: 22px;
  max-width: 820px;
  margin: 3rem auto;
  background: linear-gradient(
    180deg,
    rgba(245,158,11,0.08),
    rgba(245,158,11,0.03)
  );
  border: 1px solid rgba(245,158,11,0.35);
  box-shadow: 0 25px 60px rgba(0,0,0,0.35);
}

.internal-offer h2 {
  font-size: 1.6rem;
  font-weight: 900;
  margin-bottom: 1rem;
}

.internal-offer p {
  color: var(--muted);
  font-size: 1rem;
  line-height: 1.65;
  max-width: 620px;
  margin: 0 auto;
}

.internal-offer a {
  color: var(--accent);
  font-weight: 800;
  text-decoration: none;
  border-bottom: 2px solid rgba(245,158,11,0.5);
  padding-bottom: 2px;
  transition: all 0.2s ease;
}

.internal-offer a:hover {
  color: #fbbf24;
  border-color: #fbbf24;
}

.hero-sub {
  font-size: 1.05rem;
  font-weight: 500;
  color: var(--muted);
  margin-bottom: 1.2rem;
}


.hero-stats {
  display: flex;
  align-items: center;
  gap: 1.4rem;
  margin: 0.8rem 0 1.4rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.stat-item strong {
  font-size: 1.2rem;
  font-weight: 900;
  color: white;
}

.stat-item span {
  font-size: 0.8rem;
  color: var(--muted);
}

.stat-sep {
  width: 1px;
  height: 32px;
  background: rgba(255,255,255,0.15);
}

@media (max-width: 768px) {
  .hero-stats {
    justify-content: center;
    text-align: center;
  }

  .stat-sep {
    display: none;
  }
}
.video-cover {
  position: relative;
  cursor: pointer;
}

.video-cover img {
  border-radius: 12px;
  display: block;
}

.play-btn {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: white;
  background: rgba(0,0,0,0.25);
  border-radius: 12px;
}
</style>

<script setup lang="ts">

type StripeSuccessRes = {
  paymentIntent?: any
}

import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/authStore.js"
import { getProxyPostURL, gasPost } from "@/config/gas"
import { useHead } from "@vueuse/head"
import MarketingFooter from "@/components/MarketingFooter.vue"

import MarketingHeader from "@/components/MarketingHeader.vue"
import OfferSelector from "@/components/cartflow/Payments/OfferSelector.vue"
import OfferRecap from "@/components/cartflow/Payments/OfferRecap.vue"
import PaymentElement from "@/components/cartflow/Payments/PaymentElement.vue"

const router = useRouter()
const auth = useAuthStore()

const funnel = "routine_main_gauche"
const loadingOffers = ref(true)

const preparing = ref(false)
const offers = ref<any[]>([])
const selectedOffer = ref<any | null>(null)

const guestEmail = ref("")
const clientSecret = ref<string | null>(null)

const paymentDone = ref(false)

const resolvedEmail = computed(() =>
  auth.user?.email || guestEmail.value.trim()
)

useHead({
  title: "Routine main gauche basse – 20 minutes pour retrouver tes sensations | SunBassSchool",
  meta: [
    {
      name: "description",
      content:
        "Routine technique de 20 minutes pour retrouver précision, indépendance des doigts et contrôle du manche à la basse."
    }
  ],
  link: [
    {
      rel: "canonical",
      href: "https://www.sunbassschool.com/module-routine-main-gauche"
    }
  ]
})

onMounted(async () => {

  loadingOffers.value = true

  const res = await fetch(getProxyPostURL(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      route: "getOffersForCheckout",
      funnel
    })
  })

  const json = await res.json()

  offers.value = json.data || []

  // sélection automatique
  if (offers.value.length > 0) {
    selectedOffer.value = offers.value[0]
  }

  loadingOffers.value = false

})
const createIntent = async () => {

  if (!selectedOffer.value) return
  if (!resolvedEmail.value) return

  preparing.value = true

  try {

    const json = await gasPost(
      "createEmbeddedIntent",
      {
        product_id: selectedOffer.value.product_id,
        droit_code: selectedOffer.value.droit_code,
        email: resolvedEmail.value
      }
    )

    console.log("Stripe intent:", json)

    clientSecret.value =
      json?.data?.client_secret || json?.client_secret

  } catch (e) {

    console.error("Intent error", e)

  } finally {

    preparing.value = false

  }

}

const onStripeSuccess = async (res: StripeSuccessRes) => {

  const pi = res?.paymentIntent

  if (pi?.status !== "succeeded") return

  paymentDone.value = true

  router.replace("/thankyou")

}

</script>

<template>

<MarketingHeader />

<div class="offer-page">

<div class="offer-container">

<div class="offer-copy">

<span class="badge">
Module technique
</span>

<h1 class="offer-title">

Routine main gauche :
<span class="accent">
20 minutes pour retrouver la précision
</span>

</h1>

<p class="hero-proof">

Une routine simple et structurée pour relancer
ta technique et retrouver le contrôle du manche.

</p>

<ul class="benefits">

<li>9 exercices progressifs</li>
<li>routine quotidienne de 20 minutes</li>
<li>PDF + vidéos + mp3</li>

</ul>

<a href="#checkout" class="cta-main">
Accéder au module
</a>

</div>

<div class="offer-checkout-wrapper">

<div class="help-card">

<h3 class="help-title">
Ce module t’aide à
</h3>

<ul class="help-list">

<li>Retrouver la précision après une pause</li>
<li>Développer l’indépendance des doigts</li>
<li>Stabiliser ta technique main gauche</li>

</ul>

</div>

</div>

</div>

<section class="offer-content">

<section class="content-block block-a">

<h2>
Pourquoi la main gauche se dérègle rapidement ?
</h2>

<p>

La technique est fragile.

Quelques jours sans jouer peuvent suffire à perdre
coordination, précision et sensations.

</p>

<p>

Cette routine a été conçue pour relancer rapidement
la machine et retrouver tes sensations sur le manche.

</p>

</section>

<section class="content-block block-b">

<h2 class="block-title">
La routine en détail
</h2>

<ul class="features">

<li>Exercice Janek Gwizdala</li>
<li>Déliateurs standards</li>
<li>Exercice de violoncelliste</li>
<li>Déliateurs aller-retour</li>
<li>Richard Bona style</li>
<li>L’araignée</li>
<li>Les neuvièmes</li>
<li>Les octaves</li>
<li>Triolets chromatiques</li>

</ul>

</section>

</section>

</div>

<div id="checkout_bg">

<section id="checkout" class="checkout-section">

<div class="checkout-card">

<div v-if="loadingOffers" class="offers-loading">
Chargement sécurisé du module...
</div>

<div v-else-if="preparing" class="intent-loading">
Préparation du paiement sécurisé...
</div>

<div v-else-if="!clientSecret && selectedOffer" class="checkout-product">

<div class="product-head">

<div class="product-info">

<h3>{{ selectedOffer.name }}</h3>

<p class="product-desc">
Accès immédiat au module technique.
</p>

</div>

<div class="product-price">

<span class="price">
{{ selectedOffer.price_display }}
</span>

<span class="instant">
accès immédiat
</span>

</div>

</div>

<input
v-if="!auth.user?.email"
v-model="guestEmail"
type="email"
placeholder="Votre email"
class="checkout-email"
/>

</div>

<div
v-if="selectedOffer && !auth.user?.email && !clientSecret"
>
</div>

<OfferRecap
v-if="selectedOffer && resolvedEmail && !clientSecret"
:offer="selectedOffer"
@pay="createIntent"
/>

<PaymentElement
v-if="clientSecret && !paymentDone"
:client-secret="clientSecret"
mode="payment"
:email="resolvedEmail"
@success="onStripeSuccess"
/>

</div>

</section>

</div>
<MarketingFooter />

</template>

<style scoped>

.offer-page{

--panel:#13131a;
--panel-soft:#1b1b25;

--text:#f8fafc;
--muted:#9ca3af;
--accent:#f59e0b;

background:radial-gradient(
1200px 600px at 50% -10%,
#000000,
#0b0b0f
);

color:var(--text);

padding:4rem 1.2rem;

}

.offer-container{

max-width:1100px;
margin:auto;

display:grid;
grid-template-columns:1.1fr 0.9fr;

gap:3rem;

}

.badge{

display:inline-flex;
padding:0.4rem 0.8rem;

border-radius:999px;

font-size:0.75rem;
font-weight:900;

color:var(--accent);

border:1px solid rgba(245,158,11,0.35);

}

.offer-title{

font-size:clamp(2rem,4vw,2.6rem);
font-weight:900;

margin:1rem 0;

}

.accent{
color:var(--accent);
}

.hero-proof{

color:var(--muted);

}

.benefits{

list-style:none;
padding:0;
margin:1rem 0;

}

.cta-main{

display:inline-block;

margin-top:1rem;

padding:0.8rem 1.6rem;

font-weight:900;

background:linear-gradient(
135deg,
#fbbf24,
#f59e0b
);

color:#111;

border-radius:999px;

text-decoration:none;

}

.offer-content{

max-width:900px;
margin:3rem auto;

}

.content-block{

padding:2rem;

border-radius:18px;

margin-bottom:2rem;

}

.block-a{

background:rgba(255,255,255,0.02);

}

.block-b{

background:rgba(255,255,255,0.04);

}

.block-title{

text-align:center;
font-weight:900;

}

#checkout_bg{

background:#fff;
padding:4rem 1rem;

}

.checkout-card{

max-width:680px;
margin:auto;

background:linear-gradient(
180deg,
var(--panel),
var(--panel-soft)
);

border-radius:24px;

padding:2rem;

}

@media (max-width:900px){

.offer-container{

grid-template-columns:1fr;

}

}
.help-card{

background:linear-gradient(
180deg,
rgba(255,255,255,0.04),
rgba(255,255,255,0.02)
);

border:1px solid rgba(255,255,255,0.08);

border-radius:18px;

padding:1.8rem;

box-shadow:0 10px 40px rgba(0,0,0,0.35);

}

.help-title{

font-size:1.2rem;
font-weight:800;

margin-bottom:1rem;

}

.help-list{

list-style:none;
padding:0;

}

.help-list li{

position:relative;

padding-left:1.4rem;

margin-bottom:0.6rem;

font-size:0.9rem;

color:#d1d5db;

}

.help-list li::before{

content:"✔";

position:absolute;

left:0;

color:#f59e0b;

font-weight:900;

}
.offer-checkout-wrapper{
max-width:340px;
margin-top:10%;
}

.intent-loading{

display:flex;

align-items:center;

justify-content:center;

padding:2.5rem;

font-weight:600;

color:#9ca3af;

}
.intent-loading::after{

content:"";

width:18px;
height:18px;

margin-left:10px;

border:2px solid rgba(255,255,255,0.2);
border-top:2px solid #f59e0b;

border-radius:50%;

animation:spin 0.8s linear infinite;

}

@keyframes spin{

to{
transform:rotate(360deg);
}

}

.offers-loading{

display:flex;

align-items:center;

justify-content:center;

gap:10px;

padding:2.5rem;

font-weight:600;

color:#9ca3af;

}

.offers-loading::after{

content:"";

width:18px;
height:18px;

border-radius:50%;

border:2px solid rgba(255,255,255,0.2);
border-top:2px solid #f59e0b;

animation:spin 0.8s linear infinite;

}

.checkout-product{

background:#13131a;

border:1px solid rgba(255,255,255,0.08);

border-radius:18px;

padding:1.6rem;

margin-bottom:1rem;

box-shadow:0 20px 50px rgba(0,0,0,0.45);

}

.product-head{

display:flex;

justify-content:space-between;

gap:1rem;

margin-bottom:1rem;

}

.product-info h3{

font-weight:800;

margin-bottom:0.2rem;

}

.product-desc{

font-size:0.85rem;

color:#9ca3af;

}

.product-price{

text-align:right;

}

.price{

font-size:1.4rem;

font-weight:900;

color:#f59e0b;

display:block;

}

.instant{

font-size:0.75rem;

color:#9ca3af;

}

.checkout-email{

width:100%;

padding:0.9rem 1rem;

border-radius:10px;

border:1px solid rgba(255,255,255,0.1);

background:#0b0b0f;

color:white;

}
</style>

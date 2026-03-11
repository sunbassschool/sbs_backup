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
import OfferRecap from "@/components/cartflow/Payments/OfferRecap.vue"
import PaymentElement from "@/components/cartflow/Payments/PaymentElement.vue"

const router = useRouter()
const auth = useAuthStore()

const funnel = "bundle_routine_mains"

const offers = ref<any[]>([])
const selectedOffer = ref<any | null>(null)

const loadingOffers = ref(true)
const preparing = ref(false)

const guestEmail = ref("")
const clientSecret = ref<string | null>(null)

const paymentDone = ref(false)

const resolvedEmail = computed(() =>
  auth.user?.email || guestEmail.value.trim()
)

useHead({
  title: "Routine complète basse – main gauche + main droite | SunBassSchool",
  meta: [
    {
      name: "description",
      content:
        "Pack complet pour bassistes : routines main gauche et main droite pour stabiliser la technique et le groove avec 20 minutes de travail quotidien."
    }
  ],
  link: [
    {
      rel: "canonical",
      href: "https://www.sunbassschool.com/bundle-routine-mains"
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

    clientSecret.value =
      json?.data?.client_secret || json?.client_secret

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
Pack technique
</span>

<h1 class="offer-title">

Routine complète basse :
<span class="accent">
main gauche + main droite
</span>

</h1>

<p class="hero-proof">

Un programme simple pour stabiliser ta technique instrumentale de basse
avec deux routines complémentaires.

</p>

<ul class="benefits">

<li>routine complète des deux mains</li>
<li>moins de 20 minutes par jour</li>
<li>PDF + vidéos + mp3</li>

</ul>

<a href="#checkout" class="cta-main">
Accéder au pack
</a>

</div>

<div class="offer-checkout-wrapper">

<div class="help-card">

<h3 class="help-title">
Ce pack t’aide à
</h3>

<ul class="help-list">

<li>stabiliser ta technique instrumentale</li>
<li>améliorer la coordination et la fluidité main gauche main droite</li>
<li>avoir un son plus propre et pro sans résonnance</li>

</ul>

</div>

</div>

</div>

<section class="offer-content">

<section class="content-block block-a">

<h2>
Pourquoi travailler les deux mains ?
</h2>

<p>

La technique de basse repose sur l’équilibre entre la main gauche et la main droite.

Si l’une manque de précision ou de régularité,
le groove devient instable.

</p>

<p>

Ces deux routines ont été conçues pour fonctionner ensemble
et construire une base technique solide.

</p>

</section>

<section class="content-block block-b">

<h2 class="block-title">
Contenu du pack
</h2>

<ul class="features">

<li>Routine main gauche complète</li>
<li>Routine main droite complète</li>
<li>Exercices progressifs</li>
<li>supports PDF</li>
<li>vidéos pédagogiques</li>

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

<h3>Pack routines mains</h3>

<p class="product-desc">
Main gauche + main droite
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

/* =========================
THEME GLOBAL
========================= */

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

min-height:100vh;

}

/* =========================
HERO
========================= */

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

background:rgba(245,158,11,0.08);

}

.offer-title{

font-size:clamp(2rem,4vw,2.6rem);

font-weight:900;

margin:1rem 0;

line-height:1.2;

}

.accent{
color:var(--accent);
}

.hero-proof{

color:var(--muted);

margin-bottom:1rem;

}

.benefits{

list-style:none;

padding:0;

margin:1rem 0;

}

.benefits li{
margin-bottom:0.4rem;
}

/* =========================
CTA
========================= */

.cta-main{

display:inline-flex;

align-items:center;
justify-content:center;

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

box-shadow:0 10px 28px rgba(245,158,11,0.25);

transition:all .2s ease;

}

.cta-main:hover{

transform:translateY(-2px);

box-shadow:0 16px 40px rgba(245,158,11,0.35);

}

/* =========================
HELP CARD
========================= */

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

color:var(--accent);

font-weight:900;

}

/* =========================
CONTENT
========================= */

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

margin-bottom:1rem;

}

/* =========================
CHECKOUT
========================= */

#checkout_bg{
background:white;
}

.checkout-card{

max-width:680px;

margin:auto;

background:linear-gradient(
180deg,
var(--panel),
var(--panel-soft)
);

border:1px solid rgba(255,255,255,0.08);

border-radius:24px;

padding:2rem;

box-shadow:0 30px 70px rgba(0,0,0,0.45);

}

/* =========================
PRODUCT CHECKOUT
========================= */

.checkout-product{

background:white;

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

color:var(--muted);

}

.product-price{
text-align:right;
}

.price{

font-size:1.4rem;

font-weight:900;

color:var(--accent);

display:block;

}

.instant{

font-size:0.75rem;

color:var(--muted);

}

.checkout-email{

width:100%;

padding:0.9rem 1rem;

border-radius:10px;

border:1px solid rgba(255,255,255,0.1);

background:#0b0b0f;

color:white;

}

/* =========================
LOADERS
========================= */

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

animation:spin .8s linear infinite;

}

.intent-loading{

display:flex;

align-items:center;

justify-content:center;

gap:10px;

padding:2.5rem;

font-weight:600;

color:#9ca3af;

}

.intent-loading::after{

content:"";

width:18px;
height:18px;

border-radius:50%;

border:2px solid rgba(255,255,255,0.2);
border-top:2px solid #f59e0b;

animation:spin .8s linear infinite;

}

@keyframes spin{
to{
transform:rotate(360deg);
}
}

/* =========================
RESPONSIVE
========================= */

@media (max-width:900px){

.offer-container{
grid-template-columns:1fr;
}

.offer-copy{
text-align:center;
}

}

</style>

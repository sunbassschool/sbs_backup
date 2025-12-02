<template>
  <Layout>
    <div class="abos-page container py-5 text-center">
      <h1 class="abos-title">🎸 Choisis ta formule</h1>
      <p class="abos-subtitle">Accède aux cours, accompagnement et ressources exclusives</p>
<div v-if="!isLoggedIn" class="alert alert-warning text-center my-3">
  ⚠️ Tu dois être connecté pour souscrire à une formule.<br>
  <a href="/login" class="btn btn-sm btn-outline-light mt-2">Se connecter</a>
</div>
      <div class="row justify-content-center mt-4">
        <div class="col-md-6 col-lg-4 mb-4" v-for="formule in formules" :key="formule.id">
          <div class="abo-card p-4 shadow-sm h-100 d-flex flex-column justify-content-between">
            <div>
              <h4 class="abo-title">{{ formule.nom }}</h4>
              <p class="abo-description">{{ formule.desc }}</p>
              <div class="abo-price">{{ formule.prix }}</div>
              <ul class="text-start mt-3 small">
                <li v-for="(avantage, i) in formule.advantages" :key="i">✔️ {{ avantage }}</li>
              </ul>
            </div>
<a
  v-if="isLoggedIn"
  :href="formule.link"
  class="btn btn-abo mt-4"
  target="_blank"
>
  S'abonner
</a>

<a
  v-else
  href="/login"
  class="btn btn-abo btn-login mt-4"
>
  🔐 Se connecter pour souscrire
</a>


          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import Layout from "@/views/Layout.vue";
import { ref } from 'vue';

const email = localStorage.getItem("email") || "";
const isLoggedIn = ref(!!email);

const encoded = encodeURIComponent(email);

const formules = [
  {
    id: 'app',
    nom: "🎧 Abo App",
    prix: "4,99€ / mois",
    desc: "Accès à l'app uniquement",
    advantages: [
      "Vidéos pédagogiques",
      "Morceaux à bosser",
      "Sans coaching direct"
    ],
    link: `https://buy.stripe.com/aFa9AUcXM1KA2RL6pk2Fa0A?prefilled_email=${encoded}&email=${encoded}&client_reference_id=${encoded}`
  },
  {
    id: 'mensuel',
    nom: "🚀 Abo Mensuel",
    prix: "90€ / mois",
    desc: "3H + app + suivi",
    advantages: [
      "3H de cours en visio",
      "Accès complet à l'app",
      "Ressources personnalisées"
    ],
    link: `https://buy.stripe.com/fZu28saPE2OE4ZT2942Fa0D?prefilled_email=${encoded}&email=${encoded}&client_reference_id=${encoded}`
  },
  {
    id: 'trimestriel',
    nom: "💼 Abo Trimestriel",
    prix: "270€ / 3 mois",
    desc: "Formule engagée",
    advantages: [
      "9H de coaching en visio",
      "Accès complet app + bonus",
      "Espace Google Drive privé"
    ],
    link: `https://buy.stripe.com/8x29AU3nc3SI63X3d82Fa0E?prefilled_email=${encoded}&email=${encoded}&client_reference_id=${encoded}`
  },
  {
    id: 'carte',
    nom: "🎯 1H Carte",
    prix: "30€ / 10 jours",
    desc: "1h de cours sans abo",
    advantages: [
      "Cours unique",
      "Sans engagement",
      "Accès limité à l'app"
    ],
    link: `https://buy.stripe.com/14A5kEaPEcpe3VP2942Fa0B?prefilled_email=${encoded}&email=${encoded}&client_reference_id=${encoded}`
  }
];

</script>

<style scoped>
.abos-page {
  color: #fff;
  background: linear-gradient(160deg, #111, #1c1c1c);
  border-radius: 12px;
}

.abos-title {
  font-size: 2.2rem;
  font-weight: bold;
  background: linear-gradient(to right, #f1c40f, #ff8c00);
  -webkit-background-clip: text;
  color: transparent;
}

.abos-subtitle {
  font-size: 1rem;
  color: #bbb;
  margin-bottom: 2rem;
}

.abo-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  backdrop-filter: blur(8px);
  transition: transform 0.2s ease;
  color: #fff;
}
.abo-card:hover {
  transform: scale(1.02);
  box-shadow: 0 0 15px rgba(0, 255, 150, 0.08);
}

.abo-title {
  font-size: 1.3rem;
  font-weight: bold;
  color: #f1c40f;
}
.abo-price {
  font-size: 1.1rem;
  font-weight: bold;
  color: #1db954;
  margin-top: 8px;
}
.abo-description {
  color: #ccc;
  font-size: 0.9rem;
  margin-top: 8px;
}

.btn-abo {
  background-color: #ff3300;
  border: none;
  color: #fff;
  font-weight: bold;
  border-radius: 6px;
  padding: 10px 20px;
  transition: background 0.3s ease;
}
.btn-abo:hover {
  background-color: #ff0000;
}
.btn-abo.disabled {
  background-color: #666 !important;
  pointer-events: none;
  opacity: 0.5;
}
.btn-abo.btn-login {
  background-color: #555;
  color: #fff;
}
.btn-abo.btn-login:hover {
  background-color: #777;
}

</style>

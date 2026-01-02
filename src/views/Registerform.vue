<template>
  <Layout>
    <div class="register-container">
      <h2 class="h2-immersive">🚀 Rejoindre l'aventure</h2>
      <transition name="fade"><div>
        <div class="progress-container">
  <div class="progress-bar" :style="{ width: progressPercentage }"></div>
</div>

      <form @submit.prevent="submitForm" class="card p-4 shadow">
        <!-- Adresse e-mail -->
        <div class="mb-3">
          <label class="form-label">Adresse e-mail</label>
          <input v-model="email" @input="email = email.replace(/\s+/g, '')" ref="emailField" @keyup.enter="$refs.prenomField.focus()" type="email" class="form-control" :class="{ 'shake': emailError }" required autocomplete="email" />


          <small class="text-danger" v-if="emailError">{{ emailError }}</small>

        </div>

        <!-- Prénom -->
        <div class="mb-3">
          <label class="form-label">Prénom</label>
          <input v-model="prenom" ref="prenomField" @keyup.enter="$refs.passwordField.focus()" type="text" class="form-control" required />
        </div>

   <!-- Code d'accès -->
<div class="mb-3 password-container">
  <label class="form-label">Code d'accès</label>
  <div class="password-wrapper">
   <input 
  v-model="codeAcces"
  @input="codeAcces = codeAcces.replace(/\s+/g, ''); validatePassword()" 
  maxlength="40"
  ref="passwordField" 
  @keyup.enter="$refs.confirmPasswordField.focus()"
  :type="showPassword ? 'text' : 'password'"
  class="form-control" 
  :class="{ 'shake': passwordError }"
  required
/>

    <span class="toggle-password" @click="showPassword = !showPassword">
      <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
    </span>
  </div>
  <small class="text-danger" v-if="passwordError">{{ passwordError }}</small>
 
</div>
 <!-- Indicateur de force du mot de passe -->
<div v-if="codeAcces" class="password-strength">
  <div class="strength-bar" :class="passwordStrengthClass"></div>
  <small>{{ passwordStrengthText }}</small>
</div>
<!-- Confirmation du Code d'accès -->
<div class="mb-3 password-container">
  <label class="form-label">Confirmer le code d'accès</label>
  <div class="password-wrapper">
  <input 
  v-model="confirmCodeAcces" 
  @input="confirmCodeAcces = confirmCodeAcces.replace(/\s+/g, '')"
  maxlength="40"
  :class="{ 'shake': confirmPasswordError }"
  :type="showConfirmPassword ? 'text' : 'password'"
  class="form-control"
  required
  ref="confirmPasswordField"
/>

    <span class="toggle-password" @click="showConfirmPassword = !showConfirmPassword">
      <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
    </span>
    <span v-if="confirmCodeAcces" class="match-indicator">
      <i :class="passwordsMatch ? 'fas fa-check-circle text-success' : 'fas fa-times-circle text-danger'"></i>
    </span>
  </div>
  <small class="text-danger" v-if="confirmPasswordError">{{ confirmPasswordError }}</small>
</div>





   <!-- ✅ Case à cocher CGU -->
<div class="mb-3 form-check">
  <input v-model="cguAccepted" type="checkbox" class="form-check-input" id="cgu" required />
  <label class="form-check-label" for="cgu">
    J'accepte les 
    <span class="link-text" @click="showCGU = true">Conditions Générales d'Utilisation</span>
    et la 
    <span class="link-text" @click="showPrivacy = true">Politique de Confidentialité</span>.
  </label>
</div>

<!-- 💬 MODALE CGU -->
<!-- 💬 MODALE CGU -->
 <transition name="modal-overlay">

<div v-if="showCGU" class="modal-overlay" @click.self="showCGU = false">
  <div class="modal-content">
    <h3>Conditions Générales d’Utilisation</h3>
    <div class="scrollable">
      <p><strong>1. Présentation</strong> — SunBassSchool est une PWA éditée par Sunny Adroit, auto-entrepreneur, proposant un accompagnement à l'apprentissage de la basse.</p>
      <p><strong>2. Accès</strong> — L’inscription est gratuite, certains contenus sont réservés aux abonnés payants via Stripe.</p>
      <p><strong>3. Compte utilisateur</strong> — L’utilisateur est responsable de la confidentialité de son mot de passe.</p>
      <p><strong>4. Contenu</strong> — Tous les cours, vidéos, audios et supports sont la propriété exclusive de Sunny Adroit.</p>
      <p><strong>5. Responsabilité</strong> — L'application ne peut être tenue responsable en cas d’interruption temporaire ou de mauvaise utilisation.</p>
      <p><strong>6. Droit applicable</strong> — Droit français. Contact : contact@sunbassschool.com</p>
    </div>
    <button class="btn btn-primary mt-3" @click="showCGU = false">Fermer</button>
  </div>
</div>
</transition>
<transition name="modal-overlay">

<!-- 🔒 MODALE CONFIDENTIALITÉ -->
<div v-if="showPrivacy" class="modal-overlay" @click.self="showPrivacy = false">
  <div class="modal-content">
    <h3>Politique de Confidentialité</h3>
    <div class="scrollable">
      <p><strong>1. Responsable</strong> — Sunny Adroit, SunBassSchool, contact@sunbassschool.com</p>
      <p><strong>2. Données collectées</strong> — Prénom, e-mail, progression, feedbacks, JWT, paiements (Stripe).</p>
      <p><strong>3. Usage</strong> — Ces données servent uniquement à l’accès, au suivi pédagogique et à la gestion des abonnements.</p>
      <p><strong>4. Sécurité</strong> — Données chiffrées et stockées via Google Apps Script/Drive. Connexion protégée par HTTPS et JWT expirables.</p>
      <p><strong>5. Droits RGPD</strong> — Accès, rectification, suppression ou opposition sur simple demande à contact@sunbassschool.com.</p>
      <p><strong>6. Cookies</strong> — Aucun cookie publicitaire. Seuls les tokens techniques (localStorage / IndexedDB) sont utilisés.</p>
    </div>
    <button class="btn btn-primary mt-3" @click="showPrivacy = false">Fermer</button>
  </div>
</div>
</transition>

   <!-- Barre de chargement -->
<div v-if="isLoading" class="loading-container">
  <div class="loading-bar"></div>
</div>
<!-- Champ anti-bot invisible -->
<input 
  v-model="botField" 
  style="display:none" 
  tabindex="-1" 
  autocomplete="off" 
/>

<!-- Bouton de soumission -->
<button type="submit" 
  class="btn btn-primary w-100" 
  :disabled="isSubmitDisabled || isLoading"
  :class="{ 'btn-loading': isLoading }"
>
  <span v-if="isLoading">
    <i class="fas fa-spinner fa-spin"></i> Inscription en cours...
  </span>
  <span v-else>S'inscrire</span>
</button>



<!-- Message de confirmation -->
<div v-if="message" class="success-message">
  ✅ {{ message }}
</div>
<!-- Message d'erreur -->
<div v-if="errorMessage" class="error-message">
  ❌ {{ errorMessage }}
</div>

      </form></div>
      </transition>
    </div>
  </Layout>
</template>


<script>
import Layout from "../views/Layout.vue";
import { getProxyGetURL } from "@/config/gas"

export default {
  name: "RegisterForm",
  components: { Layout },
  data() {
    return {
      email: localStorage.getItem("savedEmail") || "",
      emailError: "",
    prenom: localStorage.getItem("savedPrenom") || "",
   

    codeAcces: "",
      confirmCodeAcces: "",
      cguAccepted: false,
          botField: "", // 🧠 ici !
    showCGU: false,
        showPrivacy: false,
      errorMessage: "", // ✅ Ajoute cette ligne
      message: "",
      passwordError: "",
      confirmPasswordError: "",
      isLoading: false, // Ajout du statut de chargement
      progress: 0, // Ajout pour la progression de la barre
      showPassword: false, // 🔥 Gère l'affichage du mot de passe
      showConfirmPassword: false, // 🔥 Gère l'affichage de la confirmation
    };
  },
watch: {
  email(newValue) {
    localStorage.setItem("savedEmail", newValue);
  },
  prenom(newValue) {
    localStorage.setItem("savedPrenom", newValue);
  },

  // 🔥 FIX mismatch live
  codeAcces() {
  this.validatePassword();
this.validatePasswordMatch();
if (this.passwordError || this.confirmPasswordError) return;
  },
  confirmCodeAcces() {
    this.validatePasswordMatch();
  }
},
  computed: {
    passwordsMatch() {
    return this.codeAcces && this.confirmCodeAcces && this.codeAcces === this.confirmCodeAcces;
  },
  progressPercentage() {
    let progress = 0;
    if (this.email) progress += 25;
    if (this.prenom) progress += 25;
    if (this.codeAcces.length >= 8) progress += 25;
    if (this.passwordsMatch) progress += 25;
    return `${progress}%`;
  },
  progressBarClass() {
    if (this.progressPercentage === "100%") return "strong";
    if (this.progressPercentage >= "50%") return "medium";
    return "weak";
  },
 isSubmitDisabled() {
  return (
    !!this.passwordError ||
    !!this.confirmPasswordError ||
    !this.cguAccepted
  );
}
,
    passwordStrengthClass() {
    if (this.codeAcces.length < 8) return "weak";
    if (/[A-Z]/.test(this.codeAcces) && /\d/.test(this.codeAcces) && /[@$!%*?&]/.test(this.codeAcces)) {
      return "strong";
    }
    return "medium";
  },
  passwordStrengthText() {
    return this.passwordStrengthClass === "weak" ? "Faible" :
           this.passwordStrengthClass === "medium" ? "Moyen" :
           "Fort";
  },
  },
  methods: {
validatePasswordMatch() {
  if (!this.confirmCodeAcces) {
    this.confirmPasswordError = "";
    return;
  }

  this.confirmPasswordError =
    this.codeAcces === this.confirmCodeAcces
      ? ""
      : "Les mots de passe ne correspondent pas.";
},
    validatePassword() {
      const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!strongPasswordRegex.test(this.codeAcces)) {
        this.passwordError = "Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.";
      } else {
        this.passwordError = "";
      }
    },
    validateEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.emailError = emailRegex.test(this.email) ? "" : "Adresse e-mail invalide.";
    
    if (this.emailError) {
      this.$nextTick(() => this.$refs.emailField.focus());
    }
  },
    startProgressBar() {
    this.progress = 0;
    const interval = setInterval(() => {
      if (this.progress < 90) {
        this.progress += 10; // La barre avance progressivement
      } else {
        clearInterval(interval); // On arrête avant d'atteindre 100%
      }
    }, 300); // Toutes les 300ms, la barre progresse
  },
  async submitForm() {
    if (this.botField) {
  console.warn("Tentative de bot détectée.");
  return;
}

  // Réinitialisation des messages
  this.errorMessage = "";
  this.message = "";
  this.validateEmail();

  // Vérification des champs requis
  if (!this.email || !this.prenom || !this.codeAcces || !this.confirmCodeAcces) {
    this.errorMessage = "Tous les champs sont obligatoires.";
    return;
  }


  // Vérification correspondance des mots de passe
  if (this.codeAcces !== this.confirmCodeAcces) {
    this.confirmPasswordError = "Les mots de passe ne correspondent pas.";
    return;
  } else {
    this.confirmPasswordError = "";
  }

  this.isLoading = true;
  this.startProgressBar();

  // Log des données
  console.log("Paramètres envoyés :", {
    email: this.email,
    prenom: this.prenom,
    codeAcces: this.codeAcces,
  });
const stripeLinks = {
  "abonnement-app": email => `https://buy.stripe.com/aFa9AUcXM1KA2RL6pk2Fa0A?prefilled_email=${encodeURIComponent(email)}`,
  "1h-carte": email => `https://buy.stripe.com/14A5kEaPEcpe3VP2942Fa0B?prefilled_email=${encodeURIComponent(email)}`,
  "3h-mensuel": email => `https://buy.stripe.com/cNi3cw4rggFu1NH1502Fa0C?prefilled_email=${encodeURIComponent(email)}`,
  "abo-mensuel": email => `https://buy.stripe.com/fZu28saPE2OE4ZT2942Fa0D?prefilled_email=${encodeURIComponent(email)}`,
  "abo-trimestriel": email => `https://buy.stripe.com/8x29AU3nc3SI63X3d82Fa0E?prefilled_email=${encodeURIComponent(email)}`
};



  try {
 const url = getProxyGetURL(
  `route=register&email=${encodeURIComponent(this.email)}&prenom=${encodeURIComponent(this.prenom)}&codeAcces=${encodeURIComponent(this.codeAcces)}&formule=${encodeURIComponent(this.formule)}`
)

const response = await fetch(url, { method: "GET" });


    const result = await response.json();

    console.log("Résultat de l'inscription :", result);

    if (result.success) {
      this.message = "Inscription réussie !";
      this.errorMessage = "";

      localStorage.setItem("user", JSON.stringify({
        email: this.email,
        prenom: this.prenom,
        id: result.id
      }));

  // 🔁 Redirection Stripe si formule sélectionnée
  if (this.formule && stripeLinks[this.formule]) {
    const redirectUrl = stripeLinks[this.formule](this.email);
window.open(redirectUrl, "_blank", "width=800,height=800");
this.$router.push('/mon-espace');


    return; // on stoppe ici
  }

    setTimeout(() => this.$router.push('/mon-espace'), 1500);
    } else {
      this.errorMessage = result.message || "Erreur lors de l'inscription.";
      this.message = "";
      // Réinitialise le formulaire
      this.email = "";
      this.prenom = "";
      this.codeAcces = "";
      this.confirmCodeAcces = "";
      this.cguAccepted = false;



  
    }

  } catch (error) {
    console.error("Erreur réseau ou serveur :", error);
    this.errorMessage = "Impossible de contacter le serveur.";
    this.message = "";
      window.scrollTo({ top: 0, behavior: "smooth" });

  } finally {
    this.progress = 100;
    setTimeout(() => {
      this.isLoading = false;
      this.progress = 0;
    }, 500);
  }
}


,
  },
};
</script>

<style scoped>
.btn-loading {
  opacity: 0.7;
  cursor: not-allowed;
}


.progress-container {
  width: 100%;
  background: #eee;
  border-radius: 5px;
  overflow: hidden;
  height: 8px;
  margin-bottom: 15px;
}
.progress-bar {
  height: 100%;
  background: #cace00;
  transition: width 0.5s ease-in-out;
}

.fade-enter-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.fade-enter {
  opacity: 0;
  transform: translateY(-10px);
}

@keyframes fadeIn {
  0% { opacity: 0; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}
.valid-feedback {
  animation: fadeIn 0.3s ease-in-out;
}

.match-indicator {
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.2rem;
}
.text-success {
  color: #28a745 !important; /* Vert */
}
.text-danger {
  color: #dc3545 !important; /* Rouge */
}

.spinner-border {
  vertical-align: middle;
  margin-right: 5px;
}
.text-danger {
  color: #ff4d4d;
  font-size: 0.9rem;
}
.register-container {
  max-width: 600px;
  margin: 0 auto;
  text-align:center;
  padding:15px;
}
/* 🔥 Stylisation du message de succès */
.success-message {
  background-color: #28a745; /* Vert succès */
  color: white;
  padding: 12px;
  border-radius: 8px;
  font-weight: bold;
  text-align: center;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.8s ease-in-out, bounce 1s infinite alternate;
}
.password-strength {
  margin-top: 5px;
}
.shake {
  animation: shake 0.3s ease-in-out;
}

@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
}

.strength-bar {
  height: 5px;
  border-radius: 3px;
  transition: width 0.3s ease-in-out, background 0.3s ease-in-out;
}

/* Couleurs selon la force */
.weak { width: 33%; background: red; }
.medium { width: 66%; background: orange; }
.strong { width: 100%; background: green; }

/* 🔥 Stylisation du message d'erreur */
.error-message {
  background-color: #dc3545; /* Rouge erreur */
  color: white;
  padding: 12px;
  border-radius: 8px;
  font-weight: bold;
  text-align: center;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.8s ease-in-out;
}

/* ✨ Animation d'apparition */
@keyframes fadeIn {
  0% { opacity: 0; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}

/* 🎉 Effet rebond doux */
@keyframes bounce {
  0% { transform: translateY(0); }
  100% { transform: translateY(-3px); }
}

.h2-immersive {
  font-weight: bold;
    animation: fadeIn 1.2s ease-in-out;
   /* Empêche le retour à la ligne */
  text-transform: uppercase; /* Force les majuscules */

  text-align: center;
  font-size: 1,5rem;
  background: linear-gradient(135deg,rgb(255, 255, 255),rgb(172, 172, 172));
  -webkit-background-clip: text;
  color: transparent; /* Texte en dégradé */
  text-shadow: 0px 4px 10px rgba(126, 126, 126, 0.5);
  padding: 10px;
  border-radius: 8px;
  display: inline-block;
  transition: transform 0.2s ease-in-out;
}
@media (max-width: 576px) { /* Ajuste sur mobiles */
  .h2-immersive {
    font-size: 1.5rem;
  }
}

@keyframes fadeIn {
  0% { opacity: 0; transform: translateY(-20px); }
  100% { opacity: 1; transform: translateY(0); }
}

.h2-immersive:hover {
  transform: scale(1.05); /* Effet zoom léger */
}

.container {
  max-width: 90% !important; /* S'étend à 90% de l’écran */
  width: 100%;
}

/* Conteneur de la barre */
.loading-container {
  width: 100%;
  height: 15px;
  background-color: rgb(255, 255, 255); /* Couleur de fond légère */
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 10px;
}

/* Barre de chargement animée */
.loading-bar {
  width: 0%;
  height: 100%;
  background-color: #ff1e00; /* Couleur principale */
  transition: width 4s ease-in-out; /* Remplissage fluide */
  animation: progressBar 4s linear forwards;
}

/* Animation qui fait avancer la barre */
@keyframes progressBar {
  0% { width: 0%; }
  100% { width: 100%; }
}

.password-container {
  position: relative;
}

.password-wrapper {
  position: relative;
  width: 100%;
}

.toggle-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  font-size: 0.8rem;
  color: #202020;
  transition: color 0.3s ease;
}

.toggle-password:hover {
  color: #ff5e00;
}

.loading-bar {
  height: 100%;
  background-color: #ff8c00 !important; /* Orange plus doux */
  transition: width 0.3s ease-in-out;
}

.card {
  border-radius: 12px;
  max-width: 150%;
  width: 100%;
  background: rgba(255, 255, 255, 0.1); /* Légère transparence */
  backdrop-filter: blur(10px); /* Effet de flou pour un look moderne */
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  padding: 30px;
  color: #fff;
}

.card h2 {
  font-weight: bold;
  color: #fff; /* Blanc pour fond sombre */
  text-align: center;
}

input {
  border-radius: 0px; /* Suppression des angles arrondis */
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  color: black;
  border: 1px solid rgba(200, 200, 200, 0.5); /* Bordure plus discrète */
  padding: 8px; /* Réduction de l’espace interne */
  font-size: 0.9rem; /* Réduction de la taille du texte */
  height: 36px; /* Hauteur plus compacte */
}

input:focus {
  border-color: #ff8c00;
  box-shadow: none; /* Supprime l’effet de focus flou */
}
.form-label {
  font-weight: bold;
  color: #fff;
}
.btn-primary {
  background: #ff3300 !important; /* Orange */
  border: none !important;
  font-weight: bold;
  padding: 12px;
  border-radius: 8px;
  transition: background 0.3s ease;
  color: white !important;
}
/* Style de la case à cocher */
.form-check-input {
  width: 18px;
  height: 18px;
  background-color: transparent;
  border: 2px solid #ff8c00 !important; /* Bordure orange */
  cursor: pointer;
  transition: all 0.3s ease;
}

/* Case cochée */
.form-check-input:checked {
  background-color: #a12000 !important; /* Fond orange */
  border-color: #e4e4e496 !important;
}

/* Au survol */
.form-check-input:hover {
  border-color: #ff5e00 !important; /* Bordure plus vive */
}

/* Style du label */
.form-check-label {
  font-weight: bold;
  color: white !important;
  cursor: pointer;
}

/* Adapter pour le mode sombre */
@media (prefers-color-scheme: dark) {
  .form-check-input {
    border-color: #ff8c00 !important;
  }

  .form-check-input:checked {
    background-color: #ff8c00 !important;
    border-color: #ff8c00 !important;
  }

  .form-check-label {
    color: white !important;
  }
}

.btn-primary:hover {
  background: #ff0000;
  animation: pulse 1s infinite alternate;
}
/* Effet pulsant */
@keyframes pulse {
  0% { transform: scale(1); }
  100% { transform: scale(1.05); }
}
.forgot-password-link {
  color: #ff8c00;
  font-weight: bold;
  text-decoration: none;
}

.forgot-password-link:hover {
  text-decoration: underline;
}

/* Effet focus animé */
@keyframes glow {
  0% { box-shadow: 0 0 5px rgba(255, 140, 0, 0.5); }
  50% { box-shadow: 0 0 20px rgba(255, 140, 0, 0.8); }
  100% { box-shadow: 0 0 5px rgba(255, 140, 0, 0.5); }
}

input:focus {
  animation: glow 1s infinite alternate;
}

/* Ajustement global */
.container {
  margin-top: 50px;
}

/* Empêcher Chrome de stocker les mots de passe */
input:-webkit-autofill {
  background-color: transparent !important;
}
@media (max-width: 768px) {
  .register-container {
    padding: 12px;
  }
  input {
    font-size: 1rem;
   
  }
  .btn-primary {
    font-size: 1rem;
   
  }
}
.progress-bar.weak {
  background-color: red;
}
.progress-bar.medium {
  background-color: orange;
}
.progress-bar.strong {
  background-color: green;
}
.link-text {
  color: #ff8c00;
  text-decoration: underline;
  cursor: pointer;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.modal-content {
  background: #fff;
  color: #000;
  max-width: 600px;
  width: 90%;
  max-height: 80%;
  border-radius: 10px;
  padding: 20px;
  overflow: hidden;
  animation: fadeIn 0.3s ease-in-out;
}
.modal-content h3 {
  margin-bottom: 10px;
  text-align: center;
}
.scrollable {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 10px;
}

.modal-overlay {
  animation: fadeIn 0.3s ease-in-out forwards;
}

.modal-overlay-leave-active {
  animation: fadeOut 0.2s ease-in-out forwards;
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
.register-container {
  padding-bottom: calc(env(safe-area-inset-bottom, 20px) + 80px); /* Prend en compte les iPhones + navbar */
}


</style>

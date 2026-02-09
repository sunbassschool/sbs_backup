<template>
  <Layout>
    <div class="register-choice-container">

      <h1 class="title">Créer un compte</h1>
      <p class="subtitle">Comment veux-tu utiliser la plateforme ?</p>

      <div class="choices">
        <button class="choice-card prof" @click="goProf">
          <div class="emoji">🎸</div>
          <div class="title">Je suis professeur</div>
          <div class="desc">Créer mon espace, gérer mes élèves</div>
          <div class="cta">Créer un compte professeur →</div>
        </button>

        <button class="choice-card eleve" @click="goEleve">
          <div class="emoji">👨‍🎓</div>
          <div class="title">Je suis élève</div>
          <div class="desc">Accéder à mes cours et contenus</div>
          <div class="cta">Créer un compte élève →</div>
        </button>
      </div>

  <p class="foot-note">  <router-link to="/login" class="login-link">

  Déjà inscrit ?
    Se connecter
  </router-link>
</p>


    </div>
  </Layout>
</template>

<script>
import Layout from "@/views/Layout.vue";

export default {
  name: "RegisterChoice",
  components: { Layout },
  methods: {
    goProf() {
      this.$router.push("/register/prof");
    },
    goEleve() {
      this.$router.push("registerform"); // invite-only plus tard
    }
  }
};
</script>

<style scoped>
/* =====================================================
   SBS – Register choice / Intuitif & orienté action
   ===================================================== */

.register-choice-container {
  max-width: 520px;
  margin: 0 auto;
  padding: 32px 14px 44px;
  text-align: center;
}

/* TITRES */
.title {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: .3px;
}

.subtitle {
  margin: 6px 0 26px;
  font-size: .9rem;
  color: rgba(255,255,255,.55);
}

/* GRID */
.choices {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
}

/* CARD = ACTION */
.choice-card {
  position: relative;
  padding: 20px 18px 22px;
  border-radius: 16px;

  background: linear-gradient(
    180deg,
    rgba(255,255,255,.07),
    rgba(255,255,255,.015)
  );

  border: 1px solid rgba(255,255,255,.1);
  color: #fff;
  cursor: pointer;

  text-align: center;

  transition:
    transform .18s ease,
    box-shadow .18s ease,
    border-color .18s ease;
}

/* HOVER = "CLIQUE ICI" */
.choice-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 36px rgba(0,0,0,.6);
}

/* ICON */
.choice-card .emoji {
  font-size: 1.7rem;
  margin-bottom: 8px;
  opacity: .95;
}

/* TEXTE */
.choice-card .title {
  font-size: 1.05rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.choice-card .desc {
  font-size: .85rem;
  line-height: 1.35;
  color: rgba(255,255,255,.65);
}

/* CTA VISUEL */
.choice-card .cta {
  margin-top: 12px;
  font-size: .8rem;
  font-weight: 600;
  opacity: .7;
  transition: opacity .15s ease, transform .15s ease;
}

.choice-card:hover .cta {
  opacity: 1;
  transform: translateX(2px);
}

/* ACCENTS PROF / ELEVE */
.choice-card.prof {
  border-left: 3px solid rgba(255,160,60,.9);
}

.choice-card.prof:hover {
  border-color: rgba(255,160,60,1);
  box-shadow: 0 14px 36px rgba(255,140,0,.22);
}

.choice-card.eleve {
  border-left: 3px solid rgba(80,180,255,.9);
}

.choice-card.eleve:hover {
  border-color: rgba(80,180,255,1);
  box-shadow: 0 14px 36px rgba(0,160,255,.22);
}

/* FOOT NOTE */
.foot-note {
  margin-top: 30px;
  font-size: .8rem;
  color: rgba(255,255,255,.45);
}

/* DESKTOP */
@media (min-width: 768px) {
  .choices {
    grid-template-columns: 1fr 1fr;
  }
}

/* MOBILE */
.choice-card:active {
  transform: scale(.985);
}

.choice-card:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 2px rgba(255,255,255,.15),
    0 14px 36px rgba(0,0,0,.6);
}

@media (max-width: 480px) {
  .subtitle {
    display: none;
  }
}
.foot-note {
  margin-top: 30px;
  font-size: .8rem;
  color: rgba(255,255,255,.45);
}

.login-link {
  margin-left: 6px;
  color: rgba(255,160,60,.95);
  font-weight: 700;
  text-decoration: none;
  transition: opacity .15s ease, transform .15s ease;
}

.login-link:hover {
  opacity: 1;
  text-decoration: underline;
  transform: translateY(-1px);
}

</style>

<template>
  <Layout>
    <div class="register-choice-container">
<h2 class="h2-immersive">SunBassSchool</h2>
<p class="subtitle">Sélection du profil</p>


      <div class="choices">
        <button class="choice-card prof" @click="goProf">
          <div class="emoji">🎸</div>
          <div class="title">Professeur</div>
          <div class="desc">Créer ton espace, gérer tes élèves</div>
        </button>

        <button class="choice-card eleve" @click="goEleve">
          <div class="emoji">👨‍🎓</div>
          <div class="title">Élève</div>
          <div class="desc">Accéder à ton espace de cours</div>
        </button>
      </div>
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
   SBS – Register choice / Full dark premium
   ===================================================== */

.register-choice-container {
  max-width: 520px;
  margin: 0 auto;
  padding: 28px 14px 42px;
  text-align: center;
}

.h2-immersive {
  font-weight: 700;
  letter-spacing: 0.4px;
}

.subtitle {
  margin: 6px 0 28px;
  font-size: 0.9rem;
  color: rgba(255,255,255,0.55);
}

/* GRID */
.choices {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

/* CARD */
.choice-card {
  position: relative;
  padding: 18px 18px 20px;
  border-radius: 14px;

  background: linear-gradient(
    180deg,
    rgba(255,255,255,0.06),
    rgba(255,255,255,0.015)
  );

  border: 1px solid rgba(255,255,255,0.08);

  color: #fff;
  cursor: pointer;

  transition: transform 0.18s ease,
              box-shadow 0.18s ease,
              border-color 0.18s ease;
}

/* Hover – discret & premium */
.choice-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 10px 30px rgba(0,0,0,0.55);
}

/* Emoji minimal */
.choice-card .emoji {
  font-size: 1.6rem;
  margin-bottom: 6px;
  opacity: 0.9;
}

/* Text */
.choice-card .title {
  font-size: 1.05rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.choice-card .desc {
  font-size: 0.85rem;
  line-height: 1.35;
  color: rgba(255,255,255,0.6);
}

/* PROF accent */
.choice-card.prof {
  border-left: 2px solid rgba(255,160,60,0.8);
}
.choice-card.prof:hover {
  border-color: rgba(255,160,60,0.9);
  box-shadow:
    0 10px 30px rgba(255,140,0,0.18);
}

/* ELEVE accent */
.choice-card.eleve {
  border-left: 2px solid rgba(80,180,255,0.8);
}
.choice-card.eleve:hover {
  border-color: rgba(80,180,255,0.9);
  box-shadow:
    0 10px 30px rgba(0,160,255,0.18);
}

/* Desktop */
@media (min-width: 768px) {
  .choices {
    grid-template-columns: 1fr 1fr;
  }
}

/* Touch feedback (PWA) */
.choice-card:active {
  transform: scale(0.985);
}

@media (max-width: 480px) {
  .subtitle {
    display: none;
  }
}
.choice-card {
  padding: 18px 18px 22px;
}
.choice-card::after {
  content: "";
  position: absolute;
  inset: -6px;
}
.choice-card:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 2px rgba(255,255,255,0.15),
    0 10px 30px rgba(0,0,0,0.5);
}

</style>

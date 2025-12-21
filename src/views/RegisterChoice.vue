<template>
  <Layout>
    <div class="register-choice-container">
      <h2 class="h2-immersive">🚀 Bienvenue</h2>
      <p class="subtitle">Tu veux rejoindre SunBassSchool en tant que :</p>

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
.register-choice-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 30px 15px;
  text-align: center;
}

.subtitle {
  color: #ccc;
  margin-bottom: 30px;
}

.choices {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.choice-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 25px;
  cursor: pointer;
  color: white;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.choice-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.12);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
}

.choice-card .emoji {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.choice-card .title {
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 6px;
}

.choice-card .desc {
  font-size: 0.95rem;
  opacity: 0.8;
}

.choice-card.prof {
  border-color: rgba(255, 140, 0, 0.6);
}

.choice-card.eleve {
  border-color: rgba(0, 180, 255, 0.6);
}

@media (min-width: 768px) {
  .choices {
    grid-template-columns: 1fr 1fr;
  }
}
</style>

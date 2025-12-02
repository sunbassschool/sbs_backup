<template>
  <Layout>
    <div class="container-xxl mt-4">
      <div ref="scrollContainer" class="refreshable-area">
      <div v-if="isRefreshing" class="refresh-spinner-overlay">
  <span class="spinner-border custom-spinner" role="status" aria-hidden="true"></span>
</div>

        <!-- 🔄 Loader pendant le chargement -->
        <div v-if="loading" class="d-flex justify-content-center align-items-center mt-5">
          <div class="spinner-border custom-spinner" role="status" style="width: 1.5rem; height: 1.5rem;">
            <span class="visually-hidden">Chargement...</span>
          </div>
        </div>

        <!-- ✅ Message si aucun cours trouvé -->
        <div v-if="!loading && upcomingCourses.length === 0" class="alert alert-warning text-center mt-3">
          <p class="mb-2">🎸 Aucun cours à venir pour le moment.</p>
          <RouterLink
            to="/abonnements"
            class="btn btn-sm mt-2 fw-bold"
            style="background-color: #333; color: white;"
          >
            🔓 Débloquer avec un abonnement
          </RouterLink>
        </div>

        <!-- ✅ Tableau des cours -->
        <div v-if="!loading && upcomingCourses.length > 0" class="table-responsive mt-3">
          <table class="table table-hover shadow-sm" style="font-size: 1rem;">
            <thead class="table-dark">
              <tr>
                <th scope="col">📆 Date & Heure</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in upcomingCourses" :key="index" @click="openMeet(row.meet)" class="clickable-row">
                <td><strong>{{ row.formattedDate }}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script>
import Layout from "../views/Layout.vue";
import axios from "axios";
import { ref, computed, onMounted, nextTick, watchEffect } from "vue";
import { useInstagramPullToRefresh } from "@/composables/useInstagramPullToRefresh";

import { usePullToRefresh } from "@/composables/usePullToRefresh";

export default {
  name: "Planning",
  components: { Layout },
  setup() {
    const planningData = ref([]);
    const loading = ref(true);
    const isRefreshing = ref(false); // 🆕
    const scrollContainer = ref(null);

    const email = ref(localStorage.getItem("email") || "");
    const prenom = ref(localStorage.getItem("prenom") || "");

const fetchPlanningData = async (forceApi = false) => {
  console.log("🚀 fetchPlanningData() appelé !");

  if (!email.value || !prenom.value) {
    console.error("❌ Email ou prénom manquant !");
    loading.value = false;
    return;
  }

  const cacheKey = `planning_${email.value}_${prenom.value}`;
  const cacheTimestampKey = `${cacheKey}_timestamp`;
  const cacheDuration = 24 * 60 * 60 * 1000;

  const cachedData = localStorage.getItem(cacheKey);
  const cacheTimestamp = localStorage.getItem(cacheTimestampKey);
  const cacheExpired = !cacheTimestamp || Date.now() - parseInt(cacheTimestamp, 10) > cacheDuration;

  if (cachedData && !cacheExpired && !forceApi) {
    try {
      const parsedData = JSON.parse(cachedData);
      if (parsedData.success && Array.isArray(parsedData.planning)) {
        console.log("⚡ Chargement depuis le cache");
        planningData.value = parsedData.planning;
        loading.value = false;
        return;
      }
    } catch (error) {
      console.error("❌ Erreur parsing cache :", error);
    }
  }

  // 👇 API call si cache expiré ou si forceApi est true
  try {
    const baseURL = "https://script.google.com/macros/s/AKfycbw7aU_Z20EZKV8AytvPPYMhTLxtQNegdpg5ImFeiGqY35jKfRB0gk3pIhXTOFS7NaCTZA/exec";
    const internalURL = `${baseURL}?route=planning&email=${encodeURIComponent(email.value)}&prenom=${encodeURIComponent(prenom.value)}`;
    const finalURL = `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(internalURL)}`;
    const response = await axios.get(finalURL);

    if (response.data.success && Array.isArray(response.data.planning)) {
      planningData.value = response.data.planning;
      localStorage.setItem(cacheKey, JSON.stringify(response.data));
      localStorage.setItem(cacheTimestampKey, Date.now().toString());
    }
  } catch (error) {
    console.error("❌ Erreur API :", error);
    alert("Erreur lors du chargement du planning.");
  } finally {
    loading.value = false;
  }
};


const handleRefresh = async () => {
  console.log("🔁 Rafraîchissement via scroll");
  isRefreshing.value = true; // 👈 affiche le loader
  await fetchPlanningData(true); // 👈 On force l'appel API
// 👈 appel direct, pas de cache
  isRefreshing.value = false; // 👈 stop le loader
};



   watchEffect(() => {
  if (scrollContainer.value) {
    usePullToRefresh({
      container: scrollContainer,
      threshold: 60,
      onRefresh: handleRefresh
    });
  }
});


onMounted(async () => {
  await fetchPlanningData();
  await nextTick();

  if (scrollContainer.value) {
      useInstagramPullToRefresh({
    containerRef: scrollContainer,
    threshold: 50,
    onRefresh: handleRefresh
  });
  } else {
    console.warn("❌ scrollContainer est null");
  }
});


    const openMeet = (url) => {
      if (url) window.open(url, "_blank");
    };

    const upcomingCourses = computed(() => {
      const now = new Date();
      return planningData.value.filter((course) => {
        const courseDate = new Date(course.date || course.formattedDate);
        return courseDate >= now;
      });
    });

 return {
  planningData,
  loading,
  openMeet,
  upcomingCourses,
  scrollContainer,
  isRefreshing // 👈 Ajout obligatoire
};

  },
};
</script>

<style scoped>
.refreshable-area {
  position: relative; /* ✅ Ajoute ça si manquant */
  overflow-y: auto;
  height: calc(100vh - 120px);
  -webkit-overflow-scrolling: touch;
  transition: transform 0.3s ease;
  will-change: transform;
}


.custom-spinner {
  width: 1.2rem;
  height: 1.2rem;
  border-width: 0.15em;
  border-color: #8B0000 transparent #8B0000 transparent; /* rouge foncé */
  animation: custom-spin 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  opacity: 0.85; /* discrétion */
}

@keyframes custom-spin {
  0% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.1);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}

.vue3-pull-to-refresh__spinner {
  color: #dc3545; /* ou la couleur de ton thème */
}

/* ✅ Style amélioré */
h2 {
  font-weight: bold;
  color: #343a40;
}

/* ✅ Conteneur principal en pleine largeur */
.container-xxl {
  width: 100% !important;
  max-width: 100% !important;
  padding-left: 15px;
  padding-right: 15px;
}

/* ✅ S'assurer que tout le contenu est bien aligné sur toute la largeur */
.container-xxl > div {
  width: 100%;
}

/* ✅ Rendre le tableau fluide en responsive */
.table-responsive {
  width: 100%;
  overflow-x: auto;
}

/* ✅ Meilleure lisibilité du tableau */
.table {
  border-radius: 10px;
  overflow: hidden;
  width: 100%;
  font-size: 1rem;
}

.table th, .table td {
  padding: 15px;
  text-align: center;
  vertical-align: middle;
  white-space: nowrap;
}

.table th {
  background-color: #212529;
  color: #ffffff;
}

/* ✅ Effet au survol et curseur main */
.table-hover tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

/* ✅ Messages d'alerte en pleine largeur */
.alert {
  width: 100%;
  font-weight: bold;
  font-size: 1.1rem;
  text-align: center;
  padding: 20px;
}

/* ✅ Boutons en pleine largeur sur petits écrans */
.d-flex.justify-content-center.gap-3 {
  width: 100%;
  flex-wrap: wrap;
  justify-content: center;
}

.d-flex.justify-content-center.gap-3 .btn {
  flex: 1;
  min-width: 150px;
  max-width: 300px;
  text-align: center;
}

/* ✅ Adaptation mobile (≤ 768px) */
@media (max-width: 768px) {
  .table th, .table td {
    padding: 10px;
    font-size: 0.9rem;
  }
}

/* ✅ Adaptation très petits écrans (≤ 576px) */
@media (max-width: 576px) {
  .container-xxl {
    padding-left: 5px;
    padding-right: 5px;
  }

  .alert {
    font-size: 1rem;
    padding: 10px;
  }
}

.refresh-wrapper {
  max-height: 75vh; /* ajuste selon ton besoin */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* pour iOS */
  background-color: white;
  border-radius: 10px;
}

.refresh-inner {
  padding: 10px;
}
.refresh-spinner-overlay {
  position: sticky;
  top: 0px; /* Ajuste selon ton besoin visuel */
  display: flex;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
}

</style>


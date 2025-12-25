<template>
    <Layout>
      <div class="container mt-4">
        
  
        <!-- Barre de recherche et filtres -->
        <div class="row mb-3">
          <div class="col-12 col-md-4 mb-2 mb-md-0">
            <input v-model="search" class="form-control" placeholder="🔎 Rechercher..." />
          </div>
          <div class="col-12 col-md-4 mb-2 mb-md-0">
            <select v-model="selectedStyle" class="form-control">
              <option value="">🎵 Tous les styles</option>
              <option v-for="style in styles" :key="style" :value="style">{{ style }}</option>
            </select>
          </div>
          <div class="col-12 col-md-4">
            <select v-model="selectedLevel" class="form-control">
              <option value="">📊 Tous les niveaux</option>
              <option v-for="level in levels" :key="level" :value="level">{{ level }}</option>
            </select>
          </div>
        </div>
  
        <!-- Chargement -->
        <div v-if="loading" class="d-flex justify-content-center mt-4">
          <div class="spinner-border text-primary" role="status"></div>
        </div>
  <!-- EMPTY STATE -->
<div
  v-if="emptyMessage"
  class="alert alert-info text-center mt-4"
>
  <p class="mb-2">{{ emptyMessage }}</p>

  <button
    v-if="showUploadCTA"
    class="btn btn-primary"
    @click="$router.push('/mes-uploads')"
  >
    ➕ Ajouter mes partitions
  </button>
</div>

        <!-- Liste des partitions -->
        <div v-else>
          <!-- Mode Bureau (Tableau) -->
          <div class="d-none d-md-block">
            <div class="table-responsive">
              <table class="table table-hover shadow-sm">
                <thead class="table-dark">
                  <tr>
                    <th>🎼 Nom</th>
                    <th>✍️ Auteur</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(partition, index) in filteredPartitions" :key="index" @click="openPartition(partition.id)" class="clickable-row">
                    <td>{{ partition.nom }}</td>
                    <td>{{ partition.auteur }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
  
          <!-- Mode Mobile (Liste simple) -->
          <div class="d-md-none">
            <ul class="list-group">
              <li v-for="(partition, index) in filteredPartitions" :key="index" 
                  @click="openPartition(partition.id)" 
                  class="list-group-item d-flex justify-content-between align-items-center clickable-row">
                <div>
                  <strong>🎼 {{ partition.nom }}</strong>
                  <p class="text-muted m-0 small">✍️ {{ partition.auteur }}</p>
                </div>
                <span class="badge bg-primary text-white">📄</span>
              </li>
            </ul>
          </div>
  
        </div>
      </div>
    </Layout>
  </template>
  
  <script>
import Layout from "../views/Layout.vue";
import axios from "axios";
import { ref, computed, onMounted, watch } from "vue";
import { useAuthStore } from "@/stores/authStore.js"


export default {
  name: "Partitions",
  components: { Layout },
  setup() {
    const partitions = ref([]);
    const loading = ref(true);
    const search = ref("");
    const selectedStyle = ref("");
    const selectedLevel = ref("");
const userData = JSON.parse(localStorage.getItem("userData_") || "{}")

const auth = useAuthStore()
const currentProfId = computed(() => auth.prof_id)
    const SHEET_ID = "1PuxK7najS8M8v6h3XQMwOaH5skTNWDJXI3zYiLO1rRM";
    const API_KEY = "AIzaSyBo0kz-JkCiuWumprwn5kpiVPqYmKr5NZI";
    const RANGE = "'partitions'!A2:N";

    // ⏳ Définition de la durée du cache (5 minutes)
    const cacheDuration = 24 * 60 * 60 * 1000; // 24 heures
 
const isProf = computed(() => auth.user?.role === "prof")
const noProfId = computed(() => !auth.user?.prof_id)
const noResults = computed(() =>
  !loading.value && filteredPartitions.value.length === 0
)
const emptyMessage = computed(() => {
  if (!noResults.value) return ""

  return isProf.value
    ? "Aucune partition n’est encore associée à ton compte."
    : "Ton professeur n’a pas encore partagé de partitions."
})

const showUploadCTA = computed(() =>
  isProf.value && !loading.value && filteredPartitions.value.length === 0
)

const fetchPartitions = async () => {
  console.log("👤 auth.prof_id =", auth.prof_id)

  if (!auth.prof_id) {
    console.warn("⛔ abort fetch → prof_id absent")
    loading.value = false
    return
  }

  const cacheKey = `partitions_cache_${auth.prof_id}`
  const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`)
  const cachedData = localStorage.getItem(cacheKey)

  console.log("🧠 cacheKey =", cacheKey)
  console.log("🧠 cacheTimestamp =", cacheTimestamp)
  console.log("🧠 cachedData exists =", !!cachedData)

  if (cachedData && cacheTimestamp && Date.now() - cacheTimestamp < cacheDuration) {
    console.log("⚡ cache HIT")
    partitions.value = JSON.parse(cachedData)
    console.log("📦 partitions (cache) =", partitions.value)
    loading.value = false
    return
  }

  try {
    console.log("🌐 API fetch start")

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`
    const response = await axios.get(url)
    const rows = response.data.values || []

    console.log("📊 rows.length =", rows.length)
    console.log("📊 first row =", rows[0])

    const mapped = rows.map((row, i) => {
      const obj = {
        nom: row[0],
        auteur: row[1],
        style: row[2] || "",
        niveau: row[3] || "",
        id: row[8],
    prof_id: (row[13] || "").toString().trim()
      }

      console.log(`🧩 row ${i} prof_id =`, obj.prof_id)
      console.log("🧪 auth.prof_id =", auth.prof_id)
console.log("🧪 sheet prof_id unique =", [...new Set(rows.map(r => r[13]))])

      return obj
    })

    console.log("🔍 current prof_id =", auth.prof_id)

    const filtered = mapped.filter(p => {
      const ok = !p.prof_id || p.prof_id === auth.prof_id
      if (!ok) {
        console.warn("❌ FILTER OUT", p.nom, p.prof_id)
      }
      return ok
    })

    console.log("✅ filtered count =", filtered.length)

    partitions.value = filtered

    localStorage.setItem(cacheKey, JSON.stringify(filtered))
    localStorage.setItem(`${cacheKey}_timestamp`, Date.now())

  } catch (e) {
    console.error("💥 API ERROR", e)
  } finally {
    loading.value = false
    console.log("🏁 fetchPartitions END")
  }
}

;

    // ✅ Filtrage des partitions
    const filteredPartitions = computed(() => {
      const lowerSearch = search.value.toLowerCase();
      return partitions.value.filter(partition =>
        (lowerSearch === "" || partition.nom.toLowerCase().includes(lowerSearch) ||
         partition.auteur.toLowerCase().includes(lowerSearch)) &&
        (selectedStyle.value === "" || partition.style === selectedStyle.value) &&
        (selectedLevel.value === "" || partition.niveau === selectedLevel.value)
      );
    });

    // ✅ Récupération des styles uniques
    const styles = computed(() => {
      const uniqueStyles = new Set(partitions.value.map(p => p.style).filter(Boolean));
      return [...uniqueStyles];
    });

    // ✅ Récupération des niveaux uniques
    const levels = computed(() => {
      const uniqueLevels = new Set(partitions.value.map(p => p.niveau).filter(Boolean));
      return [...uniqueLevels];
    });

    // ✅ Fonction pour ouvrir une partition
    const openPartition = (fileId) => {
      window.open(`https://drive.google.com/file/d/${fileId}/view`, "_blank");
    };

watch(
  [() => auth.authReady, () => auth.user?.prof_id],
  ([ready, profId]) => {
    if (!ready || !profId) return
    fetchPartitions()
  },
  { immediate: true }
)


    return { partitions, loading, search, selectedStyle, selectedLevel, styles, levels,  emptyMessage,
  noResults,
  showUploadCTA, filteredPartitions, openPartition };
  },
};
</script>

  
  
  <style scoped>
  h2 {
    font-weight: bold;
    color: #343a40;
  }
  
  .table-responsive {
    overflow-x: auto;
  }
  
  .table {
    border-radius: 10px;
    overflow: hidden;
  }
  
  .table th, .table td {
    padding: 8px;
    text-align: center;
    vertical-align: middle;
    white-space: nowrap;
    font-size: 14px;
  }
  
  .table th {
    background-color: #212529;
    color: #ffffff;
  }
  
  .table-hover tbody tr:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .clickable-row {
    cursor: pointer;
    transition: transform 0.1s ease-in-out;
  }
  
  .clickable-row:hover {
    transform: scale(1.02);
  }
  
  /* Mode mobile (Liste) */
  .list-group-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    font-size: 16px;
    border: none;
    border-bottom: 1px solid #ddd;
    cursor: pointer;
    transition: background 0.1s ease-in-out;
  }
  
  .list-group-item:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  
  .list-group-item strong {
    font-size: 16px;
  }
  
  .list-group-item p {
    font-size: 12px;
    color: #6c757d;
  }
  
  .badge {
    font-size: 14px;
    padding: 6px 10px;
  }
  .table-responsive {
  max-width: 100%;
  overflow-x: auto;
}
body {
  overflow-x: hidden;
}

.container {
  max-width: 100vw;
  overflow-x: hidden;
}
#sw-update-toast {
  max-width: 95vw;
  box-sizing: border-box;
  word-wrap: break-word;
}
* {
  max-width: 100vw;
  box-sizing: border-box;
}

  @media (max-width: 768px) {
    .table th, .table td {
      font-size: 12px;
      padding: 6px;
    }
  }
  </style>
  
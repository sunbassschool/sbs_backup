<template>
  <Layout>
    <div class="container mt-4">
      <!-- 🔽 Sélecteur de date -->
      <div class="mb-3">
        <select v-model="selectedCourse" class="form-select">
          <option disabled value="">-- Choisir une date --</option>
          <option v-for="(row, index) in replayCourses" :key="index" :value="row.formattedDate">
            {{ row.formattedDate }} - {{ row.commentaire || "Sans titre" }}
          </option>
        </select>
      </div>

      <!-- 📦 Scroll horizontal de cartes -->
      <div class="cards-scroll-wrapper">
        <div 
          class="replay-card" 
          v-for="(row, index) in replayCourses" 
          :key="row.formattedDate + index"
        >
          <h5>{{ row.formattedDate }}</h5>
          <p><strong>Trimestre:</strong> {{ row.trimestre || "Non défini" }}</p>
          <p><strong>Commentaire:</strong> {{ row.commentaire || "Aucun" }}</p>

          <!-- Miniature + clic pour lecture -->
          <img
            v-if="generateThumbnail(row.lienReplay)"
            :src="generateThumbnail(row.lienReplay)"
            alt="Miniature Replay"
            class="thumbnail"
            @click="openVideo(row.lienReplay, row.formattedDate)"
          />
          <div 
            v-else 
            class="thumbnail placeholder" 
            @click="openVideo(row.lienReplay, row.formattedDate)"
          >
            ▶
          </div>

          <!-- Lien téléchargement si disponible -->
          <a
            v-if="generateDownloadLink(row.lienReplay)"
            :href="generateDownloadLink(row.lienReplay)"
            target="_blank"
            class="btn btn-primary btn-sm mt-2"
          >
            Télécharger
          </a>
        </div>
      </div>

      <!-- 🎬 Modale vidéo -->
      <div v-if="showModal" class="modal fade show d-block" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ currentVideoTitle }}</h5>
              <button type="button" class="btn-close" @click="closeModal"></button>
            </div>
            <div class="modal-body">
              <iframe
                :src="videoUrl"
                frameborder="0"
                allowfullscreen
                width="100%"
                height="315"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Layout from '../views/Layout.vue'

const selectedCourse = ref('')
const planningData = ref([])
const showModal = ref(false)
const videoUrl = ref('')
const currentVideoTitle = ref('')

const sortedPlanningData = computed(() =>
  [...planningData.value].sort((a, b) => new Date(a.formattedDate) - new Date(b.formattedDate))
)

const replayCourses = computed(() =>
  sortedPlanningData.value.filter(
    r => r.lienReplay && r.lienReplay !== "Pas de replay disponible" && r.lienReplay !== "pb de connection"
  )
)

function generateThumbnail(url) {
  const match = url?.match(/\/d\/(.*?)\//)
  return match ? `https://drive.google.com/thumbnail?id=${match[1]}` : null
}

function generateDownloadLink(url) {
  const match = url?.match(/\/d\/(.*?)\//)
  return match ? `https://drive.google.com/uc?export=download&id=${match[1]}` : null
}

function openVideo(url, title) {
  const match = url?.match(/\/d\/(.*?)\//)
  videoUrl.value = match ? `https://drive.google.com/file/d/${match[1]}/preview` : ''
  currentVideoTitle.value = title
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  videoUrl.value = ''
}

async function fetchPlanningData() {
  const jwt = sessionStorage.getItem("jwt") || localStorage.getItem("jwt") || ""
  const email = localStorage.getItem("email") || ""
  const prenom = localStorage.getItem("prenom") || ""
  if (!jwt || !email || !prenom) return

  const route = "planning"
  const targetBase = "https://script.google.com/macros/s/AKfycbwHHn4fLoE8pa1LaoDKnUg6BVPNRH3t5qaFwD73g3cGfp-azNLIsWO8aqP_leoVSde2rA/exec"
  const fullTargetUrl = `${targetBase}?route=${route}&email=${encodeURIComponent(email)}&prenom=${encodeURIComponent(prenom)}&jwt=${encodeURIComponent(jwt)}`
  const proxyUrl = `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(fullTargetUrl)}`

  const res = await fetch(proxyUrl)
  const json = await res.json()
  if (json.success && json.planning) {
    planningData.value = json.planning
  }
}

onMounted(() => {
  fetchPlanningData()
})
</script>

<style scoped>
.cards-scroll-wrapper {
  display: flex;
  overflow-x: auto;
  gap: 1rem;
  padding-bottom: 1rem;
  scroll-snap-type: x mandatory;
}

.replay-card {
  flex: 0 0 auto;
  width: 260px;
  scroll-snap-align: start;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0.75rem;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
}

.thumbnail {
  width: 100%;
  height: auto;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.thumbnail.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #333;
  color: #fff;
  height: 150px;
  font-size: 2rem;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}
</style>

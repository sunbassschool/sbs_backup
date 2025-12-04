
<template>
  <Layout>
    <div class="container mt-4">
      <!-- ✅ Menu déroulant -->
      <div class="mb-3">
       <div class="input-group">
  <span class="input-group-text bg-white"><i class="bi bi-calendar3"></i></span>
  <select v-model="selectedCourse" class="form-select border-start-0">
    <option disabled value="">Choisir un replay</option>
    <option v-for="(row, index) in replayCourses" :key="index" :value="row.formattedDate">
      📅 {{ row.formattedDate }} — {{ row.commentaire || "Sans titre" }}
    </option>
  </select>
</div>

      </div>

     <!-- 🔄 Loading spinner -->
<div v-if="isLoading" class="text-center my-5">
  <div class="spinner-border text-primary" role="status">
    <span class="visually-hidden">Chargement...</span>
  </div>
</div>

<!-- 🧾 Aucun replay -->
<div v-else-if="replayCourses.length === 0" class="alert alert-info text-center">
  Aucun replay disponible pour le moment.
</div>
<!-- fleches indiquant le swipe -->


<!-- ✅ Swiper affichant les replays -->
<Swiper
  :modules="[Pagination, Autoplay]"
  :slides-per-view="1"
  :autoplay="{ delay: 4000, disableOnInteraction: false }"
  
  class="mySwiper"
>

<SwiperSlide v-for="(row, index) in replayCourses" :key="index">
  <div class="w-100 d-flex justify-content-center flex-column align-items-center">
    
   <div class="card shadow rounded-4 border-0 overflow-hidden mb-3" style="max-width: 600px;">
<img 
  :src="generateThumbnail(row.lienReplay)" 
  class="replay-thumbnail img-fluid rounded mx-auto d-block"
  @click="openVideo(row.lienReplay, row.formattedDate)" 
/>

  <div class="card-body bg-light">
    <h5 class="card-title text-primary mb-1">{{ row.formattedDate }}</h5>
    <p class="mb-1"><strong>📆 Trimestre :</strong> {{ row.trimestre || "Non défini" }}</p>
    <p class="mb-3"><strong>📝 Commentaire :</strong> {{ row.commentaire || "Aucun" }}</p>
    <a 
      v-if="generateDownloadLink(row.lienReplay)" 
      :href="generateDownloadLink(row.lienReplay)" 
      class="btn btn-outline-primary w-100" 
      target="_blank"
    >⬇️ Télécharger</a>
  </div>
</div>


    <!-- ✅ Swipe hint uniquement sur mobile -->
    <div v-if="index === 0" class="mobile-swipe-hint d-md-none">
      <span>⟶ Glissez pour voir les autres</span>
    </div>
    
  </div>
</SwiperSlide>


      </Swiper>

      <!-- ✅ Modale -->
 <div v-if="showModal" class="modal fade show d-block bg-dark bg-opacity-75" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered modal-lg">
    <div class="modal-content border-0 rounded-4 overflow-hidden">
      <div class="modal-header bg-primary text-white">
        <h5 class="modal-title">{{ currentVideoTitle }}</h5>
        <button type="button" class="btn-close btn-close-white" @click="closeModal"></button>
      </div>
      <div class="modal-body p-0">
        <iframe 
          :src="videoUrl" 
          frameborder="0" 
          allowfullscreen 
          width="100%" 
          height="450"
          class="w-100"
        ></iframe>
      </div>
    </div>
  </div>
</div>

    </div>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import Layout from '../views/Layout.vue'

const selectedCourse = ref('')
const planningData = ref([])
const isLoading = ref(true)

const windowWidth = ref(window.innerWidth)
const showModal = ref(false)
const videoUrl = ref('')
const currentVideoTitle = ref('')

const sortedPlanningData = computed(() => {
  return [...planningData.value].sort((a, b) => new Date(a.formattedDate) - new Date(b.formattedDate))
})

const replayCourses = computed(() =>
  sortedPlanningData.value.filter(r => r.lienReplay && r.lienReplay !== "Pas de replay disponible")
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

function updateWindowWidth() {
  windowWidth.value = window.innerWidth
}

async function fetchPlanningData() {
  isLoading.value = true
  try {
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
  } catch (e) {
    console.error("Erreur lors du chargement du planning:", e)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchPlanningData()
  window.addEventListener("resize", updateWindowWidth)
})

onUnmounted(() => {
  window.removeEventListener("resize", updateWindowWidth)
})
</script>

<style scoped>


.swipe-hint {
  animation: pulse 1.5s infinite;
  font-style: italic;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
}


.swiper {
  width: 100%;
  padding: 20px 0;
}
.card img {
  max-width: 100%;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}
.card img:hover {
  transform: scale(1.05);
}
.modal-backdrop {
  opacity: 0.5 !important;
}
.swiper-slide {
  width: 100% !important; /* très important ici */
  display: flex;
  justify-content: center;
}


.card {
  width: 100%;
  max-width: 900px; /* ou même 1000px si ton layout le permet */
  margin-left: auto;
  margin-right: auto;
}

.card img {
  width: 100%;
  max-height: 300px; /* Agrandir un peu */
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

@media (max-width: 768px) {
  .card img {
    max-height: 200px;
  }
}

.swipe-overlay {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 18px;
  font-weight: bold;
  color: #555;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.15);
  animation: swipe-bounce 1.2s infinite ease-in-out;
  z-index: 10;
}

@keyframes swipe-bounce {
  0%, 100% {
    transform: translateY(-50%) translateX(0);
  }
  50% {
    transform: translateY(-50%) translateX(6px);
  }
}
.mobile-swipe-hint {
  font-size: 14px;
  color: #6c757d;
  font-style: italic;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.4;
    transform: translateX(0);
  }
  50% {
    opacity: 1;
    transform: translateX(6px);
  }
}
.card-title {
  font-weight: 600;
  font-size: 1.2rem;
}

.card-body {
  padding: 1.25rem;
}

.btn-outline-primary {
  transition: all 0.2s ease-in-out;
}

.btn-outline-primary:hover {
  background-color: #0d6efd;
  color: white;
}

.replay-thumbnail {
  max-width: 100%;
  max-height: 300px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
  border-radius: 8px;
}

@media (min-width: 768px) {
  .replay-thumbnail {
    max-height: 260px;
    max-width: 600px; /* limite la largeur même sur desktop */
  }
}

.replay-thumbnail:hover {
  transform: scale(1.03);
}

</style>

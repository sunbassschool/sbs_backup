
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
      📅 {{ extractShortDate(row.formattedDate) }}


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
  @swiper="onSwiper"
  :modules="[Pagination, Autoplay]"
  :slides-per-view="1"
  :autoplay="{ delay: 4000, disableOnInteraction: false }"
  class="mySwiper"
>


<SwiperSlide v-for="(row, index) in replayCourses" :key="index">
  <div class="w-100 d-flex justify-content-center flex-column align-items-center">
    
   <div class="card shadow rounded-4 border-0 overflow-hidden mb-3" style="max-width: 600px;">
<div class="position-relative w-100">
<div class="thumbnail-wrapper" @click="openVideo(row.lienReplay, row.formattedDate)">
  <img 
    :src="generateThumbnail(row.lienReplay)" 
    class="replay-thumbnail"
    @error="(e) => onImageError(e, row.formattedDate)"
    @load="(e) => onImageLoad(row.formattedDate, e)"
  />
  
  <div v-if="erroredImages[row.formattedDate]" class="no-thumb-overlay">
    🎬 Replay disponible<br />Cliquez pour voir
  </div>
</div>





</div>


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
      <div class="modal-header bg-dark text-white border-0">

        <h5 class="modal-title mb-0" style="font-size: 1rem;">{{ currentVideoTitle }}</h5>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
 import { useAuthStore } from "@/stores/authStore"
const auth = useAuthStore()
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import Layout from '../views/Layout.vue'
const loadedImages = ref({})

function extractDriveId(url) {
  if (!url) return null;

  // format 1 : /d/ID/
  const match1 = url.match(/\/d\/([^/]+)/);
  if (match1) return match1[1];

  // format 2 : ?id=ID
  const match2 = url.match(/[?&]id=([^&]+)/);
  if (match2) return match2[1];

  return null;
}


function onImageLoad(formattedDate, event) {
  const isFallback = event?.target?.src?.includes('dummyimage.com')
  if (!isFallback) {
    loadedImages.value[formattedDate] = true
    console.log(`✅ Image OK : ${formattedDate}`)
  }
}



const erroredImages = ref({})

const moisFrancais = {
  janvier: 0,
  février: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  août: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  décembre: 11
}

function parseFrenchFormattedDate(dateStr) {
  try {
    const regex = /(\d{2}) (\w+) (\d{4}) à (\d{2}):(\d{2})/
    const match = dateStr.match(regex)
    if (!match) return new Date(0)
    const [, day, monthName, year, hours, minutes] = match
    const month = moisFrancais[monthName.toLowerCase()]
    return new Date(Number(year), month, Number(day), Number(hours), Number(minutes))
  } catch {
    return new Date(0)
  }
}
function onImageError(event, formattedDate) {
  erroredImages.value[formattedDate] = true
}




const selectedCourse = ref('')
let swiperInstance = null
function onSwiper(swiper) {
  swiperInstance = swiper
}

watch(selectedCourse, (newVal) => {
  const index = replayCourses.value.findIndex(r => r.formattedDate === newVal)
  if (index !== -1 && swiperInstance) {
    swiperInstance.slideTo(index)
    swiperInstance.autoplay?.stop()

    // 👇 Ne pas ouvrir la vidéo automatiquement
    // const row = replayCourses.value[index]
    // openVideo(row.lienReplay, row.formattedDate)
  }
})

const planningData = ref([])
const isLoading = ref(true)

const windowWidth = ref(window.innerWidth)
const showModal = ref(false)
const videoUrl = ref('')
const currentVideoTitle = ref('')


const sortedPlanningData = computed(() => {
  return [...planningData.value].sort(
    (a, b) => parseFrenchFormattedDate(b.formattedDate) - parseFrenchFormattedDate(a.formattedDate)
  )
})




const replayCourses = computed(() =>
  sortedPlanningData.value.filter(r =>
    typeof r.lienReplay === "string" &&
    r.lienReplay.trim() !== "" &&
    !r.lienReplay.toLowerCase().includes("pas de replay")
  )
)


function generateThumbnail(url) {
  const id = extractDriveId(url);
  if (!id) {
    console.warn("Miniature impossible pour :", url);
    return "https://via.placeholder.com/600x300?text=Miniature+indisponible";
  }

  return `https://drive.google.com/thumbnail?id=${id}`;
}




function generateDownloadLink(url) {
  const id = extractDriveId(url);
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : null;
}



function openVideo(url, title) {
  const match = url?.match(/\/d\/(.*?)\//)
  videoUrl.value = match ? `https://drive.google.com/file/d/${match[1]}/preview` : ''
  currentVideoTitle.value = title
  showModal.value = true
}



function closeModal() {
  showModal.value = false
  closeModal
  videoUrl.value = ''
}

function updateWindowWidth() {
  windowWidth.value = window.innerWidth
}



async function fetchPlanningData() {
  isLoading.value = true
  try {
    const jwt = sessionStorage.getItem("jwt") || localStorage.getItem("jwt") || ""


const email = auth.user?.email || localStorage.getItem("email") || ""
const prenom = auth.user?.prenom || localStorage.getItem("prenom") || ""

    if (!jwt || !email || !prenom) return

function parseFrenchFormattedDate(dateStr) {
  try {
    const regex = /(\d{2}) (\w+) (\d{4}) à (\d{2}):(\d{2})/
    const match = dateStr.match(regex)
    if (!match) return new Date(0) // fallback très ancien si parsing échoue

    const [, day, monthName, year, hours, minutes] = match
    const month = moisFrancais[monthName.toLowerCase()]
    return new Date(Number(year), month, Number(day), Number(hours), Number(minutes))
  } catch {
    return new Date(0)
  }
}

    const route = "planning"
    const targetBase = "https://script.google.com/macros/s/AKfycbypPWCq2Q9Ro4YXaNnSSLgDrk6Jc2ayN7HdFDxvq4KuS2yxizow42ADiHrWEy0Eh1av9w/exec"
   const profId =
  auth.user?.prof_id ||
  JSON.parse(atob(jwt.split(".")[1]))?.prof_id ||
  localStorage.getItem("prof_id") ||
  ""

const fullTargetUrl =
  `${targetBase}?route=${route}` +
  `&email=${encodeURIComponent(email)}` +
  `&prenom=${encodeURIComponent(prenom)}` +
  `&prof_id=${encodeURIComponent(profId)}` +
  `&jwt=${encodeURIComponent(jwt)}`

    const proxyUrl = `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(fullTargetUrl)}`
console.log("📡 FETCH PLANNING →", {
  email,
  prenom,
  jwt: jwt ? "OK" : "MISSING",
  proxyUrl
})

const res = await fetch(proxyUrl)
console.log("📥 STATUS", res.status)

const json = await res.json()
console.log("📦 RAW JSON", json)

if (json.success && json.planning) {
  planningData.value = json.planning

  console.log("🧩 PLANNING LENGTH", json.planning.length)
  console.table(
    json.planning.map(p => ({
      date: p.formattedDate,
      lienReplay: p.lienReplay
    }))
  )
}

  } catch (e) {
    console.error("Erreur lors du chargement du planning:", e)
  } finally {
    isLoading.value = false
  }
}
function extractShortDate(fullDate) {
  const match = fullDate.match(/^(\d{2}) (\w+) (\d{4})/)
  if (!match) return fullDate
  const [ , day, monthName, year ] = match
  const moisMap = {
    janvier: '01', février: '02', mars: '03', avril: '04', mai: '05', juin: '06',
    juillet: '07', août: '08', septembre: '09', octobre: '10', novembre: '11', décembre: '12'
  }
  const month = moisMap[monthName.toLowerCase()] || '00'
  return `${day}/${month}/${year}`
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
  object-fit: contain;
background: #111;

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
object-fit: contain;
background: #111;

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

.no-thumb-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 123, 255, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: bold;
  font-size: 1rem;
  text-align: center;
  padding: 10px;
  border-radius: 8px;
  pointer-events: none;
}
.thumbnail-wrapper {
  width: 100%;
  aspect-ratio: 16/9;
  background: #000;           /* fond noir propre */
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.replay-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: contain;         /* LA clé pour ne plus rogner */
  background: #000;            /* comble les bords */
  cursor: pointer;
  transition: transform 0.2s ease;
}

.replay-thumbnail:hover {
  transform: scale(1.02);
}

</style>

<template>
  <Layout>
    <div class="uploads-page dark-theme">
     <button class="btn-upload" @click="showUpload = true">
  ➕ Envoyer un fichier
</button>

<UploadModal
  v-if="showUpload"
  :cours-id="selectedCours || 'GENERAL'"
  @close="showUpload = false"
/>



      <!-- Filtres -->
      <div class="filters mb-3">
        <select v-model="selectedCours" class="form-select">
          <option value="">Date d'envoi</option>
        <option v-for="c in coursList" :key="c" :value="c">
  {{ coursLabelMap[c] || c }}
</option>

        </select>

        <select v-model="selectedType" class="form-select">
          <option value="">Tous les types</option>
          <option value="audio">Audio</option>
          <option value="video">Vidéo</option>
          <option value="pdf">PDF</option>
            <option value="image">Image</option>

        </select>
      </div>

      <!-- Liste -->
      <div v-if="loading" class="text-center">Chargement...</div>

<div v-else class="uploads-list-table">

  <!-- Header (desktop) -->
  <div class="upload-row header hide-mobile">
    <div>Fichier</div>
    <div>Élève</div>
    <div>Date</div>
   
    <div></div>
  </div>

  <!-- Rows -->
  <div
    v-for="file in filteredUploads"
    :key="file.upload_id"
    class="upload-row"
  >
    <div class="col-name">
      {{ file.file_name }}
    </div>

    <div class="col-meta hide-mobile">
      {{ auth.user.prenom }}
    </div>

 <div class="col-meta">
  {{ formatDate(file.created_at) }}
</div>

   <div class="col-action">
<button
  v-if="isPreviewable(file.file_type)"
  class="open-btn"
  @click="openPreview(file)"
>
  👁️
</button>

<a
  v-else
  :href="file.file_url"
  target="_blank"
  class="open-btn"
>
  🔗
</a>



</div>

  </div>

      </div>
    </div>

    
  </Layout>
</template>
<script setup>
// ============================================================================
// 📎 ELEVE UPLOADS — Page listing des fichiers envoyés par l’élève
// - Multi-prof (prof_id obligatoire)
// - Auth JWT
// - Appels Apps Script via proxy Vercel
// - Debug complet (logs visibles)
// ============================================================================

import Layout from "@/views/Layout.vue"
import { ref, computed, onMounted } from "vue"
import axios from "axios"
import { useAuthStore } from "@/stores/authStore"
import UploadModal from "@/components/UploadModal.vue"

// ============================================================================
// 🔐 AUTH
// ============================================================================
const auth = useAuthStore()

// modale
const showUpload = ref(false)

// ============================================================================
// 🔗 ROUTES APPS SCRIPT (ID de déploiement)
// ⚠️ Doit être IDENTIQUE à Planning.vue
// ============================================================================
const routes = {
  POST: "AKfycbyeSHSoGZtq5jmhBZZn0ZidvzPyJo4VquV1Do_IPZqgepEExooy0d-sp4HDAAUuOOgLWA/exec"
}

// Date du cours stocké dans upload
const coursLabelMap = computed(() => {
  const map = {}

  uploads.value.forEach(u => {
    if (!map[u.cours_id]) {
      map[u.cours_id] = formatDate(u.created_at)
    }
  })

  return map
})

// ============================================================================
// 🌍 Helper pour appeler Apps Script via proxy Vercel
// ============================================================================
const getProxyPostURL = (routeId) => {
  const baseURL = `https://script.google.com/macros/s/${routeId}`
  return `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(baseURL)}`
}
// ============================================================================
// Utilitaire pour format date
// ============================================================================

const formatDate = (d) => {
  if (!d) return ""
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit"
  })
}


// ============================================================================
// 🧠 STATE
// ============================================================================
const uploads = ref([])        // liste brute des fichiers
const loading = ref(true)      // loader page

const selectedCours = ref("")  // filtre cours
const selectedType = ref("")   // filtre type

// ============================================================================
// 🪵 LOGGER UNIFIÉ
// ============================================================================
const log = (...args) => {
  console.log("📎 ELEVE UPLOADS", ...args)
}
// Preview des documents
const isPreviewable = (type) => {
  if (!type) return false
  return (
    type.startsWith("image/") ||
    type.startsWith("audio/") ||
    type.startsWith("video/") ||
    type.includes("pdf")
  )
}
const showPreview = ref(false)
const previewFile = ref(null)

const openPreview = (file) => {
  previewFile.value = file
  showPreview.value = true
}

const closePreview = () => {
  showPreview.value = false
  previewFile.value = null
}

// ============================================================================
// 📡 FETCH UPLOADS — API CALL
// ============================================================================
const fetchUploads = async () => {
  log("fetchUploads() called")

  // 🛑 Sécurité auth
  if (!auth.jwt) {
    log("❌ JWT manquant")
    loading.value = false
    return
  }

  if (!auth.user?.prof_id || !auth.user?.user_id) {
    log("❌ IDs manquants", auth.user)
    loading.value = false
    return
  }

  try {
    const url = getProxyPostURL(routes.POST)

    log("POST URL", url)
    log("PAYLOAD", {
      route: "getuploadsbyeleve",
      prof_id: auth.user.prof_id,
      eleve_id: auth.user.user_id
    })

    const res = await axios.post(url, {
      route: "getuploadsbyeleve",
      jwt: auth.jwt,
      prof_id: auth.user.prof_id,
      eleve_id: auth.user.user_id
    })

    log("API RESPONSE", res.data)

    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message || "API error")
    }

    uploads.value = res.data.uploads || []
    log(`✅ ${uploads.value.length} upload(s) chargé(s)`)

  } catch (err) {
    console.error("❌ fetchUploads error", err)
  } finally {
    loading.value = false
  }
}

// ============================================================================
// 🧮 COMPUTED
// ============================================================================
const coursList = computed(() => {
  return [...new Set(uploads.value.map(u => u.cours_id))]
})

const filteredUploads = computed(() => {
  return uploads.value.filter(u => {
    if (selectedCours.value && u.cours_id !== selectedCours.value) return false

    if (selectedType.value) {
      const type = (u.file_type || "").toLowerCase()

      if (selectedType.value === "image") {
        return type.includes("image") || type.includes("png") || type.includes("jpg") || type.includes("jpeg")
      }

      return type.includes(selectedType.value)
    }

    return true
  })
})

// ============================================================================
// 🛠️ UTILS
// ============================================================================
const formatSize = (s) => {
  if (!s) return ""
  return (s / 1024 / 1024).toFixed(2) + " Mo"
}

// ============================================================================
// 🚀 LIFECYCLE
// ============================================================================
onMounted(() => {
  log("component mounted")
  fetchUploads()
})
</script>

<style scoped>
.dark-theme {
  background: #121212;
  color: #fff;
  min-height: 100vh;
}

.filters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.uploads-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 15px;
}

.upload-card {
  background: #1e1e1e;
  padding: 15px;
  border-radius: 10px;
}

.file-name {
  font-weight: bold;
}

.file-meta {
  font-size: 0.85rem;
  color: #aaa;
}

.uploads-list-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.upload-row {
  display: grid;
  grid-template-columns: 1fr 160px 110px 90px 80px;
  align-items: center;
  background: #1e1e1e;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 0.95rem;
}

.upload-row.header {
  background: transparent;
  font-size: 0.8rem;
  text-transform: uppercase;
  color: #888;
}

.col-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-meta {
  font-size: 0.85rem;
  color: #aaa;
}

.col-action {
  text-align: right;
}

/* 📱 Mobile */
@media (max-width: 768px) {
  .upload-row {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "name action"
      "meta meta";
    row-gap: 4px;
  }

  .col-name {
    grid-area: name;
  }

  .col-action {
    grid-area: action;
    align-self: center;
  }

  .col-meta {
    grid-area: meta;
    font-size: 0.8rem;
  }

  .hide-mobile {
    display: none;
  }
}
.uploads-page {
  padding: 40px;
}

@media (max-width: 768px) {
  .uploads-page {
    padding: 10px;
  }
}

/* 🎛️ Select custom SBS */
.uploads-page select.form-select {
  background-color: #2a2a2a;        /* gris foncé */
  color: #f1f1f1;
  border: 1px solid #ff8c00;        /* orange foncé */
  border-radius: 6px;
  height: 36px;                     /* hauteur réduite */
  padding: 4px 10px;
  font-size: 0.9rem;
}

/* Focus propre */
.uploads-page select.form-select:focus {
  outline: none;
  box-shadow: none;
  border-color: #ffa733;
  background-color: #2f2f2f;
}

/* Option (dropdown) */
.uploads-page select.form-select option {
  background-color: #2a2a2a;
  color: #f1f1f1;
}
.open-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid #ff8c00;
  border-radius: 6px;
  color: #ffb347;
  font-size: 0.85rem;
  text-decoration: none;
  white-space: nowrap;
}

.open-btn:hover {
  background: rgba(255, 140, 0, 0.1);
}

/* 📱 Mobile : icône seule */
@media (max-width: 768px) {
  .open-btn {
    padding: 6px;
    width: 34px;
    height: 34px;
  }

  .open-btn .text {
    display: none;
  }

  .open-btn .icon {
    font-size: 1rem;
  }
}

</style>


<template>
  <div class="list">

    <!-- 🔍 SEARCH -->
    <input
      v-model="search"
      class="search-input"
      placeholder="🔍 Rechercher une partition…"
    />

    <div class="list-header">
      <span>Nom</span>
      <span>Date</span>
    </div>

    <div
      v-for="p in filteredPartitions"
      :key="p.upload_id"
      class="row"
      @click="openPreview(p)"
    >
      <div class="name">
        <span class="icon">📄</span>

        <span class="filename">
          {{ p.file_name }}
        </span>

        <span v-if="p.niveau" class="badge badge-niveau">
          {{ p.niveau }}
        </span>

        <span v-if="p.style" class="badge badge-style">
          {{ p.style }}
        </span>
      </div>

      <span class="date">
        {{ formatDate(p.created_at) }}
      </span>
    </div>

    <!-- PREVIEW -->
    <div
      v-if="showPreview"
      class="preview-backdrop"
      @click.self="showPreview=false"
    >
      <div class="preview-panel">
        <header class="preview-header">
          <strong>{{ previewFile.file_name }}</strong>
          <div class="actions">
            <button @click="open(previewFile.file_url)">Ouvrir</button>
<button class="close" @click.stop.prevent="closePreview">✖</button>
          </div>
        </header>

<iframe
  v-if="previewUrl && !isIOSPWA"
  :src="previewUrl"
  class="preview-frame"
/>



      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue"
const extractDriveId = (url = "") => {
  if (url.includes("uc?id=")) {
    return url.split("uc?id=")[1].split("&")[0]
  }
  const m = url.match(/\/d\/([^/]+)/)
  return m ? m[1] : null
}
const isIOSPWA =
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  window.matchMedia('(display-mode: standalone)').matches

const isDriveLink = (url = "") =>
  url.includes("drive.google.com")
const closePreview = () => {
  showPreview.value = false
  previewFile.value = null
}

const props = defineProps({
  partitions: {
    type: Array,
    required: true
  },
  readonly: {
    type: Boolean,
    default: true
  }
})

const previewUrl = computed(() => previewFile.value?.previewUrl || "")

const isPdf = (p) =>
  p.file_type?.includes("pdf") || p.file_url?.toLowerCase().endsWith(".pdf")

/* 🔍 SEARCH (debounced) */
const search = ref("")
const debouncedSearch = ref("")
let timer = null

watch(search, v => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    debouncedSearch.value = v
  }, 200)
})

const filteredPartitions = computed(() => {
  if (!debouncedSearch.value) return props.partitions
  const q = debouncedSearch.value.toLowerCase()
  return props.partitions.filter(p =>
    [p.file_name, p.style, p.niveau].some(v =>
      v?.toLowerCase().includes(q)
    )
  )
})

/* 📄 PREVIEW */
const showPreview = ref(false)
const previewFile = ref(null)

const openPreview = (p) => {
  const url = p.file_url

  // 🔒 iOS PWA → PAS DE PREVIEW
  if (isIOSPWA) {
    open(url)
    return
  }

  // Desktop / Android seulement
  if (isDriveLink(url)) {
    const id = extractDriveId(url)
    if (!id) return
    previewFile.value = {
      ...p,
      previewUrl: `https://drive.google.com/file/d/${id}/preview`
    }
    showPreview.value = true
    return
  }

  if (isPdf(p)) {
    previewFile.value = {
      ...p,
      previewUrl: `${url}#toolbar=0`
    }
    showPreview.value = true
  }
}




const open = (url) => {
  const id = extractDriveId(url)
  if (id) {
    window.location.href = `https://drive.google.com/file/d/${id}/view`
    return
  }
  window.location.href = url
}

const formatDate = d => new Date(d).toLocaleDateString("fr-FR")
</script>
<style scoped>
/* LIST CONTAINER */
.list {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

/* HEADER */
.list-header {
  display: grid;
  grid-template-columns: 1fr auto;
  padding: 10px 12px;
  font-size: 0.75rem;
  color: #666;
  background: #f5f5f5;
}

/* ROW */
.row {
  display: grid;
  grid-template-columns: 1fr auto;
  padding: 12px;
  border-top: 1px solid #eee;
  cursor: pointer;
}

.row:hover {
  background: #fafafa;
}

/* NAME */
.name {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.icon {
  opacity: 0.6;
}

.filename {
  font-weight: 500;
  color: #111;
}

/* BADGES */
.badge {
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 6px;
}

.badge-niveau {
  background: #eef4ff;
  color: #1a4fd8;
}

.badge-style {
  background: #eee;
  color: #444;
}

/* DATE */
.date {
  font-size: 0.7rem;
  color: #888;
}

/* PREVIEW */
.preview-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.preview-panel {
  width: 90%;
  margin-top:80px;
  height: 90%;
  background: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
}

.preview-header {
  padding: 10px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-frame {
  flex: 1;
  border: none;
  width: 100%;
}

/* MOBILE */
@media (max-width: 640px) {
  .row {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .date {
    font-size: 0.65rem;
  }
}
.search-input {
  width: 100%;
  padding: 8px 10px;
  margin-bottom: 6px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #000;          /* ✅ texte noir */
  background: #fff;
    font-weight: 600;   /* texte en gras */

}

.search-input::placeholder {
  color: #000;          /* ✅ placeholder noir */
  opacity: 0.5;         /* optionnel, lisible */
    font-weight: 600;   /* texte en gras */

}

</style>

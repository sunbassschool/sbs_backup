<template>
  <div
  v-if="totalPages > 1"
  class="pagination dark"
>
  <button
    @click="currentPage--"
    :disabled="currentPage === 1"
  >
    ‹
  </button>

  <span class="page-info">
    Page {{ currentPage }} / {{ totalPages }}
  </span>

  <button
    @click="currentPage++"
    :disabled="currentPage === totalPages"
  >
    ›
  </button>
</div>

  <div class="list">

<!-- 🔍 SEARCH -->
<div class="search-wrapper">
  <input
    v-model="search"
    class="search-input"
    placeholder="Rechercher une partition…"
  />

  <button
    v-if="search"
    class="clear-btn"
    @click="search = ''"
    aria-label="Effacer la recherche"
  >
    ✖
  </button>
</div>


<div class="list-header">
  <span>Nom</span>

  <button
    class="sort-btn"
    @click="toggleSort"
    :aria-label="sortOrder === 'asc' ? 'Tri A vers Z' : 'Tri Z vers A'"
  >
    <span v-if="sortOrder === 'asc'">↑</span>
    <span v-else>↓</span>
  </button>
</div>

<div
  v-if="showFavoritesOnly && favorites.length === 0"
  class="empty-state"
>
  Aucune partition en favori ⭐
</div>
<!-- MODE NORMAL : séparateur -->
<div
  v-if="!showFavoritesOnly && favorites.length > 0"
  class="fav-separator clickable"
  @click="showFavoritesOnly = true"
>
  ★ Favoris
  <span class="see-all">
    Voir tout ({{ favorites.length }})
  </span>
</div>

<!-- MODE FAVORIS : header retour -->
<div
  v-if="showFavoritesOnly"
  class="fav-separator back clickable"
  @click="showFavoritesOnly = false"
>
  ← Retour à toutes les partitions
</div>




  <div
v-for="(p, index) in paginatedPartitions"
  :key="p.upload_id"
  class="row"
  :class="{ zebra: index % 2 === 1 }"
@click="onRowClick(p)"
>

      <div class="name">
      <span
  class="fav"
  :class="{ active: isFavorite(p.upload_id) }"
  @click.stop="toggleFavorite(p.upload_id)"
  aria-label="Favori"
>
  ★
</span>


     <span
  class="filename"
  v-html="highlight(p.file_name)"
></span>




        <span v-if="p.style" class="badge badge-style">
          {{ p.style }}
        </span>
        <!-- 🗑️ DELETE -->
  <button
    class="delete-btn"
    @click.stop.prevent="emit('delete', p)"
    aria-label="Supprimer la partition"
  >
    🗑️
  </button>
      </div>


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

  <button
    class="danger"
    @click.stop.prevent="emit('delete', previewFile); closePreview()"
  >
    🗑️ Supprimer
  </button>

  <button class="close" @click.stop.prevent="closePreview">✖</button>
</div>

        </header>

<iframe
  v-if="showIframe && !isIOSPWA"
  :src="previewUrl"
  class="preview-frame"
/>

<div
  v-else
  class="preview-fallback"
>
  <p>👀 Aperçu non disponible</p>
  <button @click="open(previewFile.file_url)">
    Télécharger / ouvrir le PDF
  </button>
</div>




      </div>
    </div>

  </div>
  <div v-if="totalPages > 1" class="pagination">
  <button
    @click="currentPage--"
    :disabled="currentPage === 1"
  >
    ‹
  </button>

  <span>
    {{ currentPage }} / {{ totalPages }}
  </span>

  <button
    @click="currentPage++"
    :disabled="currentPage === totalPages"
  >
    ›
  </button>
</div>

</template>

<script setup>






import { ref, computed, watch, onMounted, onUnmounted } from "vue"
const extractDriveId = (url = "") => {
  if (url.includes("uc?id=")) {
    return url.split("uc?id=")[1].split("&")[0]
  }
  const m = url.match(/\/d\/([^/]+)/)
  return m ? m[1] : null
}
const showIframe = ref(false)
const emit = defineEmits(["delete", "edit"])

const highlight = (text = "") => {
  if (!debouncedSearch.value) return text
  const q = debouncedSearch.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return text.replace(
    new RegExp(`(${q})`, "gi"),
    "<mark>$1</mark>"
  )
}
const canPreview = (p) =>
  !!p &&
  !!p.file_url &&
  !isDriveLink(p.file_url) // ⬅️ inversion

const isDesktop = () => window.innerWidth >= 768


const onKeydown = (e) => {
  if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
    e.preventDefault()
    document.querySelector(".search-input")?.focus()
  }

  if (e.key === "Escape") {
    if (showPreview.value) showPreview.value = false
    else if (showFavoritesOnly.value) showFavoritesOnly.value = false
  }

  if (e.key === "Enter" && !showPreview.value) {
    const first = paginatedPartitions.value?.[0]
    if (first) openPreview(first)
  }
}

onMounted(() => window.addEventListener("keydown", onKeydown))
onUnmounted(() => window.removeEventListener("keydown", onKeydown))

const PAGE_SIZE = 20
const currentPage = ref(1)

const totalPages = computed(() =>
  Math.ceil(filteredAndSorted.value.length / PAGE_SIZE)
)
// ⭐ FAVORIS (local)
const FAVORITES_KEY = "partitions_favorites"

const favorites = ref(
  JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]")
)

const showFavoritesOnly = ref(false)

const isFavorite = (id) => favorites.value.includes(id)

const toggleFavorite = (id) => {
  if (isFavorite(id)) {
    favorites.value = favorites.value.filter(f => f !== id)
  } else {
    favorites.value = [...favorites.value, id]
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.value))
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
const sortOrder = ref(sessionStorage.getItem("partitions_sort") || "asc")

const toggleSort = () => {
  sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc"
  sessionStorage.setItem("partitions_sort", sortOrder.value)
}


const filteredAndSorted = computed(() => {
  let list = props.partitions

  // 🔍 RECHERCHE
  if (debouncedSearch.value) {
    const q = debouncedSearch.value.toLowerCase()
    list = list.filter(p =>
      [p.file_name, p.style, p.niveau].some(v =>
        v?.toLowerCase().includes(q)
      )
    )
  }

  // ⭐ MODE FAVORIS (remplace la liste)
  if (showFavoritesOnly.value) {
    return [...list]
      .filter(p => favorites.value.includes(p.upload_id))
      .sort((a, b) => {
        const res = a.file_name.localeCompare(b.file_name, "fr", {
          sensitivity: "base"
        })
        return sortOrder.value === "asc" ? res : -res
      })
  }

  // ⭐ MODE NORMAL → favoris épinglés en haut
  const favs = list.filter(p => favorites.value.includes(p.upload_id))
  const others = list.filter(p => !favorites.value.includes(p.upload_id))

  const sortFn = (a, b) => {
    const res = a.file_name.localeCompare(b.file_name, "fr", {
      sensitivity: "base"
    })
    return sortOrder.value === "asc" ? res : -res
  }

  return [
    ...favs.sort(sortFn),
    ...others.sort(sortFn)
  ]
})

const paginatedPartitions = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredAndSorted.value.slice(start, start + PAGE_SIZE)
})


/* 📄 PREVIEW */
const showPreview = ref(false)
const previewFile = ref(null)

const openPreview = (p) => {
  // reset HARD
  previewFile.value = null
  previewUrl.value = ""
  showIframe.value = false
  showPreview.value = false

  const url = p.file_url

  // iOS PWA
  if (isIOSPWA) {
    open(url)
    return
  }

  // Drive → jamais iframe
  if (isDriveLink(url)) {
    open(url)
    return
  }

  // PDF classique → iframe
  if (isPdf(p)) {
    previewFile.value = p
    previewUrl.value = url
    showIframe.value = true
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
const onRowClick = (p) => {
  if (isDesktop()) {
    // Google Drive : forcer l’aperçu
    const match = p.file_url?.match(/id=([^&]+)/)
    if (match) {
      const previewUrl = `https://drive.google.com/file/d/${match[1]}/preview`
      window.open(previewUrl, "_blank", "noopener,noreferrer")
    } else {
      window.open(p.file_url, "_blank", "noopener,noreferrer")
    }
  } else {
    openPreview(p)
  }
}


const formatDate = d => new Date(d).toLocaleDateString("fr-FR")
watch([debouncedSearch, sortOrder], () => {
  currentPage.value = 1
})
watch(showFavoritesOnly, () => {
  currentPage.value = 1
})

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
  background: #fff; /* couleur par défaut */
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


.search-input::placeholder {
  color: #000;          /* ✅ placeholder noir */
  opacity: 0.5;         /* optionnel, lisible */
    font-weight: 600;   /* texte en gras */

}
.search-wrapper {
  position: relative;
  margin-bottom: 6px;
}

.search-input {
  width: 100%;
  padding: 8px 34px 8px 10px; /* espace pour le bouton */
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #000;
  background: #fff;
}

.clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.9rem;
  opacity: 0.5;
  padding: 2px;
}

.clear-btn:hover {
  opacity: 0.9;
}
mark {
  background: #a8b8ff;
  padding: 0 2px;
  border-radius: 3px;
}
.sort-btn {
  border: none;
  background: transparent;
  font-size: 0.9rem;
  font-weight: 700;
  color: #666;
  cursor: pointer;
  padding: 2px 6px;
}

.sort-btn:hover {
  color: #000;
}


/* garde le hover au-dessus */
.row:hover {
  background: #f0f0f0;
}
.row.zebra {
  background: #edf0f4;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: transparent;
}

.pagination span {
  font-size: 0.75rem;
  font-weight: 600;
  color: #aaa;
}

.pagination button {
  border: 1px solid #333;
  background: #1a1a1a;
  color: #ddd;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
}

.pagination button:hover:not(:disabled) {
  background: #2a2a2a;
  color: #fff;
}

.pagination button:disabled {
  opacity: 0.3;
  cursor: default;
}

.fav-filter {
  border: 1px solid #333;
  background: #111;
  color: #aaa;
  font-size: 0.75rem;
  padding: 6px 10px;
  border-radius: 10px;
  cursor: pointer;
  margin: 6px 0 8px;
}

.fav-filter.active {
  background: #1f1f1f;
  color: #f5c518;
  border-color: #f5c518;
}

.fav-filter .count {
  font-weight: 700;
}

.fav {
  cursor: pointer;
  font-size: 0.9rem;
  color: #666;
  opacity: 0.45;
  margin-right: 4px;
}

.fav.active {
  color: #f5c518;
  opacity: 1;
}

.fav:hover {
  opacity: 1;
}

.fav-separator {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #f5c518;
  background: #141414;
  border-top: 1px solid #222;
  border-bottom: 1px solid #222;
}

.fav-separator.clickable {
  cursor: pointer;
}

.fav-separator.clickable:hover {
  background: #1f1f1f;
}

.fav-separator .see-all {
  font-size: 0.65rem;
  font-weight: 600;
  color: #aaa;
}

.fav-separator.back {
  color: #aaa;
}

.fav-separator.back:hover {
  background: #1f1f1f;
  color: #fff;
}
.preview-fallback {
  padding: 24px;
  text-align: center;
  color: #6b7280;
}

.preview-fallback button {
  margin-top: 12px;
  padding: 8px 14px;
  border-radius: 8px;
  border: none;
  background: #111827;
  color: #fff;
  cursor: pointer;
}

</style>

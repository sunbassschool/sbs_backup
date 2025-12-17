<template>
  <Layout>
    <div class="uploads-page dark-theme">

      <!-- ===================================================== -->
      <!-- 🧭 HEADER -->
      <!-- ===================================================== -->
      <div class="uploads-header">
        <div>
          <h3>📎 Mes documents</h3>
          <p class="subtitle">Fichiers liés à tes cours</p>
        </div>

        <button
          ref="addBtn"
          class="add-btn"
          :class="{ active: addMenu.visible }"
          @click.stop="openAddMenuFromButton"
        >
          <span class="icon">＋</span>
          Ajouter
        </button>
      </div>

      <!-- ===================================================== -->
      <!-- ➕ MENU AJOUT -->
      <!-- ===================================================== -->
      <div
        v-if="addMenu.visible && !isDragging"
        class="context-backdrop"
        @click="closeAddMenu"
      >
        <div
          class="context-menu"
          :style="{ top: addMenu.y + 'px', left: addMenu.x + 'px' }"
          @click.stop
        >
          <div class="context-item" @click="addFile">📄 Ajouter un fichier</div>
          <div
            class="context-item"
            @click="() => { closeAddMenu(); createFolder() }"
          >
            📁 Nouveau dossier
          </div>

          <div
            v-if="clipboard.uploads.length"
            class="context-item"
            @click="pasteFromContext"
          >
            📋 Coller
          </div>
        </div>
      </div>

      <!-- ===================================================== -->
      <!-- ⬆️ MODALE UPLOAD -->
      <!-- ===================================================== -->
      <UploadModal
        v-if="showUpload"
        :cours-id="effectiveCoursId"
        :folder-id="effectiveFolderId || undefined"
        :eleve-id="effectiveEleveId || undefined"
        @uploaded="onUploadSuccess"
        @close="showUpload = false"
      />

      <!-- ===================================================== -->
      <!-- 🧱 BREADCRUMB -->
      <!-- ===================================================== -->
      <div class="breadcrumb finder-breadcrumb">
        <span
          v-if="isProfLike"
          class="crumb root"
          @click="goHome"
          @dragover.prevent
          @drop.prevent="handleDropOnFolder(null)"
        >
          🏠 Home
        </span>

        <span
          v-for="(f, i) in breadcrumb"
          :key="f.folder_id"
          class="crumb"
          @click="i < breadcrumb.length - 1 && (currentFolderId = f.folder_id)"
          @dragover.prevent
          @drop.prevent="handleDropOnFolder(f.folder_id)"
        >
          {{ getDisplayFolderName(f) }}
        </span>
      </div>

      <!-- ===================================================== -->
      <!-- 📦 EXPLORER -->
      <!-- ===================================================== -->
      <div
        class="explorer-zone"
        :class="{ dragging: isDragging, disabled: creatingWorkspace }"
        @click.self="clearSelection"
        @contextmenu.prevent="openEmptyMenu($event)"
        @dragover.prevent
        @drop.prevent="handleDropOnFolder(currentFolderId)"
      >
     <!-- ================= LOADER ================= -->
<div v-if="showLoader" class="loader-overlay">
  <div class="workflow-loader">
    <div class="dots">
      <span></span>
      <span></span>
      <span></span>
    </div>

    <strong>{{ loaderText }}</strong>
    <span class="sub">{{ loaderSub }}</span>
  </div>
</div>



        <!-- ================= CONTENT ================= -->
        <div
          v-if="foldersLoaded"
          class="explorer-content"
          :key="explorerKey"
        >

          <!-- ================================================= -->
          <!-- 📁 DOSSIERS -->
          <!-- ================================================= -->
           <!-- 👨‍🎓 VUE ÉLÈVES (PROF) -->

          <transition-group name="fade-slide" tag="div">
            <div
              v-for="folder in visibleFolders"
              :key="folder.folder_id"
              class="upload-item folder"
              :class="{
                active: currentFolderId === folder.folder_id,
                selected: selectedFolders.includes(folder.folder_id)
              }"
              @dragover.prevent
              @drop.prevent="handleDropOnFolder(folder.folder_id)"
              @click.stop="toggleSelectFolder(folder, $event)"
              @dblclick.stop="enterFolder(folder)"
              @contextmenu.prevent="openFolderMenu($event, folder)"
            >
              <div
                class="folder-main"
                draggable="true"
                @dragstart="onFolderDragStart($event, folder)"
                @dragend="onDragEnd"
              >
                <span class="folder-icon">📁</span>

                <strong v-if="editingFolderId !== folder.folder_id">
                  {{ getDisplayFolderName(folder) }}
                </strong>

                <input
                  v-else
                  :ref="el => setFolderRenameRef(el, folder.folder_id)"
                  v-model="editingFolderName"
                  class="rename-input"
                  @keyup.enter="confirmRenameFolder(folder)"
                  @keyup.esc="cancelRenameFolder"
                  @blur="confirmRenameFolder(folder)"
                />
              </div>
            </div>
          </transition-group>

          <!-- ================================================= -->
          <!-- 📄 FICHIERS -->
          <!-- ================================================= -->
          <transition-group name="fade-slide" tag="div">
            <div
              v-for="file in visibleFiles"
              :key="file.upload_id"
              class="upload-item"
              :class="{
                optimistic: file._optimistic,
                selected: selectedFiles.includes(file.upload_id),
                cut: clipboard.mode === 'cut' && clipboard.uploads.includes(file.upload_id)
              }"
              draggable="true"
              @dragstart="onDragStart($event, file)"
              @dragend="onDragEnd"
              @click="toggleSelect(file, $event)"
              @dblclick="openFile(file)"
              @contextmenu.prevent="openFileMenu($event, file)"
            >
              <div class="file-main">
                <span class="file-icon">📄</span>

                <div class="file-info">
                  <strong v-if="editingId !== file.upload_id">
                    {{ file.file_name }}
                    <span v-if="file._optimistic" class="sync-badge">⏳</span>
                  </strong>

                  <input
                    v-else
                    :ref="el => setFileRenameRef(el, file.upload_id)"
                    v-model="editingName"
                    class="rename-input"
                    @keyup.enter="confirmRename(file)"
                    @keyup.esc="cancelRename"
                    @blur="confirmRename(file)"
                  />

                  <small class="file-date">
                    {{ formatDate(file.created_at) }}
                  </small>
                </div>
              </div>
            </div>
          </transition-group>

          <!-- ================================================= -->
          <!-- 🫥 EMPTY -->
          <!-- ================================================= -->
          <div
            v-if="
              foldersLoaded &&
              visibleFolders.length === 0 &&
              visibleFiles.length === 0
            "
            class="empty-state"
          >
            <p>Dossier vide</p>

         <UploadFileCore
  :eleve-id="effectiveEleveId"
  :cours-id="effectiveCoursId"
  :folder-id="currentFolderId"
  @uploaded="onUploadSuccess"
/>

          </div>

        </div>
      </div>

      <!-- ===================================================== -->
      <!-- 📋 CONTEXT MENU -->
      <!-- ===================================================== -->
      <div
        v-if="contextMenu.visible && !isDragging"
        class="context-backdrop"
        @click="closeContextMenu"
      >
        <div
          class="context-menu"
          :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
          @click.stop
        >
          <template v-if="contextMenu.type === 'file'">
            <div class="context-item" @click="startRename(contextMenu.target)">✏️ Renommer</div>
            <div class="context-item" @click="copyFromContext(contextMenu.target)">📋 Copier</div>
            <div class="context-item" @click="cutFromContext(contextMenu.target)">✂️ Couper</div>
            <div class="context-item danger" @click="deleteAndClose(contextMenu.target)">🗑️ Supprimer</div>
          </template>

          <template v-else-if="contextMenu.type === 'folder'">
            <div class="context-item" @click="startRenameFolder(contextMenu.target)">✏️ Renommer</div>
            <div class="context-item danger" @click="deleteFolderAction(contextMenu.target)">
              🗑️ Supprimer le dossier
            </div>
          </template>
        </div>
      </div>

    </div>
  </Layout>
</template>


<script setup>
// ============================================================================
// 📎 ELEVE UPLOADS — Explorer fichiers élève (SBS)
// - Multi-prof (prof_id obligatoire)
// - Auth JWT (Pinia authStore)
// - Appels Apps Script via proxy Vercel
// - Features : list / preview / soft delete / rename inline / explorer dossiers / move
// ============================================================================

import Layout from "@/views/Layout.vue"
import { ref, computed, onMounted, watch, onUnmounted,nextTick,watchEffect } from "vue"
import axios from "axios"
import { useAuthStore } from "@/stores/authStore"
import UploadModal from "@/components/UploadModal.vue"
import { useRoute } from "vue-router"
import UploadFileCore from "@/components/UploadFileCore.vue"


// ============================================================================
// 🔐 AUTH + ROUTE
// ============================================================================
const auth = useAuthStore()
const route = useRoute()
const uiReady = ref(false)
const loading = computed(() => false)

const userId = computed(() =>
  auth.user?.user_id || auth.user?.id || null
)
const profId = computed(() => auth.user?.prof_id || null)
const role = computed(() => (auth.user?.role || "").toLowerCase())

const isProfLike = computed(() =>
  role.value === "prof" || role.value === "admin"
)
const showEmpty = computed(() =>
  firstDataResolved.value &&
  uploads.value.length === 0 &&
  folders.value.length === 0
)

const CACHE_VERSION = "v1"
const t0 = performance.now()
const profRootId = ref(null)
const suppressTransitions = ref(false)
const mountedDone = ref(false)

const isMovingFolder = ref(false)
const hydratedFromCache = ref(false)
const hasProfWorkspace = computed(() =>
  folders.value.some(f => f.parent_id === null)
)
const cacheStart = ref(performance.now())

// ============================================================================
// 🔗 ROUTES APPS SCRIPT (ID de déploiement)
// ⚠️ Doit être IDENTIQUE à tes autres vues (Planning.vue etc.)
// ============================================================================
const routes = {
  POST: "AKfycbyqUv7-h3Ue2OunPDzVmi9yUU01O00zQ3uZ2Mc5pl5ahJvYXLUkNt8jvFzkaqkeHoC78A/exec"
}
const loaderStep = ref("init")

const loaderText = computed(() => {
  switch (loaderStep.value) {
    case "prof-root":
      return "Initialisation de ton espace"
    case "eleve-root":
      return "Création des dossiers élèves"
    case "folders":
      return "Organisation des dossiers"
    case "uploads":
      return "Chargement des fichiers"
    default:
      return "Préparation de ton espace"
  }
})

const loaderSub = computed(() => {
  switch (loaderStep.value) {
    case "prof-root":
      return "Mise en place de la structure"
    case "eleve-root":
      return "Un espace par élève"
    case "folders":
      return "Hiérarchie en cours…"
    case "uploads":
      return "Synchronisation des contenus"
    default:
      return "Merci de patienter…"
  }
})

// ============================================================================
// 🌍 Helper : Apps Script via proxy Vercel (POST)
// ============================================================================
// 🔥 HYDRATATION SYNCHRONE AU SETUP
const hasEleveWorkspace = () =>
  folders.value.some(f =>
    f.owner_type === "eleve" &&
    f.owner_id === userId.value &&
    f.name === "Racine élève"
  )

console.log("🧩 EleveUploads INSTANCE", Math.random())

const getFoldersCacheKey = (ownerType, ownerId) =>
  `folders_${profId.value}_${ownerType}_${ownerId}_${CACHE_VERSION}`

const readFoldersCache = (ownerType, ownerId) => {
  try {
    const raw = sessionStorage.getItem(
      getFoldersCacheKey(ownerType, ownerId)
    )
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

const writeFoldersCache = (ownerType, ownerId, folders) => {
  if (!Array.isArray(folders))  return
  sessionStorage.setItem(
    getFoldersCacheKey(ownerType, ownerId),
    JSON.stringify(folders)
  )
}


const fileRenameRefs = new Map()

const setFileRenameRef = (el, id) => {
  if (el) fileRenameRefs.set(id, el)
}

const startRename = async (file) => {
  closeContextMenu()
  editingId.value = file.upload_id
  editingName.value = file.file_name

  await nextTick()
  fileRenameRefs.get(file.upload_id)?.focus()
  fileRenameRefs.get(file.upload_id)?.select()
}


// ================= CACHE uploads (sessionStorage) =================
const uploadsHydrated = ref(false)

const getUploadsCacheKey = (ownerType, ownerId) =>
  `uploads_${profId.value}_${ownerType}_${ownerId}_${CACHE_VERSION}`


const readUploadsCache = (ownerType, ownerId) => {
  try {
    const raw = sessionStorage.getItem(
      getUploadsCacheKey(ownerType, ownerId)
    )
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

const writeUploadsCache = (ownerType, ownerId, uploads) => {
  if (!Array.isArray(uploads)) return
  sessionStorage.setItem(
    getUploadsCacheKey(ownerType, ownerId),
    JSON.stringify(uploads)
  )
}


const invalidateCaches = (ownerType, ownerId) => {
  sessionStorage.removeItem(getUploadsCacheKey(ownerType, ownerId))
  sessionStorage.removeItem(getFoldersCacheKey(ownerType, ownerId))
}

const getProxyPostURL = (routeId) => {
  const baseURL = `https://script.google.com/macros/s/${routeId}`
  return `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(baseURL)}`
}
const itemEls = ref(new Map()) // id -> element

// ============================================================================
// 🧰 Utils
// ============================================================================
const log = (...args) => console.log("📎 ELEVE UPLOADS", ...args)
const folderRenameInput = ref(null)

const formatDate = (d) => {
  if (!d) return ""
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit"
  })
}
const currentFolderId = ref(null)

const firstDataResolved = computed(() =>
  uploadsLoaded.value && foldersLoaded.value
)





const currentEleveId = ref(null)


const isElevesView = computed(() =>
  isProfLike.value &&
  currentFolderId.value === profElevesFolderId.value
)




// ============================================================================
// 🧠 STATE (toujours déclaré AVANT les computed)
// ============================================================================


const draggedFiles = ref([])
// drag&drop==================

const uploads = ref([])            // liste brute des fichiers (API)

// Upload modal
const showUpload = ref(false)
const effectiveCoursId = ref(null) // utilisé par UploadModal
const generateCoursId = () => `GEN_${Date.now()}`

// Filtres existants (cours / type)
const selectedCours = ref(route.query.cours_id || "")
const selectedType = ref("")
const effectiveEleveId = computed(() => {
  if (isProfLike.value) {
    return currentEleveId.value || ""
  }
  return userId.value || ""
})


// Explorer dossiers (navigation)

// Rename inline
const editingId = ref(null)        // upload_id en cours d'édition
const editingName = ref("")        // valeur du nom édité

// Preview (si tu réactives une modale preview plus tard)
const showPreview = ref(false)
const previewFile = ref(null)


// ref
const folders = ref([]) 



// [{ folder_id, parent_id, name }]

let breadcrumbHoverTimer = null

const onBreadcrumbHover = (folderId) => {
  if (!draggedFiles.value.length) return

  clearTimeout(breadcrumbHoverTimer)
  breadcrumbHoverTimer = setTimeout(() => {
    currentFolderId.value = folderId
  }, 300)
}
const editingFolderId = ref(null)
const editingFolderName = ref("")

const uploadsLoaded = ref(false)
const foldersLoaded = ref(false)

// ===== MENU AJOUT =====
const addMenu = ref({
  visible: false,
  x: 0,
  y: 0
})
const isTempFolder = (id) =>
  typeof id === "string" && id.startsWith("TMP_")

const addBtn = ref(null)

const openAddMenuFromButton = () => {
  const rect = addBtn.value.getBoundingClientRect()
  const MENU_WIDTH = 200
  const PADDING = 8

  let x = rect.right - MENU_WIDTH
  let y = rect.bottom + 6

  if (x < PADDING) x = PADDING
  if (x + MENU_WIDTH > window.innerWidth) {
    x = window.innerWidth - MENU_WIDTH - PADDING
  }

  addMenu.value = {
    visible: true,
    x,
    y
  }
}



const closeAddMenu = () => {
  addMenu.value.visible = false
}

const uploadFolderId = ref(null)

const addFile = () => {
  const folder = folders.value.find(
    f => f.folder_id === currentFolderId.value
  )

  // 👨‍🎓 élève → toujours OK
  if (!isProfLike.value) {
    uploadFolderId.value = currentFolderId.value
    showUpload.value = true
    closeAddMenu()
    return
  }

  // 👨‍🏫 prof
  const isEleveFolder =
    folder?.owner_type === "eleve"

  // ❌ dossier élève sans élève sélectionné
  if (isEleveFolder && !currentEleveId.value) {
    alert("Sélectionne un élève")
    return
  }

  // ✅ dossier prof OU dossier élève valide
  uploadFolderId.value = currentFolderId.value
  showUpload.value = true
  closeAddMenu()
}



const canAddFile = computed(() => {
  const role = (auth.user?.role || "").toLowerCase()
  const isAdmin = role === "admin"

  // prof sans élève sélectionné
  if (isProfLike.value && !currentEleveId.value) return false

  // pas de dossier courant → interdit
  if (!currentFolderId.value) return false

  const folder = folders.value.find(
    f => f.folder_id === currentFolderId.value
  )

  // dossier system → interdit sauf admin
  if (folder?.is_system && !isAdmin) return false

  return true
})



const foldersById = computed(() => {
  const map = {}
  for (const f of folders.value) {
    map[f.folder_id] = f
  }
  return map
})



const foldersCacheKey = computed(() =>
  `folders_${profId.value}_${effectiveOwnerType.value}_${effectiveOwnerId.value}`
)

// ============================================================================
// 🧮 COMPUTED
// ============================================================================
const isCurrentFolderEmpty = computed(() =>
  uploadsHydrated.value &&
  visibleFolders.value.length === 0 &&
  visibleFiles.value.length === 0
)


const showLoader = computed(() => {
  if (hydratedFromCache.value) return false
  return creatingWorkspace.value || !foldersLoaded.value
})





const foldersByParentCache = computed(() => {
  const map = Object.create(null)

  for (const f of folders.value) {
    if (f.deleted_at) continue
    const key = f.parent_id ?? null
    if (!map[key]) map[key] = []
    map[key].push(f)
  }

  return map
})





const filesByFolder = computed(() => {
  const map = Object.create(null)

  for (const u of uploads.value) {
    const key = u.folder_id ?? null
    if (!map[key]) map[key] = []
    map[key].push(u)
  }

  return map
})




// Map cours_id -> date lisible (pour l'UI)
const coursLabelMap = computed(() => {
  const map = Object.create(null)
  for (const u of uploads.value) {
    if (!map[u.cours_id]) {
      map[u.cours_id] = formatDate(u.created_at)
    }
  }
  return map
})


// Liste unique des cours
const coursList = computed(() => {
  return [...new Set(uploads.value.map(u => u.cours_id))]
})

// Breadcrumb : ["Cours", "Cours/Exos", "Cours/Exos/Slap"]
const lastValidBreadcrumb = ref([])
const lastBreadcrumbFolderId = ref(null)

const breadcrumb = computed(() => {
  const targetId = currentFolderId.value
  if (!targetId) return []

  const chain = []
  let id = targetId
  let guard = 0

  while (id && guard++ < 20) {
    const f = foldersById.value[id]

    // TMP pas encore résolu → stop mais on garde ce qu’on a
    if (!f) break

    // sécurité élève
    if (!isProfLike.value && !f._optimistic) {
      if (f.owner_type !== "eleve" || f.owner_id !== userId.value) break
    }

    chain.unshift(f)
    id = f.parent_id
  }

if (chain.length) {
  lastValidBreadcrumb.value = chain
  lastBreadcrumbFolderId.value = targetId
  return chain
}

// 🔥 FIX ÉLÈVE : fallback safe
if (!isProfLike.value) {
  return lastValidBreadcrumb.value
}

return []

})







// Dossiers visibles au niveau courant (déduits des folder_path)


const visibleFolders = computed(() =>
  foldersByParentCache.value[currentFolderId.value ?? null] || []
)






const clearSelection = () => {
  selectedFiles.value = []
}
const uploadsByFolder = computed(() => {
  const map = new Map()
  for (const u of uploads.value) {
    const k = u.folder_id ?? null
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(u)
  }
  return map
})
// Fichiers du dossier courant uniquement
const visibleFiles = computed(() =>
  filesByFolder.value[currentFolderId.value ?? null] || []
)





const effectiveFolderId = computed(() => {
  // dossier courant = vérité absolue
  if (currentFolderId.value) {
    return currentFolderId.value
  }

  // aucun dossier → rien
  return null
})


let lastKey = 0

const onKeyDown = (e) => {
   const now = performance.now()
  if (now - lastKey < 30) return
  lastKey = now
  if (e.key === "Escape") {
    closeContextMenu()
    cancelRename()
  }
if (e.key === "Delete" && selectedFiles.value.length) {
  deleteSelectedUploads()
}


  if (e.key === "F2" && selectedFiles.value.length === 1) {
    const file = uploads.value.find(u => u.upload_id === selectedFiles.value[0])
    if (file) startRename(file)
  }
// COPY
if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
  e.preventDefault()
  copySelection()
}

// CUT
if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x") {
  e.preventDefault()
  cutSelection()
}

// PASTE
if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
  e.preventDefault()
pasteSelection(currentFolderId.value)
}
// ADD FILE
if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
  e.preventDefault()
  showUpload.value = true
}

// ADD FOLDER
if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "n") {
  e.preventDefault()
  createFolder()
}

if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
  e.preventDefault()

  selectedFiles.value = visibleFiles.value.map(f => f.upload_id)
  selectedFolders.value = visibleFolders.value.map(f => f.folder_id)
}



  // UNDO
// UNDO
if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
  e.preventDefault()

  const last = undoStack.value.pop()
  if (!last) return

  uploads.value = last.uploads
  folders.value = last.folders
  currentFolderId.value = last.currentFolderId

  selectedFiles.value = []
  selectedFolders.value = []

  closeContextMenu()
}



}
// FUNCTIONS
const openEleve = (eleveId) => {
  const root = folders.value.find(f =>
    f.owner_type === "eleve" &&
    f.owner_id === eleveId &&
    f.name === "Racine élève"
  )

  if (!root) {
    console.error("❌ racine élève introuvable", eleveId)
    return
  }

  currentEleveId.value = eleveId
  currentFolderId.value = root.folder_id
}

const deleteAndClose = (target) => {
  deleteAction(target)
  closeContextMenu()
}

const selectedFolders = ref([]) // array de folder_id
const toggleSelectFolder = (folder, e) => {
  if (e.ctrlKey || e.metaKey) {
    if (selectedFolders.value.includes(folder.folder_id)) {
      selectedFolders.value = selectedFolders.value.filter(
        id => id !== folder.folder_id
      )
    } else {
      selectedFolders.value.push(folder.folder_id)
    }
  } else {
    selectedFolders.value = [folder.folder_id]
  }

  currentFolderId.value = folder.folder_id

  // ✅ PATCH CRITIQUE
  if (isProfLike.value && folder.owner_type === "eleve") {
    currentEleveId.value = folder.owner_id
    console.log("🟢 currentEleveId set =", currentEleveId.value)
  }
}



const onUploadSuccess = (upload) => {
  upload.folder_id = currentFolderId.value ?? null   // 👈 AVANT

  uploads.value.unshift(upload)

  selectedFiles.value = [upload.upload_id]

writeUploadsCache(
  "eleve",
  effectiveEleveId.value,
  uploads.value
)

}









const deleteSelectedFolders = async () => {
  const ids = [...selectedFolders.value]
  if (!ids.length) return

  if (!confirm(`Supprimer ${ids.length} dossier(s) et leur contenu ?`)) return
closeContextMenu() // ✅ ICI
  pushUndo()

  const foldersSnapshot = [...folders.value]
  const uploadsSnapshot = [...uploads.value]
  const prevFolder = currentFolderId.value



  // ⚡ UI instant
  folders.value = folders.value.filter(
    f => !ids.includes(f.folder_id)
  )

  uploads.value = uploads.value.filter(
    u => !ids.includes(u.folder_id)
  )

  if (ids.includes(currentFolderId.value)) {
    currentFolderId.value = ""
  }

  selectedFolders.value = []

  try {
    const url = getProxyPostURL(routes.POST)

    await Promise.all(
      ids.map(folder_id =>
        axios.post(url, {
          route: "softdeletefolder",
          jwt: auth.jwt,
          prof_id: profId.value,
          folder_id
        })
      )
    )
      writeUploadsCache(effectiveOwnerType.value, effectiveOwnerId.value, uploads.value)
      writeFoldersCache(
  effectiveOwnerType.value,
  effectiveOwnerId.value,
  folders.value
)

  } catch (e) {
    folders.value = foldersSnapshot
    uploads.value = uploadsSnapshot
    currentFolderId.value = prevFolder
    alert("Erreur suppression dossiers")
  }
}
const deleteFolderAction = (folder = null) => {
  if (selectedFolders.value.length) {
    deleteSelectedFolders()
  } else if (folder) {
    deleteFolder(folder)
  }
}

const deleteAction = (file = null) => {
  if (selectedFiles.value.length) {
    deleteSelectedUploads()
  } else if (file) {
    deleteUpload(file)
  }
}

const elevesMap = ref({}) // eleve_id -> prénom (ou prénom.email)

const getDisplayFolderName = (folder) => {
  // 👨‍🏫 PROF → racine élève = prénom
  if (
    isProfLike.value &&
    folder.owner_type === "eleve" &&
    folder.name === "Racine élève"
  ) {
    return elevesMap.value[folder.owner_id] || "Élève"
  }

  // 👨‍🎓 ÉLÈVE → sa propre racine
  if (
    !isProfLike.value &&
    folder.owner_type === "eleve" &&
    folder.name === "Racine élève"
  ) {
    return "Mes documents"
  }

  return folder.name
}




const ensureEleveRoot = async () => {
  console.group("🧱 ensureEleveRoot")

  if (!userId.value) {
    console.error("❌ userId manquant (élève)")
    console.groupEnd()
    return null
  }

  const url = getProxyPostURL(routes.POST) // ✅ FIX

  try {
    creatingWorkspace.value = true

    const { data } = await axios.post(url, {
      route: "get_or_create_eleve_root",
      jwt: auth.jwt,
      prof_id: profId.value,
      eleve_id: userId.value
    })

    const rootId =
      data?.root_folder_id ||
      data?.folder_id ||
      data?.eleve_root_id ||
      null

    if (!data?.success || !rootId) {
      throw new Error("eleve root failed")
    }

    currentFolderId.value = rootId
    console.log("📁 root élève =", rootId)

    return rootId

  } catch (e) {
    console.error("❌ ensureEleveRoot", e)
    return null
  } finally {
    creatingWorkspace.value = false
    console.groupEnd()
  }
}







const onDrop = async (targetFolderId) => {
  if (!draggedFiles.value.length) return

  const target = targetFolderId ?? ""

  const previous = draggedFiles.value.map(f => ({
    file: f,
    folder_id: f.folder_id ?? ""
  }))

  // UI instant
  draggedFiles.value.forEach(f => {
    f.folder_id = target
  })

  try {
    await Promise.all(
      previous.map(p =>
        axios.post(getProxyPostURL(routes.POST), {
          route: "moveuploadtofolder",
          jwt: auth.jwt,
          prof_id: profId.value,
          upload_id: p.file.upload_id,
          folder_id: target
        })
      )
    )

    writeUploadsCache(
      effectiveOwnerType.value,
      effectiveOwnerId.value,
      uploads.value
    )

  } catch (e) {
    // rollback
    previous.forEach(p => {
      p.file.folder_id = p.folder_id
    })
    alert("Erreur déplacement")
  }
}

const getAutoRenamed = (name, siblings) => {
  const dotIndex = name.lastIndexOf(".")
  const rawBase = dotIndex !== -1 ? name.slice(0, dotIndex) : name
  const ext = dotIndex !== -1 ? name.slice(dotIndex) : ""

  // supprime un éventuel " (n)" final
  const base = rawBase.replace(/\s\(\d+\)$/, "")

  const existing = siblings.map(f => f.file_name)

  let i = 1
  let candidate = `${base}${ext}`

  while (existing.includes(candidate)) {
    candidate = `${base} (${i})${ext}`
    i++
  }

  return candidate
}



const creatingWorkspace = ref(false)

const copyFromContext = (file) => {
  // sélection implicite si pas déjà sélectionné
  if (!selectedFiles.value.includes(file.upload_id)) {
    selectedFiles.value = [file.upload_id]
  }

  copySelection()
  closeContextMenu()
}

const cutFromContext = (file) => {
  if (!selectedFiles.value.includes(file.upload_id)) {
    selectedFiles.value = [file.upload_id]
  }

  cutSelection()
  closeContextMenu()
}

const pasteFromContext = () => {
  let target = currentFolderId.value || ""

  if (contextMenu.value.type === "folder") {
    target = contextMenu.value.target.folder_id
  }
  if (!clipboard.value.uploads.length) return

  pasteSelection(target)
  closeContextMenu()
}

const ensureProfRoot = async () => {
  if (currentEleveId.value) return null

  const { data } = await axios.post(getProxyPostURL(routes.POST), {
    route: "get_or_create_prof_root",
    jwt: auth.jwt,
    prof_id: profId.value
  })

  if (!data?.success || !data.prof_root_id) return null

  profRootId.value = data.prof_root_id

  if (!currentFolderId.value) {
    currentFolderId.value = data.prof_root_id
  }

  profElevesFolderId.value = data.eleves_folder_id || null

  return data.prof_root_id
}









// ================= CONTEXT MENU =================
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  type: null,   // "file" | "folder"
  target: null // file ou folder path
})

const closeContextMenu = () => {
  contextMenu.value.visible = false
}

const selectedFiles = ref([]) // array d'upload_id


// ============================================================================
// 📡 API — Fetch uploads
// ============================================================================
const fetchUploads = async () => {
  if (!auth.user?.prof_id) return
  if (!auth.jwt) return

  const eleveIdToFetch = isProfLike.value
    ? currentEleveId.value
    : userId.value

  if (isProfLike.value && !eleveIdToFetch) {
    uploadsLoaded.value = true
    return
  }

  // ✅ 1️⃣ CACHE D’ABORD
const cached = readUploadsCache(
  effectiveOwnerType.value,
  effectiveOwnerId.value
)


if (Array.isArray(cached)) {
  uploads.value = cached.map(u => ({ ...u }))
  uploadsLoaded.value = true
}




  // ⏳ 2️⃣ PAS DE CACHE → loader seulement ici
  uploadsLoaded.value = false

  try {
    const res = await axios.post(getProxyPostURL(routes.POST), {
      route: "getuploadsbyeleve",
      jwt: auth.jwt,
      prof_id: profId.value,
      eleve_id: eleveIdToFetch
    })

    if (!res.data?.success) throw new Error()

    uploads.value = res.data.uploads || []
   writeUploadsCache(
  effectiveOwnerType.value,
  effectiveOwnerId.value,
  uploads.value
)


  } catch (e) {
    console.error(e)
  } finally {
    uploadsLoaded.value = true
    uploadsHydrated.value = true
  }
}


const effectiveOwnerType = computed(() =>
  isProfLike.value ? "prof" : "eleve"
)

const effectiveOwnerId = computed(() =>
  isProfLike.value ? profId.value : userId.value
)
// recup dossier
const fetchFolders = async (force = false) => {
  console.log(
  "🧪 FOLDERS FRONT =",
  folders.value.map(f => `${f.owner_type}:${f.name}`)
)
  // =========================================================================
  // 1️⃣ CACHE IMMÉDIAT (UX)
  // =========================================================================
  if (!force) {
    const cached = readFoldersCache(
      effectiveOwnerType.value,
      effectiveOwnerId.value
    )

    if (Array.isArray(cached) && cached.length) {
      folders.value = cached.map(f => ({ ...f }))
      foldersLoaded.value = true
      hydratedFromCache.value = true
    }
  }

  // =========================================================================
  // 2️⃣ LOADER UNIQUEMENT SI PAS DE CACHE
  // =========================================================================
  if (!hydratedFromCache.value && !force) {
    foldersLoaded.value = false
  }

  if (!auth.jwt || !profId.value) return

  const eleveId = isProfLike.value ? currentEleveId.value : userId.value
  if (!eleveId && !isProfLike.value) return

  const isInTmp = currentFolderId.value?.startsWith("TMP_")

  // =========================================================================
  // 3️⃣ BACKEND (BACKGROUND, TMP-SAFE)
  // =========================================================================
  try {
    const res = await axios.post(getProxyPostURL(routes.POST), {
      route: isProfLike.value ? "getfoldersbyprof" : "getfolderstree",
      jwt: auth.jwt,
      prof_id: profId.value,
      eleve_id: eleveId || null,
      role: auth.user?.role || ""
    })

    if (!res.data?.success) throw new Error("fetchFolders failed")

    const fresh = (res.data.folders || []).map(f => ({
      folder_id: f.folder_id,
      parent_id:
        f.parent_id && typeof f.parent_id === "string" && f.parent_id !== "null"
          ? f.parent_id
          : null,
      name: f.folder_name || f.name || "Sans nom",
      owner_id: f.owner_id,
      owner_type: f.owner_type
    }))

    // ───────────────────────────────────────────────────────────────────────
    // 🔥 MERGE TMP (sans flash)
    // ───────────────────────────────────────────────────────────────────────
    if (isInTmp) {
      const tmps = folders.value.filter(f => f._optimistic)
      folders.value = fresh

      for (const tmp of tmps) {
        if (!folders.value.find(f => f.folder_id === tmp.folder_id)) {
          folders.value.push(tmp)
        }
      }
    } else {
      folders.value = fresh
    }

    // =========================================================================
    // 4️⃣ CACHE (APRÈS ÉTAT STABLE)
    // =========================================================================
    writeFoldersCache(
      effectiveOwnerType.value,
      effectiveOwnerId.value,
      folders.value
    )

    // =========================================================================
    // 5️⃣ ROOT FINAL (SAFE)
    // =========================================================================
    if (!currentFolderId.value) {
      const root = isProfLike.value
        ? folders.value.find(f => f.parent_id === null)
        : folders.value.find(
            f =>
              f.owner_type === "eleve" &&
              f.owner_id === userId.value &&
              f.name === "Racine élève"
          )

      currentFolderId.value = root?.folder_id || null
    }

  } catch (e) {
    console.error("❌ fetchFolders", e)
  } finally {
    foldersLoaded.value = true
  }
}








const profElevesFolderId = ref(null)



//=============================================================================
// Ajouter un dossier

const openEmptyMenu = (e) => {
  e.preventDefault()
  e.stopPropagation()
closeAddMenu()
  closeContextMenu()
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    type: "empty",
    target: null
  }
  closeAddMenu()

}


// === PATCH createFolder (anti re-render / anti clignotement) ===
const createFolder = async () => {
  console.group("📁 CREATE FOLDER")

  // ===============================
  // 0️⃣ Nom
  // ===============================
  const name = prompt("Nom du dossier")
  if (!name?.trim()) {
    console.log("❌ nom vide → abort")
    console.groupEnd()
    return
  }

  const parentId = currentFolderId.value ?? null
  const isEleveContext = !isProfLike.value

  console.log("📂 parentId =", parentId)
  console.log("👤 context =", isEleveContext ? "élève" : "prof")

  // ===============================
  // 1️⃣ TMP immédiat
  // ===============================
  const tmpId = `TMP_${crypto.randomUUID()}`
  const tmpFolder = {
    folder_id: tmpId,
    parent_id: parentId,
    name: name.trim(),
    owner_type: isEleveContext ? "eleve" : "prof",
    owner_id: isEleveContext ? userId.value : profId.value,
    _optimistic: true
  }

  folders.value.push(tmpFolder)

  console.log("🧪 TMP ajouté =", tmpId)
  console.log("👀 visibles =", visibleFolders.value.map(f => f.folder_id))

  // rename inline
  editingFolderId.value = tmpId
  editingFolderName.value = tmpFolder.name

  await nextTick()
  folderRenameRefs.get(tmpId)?.focus()
  folderRenameRefs.get(tmpId)?.select()

  // état navigation
  const wasInside = currentFolderId.value === tmpId
  let realFolder = null

  try {
    // ===============================
    // 2️⃣ BACKEND
    // ===============================
    console.log("🌍 backend createfolder…")

    const res = await axios.post(getProxyPostURL(routes.POST), {
      route: "createfolder",
      jwt: auth.jwt,
      prof_id: profId.value,
      owner_type: tmpFolder.owner_type,
      owner_id: tmpFolder.owner_id,
      parent_id: parentId,
      name: tmpFolder.name
    })

    if (!res.data?.success || !res.data.folder) {
      throw new Error("backend failed")
    }

    realFolder = res.data.folder
    console.log("✅ BACKEND OK =", realFolder.folder_id)

    // ===============================
    // 3️⃣ TMP → REAL (anti-flash)
    // ===============================
    suppressTransitions.value = true
    await nextTick()

    const idx = folders.value.findIndex(f => f.folder_id === tmpId)
    if (idx !== -1) {
      folders.value.splice(idx, 1, {
        ...folders.value[idx],
        folder_id: realFolder.folder_id,
        parent_id: parentId,
        name:
          realFolder.name ||
          realFolder.folder_name ||
          folders.value[idx].name,
        _optimistic: false
      })
    } else {
      console.warn("⚠️ TMP introuvable au replace")
    }

    await nextTick()
    suppressTransitions.value = false

    // ===============================
    // 4️⃣ ÉTAT UI FINAL
    // ===============================
    if (editingFolderId.value === tmpId) {
      editingFolderId.value = realFolder.folder_id
    }

    selectedFolders.value = [realFolder.folder_id]

    // 🔥 CLÉ : rester dans le dossier
    if (currentFolderId.value === tmpId) {
      currentFolderId.value = realFolder.folder_id
      console.log("🔁 currentFolderId realigned =", realFolder.folder_id)
    }

    writeFoldersCache(
      effectiveOwnerType.value,
      effectiveOwnerId.value,
      folders.value
    )

    console.log(
      "👀 visibles après REAL =",
      visibleFolders.value.map(f => f.folder_id)
    )

  } catch (e) {
    console.error("❌ createFolder error", e)

    // rollback
    folders.value = folders.value.filter(f => f.folder_id !== tmpId)
    alert("Erreur création dossier")

  } finally {
    editingFolderId.value = null
    editingFolderName.value = ""
    console.groupEnd()
  }
}








// ============================================================================
// 🗑️ Soft delete (UX instant : on retire localement)
// ============================================================================
const deleteUpload = async (file) => {
  pushUndo()
  const snapshot = [...uploads.value]

  uploads.value = uploads.value.filter(u => u.upload_id !== file.upload_id)

  try {
    const url = getProxyPostURL(routes.POST)

    const res = await axios.post(url, {
      route: "softdeleteupload",
      jwt: auth.jwt,
      prof_id: profId.value,
      upload_id: file.upload_id
    })
  writeUploadsCache(effectiveOwnerType.value, effectiveOwnerId.value, uploads.value)

    if (!res.data?.success) throw new Error()
  } catch (e) {
    uploads.value = snapshot
writeUploadsCache(effectiveOwnerType.value, effectiveOwnerId.value, uploads.value)

    alert("Erreur suppression fichier")
  }
}
const safeAddFile = () => {
  addFile()
}

const deleteSelectedUploads = async () => {
  const ids = [...selectedFiles.value]
  if (!ids.length) return

  if (!confirm(`Supprimer ${ids.length} fichier(s) ?`)) return

  pushUndo()

  const snapshot = [...uploads.value]

  // ⚡ UI instant
  uploads.value = uploads.value.filter(
    u => !ids.includes(u.upload_id)
  )
  selectedFiles.value = []

  try {
    const url = getProxyPostURL(routes.POST)

    await Promise.all(
      ids.map(upload_id =>
        axios.post(url, {
          route: "softdeleteupload",
          jwt: auth.jwt,
          prof_id: profId.value,
          upload_id
        })
      )
    )
  writeUploadsCache(effectiveOwnerType.value, effectiveOwnerId.value, uploads.value)

  } catch (e) {
    // 🔁 rollback
    uploads.value = snapshot
writeUploadsCache(effectiveOwnerType.value, effectiveOwnerId.value, uploads.value)

    alert("Erreur suppression fichiers")
  }
}



// const delete dossiers 
const deleteFolder = async (folder) => {

  if (!confirm("Supprimer ce dossier et tout son contenu ?")) return
  pushUndo()

  // =============================
  // 🔥 SNAPSHOT (rollback)
  // =============================
  const foldersSnapshot = [...folders.value]
  const uploadsSnapshot = [...uploads.value]
  const previousFolderId = currentFolderId.value

  // =============================
  // ⚡ UI INSTANT
  // =============================
  // supprimer le dossier
  folders.value = folders.value.filter(f => f.folder_id !== folder.folder_id)

  // supprimer les fichiers du dossier
  


  uploads.value = uploads.value.filter(
    u => u.folder_id !== folder.folder_id
  )

  // revenir à la racine si on était dedans
 if (currentFolderId.value === folder.folder_id) {
  currentFolderId.value = null
}


  // =============================
  // 🌍 BACKEND
  // =============================
  try {
    const url = getProxyPostURL(routes.POST)

    const res = await axios.post(url, {
      route: "softdeletefolder",
      jwt: auth.jwt,
      prof_id: profId.value,
      folder_id: folder.folder_id
    })



    if (!res.data?.success) {
      throw new Error("delete folder failed")
    }
  writeUploadsCache(effectiveOwnerType.value, effectiveOwnerId.value, uploads.value)
writeFoldersCache(
  effectiveOwnerType.value,
  effectiveOwnerId.value,
  folders.value
)
  } catch (e) {
    // =============================
    // 🔁 ROLLBACK
    // =============================
    folders.value = foldersSnapshot
    uploads.value = uploadsSnapshot
    currentFolderId.value = previousFolderId

    alert("Erreur suppression dossier")
  }
}


// ============================================================================
// ✏️ Rename inline (Enter / Blur = save, Esc = cancel)
// ============================================================================

const loadProfEleves = async () => {
  if (!isProfLike.value) return

  const url = getProxyPostURL(routes.POST)

  const { data } = await axios.post(url, {
    route: "get_prof_eleves",
    jwt: auth.jwt,
    prof_id: profId.value
  })

  if (!data?.success || !data.eleves?.length) return

  elevesMap.value = {}
  data.eleves.forEach(e => {
    elevesMap.value[e.eleve_id] = e.name
  })

}



const cancelRename = () => {
  editingId.value = null
  editingName.value = ""
}

const confirmRename = async (file) => {
  let newName = (editingName.value || "").trim()
  if (!newName || newName === file.file_name) {
    cancelRename()
    return
  }

  // 📁 fichiers frères (même dossier, sauf lui)
  const siblings = uploads.value.filter(
    u => u.folder_id === file.folder_id &&
         u.upload_id !== file.upload_id
  )

  // 🧠 auto-rename si doublon
  newName = getAutoRenamed(newName, siblings)

  // 🔥 UI instant
  const oldName = file.file_name
  file.file_name = newName
  cancelRename()

  try {
    const url = getProxyPostURL(routes.POST)

    const res = await axios.post(url, {
      route: "renameupload",
      jwt: auth.jwt,
      prof_id: profId.value,
      upload_id: file.upload_id,
      new_name: newName
    })
  writeUploadsCache(effectiveOwnerType.value, effectiveOwnerId.value, uploads.value)

    if (!res.data?.success) throw new Error()

  } catch (e) {
    // 🔁 rollback
    file.file_name = oldName
    alert("Erreur renommage fichier")
  }
}


const openFolderMenu = (e, folder) => {
  e.preventDefault()
  e.stopPropagation()
closeAddMenu()
  closeContextMenu()
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    type: "folder",
    target: folder
  }
  closeAddMenu()


}
const folderRenameRefs = new Map()

const setFolderRenameRef = (el, id) => {
  if (el) folderRenameRefs.set(id, el)
}
const startRenameFolder = async (folder) => {
  closeContextMenu()
  editingFolderId.value = folder.folder_id
  editingFolderName.value = folder.name

  await nextTick()
  folderRenameRefs.get(folder.folder_id)?.focus()
  folderRenameRefs.get(folder.folder_id)?.select()
}

const cancelRenameFolder = () => {
  editingFolderId.value = null
  editingFolderName.value = ""
}

const confirmRenameFolder = async (folder) => {
let newName = editingFolderName.value.trim()

const siblings = folders.value.filter(
  f => f.parent_id === folder.parent_id &&
       f.folder_id !== folder.folder_id
)

const existingNames = siblings.map(f => f.name)
let base = newName.replace(/\s\(\d+\)$/, "")
let i = 1

while (existingNames.includes(newName)) {
  newName = `${base} (${i})`
  i++
}

  if (!newName || newName === folder.name) {
    cancelRenameFolder()
    return
  }

  // 🔥 UI INSTANT
  const oldName = folder.name
  pushUndo()

  folder.name = newName
  cancelRenameFolder()

  try {
    const url = getProxyPostURL(routes.POST)

    const res = await axios.post(url, {
      route: "renamefolder",
      jwt: auth.jwt,
      prof_id: profId.value,
      folder_id: folder.folder_id,
      new_name: newName
    })
 writeFoldersCache(
    effectiveOwnerType.value,
    effectiveOwnerId.value,
    folders.value
  )

    if (!res.data?.success) throw new Error()

  } catch (e) {
    // 🔁 rollback
    folder.name = oldName
    alert("Erreur renommage dossier")
  }
}
const openFile = (file) => {
  // si preview activée
  if (file.file_url) {
    window.open(file.file_url, "_blank")
  }
}


// Open file menu
const openFileMenu = (e, file) => {
  // ⛔ empêche le click implicite
  e.preventDefault()
  e.stopPropagation()
closeAddMenu()
  closeContextMenu()
  // ✅ si le fichier n’est PAS déjà sélectionné → sélection unique
  if (!selectedFiles.value.includes(file.upload_id)) {
    selectedFiles.value = [file.upload_id]
  }

  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    type: "file",
    target: file
  }
  closeAddMenu()


}




// action dossier 

const isDragging = ref(false)


const toggleSelect = (file, e) => {

  if (e.ctrlKey || e.metaKey) {
    if (selectedFiles.value.includes(file.upload_id)) {
      selectedFiles.value = selectedFiles.value.filter(id => id !== file.upload_id)
    } else {
      selectedFiles.value.push(file.upload_id)
    }
  } else {
    selectedFiles.value = [file.upload_id]
  }
}
const draggedFolder = ref(null)

const onDragStart = (e, file) => {
    draggedFolder.value = null

  isDragging.value = true

  if (!selectedFiles.value.includes(file.upload_id)) {
    selectedFiles.value = [file.upload_id]
  }

  draggedFiles.value = uploads.value.filter(u =>
    selectedFiles.value.includes(u.upload_id)
  )

  e.dataTransfer.effectAllowed = "move"
  e.dataTransfer.setData("text/plain", "files")
}

const onDragEnd = () => {
  isDragging.value = false
  draggedFiles.value = []
  draggedFolder.value = null
}





const onFolderDragStart = (e, folder) => {
  console.group("📦 FOLDER DRAG START")
  console.log("folder =", folder)

  draggedFiles.value = []
  selectedFiles.value = []

  isDragging.value = true
  draggedFolder.value = folder

  e.dataTransfer.effectAllowed = "move"
  e.dataTransfer.setData("text/plain", `folder:${folder.folder_id}`)

  console.log("draggedFolder =", draggedFolder.value)
  console.groupEnd()
}



const explorerKey = ref(0)

const onFolderDrop = async (targetParentId) => {
  if (!draggedFolder.value) return

  isMovingFolder.value = true

  const folder = draggedFolder.value
  const previousParent = folder.parent_id ?? null

  folder.parent_id = targetParentId ?? null
  currentFolderId.value = targetParentId ?? null
  explorerKey.value++

  try {
    await axios.post(getProxyPostURL(routes.POST), {
      route: "movefolder",
      jwt: auth.jwt,
      prof_id: profId.value,
      folder_id: folder.folder_id,
      new_parent_id: targetParentId ?? null
    })

    writeFoldersCache(
      effectiveOwnerType.value,
      effectiveOwnerId.value,
      folders.value
    )

  } catch (e) {
    folder.parent_id = previousParent
    alert("Erreur déplacement dossier")
  } finally {
    isMovingFolder.value = false
    draggedFolder.value = null
  }
}



const handleDropOnFolder = (folderId) => {
  console.group("📥 DROP")
  console.log("targetFolderId =", folderId)
  console.log("draggedFiles =", draggedFiles.value.map(f => f.upload_id))
  console.log("draggedFolder =", draggedFolder.value?.folder_id)
  console.log("isDragging =", isDragging.value)

  if (draggedFiles.value.length) {
    console.log("➡️ DROP FILES")
    onDrop(folderId)
    console.groupEnd()
    return
  }

  if (draggedFolder.value) {
    console.log("➡️ DROP FOLDER")
    onFolderDrop(folderId)
    console.groupEnd()
    return
  }

  console.warn("⚠️ DROP SANS PAYLOAD")
  console.groupEnd()
}

const filesCountByFolder = computed(() => {
  const map = {}
  uploads.value.forEach(u => {
    const k = u.folder_id ?? null
    map[k] = (map[k] || 0) + 1
  })
  return map
})

// ============================================================================
// 📁 Move upload -> folder_path (simple prompt pour l’instant)
// ============================================================================

// fenetre copy paste renamme 
const clipboard = ref({
  mode: null, // "copy" | "cut"
  uploads: [] // array de fichiers
})



const copySelection = () => {
  if (!selectedFiles.value.length) return
 clipboard.value = {
  mode: "copy",
  uploads: [...selectedFiles.value] // uniquement les IDs
}

}
const pasteSelection = async (target = null) => {
  const finalTarget = target ?? currentFolderId.value ?? ""
  if (!clipboard.value.uploads.length) return

  const files = clipboard.value.uploads
    .map(id => uploads.value.find(u => u.upload_id === id))
    .filter(Boolean)

  if (!files.length) return

  const allSameFolder = files.every(
    f => (f.folder_id || "") === finalTarget
  )
  if (allSameFolder) return

  pushUndo()

  const url = getProxyPostURL(routes.POST)

  // ================= CUT =================
  if (clipboard.value.mode === "cut") {
    files.forEach(f => f.folder_id = finalTarget)

    try {
      await Promise.all(
        files.map(f =>
          axios.post(url, {
            route: "moveuploadtofolder",
            jwt: auth.jwt,
            prof_id: profId.value,
            upload_id: f.upload_id,
            folder_id: finalTarget
          })
        )
      )

      clipboard.value = { mode: null, uploads: [] }
      selectedFiles.value = []
writeUploadsCache(effectiveOwnerType.value, effectiveOwnerId.value, uploads.value)

    } catch (e) {
      const last = undoStack.value.pop()
      if (last) uploads.value = last.uploads
writeUploadsCache(effectiveOwnerType.value, effectiveOwnerId.value, uploads.value)

      alert("Erreur déplacement")
    }
    return
  }

  // ================= COPY =================
  let clones = []

  files.forEach(original => {
    const siblings = uploads.value
      .concat(clones)
      .filter(u => (u.folder_id ?? "") === finalTarget)

    const newName = getAutoRenamed(original.file_name, siblings)

    clones.push({
      ...original,
      upload_id: `TMP_${crypto.randomUUID()}`,
      original_id: original.upload_id,
      folder_id: finalTarget,
      file_name: newName,
      _optimistic: true
    })
  })

  uploads.value.push(...clones)

  try {
const res = await axios.post(url, {
  route: "copyuploads_batch",
  jwt: auth.jwt,
  prof_id: profId.value,
  uploads: clones.map(c => ({
    upload_id: c.original_id,
    target_folder_id: finalTarget,
    new_name: c.file_name
  }))
})

res.data.uploads.forEach((real, i) => {
  const tmp = clones[i]

  tmp.upload_id  = real.upload_id
  tmp.file_url   = real.file_url
  tmp.file_size  = real.file_size
  tmp.file_type  = real.file_type
  tmp.created_at = real.created_at
  delete tmp._optimistic
})
writeUploadsCache(
  effectiveOwnerType.value,
  effectiveOwnerId.value,
  uploads.value.filter(u => !u._optimistic)
)


  

    selectedFiles.value = []
  } catch (e) {
    const last = undoStack.value.pop()
    if (last) uploads.value = last.uploads
writeUploadsCache(effectiveOwnerType.value, effectiveOwnerId.value, uploads.value)

    alert("Erreur copie")
  }
}



const isNavigating = ref(false)

const cutSelection = () => {
  if (!selectedFiles.value.length) return
clipboard.value = {
  mode: "cut",
  uploads: [...selectedFiles.value]
}

}

const enterFolder = (folder) => {
  currentFolderId.value = folder.folder_id

  // 🔥 CLÉ
  if (isProfLike.value && folder.folder_id === profElevesFolderId.value) {
    currentEleveId.value = null
  }

  if (isProfLike.value && folder.owner_type === "eleve") {
    currentEleveId.value = folder.owner_id
  }
}



const undoStack = ref([])

const pushUndo = () => {
  undoStack.value.push({
    uploads: JSON.parse(JSON.stringify(uploads.value)),
    folders: JSON.parse(JSON.stringify(folders.value)),
    currentFolderId: currentFolderId.value
  })

  if (undoStack.value.length > 10) {
    undoStack.value.shift()
  }
}

const goHome = () => {
  // reset sélection
  selectedFiles.value = []
  selectedFolders.value = []

  // élève → racine élève
  if (!isProfLike.value) {
    const root = folders.value.find(f =>
      f.owner_type === "eleve" &&
      f.owner_id === userId.value &&
      f.name === "Racine élève"
    )
    currentFolderId.value = root?.folder_id || null
    return
  }

  // prof → racine prof
  const root = folders.value.find(f => f.parent_id === null)
  currentFolderId.value = root?.folder_id || null
}

// ============================================================================
// 👁️ Preview (si tu remets une modale preview plus tard)
// ============================================================================
const openPreview = (file) => {
  previewFile.value = file
  showPreview.value = true
}

const closePreview = () => {
  showPreview.value = false
  previewFile.value = null
}

// ============================================================================
// 👀 WATCHERS — SAFE (clean sans changer le comportement)
// ============================================================================
watchEffect(() => {
  console.log("🧭 isElevesView =", isElevesView.value,
    "currentFolderId =", currentFolderId.value,
    "elevesFolderId =", profElevesFolderId.value
  )
})

watch(currentFolderId, () => {
  isNavigating.value = true
  requestAnimationFrame(() => {
    isNavigating.value = false
  })
})
watch(showLoader, v =>
  console.log("⏳ showLoader =", v, {
    creatingWorkspace: creatingWorkspace.value,
    foldersLoaded: foldersLoaded.value,
    hydratedFromCache: hydratedFromCache.value
  })
)

// ------------------------------------------------------------
// PERF / UI RESET
// ------------------------------------------------------------
watch(currentFolderId, () => {
 if (!isDragging.value) {
    draggedFiles.value = []
    draggedFolder.value = null
  }

  closeAddMenu()
  itemEls.value.clear()
})

// ------------------------------------------------------------
// PERF / TIMING LOGS (one-shot)
// ------------------------------------------------------------
watch(
  () => foldersLoaded.value,
  v => {
    if (v) {
      console.log(
        "📁 DOSSIERS AFFICHÉS EN",
        (performance.now() - t0).toFixed(1),
        "ms"
      )
    }
  },
  { once: true }
)

watch(
  () => uploadsHydrated.value,
  v => {
    if (v) {
      const t = performance.now()
      console.log("⚡ CACHE HYDRATÉ EN", (t - cacheStart.value).toFixed(1), "ms")
    }
  },
  { once: true }
)


// ------------------------------------------------------------
// INIT ROOT (utilisé ailleurs → ON GARDE)
// ------------------------------------------------------------
const rootInitialized = ref(false)

// ------------------------------------------------------------
// CHANGEMENT D’ÉLÈVE (PROF)
// ⚠️ logique DATA uniquement
// ------------------------------------------------------------
watch(currentEleveId, (id, prev) => {
  if (!mountedDone.value) return          // 🔥 FIX PRINCIPAL
  if (isMovingFolder.value) return
  if (!id || id === prev) return
  if (currentFolderId.value === null) return

  invalidateCaches(effectiveOwnerType.value, prev)
  fetchFolders(true)
  fetchUploads()
})





// ------------------------------------------------------------
// UI / ÉTATS TRANSVERSAUX
// ------------------------------------------------------------
watch(
  () => firstDataResolved.value,
  v => {
    if (v) creatingWorkspace.value = false
  }
)

// ------------------------------------------------------------
// ROUTE → cours
// ------------------------------------------------------------
watch(
  () => route.query.cours_id,
  v => {
    selectedCours.value = v || ""
    if (v) {
      effectiveCoursId.value = v
    } else if (!effectiveCoursId.value) {
      effectiveCoursId.value = generateCoursId()
    }
  },
  { immediate: true }
)

watch(selectedCours, v => {
  if (v) effectiveCoursId.value = v
})

// ------------------------------------------------------------
// DEBUG (optionnel, tu peux virer plus tard)
// ------------------------------------------------------------
watch(currentEleveId, v => console.log("👤 currentEleveId =", v))
watch(currentFolderId, v => console.log("📁 currentFolderId =", v))



const blockNativeContextMenu = (e) => {
  if (contextMenu.value.visible || addMenu.value.visible) {
    e.preventDefault()
  }
}
// ============================================================================
// 🚀 LIFECYCLE
// ============================================================================
onMounted(async () => {
  console.group("🚀 ELEVEUPLOADS MOUNT")

  // ===============================
  // RESET UI
  // ===============================
  addMenu.value.visible = false
  contextMenu.value.visible = false
  isDragging.value = false
  selectedFiles.value = []
  selectedFolders.value = []

 // ===============================
// 👨‍🎓 MODE ÉLÈVE
// ===============================
if (!isProfLike.value) {
  console.log("👨‍🎓 MODE ÉLÈVE")

  // 0️⃣ garde identité
  if (!userId.value) {
    console.error("❌ userId manquant (élève)")
    return
  }

  // 1️⃣ cache (optionnel)
  const cachedFolders = readFoldersCache(
    effectiveOwnerType.value,
    effectiveOwnerId.value
  )

  if (Array.isArray(cachedFolders) && cachedFolders.length) {
    folders.value = cachedFolders.map(f => ({ ...f }))
    foldersLoaded.value = true
    hydratedFromCache.value = true

    const root = cachedFolders.find(f =>
      f.owner_type === "eleve" &&
      f.owner_id === userId.value &&
      f.name === "Racine élève"
    )

    currentFolderId.value = root?.folder_id || null
    console.log("⚡ cache élève chargé =", cachedFolders.length)
  }

  // 2️⃣ RACINE ÉLÈVE = SOURCE DE VÉRITÉ
  if (!currentFolderId.value) {
    console.log("🧱 ensureEleveRoot (obligatoire)")
    loaderStep.value = "eleve-root"

    const rootId = await ensureEleveRoot()

    if (!rootId) {
      console.error("❌ impossible de créer la racine élève")
      return
    }

    currentFolderId.value = rootId
  }

  console.log("📁 root élève =", currentFolderId.value)

  // 3️⃣ dossiers (FORCE backend)
  loaderStep.value = "folders"

  await fetchFolders(true)

  // 4️⃣ uploads (bg)
  loaderStep.value = "uploads"

  fetchUploads()

  console.log("✅ ÉLÈVE READY")
  return
}

  
// ===============================
// 👨‍🏫 MODE PROF (cache-aware, root-safe)
// ===============================
console.group("👨‍🏫 MODE PROF")

creatingWorkspace.value = false
hydratedFromCache.value = false

// -------------------------------------------------
// 0️⃣ CACHE IMMÉDIAT (AVANT RÉSEAU)
// -------------------------------------------------
console.log("⚡ cache prof: lecture…")
const cachedFolders = readFoldersCache(
  effectiveOwnerType.value,
  effectiveOwnerId.value
)

const hasCache = Array.isArray(cachedFolders) && cachedFolders.length

if (hasCache) {
  folders.value = cachedFolders.map(f => ({ ...f }))
  foldersLoaded.value = true
  hydratedFromCache.value = true
  uploadsLoaded.value = true

  const root = folders.value.find(f => f.parent_id === null) || null
  if (!currentFolderId.value) currentFolderId.value = root?.folder_id || null

  console.log("⚡ cache prof hydraté =", cachedFolders.length)
  console.log("📁 root(cache) =", currentFolderId.value)
} else {
  console.log("❌ aucun cache prof")
  foldersLoaded.value = false
  uploadsLoaded.value = false
}

// -------------------------------------------------
// 1️⃣ ensureProfRoot
// -------------------------------------------------
console.log("🧱 ensureProfRoot…")

if (hasCache) {
  // cache → background
  ensureProfRoot().then(rootId => {
    console.log("📁 profRootId =", rootId)
  })
} else {
  // ❗ PAS DE CACHE → BLOQUANT
  loaderStep.value = "prof-root"

  const rootId = await ensureProfRoot()
  console.log("📁 profRootId =", rootId)
  console.log("📁 currentFolderId =", currentFolderId.value)
}

// -------------------------------------------------
// 2️⃣ fetchFolders
// -------------------------------------------------
console.log("📦 fetchFolders…")

if (hasCache) {
  // revalidation silencieuse
  fetchFolders(true)
} else {
  // ❗ root garanti → fetch réel
  loaderStep.value = "folders"

  await fetchFolders(true)
}

// -------------------------------------------------
// 3️⃣ uploads (toujours non bloquant)
// -------------------------------------------------
console.log("📄 fetchUploads (bg)…")
loaderStep.value = "uploads"

fetchUploads()

// -------------------------------------------------
// 4️⃣ autres données non critiques
// -------------------------------------------------
loadProfEleves().then(() =>
  console.log("👥 élèves chargés =", Object.keys(elevesMap.value).length)
)

console.log("✅ PROF READY")
console.groupEnd()



  // 3️⃣ folders (SEULEMENT APRÈS ROOT)
  console.log("📦 fetchFolders…")
  await fetchFolders(true)

  console.log(
    "📁 folders chargés =",
    folders.value.length,
    "| visibles =",
    visibleFolders.value.length
  )

  // 4️⃣ uploads (background)
  console.log("📄 fetchUploads (bg)")
  fetchUploads()

  creatingWorkspace.value = false
  mountedDone.value = true

  console.log("✅ PROF READY")
  console.log("🧪 elevesMap =", elevesMap.value)

  console.groupEnd()
})


















  

onUnmounted(() => {
  window.removeEventListener("keydown", onKeyDown)
    window.removeEventListener("contextmenu", blockNativeContextMenu)

})

</script>

<style lang="css" scoped>

/* ==========================================================================
   🌑 THÈME GLOBAL
   ========================================================================== */
.dark-theme {
  background: #121212;
  color: #fff;
  min-height: 100vh;
}

/* ==========================================================================
   📄 PAGE & HEADER
   ========================================================================== */
.uploads-page {
  padding: 40px;
}

@media (max-width: 768px) {
  .uploads-page {
    padding: 10px;
  }
}

.uploads-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.subtitle {
  font-size: 0.85rem;
  color: #aaa;
}

/* ==========================================================================
   📦 ZONE EXPLORER
   ========================================================================== */
.explorer-zone {
  min-height: calc(100vh - 260px);
  width: 100%;
  padding: 12px;
  position: relative;
}

/* ⚠️ DND SAFE : jamais bloquer pointer-events */
.explorer-zone.disabled {
  opacity: 0.85;
}

.explorer-zone.dragging {
  outline: 2px dashed #ff8c00;
  background: rgba(255, 140, 0, 0.05);
}

/* ==========================================================================
   📄 ITEM COMMUN (FICHIER / DOSSIER)
   ========================================================================== */
.upload-item {
  background: linear-gradient(180deg, #1f1f1f, #191919);
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  transition: background 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
}

/* hover */
.upload-item:hover {
  border-color: #ff8c00;
  background: rgba(255, 140, 0, 0.08);
}

/* sélection */
.upload-item.selected {
  border-color: #ff8c00;
  background: rgba(255, 140, 0, 0.18);
  box-shadow: 0 0 0 2px rgba(255, 140, 0, 0.25) inset;
}

/* draggable cursor */
.upload-item[draggable="true"],
.folder-main[draggable="true"] {
  cursor: grab;
}

.folder-main[draggable="true"]:active,
.upload-item[draggable="true"]:active {
  cursor: grabbing;
  opacity: 0.6;
}

/* optimistic */
.upload-item.optimistic {
  opacity: 0.6;
  pointer-events: none;
}

/* cut */
.upload-item.cut {
  opacity: 0.45;
}

/* ==========================================================================
   📁 DOSSIER
   ========================================================================== */
.upload-item.folder {
  background: linear-gradient(180deg, #222, #1b1b1b);
  border: 1px dashed #444;
  font-weight: 600;
  color: #ffb347;
}

.upload-item.folder.active {
  border-color: #ff8c00;
  background: rgba(255, 140, 0, 0.18);
}

/* contenu dossier */
.folder-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.folder-icon {
  font-size: 1.4rem;
  flex-shrink: 0;
}

/* ==========================================================================
   📄 FICHIER
   ========================================================================== */
.file-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.file-icon {
  font-size: 1.4rem;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.file-date {
  font-size: 0.75rem;
  color: #888;
}

/* ==========================================================================
   ✏️ RENAME INPUT
   ========================================================================== */
.rename-input {
  background: #121212;
  border: 1px solid #ffaa00;
  border-radius: 4px;
  padding: 2px 6px;
  color: #fff;
  font-size: 0.9rem;
  width: 70%;
  height: 28px;
  line-height: 28px;
}

/* ==========================================================================
   📋 CONTEXT MENU
   ========================================================================== */
.context-menu {
  position: fixed;
  z-index: 9999;
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 4px 0;
  min-width: 160px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  color: #f1f1f1;
}

.context-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.85rem;
}

.context-item:hover {
  background: rgba(255, 140, 0, 0.15);
}

.context-item.danger {
  color: #ff6b6b;
}

.context-item.danger:hover {
  background: rgba(255, 80, 80, 0.15);
}

/* ⚠️ backdrop n’intercepte pas le drag */
.context-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9998;
}

/* ==========================================================================
   🫥 EMPTY STATE
   ========================================================================== */
.empty-state {
  margin-top: 24px;
  text-align: center;
  font-size: 0.9rem;
  color: #777;
  animation: emptyFadeIn 0.15s ease forwards;
}

@keyframes emptyFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ==========================================================================
   🎞️ TRANSITIONS
   ========================================================================== */
.fade-slide-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-slide-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-2px);
}

/* ==========================================================================
   🧭 BREADCRUMB
   ========================================================================== */
.finder-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #1a1a1a;
  border-radius: 8px;
  border: 1px solid #2a2a2a;
  margin-bottom: 14px;
}

.finder-breadcrumb .crumb {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background: linear-gradient(180deg, #2a2a2a, #222);
  border-radius: 999px;
  font-size: 0.8rem;
  color: #e0e0e0;
  cursor: pointer;
  border: 1px solid #333;
}

.finder-breadcrumb .crumb:last-child {
  background: linear-gradient(180deg, #ff9f2d, #ff8c00);
  color: #000;
  font-weight: 700;
  border-color: #ff8c00;
}

/* ==========================================================================
   ⏳ LOADER
   ========================================================================== */
.loader-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 4px solid rgba(255, 140, 0, 0.25);
  border-top-color: #ff8c00;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.workspace-text {
  text-align: center;
  line-height: 1.4;
}

/* ==========================================================================
   ➕ BOUTON AJOUTER
   ========================================================================== */
.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px;
  background: linear-gradient(180deg, #ff9f2d, #ff8c00);
  color: #000;
  font-weight: 700;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(255,140,0,0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.add-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(255,140,0,0.45);
}

.add-btn.active {
  box-shadow: 0 0 0 3px rgba(255,140,0,0.35);
}

.loader-overlay {
  position: absolute;
  inset: 0;
  background: rgba(12, 12, 16, 0.85);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.workflow-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  animation: fadeIn 0.25s ease;
}

.workflow-loader strong {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.workflow-loader .sub {
  font-size: 13px;
  opacity: 0.55;
}

/* 🔵 animation workflow */
.dots {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}

.dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6c7cff;
  animation: dotPulse 1.4s infinite ease-in-out;
  opacity: 0.6;
}

.dots span:nth-child(2) {
  animation-delay: .15s;
}

.dots span:nth-child(3) {
  animation-delay: .3s;
}

@keyframes dotPulse {
  0%, 80%, 100% {
    transform: scale(0.7);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from { opacity: 0 }
  to { opacity: 1 }
}

</style>


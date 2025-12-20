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
          v-for="(f, i) in breadcrumb"
          :key="f.folder_id"
          class="crumb"
          @click="i < breadcrumb.length - 1 && (currentFolderId = f.folder_id)"
          @dragover.prevent
@drop.prevent="handleDropOnFolder($event, f.folder_id)"
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
@contextmenu.prevent="openExplorerContextMenu($event)"
        @dragover.prevent
@drop.prevent="handleDropOnFolder($event, currentFolderId)"
      >

      <div
  v-if="eleveBlocked"
  class="eleve-blocked"
>
  <h3>📁 Espace en préparation</h3>
  <p>
    Ton professeur n’a pas encore activé l’espace de partage.
    <br />
    Les documents apparaîtront ici dès que ce sera fait.
  </p>
</div>

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
  selected: selectedFolders.includes(folder.folder_id),
  pending: folder.pending
}"
              @dragover.prevent
@drop.prevent="handleDropOnFolder($event, folder.folder_id)"
             @click.stop="selectFolder(folder, $event)"
  @dblclick.stop="openFolder(folder)"
  @contextmenu.prevent.stop="openFolderMenu($event, folder)"
 @touchstart.passive="startFolderLongPress(folder, $event)"
  @touchend.passive="cancelLongPress"
            >
              <div
                class="folder-main"
                draggable="true"
                @dragstart="onFolderDragStart($event, folder)"
                @dragend="onDragEnd"
              >
<i class="bi bi-collection folder-icon"></i>


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
        @click.stop="onFileSingleClick(file, $event)"
@dblclick.stop="onFileDoubleClick(file)"

              @contextmenu.prevent="openFileMenu($event, file)"
 @touchstart.passive="startFileLongPress(file, $event)"
@touchend.passive="cancelLongPress"

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
<template v-else-if="contextMenu.type === 'explorer'">

  <div
    v-if="clipboard.uploads.length || clipboard.folders.length"
    class="context-item"
    @click="pasteFromContext"
  >
    📥 Coller
  </div>

  <div class="context-item" @click="createFolder">
    📁 Nouveau dossier
  </div>

</template>

<template v-else-if="contextMenu.type === 'folder'">

  <div class="context-item" @click="startRenameFolder(contextMenu.target)">
    ✏️ Renommer
  </div>

  <div class="context-item" @click="copyFolderFromContext">
    📋 Copier
  </div>

  <div class="context-item" @click="cutFolderFromContext">
    ✂️ Couper
  </div>

  <div
    v-if="clipboard.uploads.length || clipboard.folders.length"
    class="context-item"
    @click="pasteFromContext"
  >
    📥 Coller
  </div>

  <div class="context-item danger" @click="deleteFolderAction(contextMenu.target)">
    🗑️ Supprimer
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
const isSendMode = computed(() => route.query.mode === "send")
const uploadsByFolder = ref({})
// ⚠️ COMPAT TEMPORAIRE — legacy code
const uploads = computed(() => {
  if (!currentFolderId.value) return []
  return uploadsByFolder.value[currentFolderId.value] || []
})
const isTyping = computed(() =>
  document.activeElement &&
  ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
)

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
let uploadsGlobalFetched = false
const eleveBlocked = ref(false)
const ensureUploadsBucket = (folderId) => {
  const fid = folderId ?? null
  if (!uploadsByFolder.value[fid]) {
    uploadsByFolder.value[fid] = []
  }
}
const onFolderClick = (folder, e) => {
  // 📱 vrai tactile → ouvrir
  if (e?.pointerType === "touch") {
    openFolder(folder)
    return
  }

  // 🖥️ desktop → sélection
  selectFolder(folder, e)
}
const startFolderLongPress = (folder, e) => {
  longPressTimer = setTimeout(() => {
    selectedFolders.value = [folder.folder_id]
    openFolderMenu(e, folder)
  }, 500)
}
const getEventPosition = (e) => {
  // iOS / touch
  if (e.touches && e.touches[0]) {
    return {
      x: e.touches[0].pageX,
      y: e.touches[0].pageY
    }
  }

  // Desktop
  return {
    x: e.pageX,
    y: e.pageY
  }
}

const CACHE_VERSION = "v1"
const t0 = performance.now()
const profRootId = ref(null)
const suppressTransitions = ref(false)
const mountedDone = ref(false)

const isTouch = () =>
  "ontouchstart" in window || navigator.maxTouchPoints > 0

let clickTimer = null

const onFileSingleClick = (file, e) => {
  // 📱 MOBILE → ouvrir direct
  if (isTouch()) {
    openFile(file)
    return
  }

  // 🖥️ DESKTOP → sélection
  if (clickTimer) return

  clickTimer = setTimeout(() => {
    toggleSelect(file, e)
    clickTimer = null
  }, 180)
}

const onFileDoubleClick = (file) => {
  // 📱 mobile → jamais appelé
  if (isTouch()) return

  clearTimeout(clickTimer)
  clickTimer = null

  if (selectedFiles.value.length > 1) return
  openFile(file)
}
let longPressTimer = null

const startLongPress = (file, e) => {
  longPressTimer = setTimeout(() => {
    selectedFiles.value = [file.upload_id]
    openFileMenu(e, file)
  }, 500)
}

const cancelLongPress = () => {
  clearTimeout(longPressTimer)
  longPressTimer = null
}


  // delay pour laisser une chance au double-clic
  clearTimeout(clickTimer)
  clickTimer = setTimeout(() => {
    toggleSelect(file, e)
  }, 180)



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
  POST: "AKfycby4UajTQdcM7GJpsCsD4zVbvWd-9iUOtVK0e2bc7T8pSNMxJbJlQSlfzD7WCJb5QITYYw/exec"
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
const eleveRootId = computed(() =>
  folders.value.find(f =>
    f.owner_type === "eleve" &&
    f.owner_id === userId.value &&
    f.name === "Racine élève"
  )?.folder_id || null
)

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
    const raw = localStorage.getItem(
      getFoldersCacheKey(ownerType, ownerId)
    )
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

const writeFoldersCache = (ownerType, ownerId, folders) => {
  if (!Array.isArray(folders)) return
  localStorage.setItem(
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


const getUploadsCacheKey = (ownerType, ownerId) =>
  `uploads_${profId.value}_${ownerType}_${ownerId}_${CACHE_VERSION}`




const writeUploadsCache = (ownerType, ownerId, uploads) => {
  if (!Array.isArray(uploads)) return
  localStorage.setItem(
    getUploadsCacheKey(ownerType, ownerId),
    JSON.stringify(uploads)
  )
}



const invalidateCaches = (ownerType, ownerId) => {
  localStorage.removeItem(getUploadsCacheKey(ownerType, ownerId))
  localStorage.removeItem(getFoldersCacheKey(ownerType, ownerId))
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
  foldersLoaded.value
)





const currentEleveId = ref(null)


const isElevesView = computed(() => {
  if (!isProfLike.value) return false
  if (!profElevesFolderId.value) return false
  return currentFolderId.value === profElevesFolderId.value
})





// ============================================================================
// 🧠 STATE (toujours déclaré AVANT les computed)
// ============================================================================



const draggedFiles = ref([])
// drag&drop==================

         // liste brute des fichiers (API)

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

const effectiveEleveIdForUploads = computed(() => {
  if (!isProfLike.value) return userId.value

  if (currentEleveId.value) return currentEleveId.value

  const folder = folders.value.find(
    f => f.folder_id === currentFolderId.value
  )

  if (folder?.owner_type === "eleve") {
    return folder.owner_id
  }

  return null
})


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
  visibleFolders.value.length === 0 &&
  visibleFiles.value.length === 0
)



const showLoader = computed(() => {
  if (eleveBlocked.value) return false
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
  const chain = []
  let cur = currentFolderId.value
  let guard = 0

  while (cur && guard++ < 20) {
    const f = foldersById.value[cur]
    if (!f) break

    // ⛔ stop visuel à la racine élève
    if (!isProfLike.value && f.folder_id === eleveRootId.value) {
      chain.unshift(f)
      break
    }

    chain.unshift(f)
    cur = f.parent_id
  }

  return chain
})






// Dossiers visibles au niveau courant (déduits des folder_path)


const visibleFolders = computed(() =>
  foldersByParentCache.value[currentFolderId.value ?? null] || []
)






const clearSelection = () => {
  selectedFiles.value = []
  selectedFolders.value = []
}


// Fichiers du dossier courant uniquement
const visibleFiles = computed(() => {
  if (!currentFolderId.value) return []
  return uploadsByFolder.value[currentFolderId.value] || []
})





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
  if (isTyping.value) return

   const now = performance.now()
  if (now - lastKey < 30) return
  lastKey = now
if (e.key === "Escape") {
  closeContextMenu()
  cancelRename()
  cancelRenameFolder()
  clearSelection()
}

if (e.key === "Delete") {
  if (selectedFiles.value.length) deleteSelectedUploads()
  else if (selectedFolders.value.length) deleteSelectedFolders()
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
  if (isTyping.value) return
  e.preventDefault()

  selectedFolders.value = visibleFolders.value.map(f => f.folder_id)
  selectedFiles.value = visibleFiles.value.map(f => f.upload_id)
}




  // UNDO
// UNDO
if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
  e.preventDefault()

  const last = undoStack.value.pop()
  if (!last) return

uploadsByFolder.value = {}

last.uploads.forEach(u => {
  const fid = u.folder_id ?? null
  if (!uploadsByFolder.value[fid]) uploadsByFolder.value[fid] = []
  uploadsByFolder.value[fid].push(u)
})

  folders.value = last.folders
  currentFolderId.value = last.currentFolderId

  selectedFiles.value = []
  selectedFolders.value = []

  closeContextMenu()
}



}
// FUNCTIONS
const startFileLongPress = (file, e) => {
  longPressTimer = setTimeout(() => {
    selectedFiles.value = [file.upload_id]
    openFileMenu(e, file)
  }, 500)
}

const openExplorerContextMenu = (e) => {
  e.preventDefault()
  e.stopPropagation()

  const { x, y } = getEventPosition(e)

  contextMenu.value = {
    visible: true,
    x,
    y: y + 8, // petit offset doigt
    type: "explorer",
    target: null
  }
}


const copyFolderFromContext = () => {
  const folder = contextMenu.value.target

  console.log("📋 COPY FOLDER", {
    folder,
    folder_id: folder?.folder_id,
    is_system: folder?.is_system
  })

  if (!folder || folder.is_system) {
    console.warn("⛔ copy bloqué", folder)
    return
  }

  clipboard.value = {
    mode: "copy",
    uploads: [],
    folders: [folder.folder_id]
  }

  console.log("📎 clipboard set =", clipboard.value)

  selectedFolders.value = [folder.folder_id]
  closeContextMenu()
}



const cutFolderFromContext = () => {
  const folder = contextMenu.value.target
  if (!folder || folder.is_system) return

  clipboard.value = {
    mode: "cut",
    uploads: [],
    folders: [folder.folder_id]
  }

  selectedFolders.value = [folder.folder_id]
  closeContextMenu()
}

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
const selectFolder = (folder, e) => {
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
}


const openFolder = (folder) => {
  currentFolderId.value = folder.folder_id

  // prof → set eleve si besoin
  if (isProfLike.value && folder.owner_type === "eleve") {
    currentEleveId.value = folder.owner_id
  }
}


const onUploadSuccess = (upload) => {
  const fid = upload.folder_id ?? currentFolderId.value ?? null
  const current = uploadsByFolder.value[fid] || []

  if (current.some(u => u.upload_id === upload.upload_id)) return

  uploadsByFolder.value = {
    ...uploadsByFolder.value,
    [fid]: [upload, ...current]
  }

  selectedFiles.value = [upload.upload_id]

  explorerKey.value++ // 🔥 FORCE RERENDER VISUEL

  writeUploadsCache(
    effectiveOwnerType.value,
    effectiveOwnerId.value,
    Object.values(uploadsByFolder.value).flat()
  )
}










const deleteSelectedFolders = async () => {
  const ids = [...selectedFolders.value]
  if (!ids.length) return

  if (!confirm(`Supprimer ${ids.length} dossier(s) et leur contenu ?`)) return
closeContextMenu() // ✅ ICI
  pushUndo()

  const foldersSnapshot = [...folders.value]
  const prevFolder = currentFolderId.value



  // ⚡ UI instant
  folders.value = folders.value.filter(
    f => !ids.includes(f.folder_id)
  )

ids.forEach(fid => {
  delete uploadsByFolder.value[fid]
})


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
writeUploadsCache(
  effectiveOwnerType.value,
  effectiveOwnerId.value,
  Object.values(uploadsByFolder.value).flat()
)
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
const getDisplayFolderName = (folder) => {
  // 👨‍🏫 PROF → racine élève = prénom backend
  if (
    isProfLike.value &&
    folder.owner_type === "eleve" &&
    folder.name === "Racine élève"
  ) {
return folder.owner_name || "Élève"

  }

  // 👨‍🎓 ÉLÈVE → sa propre racine
  if (
    !isProfLike.value &&
    folder.owner_type === "eleve" &&
    folder.name === "Racine élève"
  ) {
    return "🏠 Home"
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

   console.log("🌍 ensureEleveRoot URL =", url)

const payload = {
  route: "get_or_create_eleve_root",
  jwt: auth.jwt,
  prof_id: profId.value,
  eleve_id: userId.value
}

console.log("📤 ensureEleveRoot payload =", payload)

const res = await axios.post(url, payload)

console.log("📥 ensureEleveRoot raw response =", res)
console.log("📥 ensureEleveRoot data =", res.data)

const data = res.data

const rootId =
  data?.root_folder_id ??
  data?.folder_id ??
  data?.eleve_root_id ??
  null

if (!data?.success) {
  throw new Error("eleve root failed: success=false")
}

if (!rootId) {
  throw new Error("eleve root failed: rootId missing")
}


    currentFolderId.value = rootId
    console.log("📁 root élève =", rootId)

    return rootId

  } catch (e) {
      eleveBlocked.value = true

    console.error("❌ ensureEleveRoot", e)
      console.warn("⛔ élève bloqué : espace prof non créé")

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
  const from = f.folder_id ?? null
  const to = target ?? null

  uploadsByFolder.value[from] =
    uploadsByFolder.value[from].filter(u => u.upload_id !== f.upload_id)

  if (!uploadsByFolder.value[to]) uploadsByFolder.value[to] = []
  uploadsByFolder.value[to].push({ ...f, folder_id: to })
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
  Object.values(uploadsByFolder.value).flat()
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
  console.log("📥 pasteFromContext", {
    uploads: clipboard.value.uploads,
    folders: clipboard.value.folders,
    type: contextMenu.value.type
  })

  if (!clipboard.value.uploads.length && !clipboard.value.folders.length) {
    console.warn("⛔ rien à coller")
    return
  }

  const target =
    contextMenu.value.type === "folder"
      ? contextMenu.value.target.folder_id
      : currentFolderId.value

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
// ============================================================================
// 📡 FETCH UPLOADS — SAFE / NO FLASH / DEBUG
// ============================================================================

// ============================================================================
// 📦 FETCH ALL UPLOADS — SOURCE UNIQUE
// ============================================================================

const fetchAllUploadsOnce = async () => {
  if (!auth.jwt || !profId.value) return

  console.log("🌐 FETCH ALL UPLOADS (GLOBAL)")

  const payload = {
    route: "getalluploadsbyprof",
    jwt: auth.jwt,
    prof_id: profId.value,
    ...(isProfLike.value ? {} : { eleve_id: userId.value })
  }

  try {
    const { data } = await axios.post(
      getProxyPostURL(routes.POST),
      payload
    )

    const uploads = Array.isArray(data?.uploads) ? data.uploads : []

    const nextMap = Object.create(null)

    for (const u of uploads) {
      const fid = u.folder_id ?? null
      if (!nextMap[fid]) nextMap[fid] = []
      nextMap[fid].push(u)
    }

    // 🔄 reconcile (ne pas écraser l’optimistic en cours)
    uploadsByFolder.value = {
      ...uploadsByFolder.value,
      ...nextMap
    }

    writeUploadsCache(
      effectiveOwnerType.value,
      effectiveOwnerId.value,
      uploads
    )

    console.log("📦 uploads globaux reçus =", uploads.length)
    console.log("📦 dossiers avec fichiers =", Object.keys(nextMap))

  } catch (e) {
    console.error("❌ fetchAllUploadsGlobal", e)
  }
}








const uploadsScope = computed(() => {
  if (!currentFolderId.value) return null

  const folder = folders.value.find(
    f => f.folder_id === currentFolderId.value
  )

  if (!folder) return null

  if (folder.owner_type === "prof") {
    return { type: "prof", id: profId.value }
  }

 if (folder.owner_type === "eleve") {
  return { type: "eleve", id: folder.owner_id }
}

if (folder.owner_type === "prof") {
  return { type: "prof", id: profId.value }
}


  return null
})

const effectiveOwnerType = computed(() =>
  isProfLike.value ? "prof" : "eleve"
)

const effectiveOwnerId = computed(() =>
  isProfLike.value ? profId.value : userId.value
)

// recup dossier
async function fetchFolders() {
  console.log("📁 FETCH FOLDERS — start")

  try {
    // -------------------------------
    // STEP 0 — state
    // -------------------------------
    console.log("▶️ step 0 — state", {
      jwt: !!auth.jwt,
      profId: auth.user?.prof_id,
      role: auth.role
    })

    if (!auth.jwt || !auth.user?.prof_id) {
      console.warn("⛔ fetchFolders aborted — missing auth")
      return
    }

    // -------------------------------
    // STEP 1 — payload
    // -------------------------------
    const payload = {
      route: "getfoldersbyprof",
      jwt: auth.jwt,
      prof_id: auth.user.prof_id
    }

    console.log("▶️ step 1 — payload", payload)

    // -------------------------------
    // STEP 2 — API call
    // -------------------------------
    const url = getProxyPostURL(routes.POST)
    console.log("▶️ step 2 — API call", url)

    const res = await axios.post(url, payload)

    // -------------------------------
    // STEP 3 — raw response
    // -------------------------------
    console.log("▶️ step 3 — raw response", res.data)

    if (!res.data?.success) {
      console.error("❌ fetchFolders failed", res.data)
      folders.value = []
      return
    }

    // -------------------------------
    // STEP 4 — normalize
    // -------------------------------
  const normalized = (res.data.folders || []).map(f => ({
  ...f,
  parent_id: f.parent_id || null,
  owner_name: f.owner_name || null, // 👈 IMPORTANT
    is_system: Boolean(f.is_system) // 🔥 CRITIQUE

}))


    console.log("▶️ step 4 — normalized folders", {
      count: normalized.length,
      folders: normalized.map(f => `${f.owner_type}:${f.name}`)
    })

    // -------------------------------
    // STEP 5 — hydrate state
    // -------------------------------
folders.value = normalized
foldersLoaded.value = true

// ✅ WRITE CACHE
writeFoldersCache(
  effectiveOwnerType.value,
  effectiveOwnerId.value,
  folders.value
)


    console.log("▶️ step 5 — folders hydrated", {
      foldersLoaded: foldersLoaded.value,
      total: folders.value.length
    })

  } catch (err) {
    console.error("💥 fetchFolders exception", err)
    folders.value = []
  }

  console.log("📁 FETCH FOLDERS — done")
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
target: { folder_id: currentFolderId.value }

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
  const folderId = file.folder_id ?? null
  if (!folderId) return

  // ======================
  // ⚡ UI INSTANT (optimistic)
  // ======================
  const snapshot = [...(uploadsByFolder.value[folderId] || [])]

  uploadsByFolder.value[folderId] =
    snapshot.filter(u => u.upload_id !== file.upload_id)

  try {
    await axios.post(getProxyPostURL(routes.POST), {
      route: "softdeleteupload",
      jwt: auth.jwt,
      prof_id: profId.value,
      upload_id: file.upload_id
    })

    console.log("🗑️ upload supprimé =", file.upload_id)

  } catch (e) {
    // ======================
    // 🔁 ROLLBACK
    // ======================
    uploadsByFolder.value[folderId] = snapshot
    alert("Erreur suppression fichier")
  }
}


const deleteSelectedUploads = async () => {
  const ids = [...selectedFiles.value]
  if (!ids.length) return

  if (!confirm(`Supprimer ${ids.length} fichier(s) ?`)) return

  pushUndo()

const snapshots = {}

ids.forEach(id => {
  const file = uploads.value.find(u => u.upload_id === id)
  if (!file) return

  const fid = file.folder_id ?? null
  if (!snapshots[fid]) {
    snapshots[fid] = [...(uploadsByFolder.value[fid] || [])]
  }

  uploadsByFolder.value[fid] =
    uploadsByFolder.value[fid].filter(u => u.upload_id !== id)
})

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
writeUploadsCache(
  effectiveOwnerType.value,
  effectiveOwnerId.value,
  Object.values(uploadsByFolder.value).flat()
)

  } catch (e) {
    // 🔁 rollback
  Object.entries(snapshots).forEach(([fid, list]) => {
  uploadsByFolder.value[fid] = list
})

writeUploadsCache(
  effectiveOwnerType.value,
  effectiveOwnerId.value,
  Object.values(uploadsByFolder.value).flat()
)

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
  


delete uploadsByFolder.value[folder.folder_id]


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
writeUploadsCache(
  effectiveOwnerType.value,
  effectiveOwnerId.value,
  Object.values(uploadsByFolder.value).flat()
)
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
uploadsByFolder.value = {}

uploadsSnapshot.forEach(u => {
  const fid = u.folder_id ?? null
  if (!uploadsByFolder.value[fid]) uploadsByFolder.value[fid] = []
  uploadsByFolder.value[fid].push(u)
})
    currentFolderId.value = previousFolderId

    alert("Erreur suppression dossier")
  }
}


// ============================================================================
// ✏️ Rename inline (Enter / Blur = save, Esc = cancel)
// ============================================================================




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
const fid = file.folder_id ?? null
const list = uploadsByFolder.value[fid]
if (!list) return

const idx = list.findIndex(u => u.upload_id === file.upload_id)
if (idx === -1) return

const oldName = list[idx].file_name
list[idx].file_name = newName

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
writeUploadsCache(
  effectiveOwnerType.value,
  effectiveOwnerId.value,
  Object.values(uploadsByFolder.value).flat()
)

    if (!res.data?.success) throw new Error()

  } catch (e) {
    // 🔁 rollback
   list[idx].file_name = oldName

    alert("Erreur renommage fichier")
  }
}


const openFolderMenu = (e, folder) => {
  e.preventDefault()
  e.stopPropagation()

  closeAddMenu()
  closeContextMenu()

  const { x, y } = getEventPosition(e)

  contextMenu.value = {
    visible: true,
    x,
    y: y + 8,
    type: "folder",
    target: folder
  }
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
  e.preventDefault()
  e.stopPropagation()

  closeAddMenu()
  closeContextMenu()

  if (!selectedFiles.value.includes(file.upload_id)) {
    selectedFiles.value = [file.upload_id]
  }

  const { x, y } = getEventPosition(e)

  contextMenu.value = {
    visible: true,
    x,
    y: y + 8,
    type: "file",
    target: file
  }
}





// action dossier 

const isDragging = ref(false)


const toggleSelect = (file, e) => {
  if (!e.ctrlKey && !e.metaKey) {
    selectedFolders.value = []
  }

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

draggedFiles.value = uploads.value
  .filter(u => selectedFiles.value.includes(u.upload_id))
  .map(u => ({ ...u }))

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



const handleDropOnFolder = (event, folderId) => {
  if (event.__sbsHandled) return
  event.__sbsHandled = true  
  event.preventDefault()
  event.stopPropagation()
  console.group("📥 DROP")
  console.log("targetFolderId =", folderId)
  console.log("draggedFiles =", draggedFiles.value.map(f => f.upload_id))
  console.log("draggedFolder =", draggedFolder.value?.folder_id)
  console.log("isDragging =", isDragging.value)

// 🧲 DROP FICHIERS NATIFS (OS)
if (event?.dataTransfer?.files?.length) {
  console.log("📥 DROP FICHIERS NATIFS", event.dataTransfer.files)

  uploadFolderId.value = folderId ?? currentFolderId.value

  // passe les fichiers au composant upload
  nextTick(() => {
    window.dispatchEvent(
      new CustomEvent("sbs-drop-files", {
        detail: {
          files: event.dataTransfer.files,
          folder_id: uploadFolderId.value
        }
      })
    )
  })
  return
}

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
  mode: null,        // copy | cut
  uploads: [],
  folders: []        // folder_id[]
})



const copySelection = () => {
  if (selectedFolders.value.length === 1) {
    clipboard.value = {
      mode: "copy",
      uploads: [],
      folders: [...selectedFolders.value]
    }
    return
  }

  if (selectedFiles.value.length) {
    clipboard.value = {
      mode: "copy",
      uploads: [...selectedFiles.value],
      folders: []
    }
  }
}



const pasteSelection = async (target = null) => {
  const finalTarget = target ?? currentFolderId.value ?? null

  console.group("📥 PASTE SELECTION")
  console.log("target =", target)
  console.log("finalTarget =", finalTarget)
  console.log("clipboard =", JSON.parse(JSON.stringify(clipboard.value)))

  if (!finalTarget) {
    console.warn("⛔ paste aborted : no target")
    console.groupEnd()
    return
  }

  // ======================================================
// 📁 DOSSIER
// ======================================================
if (clipboard.value.folders.length === 1) {
  const sourceId = clipboard.value.folders[0]

  const sourceFolder = folders.value.find(f => f.folder_id === sourceId)
  const tmpId = "TMP_" + Date.now()

  // 🔮 DOSSIER FANTÔME (optimistic UI)
  folders.value.push({
    folder_id: tmpId,
    parent_id: finalTarget,
    name: sourceFolder?.name + " (copie)" || "Copie",
    pending: true
  })

  console.log("📁 paste folder (optimistic)", {
    sourceId,
    finalTarget,
    tmpId
  })

  try {
    console.log("🚀 GAS copyfolderrecursive → start")

    await axios.post(getProxyPostURL(routes.POST), {
      route: "copyfolderrecursive",
      jwt: auth.jwt,
      prof_id: profId.value,
      source_folder_id: sourceId,
      target_parent_id: finalTarget
    })

    console.log("✅ GAS copyfolderrecursive → OK")

    // 🔄 refresh réel
    fetchFolders(true)
    fetchAllUploadsOnce()

  } catch (err) {
    console.error("❌ copyfolderrecursive FAILED", err)

    // ❌ échec → retirer le fantôme
    folders.value = folders.value.filter(f => f.folder_id !== tmpId)

  } finally {
    // 🧹 cleanup
    clipboard.value = { mode: null, uploads: [], folders: [] }
    selectedFolders.value = []
    console.log("🧹 clipboard cleared")
    console.groupEnd()
  }

  return
}
 // =====================================================
  // 📄 FICHIERS — logique existante (inchangée)
  // =====================================================
  if (!clipboard.value.uploads.length) return

  const allUploads = Object.values(uploadsByFolder.value).flat()

  const files = clipboard.value.uploads
    .map(id => allUploads.find(u => u.upload_id === id))
    .filter(Boolean)

  if (!files.length) return

  pushUndo()

  const url = getProxyPostURL(routes.POST)

  // ================= CUT =================
  if (clipboard.value.mode === "cut") {
    files.forEach(f => {
      const from = f.folder_id ?? null
      const to = finalTarget ?? null

      if (!uploadsByFolder.value[from]) uploadsByFolder.value[from] = []
      if (!uploadsByFolder.value[to]) uploadsByFolder.value[to] = []

      uploadsByFolder.value[from] =
        uploadsByFolder.value[from].filter(u => u.upload_id !== f.upload_id)

      uploadsByFolder.value[to].push({ ...f, folder_id: to })
    })

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

      clipboard.value = { mode: null, uploads: [], folders: [] }
      selectedFiles.value = []

      writeUploadsCache(
        effectiveOwnerType.value,
        effectiveOwnerId.value,
        Object.values(uploadsByFolder.value).flat()
      )

    } catch (e) {
      const last = undoStack.value.pop()
      if (last) {
        uploadsByFolder.value = {}
        last.uploads.forEach(u => {
          const fid = u.folder_id ?? null
          if (!uploadsByFolder.value[fid]) uploadsByFolder.value[fid] = []
          uploadsByFolder.value[fid].push(u)
        })
      }

      writeUploadsCache(
        effectiveOwnerType.value,
        effectiveOwnerId.value,
        Object.values(uploadsByFolder.value).flat()
      )

      alert("Erreur déplacement fichiers")
    }

    return
  }

  // ================= COPY =================
  for (const original of files) {
    const siblings = Object.values(uploadsByFolder.value)
      .flat()
      .filter(u => (u.folder_id ?? null) === finalTarget)

    const newName = getAutoRenamed(original.file_name, siblings)

    const tmp = {
      ...original,
      upload_id: `TMP_${crypto.randomUUID()}`,
      original_id: original.upload_id,
      folder_id: finalTarget,
      file_name: newName,
      _optimistic: true
    }

    if (!uploadsByFolder.value[finalTarget]) {
      uploadsByFolder.value[finalTarget] = []
    }

    uploadsByFolder.value[finalTarget].push(tmp)

    try {
      const res = await axios.post(url, {
        route: "copyupload",
        jwt: auth.jwt,
        prof_id: profId.value,
        upload_id: original.upload_id,
        target_folder_id: finalTarget,
        new_name: newName
      })

      if (!res.data?.success) throw new Error()

      Object.assign(tmp, res.data.upload)
      delete tmp._optimistic

    } catch (e) {
      uploadsByFolder.value[finalTarget] =
        uploadsByFolder.value[finalTarget].filter(u => u !== tmp)

      alert("Erreur copie fichier")
    }
  }

  clipboard.value = { mode: null, uploads: [], folders: [] }
  selectedFiles.value = []

  writeUploadsCache(
    effectiveOwnerType.value,
    effectiveOwnerId.value,
    Object.values(uploadsByFolder.value).flat()
  )
}



const isNavigating = ref(false)

const cutSelection = () => {
  if (selectedFolders.value.length === 1) {
    clipboard.value = {
      mode: "cut",
      uploads: [],
      folders: [...selectedFolders.value]
    }
    return
  }

  if (selectedFiles.value.length) {
    clipboard.value = {
      mode: "cut",
      uploads: [...selectedFiles.value],
      folders: []
    }
  }
}






const undoStack = ref([])

const pushUndo = () => {
  undoStack.value.push({
    uploads: JSON.parse(
      JSON.stringify(
        Object.values(uploadsByFolder.value).flat()
      )
    ),
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
// 👀 WATCHERS — MINIMAUX, SANS FETCH, SANS EFFET DE BORD
// ============================================================================

watch(currentFolderId, (id) => {
  if (isProfLike.value) return
  if (!id || !eleveRootId.value) return

  let cur = id
  let guard = 0
  let isInsideEleveRoot = false

  while (cur && guard++ < 20) {
    if (cur === eleveRootId.value) {
      isInsideEleveRoot = true
      break
    }
    cur = foldersById.value[cur]?.parent_id
  }

  if (!isInsideEleveRoot) {
    console.warn("⛔ navigation élève hors scope, reset")
    currentFolderId.value = eleveRootId.value
  }
})

watch(showLoader, v =>
  console.log("⏳ loader =", v, {
    cache: hydratedFromCache.value,
    foldersLoaded: foldersLoaded.value
  })
)

/* ============================================================================
 * 2️⃣ UI — NAVIGATION DOSSIERS (RESET ÉTAT / ANIM)
 * ============================================================================ */
watch(currentFolderId, () => {
  // animation soft
  isNavigating.value = true
  requestAnimationFrame(() => {
    isNavigating.value = false
  })

  // reset sélection / drag
  if (!isDragging.value) {
    draggedFiles.value = []
    draggedFolder.value = null
  }

  closeAddMenu()
  itemEls.value.clear()
})

/* ============================================================================
 * 3️⃣ ROUTE — COURS (URL → STATE)
 * ============================================================================ */
watch(
  () => route.query.cours_id,
  v => {
    selectedCours.value = v || ""
    effectiveCoursId.value =
      v || effectiveCoursId.value || generateCoursId()
  },
  { immediate: true }
)

/* ============================================================================
 * 4️⃣ UI — LOADER (DEBUG ONLY)
 * ============================================================================ */
watch(showLoader, v => {
  console.log("⏳ showLoader =", v, {
    creatingWorkspace: creatingWorkspace.value,
    foldersLoaded: foldersLoaded.value,
    hydratedFromCache: hydratedFromCache.value
  })
})

/* ============================================================================
 * 5️⃣ PERF — LOG ONE SHOT
 * ============================================================================ */
watch(
  () => foldersLoaded.value,
  v => {
    if (!v) return
    console.log(
      "📁 DOSSIERS AFFICHÉS EN",
      (performance.now() - t0).toFixed(1),
      "ms"
    )
  },
  { once: true }
)

/* ============================================================================
 * 6️⃣ DEBUG — LECTURE SEULE (À SUPPRIMER PLUS TARD)
 * ============================================================================ */
watchEffect(() => {
  console.log("🧭 view", {
    isElevesView: isElevesView.value,
    currentFolderId: currentFolderId.value,
    elevesFolderId: profElevesFolderId.value
  })
})

watch(currentEleveId, v =>
  console.log("👤 currentEleveId =", v)
)

watch(currentFolderId, v =>
  console.log("📁 currentFolderId =", v)
)


const blockNativeContextMenu = (e) => {
  if (contextMenu.value.visible || addMenu.value.visible) {
    e.preventDefault()
  }
}
// ============================================================================
// 🚀 LIFECYCLE
// ============================================================================
onMounted(async () => {
  window.addEventListener("keydown", onKeyDown)
window.addEventListener("contextmenu", blockNativeContextMenu)
  console.group("🚀 ELEVEUPLOADS MOUNT")

  // =====================================================
  // 0️⃣ WAIT AUTH READY (iOS SAFE)
  // =====================================================
  if (!auth.authReady) {
    console.log("⏳ wait authReady…")
    await new Promise(resolve => {
      const stop = watch(
        () => auth.authReady,
        v => {
          if (v) {
            stop()
            resolve()
          }
        },
        { immediate: true }
      )
    })
  }

  if (!auth.jwt || !profId.value) {
    console.error("❌ auth non prête", {
      jwt: !!auth.jwt,
      profId: profId.value
    })
    console.groupEnd()
    return
  }

  console.log("🔐 auth OK", {
    role: role.value,
    userId: userId.value,
    profId: profId.value
  })

  // =====================================================
  // 1️⃣ RESET UI
  // =====================================================
  addMenu.value.visible = false
  contextMenu.value.visible = false
  isDragging.value = false
  selectedFiles.value = []
  selectedFolders.value = []

  // =====================================================
  // 👨‍🎓 MODE ÉLÈVE
  // =====================================================
  if (!isProfLike.value) {
console.group("👨‍🎓 MODE ÉLÈVE")

// ⚡ 1️⃣ LECTURE CACHE IMMÉDIATE
const cachedFolders = readFoldersCache("eleve", userId.value)
if (Array.isArray(cachedFolders) && cachedFolders.length) {
  folders.value = cachedFolders.map(f => ({ ...f }))
  foldersLoaded.value = true
  hydratedFromCache.value = true
  mountedDone.value = true

  const root = cachedFolders.find(f =>
    f.owner_type === "eleve" &&
    f.owner_id === userId.value &&
    f.name === "Racine élève"
  )
  currentFolderId.value = root?.folder_id || null

  console.log("⚡ CACHE ÉLÈVE HYDRATÉ", cachedFolders.length)
}


  // --- ensure root (UNE SEULE FOIS)
if (!currentFolderId.value) {
  console.log("🧱 ensureEleveRoot")
  loaderStep.value = "eleve-root"

  const rid = await ensureEleveRoot()
  if (!rid) {
    console.error("❌ ensureEleveRoot failed")
    console.groupEnd()
    console.groupEnd()
    return
  }

  currentFolderId.value = rid
}


    // --- fetch folders (SOURCE DE VÉRITÉ)
    loaderStep.value = "folders"
 if (!hydratedFromCache.value) {
  await fetchFolders(true)
  foldersLoaded.value = true
} else {
  // 🔥 refresh silencieux
  fetchFolders(true)
}


    // --- sécurité root
    if (!currentFolderId.value) {
      const root = folders.value.find(f => f.parent_id === null)
      currentFolderId.value = root?.folder_id || null
    }

    // --- fetch uploads GLOBAL (UNE FOIS)
    loaderStep.value = "uploads"
    console.log("🚀 trigger global uploads fetch (élève)")
    await fetchAllUploadsOnce()

    console.log("📁 folders élève =", folders.value.length)
    console.log("📦 uploadsByFolder =", Object.keys(uploadsByFolder.value).length)

    console.log("✅ ÉLÈVE READY")
    console.groupEnd()
    console.groupEnd()
    return
  }

  // =====================================================
  // 👨‍🏫 MODE PROF
  // =====================================================
  console.group("👨‍🏫 MODE PROF")

  hydratedFromCache.value = false
  creatingWorkspace.value = false

  // -------------------------------------------------
  // 2️⃣ CACHE FOLDERS IMMÉDIAT
  // -------------------------------------------------
  const cachedFolders = readFoldersCache("prof", profId.value)
  const hasCache = Array.isArray(cachedFolders) && cachedFolders.length

  console.log("⚡ cache prof ?", hasCache)

  if (hasCache) {
    folders.value = cachedFolders.map(f => ({ ...f }))
    foldersLoaded.value = true
    hydratedFromCache.value = true

    const root = folders.value.find(f => f.parent_id === null)
    currentFolderId.value = root?.folder_id || null

    console.log("📁 root(cache) =", currentFolderId.value)
  }

  // -------------------------------------------------
  // 3️⃣ ensureProfRoot (TOUJOURS)
  // -------------------------------------------------
  console.log("🧱 ensureProfRoot")
  if (hasCache) {
    ensureProfRoot().then(id =>
      console.log("📁 profRootId (bg) =", id)
    )
  } else {
    loaderStep.value = "prof-root"
    const id = await ensureProfRoot()
    console.log("📁 profRootId =", id)
  }

  // -------------------------------------------------
  // 4️⃣ fetchFolders (SOURCE UNIQUE)
  // -------------------------------------------------
  loaderStep.value = "folders"
  console.log("📦 fetchFolders (prof)")
if (!hydratedFromCache.value) {
  await fetchFolders(true)
  foldersLoaded.value = true
} else {
  // 🔄 refresh silencieux
  fetchFolders(true)
}


  // --- sécurité root
  if (!currentFolderId.value) {
    const root = folders.value.find(f => f.parent_id === null)
    currentFolderId.value = root?.folder_id || null
  }

  // -------------------------------------------------
  // 5️⃣ fetch uploads GLOBAL (🔥 CLÉ)
  // -------------------------------------------------
if (!hydratedFromCache.value) {
  loaderStep.value = "uploads"
  await fetchAllUploadsOnce()
} else {
  fetchAllUploadsOnce()
}


  console.log("📁 folders prof =", folders.value.length)
  console.log("📦 uploadsByFolder =", Object.keys(uploadsByFolder.value).length)
  console.log("📁 currentFolderId =", currentFolderId.value)

  // -------------------------------------------------
  // 6️⃣ AUTRES DATA NON BLOQUANTES
  // -------------------------------------------------


  mountedDone.value = true
  creatingWorkspace.value = false

  console.log("✅ PROF READY")
  console.groupEnd()
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
/* ===============================
   📁 DOSSIER – MODERNE / SAAS
   =============================== */
.folder-icon.modern-folder {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: rgba(255, 159, 45, 0.12);
  border: 1px solid rgba(255, 159, 45, 0.35);
  position: relative;
  flex-shrink: 0;
}

/* accent vertical (signature moderne) */
.folder-icon.modern-folder::after {
  content: "";
  position: absolute;
  left: -3px;
  top: 4px;
  width: 2px;
  height: 12px;
  border-radius: 2px;
  background: #ff9f2d;
}
.upload-item.folder {
  background: #161616;
  border: 1px solid #242424;
  border-radius: 14px;
}

.upload-item.folder:hover {
  border-color: rgba(255,159,45,.5);
}

.upload-item.folder strong {
  font-weight: 500;
  font-size: 0.95rem;
  letter-spacing: .2px;
}
/* ===============================
   📁 DOSSIER – BOOTSTRAP ICON
   =============================== */
.folder-icon {
  font-size: 1.25rem;
  color: #ff9f2d;
  flex-shrink: 0;
  line-height: 1;
}

/* dossier sélectionné */
.upload-item.folder.selected .folder-icon {
  color: #ffb347;
}

/* hover subtil */
.upload-item.folder:hover .folder-icon {
  color: #ffc26a;
}
.eleve-blocked {
  margin: 2rem auto;
  max-width: 480px;
  text-align: center;
  opacity: 0.85;
}
.folder.pending {
  opacity: 0.5;
  pointer-events: none;
  position: relative;
}

.folder.pending::after {
  content: "⏳";
  position: absolute;
  right: 8px;
}
.upload-item {
  -webkit-user-drag: none;
}
.rename-input {
  -webkit-user-select: text;
  user-select: text;
}
.upload-item,
.upload-item * {
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

</style>


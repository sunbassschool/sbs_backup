<template>
  <Layout>
    <div class="uploads-page dark-theme">

      <!-- =================================================================== -->
      <!-- 🧭 HEADER -->
      <!-- =================================================================== -->
      <div class="uploads-header">
        <div>
          <h3>📎 Mes documents</h3>
          <p class="subtitle">Fichiers liés à tes cours</p>
        </div>

        <button
          class="upload-cta"
          @click="showUpload = true"
        >
          ➕ Ajouter un fichier
        </button>
        <button
  class="upload-cta secondary"
  @click="createFolder"
>
  ➕ Dossier
</button>

      </div>

      <!-- =================================================================== -->
      <!-- 📤 MODALE UPLOAD -->
      <!-- =================================================================== -->
   <UploadModal
  v-if="showUpload"
  :cours-id="effectiveCoursId"
  :folder-id="currentFolderId"
  @close="showUpload = false"
  @uploaded="fetchUploads"
/>


      <!-- =================================================================== -->
      <!-- 🎛️ FILTRES (cours / type uniquement) -->
      <!-- =================================================================== -->
      <div class="uploads-filters">

        <!-- Filtre cours -->
        <select v-model="selectedCours" class="form-select">
          <option value="">Tous les cours</option>
          <option
            v-for="c in coursList"
            :key="c"
            :value="c"
          >
            {{ coursLabelMap[c] || c }}
          </option>
        </select>

        <!-- Filtre type -->
        <select v-model="selectedType" class="form-select">
          <option value="">Tous les types</option>
          <option value="audio">Audio</option>
          <option value="video">Vidéo</option>
          <option value="pdf">PDF</option>
          <option value="image">Image</option>
        </select>

      </div>

 <!-- =================================================================== -->
<!-- 🧱 BREADCRUMB (navigation dossiers) -->
<!-- =================================================================== -->
<div class="breadcrumb finder-breadcrumb">
<span
  class="crumb root"
@click="currentFolderId = null"
  @dragover.prevent
  @drop.prevent="handleDropOnFolder('')"
>
 🏠 Home
</span>

<span
  v-for="f in breadcrumb"
  :key="f.folder_id"
  class="crumb"
  @click="currentFolderId = f.folder_id"
  @dragover.prevent
  @drop.prevent="handleDropOnFolder(f.folder_id)"
>
  {{ f.name }}
</span>


</div>


      <!-- =================================================================== -->
      <!-- ⏳ LOADER -->
      <!-- =================================================================== -->
      <div v-if="loading" class="loading">
        Chargement...
      </div>

      <!-- =================================================================== -->
<!-- 📁 EXPLORATEUR (DOSSIERS + FICHIERS) -->
<!-- =================================================================== -->
<div
  class="explorer-zone"
   @mousedown="onMouseDown"
  @mousemove="onMouseMove"
  @mouseup="onMouseUp"
  :class="{ dragging: isDragging }"
  @click.self="clearSelection"
  @contextmenu.prevent="openEmptyMenu($event)"
  @dragover.prevent
  @drop.prevent="handleDropOnFolder(currentFolderId)"

 
>


        <!-- -------------------- -->
        <!-- 📁 DOSSIERS -->
   <transition-group name="fade-slide" tag="div">
     <!-- -------------------- -->
<div
  v-for="folder in visibleFolders"
  :key="folder.folder_id"
:class="[
  'upload-item',
  'folder',
  {
    active: currentFolderId === folder.folder_id,
    selected: selectedFolders.includes(folder.folder_id),
    empty: uploads.every(u => u.folder_id !== folder.folder_id)
  }
]"

  data-type="folder"
  :data-id="folder.folder_id"
  draggable="true"
  @dragstart="onFolderDragStart(folder)"
  @dragend="onDragEnd"
  @click.stop="toggleSelectFolder(folder, $event)"
  @dblclick.stop="enterFolder(folder)"
  @contextmenu.prevent="openFolderMenu($event, folder)"
>
  <div class="folder-main">
    <span class="folder-icon">📁</span>

    <!-- affichage normal -->
    <strong
      v-if="editingFolderId !== folder.folder_id"
      class="folder-name"
    >
      {{ folder.name }}
    </strong>
    

    <!-- rename inline -->
    <input
      v-else
      v-model="editingFolderName"
      class="rename-input folder-rename"
      @keyup.enter="confirmRenameFolder(folder)"
      @keyup.esc="cancelRenameFolder"
      @blur="confirmRenameFolder(folder)"
      autofocus
    /><small class="folder-count">
  {{ uploads.filter(u => (u.folder_id ?? null) === folder.folder_id).length }} fichiers
</small>

  </div>
</div>
</transition-group>





        <!-- -------------------- -->
        <!-- 📄 FICHIERS -->
        <!-- -------------------- -->
         <transition-group name="fade-slide" tag="div">

<div
  v-for="file in visibleFiles"
  :key="file.upload_id"
  class="upload-item"
    data-type="file"
  :data-id="file.upload_id"
 :class="{
    optimistic: file._optimistic,
    selected: selectedFiles.includes(file.upload_id),
    cut: clipboard.mode === 'cut' &&
         clipboard.uploads.includes(file.upload_id)
         
  }"
  :draggable="editingId !== file.upload_id"
  @dragstart="onDragStart($event, file)"
  @dragend="onDragEnd"

  @click="toggleSelect(file, $event)"
  @contextmenu.prevent="openFileMenu($event, file)"
>



          <div class="file-main">
            <span class="file-icon">📄</span>

            <div class="file-info">

              <!-- Nom fichier / rename inline -->
              <strong
                v-if="editingId !== file.upload_id"
                class="file-name"
              >
                {{ file.file_name }}
                  <span v-if="file._optimistic" class="sync-badge">⏳</span>

              </strong>

              <input
                v-else

                v-model="editingName"
                class="rename-input"
                @keyup.enter="confirmRename(file)"
                @keyup.esc="cancelRename"
                @blur="confirmRename(file)"
                autofocus
              />

              <small class="file-date">
                {{ formatDate(file.created_at) }}
              </small>
            </div>
          </div>

          <!-- Actions fichier -->
          <div class="file-action">
            <a
              :href="file.file_url"
              target="_blank"
              class="open-btn"
            >
              👁️
            </a>

            <button
              class="edit-btn"
              @click="startRename(file)"
            >
              ✏️
            </button>

       

          <button
  class="delete-btn"
@click.stop="deleteAction(contextMenu.target)"
>
  🗑️
</button>

          </div>
        </div></transition-group>

        <!-- -------------------- -->
        <!-- 🫥 ÉTAT VIDE -->
        <!-- -------------------- -->
   <div
  v-if="!loading && visibleFolders.length === 0 && visibleFiles.length === 0"
  class="empty-state"
>
  Aucun fichier dans ce dossier.
</div>


      </div>
    </div>

        <!-- -------------------- -->
     <!-- ================= CONTEXT MENU ================= -->
<div
  v-if="contextMenu.visible"
  class="context-backdrop"
  @click="closeContextMenu"
>
  <div
    class="context-menu"
    :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
    @click.stop
  >

    <!-- ================= FILE ================= -->
<template v-if="contextMenu.type === 'file'">
  <div class="context-item" @click="startRename(contextMenu.target)">
    ✏️ Renommer
  </div>

  <div class="context-item" @click="copyFromContext(contextMenu.target)">
    📋 Copier
  </div>

  <div class="context-item" @click="cutFromContext(contextMenu.target)">
    ✂️ Couper
  </div>

  <div
    class="context-item"
    :class="{ disabled: !clipboard.uploads.length }"
    @click="pasteFromContext"
  >
    📥 Coller
  </div>

<div class="context-item danger"
     @click.stop="deleteAndClose(contextMenu.target)">
  🗑️ Supprimer
</div>

</template>


    <!-- ================= FOLDER ================= -->
 <!-- ================= FOLDER ================= -->
<template v-else-if="contextMenu.type === 'folder'">
  <div class="context-item" @click="startRenameFolder(contextMenu.target)">
    ✏️ Renommer
  </div>

 <div
  class="context-item danger"
  @click="deleteFolderAction(contextMenu.target)"
>
  🗑️ Supprimer le dossier
</div>

</template>


    <!-- ================= EMPTY / ZONE ================= -->
    <template v-else-if="contextMenu.type === 'empty'">
      <div
        class="context-item"
        :class="{ disabled: !selectedFiles.length }"
        @click="copySelection"
      >
        📋 Copier
      </div>

      <div
        class="context-item"
        :class="{ disabled: !selectedFiles.length }"
        @click="cutSelection"
      >
        ✂️ Couper
      </div>

      <div
        class="context-item"
        :class="{ disabled: !clipboard.uploads.length }"
        @click="pasteFromContext"
      >
        📥 Coller
      </div>
    </template>

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
import { ref, computed, onMounted, watch, onUnmounted} from "vue"
import axios from "axios"
import { useAuthStore } from "@/stores/authStore"
import UploadModal from "@/components/UploadModal.vue"
import { useRoute } from "vue-router"

// ============================================================================
// 🔐 AUTH + ROUTE
// ============================================================================
const auth = useAuthStore()
const route = useRoute()

// ============================================================================
// 🔗 ROUTES APPS SCRIPT (ID de déploiement)
// ⚠️ Doit être IDENTIQUE à tes autres vues (Planning.vue etc.)
// ============================================================================
const routes = {
  POST: "AKfycbxJSnApoeZbwmHaTGRrg81veORbN1ubPRnSPIrwAUhuFA3if-i96SCmc13ZeqVVcjWBZQ/exec"
}

// ============================================================================
// 🌍 Helper : Apps Script via proxy Vercel (POST)
// ============================================================================
const getProxyPostURL = (routeId) => {
  const baseURL = `https://script.google.com/macros/s/${routeId}`
  return `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(baseURL)}`
}

// ============================================================================
// 🧰 Utils
// ============================================================================
const log = (...args) => console.log("📎 ELEVE UPLOADS", ...args)

const formatDate = (d) => {
  if (!d) return ""
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit"
  })
}
const currentFolderId = ref(null)



const isBoxSelecting = ref(false)
const boxStart = ref({ x: 0, y: 0 })
const boxEnd = ref({ x: 0, y: 0 })





// ============================================================================
// 🧠 STATE (toujours déclaré AVANT les computed)
// ============================================================================


const draggedFiles = ref([])
// drag&drop==================

const uploads = ref([])            // liste brute des fichiers (API)
const loading = ref(true)          // loader page

// Upload modal
const showUpload = ref(false)
const effectiveCoursId = ref(null) // utilisé par UploadModal
const generateCoursId = () => `GEN_${Date.now()}`

// Filtres existants (cours / type)
const selectedCours = ref(route.query.cours_id || "")
const selectedType = ref("")

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



// ============================================================================
// 🧮 COMPUTED
// ============================================================================

// Map cours_id -> date lisible (pour l'UI)
const coursLabelMap = computed(() => {
  const map = {}
  uploads.value.forEach(u => {
    if (!map[u.cours_id]) map[u.cours_id] = formatDate(u.created_at)
  })
  return map
})

// Liste unique des cours
const coursList = computed(() => {
  return [...new Set(uploads.value.map(u => u.cours_id))]
})

// Breadcrumb : ["Cours", "Cours/Exos", "Cours/Exos/Slap"]
const breadcrumb = computed(() => {
  const chain = []
  let id = currentFolderId.value

  while (id) {
    const f = folders.value.find(x => x.folder_id === id)
    if (!f) break
    chain.unshift(f)
    id = f.parent_id
  }

  return chain
})

// Dossiers visibles au niveau courant (déduits des folder_path)
const visibleFolders = computed(() =>
  folders.value.filter(f => {
    const pid = f.parent_id ?? null
    return (
      (currentFolderId.value === null && (pid === null || pid === "")) ||
      pid === currentFolderId.value
    )
  })
)


const clearSelection = () => {
  selectedFiles.value = []
}

// Fichiers du dossier courant uniquement
const visibleFiles = computed(() =>
  uploads.value.filter(u => (u.folder_id ?? null) === currentFolderId.value)
)


const onKeyDown = (e) => {
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
  const enterFolder = (folder) => {
  currentFolderId.value = folder.folder_id
  selectedFolders.value = []
  selectedFiles.value = []
}


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
          prof_id: auth.user.prof_id,
          folder_id
        })
      )
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

const onDrop = async (targetFolderId) => {
  if (!draggedFiles.value.length) return

  const target = targetFolderId || ""

  // snapshot pour rollback
  const previous = draggedFiles.value.map(f => ({
    file: f,
    folder_id: f.folder_id || ""
  }))

  // ✅ update visuel immédiat
  draggedFiles.value.forEach(f => {
    f.folder_id = target
  })

selectedFiles.value = []
draggedFiles.value = []



  try {
    const url = getProxyPostURL(routes.POST)

    // appels backend en parallèle
    await Promise.all(
      previous.map(p =>
        axios.post(url, {
          route: "moveuploadtofolder",
          jwt: auth.jwt,
          prof_id: auth.user.prof_id,
          upload_id: p.file.upload_id,
          folder_id: target
        })
      )
    )


  } catch (e) {
    console.error("❌ multi move", e)

    // 🔁 rollback
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
const onMouseDown = (e) => {
  // clic vide uniquement
  if (e.target.closest('.upload-item')) return

  isBoxSelecting.value = true
  boxStart.value = { x: e.clientX, y: e.clientY }
  boxEnd.value = { x: e.clientX, y: e.clientY }

  selectedFiles.value = []
  selectedFolders.value = []
}

const onMouseMove = (e) => {
  if (!isBoxSelecting.value) return
  boxEnd.value = { x: e.clientX, y: e.clientY }

  selectItemsInBox()
}

const onMouseUp = () => {
  isBoxSelecting.value = false
}
const selectItemsInBox = () => {
  const box = {
    left: Math.min(boxStart.value.x, boxEnd.value.x),
    right: Math.max(boxStart.value.x, boxEnd.value.x),
    top: Math.min(boxStart.value.y, boxEnd.value.y),
    bottom: Math.max(boxStart.value.y, boxEnd.value.y)
  }

  selectedFiles.value = []
  selectedFolders.value = []

  document.querySelectorAll('.upload-item').forEach(el => {
    const r = el.getBoundingClientRect()
    const hit =
      r.right > box.left &&
      r.left < box.right &&
      r.bottom > box.top &&
      r.top < box.bottom

    if (!hit) return

    const id = el.dataset.id
    const type = el.dataset.type

    if (type === 'file') selectedFiles.value.push(id)
    if (type === 'folder') selectedFolders.value.push(id)
  })
}



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
  log("fetchUploads() called")

  // Sécurité auth
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

    if (!res.data?.success) {
      throw new Error(res.data?.message || "API error")
    }

    uploads.value = res.data.uploads || []
    log(`✅ ${uploads.value.length} upload(s) chargé(s)`)

  } catch (err) {
    console.error("❌ fetchUploads error", err)
  } finally {
    loading.value = false
    selectedType.value = "" // reset léger (optionnel)
  }
}

// recup dossier
const fetchFolders = async () => {
  try {
    const url = getProxyPostURL(routes.POST)

    const res = await axios.post(url, {
      route: "getfolderstree",
      jwt: auth.jwt,
      prof_id: auth.user.prof_id,
      owner_type: "eleve",
      owner_id: auth.user.user_id
    })

    if (!res.data?.success) throw new Error("folders error")

    folders.value = (res.data.folders || [])
      .filter(f => !f.deleted_at) // sécurité soft delete
      .map(f => ({
        folder_id: f.folder_id,
        parent_id: f.parent_id || null,
        name: f.folder_name || f.name || "Sans nom"
      }))

  } catch (e) {
    console.error("❌ fetchFolders", e)
  }
}



//=============================================================================
// Ajouter un dossier

const openEmptyMenu = (e) => {
  e.preventDefault()
  e.stopPropagation()

  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    type: "empty",
    target: null
  }
}


const createFolder = async () => {
  const name = prompt("Nom du dossier")
  if (!name?.trim()) return

  // 🔥 UI INSTANT (temp)
const tempFolder = {
  folder_id: `TMP_${crypto.randomUUID()}`,
  parent_id: currentFolderId.value ?? null, // ✅ JAMAIS ""
  name: name.trim(),
  _optimistic: true
}


  folders.value.push(tempFolder)

  try {
    const url = getProxyPostURL(routes.POST)

const res = await axios.post(url, {
  route: "createfolder",
  jwt: auth.jwt,
  prof_id: auth.user.prof_id,
  owner_type: "eleve",
  owner_id: auth.user.user_id,
  parent_id: tempFolder.parent_id ?? null, // ✅
  name: tempFolder.name
})


    if (!res.data?.success) throw new Error()

    // 🔁 remplace le TMP par le vrai
    folders.value = folders.value.map(f =>
      f.folder_id === tempFolder.folder_id
        ? res.data.folder
        : f
    )

  } catch (e) {
    // rollback
    folders.value = folders.value.filter(f => f !== tempFolder)
    alert("Erreur création dossier")
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
      prof_id: auth.user.prof_id,
      upload_id: file.upload_id
    })

    if (!res.data?.success) throw new Error()
  } catch (e) {
    uploads.value = snapshot
    alert("Erreur suppression fichier")
  }
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
          prof_id: auth.user.prof_id,
          upload_id
        })
      )
    )
  } catch (e) {
    // 🔁 rollback
    uploads.value = snapshot
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
      prof_id: auth.user.prof_id,
      folder_id: folder.folder_id
    })

    if (!res.data?.success) {
      throw new Error("delete folder failed")
    }

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
const startRename = (file) => {
  editingId.value = file.upload_id
  editingName.value = file.file_name
  closeContextMenu()
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
      prof_id: auth.user.prof_id,
      upload_id: file.upload_id,
      new_name: newName
    })

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

  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    type: "folder",
    target: folder
  }
}
const startRenameFolder = (folder) => {
  editingFolderId.value = folder.folder_id
  editingFolderName.value = folder.name
  closeContextMenu()
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
      prof_id: auth.user.prof_id,
      folder_id: folder.folder_id,
      new_name: newName
    })

    if (!res.data?.success) throw new Error()

  } catch (e) {
    // 🔁 rollback
    folder.name = oldName
    alert("Erreur renommage dossier")
  }
}


// Open file menu
const openFileMenu = (e, file) => {
  // ⛔ empêche le click implicite
  e.preventDefault()
  e.stopPropagation()

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
  draggedFolder.value = null
  // ❌ ne PAS vider draggedFiles ici
}




const onFolderDragStart = (folder) => {
  // 🔥 reset total
  draggedFiles.value = []
  selectedFiles.value = []

  isDragging.value = true
  draggedFolder.value = folder
}



const onFolderDrop = async (targetParentId) => {
  if (!draggedFolder.value) return

  const folder = draggedFolder.value
const previousParent = folder.parent_id ?? null
folder.parent_id = targetParentId ?? null


  try {
    const url = getProxyPostURL(routes.POST)

    await axios.post(url, {
      route: "movefolder",
      jwt: auth.jwt,
      prof_id: auth.user.prof_id,
      folder_id: folder.folder_id,
new_parent_id: targetParentId ?? null
    })
  } catch (e) {
    folder.parent_id = previousParent
    alert("Erreur déplacement dossier")
  } finally {
    draggedFolder.value = null
  }
}

const handleDropOnFolder = (folderId) => {
  // 🟢 priorité au fichier
  if (draggedFiles.value.length) {
    onDrop(folderId)
    return
  }

  // 🟠 sinon dossier
  if (draggedFolder.value) {
    onFolderDrop(folderId)
  }
}

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
  let clones = [] // ✅ DÉCLARATION UNIQUE ICI

  // fichiers encore présents
 // fichiers sources dans l’ordre de sélection
const files = clipboard.value.uploads
  .map(id => uploads.value.find(u => u.upload_id === id))
  .filter(Boolean)

// 📋 COPY → duplication visuelle + renommage MULTI
if (clipboard.value.mode === "copy") {
  clones = []

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
}


  if (!files.length) return

  // ⛔ inutile si même dossier
  const allSameFolder = files.every(
    f => (f.folder_id || "") === finalTarget
  )
  if (allSameFolder) return

  // =============================
  // 🔁 UNDO (AVANT toute modif UI)
  // =============================
  pushUndo()

  const url = getProxyPostURL(routes.POST)

  // =============================
  // ⚡ UI INSTANT
  // =============================

  // ✂️ CUT → déplacement visuel
  if (clipboard.value.mode === "cut") {
    files.forEach(f => {
      f.folder_id = finalTarget
    })
  }

  // 📋 COPY → duplication visuelle
// 📋 COPY → duplication visuelle + renommage
if (clipboard.value.mode === "copy") {
  clones = []

  files.forEach(original => {
    const siblings = uploads.value
      .concat(clones)
      .filter(u => (u.folder_id ?? "") === finalTarget)

    const newName = getAutoRenamed(original.file_name, siblings)

    clones.push({
      ...original,
      upload_id: `TMP_${crypto.randomUUID()}`,
      original_id: original.upload_id, // 🔥 IMPORTANT
      folder_id: finalTarget,
      file_name: newName,
      _optimistic: true
    })
  })

  uploads.value.push(...clones)
}



  try {
    // =============================
    // 🌍 BACKEND
    // =============================

    // CUT (one-shot)
    if (clipboard.value.mode === "cut") {
      await Promise.all(
        files.map(f =>
          axios.post(url, {
            route: "moveuploadtofolder",
            jwt: auth.jwt,
            prof_id: auth.user.prof_id,
            upload_id: f.upload_id,
            folder_id: finalTarget
          })
        )
      )

      // vider clipboard APRÈS cut
      clipboard.value.mode = null
      clipboard.value.uploads = []
    }

    // COPY (collage multiple autorisé)
    if (clipboard.value.mode === "copy") {
   await Promise.all(
  clones.map(c =>
    axios.post(url, {
      route: "copyupload",
      jwt: auth.jwt,
      prof_id: auth.user.prof_id,
      upload_id: c.original_id,   // 👈 ID source
      target_folder_id: finalTarget,
      new_name: c.file_name       // 👈 NOM FINAL
    })
  )
)

      // remplace les TMP par les vrais
      await fetchUploads()
    }

    selectedFiles.value = []

  } catch (e) {
    // =============================
    // 🔁 ROLLBACK VIA UNDO
    // =============================
    const last = undoStack.value.pop()
    if (last) {
      uploads.value = last.uploads
      folders.value = last.folders
      currentFolderId.value = last.currentFolderId
    }

    alert("Erreur collage")
  }
}





const cutSelection = () => {
  if (!selectedFiles.value.length) return
clipboard.value = {
  mode: "cut",
  uploads: [...selectedFiles.value]
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
// 👀 WATCHERS (cours_id depuis query -> selectedCours + effectiveCoursId)
// ============================================================================
watch(
  () => route.query.cours_id,
  v => {
    selectedCours.value = v || ""

    // effectiveCoursId alimente UploadModal (pour rattacher le fichier au cours)
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

watch(currentFolderId, () => {
  selectedFiles.value = []
  // ❌ NE PAS vider clipboard ici
})



// ============================================================================
// 🚀 LIFECYCLE
// ============================================================================
onMounted(() => {
  log("component mounted")
  fetchUploads()
  fetchFolders()
  window.addEventListener("keydown", onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener("keydown", onKeyDown)
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
   🎛️ FILTRES
   ========================================================================== */
.uploads-filters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

/* Select custom */
.uploads-page select.form-select {
  background-color: #2a2a2a;
  color: #f1f1f1;
  border: 1px solid #ff8c00;
  border-radius: 6px;
  height: 36px;
  padding: 4px 10px;
  font-size: 0.9rem;
}

.uploads-page select.form-select:focus {
  outline: none;
  box-shadow: none;
  border-color: #ffa733;
  background-color: #2f2f2f;
}

.uploads-page select.form-select option {
  background-color: #2a2a2a;
  color: #f1f1f1;
}



/* ==========================================================================
   📦 ZONE EXPLORER
   ========================================================================== */
.explorer-zone {
  min-height: 60vh;
  width: 100%;
  padding: 12px;
}

.explorer-zone.dragging {
  outline: 2px dashed #ff8c00;
  background: rgba(255, 140, 0, 0.05);
}

/* ==========================================================================
   📄 ITEM (FICHIER / DOSSIER)
   ========================================================================== */
.upload-item {
  background: linear-gradient(180deg, #1f1f1f, #191919);
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  transition: all 0.15s ease;
}

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

/* drag */
.upload-item[draggable="true"] {
  cursor: grab;
}

.upload-item[draggable="true"]:active {
  cursor: grabbing;
  opacity: 0.6;
}

/* cut */
.upload-item.cut {
  opacity: 0.45;
}

/* optimistic */
.upload-item.optimistic {
  opacity: 0.6;
  pointer-events: none;
}

/* ==========================================================================
   📁 DOSSIER
   ========================================================================== */
.folder {
  background: linear-gradient(180deg, #222, #1b1b1b);
  border: 1px dashed #444;
  font-weight: 600;
  color: #ffb347;
}

.folder:hover {
  border-color: #ff8c00;
  background: rgba(255, 140, 0, 0.12);
}

/* ==========================================================================
   📄 CONTENU FICHIER
   ========================================================================== */
.file-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0; /* ellipsis */
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

.file-name {
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-date {
  font-size: 0.75rem;
  color: #888;
}

/* ==========================================================================
   ⚙️ ACTIONS FICHIER
   ========================================================================== */
.file-action {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin-left: 12px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.upload-item:hover .file-action {
  opacity: 1;
}

/* boutons */
.open-btn,
.edit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 0.85rem;
}

.open-btn {
  border: 1px solid #ff8c00;
  color: #ffb347;
  text-decoration: none;
}

.open-btn:hover {
  background: rgba(255, 140, 0, 0.1);
}

.edit-btn {
  background: transparent;
  border: 1px solid #ffaa00;
  color: #ffcc66;
  cursor: pointer;
}

.edit-btn:hover {
  background: rgba(255, 170, 0, 0.15);
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

.context-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9998;
}

/* ==========================================================================
   🫥 EMPTY / SELECTION BOX
   ========================================================================== */
.empty-state {
  margin-top: 24px;
  text-align: center;
  font-size: 0.9rem;
  color: #777;
  opacity: 0;
  animation: emptyFadeIn 0.15s ease forwards;
}

@keyframes emptyFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}


.selection-box {
  position: fixed;
  border: 1px dashed #4da3ff;
  background: rgba(77, 163, 255, 0.15);
  pointer-events: none;
  z-index: 9999;
}

/* ==========================================================================
   🎞️ TRANSITIONS
   ========================================================================== */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.15s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ==========================================================================
   🔄 SYNC / OPTIMISTIC
   ========================================================================== */
.sync-badge {
  margin-left: 6px;
  font-size: 0.8em;
  opacity: 0.7;
}


/* 📁 DOSSIER — layout finder-like */


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

.folder-name {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

/* ✏️ rename full width */
.folder-rename {
  width: 100%;
  max-width: 100%;
}
.upload-item.folder.active {
  border-color: #ff8c00;
  background: rgba(255, 140, 0, 0.18);
}

/* ==========================================================================
   🧭 BREADCRUMB — style Finder
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

/* item */
.finder-breadcrumb .crumb {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(180deg, #2a2a2a, #222);
  border-radius: 999px;
  font-size: 0.8rem;
  color: #e0e0e0;
  cursor: pointer;
  border: 1px solid #333;
  transition: all 0.15s ease;
}


/* chevron entre les niveaux */
.finder-breadcrumb .crumb::after {
  content: "›";
  margin-left: 8px;
  color: #555;
  font-size: 1rem;
}


/* dernier élément (dossier courant) */
.finder-breadcrumb .crumb:last-child {
  background: linear-gradient(180deg, #ff9f2d, #ff8c00);
  color: #000;
  font-weight: 700;
  border-color: #ff8c00;
  box-shadow: 0 2px 8px rgba(255,140,0,0.4);
}


/* pas de chevron sur le dernier */
.finder-breadcrumb .crumb:last-child::after {
  content: "";
}

/* hover */
.finder-breadcrumb .crumb:hover {
  background: #2f2f2f;
  transform: translateY(-1px);
}


/* Racine un peu différente */
.finder-breadcrumb .crumb:first-child {
  background: #1e1e1e;
  color: #aaa;
}

.finder-breadcrumb .crumb.root {
  font-weight: 600;
  color: #bbb;
}
/* Racine — centré visuellement */
.finder-breadcrumb .crumb:first-child {
  padding-right: 12px; /* annule l’espace du chevron */
}

/* pas de chevron pour Racine */
.finder-breadcrumb .crumb:first-child::after {
  content: "";
  margin: 0;
}

</style>


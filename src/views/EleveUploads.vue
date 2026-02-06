<template>
  <Layout>
    <div class="uploads-page dark-theme">

      <!-- ================= HEADER ================= -->
      <div class="uploads-header">
        <div>
          <h3>📎 Mes documents</h3>
<DriveQuotaBar ref="driveQuotaRef" />

          <div class="finder-tabs">
            <button class="tab" :class="{ active: finderMode === 'normal' }" @click="switchToNormal">
              📎 Mes documents
            </button>

            <button class="tab" :class="{ active: finderMode === 'shared' }" @click="switchToShared">
              🔗 Partagé avec moi
            </button>

            <button class="tab danger" :class="{ active: finderMode === 'trash' }" @click="switchToTrash">
              🗑️ Corbeille
            </button>

<button
  v-if="!isReadOnlyShared && finderMode !== 'trash'"
  class="add-btn"
  @click.stop="openAddMenuFromButton"
>
  <span class="icon">＋</span>
  Ajouter
</button>



          </div>


          <div class="search-wrapper">
            <input
              v-model="searchQuery"
              class="search-input"
              placeholder="🔍 Rechercher un fichier ou dossier…"
              @keydown.esc="searchQuery = ''"
            />

     <button
       v-if="previewVideoUrl"

  class="video-close no-longpress"
  @pointerdown.capture.stop.prevent="closeVideo"
  @mousedown.capture.stop.prevent
  @touchstart.capture.stop.prevent
  @contextmenu.prevent
>
  ✕
</button>


          </div>
        </div>
      </div>

      <!-- ================= MENU AJOUT ================= -->
 <div
  v-if="addMenu.visible && !isDragging && !showUpload"
  class="context-backdrop"
  @click="closeAddMenu"
>
  <div
    class="context-menu"
    :style="{ top: addMenu.y + 'px', left: addMenu.x + 'px' }"
    @click.stop
  >
    <div class="context-item" @click="openUploadUI">
        <i class="bi bi-plus"></i>
Ajouter un fichier
    </div>
    <div class="context-item" @click="createFolder">
        <i class="bi bi-upload"></i>
 Ajouter un dossier
    </div>
  </div>
</div>


      <!-- ================= UPLOAD MODAL ================= -->




      <!-- ================= BREADCRUMB ================= -->
      <div v-if="finderMode !== 'trash'" class="breadcrumb finder-breadcrumb">
        <span
          v-for="f in searchBreadcrumb"
          :key="f.folder_id"
          class="crumb"
          @click="onBreadcrumbClick(f)"
        >
          {{ getDisplayFolderName(f) }}
        </span>
      </div>

      <!-- ================= EXPLORER ================= -->
      <div
        ref="explorerScroll"
        class="explorer-zone"
  :class="{ dragging: isDragging, disabled: showUploadCore }"
        @click.self="clearSelection"
        @contextmenu.prevent="openExplorerContextMenu"
         @dragenter.prevent="isDragging = true"
  @dragover.prevent
  @dragleave.prevent="isDragging = false"
  @drop.prevent="handleExplorerDrop"
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
<div v-if="eleveBlocked" class="eleve-blocked">
  <h3>📁 Espace en préparation</h3>
  <p>
    Ton professeur n’a pas encore activé l’espace de partage.
  </p>
</div>


        <!-- ================= TRASH ================= -->
         <div
  v-if="finderMode === 'shared' && !sharedPrefetched"
  class="shared-loading"
>
  Chargement des dossiers partagés…
</div>

        <div v-if="finderMode === 'trash'" class="trash-view">

          <div class="trash-header">
            <button
              class="danger-btn"
              :disabled="!trashedFiles.length || trashDeleting"
              @click="emptyTrash"
            >
              🧨 Vider la corbeille
            </button>
          </div>

          <div
            v-if="!trashedFiles.length"
            class="empty-state"
          >
            🗑️ La corbeille est vide
          </div>

          <!-- ===== FILES ONLY ===== -->
          <div
            v-for="file in trashedFiles"
            :key="file.upload_id"
            class="upload-item deleted"
          >
            <span class="file-icon">{{ getFileIcon(file) }}</span>

            <div class="file-info">
              <strong>{{ file.file_name }}</strong>
              <span class="deleted-at">
                Supprimé le {{ formatDate(file.deleted_at) }}
              </span>
            </div>

            <div class="trash-actions">
              <button
                class="icon-btn"
                title="Restaurer"
                @click.stop="restoreFile(file)"
              >
                ♻️
              </button>

              <button
                class="icon-btn danger"
                title="Supprimer définitivement"
                @click.stop="hardDeleteFile(file)"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
<!-- ⬆️ EMPTY UPLOAD CORE -->

        <!-- ================= NORMAL / SHARED ================= -->
        <div v-else class="explorer-content">
<div
  v-if="searchQuery && !hasSearchResults"
  class="search-empty"
>
  🔍 Aucun résultat pour « {{ searchQuery }} »
</div>

          <!-- ===== DOSSIERS ===== -->
   <div
  v-for="folder in searchedFolders"
  :key="folder.folder_id"
  class="upload-item folder"
  :class="{
    selected: selectedFolders.includes(folder.folder_id),
    cut: clipboard.mode === 'cut' &&
         clipboard.folders.includes(folder.folder_id)
  }"

  @click.stop="onFolderTap(folder, $event)"

  @contextmenu.prevent="openFolderMenu($event, folder)"

  @pointerdown.prevent="onPressStart(folder, $event, 'folder')"
  @pointerup="onPressEnd"
  @pointercancel="onPressEnd"
  @pointerleave="onPressEnd"
>


            <i class="bi bi-folder2"></i>
<strong v-if="editingFolderId !== folder.folder_id">
  {{ getDisplayFolderName(folder) }}
</strong>

<input
  v-else
  :ref="el => setFolderRenameRef(el, folder.folder_id)"
  v-model="editingFolderName"
  class="rename-input"
  @keydown.enter="confirmRenameFolder(folder)"
  @keydown.esc="cancelRenameFolder"
  @blur="confirmRenameFolder(folder)"
/>
          </div>


          <!-- ===== FICHIERS ===== -->
<template v-for="file in searchedFiles" :key="file?.upload_id || file?.optimistic_id">
<div
  v-if="file && typeof file === 'object'"
  class="upload-item"
  :class="{
    optimistic: !!file._optimistic,
    selected: selectedFiles.includes(file.upload_id),
cut: clipboard.mode === 'cut' &&
     clipboard.uploads.some(u => u.upload_id === file.upload_id),
         disabled: !!file._optimistic
  }"
  :draggable="!file._optimistic"

  @click.stop="file._optimistic || isRenaming ? null : onFileTap(file, $event)"
  @dblclick.stop="file._optimistic ? null : openFile(file)"

@contextmenu.prevent="openFileMenu($event, file)"
  @pointerdown.prevent="file._optimistic ? null : onPressStart(file, $event, 'file')"
@pointerdown="onPressStart(file, $event, 'file')"
@pointermove="onPointerMove"
@pointerup="onPressEnd"
@pointercancel="onPressEnd"


  @pointerleave="isRenaming ? null : onPressEnd"
>




            <span class="file-icon">{{ getFileIcon(file) }}</span>

         <div class="file-info">
  <strong v-if="editingId !== file.upload_id">
    {{ file.file_name }}
  </strong>

<div
  v-else
  class="rename-wrapper"
  @click.stop
  @pointerdown.stop
>
  <input
    :ref="el => fileRenameRefs.set(file.upload_id, el)"
    v-model="editingName"
    class="rename-input rename-base"
    @keydown.enter="confirmRename(file)"
    @keydown.esc="cancelRename"
    @blur="confirmRename(file)"
  />

  <span class="rename-ext">
    {{ getFileExtension(file.file_name) }}
  </span>
</div>

</div>
<!-- 🔄 PROGRESS BAR OPTIMISTIC -->
<div v-if="file._optimistic" class="upload-progress">
  <span :style="{ width: file.progress + '%' }" />
</div>

<div
  v-if="file._optimistic && file.message"
  class="upload-status"
>
  {{ file.message }}
</div>

<div
  v-if="file._optimistic"
  class="upload-actions"
  style="pointer-events:auto; position:relative; z-index:20"
>


<button
  class="sbs-cancel-btn"
  @click.stop="cancelUpload(file.optimistic_id)"
>
  <span class="icon">✖</span>
</button>


</div>

<div
  v-if="file._optimistic && file.eta != null"
  class="upload-eta"
>
  ⏳ ~{{ formatEta(file.eta) }}
</div>
          </div>
</template>
          <!-- ===== EMPTY ===== -->
<!-- ===== EMPTY ===== -->
<div
  v-if="
    foldersLoaded &&
    !searchQuery &&
    !visibleFolders.length &&
    !visibleFiles.length
  "
  class="empty-state dropzone"
  @dragover.prevent
  @dragenter.prevent="isDragActive = true"
  @dragleave.prevent="isDragActive = false"
  @drop.prevent="onModalDrop"
  :class="{ 'drag-active': isDragActive }"
  @click="triggerUploadCore"
>
  <div class="drop-content">
<div class="icon arrow"></div>


    <div class="title">Glisse tes fichiers ici</div>
    <div class="subtitle">ou clique pour ajouter des fichiers</div>
  </div>



</div>


        </div>
      </div>

      <!-- ================= CONTEXT MENU ================= -->
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
<template v-if="contextMenu.type === 'explorer' && !isReadOnlyShared">
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

          <template v-if="contextMenu.type === 'trash-file'">
            <div class="context-item" @click="restoreFile(contextMenu.target)">
              ♻️ Restaurer
            </div>
            <div class="context-item danger" @click="hardDeleteFile(contextMenu.target)">
              ❌ Supprimer définitivement
            </div>
          </template>

          <template v-if="contextMenu.type === 'file'">
            <div class="context-item" @click="startRename(contextMenu.target)">✏️ Renommer</div>
            <div class="context-item" @click="copyFromContext(contextMenu.target)">📋 Copier</div>
            <div class="context-item" @click="cutFromContext(contextMenu.target)">✂️ Couper</div>
            <div class="context-item danger" @click="deleteAndClose(contextMenu.target)">🗑️ Supprimer</div>
          </template>

          <template v-if="contextMenu.type === 'folder'">
            <div class="context-item" @click="startRenameFolder(contextMenu.target)">✏️ Renommer</div>
            <div class="context-item danger" @click="deleteFolderAction(contextMenu.target)">
              🗑️ Supprimer
            </div>
          </template>

        </div>
      </div>

    </div>
  </Layout>
<teleport to="body">
  <div
    class="sbs-modal-overlay"
    v-show="showUploadModal"
    @click.self="closeUploadUI"
  >
    <div
      class="sbs-modal upload-modal dropzone"
      @dragover.prevent
      @dragenter.prevent="isDragActive = true"
      @dragleave.prevent="isDragActive = false"
      @drop.prevent="onModalDrop"
      :class="{ 'drag-active': isDragActive }"
      @click="triggerUploadCore"
    >
      <div class="drop-content">
        <div class="icon">⬆️</div>
        <div class="title">Glisse tes fichiers ici</div>
        <div class="subtitle">ou clique n’importe où</div>
      </div>
    </div>
  </div>
</teleport>





<teleport to="body">
  <div
    v-if="previewVideoUrl"
    class="video-overlay"
    @click.self="previewVideoUrl = null"
  >
    <button class="video-close" @click="previewVideoUrl = null">✕</button>

<VideoPreview
  :key="previewVideoUrl"
  :src="previewVideoUrl"
/>
  </div>
</teleport>



<!-- CORE UPLOAD VIVANT (INVISIBLE) -->
<div style="display:none">
  <UploadFileCore
    ref="uploader"
    :eleve-id="effectiveEleveId"
    :cours-id="effectiveCoursId"
    :folder-id="currentFolderId"
    @queued="onQueuedAndClose"
    @progress="onProgress"
    @uploaded="onUploadSuccess"
    @error="onUploadError"
    @done="onUploadDone"
  />
</div>


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
import { gasPost } from "@/config/gas.ts"
import DriveQuotaBar from "@/components/DriveQuotaBar.vue"
import VideoPreview from "@/components/VideoPreview.vue"

import { ref, computed, onMounted, watch, onUnmounted,nextTick,watchEffect } from "vue"
import axios from "axios"
import { useAuthStore } from "@/stores/authStore"
import UploadModal from "@/components/UploadModal.vue"
import { useRoute } from "vue-router"
import UploadFileCore from "@/components/UploadFileCore.vue"
import { useToast } from "vue-toastification"


// ============================================================================
// 🔐 AUTH + ROUTE
// ============================================================================
const auth = useAuthStore()
const toast = useToast()
const trashedUploads = ref([])   // fichiers supprimés
const trashedFolders = ref([])   // dossiers supprimés
const TRASH_CHUNK_SIZE = 30
const trashDeleting = ref(false)
const trashProgress = ref({ done: 0, total: 0 })
const isRenaming = computed(() => editingId.value !== null)
const isDragActive = ref(false)
const lastNormalFolderId = ref(null)

const driveQuotaRef = ref(null)
const onExplorerScroll = () => {
  isScrolling = true

  const el = explorerScroll.value
  if (el) el.classList.add("scrolling")

  clearTimeout(scrollResetTimer)
  scrollResetTimer = setTimeout(() => {
    isScrolling = false
    if (el) el.classList.remove("scrolling")
  }, 120)
}

const sharedWithMeIds = ref(new Set())
const sharedByMeIds  = ref(new Set())
const uploader = ref(null)
const showUploadCore = ref(false)
let isScrolling = false
let scrollResetTimer = null
const navigationLocked = ref(true)

const onUploadError = ({ optimistic_id, message, type }) => {
  // ⛔ cas ANNULATION → on retire l’optimistic
  if (message === "Upload annulé") {
    console.log("🧹 cancel UX → remove optimistic", optimistic_id)
    removeOptimisticUpload(optimistic_id)
    return
  }

  // 🔔 autres erreurs
  toast.error(message || "Erreur pendant l’upload")

  if (!optimistic_id) return

  Object.values(uploadsByFolder.value).forEach(list => {
    list.forEach(item => {
      if (
        item._optimistic &&
        item.optimistic_id === optimistic_id
      ) {
        item.status = "error"
        item.message =
          message ||
          (type === "quota"
            ? "Quota dépassé"
            : "Échec de l’upload")

        item.progress = 0
      }
    })
  })

  uploadsByFolder.value = { ...uploadsByFolder.value }
}
const closeVideo = () => {
  previewVideoUrl.value = null
}

const showUploadModal = ref(false)
const hideUploadUI = ref(false)

const openUploadUI = () => {
  if (isCurrentFolderOptimistic.value) {
  toast.info("Dossier en cours de création…")
  return
}

  if (isSharedMode.value) return
  if (isReadOnlyShared.value) return

  // 🔥 CLOSE MENUS
  closeContextMenu()
  closeAddMenu()

  if (uploadSession.value) {
    toast.info("Upload en cours…")
    return
  }

  showUploadModal.value = true
}


const isCurrentFolderOptimistic = computed(() => {
  const f = foldersById.value[currentFolderId.value]
  return !!f?._optimistic
})

const openAddMenuFromButton = (e) => {
  const rect = e.currentTarget.getBoundingClientRect()

  addMenu.value = {
    visible: true,
    x: Math.max(12, rect.left),
    y: rect.bottom + 8
  }
}

const getFileExtension = (name) => {
  if (!name || !name.includes(".")) return ""
  return "." + name.split(".").pop()
}


const closeUploadUI = () => {
  showUploadModal.value = false
}
const FINDER_STATE_KEY = computed(
  () => `sbs_finder_state_${profId.value}_${effectiveOwnerType.value}_${effectiveOwnerId.value}`
)

const saveFinderState = () => {
  if (finderMode.value !== "normal") return

  sessionStorage.setItem(
    FINDER_STATE_KEY.value,
    JSON.stringify({
      folderId: currentFolderId.value,
      mode: "normal",
      search: searchQuery.value || ""
    })
  )
}

function refreshDriveQuota(force = true) {
  driveQuotaRef.value?.refreshQuota?.({ force })
}

const onModalDrop = (e) => {
  if (isSharedMode.value || isReadOnlyShared.value) return

  const files = Array.from(e.dataTransfer?.files || [])
  if (!files.length) return

  // 🔥 EXACTEMENT comme le picker
  uploader.value?.handleFiles(files)

  // UI
  showUploadModal.value = false
}





const restoreFinderState = () => {
  const raw = sessionStorage.getItem(FINDER_STATE_KEY.value)
  if (!raw) return false

  try {
    const s = JSON.parse(raw)
finderMode.value = s.mode === "normal" ? "normal" : "normal"
    currentFolderId.value = s.folderId || null
    searchQuery.value = s.search || ""
    return true
  } catch {
    return false
  }
}


// 🗑️ TRASH PREFETCH CACHE
const TRASH_TTL = 5 * 60 * 1000 // 5 min
const trashFetchedAt = ref(0)

const previewVideoUrl = ref(null)

const openVideo = (file) => {
  previewVideoUrl.value = file.url
}






const formatEta = s => {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}m ${r}s`
}

const onFilesSelected = (files) => {
  if (!files?.length) return

  // 🔥 créer la session AVANT
  uploadSession.value = {
    id: crypto.randomUUID(),
    folderId: currentFolderId.value,
    total: files.length,
    done: 0
  }

  uploadFinished.value = false

  // 🔥 forward vers UploadFileCore
  uploader.value?.handleFiles(files)
}

const restoreFile = async (file) => {
  console.group("♻️ RESTORE FILE")

  const folderId = file?.folder_id ?? null
  if (!folderId) {
    console.error("⛔ folder_id manquant")
    console.groupEnd()
    return
  }

  // ======================
  // 🔁 SNAPSHOT (rollback)
  // ======================
  const prevTrash = [...trashedUploads.value]
  const prevFolder = [...(uploadsByFolder.value[folderId] || [])]

  // ======================
  // ⚡ UI OPTIMISTIC
  // ======================
  trashedUploads.value = trashedUploads.value.filter(
    f => f.upload_id !== file.upload_id
  )

  uploadsByFolder.value[folderId] = [
    ...prevFolder,
    { ...file, deleted_at: null }
  ]

  try {
    const data = await gasPost("restoreupload", {
      prof_id: profId.value,
      upload_id: file.upload_id
    })

    if (!data?.success) {
      throw new Error("restore_failed")
    }

    // ======================
    // 💾 CACHE
    // ======================
    writeUploadsCache(
      effectiveOwnerType.value,
      effectiveOwnerId.value,
      Object.values(uploadsByFolder.value).flat()
    )
refreshDriveQuota(true)

    console.log("✅ RESTORE OK", file.upload_id)
    console.groupEnd()

  } catch (e) {
    console.error("🔥 RESTORE ERROR — rollback", e)

    // ======================
    // 🔁 ROLLBACK
    // ======================
    trashedUploads.value = prevTrash
    uploadsByFolder.value[folderId] = prevFolder

    console.groupEnd()
    alert("Erreur restauration fichier")
  }
}




const restoreFolder = (folder) => {
  console.log("♻️ restore folder", folder.folder_id)
  closeContextMenu()
}

const hardDeleteFile = async (file) => {
  console.group("❌ HARD DELETE FILE — FRONT")

  let prevTrash = []
  let prevFolder = []
  let folderId = null

  try {
    if (!file?.upload_id) {
      console.error("⛔ file invalide", file)
      console.groupEnd()
      return
    }

    if (!confirm("Supprimer définitivement ce fichier ?")) {
      console.warn("⏭️ annulé par l’utilisateur")
      console.groupEnd()
      return
    }

    const uploadId = file.upload_id
    folderId = file.folder_id ?? null

    closeContextMenu()

    // =========================
    // SNAPSHOT
    // =========================
    prevTrash = [...trashedUploads.value]
    prevFolder = folderId
      ? [...(uploadsByFolder.value[folderId] || [])]
      : []

    // =========================
    // UI OPTIMISTIC
    // =========================
    trashedUploads.value = trashedUploads.value.filter(
      u => u.upload_id !== uploadId
    )

    if (folderId && uploadsByFolder.value[folderId]) {
      uploadsByFolder.value[folderId] =
        uploadsByFolder.value[folderId].filter(
          u => u.upload_id !== uploadId
        )
    }

    // =========================
    // API (gasPost)
    // =========================
    const res = await gasPost("harddeleteupload", {
      prof_id: profId.value,
      upload_id: uploadId
    })

    if (!res?.success) {
      throw new Error("harddeleteupload_failed")
    }

    // =========================
    // CACHE
    // =========================
    writeUploadsCache(
      effectiveOwnerType.value,
      effectiveOwnerId.value,
      Object.values(uploadsByFolder.value).flat()
    )

    console.log("✅ HARD DELETE FILE OK =", uploadId)
    console.groupEnd()

  } catch (e) {
    console.error("🔥 HARD DELETE FILE ERROR", e)

    // =========================
    // ROLLBACK
    // =========================
    trashedUploads.value = prevTrash
    if (folderId) uploadsByFolder.value[folderId] = prevFolder

    console.groupEnd()
    alert("Erreur suppression définitive fichier")
  }
}



const handleModalDrop = (e) => {
  if (isCurrentFolderOptimistic.value) {
  toast.info("Dossier en cours de création…")
  return
}

  const files = Array.from(e.dataTransfer?.files || [])
  if (!files.length) return

  const folderId = currentFolderId.value ?? null
  const sessionId = crypto.randomUUID()

  const wrapped = files.map(f => ({
    file: f,
    optimistic_id: crypto.randomUUID()
  }))

  // optimistic + fermeture modale
  onQueuedAndClose(
    wrapped.map(w => ({
      upload_id: null,
      optimistic_id: w.optimistic_id,
      file_name: w.file.name,
      file_size: w.file.size,
      folder_id: folderId,
      _optimistic: true,
      status: "queued",
      progress: 0
    }))
  )

  window.dispatchEvent(
    new CustomEvent("sbs-drop-files", {
      detail: {
        files: wrapped,
        folder_id: folderId,
        session_id: sessionId
      }
    })
  )
}

let prevFolders = null
let prevUploadsByFolder = null
let prevTrashFolders = null
let prevTrashUploads = null

const hardDeleteFolder = async (folder) => {
  console.group("❌ HARD DELETE FOLDER — FRONT")

  let prevFolders = null
  let prevUploadsByFolder = null
  let prevTrashFolders = null
  let prevTrashUploads = null

  try {
    if (!folder?.folder_id) {
      console.error("⛔ folder invalide", folder)
      console.groupEnd()
      return
    }

    const folderId = folder.folder_id

    if (!confirm("Supprimer définitivement ce dossier et son contenu ?")) {
      console.warn("⏭️ annulé par l’utilisateur")
      console.groupEnd()
      return
    }

    closeContextMenu()

    // =========================
    // SNAPSHOTS
    // =========================
    prevFolders = JSON.parse(JSON.stringify(folders.value))
    prevUploadsByFolder = JSON.parse(JSON.stringify(uploadsByFolder.value))
    prevTrashFolders = Array.isArray(trashedFolders?.value)
      ? JSON.parse(JSON.stringify(trashedFolders.value))
      : null
    prevTrashUploads = Array.isArray(trashedUploads?.value)
      ? JSON.parse(JSON.stringify(trashedUploads.value))
      : null

    // =========================
    // UI OPTIMISTIC
    // =========================
    folders.value = folders.value.filter(f => f.folder_id !== folderId)

    if (Array.isArray(trashedFolders?.value)) {
      trashedFolders.value = trashedFolders.value.filter(f => f.folder_id !== folderId)
    }

    if (uploadsByFolder.value?.[folderId]) {
      delete uploadsByFolder.value[folderId]
      uploadsByFolder.value = { ...uploadsByFolder.value }
    }

    if (currentFolderId.value === folderId) {
      currentFolderId.value = null
    }

    // =========================
    // API (gasPost)
    // =========================
    const res = await gasPost("harddeletefolder", {
      prof_id: profId.value,
      folder_id: folderId
    })

    if (!res?.success) {
      throw new Error("hard_delete_folder_failed")
    }

    // =========================
    // CACHE
    // =========================
    writeFoldersCache(
      effectiveOwnerType.value,
      effectiveOwnerId.value,
      folders.value
    )

    writeUploadsCache(
      effectiveOwnerType.value,
      effectiveOwnerId.value,
      Object.values(uploadsByFolder.value).flat()
    )

    console.log("✅ HARD DELETE FOLDER OK =", folderId)
    console.groupEnd()

  } catch (e) {
    console.error("🔥 HARD DELETE FOLDER ERROR", e)

    // =========================
    // ROLLBACK
    // =========================
    if (prevFolders) folders.value = prevFolders
    if (prevUploadsByFolder) uploadsByFolder.value = prevUploadsByFolder
    if (prevTrashFolders && Array.isArray(trashedFolders?.value)) trashedFolders.value = prevTrashFolders
    if (prevTrashUploads && Array.isArray(trashedUploads?.value)) trashedUploads.value = prevTrashUploads

    console.groupEnd()
    alert("Erreur suppression définitive dossier")
  }
}




const currentCoursId = null

const onCloseUpload = () => {
  showUpload.value = false
  uploadSession.value = null
  uploadFinished.value = false
  addMenu.visible = false   // 🔥 LIGNE CLÉ
}

let pressTimer = null
let startX = 0
let startY = 0
let moved = false

const MOVE_THRESHOLD = 8 // px (clé)
let longPressTriggered = false
const isPreviewOpen = computed(() => !!previewVideoUrl.value)
const onPressStart = (item, e, type = "file") => {
  if (e.pointerType !== "touch") return
  if (interactionLocked.value) return
  if (isPreviewOpen.value) return

  startX = e.clientX
  startY = e.clientY
  moved = false

  clearTimeout(pressTimer)

  pressTimer = setTimeout(() => {
    if (moved) return

    longPressTriggered = true
    navigator.vibrate?.(20)

    if (type === "file") openFileMenu(e, item)
    else openFolderMenu(e, item)
  }, 450)
}




const onPointerMove = (e) => {
  if (e.pointerType !== "touch") return

  const dx = Math.abs(e.clientX - startX)
  const dy = Math.abs(e.clientY - startY)

  if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
    moved = true
    clearTimeout(pressTimer)
  }
}


const emptyTrash = async () => {
  if (!trashedFiles.value.length) return

  const total = trashedFiles.value.length

  if (
    !confirm(`Supprimer définitivement ${total} fichier(s) ?`)
  ) return

  trashDeleting.value = true
  trashProgress.value = { done: 0, total }

  closeContextMenu()

  // =========================
  // SNAPSHOT (rollback)
  // =========================
  const prevTrash = [...trashedFiles.value]
  const prevUploadsByFolder = JSON.parse(
    JSON.stringify(uploadsByFolder.value)
  )

  try {
    // 🔄 vérité serveur AVANT hard delete
    await fetchTrash()

    const ids = trashedUploads.value.map(f => f.upload_id)
    if (!ids.length) return

    // =========================
    // UI OPTIMISTIC
    // =========================
    trashedUploads.value = []

    for (let i = 0; i < ids.length; i += TRASH_CHUNK_SIZE) {
      const chunk = ids.slice(i, i + TRASH_CHUNK_SIZE)

      const res = await gasPost("harddeleteuploads_batch", {
        prof_id: profId.value,
        upload_ids: chunk
      })

      if (!res?.success) {
        throw new Error("batch_failed")
      }

      trashProgress.value.done += chunk.length
    }

    // =========================
    // CLEAN LOCAL CACHE
    // =========================
    Object.keys(uploadsByFolder.value).forEach(fid => {
      uploadsByFolder.value[fid] =
        uploadsByFolder.value[fid].filter(u => !u.deleted_at)
    })

    writeUploadsCache(
      effectiveOwnerType.value,
      effectiveOwnerId.value,
      Object.values(uploadsByFolder.value).flat()
    )

  } catch (e) {
    console.warn("⚠️ EMPTY TRASH timeout or network error – assuming success", e)

    // 👉 on considère comme succès tardif
    // UI déjà optimiste, on ne rollback PAS

    // petit refetch de sécurité
await fetchAllUploadsOnce()

  } finally {
    trashDeleting.value = false
    trashProgress.value = { done: 0, total: 0 }
    refreshDriveQuota(true)

  }
}

const interactionLocked = ref(false)
const onPressEnd = () => {
  clearTimeout(pressTimer)
  pressTimer = null
  longPressTriggered = false
}


const isAutoOpening = ref(false)

const route = useRoute()
const sharedPrefetched = ref(false)
const sharedFoldersCache = ref([])
const sharedUploadsCache = ref([])
const sharedUploadsPrefetched = ref(false)


const sharedRealFoldersCache = ref([])
const sharedLoading = ref(false)
const isSharedWithMe = (folderId) => {
  return sharedFolders.value.some(s => s.folder_id === folderId)
}

// =====================================================
// 🔵 SHARED BY ME (PROF) — FRONT ONLY PERSISTENCE
// =====================================================
const SHARED_BY_ME_KEY = computed(() => `sharedByMe_${profId.value}`)

const readSharedByMe = async () => {
  const data = await gasPost("readsharedbyme", {
    prof_id: profId.value
  })

  if (!data?.success) {
    sharedByMeIds.value = new Set()
    return
  }

  const actifs = data.shared?.filter(s => s.status === "active") || []
  sharedByMeIds.value = new Set(actifs.map(s => s.folder_id))
}




const writeSharedByMe = (map) => {
  try {
    localStorage.setItem(SHARED_BY_ME_KEY.value, JSON.stringify(map || {}))
  } catch {}
}

const markSharedByMe = (folderId, isShared) => {
  if (!folderId) return
  const map = readSharedByMe()
  map[folderId] = !!isShared
  writeSharedByMe(map)
}

const getSharedByMe = (folderId) => {
  const map = readSharedByMe()
  return !!map[folderId]
}

const hydrateSharedExplorer = () => {
  if (!sharedPrefetched.value) return

  console.log("🔄 HYDRATE SHARED (SAFE)")

  // droits uniquement
  sharedFolders.value = sharedFoldersCache.value

  // ⚠️ NE PAS toucher à folders.value
  // on garde l’arbo complète


  currentFolderId.value = SHARED_ROOT_ID

  console.log("🧪 SHARED STATE", {
    rights: sharedFolders.value.map(s => s.folder_id),
    totalFoldersAvailable: folders.value.length
  })
}


const openSharedRoot = async () => {
  console.log("🧪 CLICK SHARED")

  // snapshot état normal
  normalStateSnapshot.value = {
    folders: [...folders.value],
    uploadsByFolder: JSON.parse(JSON.stringify(uploadsByFolder.value)),
    currentFolderId: currentFolderId.value
  }

  finderMode.value = "shared"
  selectedFiles.value = []
  selectedFolders.value = []

  if (!sharedPrefetched.value) {
    await prefetchSharedData()
  }

  // 🔥 ICI LE FIX
  sharedFolders.value = [...sharedFoldersCache.value]

  currentFolderId.value = SHARED_ROOT_ID

  console.log("✅ SHARED READY", {
    rights: sharedFolders.value.map(s => s.folder_id)
  })
}



const normalStateSnapshot = ref(null)

const groupUploadsByFolder = (uploads = []) => {
  const map = {}
  uploads.forEach(u => {
    const fid = u.folder_id ?? null
    if (!map[fid]) map[fid] = []
    map[fid].push(u)
  })
  return map
}
const SHARED_TTL = 5 * 60 * 1000 // 5 min
const sharedFetchedAt = ref(0)

const uploadSession = ref(null)
const uploadFinished = ref(false)
const vibrate = (pattern = 10) => {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern)
  }
}
const allFolders = computed(() =>
  folders.value.filter(f => !f.deleted_at)
)
const allFiles = computed(() =>
  Object.values(uploadsByFolder.value).flat()
)
const isSearching = computed(() =>
  searchQuery.value.trim().length > 0
)
const SHARED_ROOT_ID = "__shared_root__"

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
const searchQuery = ref("")

const userId = computed(() =>
  auth.user?.user_id || auth.user?.id || null
)
const profId = computed(() => auth.user?.prof_id || null)
const role = computed(() => (auth.user?.role || "").toLowerCase())

const isProfLike = computed(() =>
  role.value === "prof" || role.value === "admin"
)


const eleveBlocked = ref(false)
const onFolderTap = (folder, e) => {
  // 🔥 si multi-sélection → jamais ouvrir
  if (
    selectedFolders.value.length > 1 ||
    selectedFiles.value.length > 1
  ) {
    selectFolder(folder, e)
    return
  }

  if (searchQuery.value) {
    searchQuery.value = ""
  }

  if (isTouch()) {
    selectedFiles.value = []
    selectedFolders.value = []
    openFolder(folder)
    return
  }
if (longPressTriggered) {
  longPressTriggered = false
  return
}

  if (e.detail === 2) {
    openFolder(folder)
  } else {
    selectFolder(folder, e)
  }
}




// =====================================================
// 🔗 SHARE MODAL
// =====================================================
const showShareModal = ref(false)
const shareTargetFolder = ref(null)
const sharePermission = ref("read")
const shareLink = ref("")

const openShareModal = async (folder) => {
  closeContextMenu()
  shareTargetFolder.value = folder
  sharePermission.value = "read"
  showShareModal.value = true
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

// Générer le lien

// =====================================================
// 🔗 MODE FINDER
// =====================================================
const finderMode = ref("normal") // normal | shared
// 🗑️ TRASH MODE
const isTrashMode = computed(() => finderMode.value === "trash")
const trashFiles = computed(() =>
  Object.values(uploadsByFolder.value)
    .flat()
    .filter(f => f.deleted_at)
)

const trashFolders = computed(() =>
  folders.value.filter(f => f.deleted_at)
)

const sharedFolders = ref([])
// [{ folder_id, permission, prof_id, share_id }]

const sharedPermissionsByFolder = computed(() => {
  const map = {}
  sharedFolders.value.forEach(s => {
    map[s.folder_id] = s.permission
  })
  return map
})

const isSharedMode = computed(() => finderMode.value === "shared")

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


let longPressTimer = null

const startLongPress = (file, e) => {
  longPressTimer = setTimeout(() => {
    selectedFiles.value = [file.upload_id]
    openFileMenu(e, file)
  }, 500)
}
const onFileTap = (file, e) => {
  // 🔒 LOCK immédiat (empêche long-press)
  interactionLocked.value = true
  clearTimeout(pressTimer)
  longPressTriggered = false

  if (isTouch()) {
    selectedFiles.value = []
    openFile(file)

    // ⏱️ déverrouille après la fenêtre long-press
    setTimeout(() => {
      interactionLocked.value = false
    }, 600)

    return
  }

  if (e.detail === 2) {
    openFile(file)
  } else {
    toggleSelect(file, e)
  }

  setTimeout(() => {
    interactionLocked.value = false
  }, 600)
}


const cancelLongPress = () => {
  clearTimeout(longPressTimer)
  longPressTimer = null
}




// ACTION PARTAGE API
const confirmShareFolder = async () => {
  if (!shareTargetFolder.value) return

  showShareModal.value = false

  const folderId = shareTargetFolder.value.folder_id

  // 🔥 optimistic
  folders.value = folders.value.map(f =>
    f.folder_id === folderId
      ? { ...f, is_shared: true, _optimistic_share: true }
      : f
  )

  try {
    const data = await gasPost("sharefolder_create_or_update", {
      prof_id: profId.value,
      folder_id: folderId,
      permission: "read",
      user_id: userId.value
    })

    if (!data?.success) {
      throw new Error("share_failed")
    }

    folders.value = folders.value.map(f =>
      f.folder_id === folderId
        ? { ...f, is_shared: true, _optimistic_share: false }
        : f
    )

    markSharedByMe(folderId, true)
    invalidateSharedCache()

  } catch (e) {
    folders.value = folders.value.map(f =>
      f.folder_id === folderId
        ? { ...f, is_shared: false, _optimistic_share: false }
        : f
    )

    markSharedByMe(folderId, false)
    alert("Erreur lors du partage du dossier")
  }
}





const isMovingFolder = ref(false)
const hydratedFromCache = ref(false)
const hasProfWorkspace = computed(() =>
  !!profRootFolder.value
)

const cacheStart = ref(performance.now())

// ============================================================================
// 🔗 ROUTES APPS SCRIPT (ID de déploiement)
// ⚠️ Doit être IDENTIQUE à tes autres vues (Planning.vue etc.)
// ============================================================================

const loaderStep = ref("init")
const filteredFolders = computed(() => {
  if (!searchQuery.value) return visibleFolders.value
  const q = searchQuery.value.toLowerCase()

  return visibleFolders.value.filter(f =>
    (f.name || "").toLowerCase().includes(q)
  )
})

const filteredFiles = computed(() => {
  if (!searchQuery.value) return visibleFiles.value
  const q = searchQuery.value.toLowerCase()

  return visibleFiles.value.filter(f =>
    (f.file_name || "").toLowerCase().includes(q)
  )
})
const searchedFolders = computed(() => {
  if (!searchQuery.value) return visibleFolders.value

  const q = searchQuery.value.toLowerCase()
  const allowed = searchScopeFolderIds.value

  return folders.value.filter(f =>
    allowed.has(f.folder_id) &&
    (f.name || "").toLowerCase().includes(q)
  )
})


const hasSearchResults = computed(() => {
  if (!searchQuery.value) return true
  return searchedFolders.value.length || searchedFiles.value.length
})
const normalizeFiles = (arr = []) =>
  Array.isArray(arr)
    ? arr.filter(f => f && typeof f === "object")
    : []
    const getDescendantFolderIds = (rootId) => {
  const ids = new Set()
  const stack = [rootId]

  while (stack.length) {
    const id = stack.pop()
    ids.add(id)

    folders.value.forEach(f => {
      if (f.parent_id === id) {
        stack.push(f.folder_id)
      }
    })
  }

  return ids
}

const searchScopeFolderIds = computed(() => {
  if (!currentFolderId.value) return new Set()
  return getDescendantFolderIds(currentFolderId.value)
})

const searchedFiles = computed(() => {
  if (!searchQuery.value) return visibleFiles.value

  const q = searchQuery.value.toLowerCase()
  const allowed = searchScopeFolderIds.value

  return allFiles.value.filter(f =>
    allowed.has(f.folder_id) &&
    (f.file_name || "").toLowerCase().includes(q)
  )
})




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
const isAdmin = computed(() => role.value === "admin")

const profRootFolder = computed(() => {
  // 👑 admin → racine globale
  if (role.value === "admin") {
    return folders.value.find(f => f.parent_id === null)
  }

  // 👨‍🏫 prof normal → SON dossier (ex: prof5)
  return folders.value.find(f =>
    f.owner_type === "prof" &&
    f.owner_id === profId.value &&
    f.is_system === false
  )
})



const getHomeFolder = () => {
  if (!isProfLike.value) {
    return folders.value.find(f =>
      f.owner_type === "eleve" &&
      f.owner_id === userId.value &&
      f.name === "Racine élève"
    )
  }

  return profRootFolder.value || null
}


// =====================================================
// 🗑️ FETCH SOFT DELETED UPLOADS (TRASH)
// =====================================================
const fetchTrash = async ({ force = false } = {}) => {
  if (!auth.jwt || !profId.value) return

  const now = Date.now()
  if (!force && trashFetchedAt.value && now - trashFetchedAt.value < TRASH_TTL) {
    console.log("⏭️ fetchTrash skipped (TTL)")
    return
  }

  console.log("🗑️ FETCH TRASH")

  try {
    const data = await gasPost("getsoftdeleteduploads", {
      prof_id: profId.value,
      limit: 200
    })

    if (!data?.success) {
      trashedUploads.value = []
      trashedFolders.value = []
      return
    }

    trashedUploads.value = (data.items || []).map(f => ({
      ...f,
      _fromTrash: true
    }))

    trashedFolders.value = []

    trashFetchedAt.value = now
    console.log("🗑️ trash loaded", trashedUploads.value.length)

  } catch (e) {
    console.error("🔥 fetchTrash error", e)
    trashedUploads.value = []
    trashedFolders.value = []
  }
}




const getFilePathLabel = (file) => {
  if (!file?.folder_id) return ""

  const path = buildFolderPath(file.folder_id)
  if (!path.length) return ""

  return path.map(f => getDisplayFolderName(f)).join(" / ")
}


const eleveRootId = computed(() =>
  folders.value.find(f =>
    f.owner_type === "eleve" &&
    f.owner_id === userId.value &&
    f.name === "Racine élève"
  )?.folder_id || null
)
const buildFolderPath = (folderId) => {
  const path = []
  let cur = folderId
  let guard = 0

  while (cur && guard++ < 20) {
    const f = foldersById.value[cur]
    if (!f) break
    path.unshift(f)
    cur = f.parent_id
  }

  return path
}

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



// ================= CACHE uploads =================
const UPLOADS_TTL = 60 * 1000 // 60s

const readUploadsCache = (ownerType, ownerId) => {
  try {
    const raw = localStorage.getItem(
      getUploadsCacheKey(ownerType, ownerId)
    )
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed?.ts || !Array.isArray(parsed.items)) return null

    if (Date.now() - parsed.ts > UPLOADS_TTL) return null

    return parsed.items
  } catch {
    return null
  }
}

const writeUploadsCache = (ownerType, ownerId, uploads) => {
  if (!Array.isArray(uploads)) return
  localStorage.setItem(
    getUploadsCacheKey(ownerType, ownerId),
    JSON.stringify({
      ts: Date.now(),
      items: uploads
    })
  )
}



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
  editingName.value = file.file_name.replace(/\.[^/.]+$/, "")

  await nextTick()
fileRenameRefs.get(file.upload_id)?.focus({ preventScroll: true })
  fileRenameRefs.get(file.upload_id)?.select()
}


// ================= CACHE uploads (sessionStorage) =================


const getUploadsCacheKey = (ownerType, ownerId) =>
  `uploads_${profId.value}_${ownerType}_${ownerId}_${CACHE_VERSION}`






const itemEls = ref(new Map()) // id -> element

// ============================================================================
// 🧰 Utils
// ============================================================================
const formatDate = (d) => {
  if (!d) return ""
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit"
  })
}
const currentFolderId = ref(null)
const currentEleveId = ref(null)




// ============================================================================
// 🧠 STATE (toujours déclaré AVANT les computed)
// ============================================================================



const draggedFiles = ref([])
// drag&drop==================

         // liste brute des fichiers (API)

// Upload modal
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

const editingFolderId = ref(null)
const editingFolderName = ref("")

const foldersLoaded = ref(false)

// ===== MENU AJOUT =====
const addMenu = ref({
  visible: false,
  x: 0,
  y: 0
})



const closeAddMenu = () => {
  addMenu.value.visible = false
}
const uploadFolderId = ref(null)
const foldersById = computed(() => {
  const map = {}
  for (const f of folders.value) {
    map[f.folder_id] = f
  }
  return map
})




const onBreadcrumbClick = (folder) => {
  if (folder.folder_id === "__search__") return

  // 🔥 sortir du mode recherche
  if (searchQuery.value) {
    searchQuery.value = ""
  }

  clearSelection()

  if (folder.name === "🏠 Home") {
    currentFolderId.value = profRootFolder.value?.folder_id || null
    return
  }

  currentFolderId.value = folder.folder_id
}




// ============================================================================
// 🧮 COMPUTED
// ============================================================================

const searchResultCount = computed(() => {
  if (!searchQuery.value) return 0
  return searchedFolders.value.length + searchedFiles.value.length
})


const searchBreadcrumb = computed(() => {
  const home = getHomeFolder()
  const homeCrumb = home
    ? [{ ...home, name: "🏠 Home" }]
    : []

  // hors recherche → Home + breadcrumb normal (sans dupliquer)
  if (!searchQuery.value) {
    const rest = breadcrumb.value.filter(
      b => b.folder_id !== home?.folder_id
    )
    return [...homeCrumb, ...rest]
  }

  // 🔍 recherche + 1 résultat
  if (searchResultCount.value === 1) {
    let path = []

    if (searchedFolders.value.length === 1) {
      path = buildFolderPath(searchedFolders.value[0].folder_id)
    } else if (searchedFiles.value.length === 1) {
      path = buildFolderPath(searchedFiles.value[0].folder_id)
    }

    const rest = path.filter(b => b.folder_id !== home?.folder_id)
    return [...homeCrumb, ...rest]
  }

  // 🔍 recherche multiple → Home + label recherche
  return [
    ...homeCrumb,
    {
      folder_id: "__search__",
      name: `Recherche : "${searchQuery.value}"`
    }
  ]
})




const showLoader = computed(() => {
  if (eleveBlocked.value) return false

  // ✅ cache présent → jamais bloquer l’UI
  if (hydratedFromCache.value) return false

  if (navigationLocked.value) return true

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


const breadcrumb = computed(() => {
  if (navigationLocked.value) return []

  if (isSharedMode.value && currentFolderId.value === SHARED_ROOT_ID) {
    return [{ folder_id: SHARED_ROOT_ID, name: "🔗 Partagé avec moi" }]
  }

  if (!currentFolderId.value) return []

  const chain = []
  let cur = currentFolderId.value
  let guard = 0

  while (cur && guard++ < 20) {
    const f = foldersById.value[cur]
    if (!f) break

    chain.unshift(f)

    // 🔥 STOP BREADCRUMB ÉLÈVE
    if (!isProfLike.value && cur === eleveRootId.value) break

    cur = f.parent_id
  }

  return chain
})

const isReadOnlyShared = computed(() => {
  if (!isSharedMode.value) return false
  if (!currentFolderId.value) return true

  return sharedPermissionsByFolder.value[currentFolderId.value] === "read"
})



// Dossiers visibles au niveau courant (déduits des folder_path)

const isInsideSharedTree = (folderId) => {
  let cur = folderId
  let guard = 0

  while (cur && guard++ < 50) {
    // ✅ racine partagée trouvée
    if (sharedFolders.value.some(s => s.folder_id === cur)) {
      return true
    }

    const folder = foldersById.value[cur]
    if (!folder) break

    cur = folder.parent_id
  }

  return false
}



const visibleFolders = computed(() => {
  if (navigationLocked.value) return []

  if (isTrashMode.value) return trashedFolders.value

  if (isSharedMode.value && currentFolderId.value === SHARED_ROOT_ID) {
    return [] // état normal si rien de partagé
  }

  if (isSharedMode.value) {
    return folders.value.filter(
      f =>
        f.parent_id === currentFolderId.value &&
        isInsideSharedTree(f.folder_id)
    )
  }

  return foldersByParentCache.value[currentFolderId.value ?? null] || []
})



const trashedFiles = computed(() => trashedUploads.value)








const clearSelection = () => {
  selectedFiles.value = []
  selectedFolders.value = []
}


// Fichiers du dossier courant uniquement
const visibleFiles = computed(() => {
  if (isTrashMode.value) return trashedFiles.value
  if (!currentFolderId.value) return []
  return uploadsByFolder.value[currentFolderId.value] || []
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
  if (selectedFiles.value.length || selectedFolders.value.length) {
    closeContextMenu()

    if (selectedFiles.value.length) deleteSelectedUploads()
    if (selectedFolders.value.length)deleteSelectedFolders([...selectedFolders.value])

  }
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
const getFileIcon = (file) => {
  // Dossier (au cas où)
  if (file.type === "folder") return "📁"

  const name = file.file_name || ""
  const ext = name.split(".").pop()?.toLowerCase()

  if (["pdf"].includes(ext)) return "📄"
  if (["mp3", "wav", "aac", "flac"].includes(ext)) return "🎵"
  if (["mp4", "mov", "webm", "mkv"].includes(ext)) return "🎬"
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "🖼️"
  if (["txt", "md"].includes(ext)) return "📝"
  if (["zip", "rar", "7z"].includes(ext)) return "🗜️"

  return "📦"
}

const onProgress = ({ optimistic_id, progress, status, message, eta }) => {
  Object.values(uploadsByFolder.value).forEach(list => {
    list.forEach(item => {
      if (!item._optimistic) return
      if (item.optimistic_id !== optimistic_id) return

      if (typeof progress === "number") {
        // clamp + pas de retour arrière
        item.progress = Math.max(
          item.progress ?? 0,
          Math.min(100, progress)
        )

        // message par défaut UNIQUEMENT si rien d’autre
        if (!status && !message) {
          item.status = "uploading"
          item.message = `Envoi… ${item.progress}%`
        }
      }

      if (status) {
        item.status = status
      }

      if (message) {
        item.message = message
      }

      if (eta !== undefined) {
        item.eta = eta
      }
    })
  })

  uploadsByFolder.value = { ...uploadsByFolder.value }
}






const prefetchSharedData = async () => {
  const now = Date.now()

  if (sharedPrefetched.value && now - sharedFetchedAt.value < SHARED_TTL) {
    return
  }

  if (!auth.jwt || !userId.value) return

  try {
    const data = await gasPost("getsharedfoldersforme", {
      user_id: userId.value,
      prof_id: profId.value
    })

    if (!data?.success) {
      sharedFoldersCache.value = []
      return
    }

    const actifs = data.shared?.filter(s => s.status === "active") || []
    sharedFoldersCache.value = actifs
    sharedWithMeIds.value = new Set(actifs.map(s => s.folder_id))

    if (isProfLike.value) {
      const byMe = await gasPost("readsharedbyme", {
        prof_id: profId.value
      })

      const actifsByMe =
        byMe.shared?.filter(s => s.status === "active") || []

      sharedByMeIds.value = new Set(actifsByMe.map(s => s.folder_id))
    }

    for (const folder of folders.value) {
      folder.is_shared = sharedByMeIds.value.has(folder.folder_id)
      folder.shared_with_me = sharedWithMeIds.value.has(folder.folder_id)
    }

    explorerKey.value++
    sharedPrefetched.value = true
    sharedFetchedAt.value = now

  } catch (e) {
    sharedFoldersCache.value = []
    sharedByMeIds.value = new Set()
    sharedWithMeIds.value = new Set()
  }
}






const invalidateSharedCache = () => {
  sharedPrefetched.value = false
  sharedFoldersCache.value = []
  sharedUploadsCache.value = []
  // ✅ Injecter `is_shared = true` dans folders.value pour refléter le backend
if (Array.isArray(folders.value) && folders.value.length) {
  const sharedIds = new Set(
    sharedFoldersCache.value.map(s => s.folder_id)
  )


}

}



const switchToNormal = () => {
  finderMode.value = "normal"

  selectedFiles.value = []
  selectedFolders.value = []
  searchQuery.value = ""

  currentFolderId.value =
    lastNormalFolderId.value ||
    (isProfLike.value
      ? profRootFolder.value?.folder_id || null
      : eleveRootId.value)
}


const switchToTrash = async () => {
  // mémoriser la position normale
  if (finderMode.value === "normal") {
    lastNormalFolderId.value = currentFolderId.value
  }

  finderMode.value = "trash"

  selectedFiles.value = []
  selectedFolders.value = []
  searchQuery.value = ""

  currentFolderId.value = null

  await fetchTrash()
}




const switchToShared = async () => {
  // mémoriser la position normale
  if (finderMode.value === "normal") {
    lastNormalFolderId.value = currentFolderId.value
  }

  finderMode.value = "shared"

  selectedFiles.value = []
  selectedFolders.value = []
  searchQuery.value = ""

  // données déjà préfetchées ailleurs
  sharedFolders.value = [...sharedFoldersCache.value]

  // racine virtuelle
  currentFolderId.value = SHARED_ROOT_ID
}


const updateUploadControl = (optimisticId, patch) => {
  Object.values(uploadsByFolder.value).forEach(list => {
    list.forEach(item => {
      if (item.optimistic_id === optimisticId) {
        item.control = {
          ...item.control,
          ...patch
        }

        if (patch.cancelled) {
          item.status = "cancelled"
          item.message = "Annulé"
          item.progress = 0
        }
      }
    })
  })

  uploadsByFolder.value = { ...uploadsByFolder.value }
}



const cancelUpload = (optimisticId) => {
  updateUploadControl(optimisticId, {
    cancelled: true,
    paused: false
  })

  window.dispatchEvent(
    new CustomEvent("sbs-upload-cancel", {
      detail: { optimistic_id: optimisticId }
    })
  )

  // 🔥 AJOUTE ÇA
  uploadSession.value = null
  hideUploadUI.value = false
}




const addOptimisticUploads = (items, folderId, sessionId) => {
  if (!Array.isArray(items)) {
    console.error("⛔ addOptimisticUploads → items invalides", items)
    return
  }

  const fid = folderId ?? null
  if (!uploadsByFolder.value[fid]) {
    uploadsByFolder.value[fid] = []
  }

  items.forEach(item => {
    // ===============================
    // 🅰️ CAS File natif (input / drag)
    // ===============================
    if (item?.file instanceof File) {
uploadsByFolder.value[fid].push({
  upload_id: `TMP_${item.optimistic_id}`,
  optimistic_id: item.optimistic_id,
  session_id: sessionId,
  name: item.file.name,
  file_name: item.file.name,
  file_size: item.file.size,
  file_type: item.file.type,
  folder_id: fid,
  created_at: new Date().toISOString(),
_optimistic: true,
progress: 0,
status: "uploading",
message: "Envoi…",
control: {
  paused: false,
  cancelled: false
}

})


      return
    }

    // ===============================
    // 🅱️ CAS normalisé (UploadFileCore)
    // ===============================
    if (item?.file_name) {
uploadsByFolder.value[fid].push({
  upload_id: `TMP_${item.optimistic_id}`,
  optimistic_id: item.optimistic_id,
  session_id: sessionId,
  name: item.file_name,
  file_name: item.file_name,
  file_size: item.file_size ?? null,
  file_type: item.file_type ?? null,
  folder_id: fid,
  created_at: new Date().toISOString(),
  _optimistic: true,
  progress: item.progress ?? 0,
  status: "uploading",
  message: "Envoi…",
  control: {
  paused: false,
  cancelled: false
}
})

      return
    }

    // ===============================
    // ❌ CAS INVALIDE
    // ===============================
    console.error("⛔ optimistic item invalide", item)
  })

  // 🔁 force re-render Vue
  uploadsByFolder.value = { ...uploadsByFolder.value }

  // 🧪 debug court
  console.log(
    "🧪 optimistic injecté =",
    uploadsByFolder.value[fid].map(f => ({
      name: f.name,
      optimistic: f._optimistic
    }))
  )
}


const removeOptimisticUpload = (optimisticId) => {
  Object.keys(uploadsByFolder.value).forEach(fid => {
    uploadsByFolder.value[fid] = uploadsByFolder.value[fid].filter(
      f => f.optimistic_id !== optimisticId
    )
  })

  // force re-render
  uploadsByFolder.value = { ...uploadsByFolder.value }

  console.log("🧹 optimistic supprimé =", optimisticId)
}


const openExplorerContextMenu = (e) => {
  e.preventDefault()
  e.stopPropagation()

  const MENU_WIDTH = 220
  const MENU_HEIGHT = 260
  const MARGIN = 8

  const { x: rawX, y: rawY } = getEventPosition(e)

  const vw = window.innerWidth
  const vh = window.innerHeight

  let x = rawX
  let y = rawY + 8 // offset doigt
if (isSharedMode.value || isReadOnlyShared.value) return

  // clamp X
  if (x + MENU_WIDTH > vw) {
    x = vw - MENU_WIDTH - MARGIN
  }
  if (x < MARGIN) x = MARGIN

  // clamp Y
  if (y + MENU_HEIGHT > vh) {
    y = vh - MENU_HEIGHT - MARGIN
  }
  if (y < MARGIN) y = MARGIN

  contextMenu.value = {
    visible: true,
    x,
    y,
    type: "explorer",
    target: null
  }
}










const deleteAndClose = (target) => {
  console.log("🧨 CONTEXT DELETE", {
    target: target?.upload_id,
    selectedBefore: [...selectedFiles.value]
  })

  // 🧠 si pas de multi-sélection, forcer la sélection du target
  if (selectedFiles.value.length <= 1 && target?.upload_id) {
    selectedFiles.value = [target.upload_id]
  }

  console.log("🧠 selectedAfter =", [...selectedFiles.value])

  if (!selectedFiles.value.length) {
    console.warn("⛔ no selection → abort delete")
    closeContextMenu()
    return
  }

  deleteSelectedUploads()
  closeContextMenu()
}




const selectedFolders = ref([]) // array de folder_id
const selectFolder = (folder, e) => {
  const id = folder.folder_id

  // Ctrl / Cmd → toggle dans la sélection
  if (e.ctrlKey || e.metaKey) {
    const index = selectedFolders.value.indexOf(id)

    if (index !== -1) {
      selectedFolders.value.splice(index, 1) // retire
    } else {
      selectedFolders.value.push(id)          // ajoute
    }
    return
  }

  // clic simple → sélection unique
  selectedFolders.value = [id]
}


const allowedSharedRootIds = computed(() =>
  sharedFolders.value.map(s => s.folder_id)
)

const openFolder = (folder) => {
  if (!folder || folder.folder_id === currentFolderId.value) return
  if (finderMode.value === "shared") {
    currentFolderId.value = folder.folder_id
    return
  }

  // logique existante
  currentFolderId.value = folder.folder_id

  if (isProfLike.value && folder.owner_type === "eleve") {
    currentEleveId.value = folder.owner_id
  }
}




const onUploadSuccess = (upload) => {
  console.log(
  "🧪 searchedFiles contains optimistic ?",
  searchedFiles.value.some(
    f => f.optimistic_id === upload.optimistic_id
  )
)

  console.group("✅ [ELEVE] onUploadSuccess")

  console.log("📥 upload reçu =", upload)
  console.log("📦 uploadSession BEFORE =", uploadSession.value)
  console.log("📁 currentFolderId =", currentFolderId.value)

  const fid =
    upload.folder_id ??
    uploadSession.value?.folderId ??
    currentFolderId.value ??
    null

  console.log("🧭 fid calculé =", fid)

  if (!fid) {
    console.warn("⛔ onUploadSuccess ABORT → folder_id introuvable", upload)
    console.groupEnd()
    return
  }

  // ===============================
  // 📊 session upload (badge / UX)
  // ===============================
  if (uploadSession.value) {
    uploadSession.value.done++
    console.log(
      "📈 session progress =",
      uploadSession.value.done,
      "/",
      uploadSession.value.total
    )

    if (uploadSession.value.done >= uploadSession.value.total) {
      uploadFinished.value = true
      vibrate(15)

      setTimeout(() => {
        uploadSession.value = null
        uploadFinished.value = false
      }, 1200)
    }
  }

  // ===============================
  // 📁 sécurité dossier
  // ===============================
  if (!uploadsByFolder.value[fid]) {
    console.warn("📂 dossier absent → création", fid)
    uploadsByFolder.value[fid] = []
  }

  // ===============================
  // 🔍 recherche du fantôme
  // ===============================
  let realFid = fid
  let list = uploadsByFolder.value[realFid] || []
  let idx = list.findIndex(
    f => f._optimistic && f.optimistic_id === upload.optimistic_id
  )

  console.log("🧪 recherche fantôme dans fid =", fid, "→", idx)

  if (idx === -1) {
    console.warn("🔎 fantôme non trouvé dans fid, scan global…")

    for (const [k, arr] of Object.entries(uploadsByFolder.value)) {
      const j = (arr || []).findIndex(
        f => f._optimistic && f.optimistic_id === upload.optimistic_id
      )
      if (j !== -1) {
        realFid = k
        list = arr
        idx = j
        console.log("🎯 fantôme trouvé dans dossier =", k, "index =", j)
        break
      }
    }
  }

  // ===============================
  // 🔁 remplacement fantôme → réel
  // ===============================
  if (idx !== -1) {
    console.log("♻️ suppression fantôme", {
      realFid,
      idx,
      optimistic_id: upload.optimistic_id
    })

    list.splice(idx, 1)
  } else {
    console.warn("⚠️ aucun fantôme trouvé → insertion directe")
  }

uploadsByFolder.value[realFid].push({
  ...upload,
  _optimistic: false,
  progress: 100,
  status: "done",
  message: "Terminé"
})

refreshDriveQuota(true)


  // ===============================
  // 🔄 force re-render
  // ===============================
  uploadsByFolder.value = { ...uploadsByFolder.value }

  console.log(
    "📂 fichiers finaux du dossier",
    fid,
    uploadsByFolder.value[fid].map(f => ({
      name: f.file_name,
      optimistic: f._optimistic
    }))
  )



  // ===============================
  // 💾 cache
  // ===============================
  writeUploadsCache(
    effectiveOwnerType.value,
    effectiveOwnerId.value,
    Object.values(uploadsByFolder.value).flat()
  )

  console.groupEnd()
}




const onUploadDone = () => {
  if (!uploadSession.value) return
  setTimeout(() => {
    uploadSession.value = null
  }, 800)
}






const isDescendant = (folderId, potentialParentId) => {
  let current = folders.value.find(f => f.folder_id === folderId)
  if (!current) return false

  // 🔒 sécurité : même owner
  const parentFolder = folders.value.find(f => f.folder_id === potentialParentId)
  if (!parentFolder) return false

  if (
    current.owner_type !== parentFolder.owner_type ||
    current.owner_id !== parentFolder.owner_id
  ) {
    return false
  }

  while (current.parent_id) {
    if (current.parent_id === potentialParentId) return true
    current = folders.value.find(f => f.folder_id === current.parent_id)
  }

  return false
}





const deleteFolderAction = async (folder = null) => {
  closeContextMenu()

  let ids = []

  if (selectedFolders.value.length > 1) {
    ids = [...selectedFolders.value]
  } else if (folder) {
    ids = [folder.folder_id]
  } else if (selectedFolders.value.length) {
    ids = [...selectedFolders.value]
  }

  if (!ids.length) return

  await deleteSelectedFolders(ids)
}

const deleteSelectedFolders = async (ids) => {
  console.group("🧨 DELETE SELECTED FOLDERS")

  if (!Array.isArray(ids) || !ids.length) {
    console.warn("⛔ abort: ids invalid")
    console.groupEnd()
    return
  }

  pushUndo()

  const foldersSnapshot = JSON.parse(JSON.stringify(folders.value))
  const uploadsSnapshot = JSON.parse(JSON.stringify(uploadsByFolder.value))
  const prevFolder = currentFolderId.value

  // ===============================
  // ⚡ UI OPTIMISTE
  // ===============================
  folders.value = folders.value.filter(
    f => !ids.includes(f.folder_id)
  )

  ids.forEach(fid => {
    if (uploadsByFolder.value[fid]) {
      delete uploadsByFolder.value[fid]
    }
  })

  if (ids.includes(currentFolderId.value)) {
    currentFolderId.value = null
  }

  selectedFolders.value = []

  try {
    const res = await gasPost("softdeletefolders", {
      prof_id: profId.value,
      folder_ids: ids
    })

    if (!res?.success) {
      throw new Error("backend_failure")
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

    console.log("✅ DELETE FOLDERS OK")
    console.groupEnd()

  } catch (e) {
    console.error("🔥 DELETE FOLDERS FAILED", e)

    // 🔁 rollback
    folders.value = foldersSnapshot
    uploadsByFolder.value = uploadsSnapshot
    currentFolderId.value = prevFolder

    alert("Erreur suppression dossiers")
    console.groupEnd()
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





const ensureEleveRoot = async ({ setCurrent = true } = {}) => {
  console.group("🧱 ensureEleveRoot")

  if (!userId.value) {
    console.error("❌ userId manquant (élève)")
    console.groupEnd()
    return null
  }

  try {
    creatingWorkspace.value = true

    const res = await gasPost("get_or_create_eleve_root", {
      prof_id: profId.value,
      eleve_id: userId.value
    })

    if (!res?.success) {
      throw new Error("ensureEleveRoot_failed")
    }

    const rootId =
      res.root_folder_id ??
      res.folder_id ??
      res.eleve_root_id ??
      null

    if (!rootId) {
      throw new Error("ensureEleveRoot_rootId_missing")
    }

    if (setCurrent && !currentFolderId.value) {
      currentFolderId.value = rootId
    }

    return rootId

  } catch (e) {
    eleveBlocked.value = true
    console.error("❌ ensureEleveRoot", e)
    return null

  } finally {
    creatingWorkspace.value = false
    console.groupEnd()
  }
}








const onDrop = async (targetFolderId) => {
  if (!draggedFiles.value.length) return

  const target = targetFolderId ?? null

  const previous = draggedFiles.value.map(f => ({
    file: f,
    folder_id: f.folder_id ?? null
  }))

  // UI optimistic
  draggedFiles.value.forEach(f => {
    const from = f.folder_id ?? null
    const to = target

    uploadsByFolder.value[from] =
      (uploadsByFolder.value[from] || []).filter(u => u.upload_id !== f.upload_id)

    if (!uploadsByFolder.value[to]) uploadsByFolder.value[to] = []
    uploadsByFolder.value[to].push({ ...f, folder_id: to })
  })

  try {
    await Promise.all(
      previous.map(p =>
        gasPost("moveuploadtofolder", {
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
  console.log("📥 pasteFromContext", clipboard.value)

  if (!clipboard.value.uploads.length && !clipboard.value.folders.length) {
    console.warn("⛔ rien à coller")
    return
  }

  // 🔥 destination UNIQUE
  const targetFolderId =
    contextMenu.value.type === "folder"
      ? contextMenu.value.target.folder_id
      : currentFolderId.value

  pasteSelection(targetFolderId)
  closeContextMenu()
}








const ensureProfRoot = async ({ setCurrent = true } = {}) => {
  if (currentEleveId.value) return null

  try {
    const data = await gasPost("get_or_create_prof_root", {
      prof_id: profId.value
    })

    if (!data?.success) {
      throw new Error("ensureProfRoot_failed")
    }

    // 🔥 VRAIE CLÉ BACKEND
    const rootId = data.sbs_root_id

    if (!rootId) {
      console.error("❌ GAS payload =", data)
      throw new Error("ensureProfRoot_root_missing")
    }

    profRootId.value = rootId
    profElevesFolderId.value = data.eleves_folder_id ?? null

    if (setCurrent && !currentFolderId.value) {
      currentFolderId.value = rootId
    }

    return rootId

  } catch (e) {
    console.error("❌ ensureProfRoot", e)
    return null
  }
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
const handleExplorerDrop = (e) => {
  isDragging.value = false
  if (isCurrentFolderOptimistic.value) {
  toast.info("Dossier en cours de création…")
  return
}

  if (isSharedMode.value || isReadOnlyShared.value) return

  const files = Array.from(e.dataTransfer?.files || [])
  if (!files.length) return

  // ✅ EXACTEMENT comme le picker
  uploader.value?.handleFiles(files)
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
  if (!profId.value) return

  console.log("🌐 FETCH ALL UPLOADS (GLOBAL)", {
    mode: finderMode.value
  })

  const payload = {
    prof_id: profId.value,
    ...(finderMode.value === "shared"
      ? {} // 🔑 PAS de eleve_id
      : isProfLike.value
        ? {}
        : { eleve_id: userId.value }
    )
  }

  try {
    const data = await gasPost("getalluploadsbyprof", payload)

    if (!data?.success) {
      throw new Error("fetchAllUploads_failed")
    }

    const uploads = Array.isArray(data.uploads) ? data.uploads : []

    const nextMap = Object.create(null)

    for (const u of uploads) {
      const fid = u.folder_id ?? null
      if (!nextMap[fid]) nextMap[fid] = []
      nextMap[fid].push(u)
    }

    // 🔄 reconcile (remplacement contrôlé)
    uploadsByFolder.value = {}
    for (const fid in nextMap) {
      uploadsByFolder.value[fid] = nextMap[fid]
    }

    writeUploadsCache(
      effectiveOwnerType.value,
      effectiveOwnerId.value,
      uploads
    )


  } catch (e) {
    console.error("❌ fetchAllUploadsOnce", e)
  }
}



const fetchSharedUploadsOnce = async () => {
  if (!profId.value) return

  console.log("🌐 FETCH SHARED UPLOADS (DEDICATED)")

  try {
    const data = await gasPost("getalluploadsbyprof", {
      prof_id: profId.value,
      shared_only: true
    })

    if (!data?.success) {
      throw new Error("fetchSharedUploads_failed")
    }

    const uploads = Array.isArray(data.uploads) ? data.uploads : []

    uploads.forEach(u => {
      const fid = u.folder_id ?? null
      if (!uploadsByFolder.value[fid]) {
        uploadsByFolder.value[fid] = []
      }
      uploadsByFolder.value[fid].push(u)
    })

    console.log("📦 shared uploads reçus =", uploads.length)

  } catch (e) {
    console.error("❌ fetchSharedUploadsOnce", e)
  }
}












const effectiveOwnerType = computed(() =>
  isProfLike.value ? "prof" : "eleve"
)

const effectiveOwnerId = computed(() =>
  isProfLike.value ? profId.value : userId.value
)
// recup folder partagés
async function fetchSharedFolders() {
  const data = await gasPost("getsharedfoldersforme", {
    user_id: userId.value
  })

  if (!data?.success) {
    sharedFolders.value = []
    return
  }

  sharedFolders.value = data.shared || []
}

function onQueued(payload) {
  previewVideoUrl.value = null

  let files, sessionId
if (isSharedMode.value || isReadOnlyShared.value) {
  toast.error("Ajout interdit dans un dossier partagé")
  return
}

  // normalise payload
  if (Array.isArray(payload)) {
    files = payload
    sessionId = uploadSession.value?.id || crypto.randomUUID()
  } else if (payload?.files) {
    files = payload.files
    sessionId = payload.sessionId || uploadSession.value?.id || crypto.randomUUID()
  } else {
    return
  }

  // 🔥 INIT OU EXTEND SESSION
  if (!uploadSession.value) {
    uploadSession.value = {
      id: sessionId,
      folderId: currentFolderId.value, // 🔥 DOSSIER FIGÉ
      total: files.length,
      done: 0
    }
  } else {
    uploadSession.value.total += files.length
  }

  // 🔥 TOUJOURS utiliser le dossier de la session
  addOptimisticUploads(
    files,
    uploadSession.value.folderId,
    uploadSession.value.id
  )

  // UI
}





function onQueuedAndClose(payload) {
  onQueued(payload)
  showUploadModal.value = false // ✅ LE BON FLAG
}




// recup dossier
async function fetchFolders() {
  if (finderMode.value === "shared") {
    console.log("⏭️ fetchFolders skipped (shared mode)")
    return
  }

  console.log("📁 FETCH FOLDERS — start")

  try {
    if (!auth.jwt || !auth.user?.prof_id) {
      console.warn("⛔ fetchFolders aborted — auth missing")
      return
    }

    const res = await gasPost("getfoldersbyprof", {
      prof_id: auth.user.prof_id,
      role: auth.user.role
    })

    if (!res?.success) {
      console.error("❌ fetchFolders failed", res)
      folders.value = []
      return
    }

    // ===============================
    // 🧼 NORMALIZE + MERGE SHARE STATE
    // ===============================
    const localShared = readSharedByMe()

    const normalized = (res.folders || []).map(f => {
      const apiShared = !!f.is_shared

      const mergedShared =
        typeof localShared[f.folder_id] === "boolean"
          ? localShared[f.folder_id]
          : apiShared

      return {
        ...f,
        parent_id: f.parent_id || null,
        owner_name: f.owner_name || null,
        is_system: Boolean(f.is_system),
        is_shared: mergedShared
      }
    })

    // ===============================
    // 🧠 HYDRATE STATE (préserver flags)
    // ===============================
    const oldById = new Map(folders.value.map(f => [f.folder_id, f]))

    folders.value = normalized.map(f => {
      const previous = oldById.get(f.folder_id)
      return {
        ...f,
        is_shared: previous?.is_shared || false
      }
    })

    foldersLoaded.value = true

    // ===============================
    // 💾 CACHE
    // ===============================
    writeFoldersCache(
      effectiveOwnerType.value,
      effectiveOwnerId.value,
      folders.value
    )

    console.log("✅ FETCH FOLDERS OK", {
      total: folders.value.length,
      shared: folders.value.filter(f => f.is_shared).length
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




// === PATCH createFolder (anti re-render / anti clignotement) ===
const createFolder = async () => {
  const name = prompt("Nom du dossier")
  if (!name?.trim()) return

  const parentId = currentFolderId.value ?? null
  const isEleveContext = !isProfLike.value

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

  editingFolderId.value = tmpId
  editingFolderName.value = tmpFolder.name

  await nextTick()
  folderRenameRefs.get(tmpId)?.focus()
  folderRenameRefs.get(tmpId)?.select()

  try {
    const res = await gasPost("createfolder", {
      prof_id: profId.value,
      owner_type: tmpFolder.owner_type,
      owner_id: tmpFolder.owner_id,
      parent_id: parentId,
      name: tmpFolder.name
    })

    if (!res?.success || !res.folder) {
      throw new Error("createfolder_failed")
    }

    const realFolder = res.folder

    const idx = folders.value.findIndex(f => f.folder_id === tmpId)
    if (idx !== -1) {
      folders.value.splice(idx, 1, {
        ...folders.value[idx],
        folder_id: realFolder.folder_id,
        parent_id: parentId,
        name: realFolder.name || folders.value[idx].name,
        _optimistic: false
      })
    }

    if (currentFolderId.value === tmpId) {
      currentFolderId.value = realFolder.folder_id
    }

    selectedFolders.value = [realFolder.folder_id]

    writeFoldersCache(
      effectiveOwnerType.value,
      effectiveOwnerId.value,
      folders.value
    )

  } catch (e) {
    folders.value = folders.value.filter(f => f.folder_id !== tmpId)
    alert("Erreur création dossier")
  } finally {
    editingFolderId.value = null
    editingFolderName.value = ""
  }
}









// ============================================================================
// 🗑️ Soft delete (UX instant : on retire localement)
// ============================================================================



const deleteSelectedUploads = async () => {
  const ids = [...selectedFiles.value]
  if (!ids.length) return

  console.log("🗑️ DELETE BATCH", ids)

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

    const removed = snapshots[fid].find(u => u.upload_id === id)
    if (removed) {
      trashedUploads.value.push({
        ...removed,
        deleted_at: new Date().toISOString()
      })
    }
  })

  selectedFiles.value = []

  try {
    const res = await gasPost("softdeleteuploads_batch", {
      prof_id: profId.value,
      upload_ids: ids
    })

    if (!res?.success) {
      throw new Error("backend_failed")
    }

    writeUploadsCache(
      effectiveOwnerType.value,
      effectiveOwnerId.value,
      Object.values(uploadsByFolder.value).flat()
    )

  } catch (e) {
    console.error("🔥 SOFTDELETE BATCH FAILED", e)

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







// ============================================================================
// ✏️ Rename inline (Enter / Blur = save, Esc = cancel)
// ============================================================================




const cancelRename = () => {
  editingId.value = null
  editingName.value = ""
}

const confirmRename = async (file) => {
  let baseName = (editingName.value || "").trim()
  if (!baseName) {
    cancelRename()
    return
  }

  const oldName = file.file_name

  // ===============================
  // 🔒 EXTENSION FIGÉE
  // ===============================
  const ext = oldName.includes(".")
    ? "." + oldName.split(".").pop()
    : ""

  // nettoyage : on enlève toute extension tapée par l'user
  baseName = baseName.replace(/\.[^/.]+$/, "")

  const newName = baseName + ext

  if (newName === oldName) {
    cancelRename()
    return
  }

  // ===============================
  // 🧠 ANTI-DOUBLON
  // ===============================
  const siblings = uploads.value.filter(
    u =>
      u.folder_id === file.folder_id &&
      u.upload_id !== file.upload_id
  )

  const finalName = getAutoRenamed(newName, siblings)

  const fid = file.folder_id ?? null
  const list = uploadsByFolder.value[fid]
  if (!list) return

  const idx = list.findIndex(u => u.upload_id === file.upload_id)
  if (idx === -1) return

  // ===============================
  // ⚡ UI OPTIMISTIC
  // ===============================
  const prevName = list[idx].file_name
  list[idx].file_name = finalName
  cancelRename()

  try {
    const data = await gasPost("renameupload", {
      prof_id: profId.value,
      upload_id: file.upload_id,
      new_name: finalName
    })

    if (!data?.success) {
      throw new Error("renameupload_failed")
    }

    writeUploadsCache(
      effectiveOwnerType.value,
      effectiveOwnerId.value,
      Object.values(uploadsByFolder.value).flat()
    )

  } catch (e) {
    // 🔁 rollback
    list[idx].file_name = prevName
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
type: "folder",    target: folder
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
    f => f.parent_id === folder.parent_id && f.folder_id !== folder.folder_id
  )

  const existing = siblings.map(f => f.name)
  const base = newName.replace(/\s\(\d+\)$/, "")
  let i = 1
  while (existing.includes(newName)) {
    newName = `${base} (${i})`
    i++
  }

  if (!newName || newName === folder.name) {
    cancelRenameFolder()
    return
  }

  const oldName = folder.name
  pushUndo()
  folder.name = newName
  cancelRenameFolder()

  try {
    const data = await gasPost("renamefolder", {
      prof_id: profId.value,
      folder_id: folder.folder_id,
      new_name: newName
    })

    if (!data?.success) throw new Error("renamefolder_failed")

    writeFoldersCache(
      effectiveOwnerType.value,
      effectiveOwnerId.value,
      folders.value
    )

  } catch (e) {
    folder.name = oldName
    alert("Erreur renommage dossier")
  }
}

const getPreviewUrl = (url) => {
  if (!url) return null

  // Google Drive (tous formats)
  if (url.includes("drive.google.com")) {
    // uc?id=XXX
    const uc = url.match(/id=([^&]+)/)
    if (uc?.[1]) {
      return `https://drive.google.com/file/d/${uc[1]}/view`
    }

    // déjà /file/d/XXX
    const fd = url.match(/\/file\/d\/([^/]+)/)
    if (fd?.[1]) {
      return `https://drive.google.com/file/d/${fd[1]}/view`
    }
  }

  return url
}

const openFile = (file) => {
  const folder = foldersById.value?.[file.folder_id]

  // 📂 PARTITIONS
  if (folder?.name === "Partitions" && file.file_url) {
    const previewUrl = getPreviewUrl(file.file_url)
    console.log("👁️ PREVIEW =", previewUrl)
    window.open(previewUrl, "_blank", "noopener")
    return
  }

  // 🎥 VIDEO
  if (file.file_type?.startsWith("video/")) {
    previewVideoUrl.value = file.file_url
    return
  }

  // 📄 DEFAULT
  if (file.file_url) {
    window.open(file.file_url, "_blank", "noopener")
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
    type: isTrashMode.value ? "trash-file" : "file",
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










const explorerKey = ref(0)

const onFolderDrop = async (targetParentId) => {
  if (!draggedFolder.value) return

  isMovingFolder.value = true

  const folder = draggedFolder.value
  const previousParent = folder.parent_id ?? null

  folder.parent_id = targetParentId ?? null
  currentFolderId.value = targetParentId ?? null

  try {
    const data = await gasPost("movefolder", {
      prof_id: profId.value,
      folder_id: folder.folder_id,
      new_parent_id: targetParentId ?? null
    })

    if (!data?.success) {
      throw new Error("movefolder_failed")
    }

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
  // 📁 COPIE DOSSIER (1 seul)
  if (selectedFolders.value.length === 1) {
    const folderId = selectedFolders.value[0]
    const folder = folders.value.find(f => f.folder_id === folderId)
    if (!folder) return

    clipboard.value = {
      mode: "copy",
      uploads: [],
folders: [folder.folder_id]
    }
    return
  }

  // 📄 COPIE FICHIERS
  if (selectedFiles.value.length) {
    const files = selectedFiles.value
      .map(id =>
        Object.values(uploadsByFolder.value)
          .flat()
          .find(u => u.upload_id === id)
      )
      .filter(Boolean)

    clipboard.value = {
      mode: "copy",
      uploads: files,
      folders: []
    }
  }
}


const pasteSelection = async (target = null) => {
  const finalTarget = target ?? currentFolderId.value ?? null
  if (!finalTarget) return

  const mode = clipboard.value.mode
  const files = clipboard.value.uploads.filter(u => u?.upload_id)
  const foldersIds = [...clipboard.value.folders]

  clipboard.value = { mode: null, uploads: [], folders: [] }
  selectedFiles.value = []
  selectedFolders.value = []

  try {
    // 📁 COPY DOSSIER (1)
    if (foldersIds.length === 1) {
      const sourceId = foldersIds[0]

      await gasPost("copyfolderrecursive", {
        prof_id: profId.value,
        source_folder_id: sourceId,
        target_parent_id: finalTarget
      })

      await fetchFolders(true)
      console.log("📁 AFTER fetchFolders", {
  foldersLen: folders.value.length,
  foldersLoaded: foldersLoaded.value,
  currentFolderId: currentFolderId.value
})

      await fetchAllUploadsOnce()
      return
    }

    if (!files.length) return

    // ✂️ CUT
    if (mode === "cut") {
      files.forEach(f => {
        const from = f.folder_id ?? null
        const to = finalTarget

        uploadsByFolder.value[from] =
          (uploadsByFolder.value[from] || []).filter(u => u.upload_id !== f.upload_id)

        if (!uploadsByFolder.value[to]) uploadsByFolder.value[to] = []
        uploadsByFolder.value[to].push({ ...f, folder_id: to })
      })

      await Promise.all(
        files.map(f =>
          gasPost("moveuploadtofolder", {
            prof_id: profId.value,
            upload_id: f.upload_id,
            folder_id: finalTarget
          })
        )
      )

      writeUploadsCache(
        effectiveOwnerType.value,
        effectiveOwnerId.value,
        Object.values(uploadsByFolder.value).flat()
      )
      return
    }

    // 📄 COPY FILES
    for (const original of files) {
      const siblings = (uploadsByFolder.value[finalTarget] || [])
      const newName = getAutoRenamed(original.file_name, siblings)

      const tmp = {
        ...original,
        upload_id: `TMP_${crypto.randomUUID()}`,
        folder_id: finalTarget,
        file_name: newName,
        _optimistic: true
      }

      if (!uploadsByFolder.value[finalTarget]) {
        uploadsByFolder.value[finalTarget] = []
      }
      uploadsByFolder.value[finalTarget].push(tmp)

      const data = await gasPost("copyupload", {
        prof_id: profId.value,
        upload_id: original.upload_id,
        target_folder_id: finalTarget,
        new_name: newName
      })

      if (!data?.success || !data.upload) {
        throw new Error("copyupload_failed")
      }

      Object.assign(tmp, data.upload)
      delete tmp._optimistic
    }

    writeUploadsCache(
      effectiveOwnerType.value,
      effectiveOwnerId.value,
      Object.values(uploadsByFolder.value).flat()
    )

  } catch (e) {
    console.error("❌ pasteSelection", e)
    alert("Erreur lors du collage")
  }
}






const cutSelection = () => {
  // 📁 CUT DOSSIER (1 seul)
  if (selectedFolders.value.length === 1) {
    clipboard.value = {
      mode: "cut",
      uploads: [],
      folders: [selectedFolders.value[0]]
    }
    return
  }

  // 📄 CUT FICHIERS
  if (selectedFiles.value.length) {
    const files = selectedFiles.value
      .map(id =>
        Object.values(uploadsByFolder.value)
          .flat()
          .find(u => u.upload_id === id)
      )
      .filter(Boolean)

    clipboard.value = {
      mode: "cut",
      uploads: files,
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
  // 🔥 reset recherche
  searchQuery.value = ""

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
  const root = profRootFolder.value
  currentFolderId.value = root?.folder_id || null
}


// ============================================================================
// 👀 WATCHERS — MINIMAUX, SANS FETCH, SANS EFFET DE BORD
// ============================================================================
const explorerScroll = ref(null)
watch(
  () => ({
    folders: foldersLoaded.value,
    uploads: Object.keys(uploadsByFolder.value).length
  }),
  ({ folders, uploads }) => {
    if (!folders || !uploads) return
    if (mountedDone.value) return

    console.log("📁📦 folders + uploads READY")

    mountedDone.value = true
  }
)
watchEffect(() => {
  console.log("NAV", {
    currentFolderId: currentFolderId.value,
    foldersLoaded: foldersLoaded.value,
    visibleFolders: visibleFolders.value.length,
    breadcrumb: breadcrumb.value.map(b => b.name)
  })
})

watch(
  () => ({
    currentFolderId: currentFolderId.value,
    foldersLen: folders.value.length,
    visibleFolders: visibleFolders.value.length
  }),
  v => {
    console.log("🧪 FINDER STATE", v)
  }
)

watch([currentFolderId, finderMode], saveFinderState)
watch(searchQuery, saveFinderState)

watch(currentFolderId, async () => {
  const el = explorerScroll.value
  if (!el) return

  const y = el.scrollTop

  await nextTick()

  el.scrollTop = y
})
watch(currentFolderId, () => {
  if (isSearching.value) {
    searchQuery.value = ""
  }
})

watch(currentFolderId, (id) => {
    if (isAutoOpening.value) return

  if (finderMode.value !== "shared") return
  if (!id || id === SHARED_ROOT_ID) return

  let cur = id
  let guard = 0
  let allowed = false

  while (cur && guard++ < 20) {
    if (allowedSharedRootIds.value.includes(cur)) {
      allowed = true
      break
    }
    cur = foldersById.value[cur]?.parent_id
  }

  if (!allowed) {
    console.warn("⛔ shared scope violation, reset")
    currentFolderId.value = SHARED_ROOT_ID
  }
})



watch(currentFolderId, (id) => {
    if (isAutoOpening.value) return
if (!isProfLike.value) return   // 🔥 FIX ABSOLU
    if (finderMode.value === "shared") return   // 🔥 FIX

  if (role.value === "admin") return
  if (!id || !profRootFolder.value) return

  let cur = id
  let ok = false
  let guard = 0

  while (cur && guard++ < 20) {
    if (cur === profRootFolder.value.folder_id) {
      ok = true
      break
    }
    cur = foldersById.value[cur]?.parent_id
  }

  if (!ok) {
    console.warn("⛔ PROF hors scope → reset racine")
    currentFolderId.value = profRootFolder.value.folder_id
  }
})

watch(currentFolderId, (id) => {
    if (isAutoOpening.value) return

  if (finderMode.value === "shared") return   // ✅ FIX CRITIQUE
  if (searchQuery.value) return

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

watch(finderMode, mode => {
  if (mode !== "trash") return

  // sécurité : aucune sélection persistante
  selectedFiles.value = []
  selectedFolders.value = []
})

/* ============================================================================
 * 2️⃣ UI — NAVIGATION DOSSIERS (RESET ÉTAT / ANIM)
 * ============================================================================ */
watch(currentFolderId, () => {




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


const triggerUploadCore = () => {
  if (isCurrentFolderOptimistic.value) {
  toast.info("Dossier en cours de création…")
  return
}

  if (isSharedMode.value || isReadOnlyShared.value) return
  uploader.value?.openPicker?.()
}




const blockNativeContextMenu = (e) => {
  if (contextMenu.value.visible || addMenu.value.visible) {
    e.preventDefault()
  }
}
// ============================================================================
// 🚀 LIFECYCLE
// ============================================================================
onMounted(async () => {
  console.log("🚀 ELEVEUPLOADS MOUNT")

  if (!auth.user || !auth.user.role) {
    await new Promise(resolve => {
      const stop = watch(
        () => auth.user?.role,
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

  console.log("🔐 USER READY", {
    role: auth.user.role,
    userId: auth.user.user_id,
    profId: auth.user.prof_id
  })




    previewVideoUrl.value = null

  window.addEventListener("keydown", onKeyDown)
window.addEventListener("contextmenu", blockNativeContextMenu)
// 🔥 MOBILE FIX — détecter scroll pour annuler long-press
const el = explorerScroll.value
if (el) {
  el.addEventListener("scroll", onExplorerScroll, { passive: true })
}

  console.group("🚀 ELEVEUPLOADS MOUNT")

  // =====================================================
  // 0️⃣ WAIT AUTH READY (iOS SAFE)
  // =====================================================


// ✅ auth minimale
// attendre auth READY
if (!auth.authReady) {
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

if (!auth.jwt) {
  console.error("❌ jwt absent après authReady")
  return
}


// ⚠️ profId requis UNIQUEMENT côté prof
if (isProfLike.value && !profId.value) {
  console.error("❌ profId manquant (mode prof)")
  return
}


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

  if (!auth.jwt) return



  console.log("🔐 auth OK", {
    role: role.value,
    userId: userId.value,
    profId: profId.value
  })
  // 🗑️ prefetch corbeille
fetchTrash()
// 🔗 prefetch partagé (background)
prefetchSharedData()
// 🔥 PREFETCH UPLOADS PARTAGÉS (background)
//fetchAllUploadsOnce().then(() => {
 // sharedUploadsPrefetched.value = true
  //console.log("⚡ shared uploads prefetched")
//})

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
  if (finderMode.value === "shared") {
    console.log("🔗 MODE ÉLÈVE SHARED — skip normal mount")

    // 🔥 uniquement le prefetch (non bloquant)
    prefetchSharedData()
// 🔥 prefetch shared uploads (background)
fetchSharedUploadsOnce().then(() => {
  console.log("⚡ shared uploads prefetched")
})
    mountedDone.value = true
    return
  }


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
const cachedUploads = readUploadsCache("eleve", userId.value)
if (Array.isArray(cachedUploads) && cachedUploads.length) {
  uploadsByFolder.value = {}
  cachedUploads.forEach(u => {
    const fid = u.folder_id ?? null
    if (!uploadsByFolder.value[fid]) uploadsByFolder.value[fid] = []
    uploadsByFolder.value[fid].push(u)
  })
  console.log("⚡ CACHE UPLOADS ÉLÈVE HYDRATÉ", cachedUploads.length)
}


  // --- ensure root (UNE SEULE FOIS)
// 🔁 restore finder AVANT de forcer la racine
const restored = restoreFinderState()
console.log("🧭 RESTORE STATE", {
  restored,
  currentFolderId: currentFolderId.value,
  foldersLen: folders.value.length,
  foldersLoaded: foldersLoaded.value
})

// 🧱 ensureProfRoot (SAFE)
if (!restored && !currentFolderId.value) {
  console.log("🧱 ensureEleveRoot")
  const id = await ensureEleveRoot({ setCurrent: true })
  if (id) currentFolderId.value = id
}




    // --- fetch folders (SOURCE DE VÉRITÉ)
if (!hydratedFromCache.value) {
  loaderStep.value = "folders"
}

 if (!hydratedFromCache.value) {
  await fetchFolders(true)
  console.log("📁 AFTER fetchFolders", {
  foldersLen: folders.value.length,
  foldersLoaded: foldersLoaded.value,
  currentFolderId: currentFolderId.value
})

  foldersLoaded.value = true
} else {
  // 🔥 refresh silencieux
  fetchFolders(true)
}


    // --- sécurité root
   if (!currentFolderId.value) {
  currentFolderId.value = profRootFolder.value?.folder_id || null
}


    // --- fetch uploads GLOBAL (UNE FOIS)
// --- fetch uploads GLOBAL
if (!hydratedFromCache.value) {
  loaderStep.value = "uploads"
  await fetchAllUploadsOnce()   // ⏳ bloquant UNIQUEMENT sans cache
} else {
  fetchAllUploadsOnce()         // ⚡ background si cache
}

// 🔥 AUTO-OPEN dossier contenant des uploads (élève)
// 🔥 AUTO-OPEN SAFE (ÉLÈVE ONLY)


    console.log("📁 folders élève =", folders.value.length)
    console.log("📦 uploadsByFolder =", Object.keys(uploadsByFolder.value).length)
    await nextTick()

navigationLocked.value = false

    console.log("✅ ÉLÈVE READY")
    console.groupEnd()
    console.groupEnd()
    return
  }

  // =====================================================
  // 👨‍🏫 MODE PROF
  // =====================================================
  console.group("👨‍🏫 MODE PROF")
// 🔁 RESTORE NAVIGATION FINDER (PROF)
const restored = restoreFinderState()
console.log("🧭 RESTORE STATE", {
  restored,
  currentFolderId: currentFolderId.value,
  foldersLen: folders.value.length,
  foldersLoaded: foldersLoaded.value
})

console.log("♻️ finder restored (prof) =", restored)

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

  // 🔥 HYDRATE UPLOADS CACHE
  const cachedUploads = readUploadsCache("prof", profId.value)
  if (Array.isArray(cachedUploads) && cachedUploads.length) {
    uploadsByFolder.value = {}
    cachedUploads.forEach(u => {
      const fid = u.folder_id ?? null
      if (!uploadsByFolder.value[fid]) uploadsByFolder.value[fid] = []
      uploadsByFolder.value[fid].push(u)
    })
    console.log("⚡ CACHE UPLOADS PROF HYDRATÉ", cachedUploads.length)
  }

if (!restored) {
  currentFolderId.value =
    profRootFolder.value?.folder_id || null
}

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
if (!hydratedFromCache.value) {
  loaderStep.value = "folders"
}

console.log("📦 fetchFolders (prof)")

if (!hydratedFromCache.value) {
  await fetchFolders(true)
  console.log("📁 AFTER fetchFolders", {
  foldersLen: folders.value.length,
  foldersLoaded: foldersLoaded.value,
  currentFolderId: currentFolderId.value
})

  foldersLoaded.value = true
} else {
  // 🔄 refresh silencieux
  fetchFolders(true)
}

// 🔥 FIX CRITIQUE — forcer le dossier prof (non admin)
if (!restored && role.value !== "admin") {
  const root = profRootFolder.value
  if (root) {
    currentFolderId.value = root.folder_id
  }
}



  // --- sécurité root
if (!currentFolderId.value) {
  currentFolderId.value =
    profRootFolder.value?.folder_id || null
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
// 🔓 UNLOCK ICI (🔥 CLÉ)
await nextTick()
navigationLocked.value = false

  console.log("📁 folders prof =", folders.value.length)
  console.log("📦 uploadsByFolder =", Object.keys(uploadsByFolder.value).length)
  console.log("📁 currentFolderId =", currentFolderId.value)

  // -------------------------------------------------
  // 6️⃣ AUTRES DATA NON BLOQUANTES
  // -------------------------------------------------

previewVideoUrl.value = null



// 🔥 ARMEMENT INITIAL (UNE FOIS)
if (!currentFolderId.value) {
  if (finderMode.value === "shared") {
    currentFolderId.value = SHARED_ROOT_ID
  } else {
    currentFolderId.value =
      isProfLike.value
        ? profRootFolder.value?.folder_id || null
        : eleveRootId.value
  }
}



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

<style>
  .upload-status {
  font-size: 12px;
  opacity: .8;
}
.upload-item.error .upload-status {
  color: #ff6b6b;
}

/* =========================================================
   🌑 SUNBASS FINDER — FULL REPLACE (CLEAN / SAAS)
   ========================================================= */
.no-anim * {
  transition: none !important;
  animation: none !important;
}

/* ===================== TOKENS ===================== */
.uploads-page.dark-theme {
  --bg: #121212;
  --panel: #161616;
  --panel-2: #1a1a1a;
  --border: #242424;
  --border-soft: #2f2f2f;

  --text: #f2f2f2;
  --muted: #a7a7a7;

  --accent: #ff8c00;
  --accent-2: #ff9f2d;

  --blue: #5a8cff;     /* partagé avec moi */
  --blue-2: #3399ff;   /* partagé par moi */
}

/* ===================== PAGE ===================== */
.uploads-page {
  padding: 32px;
}
@media (max-width: 768px) {
  .uploads-page { padding: 12px; }
}

.dark-theme {
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}

/* ===============================
   🧭 HEADER — ALIGNEMENT DES BOUTONS
   =============================== */

.uploads-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}


.uploads-header > div:first-child {
  flex: 1;
  min-width: 0;
}

/* ✅ colonne d’actions à droite */
.header-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  padding-top: 2px; /* micro align optique avec le h3 */
  flex-shrink: 0;
}

/* force les actions à être bien alignées */
.upload-badge,
.add-btn {
  align-self: flex-start;
}



.subtitle {
  font-size: .85rem;
  color: var(--muted);
}

/* tabs */
/* ===============================
   🧭 TABS FINDER — RESPONSIVE FIX
   =============================== */

.finder-tabs {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.finder-tabs .tab {
  padding: 6px 12px;
  font-size: 0.75rem;
  line-height: 1;
  border-radius: 999px;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  color: #aaa;
  white-space: nowrap;
}

/* actif */
.finder-tabs .tab.active {
  background: rgba(255,140,0,0.18);
  color: #ffb347;
  border-color: rgba(255,140,0,0.55);
}

/* hover desktop only */
@media (hover: hover) {
  .finder-tabs .tab:hover {
    border-color: rgba(255,140,0,0.45);
  }
}

/* 📱 mobile : ultra compact */
@media (max-width: 520px) {
  .finder-tabs {
    gap: 4px;
  }

  .finder-tabs .tab {
    padding: 4px 10px;
    font-size: 0.7rem;
  }
}


/* search */
.search-input {
  width: min(520px, 100%);
  margin-top: 8px;
  background: #151515;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  color: var(--text);
}
.search-input:focus {
  outline: none;
  border-color: rgba(255,140,0,.55);
  box-shadow: 0 0 0 3px rgba(255,140,0,.15);
}

/* badge upload */
.upload-badge {
  margin-left: auto;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: .8rem;
  background: rgba(255,140,0,.15);
  border: 1px solid var(--accent);
  color: #ffb347;
  cursor: pointer;
}
.upload-badge:hover {
  background: rgba(255,140,0,.25);
}
.upload-badge.done {
  background: rgba(76,175,80,.15);
  border-color: #4caf50;
  color: #7dff9c;
  cursor: default;
}

/* ===============================
   ➕ BOUTON AJOUTER — RESPONSIVE
   =============================== */

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255,140,0,0.15);
  border: 1px solid rgba(255,140,0,0.45);
  color: #ffb347;
  font-weight: 600;
  font-size: 0.75rem;
  box-shadow: none;
  transition: background .15s, border-color .15s;
}

.add-btn .icon {
  font-size: 0.95rem;
  line-height: 1;
}

/* hover desktop */
@media (hover: hover) {
  .add-btn:hover {
    background: rgba(255,140,0,0.25);
    border-color: rgba(255,140,0,0.65);
  }
}

.add-btn.active {
  box-shadow: 0 0 0 2px rgba(255,140,0,0.25);
}

/* 📱 mobile : ultra discret */
@media (max-width: 520px) {
  .add-btn {
    padding: 4px 10px;
    font-size: 0.7rem;
    gap: 4px;
  }

  /* optionnel : cacher le texte */
  .add-btn:not(:hover) span:not(.icon) {
    display: none;
  }
}
.upload-item[data-type="pdf"] .file-icon { color: #ff6b6b; }
.upload-item[data-type="audio"] .file-icon { color: #6c7cff; }
.upload-item[data-type="image"] .file-icon { color: #7dff9c; }
.explorer-content {
  min-height: 40vh;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: none;
}
.explorer-zone {
  scroll-behavior: auto;
  overflow-anchor: none; /* 🔥 clé */
}


/* ===================== BREADCRUMB ===================== */
/* ===============================
   🧭 BREADCRUMB — VERSION CLEAN
   =============================== */

.finder-breadcrumb {
  gap: 4px;
  padding: 6px 8px;
}

.finder-breadcrumb .crumb {
  background: none;
  border: none;
  padding: 4px 6px;
  font-size: 0.78rem;
  color: #cfcfcf;
  border-radius: 6px;
}

.finder-breadcrumb .crumb::after {
  content: "›";
  margin-left: 6px;
  opacity: 0.35;
}

.finder-breadcrumb .crumb:last-child::after {
  content: "";
}

.finder-breadcrumb .crumb:last-child {
  color: #ffb347;
  font-weight: 600;
}

.finder-breadcrumb .crumb:hover {
  background: rgba(255,255,255,0.05);
}

.crumb {
  padding: 6px 12px;
  border-radius: 999px;
  background: #1c1c1c;
  border: 1px solid var(--border-soft);
  font-size: .78rem;
  cursor: pointer;
}
.crumb:hover {
  border-color: rgba(255,140,0,.45);
}
.crumb:last-child {
  background: rgba(255,140,0,.16);
  border-color: rgba(255,140,0,.55);
  font-weight: 600;
}
.crumb.disabled {
  opacity: .6;
  cursor: default;
}

/* ===================== EXPLORER ===================== */
.explorer-zone {
  padding: 14px;
  border-radius: 18px;
  background: rgba(255,255,255,.02);
  border: 1px solid var(--border);
  position: relative;
}
.explorer-zone.disabled {
  opacity: .85;

}

/* ===================== ITEMS ===================== */
.upload-item {
  display: flex;
  align-items: center;
  gap: 8px;

  margin-bottom: 4px;        /* 🔥 gros gain visuel */
  padding: 4px 8px;          /* plus dense */
  min-height: 36px;          /* toujours confortable */

  border-radius: 10px;       /* moins “card” */
  background: #151515;       /* flat = plus compact */
  border: 1px solid rgba(255,255,255,.06);

  transition: background .12s, border-color .12s;
}

.upload-item:hover {
  border-color: rgba(255,140,0,.45);
  background: rgba(255,140,0,.05);
}

.upload-item.selected {
  border-color: rgba(255,140,0,.8);
  background: rgba(255,140,0,.12);

  /* 🔥 moins épais → carte plus dense */
  box-shadow: 0 0 0 2px rgba(255,140,0,.12);
}
.upload-item[draggable="true"] { cursor: grab; }
.upload-item[draggable="true"]:active { cursor: grabbing; opacity: .6; }

.upload-item.cut {
  opacity: 0.4;
  filter: grayscale(0.4);
}
.upload-item.optimistic { opacity: .6; pointer-events: none; }

/* ===================== DOSSIERS ===================== */
.upload-item.folder {
  font-weight: 600;
}
.upload-item.folder.active {
  border-color: rgba(255,140,0,.9);
  background: rgba(255,140,0,.16);
}

.folder-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  padding: 6px 10px;
  border-left: 3px solid transparent;
  border-radius: 10px;
}

/* shared */
.folder-main.is-shared {
  background: rgba(90,140,255,.08);
  border-left-color: var(--blue);
}
.folder-main.shared-by-me {
  background: rgba(51,153,255,.08);
  border-left-color: var(--blue-2);
}

/* états */
.folder.pending {
  opacity: .55;
  pointer-events: none;
}
.folder.pending::after {
  content: "⏳";
  margin-left: auto;
}

/* icon */
.folder-icon {
  font-size: 1.25rem;
  color: var(--accent-2);
}

/* ===================== FICHIERS ===================== */
.file-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}
.file-icon {
    width: 22px;
  text-align: center;
  flex-shrink: 0;
  opacity: .9;
  font-size: 1.25rem;
}
.file-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.file-path {
  font-size: .75rem;
  color: var(--muted);
}

/* ===================== RENAME ===================== */
.rename-input {
  width: min(420px, 100%);
  height: 34px;
  padding: 6px 10px;
  background: #101010;
  border: 1px solid rgba(255,140,0,.65);
  border-radius: 10px;
  color: var(--text);
}
.rename-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255,140,0,.15);
}

/* ===================== CONTEXT MENU ===================== */
.context-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9998;
}
.context-menu {
  position: fixed;
  z-index: 9999;
  background: #141414;
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  padding: 4px;
  min-width: 160px;
  box-shadow: 0 10px 30px rgba(0,0,0,.45);
}
.context-item {
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-size: .85rem;
}
.context-item:hover {
  background: rgba(255,140,0,.12);
}
.context-item.danger {
  color: #ff6b6b;
}
.context-item.danger:hover {
  background: rgba(255,80,80,.15);
}

/* ===================== LOADER ===================== */
.loader-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  background: rgba(10,10,12,.78);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===================== EMPTY / STATES ===================== */
.empty-state,
.shared-loading,
.search-empty {
  padding: 32px;
  text-align: center;
  color: var(--muted);
}
.search-empty button {
  margin-top: 12px;
  background: none;
  border: 1px solid var(--accent);
  color: var(--accent);
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
}
.explorer-zone,
.explorer-content {
  scroll-behavior: auto;
}

.uploads-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.uploads-header,
.finder-breadcrumb {
  flex-shrink: 0;
}
.explorer-zone {
  flex: 1;
  overflow-y: auto;
  min-height: 0; /* 🔥 CRITIQUE */
}

/* ================================
   🧱 LOADER OVERLAY
================================ */
.loader-overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 10, 10, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

/* ================================
   ⏳ WORKFLOW LOADER
================================ */
.workflow-loader {
  background: rgba(20, 20, 20, 0.9);
  padding: 22px 26px;
  border-radius: 14px;
  min-width: 220px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.35);
}

.workflow-loader strong {
  display: block;
  margin-top: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #f1f1f1;
}

.workflow-loader .sub {
  display: block;
  margin-top: 4px;
  font-size: 0.75rem;
  color: #9ca3af;
}

/* ================================
   🔴 DOTS ANIMATION
================================ */
.workflow-loader .dots {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.workflow-loader .dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #7c2d12; /* rouge foncé */
  opacity: 0.3;
  animation: dotsPulse 1.4s infinite ease-in-out;
}

.workflow-loader .dots span:nth-child(2) {
  animation-delay: 0.15s;
}
.workflow-loader .dots span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes dotsPulse {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.3;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* ================================
   🔗 SHARED LOADING MESSAGE
================================ */
.shared-loading {
  padding: 14px;
  text-align: center;
  font-size: 0.8rem;
  color: #9ca3af;
  opacity: 0.85;
}

/* ================================
   🚫 ÉLÈVE BLOQUÉ
================================ */
.eleve-blocked {
  margin: 40px auto;
  max-width: 420px;
  text-align: center;
  background: rgba(30,30,30,0.85);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 15px 30px rgba(0,0,0,0.3);
}

.eleve-blocked h3 {
  font-size: 1rem;
  margin-bottom: 8px;
  color: #facc15;
}

.eleve-blocked p {
  font-size: 0.8rem;
  color: #d1d5db;
  line-height: 1.4;
}
.upload-progress {
  margin-top: 6px;
  height: 3px;
  width: 100%;
  background: rgba(255,255,255,.08);
  border-radius: 2px;
  overflow: hidden;
}

.upload-progress span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #f5c16c, #facc15);
  transition: width .2s linear;
}
.search-wrapper {
  position: relative;
}

.search-input {
  padding-right: 34px; /* place pour la croix */
}

.search-clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);

  width: 22px;
  height: 22px;
  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(255,255,255,.18);
  color: #fff;
margin-top:4px;
  border: none;
  cursor: pointer;
  z-index: 2;

  padding: 0; /* 🔥 important */
}


.search-clear:hover {
  background: rgba(255,255,255,.25);
  color: #fff;
  transform: translateY(-50%) scale(1.05);
}
.file-main,
.folder-main {
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}
.file-info,
.folder-info {
  pointer-events: none;
}
.upload-actions {
  pointer-events: auto;
  position: relative;
  z-index: 20;
}

.upload-actions button {
  pointer-events: auto;
}
.upload-item {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
}

/* ===============================
   🧨 BOUTON DANGER — VIDER CORBEILLE
   =============================== */
   /* ===============================
   🗑️ HEADER CORBEILLE
   =============================== */
.trash-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 0;
}

.danger-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  padding: 12px 18px;
  border-radius: 14px;

  background: linear-gradient(180deg, #ff4d4f, #c81d25);
  color: #fff;
  font-weight: 600;
  font-size: 14px;

  border: 1px solid rgba(255,255,255,.15);
  box-shadow:
    0 10px 30px rgba(200, 29, 37, .45),
    inset 0 1px 0 rgba(255,255,255,.15);

  cursor: pointer;
  user-select: none;
  transition: all .2s ease;
}

/* hover */
.danger-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow:
    0 16px 40px rgba(200, 29, 37, .6),
    inset 0 1px 0 rgba(255,255,255,.2);
}

/* active */
.danger-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow:
    0 8px 18px rgba(200, 29, 37, .4),
    inset 0 2px 6px rgba(0,0,0,.25);
}

/* disabled */
.danger-btn:disabled {
  opacity: .45;
  cursor: not-allowed;
  box-shadow: none;
  filter: grayscale(1);
}

/* focus clavier */
.danger-btn:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(255, 77, 79, .35),
    0 10px 30px rgba(200, 29, 37, .45);
}

/* ===============================
   🗑️ ACTIONS CORBEILLE (ICÔNES)
   =============================== */
.trash-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.08);

  font-size: 16px;
  cursor: pointer;

  transition: all .18s ease;
  user-select: none;
}

/* hover neutre */
.icon-btn:hover {
  background: rgba(255,255,255,.12);
}

/* danger */
.icon-btn.danger {
  background: rgba(255, 77, 79, .12);
  border-color: rgba(255, 77, 79, .25);
}

.icon-btn.danger:hover {
  background: rgba(255, 77, 79, .22);
}

/* active */
.icon-btn:active {
  transform: scale(.95);
}

/* focus clavier */
.icon-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(255,255,255,.25);
}

.sbs-cancel-btn {
  appearance: none;
  border: none;
  cursor: pointer;

  width: 28px;
  height: 28px;
  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(255, 107, 107, 0.15);
  color: #ff6b6b;

  transition: all .15s ease;
}

.sbs-cancel-btn .icon {
  display: block;
  font-size: 14px;
  line-height: 1;
  transform: translateY(-0.5px); /* 🎯 micro-fix visuel */
}

.sbs-cancel-btn:hover {
  background: rgba(255, 107, 107, 0.25);
}

.sbs-cancel-btn:active {
  transform: scale(.95);
}

.upload-item.folder strong {
  pointer-events: none;
}

.upload-item.folder,
.upload-item.folder * {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

.upload-form {
  position: relative;
  z-index: 50;
  pointer-events: auto;
}
.upload-modal {
  width: 480px;
  max-width: 92vw;
}

.upload-modal .upload-form {
  margin-top: 12px;
}


.sbs-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 10, 0.65);
  backdrop-filter: blur(6px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-modal {
  width: 520px;

  max-width: 92vw;
  background: #141414;
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
  animation: modalIn 0.18s ease-out;
}

.upload-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  font-weight: 600;
}

.upload-modal-body {
  padding: 18px;
}

.close-btn {
  background: none;
  border: none;
  color: #aaa;
  font-size: 20px;
  cursor: pointer;
}

.close-btn:hover {
  color: #fff;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.upload-modal {
  display: flex !important;
  flex-direction: column !important;
}
.sbs-modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}


.sbs-modal {
  position: relative !important;
  left: auto !important;
  right: auto !important;
  transform: none !important;
  margin: 0 !important;
}
.video-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(6px);
}

.video-overlay video {
  width: auto;
  max-width: 92vw;
  max-height: 85vh;

  background: #000;
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0,0,0,.6);

  outline: none;
}

/* mobile safe */
@media (max-width: 768px) {
  .video-overlay video {
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }
}
.video-overlay {
  cursor: zoom-out;
}
.video-close {
  position: fixed;
  top: 14px;
  right: 14px;
  z-index: 10000;

  width: 40px;
  height: 40px;
  border-radius: 50%;

  background: rgba(0,0,0,.6);
  color: #fff;
  border: none;
  font-size: 22px;
}
.video-close {
  touch-action: manipulation;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

/* Overlay plein écran */
.sbs-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* Modale = zone de drop */
.upload-modal.dropzone {
  width: min(92vw, 560px);
  height: min(70vh, 420px); /* 🔥 GRANDE ZONE */
  border-radius: 18px;
  border: 2px dashed rgba(255,255,255,0.35);
  background: linear-gradient(
    180deg,
    rgba(255,255,255,0.04),
    rgba(255,255,255,0.02)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Feedback drag */
.upload-modal.dropzone.drag-active {
  border-color: #ff8c2b; /* SBS orange */
  background: rgba(255,140,43,0.08);
  transform: scale(1.02);
}

/* Contenu centré */
.drop-content {
  pointer-events: none; /* 🔥 toute la zone drop */
  text-align: center;
  color: #fff;
}

.drop-content .icon {
  font-size: 42px;
  margin-bottom: 12px;
}

.drop-content .title {
  font-size: 18px;
  font-weight: 600;
}

.drop-content .subtitle {
  font-size: 14px;
  opacity: 0.7;
  margin-top: 6px;
}

.empty-state.dropzone {
  border: 2px dashed rgba(255,255,255,0.35) !important;
  background: rgba(255,255,255,0.02) !important;
  padding: 48px 32px !important;
  border-radius: 18px !important;

  display: flex !important;
  align-items: center !important;
  justify-content: center !important;

  cursor: pointer;
}

.empty-state.dropzone.drag-active {
  border-color: #ff8c2b !important;
  background: rgba(255,140,43,0.1) !important;
}

.icon.arrow {
  width: 28px;
  height: 28px;
  border-left: 3px solid rgba(255,255,255,0.6);
  border-bottom: 3px solid rgba(255,255,255,0.6);
  transform: rotate(135deg);
  margin: 0 auto 18px;
}

.empty-state.dropzone.drag-active .icon.arrow {
  border-color: #ff8c2b;
}

.rename-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.rename-input.rename-base {
  min-width: 80px;
  max-width: 240px;
}

.rename-ext {
  opacity: 0.45;
  font-size: 0.9em;
  user-select: none;
  pointer-events: none;
}

/* Finder – zone vide */
.explorer-zone {
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  touch-action: pan-y; /* 🔥 au lieu de manipulation */
}

</style>


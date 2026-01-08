<template>
  <Layout>
    <div class="uploads-page dark-theme">

      <!-- ===================================================== -->
      <!-- 🧭 HEADER -->
      <!-- ===================================================== -->
      <div class="uploads-header">
        <div>
          <h3>📎 Mes documents</h3>
          <div class="finder-tabs">
  <button
    class="tab"
    :class="{ active: finderMode === 'normal' }"
    @click="switchToNormal"
  >
    📎 Mes documents
  </button>

  <button
    class="tab"
    :class="{ active: finderMode === 'shared' }"
    @click="switchToShared"
  >
    🔗 Partagé avec moi
  </button>
  <button
    ref="addBtn"
    class="add-btn"
    v-if="!isReadOnlyShared"
    :class="{ active: addMenu.visible }"
    @click.stop="openAddMenuFromButton"
  >
    <span class="icon">＋</span>
    Ajouter
  </button>
</div>

          <p class="subtitle">Fichiers liés à tes cours</p>
<div class="search-wrapper">
  <input
    v-model="searchQuery"
    class="search-input"
    placeholder="🔍 Rechercher un fichier ou dossier…"
    @keydown.esc="searchQuery = ''"
  />

 <button
  v-if="searchQuery"
  class="search-clear"
  @click="searchQuery = ''"
  aria-label="Effacer la recherche"
>
  <svg viewBox="0 0 12 12" width="10" height="10">
    <path
      d="M1 1L11 11M11 1L1 11"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
    />
  </svg>
</button>

</div>


        </div>
<div class="header-actions">
  <div
    v-if="uploadSession"
    class="upload-badge"
    :class="{ done: uploadFinished }"
    @click="!uploadFinished && (currentFolderId = uploadSession.folderId)"
  >
    <template v-if="uploadFinished">✔️ Uploads terminés</template>
    <template v-else>
      ⬆️ {{ uploadsInProgress }} upload{{ uploadsInProgress > 1 ? 's' : '' }} en cours
    </template>
  </div>


</div></div>


      <!-- ===================================================== -->
      <!-- ➕ MENU AJOUT -->
      <!-- ===================================================== -->
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
          <div class="context-item" @click="openUpload">📄 Ajouter un fichier</div>
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
  @close="showUpload = false"
  @files-selected="onFilesSelected"
/>



      <!-- ===================================================== -->
      <!-- 🧱 BREADCRUMB -->
      <!-- ===================================================== -->
      <div class="breadcrumb finder-breadcrumb">



  <span
  v-for="(f, i) in searchBreadcrumb"
  :key="f.folder_id"
  class="crumb"
  @click="onBreadcrumbClick(f, i)"
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
        ref="explorerScroll"

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


<div
  v-if="isSharedMode && !sharedPrefetched"
  class="shared-loading"
>
  Chargement des dossiers partagés…
</div>

        <!-- ================= CONTENT ================= -->
        <div
          v-if="foldersLoaded"
          class="explorer-content"
            :class="{ 'no-anim': isNavigating }"

        >
<div
  v-if="searchQuery && !hasSearchResults"
  class="search-empty"
>
  <p>🔍 Aucun résultat pour « {{ searchQuery }} »</p>

  <button @click="searchQuery = ''">
    Effacer la recherche
  </button>
</div>

          <!-- ================================================= -->
          <!-- 📁 DOSSIERS -->
          <!-- ================================================= -->
           <!-- 👨‍🎓 VUE ÉLÈVES (PROF) -->

<div
  v-for="folder in searchedFolders"
  :key="folder.folder_id"
  class="upload-item folder"
:class="{
  active: currentFolderId === folder.folder_id,
  selected: selectedFolders.includes(folder.folder_id),
  pending: folder.pending,
  'shared-with-me': sharedWithMeIds?.value?.has?.(folder.folder_id) ?? false,
  'shared-by-me': sharedByMeIds?.value?.has?.(folder.folder_id) ?? false
}"



              @dragover.prevent
@drop.prevent="handleDropOnFolder($event, folder.folder_id)"
             @click.stop="onFolderTap(folder, $event)"
@contextmenu.prevent.stop="openFolderMenu($event, folder)"

            >
             <div
  class="folder-main"
:class="{
  'is-shared': folder.is_shared,
  '_optimistic_share': folder._optimistic_share,
      'shared-by-me': folder.shared_by_me,

  '_optimistic_revoke': folder._optimistic_revoke
}"

  @pointerdown="onPressStart(folder, $event)"
  @pointerup="onPressEnd"
  @pointerleave="onPressEnd"

  @dragover.prevent
  @drop.prevent="handleDropOnFolder($event, folder.folder_id)"

  @click.stop="onFolderTap(folder, $event)"
  @contextmenu.prevent.stop="openFolderMenu($event, folder)"
  draggable="true"
  @dragstart="onFolderDragStart($event, folder)"
  @dragend="onDragEnd"
>
  <i class="bi bi-collection folder-icon"></i>
<span v-if="folder.is_shared || folder.shared_with_me" class="shared-icon">🔗</span>



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

          <!-- ================================================= -->
          <!-- 📄 FICHIERS -->
          <!-- ================================================= -->
          <transition-group name="fade-slide" tag="div">
            <div
v-for="file in searchedFiles"             :key="file.upload_id || file.optimistic_id"
              class="upload-item"
              :class="{
                optimistic: file._optimistic,
                selected: selectedFiles.includes(file.upload_id),
                cut: clipboard.mode === 'cut' && clipboard.uploads.includes(file.upload_id)
              }"
              draggable="true"
              @dragstart="onDragStart($event, file)"
              @dragend="onDragEnd"
   @click.stop="onFileTap(file, $event)"
@contextmenu.prevent="openFileMenu($event, file)"


            >
              <div class="file-main"
   @pointerdown="onPressStart(file, $event, 'file')"
    @pointerup="onPressEnd"
    @pointerleave="onPressEnd"


              >
<span class="file-icon">
  {{ getFileIcon(file) }}
</span>

                <div class="file-info">
                  <strong v-if="editingId !== file.upload_id">
                    {{ file.file_name }}
  <span v-if="file._optimistic" class="upload-spinner"></span>
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
<div
    v-if="searchQuery"
    class="file-path"
  >
    {{ getFilePathLabel(file) }}
  </div>



                </div>



              </div>
              <!-- 🔄 PROGRESS BAR OPTIMISTIC -->
<div v-if="file._optimistic" class="upload-progress">
  <span :style="{ width: file.progress + '%' }" />
</div>


            </div>
          </transition-group>

          <!-- ================================================= -->
          <!-- 🫥 EMPTY -->
          <!-- ================================================= -->
<div
  v-show="
    !isSharedMode &&
    foldersLoaded &&
    visibleFolders.length === 0 &&
    visibleFiles.length === 0
  "
  class="empty-state"
>
<UploadFileCore
  ref="uploader"
  :eleve-id="effectiveEleveId"
  :cours-id="effectiveCoursId"
  :folder-id="currentFolderId"
  @queued="onQueued"
  @progress="onProgress"
  @uploaded="onUploadSuccess"
    @error="onUploadError"
  @done="onUploadDone"
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

<div
  v-if="isProfLike && !isSharedMode && !contextMenu.target?._isSharedByMe"
  class="context-item"
  @click="openShareModal(contextMenu.target)"
>
  🔗 Partager
</div>


<div
  v-if="isProfLike && contextMenu.target?.is_shared && !isSharedMode"
  class="context-item danger"
  @click="revokeFolderShare(contextMenu.target)"
>
  🚫 Arrêter le partage
</div>


</template>




        </div>
      </div>

    </div>
 <div v-if="showShareModal" class="context-backdrop" @click="showShareModal = false">
  <div
    class="context-menu"
    style="
      min-width:260px;
      top:50%;
      left:50%;
      transform:translate(-50%, -50%);
    "
    @click.stop
  >
    <h4 style="padding:8px 12px">🔗 Partager le dossier</h4>

    <div class="context-item">

    </div>

    <div class="context-item" @click="confirmShareFolder">
      🚀 Activer le partage
    </div>

    <div class="context-item danger" @click="showShareModal = false">
      Fermer
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
import { useToast } from "vue-toastification"


// ============================================================================
// 🔐 AUTH + ROUTE
// ============================================================================
const auth = useAuthStore()
const toast = useToast()

const sharedWithMeIds = ref(new Set())
const sharedByMeIds  = ref(new Set())
const uploader = ref(null)
const showUpload = ref(false)
const openUpload = () => {
    console.log("🟢 openUpload")
  closeAddMenu()        // ✅ ferme le menu contextuel

  showUpload.value = true
}
const onUploadError = (e) => {
  if (e.type === "quota") {
    toast.error(e.message)

    if (e.optimistic_id) {
      removeOptimisticUpload(e.optimistic_id)
    }
  }
}


const onFilesSelected = (files) => {
  console.log("🚀 EleveUploads reçoit files", files)

  if (!uploader.value) {
    console.error("⛔ uploader ref NULL")
    return
  }

  uploader.value.handleFiles(files)
}

const currentCoursId = null

const onCloseUpload = () => {
  showUpload.value = false
  uploadSession.value = null
  uploadFinished.value = false
  addMenu.visible = false   // 🔥 LIGNE CLÉ
}

let pressTimer = null
let longPressTriggered = false

const onPressStart = (item, e, type = "folder") => {
  if (e.pointerType === "mouse") return
  e.preventDefault() // 🔥 IMPORTANT iOS

  longPressTriggered = false

  pressTimer = setTimeout(() => {
    longPressTriggered = true
    navigator.vibrate?.(20)

    if (type === "file") {
      openFileMenu(e, item)
    } else {
      openFolderMenu(e, item)
    }
  }, 500)
}




const onPressEnd = () => {
  clearTimeout(pressTimer)
  pressTimer = null
}

const isAutoOpening = ref(false)

const route = useRoute()
const sharedPrefetched = ref(false)
const sharedFoldersCache = ref([])
const sharedUploadsCache = ref([])
const sharedReady = computed(() => {
  return (
    !isSharedMode.value ||
    (sharedFolders.value && sharedFolders.value.length > 0)
  )
})
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
  const { data } = await axios.post(getProxyPostURL(routes.POST), {
    route: "readsharedbyme",
    jwt: auth.jwt,
    prof_id: profId.value
  })

  console.log("👁️ RAW sharedByMe response", data) // 👈 AJOUTE ÇA

  const actifs = data.shared?.filter(s => s.status === "active") || []
  sharedByMeIds.value = new Set(actifs.map(s => s.folder_id))

  console.log("📁 sharedByMeIds =", [...sharedByMeIds.value]) // 👈 ET ÇA
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
const isSearching = computed(() => !!searchQuery.value)
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
  if (isTouch()) {
    selectedFiles.value = [] // 🔥 RESET
    openFile(file)
    return
  }
if (longPressTriggered) {
  longPressTriggered = false
  return
}

  if (e.detail === 2) {
    openFile(file)
  } else {
    toggleSelect(file, e)
  }
}

const cancelLongPress = () => {
  clearTimeout(longPressTimer)
  longPressTimer = null
}




// ACTION PARTAGE API
const confirmShareFolder = async () => {
  if (!shareTargetFolder.value) return

  // 🔥 CLOSE MODAL IMMEDIATELY
  showShareModal.value = false

  // 🔥 OPTIMISTIC UI
  const folderId = shareTargetFolder.value.folder_id
  folders.value = folders.value.map(f =>
    f.folder_id === folderId
      ? { ...f, is_shared: true, _optimistic_share: true }
      : f
  )

  try {
    const payload = {
      route: "sharefolder_create_or_update",
      jwt: auth.jwt,
      prof_id: profId.value,
      folder_id: folderId,
      permission: "read", // lecture seule pour l’instant
      user_id: userId.value
    }

    console.log("📤 SHARE payload =", payload)

    const res = await axios.post(
      getProxyPostURL(routes.POST),
      payload
    )

    console.log("📥 SHARE response =", res?.data)

    if (!res?.data?.success) {
      throw new Error(res?.data?.error || "share_failed")
    }

    // ✅ CONFIRM OPTIMISTIC
    folders.value = folders.value.map(f =>
      f.folder_id === folderId
        ? { ...f, is_shared: true, _optimistic_share: false }
        : f
    )
markSharedByMe(folderId, true)

    invalidateSharedCache()

    console.log("✅ SHARE OK", folderId)

  } catch (e) {
    console.error("💥 SHARE FAILED — rollback", e)

    // 🔁 ROLLBACK
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
const routes = {
  POST: "AKfycbzo0ooaiNkY6yyc9MmXfwVDxJmVwklyeoKOpPklgWotIsKRhNw9kim1rKcPPwsOj8wWGg/exec"
}
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
  if (!isSearching.value) return visibleFolders.value
  const q = searchQuery.value.toLowerCase()

  return allFolders.value.filter(f =>
    (f.name || "").toLowerCase().includes(q)
  )
})
const hasSearchResults = computed(() => {
  if (!searchQuery.value) return true
  return searchedFolders.value.length || searchedFiles.value.length
})

const searchedFiles = computed(() => {
  if (!isSearching.value) return visibleFiles.value
  const q = searchQuery.value.toLowerCase()

  return allFiles.value.filter(f =>
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
fileRenameRefs.get(file.upload_id)?.focus({ preventScroll: true })
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

  // 🔒 TOUJOURS fermer le menu AVANT
  addMenu.visible = false

  // 👨‍🎓 élève → toujours OK
  if (!isProfLike.value) {
    uploadFolderId.value = currentFolderId.value
    uploadSession.value = {
      id: crypto.randomUUID(),
      folderId: currentFolderId.value,
      total: 1,
      done: 0
    }

    showUpload.value = true
    return
  }

  // 👨‍🏫 prof
  const isEleveFolder = folder?.owner_type === "eleve"

  // ❌ dossier élève sans élève sélectionné
  if (isEleveFolder && !currentEleveId.value) {
    alert("Sélectionne un élève")
    return
  }

  // ✅ dossier prof OU dossier élève valide
  uploadFolderId.value = currentFolderId.value
  uploadSession.value = {
    id: crypto.randomUUID(),
    folderId: currentFolderId.value,
    total: 1,
    done: 0
  }

  showUpload.value = true
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

  // ⛔ point d’arrêt selon rôle
  const stopAt =
    role.value === "admin"
      ? null
      : isProfLike.value
        ? profRootFolder.value?.folder_id
        : eleveRootId.value

  while (cur && guard++ < 20) {
    const f = foldersById.value[cur]
    if (!f) break

    chain.unshift(f)

    // 🔥 STOP STRICT
    if (stopAt && f.folder_id === stopAt) break

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
  // 🔗 RACINE PARTAGÉE
  if (isSharedMode.value && currentFolderId.value === SHARED_ROOT_ID) {
    console.log("🧪 VISIBLE SHARED ROOT", {
      sharedRoots: sharedFolders.value.map(s => s.folder_id),
      allFolders: folders.value.length
    })

    return folders.value.filter(f =>
      sharedFolders.value.some(s => s.folder_id === f.folder_id)
    )
  }

  // 🔗 NAVIGATION DANS UN DOSSIER PARTAGÉ
  if (isSharedMode.value) {
    const visibles = folders.value.filter(
      f =>
        f.parent_id === currentFolderId.value &&
        isInsideSharedTree(f.folder_id)
    )

    console.log("🧪 VISIBLE SHARED CHILDREN", {
      currentFolderId: currentFolderId.value,
      visibles: visibles.map(f => f.folder_id)
    })

    return visibles
  }

  // 📁 MODE NORMAL
  return foldersByParentCache.value[currentFolderId.value ?? null] || []
})








const clearSelection = () => {
  selectedFiles.value = []
  selectedFolders.value = []
}


// Fichiers du dossier courant uniquement
const visibleFiles = computed(() => {
  if (!currentFolderId.value) return []

  const files = uploadsByFolder.value[currentFolderId.value] || []

  // 🧠 RACINE ÉLÈVE : filtrage métier
  if (
    !isProfLike.value &&
    !isSharedMode.value &&
    currentFolderId.value === eleveRootId.value
  ) {
    return files.filter(f =>
      // fichiers destinés aux élèves
      f.visibility === "eleves" ||
      // fichiers privés de l’élève
      String(f.eleve_id).trim() === String(auth.user_id).trim()
    )
  }

  // 📁 DOSSIERS : PAS de filtre visibility
  return files
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
  if (selectedFiles.value.length || selectedFolders.value.length) {
    closeContextMenu()

    if (selectedFiles.value.length) deleteSelectedUploads()
    if (selectedFolders.value.length) deleteSelectedFolders()
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

const onProgress = ({ optimistic_id, progress }) => {
  Object.values(uploadsByFolder.value).forEach(list => {
    list.forEach(item => {
      if (item._optimistic && item.optimistic_id === optimistic_id) {
        item.progress = progress
      }
    })
  })

  // force refresh
  uploadsByFolder.value = { ...uploadsByFolder.value }
}




const prefetchSharedData = async () => {
  const now = Date.now()

  if (sharedPrefetched.value && now - sharedFetchedAt.value < SHARED_TTL) {
    console.log("⏭️ shared cache fresh")
    return
  }

  if (!auth.jwt || !userId.value) {
    console.warn("⛔ prefetchSharedData aborted", {
      jwt: !!auth.jwt,
      userId: userId.value
    })
    return
  }

  console.log("🔄 PREFETCH SHARED — start")

  const { data } = await axios.post(
    getProxyPostURL(routes.POST),
    {
      route: "getsharedfoldersforme",
      jwt: auth.jwt,
      user_id: userId.value,
      prof_id: profId.value // optionnel (debug)
    }
  )

  console.log("📥 PREFETCH RAW RESPONSE", data)

  if (!data?.success) {
    console.warn("⛔ PREFETCH FAILED", data)
    return
  }

  const actifs = data.shared?.filter(s => s.status === "active") || []
  sharedFoldersCache.value = actifs
  sharedWithMeIds.value = new Set(actifs.map(s => s.folder_id))

  // ==============================================
  // 👨‍🏫 SI PROF — CHARGER LES DOSSIERS QU’IL A PARTAGÉS
  // ==============================================
  if (isProfLike.value) {
    const { data: sharedData } = await axios.post(getProxyPostURL(routes.POST), {
      route: "readsharedbyme",
      jwt: auth.jwt,
      prof_id: profId.value
    })

    const actifsByMe = sharedData.shared?.filter(s => s.status === "active") || []
    sharedByMeIds.value = new Set(actifsByMe.map(s => s.folder_id))
    console.log("👁️ SHARED BY ME", [...sharedByMeIds.value])
  }

  sharedUploadsCache.value = [] // Toujours vide (par design)

  // ✅ Injection dans folders pour activer visuel + menu contextuel
  for (const folder of folders.value) {
    folder.is_shared = sharedByMeIds.value.has(folder.folder_id)
    folder.shared_with_me = sharedWithMeIds.value.has(folder.folder_id)
  }

  // 🔄 Forcer le re-render
  explorerKey.value++

  sharedPrefetched.value = true
  sharedFetchedAt.value = now

  console.log("🧪 SHARED PREFETCH STATE", {
    sharedPrefetched: sharedPrefetched.value,
    rightsCount: sharedFoldersCache.value.length,
    rightsIds: sharedFoldersCache.value.map(s => s.folder_id),
    uploadsCount: sharedUploadsCache.value.length
  })

  console.log("✅ PREFETCH SHARED — done")
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

  if (normalStateSnapshot.value) {
    folders.value = normalStateSnapshot.value.folders
    uploadsByFolder.value = normalStateSnapshot.value.uploadsByFolder
    currentFolderId.value = normalStateSnapshot.value.currentFolderId
  } else {
    goHome()
  }
}

const switchToShared = () => {
  normalStateSnapshot.value = {
    folders: [...folders.value],
    uploadsByFolder: JSON.parse(JSON.stringify(uploadsByFolder.value)),
    currentFolderId: currentFolderId.value
  }

  finderMode.value = "shared"
  selectedFiles.value = []
  selectedFolders.value = []

  sharedFolders.value = [...sharedFoldersCache.value]
  currentFolderId.value = SHARED_ROOT_ID

  console.log("✅ SWITCH TO SHARED (instant, data ready)")
}






const startFileLongPress = (file, e) => {
  longPressTimer = setTimeout(() => {
    selectedFiles.value = [file.upload_id]
    openFileMenu(e, file)
  }, 500)
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
        progress: 0
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
        progress: item.progress ?? 0
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

  uploadsByFolder.value[fid].push({
    ...upload,
    _optimistic: false,
    progress: 100
  })

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
  // 🖱️ sélection douce
  // ===============================
  if (!selectedFiles.value.includes(upload.upload_id)) {
    selectedFiles.value.push(upload.upload_id)
  }

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



const uploadsInProgress = computed(() =>
  uploadSession.value
    ? uploadSession.value.total - uploadSession.value.done
    : 0
)


const onUploadDone = () => {
  console.group("🏁 [ELEVE] onUploadDone")
  console.log("uploadSession =", uploadSession.value)
  console.groupEnd()
  if (!uploadSession.value) return

  uploadSession.value.done = uploadSession.value.total

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


const getTopLevelFolderIds = (ids) => {
  return ids.filter(id =>
    !ids.some(otherId =>
      otherId !== id && isDescendant(id, otherId)
    )
  )
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

  console.log("▶️ input ids", ids)
  console.log("▶️ ids length", ids?.length)

  if (!Array.isArray(ids) || !ids.length) {
    console.warn("⛔ abort: ids invalid")
    console.groupEnd()
    return
  }

  console.log("👤 auth.jwt", auth?.jwt?.slice(0, 20) + "…")
  console.log("👤 prof_id", profId.value)
  console.log("📁 currentFolderId BEFORE", currentFolderId.value)
  console.log("📁 folders BEFORE", folders.value.map(f => f.folder_id))

  pushUndo()
  console.log("↩️ undo snapshot pushed")

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
      console.log("🧹 remove uploads for folder", fid)
      delete uploadsByFolder.value[fid]
    }
  })

  if (ids.includes(currentFolderId.value)) {
    console.warn("📁 current folder deleted → reset")
    currentFolderId.value = ""
  }

  selectedFolders.value = []

  console.log("📁 folders AFTER optimistic", folders.value.map(f => f.folder_id))
  console.log("📁 currentFolderId AFTER", currentFolderId.value)

  // ===============================
  // 📤 PAYLOAD
  // ===============================
  const payload = {
    route: "softdeletefolders",
    jwt: auth.jwt,
    prof_id: profId.value,
    folder_ids: ids
  }

  console.log("📤 payload", JSON.stringify(payload, null, 2))

  try {
    const url = getProxyPostURL(routes.POST)
    console.log("🌍 POST URL", url)

    const t0 = performance.now()
    const res = await axios.post(url, payload)
    const t1 = performance.now()

    console.log(`⏱ API duration ${(t1 - t0).toFixed(1)}ms`)
    console.log("📥 response status", res.status)
    console.log("📥 response headers", res.headers)
    console.log("📥 response data", JSON.stringify(res.data, null, 2))

    // ===============================
    // 🔎 SANITY CHECK BACKEND
    // ===============================
    if (!res.data) {
      console.error("❌ empty backend response")
      throw new Error("empty_response")
    }

    if (res.data.success === false) {
      console.error("❌ backend reported failure")
      throw new Error("backend_failure")
    }

    if (res.data.updatedCount !== undefined) {
      console.log("🧮 backend updatedCount", res.data.updatedCount)
      if (res.data.updatedCount === 0) {
        console.warn("⚠️ 0 row updated → WHERE mismatch probable")
      }
    }

    // ===============================
    // 💾 CACHE
    // ===============================
    console.log("💾 write uploads cache")
    writeUploadsCache(
      effectiveOwnerType.value,
      effectiveOwnerId.value,
      Object.values(uploadsByFolder.value).flat()
    )

    console.log("💾 write folders cache")
    writeFoldersCache(
      effectiveOwnerType.value,
      effectiveOwnerId.value,
      folders.value
    )

    console.log("✅ DELETE COMPLETED OK")
    console.groupEnd()

  } catch (e) {
    console.error("🔥 DELETE FAILED", e)

    console.warn("↩️ rollback state")
    folders.value = foldersSnapshot
    uploadsByFolder.value = uploadsSnapshot
    currentFolderId.value = prevFolder

    console.log("📁 folders AFTER rollback", folders.value.map(f => f.folder_id))
    console.log("📁 currentFolderId AFTER rollback", currentFolderId.value)

    alert("Erreur suppression dossiers")

    console.groupEnd()
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

// 🔥 FORCER le dossier prof, jamais PROFS
currentFolderId.value = data.prof_root_id



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

  console.log("🌐 FETCH ALL UPLOADS (GLOBAL)", {
    mode: finderMode.value
  })
const payload = {
  route: "getalluploadsbyprof",
  jwt: auth.jwt,
  prof_id: profId.value,
  ...(finderMode.value === "shared"
    ? {}                      // 🔑 PAS de eleve_id
    : isProfLike.value
      ? {}
      : { eleve_id: userId.value }
  )
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

    // reconcile
    for (const fid in nextMap) {
      uploadsByFolder.value[fid] = nextMap[fid]
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


const fetchSharedUploadsOnce = async () => {
  if (!auth.jwt || !profId.value) return

  console.log("🌐 FETCH SHARED UPLOADS (DEDICATED)")

  const { data } = await axios.post(
    getProxyPostURL(routes.POST),
    {
      route: "getalluploadsbyprof",
      jwt: auth.jwt,
      prof_id: profId.value,
      shared_only: true // 👈 CLÉ
    }
  )

  const uploads = Array.isArray(data?.uploads) ? data.uploads : []

  uploads.forEach(u => {
    const fid = u.folder_id ?? null
    if (!uploadsByFolder.value[fid]) {
      uploadsByFolder.value[fid] = []
    }
    uploadsByFolder.value[fid].push(u)
  })

  console.log("📦 shared uploads reçus =", uploads.length)
}

const revokeFolderShare = async (folder) => {
  closeContextMenu()

  if (!confirm("Arrêter le partage de ce dossier ?")) return

  // ============================
  // 🔥 OPTIMISTIC UI
  // ============================
  const prevIsShared = folder.is_shared

  folders.value = folders.value.map(f =>
    f.folder_id === folder.folder_id
      ? { ...f, is_shared: false, _optimistic_revoke: true }
      : f
  )

  try {
    const payload = {
      route: "sharefolder_revoke",
      jwt: auth.jwt,
      prof_id: profId.value,
      folder_id: folder.folder_id
    }

    console.log("📤 REVOKE payload =", payload)

    const res = await axios.post(
      getProxyPostURL(routes.POST),
      payload
    )

    console.log("📥 REVOKE response =", res?.data)
markSharedByMe(folder.folder_id, false)

    if (!res?.data?.success) {
      throw new Error(res?.data?.error || "revoke_failed")
    }

    // ============================
    // ✅ CONFIRM OPTIMISTIC
    // ============================
    folders.value = folders.value.map(f =>
      f.folder_id === folder.folder_id
        ? { ...f, is_shared: false, _optimistic_revoke: false }
        : f
    )

    invalidateSharedCache()

    console.log("✅ REVOKE SUCCESS", folder.folder_id)

  } catch (e) {
    console.error("💥 REVOKE FAILED — rollback", e)
markSharedByMe(folder.folder_id, prevIsShared)

    // ============================
    // 🔁 ROLLBACK
    // ============================
    folders.value = folders.value.map(f =>
      f.folder_id === folder.folder_id
        ? { ...f, is_shared: prevIsShared, _optimistic_revoke: false }
        : f
    )

    alert("Erreur lors du retrait du partage")
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
// recup folder partagés
async function fetchSharedFolders() {
  const { data } = await axios.post(
    getProxyPostURL(routes.POST),
 {
  route: "getsharedfoldersforme",
  jwt: auth.jwt,
  user_id: userId.value
}

  )

  if (!data?.success) {
    sharedFolders.value = []
    return
  }

  sharedFolders.value = data.folders || []
}
function onQueued(payload) {
  console.group("🟡 [ELEVE] onQueued")
  console.log("payload =", payload)

  let files, folderId, sessionId

  // 🔥 CAS ACTUEL (ARRAY)
  if (Array.isArray(payload)) {
    files = payload
    folderId = currentFolderId.value
    sessionId = uploadSession.value?.id || crypto.randomUUID()
  }
  // 🔥 CAS FUTUR (OBJET)
  else if (payload && Array.isArray(payload.files)) {
    files = payload.files
    folderId = payload.folderId ?? currentFolderId.value
    sessionId = payload.sessionId ?? uploadSession.value?.id
  } else {
    console.error("⛔ onQueued payload invalide", payload)
    console.groupEnd()
    return
  }

  console.log("🧩 parsed", {
    filesCount: files.length,
    folderId,
    sessionId
  })

  addOptimisticUploads(files, folderId, sessionId)
  console.groupEnd()
}





// recup dossier
async function fetchFolders() {
  if (finderMode.value === "shared") {
    console.log("⏭️ fetchFolders skipped (shared mode)")
    return
  }

  console.log("📁 FETCH FOLDERS — start")

  try {
    // =====================================================
    // 🔐 GUARDS
    // =====================================================
    if (!auth.jwt || !auth.user?.prof_id) {
      console.warn("⛔ fetchFolders aborted — auth missing")
      return
    }

    // =====================================================
    // 📤 PAYLOAD
    // =====================================================
    const payload = {
      route: "getfoldersbyprof",
      jwt: auth.jwt,
      prof_id: auth.user.prof_id,
      role: auth.user.role
    }

    const url = getProxyPostURL(routes.POST)

    // =====================================================
    // 🌍 API CALL
    // =====================================================
    const res = await axios.post(url, payload)

    if (!res.data?.success) {
      console.error("❌ fetchFolders failed", res.data)
      folders.value = []
      return
    }



    // =====================================================
    // 🧼 NORMALIZE + MERGE SHARE STATE
    // =====================================================
const localShared = readSharedByMe()

const normalized = (res.data.folders || []).map(f => {
  const apiShared = !!f.is_shared

  // 🔥 le front gagne si on a une valeur persistée
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



    // =====================================================
    // 🧠 HYDRATE STATE
    // =====================================================
// 🔥 Patch : préserver les flags `is_shared` déjà connus
const oldById = new Map(folders.value.map(f => [f.folder_id, f]))

folders.value = normalized.map(f => {
  const previous = oldById.get(f.folder_id)
  return {
    ...f,
    is_shared: previous?.is_shared || false
  }
})
    foldersLoaded.value = true

    // =====================================================
    // 💾 CACHE
    // =====================================================
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
folderRenameRefs.get(tmpId)?.focus({ preventScroll: true })
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
  console.log("📤 DELETE PAYLOAD", {
  prof_id: profId.value,
  folder_ids: ids
})
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
folder._isSharedByMe = sharedByMeIds?.value?.has?.(folder.folder_id) ?? false

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
  // 🔒 verrou global
  if (event.__sbsHandled) return
  event.__sbsHandled = true

  event.preventDefault()
  event.stopPropagation()

  console.group("📥 DROP UNIQUE")
  console.log("targetFolderId =", folderId)

  // ===============================
  // 🧲 DROP FICHIERS NATIFS (OS)
  // ===============================
if (event.dataTransfer?.files?.length) {
  console.log("📂 fichiers natifs =", event.dataTransfer.files.length)
const files = Array.from(event.dataTransfer.files)

  uploadFolderId.value = folderId ?? currentFolderId.value ?? null

  // 🔒 SESSION D’UPLOAD (DOSSIER FIGÉ)
  const sessionId = crypto.randomUUID()
  uploadSession.value = {
    id: sessionId,
    folderId: uploadFolderId.value,
     total: files.length,   // 🔥
  done: 0                // 🔥
  }


// 🔥 wrapper avec optimistic_id (1 par fichier)
const wrapped = files.map(f => ({
  file: f,
  optimistic_id: crypto.randomUUID()
}))

// ⚡ optimistic immédiat (doit stocker optimistic_id)
addOptimisticUploads(wrapped, uploadFolderId.value, uploadSession.value.id)

nextTick(() => {
  window.dispatchEvent(
    new CustomEvent("sbs-drop-files", {
      detail: {
        files: wrapped,
        folder_id: uploadFolderId.value,
        session_id: uploadSession.value.id
      }
    })
  )
})


  console.groupEnd()
  return
}


  // ===============================
  // 📄 DROP FICHIERS INTERNES SBS
  // ===============================
  if (draggedFiles.value.length) {
    onDrop(folderId)
    console.groupEnd()
    return
  }

  // ===============================
  // 📁 DROP DOSSIER
  // ===============================
  if (draggedFolder.value) {
    onFolderDrop(folderId)
    console.groupEnd()
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
const explorerScroll = ref(null)

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
// 🔗 prefetch partagé (background)
prefetchSharedData()
// 🔥 PREFETCH UPLOADS PARTAGÉS (background)
fetchAllUploadsOnce().then(() => {
  sharedUploadsPrefetched.value = true
  console.log("⚡ shared uploads prefetched")
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
  currentFolderId.value = profRootFolder.value?.folder_id || null
}


    // --- fetch uploads GLOBAL (UNE FOIS)
    loaderStep.value = "uploads"
    console.log("🚀 trigger global uploads fetch (élève)")
    await fetchAllUploadsOnce()
// 🔥 AUTO-OPEN dossier contenant des uploads (élève)
// 🔥 AUTO-OPEN SAFE (ÉLÈVE ONLY)
if (!isProfLike.value) {
  const foldersWithFiles = Object.keys(uploadsByFolder.value)
    .filter(fid => {
      const f = foldersById.value[fid]
      return (
        f &&
        f.owner_type === "eleve" &&
        f.owner_id === userId.value &&
        uploadsByFolder.value[fid]?.length
      )
    })

  if (foldersWithFiles.length) {
    isAutoOpening.value = true
    console.log("🎯 auto-open folder (SAFE) =", foldersWithFiles[0])

    currentFolderId.value = foldersWithFiles[0]

    await nextTick()
    isAutoOpening.value = false
  }
}


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

  currentFolderId.value =
    profRootFolder.value?.folder_id || null
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

// 🔥 FIX CRITIQUE — forcer le dossier prof (non admin)
if (role.value !== "admin") {
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

<style scoped>
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

.upload-item.cut { opacity: .45; }
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

</style>


<template>
  <div class="upload-form">

    <!-- DROP ZONE -->

<label class="drop-zone">

<label class="file-picker">
  <input
    ref="fileInputRef"
    type="file"
    multiple
    class="file-input"
    @change="onFileSelect"
  />
  <span class="icon">＋</span>
  <span class="text">Ajouter des fichiers</span>
</label>


<div v-if="!currentFile" class="drop-placeholder">

        📂 Dépose un fichier ici<br />
        <span>ou clique pour choisir</span>
      </div>

      <div v-else class="file-selected">
<strong>{{ currentFile?.name }}</strong>
<small v-if="currentFile">
  {{ (currentFile.size / 1024 / 1024).toFixed(2) }} Mo
</small>      </div>
    </label>

 <!-- PROGRESS GLOBAL -->
<div v-if="globalProgress > 0" class="progress-bar-wrapper">
  <p>
    {{ totalFiles }} fichier(s) en cours… — {{ globalProgress }} %
  </p>

  <div
    class="progress-bar"
    :style="{ width: globalProgress + '%' }"
  ></div>
</div>


    <!-- ACTIONS -->
    <button
      class="upload-btn"
      :disabled="!currentFile || uploading"
@click="startNextUpload"
    >
      <span v-if="!uploading">📤 Envoyer</span>
      <span v-else class="loader"></span>
    </button>

    <!-- FEEDBACK -->
    <p v-if="successUrl" class="success">✅ Fichier envoyé</p>
    <p v-if="error" class="error">❌ {{ error }}</p>

  </div>
</template>


<script setup>



import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue"
import { useAuthStore } from "@/stores/authStore.js"
import { getValidToken } from "@/utils/api.ts"
import { getProxyPostURL,gasPost } from "@/config/gas.ts"

const auth = useAuthStore()
const emit = defineEmits([
  "uploaded",
  "done",
  "queued",
  "files-selected",
    "error", // 👈 AJOUTE ÇA
  "progress"
])
const uploadSessionId = ref(null)
const fileInputRef = ref(null)

const isMobile = window.matchMedia("(pointer: coarse)").matches
const MAX_MOBILE_SIZE = 1000 * 1024 * 1024 // 50 Mo
let batchJwt = null
const MAX_PARALLEL = 3
const uploadedBatch = ref([])
const activeProgress = ref({}) // { optimistic_id: percent }
const globalProgress = ref(0)
const CANCEL_ERROR = "upload-cancelled"

const cancelledUploads = new Set()

// const chunck
const MAX_DIRECT_UPLOAD = 20 * 1024 * 1024
// ============================================================================
// 🔑 GET UPLOAD TOKEN — HARD LOG + SAFE
// ============================================================================
async function getUploadToken(payload) {
  console.group("🔐 getUploadToken")
  console.log("➡️ payload input =", payload)

  let res
  try {
    res = await gasPost("getuploadtoken", payload)
    console.log("📥 raw response =", res)
  } catch (e) {
    console.error("💥 gasPost failed", e)
    console.groupEnd()
    throw e
  }

  // ---- HARD VALIDATION ----
  const token =
    res?.uploadToken ||
    res?.token ||
    res?.data?.uploadToken ||
    res?.data?.token

  if (!token || typeof token !== "string") {
    console.error("❌ INVALID UPLOAD TOKEN FORMAT", {
      response: res,
      extractedToken: token
    })
    console.groupEnd()
    throw new Error("invalid-upload-token")
  }

  console.log("✅ uploadToken =", token)
  console.groupEnd()
  return token
}



const formatEta = s =>
  s > 60 ? `${Math.floor(s/60)}m ${s%60}s` : `${s}s`
// UploadFileCore.vue <script setup>
const openPicker = () => {
  fileInputRef.value?.click()
}

defineExpose({
  openPicker,
  handleFiles
})


// 🔧 props dynamiques
const props = defineProps({
  eleveId: { type: String, default: null },
  coursId: { type: String, default: null },
folderId: { type: String, default: null }
})


const lockedFolderId = ref(null)


const filesQueue = ref([])
const currentFile = ref(null)

const file = ref(null)
const lastDropSig = ref(null)
const dropLock = ref(false)

const uploading = ref(false)
const progress = ref(0)
const successUrl = ref("")
const error = ref("")
const totalFiles = computed(() =>
  filesQueue.value.length + (currentFile.value ? 1 : 0)
)

const isEleveContext = computed(() => {
  const folder = props.folderId
    ? props.folders?.find(f => f.folder_id === props.folderId)
    : null

  return folder?.owner_type === "eleve"
})
const uploadsOptimistic = ref([])

function handleFiles(files) {
  if (uploading.value) return
  if (!files || !files.length) return

  // garde-fou mobile
  if (isMobile) {
    const tooBig = files.find(f => f.size > MAX_MOBILE_SIZE)
    if (tooBig) {
      error.value = "⚠️ Fichier trop volumineux. Upload recommandé sur ordinateur."
      return
    }
  }

  // 🔒 figer dossier + session
  lockedFolderId.value = props.folderId
  uploadSessionId.value = crypto.randomUUID()

  const wrappers = files.map(file => ({
    file,
    optimistic_id: crypto.randomUUID()
  }))

  // 👉 optimistic parent
emit("queued", wrappers.map(w => ({
  upload_id: null,
  optimistic_id: w.optimistic_id,
  file_name: w.file.name,
  file_size: w.file.size,
  folder_id: lockedFolderId.value,
  _optimistic: true,

  // 🟢 UX
  status: "queued",
  message: "En attente",
  progress: 0
})))



  filesQueue.value = wrappers
  error.value = ""

  emit("files-selected") // fermer la modale
  startNextUpload()
}


const onFileSelect = e => {
  if (uploading.value) return

  const files = Array.from(e.target.files || [])
  if (!files.length) return

  // 🔥 fermer la modale immédiatement
  emit("files-selected")

  // 📱 garde-fou mobile
  if (isMobile) {
    const tooBig = files.find(f => f.size > MAX_MOBILE_SIZE)
    if (tooBig) {
      error.value = "⚠️ Fichier trop volumineux. Upload recommandé sur ordinateur."
      return
    }
  }

  // 🔒 figer le dossier + session pour tout le batch
  lockedFolderId.value = props.folderId
if (!filesQueue.value.length) {
  uploadSessionId.value = crypto.randomUUID()
  lockedFolderId.value = props.folderId
}

  // 📦 créer wrappers + optimistic côté parent
  const wrappers = files.map(file => {
    const optimisticId = crypto.randomUUID()

    return {
      file,
      optimistic_id: optimisticId
    }
  })

  // 👉 optimistic UI (parent)
emit("queued", wrappers.map(w => ({
  upload_id: null,                  // 🔑 PAS DE BACKEND ENCORE
  optimistic_id: w.optimistic_id,   // 🔑 SEULE CLÉ
  file_name: w.file.name,
  file_size: w.file.size,
  folder_id: lockedFolderId.value,
  _optimistic: true,
  status: "uploading",
  progress: 0
})))


  // 📥 queue interne
filesQueue.value = [
  ...filesQueue.value,
  ...wrappers
]
console.log(
  "🧺 QUEUE AFTER SELECT",
  filesQueue.value.length,
  filesQueue.value.map(w => w.file.name)
)

  error.value = ""

  // 🚀 lancer l’upload réel
  startNextUpload()
}


const finalizeUpload = async ({ upload_id, total_chunks, file_name, upload_token }) => {
  const form = new FormData()
  form.append("token", upload_token)

  form.append("upload_id", upload_id)
  form.append("total_chunks", total_chunks)
  form.append("file_name", file_name)
  form.append("folder_id", lockedFolderId.value) // ✅ CLÉ

  const res = await fetch(
    "https://www.sunbassschool.com/sbs-upload/finalize_upload.php",
    { method: "POST", body: form }
  )

  const json = await res.json()

  if (!json.success) {
    if (json.error === "missing_chunks") {
      throw json
    }
    throw new Error("finalize_failed")
  }

  return json.url
}

const uploadSingleFile = async (wrapper) => {
  const optimisticId = wrapper.optimistic_id
  const file = wrapper.file

  emit("progress", {
    optimistic_id: optimisticId,
    status: "uploading",
    message: "Envoi en cours…",
    progress: 0
  })

  // 🔐 JWT déjà récupéré dans startNextUpload
  if (!batchJwt) throw new Error("jwt-missing")

  // ✅ TOUJOURS chunked (même 300 Ko)
  const chunkRes = await uploadChunkedFile(wrapper)

  emit("progress", {
    optimistic_id: optimisticId,
    status: "processing",
    message: "Traitement du fichier…"
  })

  const finalUrl = await finalizeUpload(chunkRes)

  return {
    optimistic_id: chunkRes.optimistic_id,
    file_url: finalUrl,
    file_name: chunkRes.file_name,
    file_size: chunkRes.file_size,
    file_type: chunkRes.file_type,
    folder_id: chunkRes.folder_id
  }
}





const updateGlobalProgress = () => {
  const values = Object.values(activeProgress.value)
  if (!values.length) {
    globalProgress.value = 0
    return
  }

  globalProgress.value = Math.round(
    values.reduce((a, b) => a + b, 0) / values.length
  )
}


const smoothProgress = Object.create(null)

function animateProgress(id, target) {
  if (smoothProgress[id] == null) {
    smoothProgress[id] = target
    emit("progress", {
      optimistic_id: id,
      progress: target
    })
    return
  }

  const start = smoothProgress[id]
  if (target <= start) return

  const diff = target - start
  const steps = Math.min(diff, 6)
  let i = 0

  const tick = () => {
    i++
    const value = start + Math.round((diff * i) / steps)
    smoothProgress[id] = value

    emit("progress", {
      optimistic_id: id,
      progress: value
    })

    if (i < steps) {
      requestAnimationFrame(tick)
    }
  }

  requestAnimationFrame(tick)
}



const uploadChunkedFile = async (wrapper) => {
uploading.value = true

const CANCEL_ERROR = "upload-cancelled"

  const file = wrapper.file
  const optimisticId = wrapper.optimistic_id
  const uploadId = crypto.randomUUID()

const isCoarse = window.matchMedia("(pointer: coarse)").matches
const isSlowNet =
  navigator.connection &&
  ["slow-2g", "2g", "3g"].includes(navigator.connection.effectiveType)

// ⛔ calculé UNE FOIS
const CHUNK_SIZE = Math.min(
  8 * 1024 * 1024, // 8 MB
  file.size       // 🔥 si fichier plus petit → 1 chunk
)

const MAX_PARALLEL_CHUNKS = isCoarse
  ? (isSlowNet ? 1 : 2)
  : (isSlowNet ? 3 : 6)

let dynamicParallel = MAX_PARALLEL_CHUNKS
const chunkTimes = []
const MIN_PARALLEL = isCoarse ? 1 : 2

let cancelled = false


  if (cancelledUploads.has(optimisticId)) {
  throw new Error(CANCEL_ERROR)
}
  console.group(`🧩 chunked upload → ${file.name}`)
  console.log("size =", Math.round(file.size / 1024 / 1024), "MB")
if (cancelledUploads.has(optimisticId)) {
  return { cancelled: true }
}

  try {
    // ==================================================
    // 🔐 JWT
    // ==================================================
    if (!batchJwt) throw new Error("jwt-missing")

    const fileSizeMb = Math.ceil(file.size / 1024 / 1024)

    // ==================================================
    // 🔑 TOKEN UPLOAD (GAS)
    // ==================================================
const uploadToken = await getUploadToken({
  jwt: batchJwt,
  prof_id: auth.user.prof_id,
  folder_id: lockedFolderId.value,   // 🔐 bind dossier
  upload_id: uploadId,               // 🔐 bind upload (CRITIQUE)
  file_size_mb: Math.ceil(file.size / 1024 / 1024),
  mode: "chunked",
  ...(props.eleveId && { eleve_id: props.eleveId }),
  ...(props.coursId && { cours_id: props.coursId })
})



    // ==================================================
    // 📦 CHUNKS
    // ==================================================
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    let completed = 0
    let uploadedBytes = 0
    const startTime = Date.now()

    const retryCount = {}
    let refreshingToken = null
animateProgress(optimisticId, 1)

 const uploadOneChunk = async (index) => {
  // 🛑 cancel immédiat
  if (cancelledUploads.has(optimisticId)) {
    cancelled = true
    console.warn("🛑 chunk cancelled before start", index)
    return
  }

  const start = index * CHUNK_SIZE
  const end = Math.min(start + CHUNK_SIZE, file.size)
  const chunkSize = end - start

  const blob = file.slice(start, end)

  const formData = new FormData()
  formData.append("token", uploadToken)
  formData.append("upload_id", uploadId)
  formData.append("chunk_index", index)
  formData.append("total_chunks", totalChunks)
  formData.append("file_name", file.name)
  formData.append("chunk", blob)

  console.log(`📤 chunk ${index + 1}/${totalChunks} (${Math.round(chunkSize / 1024 / 1024)} MB)`)

  // ⏱️ START TIMER
  const t0 = performance.now()

  const res = await fetch(
    "https://www.sunbassschool.com/sbs-upload/upload_chunck.php",
    { method: "POST", body: formData }
  )

  const dt = performance.now() - t0
  console.log(`⏱️ chunk ${index + 1} done in ${Math.round(dt)} ms`)

  let json
  try {
    json = await res.json()
  } catch {
    throw new Error("invalid-chunk-json")
  }
if (cancelledUploads.has(optimisticId)) {
  cancelled = true
  console.warn("🛑 chunk cancelled after upload", index)
  return
}

if (!res.ok || !json.success) {
  // ⛔ token expiré = STOP BATCH
  if (json?.error === "token-expired") {
    throw new Error("batch-upload-token-expired")
  }

  throw new Error(`chunk-upload-failed-${index}`)
}


  // ==================================================
  // 📊 METRICS
  // ==================================================
  chunkTimes.push(dt)
  if (chunkTimes.length > 6) chunkTimes.shift()


if (chunkTimes.length < 3) {
  // pas d'adaptation trop tôt
} else {
  const avg = chunkTimes.reduce((a, b) => a + b, 0) / chunkTimes.length

  if (avg > 15000 && dynamicParallel > MIN_PARALLEL) {
    dynamicParallel--
    console.log("🐢 slow net → parallel =", dynamicParallel)
  }

  if (avg < 6000 && dynamicParallel < MAX_PARALLEL_CHUNKS) {
    dynamicParallel++
    console.log("🚀 fast net → parallel =", dynamicParallel)
  }
}


  // ==================================================
  // 📈 PROGRESS
  // ==================================================
  completed++
  uploadedBytes += chunkSize

  const p = 5 + Math.round((completed / totalChunks) * 94)

  animateProgress(optimisticId, p)

  activeProgress.value[optimisticId] =
    smoothProgress[optimisticId] ?? p
}


// ==================================================
// 🚦 UPLOAD PARALLÈLE CONTRÔLÉ (FIX)
// ==================================================
const queue = Array.from({ length: totalChunks }, (_, i) => i)
const active = new Set()
const totalSizeMb = filesQueue.value.reduce(
  (sum, w) => sum + Math.ceil(w.file.size / 1024 / 1024),
  0
)



const launchNext = () => {
  console.log(
    "SESSION launchNext ENTER",
    "queue =", queue.length,
    "active =", active.size,
    "parallel =", dynamicParallel
  )

  if (cancelled) {
    console.log("SESSION cancelled → stop")
    return
  }

  if (!queue.length) {
    console.log("SESSION queue empty → stop")
    return
  }

  if (active.size >= dynamicParallel) {
    console.log("SESSION active full → wait")
    return
  }

  const index = queue.shift()
  active.add(index)

  console.log(
    "SESSION START FILE",
    index,
    "queue =", queue.length,
    "active =", active.size
  )

  uploadOneChunk(index)
    .catch(e => {
      if (e?.message === CANCEL_ERROR) {
        cancelled = true
        console.log("SESSION CANCEL ERROR", index)
      } else {
        console.error("SESSION UPLOAD ERROR", index, e)
        throw e
      }
    })
    .finally(() => {
      active.delete(index)

      console.log(
        "SESSION FILE FINALLY",
        index,
        "queue =", queue.length,
        "active =", active.size
      )

      if (!cancelled) launchNext()
    })
}



// kickstart
for (let i = 0; i < dynamicParallel; i++) {
  launchNext()
}


// attendre fin réelle
while ((queue.length || active.size) && !cancelled) {
  await new Promise(r => setTimeout(r, 20))
}






if (cancelledUploads.has(optimisticId)) {
  throw new Error(CANCEL_ERROR)
}


console.log("✅ all chunks uploaded")
    console.groupEnd()

    // ==================================================
    // ⛔ PAS D’ASSEMBLAGE ICI
    // ==================================================
    return {
      optimistic_id: optimisticId,
      upload_id: uploadId,
      total_chunks: totalChunks,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      folder_id: lockedFolderId.value || props.folderId,
        upload_token: uploadToken // 👈 AJOUT CRITIQUE

    }

  } catch (err) {
if (err.message === "upload-cancelled") {
  console.warn("🛑 chunked upload cancelled")
  return { cancelled: true }
}


console.error("💥 chunked upload error", err)
throw err

  }
  finally {
  uploading.value = false
}

}




const onDroppedFiles = (e) => {
  console.group("📥 onDroppedFiles")

  const detail = e.detail
  console.log("detail =", detail)

  // 🛑 garde-fous
  if (!detail || !Array.isArray(detail.files) || !detail.files.length) {
    console.warn("⛔ aucun fichier")
    console.groupEnd()
    return
  }

  if (uploading.value) {
    console.warn("⛔ upload déjà en cours")
    console.groupEnd()
    return
  }

  // 🔒 SESSION + DOSSIER FIGÉS POUR TOUT LE BATCH
  uploadSessionId.value = detail.session_id || null
  lockedFolderId.value = detail.folder_id || null

  console.log("📌 session =", uploadSessionId.value)
  console.log("📁 lockedFolderId =", lockedFolderId.value)

  // 📦 queue = wrappers { file, optimistic_id }
if (isMobile) {
  const tooBig = detail.files.find(w => w.file.size > MAX_MOBILE_SIZE)
  if (tooBig) {
    error.value = "⚠️ Vidéo volumineuse détectée. Garde l’écran allumé ou utilise un ordinateur."
    return
  }
}

filesQueue.value = detail.files

  console.log(
    "📦 queue init =",
    filesQueue.value.map(w => w.file.name)
  )

  dropLock.value = true
  error.value = ""

  console.groupEnd()

  // 🚀 lancement batch
  startNextUpload()
}

const resolveFolderId = (folderId) => {
  if (!folderId?.startsWith("TMP_")) return folderId

  const real = auth.folders?.find(
    f => f.tmp_id === folderId
  )

  return real?.folder_id || folderId
}



const startNextUpload = async () => {
  if (!lockedFolderId.value) {
    lockedFolderId.value = props.folderId
  }

  if (uploading.value) return

  uploading.value = true
  error.value = ""

  // 🔐 JWT une seule fois
  batchJwt = await getValidToken()

  const active = new Set()

  const launchNext = () => {
    // 🔁 remplir les slots tant que possible
    while (
      filesQueue.value.length &&
      active.size < MAX_PARALLEL
    ) {
      const wrapper = filesQueue.value.shift()

      console.log("📤 START FILE", wrapper.file.name)

      const p = Promise.resolve(uploadSingleFile(wrapper))
        .then(res => {
          if (!res) return

          console.log("🟢 upload resolved", res)

          emit("progress", {
            optimistic_id: res.optimistic_id,
            status: "done",
            message: "Terminé",
            progress: 100
          })

          const finalFolderId = resolveFolderId(res.folder_id)
          if (finalFolderId?.startsWith("TMP_")) {
            throw new Error("tmp-folder-not-resolved")
          }

          uploadedBatch.value.push({
            cours_id: props.coursId || "PARTITION",
            prof_id: auth.user.prof_id,
            eleve_id: props.eleveId || null,
            folder_id: finalFolderId,
            file_url: res.file_url,
            file_name: res.file_name,
            file_size: res.file_size,
            file_type: res.file_type,
            optimistic_id: res.optimistic_id
          })

          delete activeProgress.value[res.optimistic_id]
        })
        .catch(e => {
          let msg = "Échec de l’upload"

          if (e.message === "xhr-timeout") msg = "Upload interrompu"
          if (e.message === "xhr-aborted") msg = "Upload annulé"

          emit("error", {
            optimistic_id: wrapper.optimistic_id,
            message: msg
          })
        })
        .finally(() => {
          active.delete(p)
          console.log(
            "🏁 END FILE",
            wrapper.file.name,
            "queue =", filesQueue.value.length,
            "active =", active.size
          )
          launchNext() // 🔥 RELANCE OBLIGATOIRE
        })

      active.add(p)
    }
  }

  // 🚀 kickstart
  launchNext()

  // ⏳ attendre fin complète des fichiers
  while (active.size) {
    await new Promise(r => setTimeout(r, 20))
  }

  // ==================================================
  // 🚀 BATCH GAS FINAL (1 seul appel)
  // ==================================================
  if (uploadedBatch.value.length) {
    const sendAndEmit = async () => {
      const res = await fetch(getProxyPostURL(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route: "attachfilestocoursbatch",
          files: uploadedBatch.value
        })
      })

      const text = await res.text()

      let json = JSON.parse(text)
      if (json?.uploads?.length) {
        json.uploads.forEach(upload => {
          emit("uploaded", upload)
        })
      }
    }

    try {
      await sendAndEmit()
    } catch {
      await new Promise(r => setTimeout(r, 800))
      await sendAndEmit()
    }
  }

  // 🧹 reset
  uploadedBatch.value = []
  batchJwt = null
  uploading.value = false
  dropLock.value = false
  currentFile.value = null
  progress.value = 0
  uploadSessionId.value = null

  emit("done")
  if (fileInputRef.value) {
    fileInputRef.value.value = null
  }
}



const onCancelUpload = (e) => {
  const id = e.detail?.optimistic_id
  if (!id) return

  cancelledUploads.add(id)
  delete activeProgress.value[id]
  uploading.value = false

  // 🔥 reset input file (CRITIQUE)
  if (fileInputRef.value) {
    fileInputRef.value.value = null
  }

  // nettoyage async safe
  queueMicrotask(() => {
    cancelledUploads.delete(id)
  })

  emit("error", {
    optimistic_id: id,
    message: "Upload annulé"
  })
}



onMounted(() => {
  window.addEventListener("sbs-drop-files", onDroppedFiles)
    window.addEventListener("sbs-upload-cancel", onCancelUpload)

})

onUnmounted(() => {
  window.removeEventListener("sbs-drop-files", onDroppedFiles)
    window.removeEventListener("sbs-upload-cancel", onCancelUpload)

})

watch(activeProgress, updateGlobalProgress, { deep: true })
watch(
  () => props.folderId,
  () => {
    if (uploading.value) return

    lockedFolderId.value = null
    uploadSessionId.value = null
    uploadedBatch.value = []
    activeProgress.value = {}
  }
)

</script>


<style>
.upload-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Drop zone */
/* DROPZONE — SBS STYLE */
.drop-zone {
  all: unset; /* 🔥 reset total */
  box-sizing: border-box;

  width: 100%;
  padding: 36px 22px;
  border-radius: 18px;

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  background: rgba(255,255,255,.025);
  border: 2px dashed rgba(255,255,255,.14);

  cursor: pointer;
  user-select: none;

  transition:
    border-color .18s ease,
    background .18s ease,
    transform .18s ease,
    box-shadow .18s ease;
}

/* hover */
.drop-zone:hover {
  border-color: #facc15;
  background: rgba(250,204,21,.07);
}

/* contenu */
.drop-placeholder {
  text-align: center;
  color: #ccc;
}

.drop-placeholder span {
  font-size: .85rem;
  color: #aaa;
}

/* click */
.drop-zone:active {
  transform: scale(.985);
}


.file-selected strong {
  display: block;
  color: #fff;
}

.file-selected small {
  color: #aaa;
}

/* Progress */
.progress-bar-wrapper {
  height: 6px;
  background: #222;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: #ff8c00;
}

.upload-btn {
  all: unset;
  box-sizing: border-box;

  width: 100%;
  padding: 12px 16px;
  border-radius: 14px;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  font-weight: 600;
  font-size: .9rem;
  letter-spacing: .2px;

  color: #1a1a1a;
  background:
    linear-gradient(180deg, #ffb347, #ff8c00);

  box-shadow:
    0 10px 25px rgba(255,140,0,.35),
    inset 0 1px 0 rgba(255,255,255,.35);

  cursor: pointer;
  user-select: none;

  transition:
    transform .12s ease,
    box-shadow .12s ease,
    filter .12s ease;
}

/* hover */
.upload-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow:
    0 14px 34px rgba(255,140,0,.45),
    inset 0 1px 0 rgba(255,255,255,.45);
}

/* active */
.upload-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow:
    0 6px 16px rgba(255,140,0,.35),
    inset 0 2px 6px rgba(0,0,0,.25);
}

/* disabled */
.upload-btn:disabled {
  filter: grayscale(1);
  opacity: .45;
  cursor: not-allowed;
  box-shadow: none;
}


/* Loader */
.loader {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(0,0,0,0.3);
  border-top-color: #000;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Feedback */
.success {
  color: #4caf50;
  font-size: 0.9rem;
}

.error {
  color: #f44336;
  font-size: 0.9rem;
}
.upload-progress {
  height: 3px;
  width: 100%;
  background: rgba(255,255,255,.08);
  border-radius: 2px;
  overflow: hidden;
}

.upload-progress > span {
  display: block;
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #f5c16c, #facc15);
  transition: width .2s linear;
}
.drop-zone {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
}
.file-input {
  display: none;
}

.file-picker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  background: linear-gradient(135deg, #ff7a18, #ff9f43);
  color: #111;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transition: transform .15s ease, box-shadow .15s ease, opacity .15s;
}

.file-picker:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0,0,0,.25);
}

.file-picker:active {
  transform: translateY(0);
  opacity: .85;
}

.file-picker .icon {
  font-size: 18px;
  line-height: 1;
}


</style>

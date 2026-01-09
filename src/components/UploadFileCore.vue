<template>
  <div class="upload-form">

    <!-- DROP ZONE -->
<label
  class="drop-zone"
  @dragover.prevent
  @drop.prevent
>
   <input
  type="file"
  class="file-input"
  multiple
  @change="onFileSelect"
/>


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
import { getProxyPostURL } from "@/config/gas.ts"

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

const isMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent)
const MAX_MOBILE_SIZE = 50 * 1024 * 1024 // 50 Mo
let batchJwt = null
const MAX_PARALLEL = 3
const uploadedBatch = ref([])
const activeProgress = ref({}) // { optimistic_id: percent }
const globalProgress = ref(0)



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
  name: w.file.name,          // ✅ AJOUT
  file_name: w.file.name,
  file_size: w.file.size,
  folder_id: lockedFolderId.value,
  _optimistic: true,
  status: "uploading",
  progress: 0
})))


  filesQueue.value = wrappers
  error.value = ""

  emit("files-selected") // fermer la modale
  startNextUpload()
}

defineExpose({
  handleFiles
})
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
  uploadSessionId.value = crypto.randomUUID()

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
  filesQueue.value = wrappers

  error.value = ""

  // 🚀 lancer l’upload réel
  startNextUpload()
}




const uploadSingleFile = (wrapper) => {
  const file = wrapper.file
  const optimisticId = wrapper.optimistic_id

  return new Promise(async (resolve, reject) => {
    try {
      // ==================================================
      // 🔐 JWT
      // ==================================================
    const jwt = batchJwt
if (!jwt) throw new Error("jwt-missing")


      const proxyUrl = getProxyPostURL()
      const fileSizeMb = Math.ceil(file.size / 1024 / 1024)

      // ==================================================
      // 1️⃣ UPLOAD TOKEN
      // ==================================================
      const tokenPayload = {
        route: "getuploadtoken",
        jwt,
        prof_id: auth.user.prof_id,
        file_size_mb: fileSizeMb
      }

      if (props.eleveId) tokenPayload.eleve_id = props.eleveId
      if (props.coursId) tokenPayload.cours_id = props.coursId

      const rawRes = await fetch(proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tokenPayload)
      })

      const text = await rawRes.text()

      if (text.includes("quota_exceeded")) {
        throw new Error("quota_exceeded")
      }

      const tokenRes = JSON.parse(text)
      if (!tokenRes?.success || !tokenRes.token) {
        throw new Error("upload-token-failed")
      }

      // ==================================================
      // 2️⃣ PHP UPLOAD
      // ==================================================
      const formData = new FormData()
      formData.append("token", tokenRes.token)
      formData.append("file", file)

      const xhr = new XMLHttpRequest()
      xhr.open("POST", "https://www.sunbassschool.com/sbs-upload/upload.php")

      xhr.upload.onprogress = (e) => {
        if (!e.lengthComputable) return

     const p = Math.round((e.loaded / e.total) * 100)
emit("progress", { optimistic_id: optimisticId, progress: p })
activeProgress.value[optimisticId] = p

      }

      xhr.onerror = () =>
        reject(new Error("xhr-upload-failed"))

      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new Error("upload-http-error"))
          return
        }

        let res
        try {
          res = JSON.parse(xhr.responseText || "{}")
        } catch {
          reject(new Error("invalid-upload-json"))
          return
        }

        if (!res?.success || !res.url) {
          reject(new Error("php-upload-failed"))
          return
        }

        const effectiveFolderId =
          lockedFolderId.value || props.folderId

        if (!effectiveFolderId) {
          reject(new Error("folder-id-missing"))
          return
        }

        // ==================================================
        // ✅ RESOLVE POUR BATCH FINAL
        // ==================================================
        resolve({
          optimistic_id: optimisticId,
          file_url: res.url,
          file_name: res.name,
          file_size: res.size,
          file_type: file.type,
          folder_id: effectiveFolderId
        })
      }

      xhr.send(formData)

    } catch (err) {
      if (err.message === "quota_exceeded") {
        emit("error", {
          type: "quota",
          optimistic_id: optimisticId,
          message: "❌ Quota dépassé. Supprime des fichiers ou augmente ton espace."
        })
        return
      }

      reject(err)
    }
  })
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

  // 🔐 JWT UNE FOIS
  batchJwt = await getValidToken()

  const active = new Set()

const launchNext = async () => {
  if (!filesQueue.value.length) return
  if (active.size >= MAX_PARALLEL) return

  const wrapper = filesQueue.value.shift()

  const p = uploadSingleFile(wrapper)
    .then(res => {
      // 🔑 RÉSOLUTION DU FOLDER ID ICI (POINT CRITIQUE)
      const finalFolderId = resolveFolderId(res.folder_id)

      // 🛑 sécurité hard (dev)
      if (finalFolderId?.startsWith("TMP_")) {
        console.error("❌ TMP folder_id non résolu", finalFolderId)
        throw new Error("tmp-folder-not-resolved")
      }

      // 📦 batch backend (ID FINAL)
      uploadedBatch.value.push({
        cours_id: props.coursId || "PARTITION",
        prof_id: auth.user.prof_id,
        eleve_id: props.eleveId || null,
        folder_id: finalFolderId,
        file_url: res.file_url,
        file_name: res.file_name,
        file_size: res.file_size,
        file_type: res.file_type
      })

      // 🖥️ UI optimistic (ID FINAL AUSSI)
      emit("uploaded", {
        optimistic_id: res.optimistic_id,
        file_name: res.file_name,
        file_url: res.file_url,
        file_size: res.file_size,
        file_type: res.file_type,
        folder_id: finalFolderId,
        created_at: new Date().toISOString(),
        session_id: uploadSessionId.value
      })
        // 🧹 NETTOYAGE PROGRESS ICI
  delete activeProgress.value[res.optimistic_id]
    })
    .catch(e => {
      error.value = e?.message || "Erreur upload"
    })
    .finally(() => {
      active.delete(p)
    })

  active.add(p)
  launchNext()
}


  // 🚀 kickstart
  for (let i = 0; i < MAX_PARALLEL; i++) {
    launchNext()
  }

  // ⏳ attendre fin complète
  while (active.size) {
    await Promise.race(active)
    launchNext()
  }

  // ==================================================
  // 🚀 BATCH GAS FINAL (1 SEUL APPEL)
  // ==================================================
if (uploadedBatch.value.length) {
  const sendBatch = () =>
    fetch(getProxyPostURL(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "attachfilestocoursbatch",
        jwt: batchJwt,
        files: uploadedBatch.value
      })
    })

  try {
    await sendBatch()
  } catch (e) {
    console.warn("🔁 retry batch GAS")
    await new Promise(r => setTimeout(r, 800))
    await sendBatch()
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
}






onMounted(() => {
  window.addEventListener("sbs-drop-files", onDroppedFiles)
})

onUnmounted(() => {
  window.removeEventListener("sbs-drop-files", onDroppedFiles)
})

watch(activeProgress, updateGlobalProgress, { deep: true })

</script>


<style scoped>
.upload-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Drop zone */
.drop-zone {
  border: 2px dashed #ff8c00;
  border-radius: 12px;
  padding: 26px;
  text-align: center;
  cursor: pointer;
  background: rgba(255, 140, 0, 0.05);
}

.drop-zone:hover {
  background: rgba(255, 140, 0, 0.08);
}

.file-input {
  display: none;
}

.drop-placeholder {
  color: #ccc;
  font-size: 0.9rem;
}

.drop-placeholder span {
  font-size: 0.8rem;
  color: #aaa;
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

/* Button */
.upload-btn {
  background: #ff8c00;
  border: none;
  border-radius: 10px;
  padding: 10px;
  font-weight: 600;
  color: #000;
  cursor: pointer;
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

</style>

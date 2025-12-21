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

    <!-- PROGRESS -->
    <div v-if="progress > 0" class="progress-bar-wrapper">
      <p v-if="currentFile">
  {{ totalFiles }} fichier(s) en cours…
</p>

      <div class="progress-bar" :style="{ width: progress + '%' }"></div>
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



import { ref, computed, onMounted, onUnmounted, nextTick } from "vue"
import { useAuthStore } from "@/stores/authStore"
import { getValidToken } from "@/utils/api.ts"

const auth = useAuthStore()
const emit = defineEmits(["uploaded", "done"])
const uploadSessionId = ref(null)

const GAS_POST_ROUTE = "AKfycbywruw_pMa_mKp01OFXrlzpj2bXGdpppFW59S5jKa-666sxavdw5vLF-PQLlR77dkkB_A"
const isMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent)
const MAX_MOBILE_SIZE = 50 * 1024 * 1024 // 50 Mo

const getProxyPostURL = () => {
  const baseURL = `https://script.google.com/macros/s/${GAS_POST_ROUTE}/exec`
  return `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(baseURL)}`
}

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

const onFileSelect = e => {
  // ⛔ si un upload est déjà en cours via drop
  if (filesQueue.value.length || uploading.value) return

const files = Array.from(e.target.files)

if (isMobile) {
  const tooBig = files.find(f => f.size > MAX_MOBILE_SIZE)
  if (tooBig) {
    error.value = "⚠️ Fichier trop volumineux. Upload recommandé sur ordinateur."
    return
  }
}

filesQueue.value = files.map(file => ({
  file,
  optimistic_id: crypto.randomUUID()
}))

error.value = ""
lockedFolderId.value = props.folderId
uploadSessionId.value = crypto.randomUUID()

console.log("📁 lockedFolderId (button) =", lockedFolderId.value)

startNextUpload()

}


const uploadSingleFile = (fileWrapper) => {
  const file = fileWrapper.file       // 🔥 LE VRAI FILE
  const optimisticId = fileWrapper.optimistic_id

  console.group("📤 uploadSingleFile")
  console.log("file =", file.name)
  console.log("optimistic_id =", optimisticId)

  return new Promise(async (resolve, reject) => {
    try {
      const jwt = await getValidToken()
      const proxyUrl = getProxyPostURL()

      // 1️⃣ TOKEN
      const tokenRes = await fetch(proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route: "getuploadtoken",
          jwt,
          prof_id: auth.user.prof_id,
          ...(props.eleveId ? { eleve_id: props.eleveId } : {}),
          ...(props.coursId ? { cours_id: props.coursId } : {})
        })
      }).then(r => r.json())

      if (!tokenRes.success) throw tokenRes.error

      // 2️⃣ UPLOAD PHP
      const formData = new FormData()
      formData.append("token", tokenRes.token)
      formData.append("file", file) // ✅ vrai File

      const xhr = new XMLHttpRequest()
      xhr.open("POST", "https://www.sunbassschool.com/sbs-upload/upload.php")

      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          progress.value = Math.round((e.loaded / e.total) * 100)
        }
      }

      xhr.onload = async () => {
        try {
          const res = JSON.parse(xhr.responseText)
          if (!res.success) throw res.error

          // 3️⃣ ATTACH SHEET
          const attachRes = await fetch(proxyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              route: "attachfiletocours",
              jwt,
              prof_id: auth.user.prof_id,
              file_url: res.url,
              file_name: res.name,
              file_size: res.size,
              file_type: file.type,
folder_id: lockedFolderId.value || props.folderId,
              ...(props.eleveId ? { eleve_id: props.eleveId } : {}),
              ...(props.coursId ? { cours_id: props.coursId } : {})
            })
          }).then(r => r.json())

          if (!attachRes.success) throw "attach failed"

          // 🔥 EMIT AVEC optimistic_id
          emit("uploaded", {
            upload_id: attachRes.upload_id,
            optimistic_id: optimisticId,
            file_name: res.name,
            file_url: res.url,
            file_size: res.size,
            file_type: file.type,
folder_id: lockedFolderId.value,            created_at: new Date().toISOString(),
            session_id: uploadSessionId.value
          })

          resolve()
        } catch (err) {
          reject(err)
        }
      }

      xhr.onerror = err => reject(err)
      xhr.send(formData)

    } catch (e) {
      reject(e)
    }
  })
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



const startNextUpload = async () => {
  if (!lockedFolderId.value) {
  lockedFolderId.value = props.folderId
}

  console.group("🚀 startNextUpload")

  if (uploading.value) {
    console.warn("⛔ déjà en upload")
    console.groupEnd()
    return
  }

  uploading.value = true
  console.log("🔒 uploading = true")

  while (filesQueue.value.length) {
const wrapper = filesQueue.value.shift()

console.log("file =", wrapper.file.name)

currentFile.value = wrapper.file

progress.value = 0

try {
await uploadSingleFile(wrapper)
console.log("✅ upload terminé :", wrapper.file.name)

  // 🔥 force flush parent
  await nextTick()
} catch (e) {

      console.error("❌ upload failed :", file.name, e)
    }

    console.groupEnd()
  }

  console.log("🏁 FIN BATCH")

  uploading.value = false
  dropLock.value = false
  currentFile.value = null
  progress.value = 0
uploadSessionId.value = null

  emit("done")

  console.groupEnd()
}




onMounted(() => {
  window.addEventListener("sbs-drop-files", onDroppedFiles)
})

onUnmounted(() => {
  window.removeEventListener("sbs-drop-files", onDroppedFiles)
})

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
</style>

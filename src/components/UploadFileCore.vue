<template>
  <div class="upload-form">

    <!-- DROP ZONE -->
    <label class="drop-zone">
      <input
        type="file"
        class="file-input"
        @change="onFileSelect"
      />

      <div v-if="!file" class="drop-placeholder">
        📂 Dépose un fichier ici<br />
        <span>ou clique pour choisir</span>
      </div>

      <div v-else class="file-selected">
        <strong>{{ file.name }}</strong>
        <small>{{ (file.size / 1024 / 1024).toFixed(2) }} Mo</small>
      </div>
    </label>

    <!-- PROGRESS -->
    <div v-if="progress > 0" class="progress-bar-wrapper">
      <div class="progress-bar" :style="{ width: progress + '%' }"></div>
    </div>

    <!-- ACTIONS -->
    <button
      class="upload-btn"
      :disabled="!file || uploading"
      @click="startUpload"
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
import { ref } from "vue"
import { useAuthStore } from "@/stores/authStore"
import { getValidToken } from "@/utils/api.ts"

const auth = useAuthStore()
const emit = defineEmits(["uploaded"])

const GAS_POST_ROUTE = "AKfycbyeSHSoGZtq5jmhBZZn0ZidvzPyJo4VquV1Do_IPZqgepEExooy0d-sp4HDAAUuOOgLWA"

const getProxyPostURL = () => {
  const baseURL = `https://script.google.com/macros/s/${GAS_POST_ROUTE}/exec`
  return `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(baseURL)}`
}

// 🔧 props dynamiques
const props = defineProps({
  eleveId: { type: String, required: true },
  coursId: { type: String, required: true }
})

const file = ref(null)
const uploading = ref(false)
const progress = ref(0)
const successUrl = ref("")
const error = ref("")

const onFileSelect = e => {
  file.value = e.target.files[0]
  error.value = ""
}

const startUpload = async () => {
  if (!file.value) return

  uploading.value = true
  progress.value = 0
  error.value = ""
  successUrl.value = ""

  try {
    const jwt = await getValidToken()
    if (!jwt) throw new Error("JWT manquant")

    const proxyUrl = getProxyPostURL()

    const tokenRes = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "getuploadtoken",
        jwt,
        prof_id: auth.user.prof_id,
        eleve_id: props.eleveId,
        cours_id: props.coursId
      })
    }).then(r => r.json())

    if (!tokenRes.success) throw new Error(tokenRes.error)

    const formData = new FormData()
    formData.append("token", tokenRes.token)
    formData.append("file", file.value)

    const xhr = new XMLHttpRequest()
    xhr.open("POST", "https://www.sunbassschool.com/sbs-upload/upload.php")

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) {
        progress.value = Math.round((e.loaded / e.total) * 100)
      }
    }

   xhr.onload = async () => {
  let res

  try {
    res = JSON.parse(xhr.responseText)
  } catch {
    error.value = "Réponse upload invalide"
    return
  }

  if (!res.success) {
    error.value = res.error || "Erreur upload PHP"
    return
  }

  // 3️⃣ ENREGISTREMENT GOOGLE SHEET
  const attachRes = await fetch(proxyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      route: "attachfiletocours",
      jwt,
      cours_id: props.coursId,
      prof_id: auth.user.prof_id,
      eleve_id: props.eleveId,
      file_url: res.url,
      file_name: res.name,
      file_size: res.size,
      file_type: file.value.type
    })
  }).then(r => r.json())

  if (!attachRes.success) {
    error.value = "Erreur enregistrement Google Sheet"
    return
  }
emit("uploaded")

  successUrl.value = res.url
}

    xhr.onerror = () => (error.value = "Erreur réseau upload")
    xhr.send(formData)

  } catch (e) {
    error.value = e.message
  } finally {
    uploading.value = false
  }
}
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

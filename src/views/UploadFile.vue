<template>
  <Layout>
    <div class="upload-wrapper">
      <h3>Envoyer un fichier</h3>

      <input
        type="file"
        ref="fileInput"
        @change="onFileSelect"
        class="file-input"
      />

      <button
        class="btn-upload"
        :disabled="!file || uploading"
        @click="startUpload"
      >
        {{ uploading ? 'Upload...' : 'Envoyer' }}
      </button>

      <div v-if="progress > 0" class="progress">
        <div class="progress-bar" :style="{ width: progress + '%' }"></div>
      </div>

      <p v-if="successUrl" class="success">
        ✅ Upload OK
      </p>

      <p v-if="error" class="error">
        ❌ {{ error }}
      </p>
    </div>
  </Layout>
</template>

<script setup>
import { ref } from 'vue'
import Layout from '@/views/Layout.vue'
import { useAuthStore } from '@/stores/authStore'
import { getValidToken } from '@/utils/api.ts'

const auth = useAuthStore()

// 🔗 route GAS (même logique que tes autres vues)
const GAS_POST_ROUTE = "AKfycbwaC5H66_cp3lCHFtfEhwXGWqCuYonqVkAFAiLVPye1nwI5SVkz-WycyN0n1e-jMLOEvA"

const getProxyPostURL = () => {
  const baseURL = `https://script.google.com/macros/s/${GAS_POST_ROUTE}/exec`
  return `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(baseURL)}`
}

const file = ref(null)
const uploading = ref(false)
const progress = ref(0)
const successUrl = ref('')
const error = ref('')

const onFileSelect = (e) => {
  file.value = e.target.files[0]
  error.value = ''
}

const startUpload = async () => {
  if (!file.value) return

  uploading.value = true
  progress.value = 0
  error.value = ''
  successUrl.value = ''

  try {
    // 1️⃣ JWT
    const jwt = await getValidToken()
    if (!jwt) throw new Error("JWT manquant")

   
// 2️⃣ token upload (GAS) — PATCH OK
const proxyUrl = getProxyPostURL()

const payload = {
  route: "getUploadToken",
  jwt,
  prof_id: auth.user.prof_id,
  eleve_id: "a21b5b8f-24ba-4eb3-8db2-1d914cb4b056",
  cours_id: "C1765182186344997"
}

console.log("📤 PAYLOAD TOKEN =", payload)
console.log("🧭 GAS PROXY URL =", proxyUrl)

const rawResponse = await fetch(proxyUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
}).then(r => r.text())

console.log("📦 RAW GAS RESPONSE =", rawResponse)

let tokenRes
try {
  tokenRes = JSON.parse(rawResponse)
} catch (e) {
  throw new Error("GAS did not return JSON")
}

if (!tokenRes.success) {
  throw new Error(tokenRes.error || "Erreur token upload")
}

const token = tokenRes.token



    // 3️⃣ upload GoDaddy
    const formData = new FormData()
    formData.append("token", token)
    formData.append("file", file.value)

    const xhr = new XMLHttpRequest()
    xhr.open("POST", "https://www.sunbassschool.com/sbs-upload/upload.php")

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        progress.value = Math.round((e.loaded / e.total) * 100)
      }
    }

    xhr.onload = () => {
      const res = JSON.parse(xhr.responseText)
      if (!res.success) {
        error.value = res.error || "Erreur upload"
        return
      }
      successUrl.value = res.url
    }

    xhr.onerror = () => {
      error.value = "Erreur réseau upload"
    }

    xhr.send(formData)

  } catch (err) {
    error.value = err.message || "Erreur upload"
  } finally {
    uploading.value = false
  }
}
</script>


<style scoped>
.upload-wrapper {
  max-width: 480px;
  margin: 40px auto;
  padding: 24px;
  background: #111;
  border-radius: 8px;
  color: #eee;
}

h3 {
  margin-bottom: 16px;
}

.file-input {
  width: 100%;
  margin-bottom: 12px;
  background: #1a1a1a;
  color: #eee;
}

.btn-upload {
  width: 100%;
  padding: 10px;
  background: #222;
  border: 1px solid #333;
  color: #fff;
  cursor: pointer;
}

.btn-upload:disabled {
  opacity: 0.5;
}

.progress {
  height: 6px;
  background: #222;
  margin-top: 12px;
}

.progress-bar {
  height: 100%;
  background: #4caf50;
}

.success {
  margin-top: 12px;
  color: #4caf50;
}

.error {
  margin-top: 12px;
  color: #f44336;
}
</style>

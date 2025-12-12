<template>
  <div class="upload-wrapper">
    <h3>Envoyer un fichier</h3>

    <input type="file" @change="onFileSelect" class="file-input" />

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

    <p v-if="successUrl" class="success">✅ Upload OK</p>
    <p v-if="error" class="error">❌ {{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useAuthStore } from "@/stores/authStore"
import { getValidToken } from "@/utils/api.ts"

const auth = useAuthStore()

const GAS_POST_ROUTE = "AKfycbwaC5H66_cp3lCHFtfEhwXGWqCuYonqVkAFAiLVPye1nwI5SVkz-WycyN0n1e-jMLOEvA"

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
        route: "getUploadToken",
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

    xhr.onload = () => {
      const res = JSON.parse(xhr.responseText)
      if (!res.success) {
        error.value = res.error || "Erreur upload"
        return
      }
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

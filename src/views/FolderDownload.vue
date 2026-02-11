<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useRoute } from "vue-router"
import { gasPost } from "@/config/gas"

const route = useRoute()

const loading = ref(true)
const error = ref<string | null>(null)
const files = ref<any[]>([])
const done = ref(0)

onMounted(async () => {
  try {
    const res = await gasPost("resolveFolderDownload", {
      token: route.params.token
    })

    if (!res?.ok) {
      error.value = res?.error || "Lien invalide"
      loading.value = false
      return
    }

    files.value = res.files || []
    loading.value = false
    if (!files.value.length) return

    for (const f of files.value) {
      const a = document.createElement("a")
      a.href =
        "https://www.sunbassschool.com/download.php" +
        "?file=" + encodeURIComponent(f.url) +
        "&name=" + encodeURIComponent(f.name)

      a.download = f.name
      document.body.appendChild(a)
      a.click()
      a.remove()

      done.value++
      await new Promise(r => setTimeout(r, 400))
    }
  } catch (e: any) {
    error.value = e.message || "Erreur inattendue"
    loading.value = false
  }
})
</script>

<template>
  <div class="dl-page">
    <div v-if="loading">Préparation du téléchargement…</div>

    <div v-else-if="error">
      ❌ {{ error }}
    </div>

    <div v-else>
      <p>Téléchargement lancé</p>
      <p>{{ done }} / {{ files.length }} fichiers</p>
    </div>
  </div>
</template>

<style scoped>
.dl-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #0f0f0f;
  color: white;
  font-size: 16px;
}
</style>

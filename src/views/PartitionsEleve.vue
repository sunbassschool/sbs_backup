<template>
  <Layout>
    <div class="page">

      <header class="header">
        <h2>Partitions</h2>
      </header>

      <div v-if="loading" class="loading">
        Chargement des partitions…
      </div>

      <PartitionsList
        v-else-if="partitions.length"
        :partitions="partitions"
        readonly
      />

      <p v-else class="empty">
        Aucune partition partagée
      </p>

    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from "vue"
import Layout from "@/views/Layout.vue"
import PartitionsList from "@/components/partitions/PartitionsList.vue"
import { useAuthStore } from "@/stores/authStore"
import { getProxyPostURL } from "@/config/gas"

const auth = useAuthStore()
const proxyUrl = getProxyPostURL()

const partitions = ref([])
const loading = ref(true)

// ===============================
// 📦 CACHE
// ===============================
const CACHE_KEY = `partitions_eleve_${auth.user?.user_id || auth.user?.email}`
const CACHE_TTL = 5 * 60 * 1000 // 5 min

const loadFromCache = () => {
  const raw = localStorage.getItem(CACHE_KEY)
  if (!raw) return false

  try {
    const { data, ts } = JSON.parse(raw)
    if (!Array.isArray(data)) return false
    if (Date.now() - ts > CACHE_TTL) return false

    partitions.value = data
    loading.value = false
    return true
  } catch {
    return false
  }
}

const saveToCache = (list) => {
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      data: list,
      ts: Date.now()
    })
  )
}

// ===============================
// 🌐 FETCH
// ===============================
const fetchPartitions = async ({ silent = false } = {}) => {
  if (!silent) loading.value = true

  try {
    const res = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "getpartitionsforeleve",
        jwt: auth.jwt
      })
    }).then(r => r.json())

    if (res.success) {
      partitions.value = res.partitions || []
      saveToCache(partitions.value)
    }
  } catch (e) {
    console.error("❌ fetch partitions eleve", e)
  } finally {
    if (!silent) loading.value = false
  }
}

// ===============================
// 🚀 INIT
// ===============================
onMounted(async () => {
  const hasCache = loadFromCache()
  await fetchPartitions({ silent: hasCache })
})
</script>


<style scoped>
.page {
  padding: 16px;
}

.header h2 {
  color: #fff;
}

.loading,
.empty {
  color: #aaa;
  margin-top: 20px;
}
</style>

// src/stores/usePartitionsStore.js
import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { gasPost  } from "@/config/gas"

export const usePartitionsStore = defineStore("partitions", () => {
  const items = ref([])
  const loading = ref(false)
  const hasMore = ref(true)

  const limit = 100
  const offset = ref(0)

  const filters = ref({
    search: "",
    niveau: "",
    style: "",
    auteur: ""
  })

  /* =========================
     FETCH
     ========================= */
async function fetchMore(prof_id = null) {
  if (loading.value || !hasMore.value) return
  loading.value = true

  try {
    console.log("📤 getPartitions", {
      prof_id,
      limit,
      offset: offset.value
    })

    const json = await gasPost("getPartitions", {
      prof_id,
      limit,
      offset: offset.value
    })

    console.log("📥 getPartitions response", json)

    if (!json.ok) throw new Error(json.error)

    if (json.partitions.length < limit) {
      hasMore.value = false
    }

    items.value.push(...json.partitions)
    offset.value += limit

  } catch (e) {
    console.error("❌ partitions fetch FAILED", e)
  } finally {
    loading.value = false
  }
}

async function fetchAllIfSearching(prof_id = null) {
  if (!filters.value.search) return

  while (hasMore.value && !loading.value) {
    await fetchMore(prof_id)
  }
}

  function reset() {
    items.value = []
    offset.value = 0
    hasMore.value = true
  }

  /* =========================
     FILTERS (CLIENT)
     ========================= */
  function setFilters(f) {
    filters.value = f
  }

  const filtered = computed(() => {
    const q = filters.value.search.toLowerCase()

    return items.value.filter(p => {
      if (filters.value.niveau && p.niveau !== filters.value.niveau) return false
      if (filters.value.style && p.style !== filters.value.style) return false
      if (filters.value.auteur && p.auteur !== filters.value.auteur) return false

      if (q) {
        const hay = `${p.nom} ${p.auteur} ${p.mots_cles || ""}`.toLowerCase()
        if (!hay.includes(q)) return false
      }

      return true
    })
  })

  /* =========================
     FILTER OPTIONS
     ========================= */
  const niveaux = computed(() =>
    [...new Set(items.value.map(p => p.niveau).filter(Boolean))]
  )

  const styles = computed(() =>
    [...new Set(items.value.map(p => p.style).filter(Boolean))]
  )

  const auteurs = computed(() =>
    [...new Set(items.value.map(p => p.auteur).filter(Boolean))]
  )

return {
  items,
  filtered,
  niveaux,
  styles,
  auteurs,
  loading,
  hasMore,
  fetchMore,
  fetchAllIfSearching,
  reset,
  setFilters
}

})

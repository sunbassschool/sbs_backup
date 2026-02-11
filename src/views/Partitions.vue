<template>
  <Layout>
    <div class="iam-container">
      <!-- FILTERS -->
      <PartitionsFilters
        :niveaux="store.niveaux"
        :styles="store.styles"
        :auteurs="store.auteurs"
        @change="onFiltersChange"
      />

      <!-- LIST -->
      <div class="iam-list">


        <!-- CARDS -->
        <PartitionCard
          v-for="p in store.filtered"
          :key="p.id"
          :partition="p"
          @see="goToPartition"
        />

        <!-- LOAD MORE -->
        <button
          v-if="store.hasMore"
          class="btn-load"
          :disabled="store.loading"
          @click="loadMore"
        >
          {{ store.loading ? "Chargement…" : "Charger plus" }}
        </button>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { onMounted } from "vue"
import { useRouter } from "vue-router"
import Layout from "@/views/Layout.vue"
import PartitionCard from "@/components/partition/PartitionCard.vue"
import PartitionsFilters from "@/components/partition/PartitionsFilters.vue"
import { usePartitionsStore } from "@/stores/usePartitionsStore"
import { useAuthStore } from "@/stores/authStore.js"

const store = usePartitionsStore()
const auth = useAuthStore()
const router = useRouter()

function loadMore() {
  store.fetchMore(auth.user?.prof_id || null)
}

async function onFiltersChange(f) {
  store.setFilters(f)

  // 🔥 si recherche active → charger toute la base
  await store.fetchAllIfSearching(auth.user?.prof_id || null)
}


function goToPartition(p) {
  router.push(`/partition/${p.id}`)
}

onMounted(() => {
  store.reset()
  loadMore()
})
</script>

<style scoped>
/* =====================================================
   SBS – Partitions Page (Dark Premium)
   ===================================================== */

.iam-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 16px 14px 28px;
  padding-top: 35px;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  overflow-x: hidden;
}

@media (min-width: 900px) {
  .iam-container {
    grid-template-columns: 320px minmax(0, 1fr);
    max-width: 1200px;
  }
}

.iam-list {
  overflow-x: hidden;
}

.iam-list-header {
  margin-bottom: 12px;
}

.btn-load {
  width: 100%;
  margin-top: 14px;
  padding: 10px 0;
  border-radius: 12px;
  border: none;
  font-size: .85rem;
  font-weight: 600;
  background: rgba(255,160,60,.9);
  color: #000;
  cursor: pointer;
}

.btn-load:disabled {
  opacity: .6;
  cursor: default;
}
</style>

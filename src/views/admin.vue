<template>
  <Layout>
    <div class="admin-page dark-theme">
      <h3>🛠 Administration SBS</h3>

      <div class="admin-grid">
        <AdminCard
          title="Règles de marges SBS"
          description="Configurer les frais one-time et abonnements"
          icon="💰"
          @click="open('pricing')"
        />

        <!-- futurs modules -->
        <!--
        <AdminCard title="Quotas" icon="📦" />
        <AdminCard title="Plans profs" icon="⭐" />
        -->
      </div>

      <!-- MODALES -->
      <AdminModal v-if="activeModal === 'pricing'" @close="close">
        <AdminPricingRules />
      </AdminModal>

    </div>
  </Layout>
</template>
<script setup>
import { ref } from "vue"
import Layout from "@/views/Layout.vue"

import AdminCard from "@/components/admin/AdminCard.vue"
import AdminModal from "@/components/admin/AdminModal.vue"
import AdminPricingRules from "@/components/admin/AdminPricingRules.vue"

const activeModal = ref(null)

const open = (key) => {
  activeModal.value = key
}

const close = () => {
  activeModal.value = null
}
</script>
<style scoped>
/* Admin.vue (minimum clean) */
.admin-page {
  padding: 20px;
  color:white;
}

.admin-page h3 {
  margin-bottom: 14px;
}

.admin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

</style>

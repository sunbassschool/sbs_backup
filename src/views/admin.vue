<template>
  <Layout>
    <div class="admin-page">

      <div class="admin-header">
        <h1>Administration</h1>
        <p>Configuration avancée de la plateforme SBS</p>
      </div>

      <div class="admin-grid">
        <AdminCard
          title="Règles de marges SBS"
          description="Configurer les frais one-time et abonnements"
          icon="💰"
          @click="open('pricing')"
        />

        <AdminCard
          title="In-App Messages"
          description="Gérer les messages affichés aux utilisateurs"
          icon="📣"
          @click="$router.push('/admin/InAppMessagesAdmin')"
        />

            <AdminCard
          title="Dashboard"
          description="Dashboard"
          icon="🚀"
          @click="$router.push('/dashboard')"
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
/* =====================================================
   SBS – Admin Home (Dark Premium)
   ===================================================== */

.admin-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 14px 40px;
  color: #fff;
}

/* HEADER */
.admin-header {
  margin-bottom: 24px;
}

.admin-header h1 {
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: .3px;
}

.admin-header p {
  margin-top: 6px;
  font-size: .85rem;
  color: rgba(255,255,255,.55);
}

/* GRID */
.admin-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

/* DESKTOP */
@media (min-width: 768px) {
  .admin-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }
}


</style>

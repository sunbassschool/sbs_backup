<template>
  <div class="purchases-panel">

    <!-- ===================== -->
    <!-- ABONNEMENT -->
    <!-- ===================== -->
    <div class="section">
      <h2 class="section-title">Mon abonnement</h2>

      <!-- Loading -->
      <div v-if="loading">
        <div class="skeleton" />
      </div>

      <!-- Abonnement -->
      <div v-else-if="abonnement" class="item">
        <div class="item-main">
          <h3>{{ abonnement.product?.name || abonnement.droit }}</h3>

          <p v-if="abonnement.product?.description" class="desc">
            {{ abonnement.product.description }}
          </p>
        </div>

        <div class="item-meta">
          <span
            class="badge"
            :class="abonnement.actif ? 'ok' : 'off'"
          >
            {{ abonnement.actif ? "Actif" : "Inactif" }}
          </span>

          <span v-if="abonnement.date_fin">
            jusqu’au {{ formatDate(abonnement.date_fin) }}
          </span>
        </div>

        <a
          v-if="abonnement.invoice_url"
          :href="abonnement.invoice_url"
          target="_blank"
          class="link"
        >
          Voir la facture →
        </a>
      </div>

      <!-- Aucun abonnement -->
      <p v-else class="muted">Aucun abonnement actif</p>
    </div>

    <!-- ===================== -->
    <!-- ACHATS -->
    <!-- ===================== -->
    <div class="section">
      <h2 class="section-title">Mes achats</h2>

      <!-- Loading -->
      <div v-if="loading">
        <div class="skeleton" />
        <div class="skeleton" />
      </div>

      <!-- Liste achats -->
      <div v-else-if="achats.length">
        <div
          v-for="a in achats"
          :key="a.priceId"
          class="item"
        >
          <div class="item-main">
            <h3>{{ a.product?.name || a.droit }}</h3>

            <p v-if="a.product?.description" class="desc">
              {{ a.product.description }}
            </p>
          </div>

          <div class="item-meta">
            <span>
              acheté le {{ formatDate(a.date_debut) }}
            </span>
          </div>

          <a
            v-if="a.invoice_url"
            :href="a.invoice_url"
            target="_blank"
            class="link"
          >
            Voir la facture →
          </a>
        </div>
      </div>

      <!-- Aucun achat -->
      <p v-else class="muted">Aucun achat</p>
    </div>

  </div>
</template>


<script setup>
import { ref, onMounted } from "vue"
import { useAuthStore } from "@/stores/authStore"
import { getValidToken } from "@/utils/api"
import { getProxyPostURL } from "@/config/gas"

const auth = useAuthStore()
const proxyUrl = getProxyPostURL()

const abonnement = ref(null)
const achats = ref([])
const loading = ref(false)

const formatDate = d =>
  new Date(d).toLocaleDateString("fr-FR")

onMounted(fetchPurchases)

async function fetchPurchases() {
  loading.value = true
  const jwt = await getValidToken()

  const res = await fetch(proxyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      route: "getElevePurchases",
      jwt,
      prof_id: auth.user.prof_id,
      email: auth.user.email
    })
  }).then(r => r.json())

  if (res.success) {
    abonnement.value = res.abonnement
    achats.value = res.achats || []
  }

  loading.value = false
}
</script>

<style scoped>
/* =========================
   WRAPPER
   ========================= */
.purchases-panel {
  padding: 28px;
  max-width: 980px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .purchases-panel {
    padding: 36px;
  }
}

/* =========================
   SECTIONS
   ========================= */
.section {
  margin-bottom: 48px;
}

.section-title {
  font-size: 1.1rem;
  margin-bottom: 18px;
  color: #e6e6e6;
  font-weight: 500;
  letter-spacing: 0.3px;
}

/* =========================
   CARDS (APPLE STYLE)
   ========================= */
.item {
  background: #0b0c0f;          /* flat dark */
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 18px;
  border: none;
}

/* =========================
   TEXT
   ========================= */
.item-main h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: #f5f5f5;
}

.desc {
  font-size: 0.9rem;
  color: #b3b3b3;
  margin-top: 6px;
  line-height: 1.45;
}

/* =========================
   META
   ========================= */
.item-meta {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  font-size: 0.8rem;
  color: #8a8a8a;
}

/* =========================
   BADGES
   ========================= */
.badge {
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 500;
}

.badge.ok {
  background: rgba(234, 88, 12, 0.18); /* orange SBS */
  color: #fb923c;
}

.badge.off {
  background: rgba(120, 53, 15, 0.35);
  color: #fdba74;
}

/* =========================
   LINKS
   ========================= */
.link {
  display: inline-block;
  margin-top: 16px;
  font-size: 0.8rem;
  font-weight: 500;
  color: #fb923c;
  text-decoration: none;
}

.link:hover {
  opacity: 0.85;
}

/* =========================
   MUTED
   ========================= */
.muted {
  color: #777;
  font-size: 0.85rem;
}

/* =========================
   SKELETON (APPLE LIKE)
   ========================= */
.skeleton {
  width: 100%;
  height: 80px;
  border-radius: 18px;
  background: linear-gradient(
    90deg,
    #0b0c0f 25%,
    #1a1a1a 37%,
    #0b0c0f 63%
  );
  background-size: 400% 100%;
  animation: shine 1.6s ease infinite;
  margin-bottom: 18px;
}

@keyframes shine {
  0% { background-position: 100% 0 }
  100% { background-position: 0 0 }
}


</style>

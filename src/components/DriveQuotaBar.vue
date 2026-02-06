<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { gasPost } from "@/config/gas.ts"
import { useAuthStore } from "@/stores/authStore.js";

const auth = useAuthStore()

const loading = ref(true)
const error = ref(false)

const usedMb = ref(0)
const maxMb = ref(0)
const hasValidAuthQuota = computed(() => {
  return Number.isFinite(auth.user?.quota_mb) && auth.user.quota_mb > 0
})
const resolvedMaxMb = computed(() => {
  if (hasValidAuthQuota.value) {
    return auth.user.quota_mb
  }
  return maxMb.value || 2000
})
const formatMb = (mb: number) => {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} Go`
  }
  return `${mb} Mo`
}


/* =======================
   Computed
======================= */
const percent = computed(() => {
  if (!maxMb.value) return 0
  return Math.min(100, Math.round((usedMb.value / maxMb.value) * 100))
})

const barClass = computed(() => {
  if (percent.value < 70) return "bg-success"
  if (percent.value < 90) return "bg-warning"
  return "bg-danger"
})

const statusLabel = computed(() => {
  if (percent.value >= 100) return "Quota dépassé — uploads bloqués"
  if (percent.value >= 90) return "Quota presque atteint"
  return null
})
const quotaSource = ref<"auth" | "api" | "default">("default")

/* =======================
   API
======================= */
async function fetchQuota() {
  loading.value = true
  error.value = false

  try {
    const needFallback = !hasValidAuthQuota.value

    const res = await gasPost("getDriveQuota", {
      jwt: auth.jwt,
      user_id: auth.user?.user_id
    })

    if (!res?.success) throw new Error()

    usedMb.value = Number(res.used_mb) || 0

    if (needFallback) {
      maxMb.value = Number(res.max_mb) || 2000
    }

  } catch {
    if (!hasValidAuthQuota.value) {
      maxMb.value = 2000
    }
  } finally {
    loading.value = false

   console.log("📦 [DriveQuota] resolved", {
  auth_quota: auth.user?.quota_mb,
  usedMb: usedMb.value,
  maxMb_api: maxMb.value,
  resolved: resolvedMaxMb.value,
  privileges: auth.user?.privileges
})

  }
}




defineExpose({ refreshQuota: fetchQuota })
onMounted(fetchQuota)
</script>

<template>
  <div class="drive-quota">

    <!-- loading -->
    <div v-if="loading" class="quota-skeleton" />

    <!-- error -->
    <div v-else-if="error" class="text-muted small">
      Stockage indisponible
    </div>

    <!-- quota -->
    <div v-else>
      <div class="d-flex justify-content-between align-items-center mb-1">
        <span class="small text-muted">Stockage utilisé</span>
   <strong class="small">
{{ formatMb(usedMb) }} / {{ formatMb(resolvedMaxMb) }} · {{ percent }}%
</strong>

      </div>

      <div class="progress quota-bar">
        <div
          class="progress-bar"
          :class="barClass"
          :style="{ width: percent + '%' }"
        />
      </div>

      <div
        v-if="statusLabel"
        class="small mt-1"
        :class="percent >= 100 ? 'text-danger' : 'text-warning'"
      >
        {{ statusLabel }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.drive-quota {
  margin-bottom: 12px;
}

.quota-bar {
  height: 7px;
  border-radius: 6px;
}

.progress-bar {
  border-radius: 6px;
}

/* skeleton */
.quota-skeleton {
  height: 28px;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    #e9ecef 25%,
    #f8f9fa 37%,
    #e9ecef 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1.2s infinite;
}

@keyframes shimmer {
  0% { background-position: 100% 0 }
  100% { background-position: -100% 0 }
}
</style>

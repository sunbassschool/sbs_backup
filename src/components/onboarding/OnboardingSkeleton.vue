<template>
<div
  v-if="showOnboarding && !onboardingReady"
  class="onboarding-card skeleton-premium"
>
  <div class="sk-header">
    <div class="sk-title"></div>
    <div class="sk-progress"></div>
  </div>

  <ul class="sk-list">
    <li v-for="i in 4" :key="i" class="sk-row">
      <span class="sk-dot"></span>
      <span class="sk-line"></span>
    </li>
  </ul>

  <div class="sk-cta"></div>
</div>

</template>
<script setup lang="ts">
import { computed } from "vue"
import { useAuthStore } from "@/stores/authStore.js"

const auth = useAuthStore()

const showOnboarding = computed(() => auth.showOnboarding)
const onboardingReady = computed(() => auth.onboardingReady)
</script>


<style scoped>
.skeleton-premium {
  position: relative;
  padding: 16px;
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)),
    #0f0f10;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 10px 30px rgba(0,0,0,0.35);
  overflow: hidden;
}

/* shimmer overlay */
.skeleton-premium::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    110deg,
    transparent 25%,
    rgba(255,255,255,0.10) 37%,
    transparent 63%
  );
  transform: translateX(-100%);
  animation: shimmer-premium 1.4s infinite;
}

/* header */
.sk-header {
  display: grid;
  gap: 10px;
  margin-bottom: 14px;
}
.sk-title {
  height: 18px;
  width: 55%;
  border-radius: 10px;
  background: rgba(255,255,255,0.12);
}
.sk-progress {
  height: 6px;
  width: 100%;
  border-radius: 999px;
  background: rgba(255,255,255,0.10);
}

/* list */
.sk-list {
  list-style: none;
  padding: 0;
  margin: 14px 0;
  display: grid;
  gap: 12px;
}
.sk-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.sk-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255,255,255,0.14);
}
.sk-line {
  height: 14px;
  width: 70%;
  border-radius: 10px;
  background: rgba(255,255,255,0.12);
}

/* cta */
.sk-cta {
  height: 36px;
  width: 40%;
  border-radius: 12px;
  background: rgba(255,255,255,0.14);
}

/* animation */
@keyframes shimmer-premium {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}


</style>

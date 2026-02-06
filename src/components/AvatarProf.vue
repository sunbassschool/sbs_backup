<script setup lang="ts">

import { ref, computed, watch } from "vue"
function onImgError(e: Event) {
  const img = e.target as HTMLImageElement | null
  if (img) img.style.display = "none"
}
const imgError = ref(false)

const props = defineProps<{
  name: string
  src?: string | null
}>()

const initials = computed(() =>
  props.name
    .split(" ")
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join("")
)
watch(() => props.src, () => {
  imgError.value = false
})
</script>

<template>
  <div class="avatar">
    <img
      v-if="src"
      :src="src"
      alt=""
    @error="onImgError"
    />
    <span v-else class="initials">
      {{ initials }}
    </span>
  </div>
</template>
<style scoped>
.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;

  background: linear-gradient(180deg, #181818, #0c0c0c);
  border: 1px solid #2a2a2a;

  display: flex;
  align-items: center;
  justify-content: center;

  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.avatar .initials {
  font-weight: 600;
  font-size: 1.1rem;
  letter-spacing: 0.05em;
  color: #ff7c7c;
}

</style>

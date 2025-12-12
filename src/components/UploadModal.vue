<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-box">
      <UploadFileCore
        :eleve-id="auth.user.user_id"
        :cours-id="coursId"
      />
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from "@/stores/authStore"
import UploadFileCore from "@/components/UploadFileCore.vue"

defineProps({
  coursId: { type: String, required: true }
})

const auth = useAuthStore()
</script>

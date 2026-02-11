<!-- src/components/lead/LeadCaptureModal.vue -->
<script setup lang="ts">
import LeadCaptureForm from "@/src/components/LeadCapture.vue"

defineProps<{
  productId: string
  closable?: boolean
}>()

const emit = defineEmits(["close"])
</script>

<template>
  <teleport to="body">
    <div class="overlay">
      <div class="modal">
        <LeadCaptureForm
          :product-id="productId"
          @success="emit('close')"
        />
      </div>
    </div>
  </teleport>
</template>

<!-- src/components/lead/LeadCaptureForm.vue -->
<script setup lang="ts">
import { ref } from "vue"
import { captureLeadApi } from "@/api/Lead"

const props = defineProps<{
  productId: string
  source?: string
  title?: string
}>()


const email = ref("")
const loading = ref(false)
const success = ref(false)

const submit = async () => {
  loading.value = true

const res = await captureLeadApi({
  email: email.value,
  product_id: props.productId,
  source: props.source || "landing"
})


  success.value = true
  loading.value = false
}
</script>

<template>
  <div class="lead-form">
    <template v-if="!success">
      <input
        v-model="email"
        type="email"
        placeholder="Ton email"
      />

      <button @click="submit">
        {{ loading ? "Envoi…" : "Accéder gratuitement" }}
      </button>
    </template>

    <template v-else>
      <p>📩 Un email vient de t’être envoyé</p>
    </template>
  </div>
</template>

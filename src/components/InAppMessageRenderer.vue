<template>


  <ModalMessage
    v-if="message && message.display?.type === 'modal'"
    :message="message"
    @dismiss="onDismiss"
    @cta="onCta"
  />

  <BannerTop
    v-else-if="message && message.display?.type === 'banner'"
    :message="message"
    @dismiss="onDismiss"
    @cta="onCta"
  />
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { useInAppMessageStore } from "@/stores/inAppMessageStore"
import { useAuthStore } from "@/stores/authStore.js"
import { useRoute } from "vue-router"
import { useRouter } from "vue-router"
import { gasPost } from "@/config/gas.ts"

import ModalMessage from "@/components/inapp/ModalMessage.vue"
import BannerTop from "@/components/inapp/BannerTop.vue"

const store = useInAppMessageStore()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const message = ref<any>(null)
const triggered = ref(false)
const inAppFetched = ref(false)

console.log("📣 [InApp] renderer mounted")
watch(
  () => auth.jwt,
  (jwt) => {
    if (!jwt) {
      console.log("🔄 [InApp] logout detected → reset state")
      inAppFetched.value = false
      message.value = null
    }
  }
)

watch(
  () => auth.authReady,
  async ready => {
    if (!ready) return
    if (inAppFetched.value) return

    if (route.path.startsWith("/onboarding")) return
    if (["/login", "/register"].includes(route.path)) return

    inAppFetched.value = true

    await store.fetchMessages(false)

    message.value = store.selectMessage({
      trigger: "on_route",
      route: route.path
    })
  },
  { immediate: true }
)

watch(
  () => route.fullPath,
  () => {
    if (!auth.authReady) return
    if (!store.loaded) return

    if (route.path.startsWith("/onboarding")) {
      message.value = null
      return
    }

    const BLOCKED = ["/login", "/register"]
    if (BLOCKED.includes(route.path)) return

    message.value = store.selectMessage({
      trigger: "on_route",
      route: route.path
    })
  })

watch(
  message,
  async (m, prev) => {
    console.log("🧪 [InApp][IMP] watch fired", {
      now: m,
      prev,
      hasJwt: !!auth.jwt,
      route: route.path
    })

    // 1️⃣ pas de message
    if (!m) {
      console.log("⛔ [InApp][IMP] no message")
      return
    }

    // 2️⃣ sécurité JWT
 // 2️⃣ tracking seulement si connecté
if (!auth.jwt) {
  console.log("ℹ️ [InApp][IMP] guest → no tracking")
  return
}


    // 3️⃣ anti double impression (par rendu)
    if (prev && prev.id === m.id) {
      console.log("⏭️ [InApp][IMP] same message, skip")
      return
    }

    const payload = {
      jwt: auth.jwt,
      message_id: m.id,
      type: "impression",
  page: route.path
    }

    console.log("📤 [InApp][IMP] sending payload", payload)

    try {
      const res = await gasPost("trackInAppMessageEvent", payload)
      console.log("📥 [InApp][IMP] GAS response", res)
    } catch (e) {
      console.error("❌ [InApp][IMP] GAS error", e)
    }
  },
  { flush: "post" } // ⬅️ important : après rendu DOM
)



function onDismiss() {
  console.log("❌ [InApp] dismiss", message.value?.id)
  if (!message.value) return
  store.markSeen(message.value.id)
  message.value = null
}
function onCta() {
  if (!message.value) return

  const m = message.value
  const cta = m.content?.cta

  // 📊 track click
  gasPost("trackInAppMessageEvent", {
    jwt: auth.jwt,
    message_id: m.id,
    type: "click",
  page: route.path
  })

  // 🧠 mark seen
  store.markSeen(m.id)
  message.value = null

  if (!cta?.action) return

  if (cta.action === "route" && cta.payload) {
    router.push(cta.payload)
  }

  if (cta.action === "external" && cta.payload) {
    window.open(cta.payload, "_blank")
  }
}

</script>

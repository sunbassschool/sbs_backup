<template>


  <ModalMessage
    v-if="message && message.display?.type === 'modal'"
    :message="message"
      :lock="route.path === '/lead-access'"
    @dismiss="onDismiss"
    @cta="onCta"
      @cta-secondary="onSecondaryCta"

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
  () => store.current,
  (m) => {
    if (!m) return

    console.log("🔥 [InApp] event message received", m)

    message.value = m
  }
)

watch(
  () => [auth.authReady, auth.jwt],
  async ([ready, jwt]) => {
    if (!ready) return
    if (!jwt) return
    if (inAppFetched.value) return

    if (route.path.startsWith("/onboarding")) return
    if (["/login", "/register"].includes(route.path)) return

    inAppFetched.value = true

await store.fetchMessages(true)
if (!store.current) {
  message.value = store.selectMessage({
    trigger: "on_route",
    route: route.path
  })
}

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

if (!store.current) {
  message.value = store.selectMessage({
    trigger: "on_route",
    route: route.path
  })
}

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
  if (!message.value) return
  store.markSeen(message.value.id)
  store.clearCurrent()
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
  page: route.path,
  source: "lead_email"
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

function onSecondaryCta() {
  if (!message.value) return

  const cta = message.value.content?.cta?.secondary
  if (!cta?.action) return

  // tracking (optionnel)
  gasPost("trackInAppMessageEvent", {
    jwt: auth.jwt,
    message_id: message.value.id,
    type: "click_secondary",
    page: route.path,
    source: "lead_email",
    email: localStorage.getItem("lead_email")
  })

  store.clearCurrent()
  message.value = null

  if (cta.action === "route" && cta.payload) {
    router.push(cta.payload)
  }

  if (cta.action === "external" && cta.payload) {
    window.open(cta.payload, "_blank")
  }
}

</script>

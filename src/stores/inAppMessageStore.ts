import { defineStore } from "pinia"
import { gasPost } from "@/config/gas"
import { useAuthStore } from "@/stores/authStore.js"

import { matchTrigger, matchAudience, matchFrequency, isInSchedule } from "@/engine/inAppEngine"
const ALLOW_GUEST_INAPP = true

export const useInAppMessageStore = defineStore("inAppMessages", {
  state: () => ({
    messages: [] as any[],
    loaded: false,
    loading: false,
    lastFetchAt: 0
  }),

  actions: {
async fetchMessages(force = false) {
  const auth = useAuthStore()

  if (!auth.authReady) return
  if (auth.isRefreshing) return

  if (!auth.jwt && !ALLOW_GUEST_INAPP) return
  if (this.loaded && !force) return

  this.loading = true

  const res = await gasPost("getActiveInAppMessages", {
    jwt: auth.jwt
  })

  if (!res?.ok) {
    this.loading = false
    return
  }

  this.messages = res.messages || []
  this.loaded = true
  this.loading = false
}
,

   selectMessage(context: any) {
  console.group("🎯 [InAppStore] selectMessage")
  console.log("context =", context)

  const auth = useAuthStore()
  const user = auth.user

const candidates = this.messages.filter(m => {
  console.group(`🧪 [InApp][${m.id}]`)

  const t = matchTrigger(m, context)
  console.log("trigger =", t)

  const a = matchAudience(m, user)
  console.log("audience =", a)

  const s = isInSchedule(m)
  console.log("schedule =", s)

  const f = matchFrequency(m)
  console.log("frequency =", f)

  const ok = t && a && s && f
  console.log("👉 FINAL =", ok)

  console.groupEnd()
  return ok
})


  console.log("🎯 candidates =", candidates)
  console.groupEnd()

  if (!candidates.length) return null

  // priorité DESC
  candidates.sort((a, b) => (b.priority || 0) - (a.priority || 0))

  return candidates[0]
}
,

    markSeen(id: string) {
      console.log("👁️ [InAppStore] markSeen", id)
      const now = Date.now()
      localStorage.setItem(`inapp_seen_${id}`, "1")
      localStorage.setItem(`inapp_last_${id}`, String(now))
    },




    reset() {
      console.warn("♻️ [InAppStore] reset store")
      this.messages = []
      this.loaded = false
      this.loading = false
      this.lastFetchAt = 0
    }
  }
})

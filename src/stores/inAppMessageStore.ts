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
  lastFetchAt: 0,

  current: null as any | null // ✅
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


  const auth = useAuthStore()
  const user = auth.user

const candidates = this.messages.filter(m => {

  const t = matchTrigger(m, context)

  const a = matchAudience(m, user)

  const s = isInSchedule(m)

  const f = matchFrequency(m)

  const ok = t && a && s && f

  console.groupEnd()
  return ok
})


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
    },
 emitEvent(event: string, payload: any = {}) {
  console.log("🧠 EMIT EVENT", {
    event,
    payload,
    messages: this.messages.map(m => ({
      id: m.id,
      type: m.trigger?.type,
      route: m.trigger?.route,
      payload: m.trigger?.payload
    }))
  })

  const msg = this.selectMessage({
    trigger: "on_event",
    event,
    payload
  })

  console.log("🧠 MATCH RESULT =", msg)

  if (msg) this.current = msg
  return msg
}
,

  clearCurrent() {
    this.current = null
  }
  }
})

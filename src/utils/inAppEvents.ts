// src/utils/inAppEvents.ts
import { useInAppMessageStore } from "@/stores/inAppMessageStore"

export function pushInAppEvent(
  event: string,
  payload: Record<string, any> = {}
) {
  const store = useInAppMessageStore()

  return store.selectMessage({
    trigger: "on_event",
    event,
    payload
  })
}

// src/api/subscriptions.api.ts
import { gasPost } from "@/config/gas"
import { getSubsCache, setSubsCache } from "@/utils/subscriptionsCache.ts"

// src/api/subscriptions.api.ts
export async function getActiveSubscriptions(email: string) {
  console.log("🧪 getActiveSubscriptions → email =", email)

  const cached = getSubsCache(email)
  if (cached) {
    console.log("🧪 subs cache HIT", cached)
    return cached
  }

  console.log("🧪 subs cache MISS → call backend")
  const res = await gasPost("subscriptionsget-active", { email })

  console.log("🧪 backend response =", res)

  // ⛔ NE PAS CACHER LES ERREURS
  if (res?.success !== false) {
    setSubsCache(email, res)
  }

  return res
}



export function cancelSubscription(subId: string, stripeAccountId?: string) {
  return gasPost("subscriptionscancel-at-period-end", {
    subscription_id: subId,
    stripe_account_id: stripeAccountId || null
  })
}

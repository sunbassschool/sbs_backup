// src/engine/inAppEngine.ts

// ---------- TRIGGER ----------
type InAppMessage = Record<string, any>
type UserContext = Record<string, any>

export function matchTrigger(msg: InAppMessage, context: UserContext) {

  const type = (msg.trigger?.type || "").trim()
  const ruleRaw = (msg.trigger?.route || "").trim()

  if (type === "on_app_open")
    return context.trigger === "on_app_open"

  if (type !== "on_route") return false
  if (context.trigger !== "on_route") return false

  if (!ruleRaw || ruleRaw === "all" || ruleRaw === "*")
    return true

const rules = ruleRaw.split(",").map((r: string) => r.trim())
  const path = context.route

return rules.some((rule: string) => {
    if (rule.endsWith("*")) {
      const base = rule.slice(0, -1)
      return path.startsWith(base)
    }
    return path === rule
  })
}


// ---------- AUDIENCE ----------
export function matchAudience(msg: InAppMessage, user: UserContext) {

  const role = user?.role || "guest"

  const roleRule = (msg.audience?.role || "all")
    .split(",")
.map((r: string) => r.trim())

  const planRule = (msg.audience?.plan || "all").trim()

  // rôle
  if (!roleRule.includes("all") && !roleRule.includes(role))
    return false

  // guest → plan ignoré
  if (role === "guest") return true

  // plan (user / adherent uniquement)
  if (["user", "adherent"].includes(role) && planRule !== "all") {
    const isActive = user?.abo === "active"
    if (planRule === "free" && isActive) return false
    if (planRule === "active" && !isActive) return false
  }

  return true
}

// ---------- FREQUENCY ----------
export function matchFrequency(msg: InAppMessage) {

  const id = msg.id

  const seenKey = `inapp_seen_${id}`
  const lastKey = `inapp_last_${id}`

  const seen = localStorage.getItem(seenKey)
const lastRaw = localStorage.getItem(lastKey)
const last = lastRaw ? Number(lastRaw) : 0


  const type = (msg.frequency?.type || "always").trim()
  const value = Number(msg.frequency?.value || 0)

  if (type === "once" && seen) return false

  if (type === "daily" && last) {
    const today = new Date().toDateString()
    const lastDay = new Date(last).toDateString()
    if (today === lastDay) return false
  }

  if (type === "every_x_days" && last && value > 0) {
    const delay = value * 24 * 60 * 60 * 1000
    if (Date.now() - last < delay) return false
  }

  return true
}

// ---------- SCHEDULE ----------
export function isInSchedule(_: any) {

  // déjà filtré côté GAS
  return true
}

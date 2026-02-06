// src/utils/subscriptionsCache.ts
const TTL = 2 * 60 * 1000

export function getSubsCache(email: string) {
  const k = `subs_${email}`
  const raw = localStorage.getItem(k)
  if (!raw) return null
  const { t, data } = JSON.parse(raw)
  if (Date.now() - t > TTL) return null
  return data
}

export function setSubsCache(email: string, data: any) {
  localStorage.setItem(
    `subs_${email}`,
    JSON.stringify({ t: Date.now(), data })
  )
}

export function clearSubsCache(email: string) {
  localStorage.removeItem(`subs_${email}`)
}

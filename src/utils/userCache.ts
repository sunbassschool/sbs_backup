const USER_CACHE_TTL = 60_000 // 1 min

export function getCachedUser(email: string) {
  if (!email) return null

  try {
    const raw = localStorage.getItem(`userData_${email}`)
    const ts  = localStorage.getItem(`userData_ts_${email}`)
    if (!raw || !ts) return null

    if (Date.now() - Number(ts) > USER_CACHE_TTL) return null

    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setCachedUser(email: string, user: any) {
  if (!email || !user) return

  localStorage.setItem(`userData_${email}`, JSON.stringify(user))
  localStorage.setItem(`userData_ts_${email}`, String(Date.now()))
}

export function clearCachedUser(email: string) {
  if (!email) return
  localStorage.removeItem(`userData_${email}`)
  localStorage.removeItem(`userData_ts_${email}`)
}

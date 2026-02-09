import { getProxyPostURL } from "@/config/gas"
import { getValidToken } from "@/utils/api"

let refreshPromise: Promise<string | null> | null = null

async function getJwtSafe() {
  if (!refreshPromise) {
    refreshPromise = getValidToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

export async function apiFetch(route: string, payload: Record<string, any> = {}) {
  const jwt = await getJwtSafe()
  if (!jwt) throw new Error("NO_AUTH")

  const res = await fetch(getProxyPostURL(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      route,
      jwt,
      ...payload
    })
  })

  if (!res.ok) {
    throw new Error(`API_ERROR_${res.status}`)
  }

  return res.json()
}

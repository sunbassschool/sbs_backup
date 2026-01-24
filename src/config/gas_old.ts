/* =====================================================
   GAS CONFIG
===================================================== */
import { useAuthStore } from "@/stores/authStore.js"

export const GAS_POST_ROUTE =
  "AKfycbzxieWZZAjD42Y82jm9byBURUZf7j4o-IXcKVY_uv3zasg6daTxubu8dnW1X3_xu-DiRg"

const GAS_BASE_URL = `https://script.google.com/macros/s/${GAS_POST_ROUTE}/exec`
const CORS_PROXY = "https://cors-proxy-sbs.vercel.app/api/proxy?url="

export const getProxyPostURL = () =>
  CORS_PROXY + encodeURIComponent(GAS_BASE_URL)

export const getProxyGetURL = (params: string) =>
  CORS_PROXY + encodeURIComponent(`${GAS_BASE_URL}?${params}`)

/* =====================================================
   GAS RESILIENCE LAYER
===================================================== */

let gasDownUntil = 0
const GAS_TIMEOUT = 8000
const GAS_COOLDOWN = 15000

function guardGAS() {
  if (Date.now() < gasDownUntil) {
    throw new Error("GAS_DOWN")
  }
}

function markGASDown(ms = GAS_COOLDOWN) {
  gasDownUntil = Date.now() + ms
}

export function isGASDown() {
  return Date.now() < gasDownUntil
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = GAS_TIMEOUT
) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    })
  } finally {
    clearTimeout(id)
  }
}

async function retry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await fn()
  } catch (e: any) {
    // ❌ pas de retry sur erreurs HTTP
    if (e?.message?.startsWith("HTTP_")) throw e
    if (retries <= 0) throw e
    await new Promise(r => setTimeout(r, 500))
    return retry(fn, retries - 1)
  }
}

/* =====================================================
   POST
===================================================== */

export async function gasPost(route: string, payload: any = {}) {
  guardGAS()
  const url = getProxyPostURL()

  if (import.meta.env.DEV) {
    console.debug("[GAS POST]", route, payload)
  }

  try {
    const res = await retry(() =>
      fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ route, ...payload })
        },
        GAS_TIMEOUT
      )
    )

    if (!res.ok) {
      if ([502, 504].includes(res.status)) markGASDown()
      throw new Error(`HTTP_${res.status}`)
    }

    const raw = await res.text()

    // ⚠️ GAS peut renvoyer du HTML avec status 200
    if (raw.startsWith("<!DOCTYPE html")) {
      markGASDown()
      throw new Error("GAS_HTML_ERROR")
    }

    return JSON.parse(raw)

  } catch (e: any) {
    if (e.name === "AbortError") {
      markGASDown()
      throw new Error("GAS_TIMEOUT")
    }
    throw e
  }
}

/* =====================================================
   GET
===================================================== */

export async function gasGet(params: string) {
  guardGAS()
  const url = getProxyGetURL(params)

  if (import.meta.env.DEV) {
    console.debug("[GAS GET]", params)
  }

  try {
    const res = await retry(() =>
      fetchWithTimeout(
        url,
        {
          headers: { "Accept": "application/json" }
        },
        GAS_TIMEOUT
      )
    )

    if (!res.ok) {
      if ([502, 504].includes(res.status)) markGASDown()
      throw new Error(`HTTP_${res.status}`)
    }

    const raw = await res.text()

    if (raw.startsWith("<!DOCTYPE html")) {
      markGASDown()
      throw new Error("GAS_HTML_ERROR")
    }

    return JSON.parse(raw)

  } catch (e: any) {
    if (e.name === "AbortError") {
      markGASDown()
      throw new Error("GAS_TIMEOUT")
    }
    throw e
  }
}

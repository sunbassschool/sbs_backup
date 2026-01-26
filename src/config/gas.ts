/* =====================================================
   GAS CONFIG
===================================================== */

export const GAS_POST_ROUTE =
"AKfycbzipoL5sr2xTbdi7Gz5Hu_E1G3FzCa3OcitDvR1VIT-cXnv0mUx4QoQGIOvQ1zYz2ZYbQ"
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
  } catch (e) {
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

  try {
    const res = await retry(() =>
      fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

  try {
    const res = await retry(() =>
      fetchWithTimeout(url, {}, GAS_TIMEOUT)
    )

    if (!res.ok) {
      if ([502, 504].includes(res.status)) markGASDown()
      throw new Error(`HTTP_${res.status}`)
    }

    const raw = await res.text()
    return JSON.parse(raw)

  } catch (e: any) {
    if (e.name === "AbortError") {
      markGASDown()
      throw new Error("GAS_TIMEOUT")
    }
    throw e
  }
}

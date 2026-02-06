// src/utils/publicProfs.ts
import { gasPost } from "@/config/gas"

type Prof = any // remplace plus tard si tu veux typer

let CACHE: Prof[] | null = null
let PENDING: Promise<Prof[]> | null = null

export function prefetchPublicProfs(): Promise<Prof[]> {
  if (CACHE) return Promise.resolve(CACHE)
  if (PENDING) return PENDING

  PENDING = gasPost("getPublicProfs").then((res: any): Prof[] => {
    CACHE = Array.isArray(res) ? res : Array.isArray(res?.profs) ? res.profs : []
return CACHE ?? []
  })

  return PENDING
}

export function getCachedPublicProfs(): Prof[] | null {
  return CACHE
}

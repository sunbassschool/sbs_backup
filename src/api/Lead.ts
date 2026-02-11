// src/api/lead.ts
import { gasPost } from "@/config/gas"

export function captureLeadApi(payload: {
  email: string
  product_id: string
  source?: string
}) {
  return gasPost("captureLead", payload)
}

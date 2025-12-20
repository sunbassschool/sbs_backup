// src/utils/device.ts
// Identifiant device STABLE pour le multi-device

const DEVICE_ID_KEY = "sbs_device_id"

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)

  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }

  return deviceId
}

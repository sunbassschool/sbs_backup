export function getDeviceId() {
  let id =
    localStorage.getItem("device_id") ||
    localStorage.getItem("deviceId")

  if (!id) {
    id = crypto.randomUUID()
  }

  localStorage.setItem("device_id", id)
  localStorage.removeItem("deviceId")

  return id
}

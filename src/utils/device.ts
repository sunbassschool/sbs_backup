export function getDeviceId() {
  let id = localStorage.getItem("deviceId")

  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem("deviceId", id)
    console.log("🆕 deviceId généré :", id)
  }

  return id
}

export async function apiClient(payload: Record<string, any>) {
  const res = await fetch('/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const text = await res.text()
  console.log('RAW PROXY RESPONSE:', text)

  if (!text) {
    throw new Error('Proxy returned empty response')
  }

  const data = JSON.parse(text)

  if (!data.success) {
    throw new Error(data.error || 'API error')
  }

  return data
}

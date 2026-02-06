// src/utils/backgroundFetcher.ts
type Fetcher<T> = () => Promise<T>

const cache = new Map<string, any>()
const pending = new Map<string, Promise<any>>()

export function backgroundFetch<T>(
  key: string,
  fetcher: Fetcher<T>
): Promise<T> {
  if (cache.has(key)) return Promise.resolve(cache.get(key))
  if (pending.has(key)) return pending.get(key)!

  const p = fetcher()
    .then(res => {
      cache.set(key, res)
      pending.delete(key)
      return res
    })
    .catch(err => {
      pending.delete(key)
      throw err
    })

  pending.set(key, p)
  return p
}

export function getCached<T>(key: string): T | null {
  return cache.get(key) ?? null
}

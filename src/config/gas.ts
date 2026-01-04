export const GAS_POST_ROUTE =
"AKfycbzxXlNmLmDu5IgGDc3aUNpmKfilJrGedFgYW9f4TN3wPte4TzVzlUBK0goVCuqORm_91w"
const GAS_BASE_URL = `https://script.google.com/macros/s/${GAS_POST_ROUTE}/exec`
const CORS_PROXY = "https://cors-proxy-sbs.vercel.app/api/proxy?url="

export const getProxyPostURL = () =>
  CORS_PROXY + encodeURIComponent(GAS_BASE_URL)

export const getProxyGetURL = (params: string) =>
  CORS_PROXY + encodeURIComponent(`${GAS_BASE_URL}?${params}`)

export const GAS_POST_ROUTE =
"AKfycbwYwurSMNB-fNBgNNTJQE8KCFpX3SPxrM-y7AYYI_8-eFlYk-C28goeN4RGcrOw9_nbDA"
const GAS_BASE_URL = `https://script.google.com/macros/s/${GAS_POST_ROUTE}/exec`
const CORS_PROXY = "https://cors-proxy-sbs.vercel.app/api/proxy?url="

export const getProxyPostURL = () =>
  CORS_PROXY + encodeURIComponent(GAS_BASE_URL)

export const getProxyGetURL = (params: string) =>
  CORS_PROXY + encodeURIComponent(`${GAS_BASE_URL}?${params}`)

export const GAS_POST_ROUTE =
  "AKfycbyO07AJ_nhtGq-6liiu4J22SuR5_FWl8aQ4KOSUjdZpUR2qvgJHh_C45xBJxnCbrVP2aA";

export const getProxyPostURL = () => {
  const baseURL = `https://script.google.com/macros/s/${GAS_POST_ROUTE}/exec`;
  return `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(baseURL)}`;
};

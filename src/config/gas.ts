export const GAS_POST_ROUTE =
  "AKfycbxPAfd9GBnWT39i64aMZzl2ZzVDsqBiK8LcWF1z7aNl6JobuDuymq1t9Id6vnhbJee2bA";

export const getProxyPostURL = () => {
  const baseURL = `https://script.google.com/macros/s/${GAS_POST_ROUTE}/exec`;
  return `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(baseURL)}`;
};

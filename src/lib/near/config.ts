export const NETWORK_ID = (process.env.NEXT_PUBLIC_NEAR_NETWORK_ID || "testnet") as
  | "testnet"
  | "mainnet";

export const CONTRACT_NAME =
  process.env.NEXT_PUBLIC_NEAR_CONTRACT_NAME || "btq-token.testnet";

// rpc.*.near.org is rate-limited (429 without CORS headers), so browser calls fail; default to FastNEAR.
export const NEAR_NETWORK = {
  testnet: {
    networkId: "testnet",
    nodeUrl: process.env.NEXT_PUBLIC_NEAR_NODE_URL || "https://test.rpc.fastnear.com",
    helperUrl: "https://helper.testnet.near.org",
    explorerUrl: "https://testnet.nearblocks.io",
    indexerUrl: "https://test.api.fastnear.com/v0",
  },
  mainnet: {
    networkId: "mainnet",
    nodeUrl: process.env.NEXT_PUBLIC_NEAR_NODE_URL || "https://free.rpc.fastnear.com",
    helperUrl: "https://helper.mainnet.near.org",
    explorerUrl: "https://nearblocks.io",
    indexerUrl: "https://api.fastnear.com/v0",
  },
}[NETWORK_ID];

export const BTQ_DECIMALS = 18;
export const STORAGE_DEPOSIT_YOCTO = "1250000000000000000000"; // 0.00125 NEAR
export const DEFAULT_GAS = "30000000000000"; // 30 Tgas

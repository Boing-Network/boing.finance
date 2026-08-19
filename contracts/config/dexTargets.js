/**
 * EVM DEX rollout targets (factory + locker + router).
 * Ethereum (1) is intentionally excluded. Boing L1 (6913) is not EVM.
 *
 * Funding (seeding LP) is a later operator step — these targets stop at protocol deploy.
 */

const { ALL_NETWORKS } = require("./networks");

const ZERO = "0x0000000000000000000000000000000000000000";

/** Hardhat `--network` name → chain id */
const HARDHAT_NETWORK_BY_CHAIN_ID = {
  56: "bsc",
  137: "polygon",
  8453: "base",
  42161: "arbitrum",
  10: "optimism",
  43114: "avalanche",
  250: "fantom",
  59144: "linea",
  534352: "scroll",
  1101: "polygonZkEVM",
  5000: "mantle",
  81457: "blast",
  204: "opbnb",
  34443: "mode",
  100: "gnosis",
  1284: "moonbeam",
  1285: "moonriver",
  97: "bscTestnet",
  11155111: "sepolia",
};

/** Canonical wrapped native used by DEXRouter (do not deploy a second WETH on these chains). */
const WRAPPED_NATIVE_BY_CHAIN_ID = {
  56: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  137: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
  8453: "0x4200000000000000000000000000000000000006",
  42161: "0x82aF49447D8a07e3Bd95BD0d56f35241523fBab1",
  10: "0x4200000000000000000000000000000000000006",
  43114: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
  250: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83",
  59144: "0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f",
  534352: "0x5300000000000000000000000000000000000004",
  1101: "0x4F9A0e7FD2Bf6067db6994CF12E4495Df938E6e9",
  5000: "0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8",
  81457: "0x4300000000000000000000000000000000000004",
  204: "0x4200000000000000000000000000000000000006",
  34443: "0x4200000000000000000000000000000000000006",
  100: "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d",
  1284: "0xAcc15dC74880C9944775448304B263D191c6077F",
  1285: "0x98878B06940aE243284CA214f92Bb71a2b032B8A",
  97: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
  11155111: "0x49c39B1792CCE5fAf861Ed12Cd2d89bBabfE6c5C",
};

const SKIP = {
  1: "Ethereum excluded from this DEX rollout (gas + policy).",
  6913: "Boing L1 uses native VM AMM, not Solidity DEXFactory.",
  324: "zkSync Era needs the zkSync compiler / Hardhat plugin, not vanilla bytecode.",
  80001: "Polygon Mumbai is deprecated.",
  804: "PulseChain chain id in app config (804) is not the public PulseChain id (369); confirm before deploying.",
};

const PUBLIC_RPC_BY_CHAIN_ID = {
  56: ["https://bsc-dataseed.binance.org", "https://rpc.ankr.com/bsc"],
  137: ["https://polygon-rpc.com", "https://rpc.ankr.com/polygon"],
  8453: ["https://mainnet.base.org", "https://base-rpc.publicnode.com"],
  42161: ["https://arb1.arbitrum.io/rpc", "https://rpc.ankr.com/arbitrum"],
  10: ["https://mainnet.optimism.io", "https://optimism-rpc.publicnode.com"],
  43114: ["https://api.avax.network/ext/bc/C/rpc", "https://rpc.ankr.com/avalanche"],
  250: ["https://rpcapi.fantom.network", "https://rpc.ankr.com/fantom"],
  59144: ["https://rpc.linea.build", "https://linea.drpc.org"],
  534352: ["https://rpc.scroll.io", "https://scroll.drpc.org"],
  1101: ["https://zkevm-rpc.com", "https://polygon-zkevm.drpc.org"],
  5000: ["https://rpc.mantle.xyz", "https://mantle.drpc.org"],
  81457: ["https://rpc.blast.io", "https://blast.drpc.org"],
  204: ["https://opbnb-mainnet-rpc.bnbchain.org", "https://opbnb-rpc.publicnode.com"],
  34443: ["https://mainnet.mode.network", "https://mode.drpc.org"],
  100: ["https://rpc.gnosischain.com"],
  1284: ["https://1rpc.io/glmr", "https://moonbeam.drpc.org", "https://rpc.api.moonbeam.network"],
  1285: ["https://moonriver.drpc.org", "https://rpc.api.moonriver.moonbeam.network"],
  97: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
  11155111: ["https://ethereum-sepolia-rpc.publicnode.com", "https://rpc.sepolia.org"],
};

function isZeroAddress(addr) {
  if (!addr || typeof addr !== "string") return true;
  return addr.toLowerCase() === ZERO.toLowerCase();
}

function getSkipReason(chainId) {
  return SKIP[Number(chainId)] || null;
}

function getDexRolloutChainIds() {
  return Object.keys(HARDHAT_NETWORK_BY_CHAIN_ID)
    .map(Number)
    .filter((id) => !getSkipReason(id))
    .sort((a, b) => a - b);
}

function getHardhatNetworkName(chainId) {
  return HARDHAT_NETWORK_BY_CHAIN_ID[Number(chainId)] || null;
}

function getWrappedNative(chainId) {
  return WRAPPED_NATIVE_BY_CHAIN_ID[Number(chainId)] || null;
}

function getRpcUrls(chainId) {
  const id = Number(chainId);
  const fromMap = PUBLIC_RPC_BY_CHAIN_ID[id] || [];
  const fromAll = Object.values(ALL_NETWORKS).find((n) => n.chainId === id);
  const extra = fromAll?.rpcUrl ? [fromAll.rpcUrl] : [];
  return [...new Set([...fromMap, ...extra])];
}

function getNetworkLabel(chainId) {
  const id = Number(chainId);
  const fromAll = Object.values(ALL_NETWORKS).find((n) => n.chainId === id);
  return fromAll?.name || `chain ${id}`;
}

module.exports = {
  ZERO,
  HARDHAT_NETWORK_BY_CHAIN_ID,
  WRAPPED_NATIVE_BY_CHAIN_ID,
  SKIP,
  isZeroAddress,
  getSkipReason,
  getDexRolloutChainIds,
  getHardhatNetworkName,
  getWrappedNative,
  getRpcUrls,
  getNetworkLabel,
};

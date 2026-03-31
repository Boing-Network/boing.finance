/**
 * Feature support per network.
 * Derives from config/contracts.js so the app can show "Swap (via external DEX)",
 * "Create Pool (Sepolia only)", etc., and gate actions when contracts aren't deployed.
 */
import CONTRACTS, { getContractAddresses } from './contracts';
import { BOING_NATIVE_L1_CHAIN_ID } from './networks';

const ZERO = '0x0000000000000000000000000000000000000000';

/** All EVM chain IDs we have config for (numeric keys in CONTRACTS). */
const EVM_CHAIN_IDS = Object.keys(CONTRACTS)
  .filter((k) => /^\d+$/.test(k))
  .map(Number);

const hasDeployed = (addr) => addr && addr !== ZERO;

/**
 * Get feature support for a chain.
 * @param {number} chainId
 * @returns {{
 *   swap: 'boing' | 'external' | false,
 *   liquidity: boolean,
 *   createPool: boolean,
 *   deployToken: boolean,
 *   bridge: 'boing' | 'external' | false,
 *   hasDex: boolean,
 *   hasTokenFactory: boolean,
 * }}
 */
export function getFeatureSupport(chainId) {
  const c = getContractAddresses(chainId);
  if (!c) {
    return {
      swap: 'external',
      liquidity: false,
      createPool: false,
      deployToken: false,
      bridge: 'external',
      hasDex: false,
      hasTokenFactory: false
    };
  }

  const hasDex = hasDeployed(c.dexFactory) && hasDeployed(c.dexRouter);
  const hasTokenFactory = hasDeployed(c.tokenFactory);
  const hasBridge = hasDeployed(c.crossChainBridge);

  const onBoingNativeL1 = chainId === BOING_NATIVE_L1_CHAIN_ID;

  return {
    swap: hasDex ? 'boing' : 'external',
    liquidity: hasDex,
    createPool: hasDex,
    // Boing L1 uses direct bytecode deploy when TokenFactory is not deployed on-chain.
    deployToken: hasTokenFactory || onBoingNativeL1,
    bridge: hasBridge ? 'boing' : 'external',
    hasDex,
    hasTokenFactory
  };
}

/**
 * Chains where Create Pool / Liquidity (our DEX) is available.
 * Derived from contracts.js – DEXFactory + DEXRouter deployed.
 */
export function getChainsWithDex() {
  return EVM_CHAIN_IDS.filter((id) => getFeatureSupport(id).hasDex);
}

/**
 * Chains where Deploy Token (TokenFactory) is available.
 * Derived from contracts.js – TokenFactory deployed and not zero address.
 */
export function getChainsWithTokenFactory() {
  return EVM_CHAIN_IDS.filter((id) => getFeatureSupport(id).hasTokenFactory);
}

/**
 * Chains where Boing Bridge is available (CrossChainBridge deployed).
 */
export function getChainsWithBridge() {
  return EVM_CHAIN_IDS.filter((id) => getFeatureSupport(id).bridge === 'boing');
}

export default getFeatureSupport;

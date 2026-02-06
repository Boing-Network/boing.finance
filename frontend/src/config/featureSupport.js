/**
 * Feature support per network.
 * Derives from config/contracts.js so the app can show "Swap (via external DEX)",
 * "Create Pool (Sepolia only)", etc., and gate actions when contracts aren't deployed.
 */
import { getContractAddresses } from './contracts';

const ZERO = '0x0000000000000000000000000000000000000000';

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

  return {
    swap: hasDex ? 'boing' : 'external',
    liquidity: hasDex,
    createPool: hasDex,
    deployToken: hasTokenFactory,
    bridge: hasBridge ? 'boing' : 'external',
    hasDex,
    hasTokenFactory
  };
}

/**
 * Chains where Create Pool / Liquidity (our DEX) is available.
 */
export function getChainsWithDex() {
  return [11155111]; // Sepolia; add more as DEX is deployed
}

/**
 * Chains where Deploy Token (TokenFactory) is available.
 */
export function getChainsWithTokenFactory() {
  const chainIds = [1, 137, 56, 42161, 10, 8453, 11155111];
  return chainIds.filter((id) => {
    const s = getFeatureSupport(id);
    return s.hasTokenFactory;
  });
}

export default getFeatureSupport;

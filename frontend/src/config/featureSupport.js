/**
 * Feature support per network.
 * Derives from config/contracts.js so the app can show "Swap (via external DEX)",
 * "Create Pool (Sepolia only)", etc., and gate actions when contracts aren't deployed.
 */
import CONTRACTS, { getContractAddresses } from './contracts';
import { BOING_NATIVE_L1_CHAIN_ID } from './networks';

const ZERO = '0x0000000000000000000000000000000000000000';

/** True if hex is non-empty and not all-zero (supports 20-byte EVM or 32-byte Boing AccountId). */
function hasDeployedAddress(addr) {
  if (!addr || typeof addr !== 'string') return false;
  const h = addr.startsWith('0x') || addr.startsWith('0X') ? addr.slice(2) : addr;
  if (!/^[0-9a-fA-F]+$/i.test(h)) return false;
  return !/^0+$/i.test(h);
}

/** All EVM chain IDs we have config for (numeric keys in CONTRACTS). */
const EVM_CHAIN_IDS = Object.keys(CONTRACTS)
  .filter((k) => /^\d+$/.test(k))
  .map(Number);

const hasDeployed = (addr) => hasDeployedAddress(addr) && addr !== ZERO;

/**
 * Get feature support for a chain.
 * @param {number} chainId
 * @returns {{
 *   swap: 'boing' | 'native_amm' | 'external' | false,
 *   liquidity: boolean,
 *   createPool: boolean,
 *   deployToken: boolean,
 *   bridge: 'boing' | 'external' | false,
 *   hasDex: boolean,
 *   hasNativeAmm: boolean,
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
      hasNativeAmm: false,
      hasTokenFactory: false
    };
  }

  const hasDex = hasDeployed(c.dexFactory) && hasDeployed(c.dexRouter);
  const hasTokenFactory = hasDeployed(c.tokenFactory);
  const hasBridge = hasDeployed(c.crossChainBridge);

  const onBoingNativeL1 = chainId === BOING_NATIVE_L1_CHAIN_ID;
  const nativePool = c.nativeConstantProductPool;
  const hasNativeAmm = Boolean(onBoingNativeL1 && hasDeployedAddress(nativePool));

  return {
    swap: hasDex ? 'boing' : hasNativeAmm ? 'native_amm' : 'external',
    liquidity: hasDex,
    createPool: hasDex,
    // Boing L1 uses direct bytecode deploy when TokenFactory is not deployed on-chain.
    deployToken: hasTokenFactory || onBoingNativeL1,
    bridge: hasBridge ? 'boing' : 'external',
    hasDex,
    hasNativeAmm,
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

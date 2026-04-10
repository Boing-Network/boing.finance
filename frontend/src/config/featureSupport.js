/**
 * Feature support per network.
 * Derives from config/contracts.js so the app can show "Swap (via external DEX)",
 * "Create Pool (Sepolia only)", etc., and gate actions when contracts aren't deployed.
 */
import CONTRACTS, { getContractAddresses, getBoingNativeVmModuleId } from './contracts';
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
 * @param {{ nativeConstantProductPoolHex?: string | null }} [options] — optional pool from {@link fetchNativeDexIntegrationDefaults} when on 6913
 * @returns {{
 *   swap: 'boing' | 'native_amm' | 'external' | false,
 *   liquidity: boolean,
 *   createPool: boolean, // true for EVM DEX or native AMM add-liquidity on Boing L1
 *   deployToken: boolean,
 *   bridge: 'boing' | 'external' | false,
 *   hasDex: boolean,
 *   hasNativeAmm: boolean,
 *   hasTokenFactory: boolean,
 *   nativeVmDex: {
 *     factoryId: string | null,
 *     routerId: string | null,
 *     lockerId: string | null,
 *     swapParityMinimum: boolean,
 *     fullyConfigured: boolean,
 *   },
 * }}
 */
export function getFeatureSupport(chainId, options) {
  const c = getContractAddresses(chainId);
  const emptyVmDex = {
    factoryId: null,
    routerId: null,
    lockerId: null,
    swapParityMinimum: false,
    fullyConfigured: false,
  };

  if (!c) {
    return {
      swap: 'external',
      liquidity: false,
      createPool: false,
      deployToken: false,
      bridge: 'external',
      hasDex: false,
      hasNativeAmm: false,
      hasTokenFactory: false,
      nativeVmDex: emptyVmDex,
    };
  }

  // EVM-only: Boing L1 (6913) has no `dexFactory` in config — use `nativeVm` + native RPC instead.
  const hasDex = hasDeployed(c.dexFactory) && hasDeployed(c.dexRouter);
  const hasTokenFactory = hasDeployed(c.tokenFactory);
  const hasBridge = hasDeployed(c.crossChainBridge);

  const onBoingNativeL1 = chainId === BOING_NATIVE_L1_CHAIN_ID;
  const poolOverride =
    onBoingNativeL1 && options?.nativeConstantProductPoolHex && hasDeployedAddress(options.nativeConstantProductPoolHex)
      ? options.nativeConstantProductPoolHex
      : null;
  const nativePool = poolOverride || c.nativeConstantProductPool;
  const hasNativeAmm = Boolean(onBoingNativeL1 && hasDeployedAddress(nativePool));

  const factoryId = onBoingNativeL1 ? getBoingNativeVmModuleId(chainId, 'dexFactory') : null;
  const routerId = onBoingNativeL1 ? getBoingNativeVmModuleId(chainId, 'swapRouter') : null;
  const lockerId = onBoingNativeL1 ? getBoingNativeVmModuleId(chainId, 'liquidityLocker') : null;
  const nativeVmDex = {
    factoryId,
    routerId,
    lockerId,
    swapParityMinimum: Boolean(factoryId && routerId),
    /** Factory + multihop router; liquidity locker is optional. */
    fullyConfigured: Boolean(factoryId && routerId),
  };

  return {
    swap: hasDex ? 'boing' : hasNativeAmm ? 'native_amm' : 'external',
    /** EVM router/factory LP, or native CP pool add-liquidity on Boing L1. */
    liquidity: hasDex || hasNativeAmm,
    /** EVM factory pair creation, or native pool bootstrap via add-liquidity on Boing L1. */
    createPool: hasDex || hasNativeAmm,
    // Boing L1 uses direct bytecode deploy when TokenFactory is not deployed on-chain.
    deployToken: hasTokenFactory || onBoingNativeL1,
    bridge: hasBridge ? 'boing' : 'external',
    hasDex,
    hasNativeAmm,
    hasTokenFactory,
    nativeVmDex,
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

/**
 * Boing L1 “full DEX” experience matrix for UX and ops (VM-first, not EVM parity).
 * @param {number} chainId
 * @param {{ nativeConstantProductPoolHex?: string | null }} [options] — same as {@link getFeatureSupport}
 * @returns {{ items: Array<{ id: string, label: string, status: 'live' | 'partial' | 'planned', detail: string }> } | null}
 */
export function getBoingL1FullDexReadiness(chainId, options) {
  if (Number(chainId) !== BOING_NATIVE_L1_CHAIN_ID) return null;
  const fs = getFeatureSupport(chainId, options);

  const items = [
    {
      id: 'token_deploy',
      label: 'Deploy fungible tokens',
      status: fs.deployToken ? 'partial' : 'planned',
      detail: fs.deployToken
        ? 'Boing VM deploy + Boing Express; bytecode must match the node you use (QA).'
        : 'Not enabled for this chain in app config.',
    },
    {
      id: 'nft_deploy',
      label: 'Deploy NFT collections',
      status: 'partial',
      detail: 'Native collection deploy (contract_deploy_meta); needs operator bytecode and Boing Express.',
    },
    {
      id: 'cp_swap',
      label: 'Swap (native constant-product pool)',
      status: fs.hasNativeAmm ? 'live' : 'planned',
      detail: fs.hasNativeAmm
        ? 'Single pool: contract_call on configured AccountId + Boing Express.'
        : 'Configure a native pool id (build env or RPC defaults).',
    },
    {
      id: 'cp_liquidity',
      label: 'Add liquidity (same pool)',
      status: fs.hasNativeAmm ? 'live' : 'planned',
      detail: 'Same flow as the native swap panel / Create Pool (Boing) section.',
    },
    {
      id: 'new_pool_deploy',
      label: 'Deploy a new pool contract',
      status: 'partial',
      detail: 'Launch wizard pool bytecode (env + Advanced); not the EVM factory form.',
    },
    {
      id: 'multihop_factory',
      label: 'Multi-pair routing (factory + multihop router)',
      status: fs.nativeVmDex.swapParityMinimum ? 'partial' : 'planned',
      detail: fs.nativeVmDex.swapParityMinimum
        ? 'Factory and router are set. Automatic multi-pool paths appear after pairs are registered on the factory (operator bootstrap).'
        : 'Publish factory and multihop router module ids for your network.',
    },
    {
      id: 'locker',
      label: 'Liquidity locker module',
      status: fs.nativeVmDex.lockerId ? 'live' : 'planned',
      detail: fs.nativeVmDex.lockerId
        ? 'Locker AccountId is set in this build.'
        : 'Set REACT_APP_BOING_NATIVE_VM_LIQUIDITY_LOCKER when a locker is deployed.',
    },
    {
      id: 'pools_list',
      label: 'Pools explorer (factory list)',
      status: 'partial',
      detail:
        'On Boing testnet, use Swap → Pools for a native pool table and factory pair count. The EVM Pools page lists Solidity-backed pools on other networks.',
    },
    {
      id: 'bridge',
      label: 'In-app cross-chain bridge',
      status: 'planned',
      detail: 'This bridge UI targets EVM-style aggregators; a Boing VM bridge needs its own protocol + wallet flow.',
    },
    {
      id: 'explorer_transparency',
      label: 'Public transparency (Observer + artifacts)',
      status: 'partial',
      detail:
        'Deploy flows link to boing.observer (tx + contract when receipt logs carry address). Full “verified source” needs upstream artifacts / Observer contract pages.',
    },
  ];

  return { items };
}

export default getFeatureSupport;

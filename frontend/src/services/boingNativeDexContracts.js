/**
 * Boing L1 — future native VM DEX modules (factory / router / locker).
 * Solidity contracts in ../../contracts are EVM-only; this module tracks AccountIds and doc links.
 * @see ../../../../docs/boing-l1-vs-evm-dex.md
 */

import { getBoingNativeVmModuleId } from '../config/contracts';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';

/** When `1`, boing.finance treats native VM DEX UI as fully wired (hide “integration pending” banners). */
export function isNativeVmDexUiEnabled() {
  try {
    return String(process.env.REACT_APP_BOING_NATIVE_VM_DEX_UI || '').trim() === '1';
  } catch {
    return false;
  }
}

/**
 * Optional public URL for L1 DEX documentation (e.g. GitHub Pages or raw markdown viewer).
 * @returns {string | null}
 */
export function getBoingL1DexDocsUrl() {
  try {
    const raw = process.env.REACT_APP_BOING_L1_DEX_DOCS_URL;
    if (typeof raw === 'string' && /^https?:\/\//i.test(raw.trim())) {
      return raw.trim();
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * @param {number} chainId
 * @returns {null | {
 *   dexFactory: string | null,
 *   swapRouter: string | null,
 *   liquidityLocker: string | null,
 *   swapParityMinimum: boolean,
 *   fullyConfigured: boolean
 * }}
 */
export function getNativeVmDexModuleSummary(chainId) {
  if (Number(chainId) !== BOING_NATIVE_L1_CHAIN_ID) return null;
  const dexFactory = getBoingNativeVmModuleId(chainId, 'dexFactory');
  const swapRouter = getBoingNativeVmModuleId(chainId, 'swapRouter');
  const liquidityLocker = getBoingNativeVmModuleId(chainId, 'liquidityLocker');
  return {
    dexFactory,
    swapRouter,
    liquidityLocker,
    swapParityMinimum: Boolean(dexFactory && swapRouter),
    fullyConfigured: Boolean(dexFactory && swapRouter),
  };
}

/**
 * Placeholder for future calldata builders (factory create-pair, router swap, etc.).
 * Wire after Boing VM ABI/spec is frozen — see BOING-L1-DEX-ENGINEERING.md and https://github.com/Boing-Network/boing.network/blob/main/docs/HANDOFF-DEPENDENT-PROJECTS.md §4 (partner dApps)
 */
export const NativeVmDexCalldata = {
  /** @returns {never} */
  notImplemented(method) {
    throw new Error(
      `Native VM DEX calldata "${method}" is not implemented yet — see docs/boing-l1-dex-roadmap.md`,
    );
  },
};

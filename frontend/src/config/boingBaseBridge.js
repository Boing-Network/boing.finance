/**
 * Native Boing ↔ Base bridge (inventory-free, testnet-first).
 * Distinct from LI.FI (other chains). Addresses stay empty until Nico deploys Base Sepolia.
 */
import { BOING_NATIVE_L1_CHAIN_ID } from './networks';
import { PLATFORM_BRIDGE_FEE, PLATFORM_BRIDGE_FEE_BPS, PLATFORM_BRIDGE_FEE_LABEL } from './bridge';

export const BOING_BASE_BRIDGE_FEE = PLATFORM_BRIDGE_FEE;
export const BOING_BASE_BRIDGE_FEE_BPS = PLATFORM_BRIDGE_FEE_BPS;
export const BOING_BASE_BRIDGE_FEE_LABEL = PLATFORM_BRIDGE_FEE_LABEL;

/** Base Sepolia */
export const BASE_SEPOLIA_CHAIN_ID = 84532;
/** Base mainnet — not wired in UI until explicitly enabled. */
export const BASE_MAINNET_CHAIN_ID = 8453;

export const BOING_BASE_BRIDGE_TESTNET = {
  boingChainId: BOING_NATIVE_L1_CHAIN_ID,
  baseChainId: BASE_SEPOLIA_CHAIN_ID,
  /** Set via env after deploy; empty = UI shows “awaiting deploy”. */
  vault: String(import.meta.env.REACT_APP_BOING_BASE_BRIDGE_VAULT || '').trim(),
  bridgedBoing: String(import.meta.env.REACT_APP_BRIDGED_BOING_TOKEN || '').trim(),
  feeBps: BOING_BASE_BRIDGE_FEE_BPS,
};

export function isBoingBaseBridgeConfigured() {
  const v = BOING_BASE_BRIDGE_TESTNET.vault;
  const t = BOING_BASE_BRIDGE_TESTNET.bridgedBoing;
  return /^0x[0-9a-fA-F]{40}$/.test(v) && /^0x[0-9a-fA-F]{40}$/.test(t);
}

export function boingBaseBridgeStatusLabel() {
  if (!isBoingBaseBridgeConfigured()) {
    return 'Testnet contracts not deployed yet — operators must run Base Sepolia deploy + set env.';
  }
  return `Ready for testnet wiring (vault ${BOING_BASE_BRIDGE_TESTNET.vault.slice(0, 10)}…). Activation still requires BOING_BRIDGE_ACTIVATION_HEIGHT on Boing nodes.`;
}

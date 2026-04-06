import { BoingClient } from 'boing-sdk';
import { getBoingRpcClientBaseUrl } from './boingTestnetRpc';

let sharedClient = null;

/**
 * Single BoingClient for browser JSON-RPC (same-origin proxy or direct testnet URL).
 * @returns {import('boing-sdk').BoingClient}
 */
export function getSharedBoingClient() {
  if (!sharedClient) {
    sharedClient = new BoingClient({ baseUrl: getBoingRpcClientBaseUrl() });
  }
  return sharedClient;
}

/** Env overrides for {@link fetchNativeDexIntegrationDefaults} (highest precedence in SDK merge). */
export function buildNativeDexOverridesFromEnv() {
  try {
    const pool = (process.env.REACT_APP_BOING_NATIVE_AMM_POOL || '').trim();
    const fac = (process.env.REACT_APP_BOING_NATIVE_VM_DEX_FACTORY || '').trim();
    const o = {};
    if (/^0x[0-9a-fA-F]{64}$/i.test(pool)) {
      o.nativeCpPoolAccountHex = `0x${pool.slice(2).toLowerCase()}`;
    }
    if (/^0x[0-9a-fA-F]{64}$/i.test(fac)) {
      o.nativeDexFactoryAccountHex = `0x${fac.slice(2).toLowerCase()}`;
    }
    return Object.keys(o).length ? o : undefined;
  } catch {
    return undefined;
  }
}

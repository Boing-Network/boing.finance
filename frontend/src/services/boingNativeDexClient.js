import { buildNativeDexIntegrationOverridesFromProcessEnv } from 'boing-sdk';
import { createBoingBrowserRpcClient } from './boingTestnetRpc';

let sharedClient = null;

/**
 * Single BoingClient for browser JSON-RPC (same-origin proxy or direct testnet URL).
 * @returns {import('boing-sdk').BoingClient}
 */
export function getSharedBoingClient() {
  if (!sharedClient) {
    sharedClient = createBoingBrowserRpcClient();
  }
  return sharedClient;
}

/**
 * Build-time + process env overrides for {@link fetchNativeDexIntegrationDefaults}
 * (pool, factory, multihop router, LP vault/share, and other native DEX ids — see `buildNativeDexIntegrationOverridesFromProcessEnv` in boing-sdk).
 */
export function buildNativeDexOverridesFromEnv() {
  try {
    const o = buildNativeDexIntegrationOverridesFromProcessEnv();
    return Object.keys(o).length ? o : undefined;
  } catch {
    return undefined;
  }
}

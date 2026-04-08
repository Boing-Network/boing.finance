import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchNativeDexDirectorySnapshot,
  fetchNativeDexIntegrationDefaults,
  hydrateCpPoolVenuesFromRpc,
} from 'boing-sdk';
import { useWallet } from './WalletContext';
import { getContractAddress, getBoingNativeVmModuleId } from '../config/contracts';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { buildNativeDexOverridesFromEnv, getSharedBoingClient } from '../services/boingNativeDexClient';
import { fetchNativeCpPoolTokenRow } from '../services/boingNativePoolTokens';
import { BOING_OBSERVER_BASE_URL } from '../config/boingExplorerUrls';

/** @typedef {import('boing-sdk').NativeDexIntegrationDefaults} NativeDexIntegrationDefaults */
/** @typedef {import('boing-sdk').CpPoolVenue} CpPoolVenue */

const BoingNativeDexIntegrationContext = createContext(null);

/**
 * Fetches `boing_getNetworkInfo` DEX defaults and hydrates CP venues for SDK routing (single pool today; extensible to directory logs).
 */
export function BoingNativeDexIntegrationProvider({ children }) {
  const { chainId } = useWallet();
  const watchChainId = Number(chainId) || 0;
  const watchChainIdRef = useRef(watchChainId);
  watchChainIdRef.current = watchChainId;
  const fetchGenRef = useRef(0);

  const [defaults, setDefaults] = useState(null);
  const [venues, setVenues] = useState(/** @type {CpPoolVenue[]} */ ([]));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(/** @type {Error | null} */ (null));

  const staticPoolHex = useMemo(
    () => getContractAddress(BOING_NATIVE_L1_CHAIN_ID, 'nativeConstantProductPool') || '',
    []
  );
  const staticFactoryHex = useMemo(
    () => getBoingNativeVmModuleId(BOING_NATIVE_L1_CHAIN_ID, 'dexFactory') || '',
    []
  );

  const refresh = useCallback(async () => {
    const startedFor = watchChainIdRef.current;
    const myGen = ++fetchGenRef.current;
    if (startedFor !== BOING_NATIVE_L1_CHAIN_ID) {
      setDefaults(null);
      setVenues([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const client = getSharedBoingClient();
      const overrides = buildNativeDexOverridesFromEnv();
      const d = await fetchNativeDexIntegrationDefaults(client, overrides);
      if (watchChainIdRef.current !== startedFor) return;
      setDefaults(d);

      const poolHex = d.nativeCpPoolAccountHex;
      if (!poolHex) {
        setVenues([]);
        return;
      }

      const row = await fetchNativeCpPoolTokenRow(client, poolHex);
      if (watchChainIdRef.current !== startedFor) return;
      let v = await hydrateCpPoolVenuesFromRpc(client, [row], { concurrency: 4 });
      if (watchChainIdRef.current !== startedFor) return;

      const dirFromRaw = (process.env.REACT_APP_BOING_NATIVE_DEX_REGISTER_LOG_FROM_BLOCK || '').trim();
      const dirFrom = dirFromRaw === '' ? NaN : parseInt(dirFromRaw, 10);
      if (Number.isFinite(dirFrom) && dirFrom >= 0) {
        try {
          const snap = await fetchNativeDexDirectorySnapshot(client, {
            overrides,
            registerLogs: { fromBlock: dirFrom },
          });
          if (watchChainIdRef.current !== startedFor) return;
          const logs = snap.registerLogs;
          if (logs?.length) {
            const rows = logs.map((l) => ({
              poolHex: l.poolHex,
              tokenAHex: l.tokenAHex,
              tokenBHex: l.tokenBHex,
            }));
            const dirVenues = await hydrateCpPoolVenuesFromRpc(client, rows, { concurrency: 4 });
            if (watchChainIdRef.current !== startedFor) return;
            const byPool = new Map();
            for (const venue of [...v, ...dirVenues]) {
              byPool.set(venue.poolHex.toLowerCase(), venue);
            }
            v = [...byPool.values()];
          }
        } catch {
          /* keep canonical-pool venues only */
        }
      }

      if (watchChainIdRef.current !== startedFor) return;
      setVenues(v);
    } catch (e) {
      if (watchChainIdRef.current !== startedFor) return;
      setDefaults(null);
      setVenues([]);
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      if (fetchGenRef.current === myGen) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [watchChainId, refresh]);

  const effectivePoolHex = useMemo(() => {
    const fromRpc = defaults?.nativeCpPoolAccountHex;
    if (fromRpc) return fromRpc;
    return staticPoolHex || '';
  }, [defaults, staticPoolHex]);

  const effectiveFactoryHex = useMemo(() => {
    const fromRpc = defaults?.nativeDexFactoryAccountHex;
    if (fromRpc) return fromRpc;
    return staticFactoryHex || '';
  }, [defaults, staticFactoryHex]);

  const explorerBaseUrl = useMemo(() => {
    try {
      const envRaw = process.env.REACT_APP_BOING_EXPLORER_BASE_URL;
      if (typeof envRaw === 'string') {
        const e = envRaw.trim();
        if (e && /^https?:\/\//i.test(e)) return e.replace(/\/+$/, '');
      }
    } catch {
      /* ignore */
    }
    const rpc = defaults?.endUserExplorerUrl;
    if (typeof rpc === 'string' && rpc.trim() && /^https?:\/\//i.test(rpc.trim())) {
      return rpc.trim().replace(/\/+$/, '');
    }
    return BOING_OBSERVER_BASE_URL;
  }, [defaults]);

  const value = useMemo(
    () => ({
      defaults,
      venues,
      loading,
      error,
      refresh,
      effectivePoolHex,
      effectiveFactoryHex,
      explorerBaseUrl,
      poolSource: defaults?.poolSource ?? null,
      factorySource: defaults?.factorySource ?? null,
    }),
    [defaults, venues, loading, error, refresh, effectivePoolHex, effectiveFactoryHex, explorerBaseUrl]
  );

  return (
    <BoingNativeDexIntegrationContext.Provider value={value}>{children}</BoingNativeDexIntegrationContext.Provider>
  );
}

/** Safe where the provider may be absent (e.g. modals in tests). */
export function useOptionalBoingNativeDexIntegration() {
  return useContext(BoingNativeDexIntegrationContext);
}

export function useBoingNativeDexIntegration() {
  const ctx = useContext(BoingNativeDexIntegrationContext);
  if (!ctx) {
    throw new Error('useBoingNativeDexIntegration must be used within BoingNativeDexIntegrationProvider');
  }
  return ctx;
}

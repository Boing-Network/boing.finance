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
import {
  extractTokenDirectoryFromIndexer,
  fetchRemoteDexIndexerStats,
  updateLocalReserveSnapshotsAndScore,
} from '../services/nativeDexIndexerClient';
import { fetchOracleUsdPerUnitMap, loadNativeDexOracleMap } from '../services/nativeDexOracleUsd';
import { appendReserveHistorySamples, getReserveSamplingIntervalMs } from '../services/nativeDexReserveHistory';
import { loadVaultPoolMappings } from '../services/nativeDexVaultPoolMap';
import { mergeRemoteIndexerWithDirectoryPools } from '../services/nativeDexIndexerDirectoryMerge';
import {
  attachDexPoolDecimalsToVenues,
  collectAllDexPoolsPagesL1,
  collectAllDexTokensPagesL1,
  dexPoolListRowsToPoolTokenRows,
  dexTokenListRowsToPickerEntries,
  resolveNativeDexL1DiscoveryCapabilities,
} from '../services/nativeDexL1Discovery';
import { normalizeNativeVmTokenId32 } from '../services/nativeVmTokenRegistry';
import { BOING_OBSERVER_BASE_URL } from '../config/boingExplorerUrls';

/** @typedef {import('boing-sdk').NativeDexIntegrationDefaults} NativeDexIntegrationDefaults */
/** @typedef {import('boing-sdk').CpPoolVenue} CpPoolVenue */

const BoingNativeDexIntegrationContext = createContext(null);

/**
 * Fetches `boing_getNetworkInfo` DEX defaults, factory pair count (light snapshot), and hydrates CP venues for routing.
 */
export function BoingNativeDexIntegrationProvider({ children }) {
  const { chainId } = useWallet();
  const watchChainId = Number(chainId) || 0;
  const watchChainIdRef = useRef(watchChainId);
  watchChainIdRef.current = watchChainId;
  const fetchGenRef = useRef(0);
  const venuesRef = useRef(/** @type {CpPoolVenue[]} */ ([]));
  const softHydrateLockRef = useRef(false);

  const [defaults, setDefaults] = useState(null);
  /** Hydrated from RPC only; UI **`venues`** also merge L1 pool leg decimals. */
  const [venuesHydrated, setVenuesHydrated] = useState(/** @type {CpPoolVenue[]} */ ([]));
  /** Last **`boing_listDexPools`** page rows (light) for **`tokenADecimals` / `tokenBDecimals`** overlay. */
  const [l1DexPoolRows, setL1DexPoolRows] = useState(/** @type {import('boing-sdk').DexPoolListRow[]} */ ([]));
  /** RPC discovery metadata (supported methods, catalog, optional preflight). */
  const [dexDiscoveryRpcMeta, setDexDiscoveryRpcMeta] = useState(
    /** @type {{
     *   listTokens: boolean,
     *   listPools: boolean,
     *   rpcSupportedMethodCount: number,
     *   rpcCatalogNameCount: number,
     *   preflightSupportedMethodCount: number | null,
     *   preflightCatalogMethodCount: number | null,
     *   preflightClientVersion: string | null,
     * } | null} */ (null)
  );

  const venues = useMemo(
    () => attachDexPoolDecimalsToVenues(venuesHydrated, l1DexPoolRows),
    [venuesHydrated, l1DexPoolRows]
  );
  /** Factory `pairs_count` + chain head from a light directory snapshot (no log scan). */
  const [directoryMeta, setDirectoryMeta] = useState(
    /** @type {{ pairsCount: string | null; headHeight: number | null }} */ ({ pairsCount: null, headHeight: null })
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(/** @type {Error | null} */ (null));
  const [dexDirectoryExtras, setDexDirectoryExtras] = useState({
    registerPairLogCount: null,
    registerLogScanFromBlock: null,
  });
  const [remoteIndexerStats, setRemoteIndexerStats] = useState(null);
  /** L1 `boing_listDexTokens` rows (light); merged into picker directory ahead of indexer labels. */
  const [l1DexTokenRows, setL1DexTokenRows] = useState(/** @type {import('boing-sdk').DexTokenListRow[]} */ ([]));
  const [localPoolActivity, setLocalPoolActivity] = useState(/** @type {Record<string, { activityScore: string, hadPrior: boolean }>} */ ({}));
  const [oracleUsdByToken, setOracleUsdByToken] = useState(/** @type {Record<string, string>} */ ({}));
  const [oracleUsdLoading, setOracleUsdLoading] = useState(false);
  const [oracleUsdError, setOracleUsdError] = useState(/** @type {string | null} */ (null));

  const vaultPoolMappings = useMemo(() => loadVaultPoolMappings(), []);
  const oracleConfig = useMemo(() => loadNativeDexOracleMap(), []);
  const reserveSampleIntervalMs = useMemo(() => getReserveSamplingIntervalMs(), []);
  const indexerPickerTokens = useMemo(() => {
    const fromIndexer = extractTokenDirectoryFromIndexer(remoteIndexerStats);
    const fromL1 = dexTokenListRowsToPickerEntries(l1DexTokenRows);
    /** @type {Map<string, { id: string, symbol: string, name: string, decimals?: number }>} */
    const byId = new Map();
    for (const e of fromIndexer) {
      const id = normalizeNativeVmTokenId32(e.id);
      if (!id) continue;
      /** @type {{ id: string, symbol: string, name: string, decimals?: number }} */
      const row = { id, symbol: e.symbol, name: e.name };
      if (typeof e.decimals === 'number') row.decimals = e.decimals;
      byId.set(id, row);
    }
    for (const e of fromL1) {
      /** @type {{ id: string, symbol: string, name: string, decimals?: number }} */
      const row = { id: e.id, symbol: e.symbol, name: e.name };
      if (typeof e.decimals === 'number') row.decimals = e.decimals;
      byId.set(e.id, row);
    }
    return [...byId.values()];
  }, [remoteIndexerStats, l1DexTokenRows]);

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
      setVenuesHydrated([]);
      setDirectoryMeta({ pairsCount: null, headHeight: null });
      setDexDirectoryExtras({ registerPairLogCount: null, registerLogScanFromBlock: null });
      setRemoteIndexerStats(null);
      setL1DexTokenRows([]);
      setL1DexPoolRows([]);
      setDexDiscoveryRpcMeta(null);
      setLocalPoolActivity({});
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

      try {
        const lightSnap = await fetchNativeDexDirectorySnapshot(client, { overrides });
        if (watchChainIdRef.current !== startedFor) return;
        setDirectoryMeta({
          pairsCount:
            lightSnap.pairsCount != null && typeof lightSnap.pairsCount === 'bigint'
              ? lightSnap.pairsCount.toString()
              : lightSnap.pairsCount != null
                ? String(lightSnap.pairsCount)
                : null,
          headHeight: typeof lightSnap.headHeight === 'number' ? lightSnap.headHeight : null,
        });
      } catch {
        if (watchChainIdRef.current !== startedFor) return;
        setDirectoryMeta({ pairsCount: null, headHeight: null });
      }

      let l1Cap = {
        listTokens: false,
        listPools: false,
        methods: /** @type {string[]} */ ([]),
        catalogMethodNames: /** @type {string[]} */ ([]),
        preflight: /** @type {import('boing-sdk').BoingRpcPreflightResult | null} */ (null),
      };
      /** @type {import('boing-sdk').DexTokenListRow[]} */
      let l1Tokens = [];
      try {
        l1Cap = await resolveNativeDexL1DiscoveryCapabilities(client);
      } catch {
        l1Cap = {
          listTokens: false,
          listPools: false,
          methods: [],
          catalogMethodNames: [],
          preflight: null,
        };
      }
      if (watchChainIdRef.current !== startedFor) return;
      setDexDiscoveryRpcMeta({
        listTokens: l1Cap.listTokens,
        listPools: l1Cap.listPools,
        rpcSupportedMethodCount: l1Cap.methods.length,
        rpcCatalogNameCount: l1Cap.catalogMethodNames.length,
        preflightSupportedMethodCount: l1Cap.preflight?.supportedMethodCount ?? null,
        preflightCatalogMethodCount: l1Cap.preflight?.catalogMethodCount ?? null,
        preflightClientVersion: l1Cap.preflight?.health?.client_version ?? null,
      });
      if (l1Cap.listTokens) {
        try {
          const fac = (d.nativeDexFactoryAccountHex || '').trim();
          const factoryOpt = /^0x[0-9a-f]{64}$/i.test(fac) ? fac : undefined;
          l1Tokens = await collectAllDexTokensPagesL1(client, { factory: factoryOpt });
        } catch {
          l1Tokens = [];
        }
      }
      if (watchChainIdRef.current !== startedFor) return;
      setL1DexTokenRows(l1Tokens);

      const poolHex = d.nativeCpPoolAccountHex;
      if (!poolHex) {
        setVenuesHydrated([]);
        setL1DexPoolRows([]);
        setDexDirectoryExtras({ registerPairLogCount: null, registerLogScanFromBlock: null });
        setRemoteIndexerStats(null);
        setLocalPoolActivity({});
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
          setDexDirectoryExtras({
            registerPairLogCount: Array.isArray(logs) ? logs.length : null,
            registerLogScanFromBlock: dirFrom,
          });
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
          setDexDirectoryExtras({ registerPairLogCount: null, registerLogScanFromBlock: null });
          /* keep canonical-pool venues only */
        }
      } else {
        setDexDirectoryExtras({ registerPairLogCount: null, registerLogScanFromBlock: null });
      }

      const wantL1Pools = (process.env.REACT_APP_BOING_NATIVE_DEX_DISCOVERY_POOLS || '1').trim() !== '0';
      const facForPools = (d.nativeDexFactoryAccountHex || '').trim();
      const factoryOptPools = /^0x[0-9a-f]{64}$/i.test(facForPools) ? facForPools : undefined;
      /** @type {import('boing-sdk').DexPoolListRow[]} */
      let l1PoolsAll = [];
      if (wantL1Pools && l1Cap.listPools) {
        try {
          l1PoolsAll = await collectAllDexPoolsPagesL1(client, { factory: factoryOptPools });
          if (watchChainIdRef.current !== startedFor) return;
          const extraRows = dexPoolListRowsToPoolTokenRows(l1PoolsAll);
          const seen = new Set(v.map((x) => x.poolHex.toLowerCase()));
          const newRows = extraRows.filter((r) => r.poolHex && !seen.has(r.poolHex.toLowerCase()));
          if (newRows.length) {
            const hydratedExtra = await hydrateCpPoolVenuesFromRpc(client, newRows, { concurrency: 4 });
            if (watchChainIdRef.current !== startedFor) return;
            const byPool = new Map();
            for (const venue of [...v, ...hydratedExtra]) {
              byPool.set(venue.poolHex.toLowerCase(), venue);
            }
            v = [...byPool.values()];
          }
        } catch {
          /* keep v */
          l1PoolsAll = [];
        }
      }
      if (watchChainIdRef.current !== startedFor) return;
      setL1DexPoolRows(wantL1Pools && l1Cap.listPools ? l1PoolsAll : []);

      if (watchChainIdRef.current !== startedFor) return;
      setLocalPoolActivity(updateLocalReserveSnapshotsAndScore(v));
      appendReserveHistorySamples(v);
      try {
        let stats = await fetchRemoteDexIndexerStats();
        const dirBase = (process.env.REACT_APP_BOING_NATIVE_DEX_DIRECTORY_BASE_URL || '').trim();
        if (dirBase) {
          stats = await mergeRemoteIndexerWithDirectoryPools(stats, dirBase);
        }
        setRemoteIndexerStats(stats);
      } catch {
        setRemoteIndexerStats(null);
      }
      setVenuesHydrated(v);
    } catch (e) {
      if (watchChainIdRef.current !== startedFor) return;
      setDefaults(null);
      setVenuesHydrated([]);
      setDirectoryMeta({ pairsCount: null, headHeight: null });
      setDexDirectoryExtras({ registerPairLogCount: null, registerLogScanFromBlock: null });
      setRemoteIndexerStats(null);
      setL1DexTokenRows([]);
      setL1DexPoolRows([]);
      setDexDiscoveryRpcMeta(null);
      setLocalPoolActivity({});
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      if (fetchGenRef.current === myGen) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    venuesRef.current = venuesHydrated;
  }, [venuesHydrated]);

  const refreshVenuesSoft = useCallback(async () => {
    if (watchChainIdRef.current !== BOING_NATIVE_L1_CHAIN_ID) return;
    const rows = venuesRef.current;
    if (!rows.length) return;
    if (softHydrateLockRef.current) return;
    softHydrateLockRef.current = true;
    try {
      const client = getSharedBoingClient();
      const minimal = rows.map((v) => ({
        poolHex: v.poolHex,
        tokenAHex: v.tokenAHex,
        tokenBHex: v.tokenBHex,
      }));
      const v2 = await hydrateCpPoolVenuesFromRpc(client, minimal, { concurrency: 2 });
      if (watchChainIdRef.current !== BOING_NATIVE_L1_CHAIN_ID) return;
      appendReserveHistorySamples(v2);
      setLocalPoolActivity(updateLocalReserveSnapshotsAndScore(v2));
      setVenuesHydrated(v2);
    } catch {
      /* ignore */
    } finally {
      softHydrateLockRef.current = false;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [watchChainId, refresh]);

  const tokenSetForOracle = useMemo(() => {
    const { byToken } = oracleConfig;
    if (!byToken.size || !venues.length) return [];
    /** @type {Set<string>} */
    const out = new Set();
    for (const v of venues) {
      for (const t of [v.tokenAHex, v.tokenBHex]) {
        const k = (t || '').trim().toLowerCase();
        if (byToken.has(k)) out.add(k);
      }
    }
    return [...out].sort();
  }, [venues, oracleConfig]);

  useEffect(() => {
    if (watchChainId !== BOING_NATIVE_L1_CHAIN_ID) {
      setOracleUsdByToken({});
      setOracleUsdLoading(false);
      setOracleUsdError(null);
      return;
    }
    if (tokenSetForOracle.length === 0) {
      setOracleUsdByToken({});
      setOracleUsdLoading(false);
      setOracleUsdError(null);
      return;
    }
    const ac = new AbortController();
    const tid = setTimeout(() => {
      setOracleUsdLoading(true);
      setOracleUsdError(null);
      void fetchOracleUsdPerUnitMap(tokenSetForOracle, oracleConfig, { signal: ac.signal })
        .then((m) => {
          if (!ac.signal.aborted) setOracleUsdByToken(m);
        })
        .catch(() => {
          if (!ac.signal.aborted) {
            setOracleUsdByToken({});
            setOracleUsdError('CoinGecko oracle fetch failed');
          }
        })
        .finally(() => {
          if (!ac.signal.aborted) setOracleUsdLoading(false);
        });
    }, 400);
    return () => {
      clearTimeout(tid);
      ac.abort();
    };
  }, [watchChainId, tokenSetForOracle.join('|'), oracleConfig]);

  useEffect(() => {
    if (reserveSampleIntervalMs <= 0 || watchChainId !== BOING_NATIVE_L1_CHAIN_ID) return undefined;
    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      void refreshVenuesSoft();
    }, reserveSampleIntervalMs);
    return () => clearInterval(id);
  }, [watchChainId, reserveSampleIntervalMs, refreshVenuesSoft]);

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

  const effectiveMultihopRouterHex = useMemo(() => {
    const fromRpc = defaults?.nativeDexMultihopSwapRouterAccountHex;
    if (fromRpc) return fromRpc;
    return getBoingNativeVmModuleId(BOING_NATIVE_L1_CHAIN_ID, 'swapRouter') || '';
  }, [defaults]);

  const effectiveLedgerRouterV2Hex = useMemo(() => {
    const fromRpc = defaults?.nativeDexLedgerRouterV2AccountHex;
    if (fromRpc) return fromRpc;
    return getBoingNativeVmModuleId(BOING_NATIVE_L1_CHAIN_ID, 'ledgerRouterV2') || '';
  }, [defaults]);

  const effectiveLedgerRouterV3Hex = useMemo(() => {
    const fromRpc = defaults?.nativeDexLedgerRouterV3AccountHex;
    if (fromRpc) return fromRpc;
    return getBoingNativeVmModuleId(BOING_NATIVE_L1_CHAIN_ID, 'ledgerRouterV3') || '';
  }, [defaults]);

  const effectiveLpVaultHex = useMemo(() => {
    const fromRpc = defaults?.nativeAmmLpVaultAccountHex;
    if (fromRpc) return fromRpc;
    return getContractAddress(BOING_NATIVE_L1_CHAIN_ID, 'nativeAmmLpVault') || '';
  }, [defaults]);

  const effectiveLpShareHex = useMemo(() => {
    const fromRpc = defaults?.nativeLpShareTokenAccountHex;
    if (fromRpc) return fromRpc;
    return getContractAddress(BOING_NATIVE_L1_CHAIN_ID, 'nativeAmmLpShareToken') || '';
  }, [defaults]);

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
      directoryMeta,
      loading,
      error,
      refresh,
      effectivePoolHex,
      effectiveFactoryHex,
      effectiveMultihopRouterHex,
      effectiveLedgerRouterV2Hex,
      effectiveLedgerRouterV3Hex,
      effectiveLpVaultHex,
      effectiveLpShareHex,
      explorerBaseUrl,
      poolSource: defaults?.poolSource ?? null,
      factorySource: defaults?.factorySource ?? null,
      dexDirectoryExtras,
      remoteIndexerStats,
      indexerPickerTokens,
      dexDiscoveryRpcMeta,
      localPoolActivity,
      oracleUsdByToken,
      oracleUsdLoading,
      oracleUsdError,
      vaultPoolMappings,
      reserveSampleIntervalMs,
    }),
    [
      defaults,
      venues,
      directoryMeta,
      loading,
      error,
      refresh,
      effectivePoolHex,
      effectiveFactoryHex,
      effectiveMultihopRouterHex,
      effectiveLedgerRouterV2Hex,
      effectiveLedgerRouterV3Hex,
      effectiveLpVaultHex,
      effectiveLpShareHex,
      explorerBaseUrl,
      dexDirectoryExtras,
      remoteIndexerStats,
      indexerPickerTokens,
      dexDiscoveryRpcMeta,
      localPoolActivity,
      oracleUsdByToken,
      oracleUsdLoading,
      oracleUsdError,
      vaultPoolMappings,
      reserveSampleIntervalMs,
    ]
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

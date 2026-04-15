import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchCpRoutingFromDirectoryLogs } from 'boing-sdk';
import { useWallet } from '../contexts/WalletContext';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import { buildNativeDexOverridesFromEnv, getSharedBoingClient } from '../services/boingNativeDexClient';
import { encodeNativeAmmSwapCalldataHex } from '../services/nativeAmmCalldata';
import {
  nativeConstantProductPoolAccessListJson,
  nativeDexRouterAndPoolsAccessListJson,
} from '../services/nativeAmmAccessList';
import { buildMultihopRouterCalldataHexFromRoute } from '../services/nativeDexMultihopSwap';
import {
  boingExpressContractCallSignSimulateSubmit,
  boingExpressContractCallSignSimulateUntilOk,
} from '../services/boingExpressNativeTx';
import { submitBoingSignedTransaction, tryBoingUnsignedContractSimulate } from '../services/boingNativeVm';
import { normalizeNativeVmTokenId32 } from '../services/nativeVmTokenRegistry';
import { getWindowBoingProvider } from '../utils/boingWalletDiscovery';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';
import NativeVmTokenPickerField from './NativeVmTokenPickerField';

function pickExpressProvider(getWalletProvider) {
  try {
    const p = typeof getWalletProvider === 'function' ? getWalletProvider('boingExpress') : null;
    if (p && typeof p.request === 'function') return p;
  } catch {
    /* ignore */
  }
  return getWindowBoingProvider();
}

function parsePositiveBigInt(raw) {
  try {
    const t = (raw || '').trim();
    if (!t) return null;
    const n = BigInt(t);
    return n > 0n ? n : null;
  } catch {
    return null;
  }
}

/**
 * Multi-pool routing: best path across factory-registered pools, then one-tap swap via Boing Express.
 * @param {{
 *   slippagePercent?: number,
 *   embedded?: boolean,
 *   prefillKey?: number,
 *   prefillTokenIn?: string,
 *   prefillTokenOut?: string,
 * }} props
 */
export default function NativeDexDirectoryRoutePanel({
  slippagePercent = 0.5,
  embedded = false,
  prefillKey = 0,
  prefillTokenIn = '',
  prefillTokenOut = '',
}) {
  const { chainId, walletType, isConnected, getWalletProvider, account } = useWallet();
  const { effectiveMultihopRouterHex, venues, indexerPickerTokens } = useBoingNativeDexIntegration();

  const defaultFromBlock = useMemo(() => {
    const raw = (process.env.REACT_APP_BOING_NATIVE_DEX_REGISTER_LOG_FROM_BLOCK || '').trim();
    if (raw === '') return '0';
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? String(n) : '0';
  }, []);

  const [tokenIn, setTokenIn] = useState('');
  const [tokenOut, setTokenOut] = useState('');
  const [amountInStr, setAmountInStr] = useState('');
  const [fromBlockStr, setFromBlockStr] = useState(defaultFromBlock);
  const [routes, setRoutes] = useState(/** @type {import('boing-sdk').CpSwapRoute[]} */ ([]));
  const [routeMeta, setRouteMeta] = useState(/** @type {{ venues: number } | null} */ (null));
  const [findError, setFindError] = useState(/** @type {string | null} */ (null));
  const [finding, setFinding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [slippageLocal, setSlippageLocal] = useState(/** @type {number | null} */ (null));
  const [routePreview, setRoutePreview] = useState(
    /** @type {{ signedHex: string, fingerprint: string, simulation: Record<string, unknown> } | null} */ (null)
  );
  const [unsignedBusy, setUnsignedBusy] = useState(false);
  const [unsignedOut, setUnsignedOut] = useState(/** @type {unknown} */ (null));

  const effectiveSlippagePercent = slippageLocal ?? slippagePercent;

  const unsignedSimRaw = (process.env.REACT_APP_BOING_RPC_UNSIGNED_SIMULATE_METHOD ?? '').trim();
  const unsignedSimEnabled =
    Boolean(unsignedSimRaw) && unsignedSimRaw !== '0' && unsignedSimRaw.toLowerCase() !== 'off';

  const slippageBps = useMemo(
    () => Math.min(10_000, Math.max(0, Math.round(Number(effectiveSlippagePercent) * 100))),
    [effectiveSlippagePercent]
  );

  const routerHex = useMemo(() => (effectiveMultihopRouterHex || '').trim(), [effectiveMultihopRouterHex]);

  const tokenInHex = useMemo(() => normalizeNativeVmTokenId32(tokenIn), [tokenIn]);
  const tokenOutHex = useMemo(() => normalizeNativeVmTokenId32(tokenOut), [tokenOut]);
  const amountInBn = useMemo(() => parsePositiveBigInt(amountInStr), [amountInStr]);

  const fromBlockNum = useMemo(() => {
    const t = (fromBlockStr || '').trim();
    if (t === '') return NaN;
    const n = parseInt(t, 10);
    return Number.isFinite(n) && n >= 0 ? n : NaN;
  }, [fromBlockStr]);

  const onFindRoutes = useCallback(async () => {
    setFindError(null);
    setRoutes([]);
    setRouteMeta(null);
    if (!tokenInHex || !tokenOutHex) {
      setFindError('Enter valid 32-byte token ids (64 hex chars each).');
      return;
    }
    if (tokenInHex === tokenOutHex) {
      setFindError('Token in and token out must differ.');
      return;
    }
    if (amountInBn == null) {
      setFindError('Enter a positive integer amount in.');
      return;
    }
    if (!Number.isFinite(fromBlockNum)) {
      setFindError('Enter a valid starting block (0 = chain genesis; higher is faster if you know when your factory was created).');
      return;
    }

    setFinding(true);
    try {
      const client = getSharedBoingClient();
      const overrides = buildNativeDexOverridesFromEnv();
      const { routes: r, venues } = await fetchCpRoutingFromDirectoryLogs(
        client,
        tokenInHex,
        tokenOutHex,
        amountInBn,
        {
          overrides,
          registerLogs: { fromBlock: fromBlockNum },
          maxHops: 4,
          maxRoutes: 12,
          hydrateConcurrency: 6,
        }
      );
      setRoutes(Array.isArray(r) ? r : []);
      setRouteMeta({ venues: venues?.length ?? 0 });
      setSelectedIdx(0);
      if (!r?.length) {
        setFindError('No route found for this pair and amount. Check token ids, or register more pools on the factory.');
      }
    } catch (e) {
      setFindError(e?.message || 'Failed to fetch routes from directory logs.');
    } finally {
      setFinding(false);
    }
  }, [amountInBn, fromBlockNum, tokenInHex, tokenOutHex]);

  useEffect(() => {
    if (!prefillKey) return;
    const tin = (prefillTokenIn || '').trim();
    const tout = (prefillTokenOut || '').trim();
    if (tin) setTokenIn(tin.startsWith('0x') ? tin : `0x${tin}`);
    if (tout) setTokenOut(tout.startsWith('0x') ? tout : `0x${tout}`);
  }, [prefillKey, prefillTokenIn, prefillTokenOut]);

  const onFlipTokens = useCallback(() => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
  }, [tokenIn, tokenOut]);

  const selectedRoute = routes[selectedIdx];

  const routeTxFingerprint = useMemo(() => {
    if (!selectedRoute?.hops?.length) return '';
    return JSON.stringify({
      selectedIdx,
      amountInStr,
      slippageBps,
      tokenInHex,
      tokenOutHex,
      amountOut: selectedRoute.amountOut.toString(),
      hops: selectedRoute.hops.length,
      routerHex: routerHex || '',
    });
  }, [
    selectedRoute,
    selectedIdx,
    amountInStr,
    slippageBps,
    tokenInHex,
    tokenOutHex,
    routerHex,
  ]);

  const quoteSummary = useMemo(() => {
    if (!selectedRoute?.hops?.length) return null;
    const grossOut = selectedRoute.amountOut;
    const minOut = (grossOut * (10_000n - BigInt(slippageBps))) / 10_000n;
    return { grossOut, minOut, hopCount: selectedRoute.hops.length };
  }, [selectedRoute, slippageBps]);

  const buildRouteContractCallTx = useCallback(() => {
    if (!selectedRoute?.hops?.length || !account) return null;
    const hops = selectedRoute.hops;
    const n = hops.length;
    if (n === 1) {
      const hop = hops[0];
      const minOut = (hop.amountOut * (10_000n - BigInt(slippageBps))) / 10_000n;
      const calldata = encodeNativeAmmSwapCalldataHex(hop.directionForSwapCalldata, hop.amountIn, minOut);
      const pool = hop.venue.poolHex;
      const accessList = nativeConstantProductPoolAccessListJson(account, pool);
      return {
        type: 'contract_call',
        contract: pool,
        calldata,
        ...(accessList ? { access_list: accessList } : {}),
      };
    }
    if (!routerHex) return null;
    const calldata = buildMultihopRouterCalldataHexFromRoute(selectedRoute, slippageBps);
    const poolHexes = hops.map((h) => h.venue.poolHex);
    const accessList = nativeDexRouterAndPoolsAccessListJson(account, routerHex, poolHexes);
    return {
      type: 'contract_call',
      contract: routerHex,
      calldata,
      ...(accessList ? { access_list: accessList } : {}),
    };
  }, [account, routerHex, selectedRoute, slippageBps]);

  useEffect(() => {
    setRoutePreview(null);
  }, [routeTxFingerprint]);

  const onPreviewSwap = async () => {
    if (chainId !== BOING_NATIVE_L1_CHAIN_ID || walletType !== 'boingExpress' || !isConnected) {
      toast.error('Connect with Boing Express on Boing testnet (6913).');
      return;
    }
    if (!selectedRoute?.hops?.length) {
      toast.error('Find a route first.');
      return;
    }
    const tx = buildRouteContractCallTx();
    if (!tx) {
      toast.error('This build has no multihop router configured for multi-hop routes.');
      return;
    }
    const p = pickExpressProvider(getWalletProvider);
    if (!p) {
      toast.error('Boing Express provider not found.');
      return;
    }
    setPreviewBusy(true);
    try {
      const { signedHex, simulation } = await boingExpressContractCallSignSimulateUntilOk(p, tx);
      setRoutePreview({
        signedHex,
        fingerprint: routeTxFingerprint,
        simulation: simulation && typeof simulation === 'object' ? { ...simulation } : {},
      });
      toast.success('Signed + simulated OK — review gas below, then broadcast.');
    } catch (e) {
      setRoutePreview(null);
      toast.error(formatBoingExpressRpcError(e));
    } finally {
      setPreviewBusy(false);
    }
  };

  const onBroadcastPreview = async () => {
    if (!routePreview?.signedHex || routePreview.fingerprint !== routeTxFingerprint) {
      toast.error('Preview is stale or missing — run Preview again after any change.');
      return;
    }
    setBusy(true);
    try {
      const sub = await submitBoingSignedTransaction(routePreview.signedHex);
      const hash = sub && typeof sub === 'object' && sub.tx_hash != null ? String(sub.tx_hash) : String(sub);
      toast.success(`Submitted: ${hash.slice(0, 18)}…`);
      setRoutePreview(null);
    } catch (e) {
      toast.error(formatBoingExpressRpcError(e));
    } finally {
      setBusy(false);
    }
  };

  const onSwapQuick = async () => {
    if (chainId !== BOING_NATIVE_L1_CHAIN_ID || walletType !== 'boingExpress' || !isConnected) {
      toast.error('Connect with Boing Express on Boing testnet (6913).');
      return;
    }
    if (!selectedRoute?.hops?.length) {
      toast.error('Find a route first.');
      return;
    }

    const p = pickExpressProvider(getWalletProvider);
    if (!p) {
      toast.error('Boing Express provider not found.');
      return;
    }

    const tx = buildRouteContractCallTx();
    if (!tx) {
      toast.error('This build has no multihop router configured. Single-pool routes still work; ask your operator for router setup.');
      return;
    }

    setBusy(true);
    try {
      const hash = await boingExpressContractCallSignSimulateSubmit(p, tx);
      toast.success(typeof hash === 'string' ? `Submitted: ${hash.slice(0, 18)}…` : 'Submitted');
      setRoutePreview(null);
    } catch (e) {
      toast.error(formatBoingExpressRpcError(e));
    } finally {
      setBusy(false);
    }
  };

  const onUnsignedProbe = async () => {
    if (!selectedRoute?.hops?.length) {
      toast.error('Find a route first.');
      return;
    }
    if (!account) {
      toast.error('Connect your wallet for origin account.');
      return;
    }
    const tx = buildRouteContractCallTx();
    if (!tx) {
      toast.error('Could not build contract call for this route.');
      return;
    }
    setUnsignedBusy(true);
    setUnsignedOut(null);
    try {
      const r = await tryBoingUnsignedContractSimulate({ ...tx, origin: account });
      setUnsignedOut(r);
      if (r.ok) toast.success(`Method ${r.method} responded`);
      else if (r.unsupported) toast.error(r.message || 'RPC does not support this method');
    } catch (e) {
      toast.error(formatBoingExpressRpcError(e));
      setUnsignedOut({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      setUnsignedBusy(false);
    }
  };

  if (chainId !== BOING_NATIVE_L1_CHAIN_ID) return null;

  return (
    <section
      data-testid="native-dex-directory-route-panel"
      className={embedded ? 'mb-0 p-0 text-left' : 'mb-6 rounded-xl border p-5 text-left'}
      style={
        embedded
          ? undefined
          : {
              backgroundColor: 'var(--bg-card)',
              borderColor: 'rgba(34, 197, 94, 0.35)',
            }
      }
    >
      <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        Smart route
      </h2>
      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
        Find the best path across pools registered on the factory, then swap in one step with Boing Express. One-hop routes
        hit the pool directly; longer paths use the multihop router when this network provides one. Recently finalized
        fungible deploys (token/meme purpose) are merged into the token list when the app scans recent blocks on refresh.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 mb-2">
        <NativeVmTokenPickerField
          label="You pay (token account id)"
          value={tokenIn}
          onChange={setTokenIn}
          excludeHex={tokenOutHex}
          venueTokens={venues}
          indexerTokens={indexerPickerTokens}
          inputTestId="native-dex-route-token-in"
        />
        <NativeVmTokenPickerField
          label="You receive (token account id)"
          value={tokenOut}
          onChange={setTokenOut}
          excludeHex={tokenInHex}
          venueTokens={venues}
          indexerTokens={indexerPickerTokens}
          inputTestId="native-dex-route-token-out"
        />
      </div>
      <div className="flex justify-center mb-3">
        <button
          type="button"
          onClick={onFlipTokens}
          className="text-xs px-3 py-1 rounded-full border shadow-sm hover:opacity-90"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
          }}
          title="Swap pay and receive tokens"
        >
          ⇅ Flip pay / receive
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mb-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Amount in (integer units)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={amountInStr}
            onChange={(e) => setAmountInStr(e.target.value.replace(/\D/g, ''))}
            className="w-full text-sm p-2 rounded-lg border font-mono"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Slippage tolerance (%)
          </label>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={50}
            step={0.05}
            value={slippageLocal === null ? slippagePercent : slippageLocal}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setSlippageLocal(Number.isFinite(v) ? v : null);
            }}
            className="w-full text-sm p-2 rounded-lg border font-mono"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="button"
            onClick={() => setSlippageLocal(null)}
            className="text-[10px] mt-1 underline-offset-2 hover:underline"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Reset to page default ({slippagePercent}%)
          </button>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Search pairs from block
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={fromBlockStr}
            onChange={(e) => setFromBlockStr(e.target.value.replace(/\D/g, ''))}
            placeholder="0"
            className="w-full text-sm p-2 rounded-lg border font-mono"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Lower blocks scan more history (slower). If you know when the factory was deployed, start there.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={() => void onFindRoutes()}
          disabled={finding}
          className="px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white"
        >
          {finding ? 'Finding best route…' : 'Find best route'}
        </button>
      </div>

      {findError && <p className="text-xs text-amber-400 mb-2">{findError}</p>}

      {routeMeta && (
        <p className="text-[11px] mb-2" style={{ color: 'var(--text-tertiary)' }}>
          Pools considered: <strong>{routeMeta.venues}</strong>
          {routerHex ? (
            <span className="ml-2">· Multihop router ready</span>
          ) : (
            <span className="ml-2 text-amber-400/90">· Multihop router not set — only single-pool paths will execute</span>
          )}
        </p>
      )}

      {routes.length > 0 && (
        <div className="mt-2 mb-3">
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Choose a route
          </label>
          <select
            value={selectedIdx}
            onChange={(e) => setSelectedIdx(parseInt(e.target.value, 10))}
            className="w-full text-sm p-2 rounded-lg border mb-2 min-h-[44px]"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            {routes.map((rt, i) => (
              <option key={`route-${i}`} value={i}>
                #{i + 1} — {rt.hops.length} hop(s) — out ~{rt.amountOut.toString()}
              </option>
            ))}
          </select>
          {selectedRoute && (
            <pre
              className="text-[10px] p-2 rounded border overflow-x-auto font-mono"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              {selectedRoute.hops
                .map(
                  (h, j) =>
                    `${j + 1}. pool ${h.venue.poolHex.slice(0, 10)}… in ${h.amountIn.toString()} → out ${h.amountOut.toString()}`
                )
                .join('\n')}
            </pre>
          )}
          {quoteSummary && (
            <div
              className="mt-2 rounded-lg border px-3 py-2 text-xs"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Quote (integer units)
              </p>
              <p style={{ color: 'var(--text-secondary)' }}>
                Expected out: <span className="font-mono tabular-nums">{quoteSummary.grossOut.toString()}</span>
              </p>
              <p style={{ color: 'var(--text-secondary)' }}>
                Min. out after {effectiveSlippagePercent}% slippage:{' '}
                <span className="font-mono tabular-nums">{quoteSummary.minOut.toString()}</span>
              </p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                On-chain preview still requires a wallet signature (Boing RPC simulates signed txs only).
              </p>
            </div>
          )}
        </div>
      )}

      {routes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            onClick={() => void onPreviewSwap()}
            disabled={previewBusy || !routes.length || !quoteSummary}
            className="px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white"
          >
            {previewBusy ? 'Signing for preview…' : 'Preview (sign + simulate)'}
          </button>
          <button
            type="button"
            onClick={() => void onBroadcastPreview()}
            disabled={
              busy ||
              !routePreview ||
              routePreview.fingerprint !== routeTxFingerprint ||
              !routes.length
            }
            className="px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white"
          >
            {busy ? 'Broadcasting…' : 'Broadcast previewed tx'}
          </button>
          <button
            type="button"
            onClick={() => void onSwapQuick()}
            disabled={busy || previewBusy || !routes.length}
            className="px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium border border-blue-500/60 text-blue-200 hover:bg-blue-500/10 disabled:opacity-50"
          >
            {busy ? 'Working…' : 'Quick swap (sign + send)'}
          </button>
        </div>
      )}

      {routePreview && routePreview.fingerprint === routeTxFingerprint && (
        <div
          className="mb-3 rounded-lg border p-3 text-xs"
          style={{ borderColor: 'rgba(99, 102, 241, 0.45)', backgroundColor: 'var(--bg-secondary)' }}
        >
          <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Simulation result
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>
            Success: <strong>{String(routePreview.simulation?.success)}</strong>
            {typeof routePreview.simulation?.gas_used === 'number' && (
              <>
                {' '}
                · Gas used (reported): <span className="font-mono">{routePreview.simulation.gas_used}</span>
              </>
            )}
          </p>
          {routePreview.simulation?.error && (
            <p className="text-amber-400 mt-1">{String(routePreview.simulation.error)}</p>
          )}
          {typeof routePreview.simulation?.return_data === 'string' && routePreview.simulation.return_data && (
            <p className="mt-2 font-mono text-[10px] break-all opacity-80" style={{ color: 'var(--text-tertiary)' }}>
              return_data: {routePreview.simulation.return_data.slice(0, 200)}
              {routePreview.simulation.return_data.length > 200 ? '…' : ''}
            </p>
          )}
        </div>
      )}

      <div
        className="mt-4 rounded-lg border p-3 text-xs"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
      >
        <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Unsigned simulate (read-only)
        </p>
        {!unsignedSimEnabled ? (
          <p style={{ color: 'var(--text-tertiary)' }}>
            Set <code className="text-[10px]">REACT_APP_BOING_RPC_UNSIGNED_SIMULATE_METHOD=boing_simulateContractCall</code>{' '}
            when your RPC URL hits a node that implements <code className="text-[10px]">boing_simulateContractCall</code>{' '}
            (see boing.network RPC-API-SPEC). For legacy extension methods, set any other method name — the app will call{' '}
            <code className="text-[10px]">json_rpc(method, [payload])</code>. Optional{' '}
            <code className="text-[10px]">REACT_APP_BOING_RPC_UNSIGNED_SIMULATE_STRICT_PROBE=1</code> requires{' '}
            <code className="text-[10px]">boing_rpcSupportedMethods</code> to list{' '}
            <code className="text-[10px]">boing_simulateContractCall</code>.
          </p>
        ) : (
          <>
            <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>
              {unsignedSimRaw === 'boing_simulateContractCall' ? (
                <>
                  Using <span className="font-mono">boing_simulateContractCall</span> via boing-sdk (contract, calldata,
                  sender from your account).
                </>
              ) : (
                <>
                  Calling <span className="font-mono">{unsignedSimRaw}</span> with the current route calldata and your
                  account as <code className="text-[10px]">origin</code>.
                </>
              )}
            </p>
            <button
              type="button"
              onClick={() => void onUnsignedProbe()}
              disabled={unsignedBusy || !routes.length}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white min-h-[40px]"
            >
              {unsignedBusy ? 'Probing…' : 'Probe unsigned simulate'}
            </button>
            {unsignedOut != null && (
              <pre
                className="mt-2 text-[10px] p-2 rounded border overflow-x-auto font-mono max-h-40 overflow-y-auto"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                {JSON.stringify(unsignedOut, null, 2)}
              </pre>
            )}
          </>
        )}
      </div>
    </section>
  );
}

import React, { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchCpRoutingFromDirectoryLogs } from 'boing-sdk';
import { useWallet } from '../contexts/WalletContext';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { getBoingNativeVmModuleId } from '../config/contracts';
import { buildNativeDexOverridesFromEnv, getSharedBoingClient } from '../services/boingNativeDexClient';
import { encodeNativeAmmSwapCalldataHex } from '../services/nativeAmmCalldata';
import {
  nativeConstantProductPoolAccessListJson,
  nativeDexRouterAndPoolsAccessListJson,
} from '../services/nativeAmmAccessList';
import { buildMultihopRouterCalldataHexFromRoute } from '../services/nativeDexMultihopSwap';
import { boingExpressContractCallSignSimulateSubmit } from '../services/boingExpressNativeTx';
import { getWindowBoingProvider } from '../utils/boingWalletDiscovery';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';

function pickExpressProvider(getWalletProvider) {
  try {
    const p = typeof getWalletProvider === 'function' ? getWalletProvider('boingExpress') : null;
    if (p && typeof p.request === 'function') return p;
  } catch {
    /* ignore */
  }
  return getWindowBoingProvider();
}

/** @param {string} raw */
function normToken32(raw) {
  const t = (raw || '').trim();
  if (!t) return null;
  const body = t.startsWith('0x') || t.startsWith('0X') ? t.slice(2) : t;
  if (!/^[0-9a-fA-F]{64}$/.test(body)) return null;
  return `0x${body.toLowerCase()}`;
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
 * Directory log–driven CP routing (`fetchCpRoutingFromDirectoryLogs`) and execution:
 * 1-hop → pool `contract_call`; 2–4 hops → multihop router when `REACT_APP_BOING_NATIVE_VM_SWAP_ROUTER` resolves.
 * @param {{ slippagePercent?: number }} props
 */
export default function NativeDexDirectoryRoutePanel({ slippagePercent = 0.5 }) {
  const { chainId, walletType, isConnected, getWalletProvider, account } = useWallet();

  const envFromBlock = useMemo(() => {
    const raw = (process.env.REACT_APP_BOING_NATIVE_DEX_REGISTER_LOG_FROM_BLOCK || '').trim();
    if (raw === '') return '';
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? String(n) : '';
  }, []);

  const [tokenIn, setTokenIn] = useState('');
  const [tokenOut, setTokenOut] = useState('');
  const [amountInStr, setAmountInStr] = useState('');
  const [fromBlockStr, setFromBlockStr] = useState(envFromBlock);
  const [routes, setRoutes] = useState(/** @type {import('boing-sdk').CpSwapRoute[]} */ ([]));
  const [routeMeta, setRouteMeta] = useState(/** @type {{ venues: number } | null} */ (null));
  const [findError, setFindError] = useState(/** @type {string | null} */ (null));
  const [finding, setFinding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const slippageBps = useMemo(
    () => Math.min(10_000, Math.max(0, Math.round(Number(slippagePercent) * 100))),
    [slippagePercent]
  );

  const routerHex = useMemo(() => getBoingNativeVmModuleId(BOING_NATIVE_L1_CHAIN_ID, 'swapRouter'), []);

  const tokenInHex = useMemo(() => normToken32(tokenIn), [tokenIn]);
  const tokenOutHex = useMemo(() => normToken32(tokenOut), [tokenOut]);
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
      setFindError('Set register log from-block (non-negative integer), or configure REACT_APP_BOING_NATIVE_DEX_REGISTER_LOG_FROM_BLOCK.');
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
        setFindError('No route found for this pair and amount in the directory range.');
      }
    } catch (e) {
      setFindError(e?.message || 'Failed to fetch routes from directory logs.');
    } finally {
      setFinding(false);
    }
  }, [amountInBn, fromBlockNum, tokenInHex, tokenOutHex]);

  const selectedRoute = routes[selectedIdx];

  const onSwap = async () => {
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

    const hops = selectedRoute.hops;
    const n = hops.length;

    setBusy(true);
    try {
      if (n === 1) {
        const hop = hops[0];
        const minOut = (hop.amountOut * (10_000n - BigInt(slippageBps))) / 10_000n;
        const calldata = encodeNativeAmmSwapCalldataHex(hop.directionForSwapCalldata, hop.amountIn, minOut);
        const pool = hop.venue.poolHex;
        const accessList = nativeConstantProductPoolAccessListJson(account, pool);
        const hash = await boingExpressContractCallSignSimulateSubmit(p, {
          type: 'contract_call',
          contract: pool,
          calldata,
          ...(accessList ? { access_list: accessList } : {}),
        });
        toast.success(typeof hash === 'string' ? `Submitted: ${hash.slice(0, 18)}…` : 'Submitted');
        return;
      }

      if (!routerHex) {
        toast.error(
          'Multihop swaps need a non-zero swap router module id. Set REACT_APP_BOING_NATIVE_VM_SWAP_ROUTER (32-byte hex).'
        );
        return;
      }

      const calldata = buildMultihopRouterCalldataHexFromRoute(selectedRoute, slippageBps);
      const poolHexes = hops.map((h) => h.venue.poolHex);
      const accessList = nativeDexRouterAndPoolsAccessListJson(account, routerHex, poolHexes);
      const hash = await boingExpressContractCallSignSimulateSubmit(p, {
        type: 'contract_call',
        contract: routerHex,
        calldata,
        ...(accessList ? { access_list: accessList } : {}),
      });
      toast.success(typeof hash === 'string' ? `Submitted: ${hash.slice(0, 18)}…` : 'Submitted');
    } catch (e) {
      toast.error(formatBoingExpressRpcError(e));
    } finally {
      setBusy(false);
    }
  };

  if (chainId !== BOING_NATIVE_L1_CHAIN_ID) return null;

  return (
    <section
      data-testid="native-dex-directory-route-panel"
      className="mb-6 rounded-xl border p-5 text-left"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'rgba(34, 197, 94, 0.35)',
      }}
    >
      <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        Directory CP routes (register logs)
      </h2>
      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
        Quotes and routes from <code className="text-[11px]">fetchCpRoutingFromDirectoryLogs</code> over the DEX directory
        log range. Single-pool swaps call the pool directly; 2–4 hop paths use the native multihop router when configured.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 mb-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Token in (32-byte hex)
          </label>
          <input
            type="text"
            value={tokenIn}
            onChange={(e) => setTokenIn(e.target.value.trim())}
            placeholder="0x + 64 hex"
            className="w-full text-xs p-2 rounded-lg border font-mono"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
            spellCheck={false}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Token out (32-byte hex)
          </label>
          <input
            type="text"
            value={tokenOut}
            onChange={(e) => setTokenOut(e.target.value.trim())}
            placeholder="0x + 64 hex"
            className="w-full text-xs p-2 rounded-lg border font-mono"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
            spellCheck={false}
          />
        </div>
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
            Register logs from block
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={fromBlockStr}
            onChange={(e) => setFromBlockStr(e.target.value.replace(/\D/g, ''))}
            placeholder={envFromBlock || 'e.g. 0'}
            className="w-full text-sm p-2 rounded-lg border font-mono"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={() => void onFindRoutes()}
          disabled={finding}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white"
        >
          {finding ? 'Finding routes…' : 'Find routes'}
        </button>
        <button
          type="button"
          onClick={() => void onSwap()}
          disabled={busy || !routes.length}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white"
        >
          {busy ? 'Signing…' : 'Swap selected route'}
        </button>
      </div>

      {findError && <p className="text-xs text-amber-400 mb-2">{findError}</p>}

      {routeMeta && (
        <p className="text-[11px] mb-2" style={{ color: 'var(--text-tertiary)' }}>
          Hydrated venues: <strong>{routeMeta.venues}</strong>
          {routerHex ? (
            <span className="ml-2">
              · Router: <code className="text-[10px]">{routerHex.slice(0, 14)}…</code>
            </span>
          ) : (
            <span className="ml-2 text-amber-400/90">
              · Multihop router not configured (env <code className="text-[10px]">REACT_APP_BOING_NATIVE_VM_SWAP_ROUTER</code>)
            </span>
          )}
        </p>
      )}

      {routes.length > 0 && (
        <div className="mt-2">
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Routes (best first)
          </label>
          <select
            value={selectedIdx}
            onChange={(e) => setSelectedIdx(parseInt(e.target.value, 10))}
            className="w-full text-sm p-2 rounded-lg border mb-2"
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
        </div>
      )}
    </section>
  );
}

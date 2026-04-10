import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { getSharedBoingClient } from '../services/boingNativeDexClient';
import { getConfiguredSwapLogScanBlocks, scanNativeAmmActivityForPools } from '../services/nativeDexOnchainPoolLogs';

function shortHex(h) {
  if (!h || typeof h !== 'string') return '—';
  const t = h.trim();
  if (t.length < 22) return t || '—';
  return `${t.slice(0, 12)}…${t.slice(-6)}`;
}

/**
 * On-chain AMM log scan (swap counts, liquidity events) for the configured block span — complements remote indexer URLs.
 *
 * @param {{
 *   venues: import('boing-sdk').CpPoolVenue[],
 *   directoryMeta: { headHeight: number | null },
 *   remoteIndexerStats: unknown,
 * }} props
 */
export default function NativeDexPoolMetricsPanel({ venues, directoryMeta, remoteIndexerStats }) {
  const span = useMemo(() => getConfiguredSwapLogScanBlocks(), []);
  const [scanning, setScanning] = useState(false);
  /** @type {React.MutableRefObject<AbortController | null>} */
  const abortRef = useRef(null);
  const [onchainByPool, setOnchainByPool] = useState(/** @type {Map<string, { swapCount: number, volumeInSum: string, addLiquidityCount: number, removeLiquidityCount: number, logRows: number }> | null} */ (null));

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const indexerSwapByPool = useMemo(() => {
    const m = new Map();
    const pools =
      remoteIndexerStats && typeof remoteIndexerStats === 'object'
        ? /** @type {{ pools?: unknown }} */ (remoteIndexerStats).pools
        : null;
    if (!Array.isArray(pools)) return m;
    for (const p of pools) {
      if (!p || typeof p !== 'object') continue;
      const h = String(/** @type {{ poolHex?: unknown, pool?: unknown }} */ (p).poolHex ?? /** @type {{ pool?: unknown }} */ (p).pool ?? '')
        .trim()
        .toLowerCase();
      if (!h) continue;
      const row = /** @type {{ swapCount24h?: unknown, swaps24h?: unknown, swapCount?: unknown }} */ (p);
      const sc24 = row.swapCount24h ?? row.swaps24h;
      const sc = row.swapCount;
      let label = '—';
      if (sc24 != null && sc != null && String(sc24) !== String(sc)) {
        label = `${sc24} (24h) / ${sc} (scan)`;
      } else if (sc24 != null) {
        label = `${sc24} (24h)`;
      } else if (sc != null) {
        label = `${sc} (scan)`;
      }
      m.set(h, label);
    }
    return m;
  }, [remoteIndexerStats]);

  const runScan = useCallback(async () => {
    const head = directoryMeta?.headHeight;
    if (head == null || !Number.isFinite(head)) {
      toast.error('Chain head unavailable — refresh pools first.');
      return;
    }
    const pools = venues.map((v) => v.poolHex).filter(Boolean);
    if (pools.length === 0) {
      toast.error('No pools to scan.');
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setScanning(true);
    try {
      const client = getSharedBoingClient();
      const m = await scanNativeAmmActivityForPools(client, pools, head, span, { signal: ac.signal });
      setOnchainByPool(m);
      toast.success('AMM log scan finished');
    } catch (e) {
      if (/** @type {{ name?: string }} */ (e).name === 'AbortError') return;
      toast.error(e instanceof Error ? e.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  }, [venues, directoryMeta?.headHeight, span]);

  if (venues.length === 0) return null;

  return (
    <div
      className="rounded-xl border p-4 mb-4"
      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            On-chain activity (log scan)
          </p>
          <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            Scans the last <span className="font-mono tabular-nums">{span}</span> blocks per pool (cap 50k via env).
            Swap count uses parsed AMM logs; volume is the sum of <code className="text-[10px]">amountIn</code> (raw
            units). For USD volume you still need an indexer or price feed.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runScan()}
          disabled={scanning || directoryMeta.headHeight == null}
          className="text-sm px-3 py-2 min-h-[44px] rounded-lg border disabled:opacity-50 hover:opacity-90 shrink-0"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
        >
          {scanning ? 'Scanning…' : 'Scan AMM logs'}
        </button>
      </div>

      {onchainByPool && onchainByPool.size > 0 && (
        <div className="overflow-x-auto rounded-lg border mt-2" style={{ borderColor: 'var(--border-color)' }}>
          <table className="w-full text-left text-xs">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
                <th className="px-2 py-1.5 font-medium">Pool</th>
                <th className="px-2 py-1.5 font-medium text-right">Swaps</th>
                <th className="px-2 py-1.5 font-medium text-right" title="Indexer: 24h vs full log scan window">
                  Indexer
                </th>
                <th className="px-2 py-1.5 font-medium text-right">Σ amountIn</th>
                <th className="px-2 py-1.5 font-medium text-right">Add LQ</th>
                <th className="px-2 py-1.5 font-medium text-right">Remove LQ</th>
                <th className="px-2 py-1.5 font-medium text-right">Log rows</th>
              </tr>
            </thead>
            <tbody>
              {venues.map((v) => {
                const pid = v.poolHex.toLowerCase();
                const row = /** @type {{ swapCount?: number, volumeInSum?: string, addLiquidityCount?: number, removeLiquidityCount?: number, logRows?: number, fromBlock?: number, toBlock?: number } | undefined} */ (
                  onchainByPool.get(pid)
                );
                const ixSwaps = indexerSwapByPool.get(pid) ?? '—';
                return (
                  <tr key={v.poolHex} className="border-t" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                    <td className="px-2 py-1.5 font-mono" title={v.poolHex}>
                      {shortHex(v.poolHex)}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums">{row?.swapCount ?? '—'}</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums text-[var(--text-tertiary)]">{ixSwaps}</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums">{row?.volumeInSum ?? '—'}</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums">{row?.addLiquidityCount ?? '—'}</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums">{row?.removeLiquidityCount ?? '—'}</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums">{row?.logRows ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

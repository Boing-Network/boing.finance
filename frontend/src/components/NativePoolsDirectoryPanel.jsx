import React, { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import { buildBoingExplorerAccountUrl } from '../config/boingExplorerUrls';
import NativeDexPoolMetricsPanel from './NativeDexPoolMetricsPanel';
import NativePoolsLiquidityChart from './NativePoolsLiquidityChart';
import NativePoolsReserveHistoryChart from './NativePoolsReserveHistoryChart';
import { estimatePoolTvlUsd, loadTokenUsdPerUnitMap, mergeTokenUsdMaps } from '../services/nativeDexUsdTvl';

function shortHex(h) {
  if (!h || typeof h !== 'string') return '—';
  const t = h.trim();
  if (t.length < 22) return t || '—';
  return `${t.slice(0, 12)}…${t.slice(-6)}`;
}

/** @param {Array<{ id: string, symbol?: string, name?: string }>} entries */
function buildIndexerTokenMetaById(entries) {
  const m = new Map();
  if (!Array.isArray(entries)) return m;
  for (const t of entries) {
    if (!t || typeof t !== 'object') continue;
    const id = String(t.id || '').trim().toLowerCase();
    if (!/^0x[0-9a-f]{64}$/.test(id)) continue;
    const symbol = String(t.symbol || '').trim();
    const name = String(t.name || '').trim();
    m.set(id, { symbol, name });
  }
  return m;
}

async function copyText(label, text) {
  const t = (text || '').trim();
  if (!t) return;
  try {
    await navigator.clipboard.writeText(t);
    toast.success(`${label} copied`);
  } catch {
    toast.error('Could not copy');
  }
}

/**
 * @param {{
 *   hex: string,
 *   metaById: Map<string, { symbol: string, name: string }>,
 *   onCopy: (h: string) => () => void,
 * }} props
 */
function NativePoolTokenIdButton({ hex, metaById, onCopy }) {
  const hid = (hex || '').trim().toLowerCase();
  const meta = metaById.get(hid);
  const sym = (meta?.symbol || '').trim();
  const name = (meta?.name || '').trim();
  const primary =
    sym || (name ? (name.length > 18 ? `${name.slice(0, 16)}…` : name) : null);
  const title = [primary, name && name !== sym ? name : null, hex].filter(Boolean).join(' · ');
  return (
    <button
      type="button"
      onClick={onCopy(hex)}
      className="text-cyan-400 hover:underline text-left"
      title={title}
    >
      {primary ? (
        <span className="block">
          <span className="font-semibold text-[11px]" style={{ color: 'var(--text-primary)' }}>
            {primary}
          </span>
          <span className="block font-mono text-[10px] opacity-75">{shortHex(hex)}</span>
        </span>
      ) : (
        shortHex(hex)
      )}
    </button>
  );
}

/**
 * Uniswap-style pool table for Boing VM: hydrated CP venues + factory pair count from RPC.
 *
 * @param {{ onTradeThisPair?: (tokenAHex: string, tokenBHex: string) => void, focusPoolHex?: string }} props
 */
const PAGE_SIZE = 8;

export default function NativePoolsDirectoryPanel({ onTradeThisPair, focusPoolHex = '' }) {
  const {
    venues,
    loading,
    directoryMeta,
    effectiveFactoryHex,
    explorerBaseUrl,
    refresh,
    dexDirectoryExtras,
    remoteIndexerStats,
    indexerPickerTokens,
    localPoolActivity,
    oracleUsdByToken,
    oracleUsdLoading,
    oracleUsdError,
    reserveSampleIntervalMs,
  } = useBoingNativeDexIntegration();

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);

  const onCopyPool = useCallback((hex) => () => void copyText('Pool id', hex), []);
  const onCopyToken = useCallback((hex) => () => void copyText('Token id', hex), []);

  const indexerTokenMetaById = useMemo(
    () => buildIndexerTokenMetaById(indexerPickerTokens),
    [indexerPickerTokens]
  );

  const filteredVenues = useMemo(() => {
    const q = searchQuery.trim().toLowerCase().replace(/^0x/, '');
    if (!q) return venues;
    const idMatchesLabel = new Set();
    for (const [id, meta] of indexerTokenMetaById) {
      const sym = (meta.symbol || '').toLowerCase();
      const nm = (meta.name || '').toLowerCase();
      if ((sym && sym.includes(q)) || (nm && nm.includes(q))) idMatchesLabel.add(id.replace(/^0x/, ''));
    }
    return venues.filter((v) => {
      const pool = v.poolHex.toLowerCase().replace(/^0x/, '');
      const a = v.tokenAHex.toLowerCase().replace(/^0x/, '');
      const b = v.tokenBHex.toLowerCase().replace(/^0x/, '');
      return (
        pool.includes(q) ||
        a.includes(q) ||
        b.includes(q) ||
        idMatchesLabel.has(a) ||
        idMatchesLabel.has(b)
      );
    });
  }, [venues, searchQuery, indexerTokenMetaById]);

  const pageCount = Math.max(1, Math.ceil(filteredVenues.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pagedVenues = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return filteredVenues.slice(start, start + PAGE_SIZE);
  }, [filteredVenues, safePage]);

  const pairsLabel =
    directoryMeta.pairsCount != null ? directoryMeta.pairsCount : loading ? '…' : '—';

  const indexerByPool = useMemo(() => {
    const m = new Map();
    const pools = remoteIndexerStats && typeof remoteIndexerStats === 'object' ? remoteIndexerStats.pools : null;
    if (!Array.isArray(pools)) return m;
    for (const p of pools) {
      if (!p || typeof p !== 'object') continue;
      const h = String(p.poolHex || p.pool || '').trim().toLowerCase();
      if (h) m.set(h, p);
    }
    return m;
  }, [remoteIndexerStats]);

  const usdPerUnitMap = useMemo(
    () => mergeTokenUsdMaps(loadTokenUsdPerUnitMap(), oracleUsdByToken || {}),
    [oracleUsdByToken]
  );
  const hasUsdHints = Object.keys(usdPerUnitMap).length > 0;
  const hasOraclePrices = Object.keys(oracleUsdByToken || {}).length > 0;
  const tvlByPool = useMemo(() => {
    const m = new Map();
    if (!hasUsdHints) return m;
    for (const v of venues) {
      const pid = v.poolHex.toLowerCase();
      m.set(pid, estimatePoolTvlUsd(v.tokenAHex, v.tokenBHex, v.reserveA, v.reserveB, usdPerUnitMap));
    }
    return m;
  }, [venues, usdPerUnitMap, hasUsdHints]);

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
            Factory
          </p>
          <p className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
            {effectiveFactoryHex ? shortHex(effectiveFactoryHex) : '—'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
            Pairs on factory
          </p>
          <p className="text-lg font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {pairsLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="text-sm px-3 py-1.5 rounded-lg border disabled:opacity-50 hover:opacity-90"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Pools below are loaded from your configured main pool plus any extra pairs the app discovers from the factory.
        When the factory reports more pairs, register them on-chain so they appear here after the next refresh.
      </p>

      {(venues.length > 0 ||
        dexDirectoryExtras.registerPairLogCount != null ||
        remoteIndexerStats ||
        (process.env.REACT_APP_BOING_NATIVE_DEX_INDEXER_STATS_URL || '').trim()) && (
        <div
          className="rounded-xl border px-4 py-3 text-xs space-y-1"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
        >
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Indexer-style stats
          </p>
          {dexDirectoryExtras.registerPairLogCount != null && (
            <p style={{ color: 'var(--text-secondary)' }}>
              <strong>register_pair</strong> logs in configured scan:{' '}
              <span className="font-mono tabular-nums">{dexDirectoryExtras.registerPairLogCount}</span>
              {dexDirectoryExtras.registerLogScanFromBlock != null && (
                <span className="text-[var(--text-tertiary)]">
                  {' '}
                  (from block {dexDirectoryExtras.registerLogScanFromBlock})
                </span>
              )}
            </p>
          )}
          {remoteIndexerStats?.updatedAt && (
            <p style={{ color: 'var(--text-secondary)' }}>
              Remote indexer snapshot: <span className="font-mono">{String(remoteIndexerStats.updatedAt)}</span>
            </p>
          )}
          {remoteIndexerStats?.note && (
            <p style={{ color: 'var(--text-tertiary)' }}>{String(remoteIndexerStats.note)}</p>
          )}
          {!remoteIndexerStats && (process.env.REACT_APP_BOING_NATIVE_DEX_INDEXER_STATS_URL || '').trim() && (
            <p className="text-amber-400/90">Indexer URL is set but the last fetch returned no data.</p>
          )}
          <p style={{ color: 'var(--text-tertiary)' }}>
            <strong>Activity Δ</strong> sums absolute reserve changes since your last refresh (local browser estimate — not
            on-chain volume).
          </p>
          {reserveSampleIntervalMs > 0 && (
            <p style={{ color: 'var(--text-secondary)' }}>
              <strong>Reserve sampling</strong> every {Math.round(reserveSampleIntervalMs / 1000)}s (visible tab only) for
              denser charts — set <code className="text-[10px]">REACT_APP_BOING_NATIVE_DEX_RESERVE_SAMPLE_MS</code>.
            </p>
          )}
          {oracleUsdLoading && <p className="text-cyan-400/90 text-[11px]">Loading CoinGecko oracle prices…</p>}
          {oracleUsdError && !oracleUsdLoading && (
            <p className="text-amber-400/90 text-[11px]">{oracleUsdError}</p>
          )}
        </div>
      )}

      {venues.length > 0 && !loading && (
        <>
          <NativePoolsReserveHistoryChart
            venues={venues}
            remoteIndexerStats={remoteIndexerStats}
            focusPoolHex={focusPoolHex}
            reserveSampleIntervalMs={reserveSampleIntervalMs}
          />
          <NativeDexPoolMetricsPanel venues={venues} directoryMeta={directoryMeta} remoteIndexerStats={remoteIndexerStats} />
          <NativePoolsLiquidityChart venues={venues} />
        </>
      )}

      {venues.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <label className="block text-xs font-medium sr-only" htmlFor="native-pools-search">
            Search pools or tokens
          </label>
          <input
            id="native-pools-search"
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search pool / token id / indexer symbol or name"
            className="w-full sm:max-w-md text-sm px-3 py-2.5 min-h-[44px] rounded-lg border"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
            autoComplete="off"
          />
          <p className="text-xs tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
            Showing {filteredVenues.length === 0 ? 0 : safePage * PAGE_SIZE + 1}–
            {Math.min((safePage + 1) * PAGE_SIZE, filteredVenues.length)} of {filteredVenues.length}
            {searchQuery.trim() ? ` (filtered from ${venues.length})` : ''}
          </p>
        </div>
      )}

      {venues.length > 0 && filteredVenues.length === 0 && (
        <p className="text-sm rounded-lg border px-4 py-4 text-center" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
          No pools match this search. Clear the filter or try another hex substring.
        </p>
      )}

      {venues.length === 0 && !loading ? (
        <p className="text-sm rounded-lg border px-4 py-6 text-center" style={{ borderColor: 'var(--border-color)', color: 'var(--text-tertiary)' }}>
          No pools loaded yet. Check your RPC connection or pool configuration.
        </p>
      ) : filteredVenues.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
                <th className="px-3 py-2 font-medium">Pool</th>
                <th className="px-3 py-2 font-medium">Token A</th>
                <th className="px-3 py-2 font-medium">Token B</th>
                <th className="px-3 py-2 font-medium text-right">Reserve A</th>
                <th className="px-3 py-2 font-medium text-right">Reserve B</th>
                {hasUsdHints && (
                  <th className="px-3 py-2 font-medium text-right" title={hasOraclePrices ? 'Includes CoinGecko where mapped' : ''}>
                    TVL (~USD)
                  </th>
                )}
                <th className="px-3 py-2 font-medium text-right">Fee</th>
                <th className="px-3 py-2 font-medium text-right">Activity Δ</th>
                <th className="px-3 py-2 font-medium">Indexer</th>
                <th className="px-3 py-2 font-medium">Trade</th>
                <th className="px-3 py-2 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {pagedVenues.map((v, rowIdx) => {
                const pid = v.poolHex.toLowerCase();
                const act = localPoolActivity[pid];
                const ix = indexerByPool.get(pid);
                const ixParts = [];
                if (ix && typeof ix === 'object') {
                  const sc24 = ix.swapCount24h ?? ix.swaps24h;
                  if (sc24 != null) ixParts.push(`swaps24h: ${sc24}`);
                  if (ix.swapCount != null && ix.swapCount !== sc24) ixParts.push(`swapsScan: ${ix.swapCount}`);
                  if (ix.volume24hApprox) ixParts.push(`vol24hΣin: ${ix.volume24hApprox}`);
                  if (ix.volumeScanWindowApprox) ixParts.push(`volScanΣin: ${ix.volumeScanWindowApprox}`);
                  if (ix.tvlUsdApprox) ixParts.push(`TVL~$ ${ix.tvlUsdApprox}`);
                  if (ix.tvlApprox) ixParts.push(String(ix.tvlApprox));
                  if (ix.note) ixParts.push(String(ix.note));
                }
                const ixLabel = ixParts.length > 0 ? ixParts.join(' · ') : '—';
                const tvlInfo = tvlByPool.get(pid);
                return (
                <tr
                  key={v.poolHex}
                  className="border-t"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <td className="px-3 py-2 font-mono text-xs">
                    <button
                      type="button"
                      onClick={onCopyPool(v.poolHex)}
                      className="text-cyan-400 hover:underline text-left"
                      title={v.poolHex}
                    >
                      {shortHex(v.poolHex)}
                    </button>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    <NativePoolTokenIdButton
                      hex={v.tokenAHex}
                      metaById={indexerTokenMetaById}
                      onCopy={onCopyToken}
                    />
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    <NativePoolTokenIdButton
                      hex={v.tokenBHex}
                      metaById={indexerTokenMetaById}
                      onCopy={onCopyToken}
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">{v.reserveA.toString()}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">{v.reserveB.toString()}</td>
                  {hasUsdHints && (
                    <td
                      className="px-3 py-2 text-right font-mono text-xs tabular-nums"
                      title={tvlInfo?.note || undefined}
                    >
                      {tvlInfo?.tvlUsd != null && Number.isFinite(tvlInfo.tvlUsd)
                        ? tvlInfo.tvlUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })
                        : '—'}
                    </td>
                  )}
                  <td className="px-3 py-2 text-right text-xs">{v.feeBps.toString()} bps</td>
                  <td className="px-3 py-2 text-right font-mono text-[10px] tabular-nums" title="Local reserve delta since last refresh">
                    {act?.hadPrior ? act.activityScore : '—'}
                  </td>
                  <td className="px-3 py-2 text-[10px] max-w-[140px] break-words" style={{ color: 'var(--text-tertiary)' }}>
                    {ixLabel}
                  </td>
                  <td className="px-3 py-2">
                    {typeof onTradeThisPair === 'function' ? (
                      <button
                        type="button"
                        data-testid={`native-pools-trade-row-${safePage * PAGE_SIZE + rowIdx}`}
                        onClick={() => onTradeThisPair(v.tokenAHex, v.tokenBHex)}
                        className="text-xs font-medium text-emerald-400 hover:underline whitespace-nowrap"
                        title="Open Smart route with this pair (pay token A → receive token B)"
                      >
                        Smart route
                      </button>
                    ) : (
                      <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <a
                      href={buildBoingExplorerAccountUrl(explorerBaseUrl, v.poolHex)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 text-xs whitespace-nowrap hover:underline"
                    >
                      Explorer
                    </a>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {venues.length > 0 && pageCount > 1 && filteredVenues.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="text-sm px-4 py-2.5 min-h-[44px] rounded-lg border disabled:opacity-40"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            Previous
          </button>
          <span className="text-xs tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
            Page {safePage + 1} / {pageCount}
          </span>
          <button
            type="button"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            className="text-sm px-4 py-2.5 min-h-[44px] rounded-lg border disabled:opacity-40"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

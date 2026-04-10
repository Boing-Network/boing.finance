import React, { useEffect, useMemo, useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { buildBoingExplorerAccountUrl } from '../config/boingExplorerUrls';
import { NATIVE_AMM_TOTAL_LP_SUPPLY_KEY, parseNativeAmmReserveU128 } from '../services/nativeAmmCalldata';
import { fetchNativeLpShareBalanceU128 } from '../services/boingNativeLpShareBalance';
import { boingGetContractStorage, normalizeBoingFaucetAccountHex } from '../services/boingTestnetRpc';

function shortHex(h) {
  if (!h || typeof h !== 'string') return '—';
  const t = h.trim();
  if (t.length < 22) return t || '—';
  return `${t.slice(0, 12)}…${t.slice(-6)}`;
}

/** @param {bigint} balance @param {bigint} total */
function formatSharePercent(balance, total) {
  if (total <= 0n) return null;
  if (balance < 0n) return null;
  const basis = 10000n;
  const pct = (balance * basis) / total;
  const whole = pct / 100n;
  const frac = pct % 100n;
  return `${whole.toString()}.${frac.toString().padStart(2, '0')}%`;
}

/**
 * LP share balances + per-pool total LP (on-chain). Vault↔pool rows come from env map when set.
 */
export default function NativeLiquidityPositionsPanel() {
  const { chainId, isConnected, account } = useWallet();
  const {
    effectiveLpShareHex,
    effectivePoolHex,
    effectiveLpVaultHex,
    venues,
    explorerBaseUrl,
    vaultPoolMappings,
  } = useBoingNativeDexIntegration();
  const [balanceByShare, setBalanceByShare] = useState(/** @type {Record<string, bigint>} */ ({}));
  const [totalLpByPool, setTotalLpByPool] = useState(/** @type {Record<string, bigint>} */ ({}));
  const [loadError, setLoadError] = useState(/** @type {string | null} */ (null));
  const [loading, setLoading] = useState(false);

  const onBoing = Number(chainId) === BOING_NATIVE_L1_CHAIN_ID;
  const acct = normalizeBoingFaucetAccountHex(account || '');

  const poolRows = useMemo(() => {
    if (vaultPoolMappings.length > 0) return vaultPoolMappings;
    const ph = (effectivePoolHex || '').trim();
    if (!/^0x[0-9a-fA-F]{64}$/i.test(ph)) return [];
    const vh = (effectiveLpVaultHex || '').trim();
    return [
      {
        vaultHex: /^0x[0-9a-fA-F]{64}$/i.test(vh) ? `0x${vh.slice(2).toLowerCase()}` : `0x${ph.slice(2).toLowerCase()}`,
        poolHex: `0x${ph.slice(2).toLowerCase()}`,
        shareTokenHex: null,
        label: '',
      },
    ];
  }, [vaultPoolMappings, effectivePoolHex, effectiveLpVaultHex]);

  const shareTokensToFetch = useMemo(() => {
    const def = (effectiveLpShareHex || '').trim().toLowerCase();
    const s = new Set();
    for (const row of poolRows) {
      const st = (row.shareTokenHex || effectiveLpShareHex || '').trim().toLowerCase();
      if (/^0x[0-9a-f]{64}$/.test(st)) s.add(`0x${st.slice(2)}`);
    }
    if (s.size === 0 && /^0x[0-9a-f]{64}$/.test(def)) s.add(`0x${def.slice(2)}`);
    return [...s].sort();
  }, [poolRows, effectiveLpShareHex]);

  useEffect(() => {
    if (!onBoing || !isConnected || !acct || shareTokensToFetch.length === 0) {
      setBalanceByShare({});
      setLoadError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void (async () => {
      try {
        /** @type {Record<string, bigint>} */
        const next = {};
        for (const sh of shareTokensToFetch) {
          if (cancelled) return;
          next[sh.toLowerCase()] = await fetchNativeLpShareBalanceU128(sh, acct);
        }
        if (!cancelled) setBalanceByShare(next);
      } catch (e) {
        if (!cancelled) {
          setBalanceByShare({});
          setLoadError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onBoing, isConnected, acct, shareTokensToFetch.join('|')]);

  useEffect(() => {
    if (!onBoing || poolRows.length === 0) {
      setTotalLpByPool({});
      return;
    }
    let cancelled = false;
    void (async () => {
      /** @type {Record<string, bigint>} */
      const next = {};
      try {
        for (const row of poolRows) {
          if (cancelled) return;
          const pid = row.poolHex.toLowerCase();
          const word = await boingGetContractStorage(row.poolHex, NATIVE_AMM_TOTAL_LP_SUPPLY_KEY);
          if (cancelled) return;
          next[pid] = parseNativeAmmReserveU128(word);
        }
        if (!cancelled) setTotalLpByPool(next);
      } catch {
        if (!cancelled) setTotalLpByPool({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onBoing, poolRows]);

  const shareMultiplicity = useMemo(() => {
    /** @type {Map<string, number>} */
    const m = new Map();
    for (const row of poolRows) {
      const st = (row.shareTokenHex || effectiveLpShareHex || '').trim().toLowerCase();
      if (!/^0x[0-9a-f]{64}$/.test(st)) continue;
      m.set(st, (m.get(st) || 0) + 1);
    }
    return m;
  }, [poolRows, effectiveLpShareHex]);

  if (!onBoing) return null;

  const primaryShare = (effectiveLpShareHex || '').trim();

  return (
    <div
      className="mb-6 rounded-xl border p-4"
      style={{ borderColor: 'rgba(34, 197, 94, 0.35)', backgroundColor: 'var(--bg-secondary)' }}
    >
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        Your LP positions
      </h3>
      <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
        Per-pool <strong>total LP</strong> is read from each pool contract. LP <strong>share balance</strong> uses the
        share-token storage layout (XOR balance slot). If one share token backs multiple pools, your balance is
        aggregate — pool share % is only shown when the mapping lists a single pool for that share token.
      </p>
      {vaultPoolMappings.length > 0 && (
        <p className="text-[11px] mb-3 rounded-lg border px-2 py-1.5" style={{ borderColor: 'var(--border-color)', color: 'var(--text-tertiary)' }}>
          Vault↔pool links are loaded from <code className="text-[10px]">REACT_APP_BOING_NATIVE_DEX_VAULT_POOL_MAP_JSON</code>.
        </p>
      )}

      {!isConnected && (
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Connect your wallet to load balances.
        </p>
      )}

      {isConnected && shareTokensToFetch.length === 0 && (
        <p className="text-sm text-amber-400/90">No LP share token is configured for this build or RPC hints.</p>
      )}

      {isConnected && shareTokensToFetch.length > 0 && poolRows.length > 0 && (
        <div className="space-y-3">
          <div
            className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border px-3 py-2"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                Primary LP share token
              </p>
              {primaryShare && /^0x[0-9a-fA-F]{64}$/i.test(primaryShare) ? (
                <a
                  href={buildBoingExplorerAccountUrl(explorerBaseUrl, primaryShare)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono text-cyan-400 hover:underline"
                >
                  {shortHex(primaryShare)}
                </a>
              ) : (
                <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  —
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                Wallet loading
              </p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {loading ? '…' : loadError ? 'Error' : 'OK'}
              </p>
            </div>
          </div>
          {loadError && <p className="text-xs text-amber-400">{loadError}</p>}

          <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
            <table className="w-full text-left text-xs">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
                  <th className="px-2 py-2 font-medium">Pool</th>
                  <th className="px-2 py-2 font-medium">Vault</th>
                  <th className="px-2 py-2 font-medium">Share token</th>
                  <th className="px-2 py-2 font-medium text-right">Your shares</th>
                  <th className="px-2 py-2 font-medium text-right">Pool total LP</th>
                  <th className="px-2 py-2 font-medium text-right">Your % of pool</th>
                </tr>
              </thead>
              <tbody>
                {poolRows.map((row) => {
                  const pid = row.poolHex.toLowerCase();
                  const resolvedShare = (row.shareTokenHex || effectiveLpShareHex || '').trim().toLowerCase();
                  const sk = /^0x[0-9a-f]{64}$/.test(resolvedShare) ? `0x${resolvedShare.slice(2)}` : '';
                  const bal = sk ? balanceByShare[sk.toLowerCase()] : undefined;
                  const totalLp = totalLpByPool[pid];
                  const mult = /^0x[0-9a-f]{64}$/.test(resolvedShare) ? shareMultiplicity.get(resolvedShare) || 0 : 0;
                  const showPct = mult === 1 && bal != null && totalLp != null && totalLp > 0n;
                  const noteMult = mult > 1 && bal != null;
                  return (
                    <tr key={`${row.vaultHex}-${row.poolHex}`} style={{ color: 'var(--text-primary)', borderTop: '1px solid var(--border-color)' }}>
                      <td className="px-2 py-2 font-mono">
                        <a
                          href={buildBoingExplorerAccountUrl(explorerBaseUrl, row.poolHex)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:underline"
                          title={row.poolHex}
                        >
                          {shortHex(row.poolHex)}
                        </a>
                        {row.label ? (
                          <span className="block text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                            {row.label}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-2 py-2 font-mono">
                        <a
                          href={buildBoingExplorerAccountUrl(explorerBaseUrl, row.vaultHex)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:underline"
                        >
                          {shortHex(row.vaultHex)}
                        </a>
                      </td>
                      <td className="px-2 py-2 font-mono text-[10px]">
                        {sk ? (
                          <a
                            href={buildBoingExplorerAccountUrl(explorerBaseUrl, sk)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:underline"
                          >
                            {shortHex(sk)}
                          </a>
                        ) : (
                          shortHex(effectiveLpShareHex || '')
                        )}
                      </td>
                      <td className="px-2 py-2 text-right font-mono tabular-nums">
                        {loading ? '…' : bal != null ? bal.toString() : '—'}
                      </td>
                      <td className="px-2 py-2 text-right font-mono tabular-nums">
                        {totalLp != null ? totalLp.toString() : '…'}
                      </td>
                      <td
                        className="px-2 py-2 text-right font-mono tabular-nums"
                        title={noteMult ? 'Multiple pools share this token; % not attributed per pool.' : undefined}
                      >
                        {showPct ? (
                          <span className="text-emerald-400/90">{formatSharePercent(bal, totalLp)}</span>
                        ) : noteMult ? (
                          '— *'
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {poolRows.some((row) => {
            const rs = (row.shareTokenHex || effectiveLpShareHex || '').trim().toLowerCase();
            const mult = /^0x[0-9a-f]{64}$/.test(rs) ? shareMultiplicity.get(rs) || 0 : 0;
            return mult > 1;
          }) && (
            <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              * Aggregate share balance across pools; use vault flows and explorer to reconcile positions.
            </p>
          )}

          <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            Listed pools in directory: {venues.length}.
          </p>
        </div>
      )}
    </div>
  );
}

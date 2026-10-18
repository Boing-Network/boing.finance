import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getBoingPoolLpBalance, getBoingPoolState } from 'boing-sdk';
import { getSharedBoingClient } from '../services/boingNativeDexClient';
import { loadCustodyPools, loadCustodyTokenMetadata } from '../services/nativeDexCustodySwap';
import { custodyTokenList, custodyTokensNeedingMetadata } from '../services/boingSwapQuote';
import { poolCard } from '../services/boingPoolsSimple';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';

/**
 * Custody pools as simple cards (pair, liquidity, price) plus, when `account` is set, the wallet's LP balance,
 * share and what it would get back. Shared by the Pools and Your liquidity tabs.
 * @param {string | null | undefined} account
 */
export function useBoingPools(account) {
  const client = useMemo(() => getSharedBoingClient(), []);
  const { indexerPickerTokens } = useBoingNativeDexIntegration();
  const [pools, setPools] = useState(/** @type {any[] | null} */ (null));
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [extraMeta, setExtraMeta] = useState(/** @type {any[]} */ ([]));
  const [lpByPool, setLpByPool] = useState(/** @type {Record<string, { balance: bigint, totalLp: bigint }>} */ ({}));
  const [lpLoading, setLpLoading] = useState(false);
  const seq = useRef(0);

  const reload = useCallback(async () => {
    const my = ++seq.current;
    setError(null);
    try {
      const p = await loadCustodyPools(client);
      if (my === seq.current) setPools(p);
    } catch (e) {
      if (my === seq.current) {
        setError(e?.message || 'Could not load pools');
        setPools([]);
      }
    }
  }, [client]);

  useEffect(() => {
    reload();
  }, [reload]);

  const missingKey = useMemo(
    () => custodyTokensNeedingMetadata(pools || [], indexerPickerTokens).sort().join(','),
    [pools, indexerPickerTokens]
  );
  useEffect(() => {
    if (!missingKey) return undefined;
    let off = false;
    loadCustodyTokenMetadata(client, missingKey.split(',')).then((rows) => {
      if (!off) setExtraMeta(rows);
    });
    return () => {
      off = true;
    };
  }, [client, missingKey]);

  const tokens = useMemo(
    () => custodyTokenList(pools || [], [...(indexerPickerTokens || []), ...extraMeta]),
    [pools, indexerPickerTokens, extraMeta]
  );

  const poolKey = (pools || []).map((p) => `${p.poolHex}:${p.reserveA}:${p.reserveB}`).join('|');
  useEffect(() => {
    if (!pools || pools.length === 0) {
      setLpByPool({});
      return undefined;
    }
    let off = false;
    setLpLoading(true);
    (async () => {
      const next = {};
      await Promise.all(
        pools.map(async (p) => {
          try {
            const s = await getBoingPoolState(client, p.poolHex);
            const balance = account ? await getBoingPoolLpBalance(client, p.poolHex, account) : 0n;
            next[p.poolHex] = { balance, totalLp: s.totalLp, reserveA: s.reserveA, reserveB: s.reserveB };
          } catch {
            /* keep the card without LP data */
          }
        })
      );
      if (!off) {
        setLpByPool(next);
        setLpLoading(false);
      }
    })();
    return () => {
      off = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, account, poolKey]);

  const cards = useMemo(
    () =>
      (pools || []).map((p) => {
        const lp = lpByPool[p.poolHex];
        // Fresh on-chain reserves win over the (light) listing when available.
        const pool = lp ? { ...p, reserveA: lp.reserveA, reserveB: lp.reserveB } : p;
        return poolCard(pool, tokens, lp || null);
      }),
    [pools, tokens, lpByPool]
  );

  return { client, cards, tokens, loading: pools === null, lpLoading, error, reload };
}

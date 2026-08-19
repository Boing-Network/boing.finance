import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchChainDexMarkets } from '../services/dexMarketsService';

/**
 * Per-chain trending DEX markets for the Swap discovery board.
 */
export function useDexMarkets({ chainId, solana = false, enabled = true }) {
  const query = useQuery({
    queryKey: ['dex-markets', solana ? 'solana' : Number(chainId) || 0],
    queryFn: () => fetchChainDexMarkets({ chainId, solana }),
    enabled,
    staleTime: 45_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    retry: 1,
  });

  const [tab, setTab] = useState(/** @type {'trending' | 'gainers' | 'volume'} */ ('trending'));
  const [queryText, setQueryText] = useState('');

  const rows = useMemo(() => {
    const list = [...(query.data || [])];
    if (tab === 'gainers') {
      list.sort((a, b) => (Number(b.change24h) || -Infinity) - (Number(a.change24h) || -Infinity));
    } else if (tab === 'volume') {
      list.sort((a, b) => (Number(b.volume24h) || 0) - (Number(a.volume24h) || 0));
    }
    const q = queryText.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (m) =>
        m.symbol.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.pair.toLowerCase().includes(q) ||
        m.address.toLowerCase().includes(q)
    );
  }, [query.data, tab, queryText]);

  return {
    ...query,
    tab,
    setTab,
    queryText,
    setQueryText,
    rows,
  };
}

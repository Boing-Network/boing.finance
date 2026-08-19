import { useQuery } from '@tanstack/react-query';
import { fetchTokenChart } from '../services/tokenChartService';

/**
 * Cached USD chart + spot for a Swap token.
 */
export function useTokenMarket({ chain, chainId, address, isNative, symbol, days = 7, enabled = true }) {
  return useQuery({
    queryKey: ['swap-token-market', chain || 'evm', chainId || 0, address || '', Boolean(isNative), symbol || '', days],
    queryFn: () =>
      fetchTokenChart({
        chain,
        chainId,
        address,
        isNative,
        symbol,
        days,
      }),
    enabled: Boolean(enabled && symbol),
    staleTime: 60_000,
    refetchInterval: 120_000,
    refetchIntervalInBackground: false,
    retry: 1,
  });
}

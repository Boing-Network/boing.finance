import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTokenChart, fetchTokenSpot, overlayLivePrice } from '../services/tokenChartService';

/**
 * Cached USD history plus a short-interval live spot so Swap charts keep moving.
 */
export function useTokenMarket({ chain, chainId, address, isNative, symbol, days = 7, enabled = true }) {
  const ready = Boolean(enabled && symbol);
  const identity = [chain || 'evm', chainId || 0, address || '', Boolean(isNative), symbol || ''];

  const history = useQuery({
    queryKey: ['swap-token-chart', ...identity, days],
    queryFn: () =>
      fetchTokenChart({
        chain,
        chainId,
        address,
        isNative,
        symbol,
        days,
      }),
    enabled: ready,
    staleTime: days <= 1 ? 30_000 : 3 * 60_000,
    refetchInterval: days <= 1 ? 45_000 : 3 * 60_000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    retry: 1,
  });

  const spot = useQuery({
    queryKey: ['swap-token-spot', ...identity],
    queryFn: () =>
      fetchTokenSpot({
        chain,
        chainId,
        address,
        isNative,
        symbol,
      }),
    enabled: ready,
    staleTime: 10_000,
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    retry: 1,
  });

  const data = useMemo(() => {
    const base = history.data;
    if (!base) {
      if (spot.data?.price) return emptyish(spot.data);
      return undefined;
    }
    const livePrice = spot.data?.price ?? base.price;
    return {
      ...base,
      price: livePrice ?? base.price,
      change24h: spot.data?.change24h ?? base.change24h,
      source: spot.data?.source || base.source,
      points: overlayLivePrice(base.points, livePrice),
      updatedAt: Date.now(),
    };
  }, [history.data, spot.data]);

  return {
    data,
    isLoading: history.isLoading,
    isFetching: history.isFetching || spot.isFetching,
  };
}

function emptyish(spot) {
  return {
    points: [],
    price: spot?.price ?? null,
    change24h: spot?.change24h ?? null,
    source: spot?.source ?? null,
    unavailableReason: spot?.unavailableReason ?? null,
  };
}

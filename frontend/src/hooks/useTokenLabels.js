import { useEffect, useMemo, useState } from 'react';
import { getSharedBoingClient } from '../services/boingNativeDexClient';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import { venueTokensToPickerEntries } from '../services/nativeVmTokenRegistry';
import { fetchTokenLabels, resolveTokenLabelLocal, tokenIdsNeedingLookup } from '../services/boingTokenLabels';

/**
 * Resolve display labels for token ids (token list, native config, venues / indexer, then on-chain metadata).
 * @param {Array<string | null | undefined>} ids
 * @returns {(id: string | null | undefined) => { id: string, symbol: string, name: string, resolved: boolean }}
 */
export function useTokenLabels(ids) {
  const { venues, indexerPickerTokens } = useBoingNativeDexIntegration();
  const directory = useMemo(
    () => [...venueTokensToPickerEntries(venues || []), ...(indexerPickerTokens || [])],
    [venues, indexerPickerTokens]
  );
  const [version, setVersion] = useState(0);
  const key = (ids || []).filter(Boolean).map((s) => String(s).toLowerCase()).sort().join(',');
  const missing = useMemo(() => tokenIdsNeedingLookup(key ? key.split(',') : [], directory).join(','), [key, directory, version]);

  useEffect(() => {
    if (!missing) return undefined;
    let off = false;
    fetchTokenLabels(getSharedBoingClient(), missing.split(',')).then(() => {
      if (!off) setVersion((v) => v + 1);
    });
    return () => {
      off = true;
    };
  }, [missing]);

  return useMemo(() => {
    void version;
    const memo = new Map();
    return (id) => {
      const k = String(id || '').toLowerCase();
      if (!memo.has(k)) memo.set(k, resolveTokenLabelLocal(k, directory));
      return memo.get(k);
    };
  }, [directory, version]);
}

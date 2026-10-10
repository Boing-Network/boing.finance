import { useCallback, useEffect, useState } from 'react';
import { isBoingNativeAccountIdHex } from '../utils/boingWalletDiscovery';
import { areCompanionsLinkedOnChain } from '../services/linkedNftTokenRegistry';

/**
 * Live on-chain companion check for a collection↔token pair.
 * States: idle | checking | linked | not_linked | unavailable | invalid
 */
export function useCompanionsLinked({
  collectionId = '',
  tokenId = '',
  endUser = null,
  networkInfo = null,
  origin = null,
  enabled = true,
} = {}) {
  const [state, setState] = useState('idle');
  const [message, setMessage] = useState('');
  const [links, setLinks] = useState([]);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setState('idle');
      setMessage('');
      setLinks([]);
      return { linked: false, code: 'disabled' };
    }
    const c = String(collectionId || '').trim();
    const t = String(tokenId || '').trim();
    if (!c || !t) {
      setState('idle');
      setMessage('');
      setLinks([]);
      return { linked: false, code: 'idle' };
    }
    if (!isBoingNativeAccountIdHex(c) || !isBoingNativeAccountIdHex(t)) {
      setState('invalid');
      setMessage('Enter valid collection and token ids.');
      setLinks([]);
      return { linked: false, code: 'invalid' };
    }

    setState('checking');
    setMessage('Checking companions…');
    const result = await areCompanionsLinkedOnChain({
      collectionId: c,
      tokenId: t,
      endUser,
      networkInfo,
      origin,
    });
    if (!result.ok) {
      const next =
        result.code === 'invalid_address' ||
        result.code === 'boing_account_required' ||
        result.code === 'same_address'
          ? 'invalid'
          : 'unavailable';
      setState(next);
      setMessage(result.message || 'Could not verify companions.');
      setLinks([]);
      return result;
    }
    setState(result.linked ? 'linked' : 'not_linked');
    setMessage(result.message || '');
    setLinks(result.links || []);
    return result;
  }, [collectionId, tokenId, endUser, networkInfo, origin, enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    state,
    linked: state === 'linked',
    checking: state === 'checking',
    message,
    links,
    refresh,
  };
}

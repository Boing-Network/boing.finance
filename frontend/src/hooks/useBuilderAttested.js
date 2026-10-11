import { useCallback, useEffect, useState } from 'react';
import { isBoingNativeAccountIdHex } from '../utils/boingWalletDiscovery';
import { getBuilderAttestationsForPair } from '../services/builderAttestationRegistry';

/**
 * Live on-chain builder attestation check for a collection↔token pair.
 * States: idle | checking | attested | not_attested | unavailable | invalid
 */
export function useBuilderAttested({
  collectionId = '',
  tokenId = '',
  builderId = null,
  endUser = null,
  networkInfo = null,
  origin = null,
  enabled = true,
} = {}) {
  const [state, setState] = useState('idle');
  const [message, setMessage] = useState('');
  const [attestations, setAttestations] = useState([]);
  const [ownAttestation, setOwnAttestation] = useState(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setState('idle');
      setMessage('');
      setAttestations([]);
      setOwnAttestation(null);
      return { attested: false, code: 'disabled' };
    }
    const c = String(collectionId || '').trim();
    const t = String(tokenId || '').trim();
    if (!c || !t) {
      setState('idle');
      setMessage('');
      setAttestations([]);
      setOwnAttestation(null);
      return { attested: false, code: 'idle' };
    }
    if (!isBoingNativeAccountIdHex(c) || !isBoingNativeAccountIdHex(t)) {
      setState('invalid');
      setMessage('Enter valid collection and token ids.');
      setAttestations([]);
      setOwnAttestation(null);
      return { attested: false, code: 'invalid' };
    }

    setState('checking');
    setMessage('Checking builder attestation…');
    try {
      const result = await Promise.race([
        getBuilderAttestationsForPair({
          collectionId: c,
          tokenId: t,
          endUser,
          networkInfo,
          origin,
          builderId,
        }),
        new Promise((resolve) => {
          window.setTimeout(
            () =>
              resolve({
                ok: false,
                attested: false,
                code: 'timeout',
                message: 'Could not verify builder attestation right now.',
                attestations: [],
                ownAttestation: null,
              }),
            20000
          );
        }),
      ]);
      if (!result.ok) {
        const next =
          result.code === 'invalid_address' ||
          result.code === 'boing_account_required' ||
          result.code === 'same_address'
            ? 'invalid'
            : 'unavailable';
        setState(next);
        setMessage(result.message || 'Could not verify builder attestation.');
        setAttestations([]);
        setOwnAttestation(null);
        return result;
      }
      setState(result.attested ? 'attested' : 'not_attested');
      setMessage(result.message || '');
      setAttestations(result.attestations || []);
      setOwnAttestation(result.ownAttestation || null);
      return result;
    } catch (e) {
      const msg = e?.message || 'Could not verify builder attestation.';
      setState('unavailable');
      setMessage(msg);
      setAttestations([]);
      setOwnAttestation(null);
      return { ok: false, attested: false, code: 'error', message: msg, attestations: [], ownAttestation: null };
    }
  }, [collectionId, tokenId, builderId, endUser, networkInfo, origin, enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    state,
    attested: state === 'attested',
    checking: state === 'checking',
    message,
    attestations,
    ownAttestation,
    refresh,
  };
}

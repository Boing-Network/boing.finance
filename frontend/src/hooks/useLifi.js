import { useEffect, useMemo, useState } from 'react';
import { fetchLifiChains, fetchLifiTokens } from '../services/lifiApi';
import { explainLifiError } from '../utils/lifiCore';

/** Every LI.FI chain, cached. */
export function useLifiChains() {
  const [chains, setChains] = useState(/** @type {any[]} */ ([]));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    fetchLifiChains({ signal: ctrl.signal })
      .then((c) => {
        setChains(c);
        setError('');
      })
      .catch((e) => {
        if (e?.name !== 'AbortError') setError(explainLifiError({ ...(e?.body || {}), status: e?.status, message: e?.message }));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [attempt]);
  const byId = useMemo(() => new Map(chains.map((c) => [c.id, c])), [chains]);
  return { chains, byId, loading, error, retry: () => setAttempt((n) => n + 1) };
}

/** Every LI.FI token on one chain, cached. */
export function useLifiTokens(chainId) {
  const [state, setState] = useState({ chainId: null, tokens: /** @type {any[]} */ ([]), loading: false, error: '' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (chainId == null) return undefined;
    const ctrl = new AbortController();
    setState((s) => ({ chainId, tokens: s.chainId === chainId ? s.tokens : [], loading: true, error: '' }));
    fetchLifiTokens(chainId, { signal: ctrl.signal })
      .then((tokens) => {
        if (!ctrl.signal.aborted) setState({ chainId, tokens, loading: false, error: '' });
      })
      .catch((e) => {
        if (e?.name === 'AbortError') return;
        setState({ chainId, tokens: [], loading: false, error: explainLifiError({ ...(e?.body || {}), status: e?.status, message: e?.message }) });
      });
    return () => ctrl.abort();
  }, [chainId, attempt]);
  const ready = state.chainId === chainId;
  return {
    tokens: ready ? state.tokens : [],
    loading: !ready || state.loading,
    error: ready ? state.error : '',
    retry: () => setAttempt((n) => n + 1),
  };
}

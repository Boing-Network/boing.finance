import { useCallback, useEffect, useState } from 'react';
import { fetchLifiWalletBalances, clearLifiBalanceCache } from '../services/lifiApi';
import { fetchSolanaBalances } from '../services/solanaBalances';
import { isNativeTokenAddress } from '../utils/lifiCore';

/**
 * Balances of the connected wallet on one chain: EVM via LI.FI GET /v1/wallets/{address}/balances, Solana via
 * the Solana RPC. Returns a list of { address, amount, decimals, … } and a lookup by token address.
 */
export function useBridgeBalances(chain, { evmAccount, solanaAddress }) {
  const [state, setState] = useState({ key: '', list: /** @type {any[]} */ ([]), loading: false, error: '' });
  const [nonce, setNonce] = useState(0);
  const owner = chain?.chainType === 'EVM' ? evmAccount : chain?.chainType === 'SVM' ? solanaAddress : null;
  const key = chain && owner ? `${chain.id}:${owner}` : '';

  useEffect(() => {
    if (!key) {
      setState({ key: '', list: [], loading: false, error: '' });
      return undefined;
    }
    let cancelled = false;
    setState((s) => ({ key, list: s.key === key ? s.list : [], loading: true, error: '' }));
    (async () => {
      try {
        let list;
        if (chain.chainType === 'EVM') {
          const all = await fetchLifiWalletBalances(owner);
          list = all[String(chain.id)] || [];
        } else {
          list = await fetchSolanaBalances(owner);
        }
        if (!cancelled) setState({ key, list, loading: false, error: '' });
      } catch (e) {
        if (!cancelled) setState({ key, list: [], loading: false, error: 'Could not load your balances right now.' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, chain, owner, nonce]);

  const balanceOf = useCallback(
    (token) => {
      if (!token || state.key !== key) return null;
      const a = String(token.address).toLowerCase();
      const hit = state.list.find(
        (b) => String(b.address).toLowerCase() === a || (isNativeTokenAddress(b.address) && isNativeTokenAddress(token.address))
      );
      return hit ? hit.amount : state.loading ? null : '0';
    },
    [state, key]
  );

  return {
    supported: Boolean(owner),
    list: state.key === key ? state.list : [],
    loading: state.loading,
    error: state.error,
    balanceOf,
    refresh: () => {
      clearLifiBalanceCache();
      setNonce((n) => n + 1);
    },
  };
}

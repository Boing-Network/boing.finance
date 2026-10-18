import { useEffect, useState } from 'react';
import { walletNativeValueSupport } from '../services/boingWalletNativeValue';

/**
 * Whether the connected Boing wallet can send BOING with contract calls (Boing Express 0.1.19+ or the
 * boing.express web wallet). `null` while unknown / not connected, so callers only block on an explicit `false`.
 * @param {{ request: Function } | null} provider
 * @param {boolean} enabled
 * @returns {{ supported: boolean, version: string | null, source: string } | null}
 */
export function useWalletNativeValue(provider, enabled) {
  const [state, setState] = useState(null);
  useEffect(() => {
    if (!enabled || !provider) {
      setState(null);
      return undefined;
    }
    let off = false;
    walletNativeValueSupport(provider)
      .then((s) => !off && setState(s))
      .catch(() => !off && setState(null));
    return () => {
      off = true;
    };
  }, [provider, enabled]);
  return state;
}

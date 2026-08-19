import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useWallet } from './WalletContext';
import config from '../config';
import { subscribeFactoryLogs, eventKey } from '../services/alchemyRealtimeService';
import { getLatestTokenProfiles, subscribeTokenProfiles } from '../services/dexscreenerService';
import { hasHeliusApiKey, subscribeSolanaSlots } from '../services/heliusService';

const ChainRealtimeContext = createContext({
  events: [],
  status: { alchemy: 'idle', dexscreener: 'idle', helius: 'idle' },
});

function normalizeServerEvent(row) {
  if (!row) return null;
  let meta = {};
  try {
    meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {};
  } catch {
    meta = {};
  }
  return {
    type: row.eventName || meta.type || 'deploy',
    source: meta.source || 'webhook',
    chainId: row.chainId ?? meta.chainId,
    chainSlug: meta.chainSlug,
    tokenAddress: meta.tokenAddress,
    name: meta.name,
    symbol: meta.symbol,
    txHash: meta.txHash,
    ts: Date.parse(row.timestamp) || Date.now(),
    ...meta,
  };
}

export function ChainRealtimeProvider({ children }) {
  const { chainId } = useWallet();
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState({ alchemy: 'idle', dexscreener: 'idle', helius: 'idle' });
  const seen = useRef(new Set());

  const pushEvent = useCallback((event) => {
    if (!event) return;
    const key = eventKey(event) || `${event.type}:${event.tokenAddress}:${event.ts}`;
    if (seen.current.has(key)) return;
    seen.current.add(key);
    setEvents((prev) => [event, ...prev].slice(0, 80));
  }, []);

  useEffect(() => {
    let alive = true;
    setStatus((s) => ({ ...s, dexscreener: 'connecting' }));
    getLatestTokenProfiles()
      .then((rows) => {
        if (!alive) return;
        rows.slice(0, 12).forEach((row) => {
          pushEvent({
            type: 'token_profile',
            source: 'dexscreener',
            chainSlug: row.chainId,
            tokenAddress: row.tokenAddress,
            name: row.description || row.tokenAddress,
            url: row.url,
            icon: row.icon,
            ts: Date.now(),
          });
        });
      })
      .catch(() => {});

    const stop = subscribeTokenProfiles((row) => {
      setStatus((s) => ({ ...s, dexscreener: 'live' }));
      pushEvent({
        type: 'token_profile',
        source: 'dexscreener',
        chainSlug: row.chainId,
        tokenAddress: row.tokenAddress,
        name: row.description || row.tokenAddress,
        url: row.url,
        icon: row.icon,
        ts: Date.now(),
      });
    });
    setStatus((s) => ({ ...s, dexscreener: 'live' }));
    return () => {
      alive = false;
      stop();
    };
  }, [pushEvent]);

  useEffect(() => {
    if (!chainId) {
      setStatus((s) => ({ ...s, alchemy: 'idle' }));
      return undefined;
    }
    setStatus((s) => ({ ...s, alchemy: 'connecting' }));
    const stop = subscribeFactoryLogs(chainId, (event) => {
      setStatus((s) => ({ ...s, alchemy: 'live' }));
      pushEvent(event);
    });
    if (!stop) {
      setStatus((s) => ({ ...s, alchemy: 'unavailable' }));
      return undefined;
    }
    setStatus((s) => ({ ...s, alchemy: 'live' }));
    return () => stop();
  }, [chainId, pushEvent]);

  useEffect(() => {
    if (!hasHeliusApiKey()) {
      setStatus((s) => ({ ...s, helius: 'idle' }));
      return undefined;
    }
    setStatus((s) => ({ ...s, helius: 'live' }));
    const stop = subscribeSolanaSlots(() => {});
    return () => stop();
  }, []);

  useEffect(() => {
    const apiUrl = config?.apiUrl;
    if (!apiUrl) return undefined;
    let cancelled = false;
    const pull = async () => {
      try {
        const res = await fetch(`${apiUrl}/realtime/events?limit=40`);
        if (!res.ok || cancelled) return;
        const body = await res.json();
        const rows = Array.isArray(body?.data) ? body.data : [];
        rows.forEach((row) => pushEvent(normalizeServerEvent(row)));
      } catch {
        /* ignore */
      }
    };
    pull();
    const id = setInterval(pull, 20_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pushEvent]);

  const value = useMemo(() => ({ events, status, chainId }), [events, status, chainId]);
  return <ChainRealtimeContext.Provider value={value}>{children}</ChainRealtimeContext.Provider>;
}

export function useChainRealtime() {
  return useContext(ChainRealtimeContext);
}

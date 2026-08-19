import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { VersionedTransaction } from '@solana/web3.js';
import { useSolanaWallet } from '../contexts/SolanaWalletContext';
import { SOLANA_NETWORKS } from '../config/solanaConfig';
import {
  SOL_MINT,
  SOLANA_USDC,
  SOLANA_USDT,
  buildJupiterSwapTx,
  getJupiterQuote,
} from '../services/aggregatorSwapService';
import { useTokenMarket } from '../hooks/useTokenMarket';
import { useDexMarkets } from '../hooks/useDexMarkets';
import { formatUsdCompact } from '../services/tokenChartService';
import { ChartSkeleton } from './SkeletonLoader';
import SwapMarketsBoard from './SwapMarketsBoard';
import SwapSpotTicker from './SwapSpotTicker';

const SwapTokenPriceChart = lazy(() => import('./SwapTokenPriceChart'));

const TOKENS = [
  { symbol: 'SOL', name: 'Solana', mint: SOL_MINT, decimals: 9, isNative: true },
  { symbol: 'USDC', name: 'USD Coin', mint: SOLANA_USDC, decimals: 6 },
  { symbol: 'USDT', name: 'Tether', mint: SOLANA_USDT, decimals: 6 },
];

function formatOut(raw, decimals) {
  try {
    const n = Number(raw) / 10 ** decimals;
    if (!Number.isFinite(n)) return '';
    return n.toPrecision(8).replace(/\.?0+$/, '');
  } catch {
    return '';
  }
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

function toChartToken(meta) {
  return {
    symbol: meta?.symbol || '',
    address: meta?.mint || '',
    isNative: Boolean(meta?.isNative),
  };
}

export default function SolanaAggregatorSwap() {
  const { connected, connectWallet, network, publicKey, connection, signTransaction } = useSolanaWallet();
  const solanaNetwork = SOLANA_NETWORKS[network] || SOLANA_NETWORKS.devnet;
  const [tokenIn, setTokenIn] = useState('SOL');
  const [tokenOut, setTokenOut] = useState('USDC');
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState('');
  const [extraTokens, setExtraTokens] = useState([]);
  const listed = useMemo(() => {
    const base = [...TOKENS];
    for (const t of extraTokens) {
      if (!base.some((b) => b.mint === t.mint)) base.push(t);
    }
    return base;
  }, [extraTokens]);
  const dexMarkets = useDexMarkets({ solana: true, enabled: true });

  const inMeta = useMemo(() => listed.find((t) => t.symbol === tokenIn), [tokenIn, listed]);
  const outMeta = useMemo(() => listed.find((t) => t.symbol === tokenOut), [tokenOut, listed]);
  const isMainnet = network === 'mainnet';

  const inMarket = useTokenMarket({
    chain: 'solana',
    address: inMeta?.mint,
    isNative: Boolean(inMeta?.isNative),
    symbol: inMeta?.symbol,
    days: 7,
    enabled: isMainnet,
  });
  const outMarket = useTokenMarket({
    chain: 'solana',
    address: outMeta?.mint,
    isNative: Boolean(outMeta?.isNative),
    symbol: outMeta?.symbol,
    days: 7,
    enabled: isMainnet,
  });
  const amountInUsd =
    amountIn && inMarket.data?.price ? formatUsdCompact(parseFloat(amountIn) * inMarket.data.price) : '';
  const amountOutUsd =
    amountOut && outMarket.data?.price ? formatUsdCompact(parseFloat(amountOut) * outMarket.data.price) : '';

  const fetchQuote = useCallback(async () => {
    setError('');
    setQuote(null);
    setAmountOut('');
    if (!inMeta || !outMeta || tokenIn === tokenOut) return;
    const n = parseFloat(amountIn);
    if (!Number.isFinite(n) || n <= 0) return;
    const raw = Math.round(n * 10 ** inMeta.decimals);
    if (raw <= 0) return;
    setLoading(true);
    try {
      const q = await getJupiterQuote({
        inputMint: inMeta.mint,
        outputMint: outMeta.mint,
        amount: String(raw),
        slippagePercent: 0.5,
      });
      if (!q?.quoteResponse) {
        setError('No Jupiter route for this pair. Try another amount or token.');
        return;
      }
      setQuote(q);
      setAmountOut(formatOut(q.amountOutRaw || q.quoteResponse.outAmount, outMeta.decimals));
    } catch (e) {
      setError(e.message || 'Quote failed');
    } finally {
      setLoading(false);
    }
  }, [amountIn, inMeta, outMeta, tokenIn, tokenOut]);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchQuote();
    }, 400);
    return () => clearTimeout(t);
  }, [fetchQuote]);

  const selectedMarket = useMemo(() => {
    const list = dexMarkets.data || [];
    return list.find((m) => m.symbol === tokenOut || m.address === outMeta?.mint) || list[0] || null;
  }, [dexMarkets.data, tokenOut, outMeta?.mint]);

  const selectDiscoveryMarket = (market) => {
    if (!market?.address || !market?.symbol) return;
    setExtraTokens((prev) => {
      if (prev.some((t) => t.mint === market.address) || TOKENS.some((t) => t.mint === market.address)) return prev;
      return [
        ...prev,
        {
          symbol: market.symbol,
          name: market.name,
          mint: market.address,
          decimals: market.decimals || 6,
        },
      ];
    });
    setTokenOut(market.symbol);
    if (tokenIn === market.symbol) setTokenIn('SOL');
  };

  useEffect(() => {
    if (tokenOut !== 'USDC') return;
    const first = dexMarkets.data?.[0];
    if (first) selectDiscoveryMarket(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dexMarkets.data]);

  const switchTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
  };

  const onSwap = async () => {
    if (!connected || !publicKey) {
      toast.error('Connect a Solana wallet first');
      return;
    }
    if (network !== 'mainnet') {
      toast.error('Jupiter routing is on Solana mainnet. Switch the Solana network to mainnet.');
      return;
    }
    if (!quote?.quoteResponse) {
      toast.error('No route yet');
      return;
    }
    setSwapping(true);
    setError('');
    try {
      const built = await buildJupiterSwapTx({
        quoteResponse: quote.quoteResponse,
        userPublicKey: publicKey.toBase58(),
      });
      const tx = VersionedTransaction.deserialize(b64ToBytes(built.swapTransaction));
      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });
      await connection.confirmTransaction(sig, 'confirmed');
      toast.success('Swap landed on Solana');
      setAmountIn('');
      setAmountOut('');
      setQuote(null);
    } catch (e) {
      const msg = e?.message || 'Swap failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setSwapping(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Swap - Solana | Boing Finance</title>
      </Helmet>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Spot</h1>
          <p className="text-sm mt-0.5 text-gray-400">
            Discover trending Solana tokens and swap on-chain via Jupiter
          </p>
        </div>

        <SwapSpotTicker
          market={selectedMarket}
          networkName={solanaNetwork.name}
          fallbackPair={`${tokenOut}/${tokenIn}`}
        />
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          <div className="xl:col-span-3 order-3 xl:order-1 xl:sticky xl:top-20">
            <SwapMarketsBoard
              networkName="Solana"
              tab={dexMarkets.tab}
              onTab={dexMarkets.setTab}
              queryText={dexMarkets.queryText}
              onQueryText={dexMarkets.setQueryText}
              rows={dexMarkets.rows}
              isLoading={dexMarkets.isLoading}
              selectedAddress={outMeta?.mint}
              onSelect={selectDiscoveryMarket}
            />
          </div>
          <div className="xl:col-span-9 order-1 xl:order-2 flex flex-col gap-4 min-w-0">
            <Suspense fallback={<ChartSkeleton height="280px" />}>
              <SwapTokenPriceChart
                chain="solana"
                tokenIn={toChartToken(inMeta)}
                tokenOut={toChartToken(outMeta)}
              />
            </Suspense>
            <div
              className="rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              {!connected ? (
                <button
                  type="button"
                  onClick={connectWallet}
                  className="w-full px-6 py-3 rounded-xl font-medium bg-cyan-600 text-white hover:bg-cyan-500"
                >
                  Connect Solana Wallet
                </button>
              ) : (
                <>
                  <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-tertiary, rgba(255,255,255,0.04))' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">You pay</span>
                      <select
                        className="bg-gray-700 text-white rounded-lg px-2 py-1 text-sm"
                        value={tokenIn}
                        onChange={(e) => setTokenIn(e.target.value)}
                      >
                        {listed.map((t) => (
                          <option key={t.mint} value={t.symbol}>
                            {t.symbol}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      className="w-full bg-transparent text-2xl font-bold text-white placeholder-gray-500 focus:outline-none"
                      type="number"
                      min="0"
                      value={amountIn}
                      onChange={(e) => setAmountIn(e.target.value)}
                      placeholder="0.0"
                    />
                    {amountInUsd ? <p className="text-xs text-gray-500 mt-1">≈ {amountInUsd}</p> : null}
                  </div>

                  <div className="flex justify-center -my-1">
                    <button
                      type="button"
                      onClick={switchTokens}
                      className="bg-gray-700 hover:bg-gray-600 rounded-full p-2"
                      aria-label="Switch tokens"
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-gray-300">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </button>
                  </div>

                  <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-tertiary, rgba(255,255,255,0.04))' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">You receive</span>
                      <select
                        className="bg-gray-700 text-white rounded-lg px-2 py-1 text-sm"
                        value={tokenOut}
                        onChange={(e) => setTokenOut(e.target.value)}
                      >
                        {listed.map((t) => (
                          <option key={t.mint} value={t.symbol}>
                            {t.symbol}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {loading ? '…' : amountOut || '0.0'}
                    </div>
                    {amountOutUsd ? <p className="text-xs text-gray-500 mt-1">≈ {amountOutUsd}</p> : null}
                  </div>

                  {quote?.venue && (
                    <p className="text-xs text-cyan-400">Via {quote.venue} (Jupiter)</p>
                  )}
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  <button
                    type="button"
                    disabled={swapping || loading || !quote || tokenIn === tokenOut}
                    onClick={() => void onSwap()}
                    className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white disabled:opacity-50"
                  >
                    {swapping ? 'Swapping…' : 'Swap via Jupiter'}
                  </button>
                  <p className="text-xs text-gray-500 text-center">{solanaNetwork.name}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

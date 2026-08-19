import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

const TOKENS = [
  { symbol: 'SOL', name: 'Solana', mint: SOL_MINT, decimals: 9 },
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

  const inMeta = useMemo(() => TOKENS.find((t) => t.symbol === tokenIn), [tokenIn]);
  const outMeta = useMemo(() => TOKENS.find((t) => t.symbol === tokenOut), [tokenOut]);

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
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Swap</h1>
          <p className="text-gray-400 mb-6 text-sm">
            Routes through Jupiter across Raydium, Orca, and other Solana venues. Liquidity is theirs; you sign in your wallet.
          </p>

          {!connected ? (
            <button
              type="button"
              onClick={connectWallet}
              className="w-full px-6 py-3 rounded-lg font-medium bg-cyan-600 text-white hover:bg-cyan-500"
            >
              Connect Solana Wallet
            </button>
          ) : (
            <div
              className="rounded-2xl p-5 space-y-4"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex gap-3">
                <label className="flex-1 text-xs text-gray-400">
                  From
                  <select
                    className="mt-1 w-full bg-gray-700 text-white rounded-lg px-3 py-2"
                    value={tokenIn}
                    onChange={(e) => setTokenIn(e.target.value)}
                  >
                    {TOKENS.map((t) => (
                      <option key={t.mint} value={t.symbol}>
                        {t.symbol}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex-1 text-xs text-gray-400">
                  To
                  <select
                    className="mt-1 w-full bg-gray-700 text-white rounded-lg px-3 py-2"
                    value={tokenOut}
                    onChange={(e) => setTokenOut(e.target.value)}
                  >
                    {TOKENS.map((t) => (
                      <option key={t.mint} value={t.symbol}>
                        {t.symbol}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block text-xs text-gray-400">
                Amount
                <input
                  className="mt-1 w-full bg-gray-700 text-white rounded-lg px-3 py-3 text-xl"
                  type="number"
                  min="0"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  placeholder="0.0"
                />
              </label>
              <div className="text-sm text-gray-300">
                {loading ? 'Finding Jupiter route…' : amountOut ? `You receive ~${amountOut} ${tokenOut}` : 'Enter an amount'}
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
            </div>
          )}
        </div>
      </div>
    </>
  );
}

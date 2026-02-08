/**
 * Portfolio Solana - SOL balance + SPL token balances
 * Shown when chain type is Solana
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useSolanaWallet } from '../contexts/SolanaWalletContext';
import { SOLANA_NETWORKS } from '../config/solanaConfig';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { Helmet } from 'react-helmet-async';

export default function PortfolioSolanaContent() {
  const { connection, address, connected, connectWallet, network } = useSolanaWallet();
  const [solBalance, setSolBalance] = useState(null);
  const [splTokens, setSplTokens] = useState([]);
  const [loading, setLoading] = useState(false);

  const solanaNetwork = SOLANA_NETWORKS[network] || SOLANA_NETWORKS.devnet;

  const fetchBalances = useCallback(async () => {
    if (!connected || !address || !connection) return;
    setLoading(true);
    try {
      const pk = new PublicKey(address);
      const [balance, tokenAccounts] = await Promise.all([
        connection.getBalance(pk),
        connection.getParsedTokenAccountsByOwner(pk, { programId: TOKEN_PROGRAM_ID }),
      ]);
      setSolBalance(balance / 1e9);
      const tokens = tokenAccounts.value
        .filter((acc) => (acc.account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0) > 0)
        .map((acc) => {
          const info = acc.account.data.parsed?.info || {};
          const amt = info.tokenAmount || {};
          return {
            mint: info.mint,
            symbol: info.tokenAmount?.uiAmount != null ? `${String(info.mint).slice(0, 6)}…` : '—',
            name: 'SPL Token',
            balance: amt.uiAmountString ?? String(amt.uiAmount ?? 0),
            decimals: amt.decimals ?? 0,
          };
        });
      setSplTokens(tokens);
    } catch (err) {
      console.error('Solana portfolio fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [connected, address, connection]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  if (!connected) {
    return (
      <>
        <Helmet>
          <title>Portfolio - Solana | Boing Finance</title>
        </Helmet>
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="max-w-xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Portfolio</h1>
            <p className="text-gray-400 mb-6">Connect your Solana wallet to view SOL and SPL token balances.</p>
            <button
              onClick={connectWallet}
              className="px-6 py-3 rounded-lg font-medium bg-cyan-600 text-white hover:bg-cyan-500"
            >
              Connect Solana Wallet
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Portfolio - Solana | Boing Finance</title>
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Portfolio</h1>
          <p className="text-gray-400 mb-6">{solanaNetwork.name}</p>

          {loading ? (
            <div className="rounded-xl border p-6 text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <p className="text-gray-400">Loading balances…</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h2 className="text-lg font-semibold text-white mb-4">SOL Balance</h2>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {solBalance != null ? solBalance.toFixed(4) : '—'} SOL
                </p>
              </div>
              <div className="rounded-xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h2 className="text-lg font-semibold text-white mb-4">SPL Tokens</h2>
                {splTokens.length === 0 ? (
                  <p className="text-gray-400">No SPL tokens found.</p>
                ) : (
                  <ul className="space-y-2">
                    {splTokens.map((t) => (
                      <li key={t.mint} className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                        <span className="text-white font-medium">{t.symbol}</span>
                        <span className="text-gray-400">{t.balance}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

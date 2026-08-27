import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useSolanaWallet } from '../contexts/SolanaWalletContext';
import { SOLANA_NETWORKS, formatSolanaRpcError } from '../config/solanaConfig';
import { createSolanaRaydiumCpmmPool, solanaCreatePoolFeeHint } from '../services/solanaCreatePool';
import { showDeployCelebration } from '../utils/deployCelebration';

const RAYDIUM_POOLS = 'https://raydium.io/liquidity-pools/?tab=standard';
const FEE_OPTIONS = [
  { value: 2500, label: '0.25% — standard' },
  { value: 3000, label: '0.30%' },
  { value: 10000, label: '1.00%' },
];

function explorerTx(network, signature) {
  const cluster = network === 'mainnet' ? '' : `?cluster=devnet`;
  return `https://solscan.io/tx/${signature}${cluster}`;
}

function explorerAccount(network, address) {
  const cluster = network === 'mainnet' ? '' : `?cluster=devnet`;
  return `https://solscan.io/account/${address}${cluster}`;
}

export default function SolanaCreatePoolPanel() {
  const { connected, connectWallet, network, connection, address, signTransaction } = useSolanaWallet();
  const solanaNetwork = SOLANA_NETWORKS[network] || SOLANA_NETWORKS.devnet;
  const [mintA, setMintA] = useState('');
  const [mintB, setMintB] = useState('');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [tradeFeeRate, setTradeFeeRate] = useState(2500);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState(null);

  const onCreate = async () => {
    if (!connected || !address) {
      toast.error('Connect a Solana wallet first.');
      return;
    }
    setBusy(true);
    setLast(null);
    try {
      const result = await createSolanaRaydiumCpmmPool({
        connection,
        ownerAddress: address,
        signTransaction,
        mintA,
        mintB,
        amountA,
        amountB,
        network,
        tradeFeeRate: Number(tradeFeeRate),
      });
      setLast(result);
      showDeployCelebration({
        deploymentKind: 'Raydium CPMM pool',
        details: [
          { label: 'Pool', value: result.poolId },
          { label: 'LP mint', value: result.lpMint },
          { label: 'Cluster', value: solanaNetwork.name },
        ],
        txHash: result.signature,
        externalTxUrl: explorerTx(network, result.signature),
        externalAddressUrl: explorerAccount(network, result.poolId),
      });
    } catch (e) {
      toast.error(formatSolanaRpcError(e) || e?.message || 'Could not create the Solana pool.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Create Pool - Solana | boing.finance</title>
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto">
          <h1 className="text-4xl font-bold mb-2 text-center" style={{ color: 'var(--text-primary)' }}>
            Create Liquidity Pool
          </h1>
          <p className="mb-6 text-center" style={{ color: 'var(--text-secondary)' }}>
            Seed a Raydium CPMM (constant-product) pool with two SPL mints. This signs in your wallet — it does not open
            Raydium in another tab.
          </p>

          {!connected ? (
            <div className="text-center">
              <button
                type="button"
                onClick={connectWallet}
                className="px-6 py-3 rounded-lg font-medium text-white hover:opacity-90"
                style={{ background: 'var(--accent-teal)' }}
              >
                Connect Solana Wallet
              </button>
            </div>
          ) : (
            <div className="rounded-xl border p-5 space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <label className="block text-sm" style={{ color: 'var(--text-secondary)' }}>
                Token A mint
                <input
                  type="text"
                  value={mintA}
                  onChange={(e) => setMintA(e.target.value)}
                  placeholder="SPL mint address"
                  className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm font-mono"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </label>
              <label className="block text-sm" style={{ color: 'var(--text-secondary)' }}>
                Token B mint
                <input
                  type="text"
                  value={mintB}
                  onChange={(e) => setMintB(e.target.value)}
                  placeholder="SPL mint address"
                  className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm font-mono"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Token A amount
                  <input
                    type="text"
                    value={amountA}
                    onChange={(e) => setAmountA(e.target.value)}
                    placeholder="0.0"
                    className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </label>
                <label className="block text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Token B amount
                  <input
                    type="text"
                    value={amountB}
                    onChange={(e) => setAmountB(e.target.value)}
                    placeholder="0.0"
                    className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </label>
              </div>
              <label className="block text-sm" style={{ color: 'var(--text-secondary)' }}>
                Swap fee
                <select
                  value={tradeFeeRate}
                  onChange={(e) => setTradeFeeRate(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  {FEE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {solanaCreatePoolFeeHint(network)} {solanaNetwork.name}.
              </p>
              <button
                type="button"
                onClick={onCreate}
                disabled={busy || !mintA || !mintB || !amountA || !amountB}
                className="w-full px-6 py-3 rounded-lg font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--accent-teal)' }}
              >
                {busy ? 'Creating pool…' : 'Create Raydium pool'}
              </button>
              {last?.signature && (
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Pool{' '}
                  <a className="text-cyan-400 underline" href={explorerAccount(network, last.poolId)} target="_blank" rel="noopener noreferrer">
                    {last.poolId.slice(0, 8)}…
                  </a>{' '}
                  ·{' '}
                  <a className="text-cyan-400 underline" href={explorerTx(network, last.signature)} target="_blank" rel="noopener noreferrer">
                    transaction
                  </a>
                </p>
              )}
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Concentrated-liquidity (CLMM) pools stay on{' '}
                <a className="text-cyan-400 underline" href={RAYDIUM_POOLS} target="_blank" rel="noopener noreferrer">
                  Raydium
                </a>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

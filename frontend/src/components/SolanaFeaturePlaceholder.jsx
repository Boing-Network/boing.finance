/**
 * Solana Feature Placeholder
 * Shown when chain type is Solana and the feature uses external Solana protocols (Raydium, Jupiter, etc.)
 */
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSolanaWallet } from '../contexts/SolanaWalletContext';
import { SOLANA_NETWORKS } from '../config/solanaConfig';
import SolanaAggregatorSwap from './SolanaAggregatorSwap';

const RAYDIUM_CREATE_POOL = 'https://raydium.io/liquidity/create/';
const RAYDIUM_LIQUIDITY = 'https://raydium.io/liquidity/';
const RAYDIUM_POOLS = 'https://raydium.io/pools/';

export function CreatePoolSolanaContent() {
  const { connected, connectWallet, network } = useSolanaWallet();
  const solanaNetwork = SOLANA_NETWORKS[network] || SOLANA_NETWORKS.devnet;

  return (
    <>
      <Helmet>
        <title>Create Pool - Solana | boing.finance</title>
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Create Liquidity Pool</h1>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            On Solana, liquidity pools are created through Raydium or Orca. Use Raydium to create AMM pools with your SPL tokens.
          </p>
          {!connected ? (
            <button
              onClick={connectWallet}
              className="px-6 py-3 rounded-lg font-medium text-white hover:opacity-90"
              style={{ background: 'var(--accent-teal)' }}
            >
              Connect Solana Wallet
            </button>
          ) : (
            <a
              href={RAYDIUM_CREATE_POOL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white hover:opacity-90"
              style={{ background: 'var(--accent-teal)' }}
            >
              Create Pool on Raydium →
            </a>
          )}
          <p className="text-sm mt-6" style={{ color: 'var(--text-tertiary)' }}>
            {solanaNetwork.name} • Pools use Raydium&apos;s AMM
          </p>
        </div>
      </div>
    </>
  );
}

export function LiquiditySolanaContent() {
  const { connected, connectWallet, network } = useSolanaWallet();
  const solanaNetwork = SOLANA_NETWORKS[network] || SOLANA_NETWORKS.devnet;

  return (
    <>
      <Helmet>
        <title>Liquidity - Solana | boing.finance</title>
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Liquidity</h1>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Manage your Solana LP positions on Raydium. Add or remove liquidity for SPL token pairs.
          </p>
          {!connected ? (
            <button
              onClick={connectWallet}
              className="px-6 py-3 rounded-lg font-medium text-white hover:opacity-90"
              style={{ background: 'var(--accent-teal)' }}
            >
              Connect Solana Wallet
            </button>
          ) : (
            <a
              href={RAYDIUM_LIQUIDITY}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white hover:opacity-90"
              style={{ background: 'var(--accent-teal)' }}
            >
              Open Raydium Liquidity →
            </a>
          )}
          <p className="text-sm mt-6" style={{ color: 'var(--text-tertiary)' }}>{solanaNetwork.name}</p>
        </div>
      </div>
    </>
  );
}

export function PoolsSolanaContent() {
  const { connected, connectWallet, network } = useSolanaWallet();
  const solanaNetwork = SOLANA_NETWORKS[network] || SOLANA_NETWORKS.devnet;

  return (
    <>
      <Helmet>
        <title>Pools - Solana | boing.finance</title>
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Liquidity Pools</h1>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Browse and explore Solana liquidity pools on Raydium.
          </p>
          {!connected ? (
            <button
              onClick={connectWallet}
              className="px-6 py-3 rounded-lg font-medium text-white hover:opacity-90"
              style={{ background: 'var(--accent-teal)' }}
            >
              Connect Solana Wallet
            </button>
          ) : (
            <a
              href={RAYDIUM_POOLS}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white hover:opacity-90"
              style={{ background: 'var(--accent-teal)' }}
            >
              Browse Pools on Raydium →
            </a>
          )}
          <p className="text-sm mt-6" style={{ color: 'var(--text-tertiary)' }}>{solanaNetwork.name}</p>
        </div>
      </div>
    </>
  );
}

export function SwapSolanaContent() {
  return <SolanaAggregatorSwap />;
}

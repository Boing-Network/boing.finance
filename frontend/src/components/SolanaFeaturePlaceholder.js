/**
 * Solana Feature Placeholder
 * Shown when chain type is Solana and the feature uses external Solana protocols (Raydium, Jupiter, etc.)
 */
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSolanaWallet } from '../contexts/SolanaWalletContext';
import { SOLANA_NETWORKS } from '../config/solanaConfig';

const RAYDIUM_CREATE_POOL = 'https://raydium.io/liquidity/create/';
const RAYDIUM_LIQUIDITY = 'https://raydium.io/liquidity/';
const RAYDIUM_POOLS = 'https://raydium.io/pools/';
const JUPITER_SWAP = 'https://jup.ag/swap/SOL-USDC';

export function CreatePoolSolanaContent() {
  const { connected, connectWallet, network } = useSolanaWallet();
  const solanaNetwork = SOLANA_NETWORKS[network] || SOLANA_NETWORKS.devnet;

  return (
    <>
      <Helmet>
        <title>Create Pool - Solana | Boing Finance</title>
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Create Liquidity Pool</h1>
          <p className="text-gray-400 mb-6">
            On Solana, liquidity pools are created through Raydium or Orca. Use Raydium to create AMM pools with your SPL tokens.
          </p>
          {!connected ? (
            <button
              onClick={connectWallet}
              className="px-6 py-3 rounded-lg font-medium bg-cyan-600 text-white hover:bg-cyan-500"
            >
              Connect Solana Wallet
            </button>
          ) : (
            <a
              href={RAYDIUM_CREATE_POOL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-cyan-600 text-white hover:bg-cyan-500"
            >
              Create Pool on Raydium →
            </a>
          )}
          <p className="text-sm text-gray-500 mt-6">
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
        <title>Liquidity - Solana | Boing Finance</title>
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Liquidity</h1>
          <p className="text-gray-400 mb-6">
            Manage your Solana LP positions on Raydium. Add or remove liquidity for SPL token pairs.
          </p>
          {!connected ? (
            <button
              onClick={connectWallet}
              className="px-6 py-3 rounded-lg font-medium bg-cyan-600 text-white hover:bg-cyan-500"
            >
              Connect Solana Wallet
            </button>
          ) : (
            <a
              href={RAYDIUM_LIQUIDITY}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-cyan-600 text-white hover:bg-cyan-500"
            >
              Open Raydium Liquidity →
            </a>
          )}
          <p className="text-sm text-gray-500 mt-6">{solanaNetwork.name}</p>
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
        <title>Pools - Solana | Boing Finance</title>
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Liquidity Pools</h1>
          <p className="text-gray-400 mb-6">
            Browse and explore Solana liquidity pools on Raydium.
          </p>
          {!connected ? (
            <button
              onClick={connectWallet}
              className="px-6 py-3 rounded-lg font-medium bg-cyan-600 text-white hover:bg-cyan-500"
            >
              Connect Solana Wallet
            </button>
          ) : (
            <a
              href={RAYDIUM_POOLS}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-cyan-600 text-white hover:bg-cyan-500"
            >
              Browse Pools on Raydium →
            </a>
          )}
          <p className="text-sm text-gray-500 mt-6">{solanaNetwork.name}</p>
        </div>
      </div>
    </>
  );
}

export function SwapSolanaContent() {
  const { connected, connectWallet, network } = useSolanaWallet();
  const solanaNetwork = SOLANA_NETWORKS[network] || SOLANA_NETWORKS.devnet;

  return (
    <>
      <Helmet>
        <title>Swap - Solana | Boing Finance</title>
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Swap</h1>
          <p className="text-gray-400 mb-6">
            Swap SPL tokens on Solana using Jupiter for best execution across Raydium, Orca, and other DEXs.
          </p>
          {!connected ? (
            <button
              onClick={connectWallet}
              className="px-6 py-3 rounded-lg font-medium bg-cyan-600 text-white hover:bg-cyan-500"
            >
              Connect Solana Wallet
            </button>
          ) : (
            <a
              href={JUPITER_SWAP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-cyan-600 text-white hover:bg-cyan-500"
            >
              Swap on Jupiter →
            </a>
          )}
          <p className="text-sm text-gray-500 mt-6">{solanaNetwork.name}</p>
        </div>
      </div>
    </>
  );
}

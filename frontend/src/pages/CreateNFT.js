// Create NFT - Simple mint flow under Deployment
// Placeholder for Boing NFT minting (contracts coming per BOING_NFT_ROADMAP)

import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useWallet } from '../contexts/WalletContext';
import NetworkSelector from '../components/NetworkSelector';
import EmptyState from '../components/EmptyState';

export default function CreateNFT() {
  const { account, isConnected, getCurrentNetwork, connectWallet } = useWallet();
  const [collectionName, setCollectionName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [metadataUri, setMetadataUri] = useState('');
  const [mintCount, setMintCount] = useState(1);

  const network = getCurrentNetwork?.();

  return (
    <>
      <Helmet>
        <title>Create NFT - Mint Your Collectibles | Boing Finance</title>
        <meta name="description" content="Create and mint NFTs on Boing Finance. Simple NFT deployment coming soon." />
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Create NFT</h1>
            <p className="text-gray-400">
              Mint your own NFT collection. Simple mint flow coming soon with Boing NFT contracts.
            </p>
          </div>

          <div
            className="rounded-2xl border p-6 sm:p-8"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            {!isConnected ? (
              <EmptyState
                variant="nfts"
                title="Connect your wallet"
                description="Connect your wallet to create and mint NFTs."
                action={connectWallet}
                actionLabel="Connect Wallet"
                secondaryLabel="Deploy Token instead"
                secondaryHref="/deploy-token"
              />
            ) : (
              <>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Network</label>
                    <NetworkSelector />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Collection Name *</label>
                    <input
                      type="text"
                      value={collectionName}
                      onChange={(e) => setCollectionName(e.target.value)}
                      placeholder="My NFT Collection"
                      className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Symbol *</label>
                    <input
                      type="text"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      placeholder="MNFT"
                      maxLength={10}
                      className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Metadata URI (optional)</label>
                    <input
                      type="url"
                      value={metadataUri}
                      onChange={(e) => setMetadataUri(e.target.value)}
                      placeholder="ipfs://... or https://..."
                      className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Mint Count</label>
                    <input
                      type="number"
                      value={mintCount}
                      onChange={(e) => setMintCount(Math.max(1, parseInt(e.target.value) || 1))}
                      min={1}
                      max={100}
                      className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="rounded-lg p-4 bg-amber-900/20 border border-amber-500/30">
                    <p className="text-amber-200 text-sm">
                      <strong>Coming Soon:</strong> NFT minting will be available once Boing NFT contracts launch.
                      See the{' '}
                      <a href="/deploy-token" className="text-blue-400 hover:text-blue-300 underline">
                        Deploy Token
                      </a>{' '}
                      page to create tokens while you wait.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled
                    className="w-full py-3 px-6 rounded-lg bg-gray-600 text-gray-400 font-medium cursor-not-allowed"
                  >
                    Mint NFT (Coming Soon)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

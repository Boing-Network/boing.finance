import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { PageHeader, PageCard } from '../../components/PageLayout';
import { useWalletConnection } from '../../hooks/useWalletConnection';

const MOCK_NFTS = [
  { id: 1, name: 'Boing Astronaut #42', image: '/favicon.svg', staked: false, rewards: 0 },
  { id: 2, name: 'Boing Astronaut #128', image: '/favicon.svg', staked: true, rewards: 125 },
];

export default function BoingStaking() {
  const { account } = useWalletConnection();
  const [nfts] = useState(MOCK_NFTS);

  const stakedCount = nfts.filter((n) => n.staked).length;
  const totalRewards = nfts.filter((n) => n.staked).reduce((s, n) => s + n.rewards, 0);

  return (
    <>
      <Helmet>
        <title>NFT Staking | boing.finance — Stake BOING NFTs, Earn Rewards</title>
        <meta name="description" content="Stake your Boing NFTs to earn rewards. NFT staking on boing.finance." />
      </Helmet>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <PageHeader title="NFT Staking" subtitle="Stake your Boing NFTs to earn BOING rewards and unlock Pro Analytics." />

        {account ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <PageCard>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Staked NFTs</p>
                <p className="text-3xl font-bold text-cyan-400">{stakedCount}</p>
              </PageCard>
              <PageCard>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Pending Rewards</p>
                <p className="text-3xl font-bold text-green-400">{totalRewards} BOING</p>
              </PageCard>
              <PageCard>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>APR</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>~24%</p>
              </PageCard>
            </div>

            <PageCard className="mb-6">
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Your Boing NFTs</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {nfts.map((nft) => (
                  <div key={nft.id} className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    <div className="aspect-square bg-gray-800 flex items-center justify-center p-4">
                      <img src={nft.image} alt={nft.name} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="p-4">
                      <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{nft.name}</p>
                      {nft.staked ? (
                        <>
                          <p className="text-xs text-green-400 mb-2">Staked • {nft.rewards} BOING earned</p>
                          <button className="w-full py-2 rounded-lg text-sm font-medium bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30">Unstake</button>
                        </>
                      ) : (
                        <button className="w-full py-2 rounded-lg text-sm font-medium bg-cyan-500 hover:bg-cyan-600 text-white">Stake</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </PageCard>

            <PageCard>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Benefits</h3>
              <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                <li>• Earn BOING rewards for staking your NFTs</li>
                <li>• Unlock Pro Analytics features (advanced charts, insights)</li>
                <li>• Governance weight multiplier for staked NFT holders</li>
              </ul>
            </PageCard>
          </>
        ) : (
          <PageCard className="text-center py-12">
            <div className="text-5xl mb-4">🎴</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Connect Wallet to Stake</h3>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>Connect your wallet to view your Boing NFTs and stake them for rewards.</p>
            <Link to="/create-nft" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">Don't have a Boing NFT? Create one →</Link>
          </PageCard>
        )}
      </div>
    </>
  );
}

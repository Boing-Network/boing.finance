import React from 'react';
import { Helmet } from 'react-helmet-async';
import { PageHeader, PageCard } from '../../components/PageLayout';
import EmptyState from '../../components/EmptyState';
import { useWalletConnection } from '../../hooks/useWalletConnection';

export default function BoingStaking() {
  const { account } = useWalletConnection();

  return (
    <>
      <Helmet>
        <title>NFT Staking | boing.finance — Stake BOING NFTs, Earn Rewards</title>
        <meta name="description" content="Stake your Boing NFTs to earn rewards. NFT staking on boing.finance." />
      </Helmet>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <PageHeader
          title="NFT Staking"
          subtitle="Stake Boing NFTs for rewards and analytics unlocks — coming with live staking contracts."
        />

        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-900/20 px-4 py-3 text-sm text-amber-100">
          <strong>Not live yet:</strong> NFT staking, APR, and reward balances are not available in the app.
          Sample NFTs and stake buttons have been removed so they are not mistaken for on-chain actions.
        </div>

        {account ? (
          <>
            <EmptyState
              variant="nfts"
              title="No staked NFTs"
              description="When staking contracts launch, your Boing NFTs and rewards will show here."
              actionHref="/create-nft"
              actionLabel="Create a Boing NFT"
            />
            <PageCard className="mt-6">
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Planned benefits</h3>
              <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                <li>• Earn BOING rewards for staking your NFTs</li>
                <li>• Unlock Pro Analytics features (advanced charts, insights)</li>
                <li>• Governance weight multiplier for staked NFT holders</li>
              </ul>
            </PageCard>
          </>
        ) : (
          <EmptyState
            variant="nfts"
            title="Connect wallet to stake"
            description="Connect your wallet from the header. Staking actions will appear here once contracts go live."
            actionHref="/create-nft"
            actionLabel="Create a Boing NFT"
          />
        )}
      </div>
    </>
  );
}

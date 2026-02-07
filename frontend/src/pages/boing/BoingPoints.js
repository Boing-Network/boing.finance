import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { PageHeader, PageCard } from '../../components/PageLayout';
import { useWalletConnection } from '../../hooks/useWalletConnection';

const MOCK_ACTIVITIES = [
  { action: 'Swap completed', points: 10, date: '2025-02-04' },
  { action: 'Liquidity added', points: 25, date: '2025-02-03' },
  { action: 'Bridge used', points: 15, date: '2025-02-02' },
  { action: 'Token deployed', points: 50, date: '2025-02-01' },
];

export default function BoingPoints() {
  const { account } = useWalletConnection();
  const totalPoints = account ? 1250 : 0;

  return (
    <>
      <Helmet>
        <title>Boing Points | boing.finance</title>
        <meta name="description" content="Earn Boing points for using boing.finance. Redeem for rewards." />
      </Helmet>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <PageHeader title="Boing Points" subtitle="Earn points for every action on boing.finance. Swap, bridge, add liquidity, and more." />

        {account ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <PageCard>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Your Points</p>
                <p className="text-4xl font-bold text-cyan-400">{totalPoints.toLocaleString()}</p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>Points are earned automatically when you use the protocol.</p>
              </PageCard>
              <PageCard>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>Earning Rates</p>
                <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                  <li>• Swap: 10 pts</li>
                  <li>• Add liquidity: 25 pts</li>
                  <li>• Bridge: 15 pts</li>
                  <li>• Deploy token: 50 pts</li>
                  <li>• Vote on proposal: 20 pts</li>
                </ul>
              </PageCard>
            </div>

            <PageCard className="mb-6">
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
              <div className="space-y-3">
                {MOCK_ACTIVITIES.map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: 'var(--border-color)' }}>
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{a.action}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{a.date}</p>
                    </div>
                    <span className="text-green-400 font-medium">+{a.points} pts</span>
                  </div>
                ))}
              </div>
            </PageCard>

            <PageCard>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Redeem Points</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Point redemption for BOING tokens, NFT discounts, and exclusive perks will be available soon.</p>
              <div className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-400/30">Coming Soon</div>
            </PageCard>
          </>
        ) : (
          <PageCard className="text-center py-12">
            <div className="text-5xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Connect Wallet to View Points</h3>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>Connect your wallet to see your Boing points balance and earning history.</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Start trading, bridging, and deploying to earn points!</p>
          </PageCard>
        )}
      </div>
    </>
  );
}

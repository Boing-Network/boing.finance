import React from 'react';

const BoingSection = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>BOING Ecosystem</h2>
        <p className="text-lg leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
          The BOING ecosystem encompasses rewards, community activities, and engagement features. 
          Stake NFTs, earn points, participate in community events, and explore the roadmap for upcoming initiatives.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>🎴 NFT Staking</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Stake your Boing NFTs to earn rewards. Lock your NFTs for a period to receive token incentives 
              and exclusive benefits. Staking helps secure the ecosystem while rewarding holders.
            </p>
            <a href="/boing/staking" className="text-cyan-400 hover:text-cyan-300 mt-2 inline-block">Stake NFTs →</a>
          </div>
          
          <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>⭐ Points & Rewards</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Earn Boing points by trading, providing liquidity, and participating in platform activities. 
              Points can be used for future rewards, exclusive access, and community recognition.
            </p>
            <a href="/boing/points" className="text-cyan-400 hover:text-cyan-300 mt-2 inline-block">View Points →</a>
          </div>
          
          <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>🚀 Roadmap</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Explore the Boing community roadmap. See planned features, milestones, and initiatives 
              that will shape the future of the platform and ecosystem.
            </p>
            <a href="/boing/roadmap" className="text-cyan-400 hover:text-cyan-300 mt-2 inline-block">View Roadmap →</a>
          </div>
          
          <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>🎯 Activities</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Participate in community activities and events. From trading competitions to community 
              challenges, there are many ways to engage and earn rewards.
            </p>
            <a href="/boing/activities" className="text-cyan-400 hover:text-cyan-300 mt-2 inline-block">View Activities →</a>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Why Participate?</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="text-3xl mb-2">🎁</div>
            <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Earn Rewards</h4>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Stake NFTs, complete activities, and earn points and token rewards
            </p>
          </div>
          <div className="text-center p-4 rounded-lg border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="text-3xl mb-2">👥</div>
            <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Community</h4>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Join an active community of DeFi users and contribute to the ecosystem
            </p>
          </div>
          <div className="text-center p-4 rounded-lg border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="text-3xl mb-2">🌟</div>
            <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Exclusive Benefits</h4>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Get access to exclusive features, early releases, and special events
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoingSection;

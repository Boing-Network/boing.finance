import React from 'react';

const GovernanceSection = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Governance</h2>
        <p className="text-lg leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
          boing.finance is a community-driven platform. Token holders can participate in governance by viewing proposals, 
          voting on protocol changes, and shaping the future of the platform. The governance module provides transparency 
          and ensures that key decisions are made collectively.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>📜 Proposals</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              View all active and past governance proposals. Each proposal includes a description, voting options, 
              current tally, and deadline. Filter by status (active, passed, defeated) to find relevant proposals.
            </p>
            <a href="/governance/proposals" className="text-cyan-400 hover:text-cyan-300 mt-2 inline-block">View Proposals →</a>
          </div>
          
          <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>🗳️ Vote</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Cast your vote on proposals using your connected wallet. Voting power is typically proportional to 
              your token holdings. Connect your wallet and navigate to the Vote page to participate.
            </p>
            <a href="/governance/vote" className="text-cyan-400 hover:text-cyan-300 mt-2 inline-block">Vote Now →</a>
          </div>
          
          <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>🏦 Treasury</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Monitor the DAO treasury and protocol reserves. The Treasury page shows total holdings, 
              allocation, and historical changes. Funds are managed through governance proposals.
            </p>
            <a href="/governance/treasury" className="text-cyan-400 hover:text-cyan-300 mt-2 inline-block">View Treasury →</a>
          </div>
          
          <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>🗺️ Roadmap & Community</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Explore the governance roadmap and community resources. Connect with other members via forums 
              and social channels. Learn how governance works with our educational guides.
            </p>
            <a href="/governance/roadmap" className="text-cyan-400 hover:text-cyan-300 mt-2 inline-block">View Roadmap →</a>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>How Governance Works</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">1</div>
            <div>
              <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Connect Your Wallet</h4>
              <p style={{ color: 'var(--text-secondary)' }}>
                Connect a wallet that holds governance tokens to participate in voting.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">2</div>
            <div>
              <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Browse Proposals</h4>
              <p style={{ color: 'var(--text-secondary)' }}>
                Navigate to the Proposals page to see active and historical governance proposals.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">3</div>
            <div>
              <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Cast Your Vote</h4>
              <p style={{ color: 'var(--text-secondary)' }}>
                Select a proposal and cast your vote. Your voting power depends on your token balance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovernanceSection;

/** Shared app navigation — used by App shell and Home page. */
// Helper for coming soon
const comingSoon = {
  label: 'Coming Soon',
  tooltip: 'This feature is currently under development and will be available soon.'
};

// Navigation data with categories - explicit boolean flags for state management
// Trade & Deploy = merged Trading + Deployment for single-row navbar
// `icon` values are NavIcon keys (SVG), not emoji.
const createNavigation = () => {
  const trading = Object.freeze([
    Object.freeze({ name: 'Swap', href: '/swap', icon: 'swap', description: 'Trade tokens instantly', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Bridge', href: '/bridge', icon: 'bridge', description: 'LI.FI aggregator transfers (0.5% fee)', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Pools', href: '/pools', icon: 'pools', description: 'Liquidity pools', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Tokens', href: '/tokens', icon: 'tokens', description: 'Token management', isAvailable: true, comingSoon: false, testnetOnly: false })
  ]);
  const deployment = Object.freeze([
    Object.freeze({ name: 'Project pack', href: '/project-pack', icon: 'project-pack', description: 'Collection + token + companions', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Deploy Token', href: '/deploy-token', icon: 'deploy-token', description: 'Create your own tokens', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Create NFT', href: '/create-nft', icon: 'create-nft', description: 'Mint NFTs', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Manage links', href: '/linked-project', icon: 'manage-links', description: 'Link or unlink companions', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Create Pool', href: '/create-pool', icon: 'create-pool', description: 'Create liquidity pools', isAvailable: true, comingSoon: false, testnetOnly: false })
  ]);
  return Object.freeze({
  trading,
  deployment,
  tradeAndDeploy: Object.freeze([...trading, ...deployment]),
  analytics: Object.freeze([
    Object.freeze({ name: 'Intelligence', href: '/analytics?section=intelligence', icon: 'intelligence', description: 'Onchain research & actionable briefs', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Portfolio', href: '/portfolio', icon: 'portfolio', description: 'Exposure & allocation research', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Wallet Flow', href: '/activity', icon: 'wallet-flow', description: 'Behavioral patterns & trading PnL', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Watchlist', href: '/watchlist', icon: 'watchlist', description: 'Narrative & early ecosystem tracking', isAvailable: true, comingSoon: false, testnetOnly: false })
  ]),
  governance: Object.freeze([
    Object.freeze({ name: 'Proposals', href: '/governance/proposals', icon: 'proposals', description: 'View and vote on proposals', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Vote', href: '/governance/vote', icon: 'vote', description: 'Participate in governance', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Treasury', href: '/governance/treasury', icon: 'treasury', description: 'DAO treasury overview', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Roadmap', href: '/governance/roadmap', icon: 'roadmap', description: 'Governance roadmap', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Community', href: '/governance/community', icon: 'community', description: 'Forum & social links', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'How it works', href: '/governance/learn', icon: 'learn', description: 'Governance guide', isAvailable: true, comingSoon: false, testnetOnly: false })
  ]),
  boing: Object.freeze([
    Object.freeze({ name: 'NFT Staking', href: '/boing/staking', icon: 'staking', description: 'Stake Boing NFTs for rewards', isAvailable: false, comingSoon: true, testnetOnly: false }),
    Object.freeze({ name: 'Points', href: '/boing/points', icon: 'points', description: 'Boing points & rewards', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Roadmap', href: '/boing/roadmap', icon: 'roadmap', description: 'Boing community roadmap', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Activities', href: '/boing/activities', icon: 'activities', description: 'Community activities & events', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Native VM (RPC)', href: '/boing/native-vm', icon: 'native-vm', description: 'Boing JSON-RPC: account, QA, simulate & submit', isAvailable: true, comingSoon: false, testnetOnly: false })
  ])
  });
};

// Create navigation once and store in module scope to prevent recreation
const navigation = createNavigation();

export { comingSoon, navigation };

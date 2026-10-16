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
    Object.freeze({ name: 'Swap', href: '/swap', icon: 'swap', description: 'Trade tokens', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Bridge', href: '/bridge', icon: 'bridge', description: 'Move tokens between networks', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Pools', href: '/pools', icon: 'pools', description: 'Browse pools', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Tokens', href: '/tokens', icon: 'tokens', description: 'Browse tokens', isAvailable: true, comingSoon: false, testnetOnly: false })
  ]);
  const deployment = Object.freeze([
    Object.freeze({ name: 'Project pack', href: '/project-pack', icon: 'project-pack', description: 'NFT + token together', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Deploy Token', href: '/deploy-token', icon: 'deploy-token', description: 'Create a token', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Create NFT', href: '/create-nft', icon: 'create-nft', description: 'Create a collection', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Manage links', href: '/linked-project', icon: 'manage-links', description: 'Link collection & token', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Create Pool', href: '/create-pool', icon: 'create-pool', description: 'Start a pool', isAvailable: true, comingSoon: false, testnetOnly: false })
  ]);
  return Object.freeze({
  trading,
  deployment,
  tradeAndDeploy: Object.freeze([...trading, ...deployment]),
  analytics: Object.freeze([
    Object.freeze({ name: 'Analytics', href: '/analytics', icon: 'intelligence', description: 'Volume, trends, activity', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Portfolio', href: '/portfolio', icon: 'portfolio', description: 'Balances and NFTs', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Activity', href: '/activity', icon: 'wallet-flow', description: 'Swap and pool history', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Watchlist', href: '/watchlist', icon: 'watchlist', description: 'Tokens you follow', isAvailable: true, comingSoon: false, testnetOnly: false })
  ]),
  governance: Object.freeze([
    Object.freeze({ name: 'Proposals', href: '/governance/proposals', icon: 'proposals', description: 'Community proposals', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Vote', href: '/governance/vote', icon: 'vote', description: 'Create a proposal', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Treasury', href: '/governance/treasury', icon: 'treasury', description: 'Treasury balances', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Roadmap', href: '/governance/roadmap', icon: 'roadmap', description: 'Path to on-chain voting', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Community', href: '/governance/community', icon: 'community', description: 'Forum and socials', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'How it works', href: '/governance/learn', icon: 'learn', description: 'Today vs planned', isAvailable: true, comingSoon: false, testnetOnly: false })
  ]),
  boing: Object.freeze([
    Object.freeze({ name: 'NFT Staking', href: '/boing/staking', icon: 'staking', description: 'Coming soon', isAvailable: false, comingSoon: true, testnetOnly: false }),
    Object.freeze({ name: 'Points', href: '/boing/points', icon: 'points', description: 'Earn from activity', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Roadmap', href: '/boing/roadmap', icon: 'roadmap', description: 'Illustrative roadmap', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Activities', href: '/boing/activities', icon: 'activities', description: 'Campaigns and events', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Developer tools', href: '/boing/native-vm', icon: 'native-vm', description: 'Builder tools', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Publish interface', href: '/boing/publish-interface', icon: 'native-vm', description: 'Name your contract functions', isAvailable: true, comingSoon: false, testnetOnly: false })
  ])
  });
};

// Create navigation once and store in module scope to prevent recreation
const navigation = createNavigation();

export { comingSoon, navigation };

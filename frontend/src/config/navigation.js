/** Shared app navigation — used by App shell and Home page. */
const comingSoon = {
  label: 'Coming Soon',
  tooltip: 'This feature is currently under development and will be available soon.'
};

// boing.finance is the DEX for Boing Network: swap, pools, liquidity, portfolio and the cross-chain bridge.
// `icon` values are NavIcon keys (SVG), not emoji.
const createNavigation = () => {
  const trading = Object.freeze([
    Object.freeze({ name: 'Swap', href: '/swap', icon: 'swap', description: 'Trade tokens on Boing', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Pools', href: '/pools', icon: 'pools', description: 'Browse Boing pools', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Liquidity', href: '/liquidity', icon: 'create-pool', description: 'Add or remove liquidity', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Create Pool', href: '/create-pool', icon: 'create-pool', description: 'Start a Boing pool', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Portfolio', href: '/portfolio', icon: 'portfolio', description: 'Your Boing balances and positions', isAvailable: true, comingSoon: false, testnetOnly: false }),
    Object.freeze({ name: 'Bridge', href: '/bridge', icon: 'bridge', description: 'Move tokens between chains', isAvailable: true, comingSoon: false, testnetOnly: false })
  ]);
  return Object.freeze({ trading });
};

const navigation = createNavigation();

export { comingSoon, navigation };

// Base MiniApp configuration following Base documentation
// https://docs.base.org/mini-apps/quickstart/create-new-miniapp#minikit-quickstart

const ROOT_URL = process.env.REACT_APP_FRONTEND_URL || 'https://e02b33cd.boing-finance.pages.dev';

export const minikitConfig = {
  accountAssociation: {
    // This will be added after domain verification
    "header": "",
    "payload": "",
    "signature": ""
  },
  miniapp: {
    version: "1",
    name: "Boing Finance", 
    subtitle: "Cross-Chain DeFi Platform", 
    description: "Deploy tokens, create liquidity pools, and trade across multiple blockchains with Boing Finance - the most user-friendly decentralized exchange for token deployment and cross-chain trading.",
    screenshotUrls: [
      `${ROOT_URL}/screenshot-portrait.png`,
      `${ROOT_URL}/screenshot-landscape.png`
    ],
    iconUrl: `${ROOT_URL}/logo.svg`,
    splashImageUrl: `${ROOT_URL}/og-image.svg`,
    splashBackgroundColor: "#0a0a0a",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "finance",
    tags: ["defi", "dex", "trading", "tokens", "cross-chain", "liquidity", "swap", "bridge"],
    heroImageUrl: `${ROOT_URL}/og-image.svg`, 
    tagline: "The ultimate multi-network DeFi platform",
    ogTitle: "Boing Finance - Cross-Chain DeFi Platform",
    ogDescription: "Deploy tokens, create liquidity pools, and trade across multiple blockchains with Boing Finance.",
    ogImageUrl: `${ROOT_URL}/og-image.svg`,
  },
} as const;

export default minikitConfig;

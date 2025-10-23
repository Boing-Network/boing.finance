// Base MiniApp configuration following Base documentation
// https://docs.base.org/mini-apps/quickstart/create-new-miniapp#minikit-quickstart

const ROOT_URL = process.env.REACT_APP_FRONTEND_URL || 'https://0ce87f2c.boing-finance.pages.dev';

export const minikitConfig = {
  accountAssociation: { // this will be added in step 5
    "header": "",
    "payload": "",
    "signature": ""
  },
  miniapp: {
    version: "1",
    name: "Boing Finance", 
    subtitle: "Cross-Chain DeFi Platform", 
    description: "Deploy tokens, create liquidity pools, and trade across multiple blockchains with Boing Finance - the most user-friendly decentralized exchange for token deployment and cross-chain trading.",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
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
    noindex: false,
    baseBuilder: {
      ownerAddress: "0xEa9C8A5c669725A19e1890001d7c553771EE6cFc"
    }
  },
} as const;

export default minikitConfig;

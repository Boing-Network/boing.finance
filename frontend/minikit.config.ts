// Base MiniApp configuration following Base documentation
// https://docs.base.org/mini-apps/quickstart/create-new-miniapp#minikit-quickstart

const ROOT_URL = process.env.REACT_APP_FRONTEND_URL || 'https://0ce87f2c.boing-finance.pages.dev';

export const minikitConfig = {
  accountAssociation: {
    "header": "eyJmaWQiOjEzOTc5MzcsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg1RTQ2MEQ2OWNjMThiYjBjOEU3MGVkNzVBM2E5QTk2QjdDZTRBMzcyIn0",
    "payload": "eyJkb21haW4iOiJib2luZy5maW5hbmNlIn0",
    "signature": "buQTkbWCkIjwXglpFMrM40rjUrVfEbfe00/rzyno2YMl8Xf7cLyZKfBZd9HAxaIzIaji7+M7/sIC2j7C2HtHIRw="
  },
  miniapp: {
    version: "1",
    name: "Boing Finance", 
    subtitle: "Deploy tokens, create pools, and trade across chains", 
    description: "The most user-friendly decentralized exchange for token deployment and cross-chain trading. Deploy tokens, create liquidity pools, and trade across multiple blockchains with ease.",
    iconUrl: `${ROOT_URL}/icon.png`,
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    imageUrl: `${ROOT_URL}/image.png`,
    heroImageUrl: `https://boing.finance/hero.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#6200EA",
    tags: ["defi", "dex", "trading", "tokens", "cross-chain", "liquidity", "swap", "bridge", "ethereum", "base"],
    tagline: "Deploy, Trade, and Build the Future of DeFi",
    buttonTitle: "Open Boing Finance",
    ogTitle: "Boing Finance - Cross-Chain DeFi Platform",
    ogDescription: "Deploy tokens, create liquidity pools, and trade across multiple blockchains with the most user-friendly DeFi platform.",
    ogImageUrl: `${ROOT_URL}/og-image.svg`,
    castShareUrl: `https://warpcast.com/~/compose?text=Check+out+Boing+Finance+-+the+ultimate+cross-chain+DeFi+platform!+Deploy+tokens%2C+create+pools%2C+and+trade+across+chains+with+ease.`,
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "finance",
    noindex: false,
    baseBuilder: {
      ownerAddress: "0xEa9C8A5c669725A19e1890001d7c553771EE6cFc"
    }
  },
} as const;

export default minikitConfig;

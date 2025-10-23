// Base MiniApp configuration following Base documentation
// https://docs.base.org/mini-apps/quickstart/create-new-miniapp#minikit-quickstart

const ROOT_URL = process.env.REACT_APP_FRONTEND_URL || 'https://boing.finance';

export const minikitConfig = {
  miniapp: {
    version: "1",
    name: "boing.finance",
    iconUrl: "https://boing.finance/icon.png",
    homeUrl: "https://boing.finance",
    splashImageUrl: "https://boing.finance/splash.png",
    splashBackgroundColor: "#0f172a",
    heroImageUrl: "https://boing.finance/hero.png",
    tagline: "Cross-Chain DeFi Made Easy",
    primaryCategory: "finance",
    tags: [
      "defi",
      "dex",
      "tokens",
      "swap",
      "liquidity"
    ]
  }
} as const;

export default minikitConfig;

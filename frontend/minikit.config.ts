// Base MiniApp configuration following Base documentation
// https://docs.base.org/mini-apps/quickstart/create-new-miniapp#minikit-quickstart

const ROOT_URL = process.env.REACT_APP_FRONTEND_URL || 'https://boing.finance';

export const minikitConfig = {
  accountAssociation: {
    header: "eyJmaWQiOjEzOTc5MzcsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg1RTQ2MEQ2OWNjMThiYjBjOEU3MGVkNzVBM2E5QTk2QjdDZTRBMzcyIn0",
    payload: "eyJkb21haW4iOiJib2luZy5maW5hbmNlIn0",
    signature: "buQTkbWCkIjwXglpFMrM40rjUrVfEbfe00/rzyno2YMl8Xf7cLyZKfBZd9HAxaIzIaji7+M7/sIC2j7C2HtHIRw="
  },
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

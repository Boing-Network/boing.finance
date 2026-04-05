# Product Roadmap & Ideas

Merged from Improvement Plan, UX & NFT Brainstorm, and Boing NFT Roadmap.

---

## 1. Quick Wins & Bug Fixes (Done)

- GlobalSearch token lookup fix
- Predictive analytics surfaced (price insights, TokenDetailsModal)
- GlobalSearch route status updated (all pages live)
- AI DeFi Assistant, AI risk summary in Security Scanner, Price Alerts, AI Help Center
- Historical volume (CoinGecko/DefiLlama) in Analytics, performance tuning

---

## 2. UX Ideas

### Analytics

- Time-range-specific metrics, comparison view, saved views, sparklines on cards
- AI market summary, CSV export, tooltips, dark/light chart themes

### Portfolio

- PnL over time, group by network, hide zero balances
- Cost basis / tax view, goals, share read-only link, notifications

### App-Wide

- Onboarding checklist, global “Recent”, keyboard shortcuts
- Network-specific defaults, unified transaction history, better error messages
- Mobile bottom nav, status/maintenance banner

---

## 3. NFT Integration (Utility-Focused)

### Boing NFT Collection (Phased)

- **Phase 1:** ERC-721/721A contract per chain, minting (gas only), metadata on R2
- **Phase 2:** Claim page, eligibility (e.g. first swap/liquidity), R2 metadata/images
- **Phase 3:** Holder verification (`balanceOf`), benefits: swap fee discount, Pro analytics, badge, AI features
- **Phase 4 (optional):** Early access, referral bonus for holders
- **Phase 5 (optional):** Governance / voting

### Holder Benefits (Proposed)

- Discounted swap fees, Pro analytics view, priority support badge
- Exclusive AI features, early access, governance/voting, referral boost

### Technical Hooks

- TokenFactory/R2/multi-chain config/Alchemy NFT API/WalletContext already in place

---

## 4. AI Integration

- **DeFi Assistant:** Natural-language help for swaps, liquidity, risks (Workers AI + optional OpenAI)
- **Token analysis:** Plain-English risk summaries in Security Scanner / TokenDetailsModal
- **Help Center chatbot:** RAG over help content
- **Market insights:** AI summary on Analytics (sentiment, top movers)

---

## 5. Feature Enhancements (Non-AI)

- Analytics: predictive cards, real historical data, CSV export for tables
- Security Scanner: Etherscan verification, Token Sniffer, AI risk summary
- Swap: route optimization, simulation, gas (EIP-1559)
- Global Search: CoinGecko search, recent searches, fuzzy search
- Portfolio: PnL charts, price alerts, tax export

---

## 6. Performance

- Frontend: code splitting, image optimization, React Query staleTime, memoization
- Backend: KV caching, rate limiting, compression

---

*Last updated: 2025-02*
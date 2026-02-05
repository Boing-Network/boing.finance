# Boing.finance NFT Collection – Roadmap

A phased plan for launching an official Boing NFT collection across mainnets with holder benefits.

---

## Overview

The Boing NFT collection will serve as a **loyalty and utility layer** for boing.finance users. Holders receive benefits that enhance their experience on the platform.

### Supported Networks (Target)

| Chain ID | Network   | Priority |
|----------|-----------|----------|
| 1        | Ethereum  | High     |
| 137      | Polygon   | High     |
| 42161    | Arbitrum  | Medium   |
| 10       | Optimism  | Medium   |
| 8453     | Base      | Medium   |

---

## Holder Benefits (Proposed)

| Benefit                     | Complexity | Impact  | Phase  |
|----------------------------|------------|---------|--------|
| **Discounted swap fees**   | Medium     | High    | Phase 3 |
| **Pro analytics view**     | Low        | Medium  | Phase 3 |
| **Priority support badge** | Low        | Low     | Phase 3 |
| **Exclusive AI features**  | Low        | Medium  | Phase 3 |
| **Early access** to features | Medium   | Medium  | Phase 4 |
| **Governance / voting**    | High       | High    | Phase 5 |
| **Referral bonus boost**   | Medium     | Medium  | Phase 4 |

---

## Implementation Phases

### Phase 1 – Smart Contract (1–2 weeks)

- [ ] Deploy ERC-721 or ERC-721A contract per chain
- [ ] Or: Single ERC-1155 with multiple token IDs (tiers)
- [ ] Minting: Free claim or low-cost (e.g. gas only)
- [ ] Metadata standard: IPFS or Cloudflare R2
- [ ] Contract addresses and ABIs documented in `contracts/`

**Deliverables:**
- Boing NFT contract(s)
- Deployment scripts
- `DEPLOYMENT_REGISTRY.md` updated

---

### Phase 2 – Mint / Claim Flow (1 week)

- [ ] "Claim Boing NFT" page under Deployment or new nav item
- [ ] Eligibility: First swap, first liquidity add, or simple connect + claim
- [ ] Metadata & images stored in R2 (replacing IPFS where preferred)
- [ ] Claim button triggers mint transaction

**Deliverables:**
- Claim page UI
- Integration with NFT contract
- R2-backed metadata and images

---

### Phase 3 – Holder Verification & Benefits (1–2 weeks)

- [ ] Backend or frontend: Check `balanceOf(wallet, tokenId) > 0`
- [ ] Use Alchemy NFT API or direct contract call
- [ ] Gate benefits when holder detected:
  - Swap fee discount (router/backend logic)
  - Pro analytics toggle
  - Badge in UI
  - Enhanced AI features

**Deliverables:**
- `isBoingHolder(address, chainId)` utility
- Benefit gating in Swap, Analytics, AI
- Holder badge component

---

### Phase 4 – Growth & Engagement (Optional)

- [ ] Early access to new pools/features
- [ ] Referral bonus multiplier for holders
- [ ] Marketing campaigns around drops

---

### Phase 5 – Governance (Optional, Future)

- [ ] Boing Governance NFT for voting
- [ ] Snapshot or on-chain voting integration
- [ ] Protocol parameter proposals

---

## Technical Hooks (Already Available)

- **TokenFactory, Deploy Token flow** – Similar UX for deployment
- **R2 storage** – Metadata and images (`ipfsRoutes.js`, `r2UploadService.js`)
- **Multi-chain config** – `NETWORKS`, chain switching
- **Alchemy NFT API** – `getNFTsForOwner`, holder checks
- **WalletContext** – `account`, `chainId` for verification

---

## Contract Considerations

### ERC-721 vs ERC-721A vs ERC-1155

| Standard   | Pros                              | Cons                    |
|------------|-----------------------------------|-------------------------|
| ERC-721    | Simple, widely supported          | Higher gas per mint     |
| ERC-721A   | Batch minting, gas efficient      | Less common             |
| ERC-1155   | Multi-token in one contract       | More complex logic      |

**Recommendation:** Start with ERC-721 or ERC-721A per chain for simplicity.

### Metadata Schema (R2)

```json
{
  "name": "Boing NFT #1",
  "description": "Official Boing.finance holder NFT",
  "image": "https://.../boing-nft-1.png",
  "attributes": [
    { "trait_type": "Tier", "value": "Standard" },
    { "trait_type": "Chain", "value": "Ethereum" }
  ]
}
```

---

## Dependencies

- Cloudflare R2 for images and metadata
- Alchemy (or equivalent) for holder verification
- Deployed NFT contract(s) per chain
- Frontend: claim page, holder badge, benefit gating

---

## Next Steps

1. Finalize contract standard and deployment plan
2. Design NFT artwork and metadata
3. Implement Phase 1 (contract + deploy)
4. Implement Phase 2 (claim flow)
5. Implement Phase 3 (verification + benefits)

---

*Last updated: 2025-02*

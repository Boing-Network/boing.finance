# Solana Integration Plan

This document outlines the plan for integrating Solana into Boing.Finance. Solana is a non-EVM blockchain with a different architecture, programming model, and tooling. Integration requires a separate stack alongside the existing EVM implementation.

---

## Why Solana First?

- **~17M+ active addresses** (7-day) — second only to BNB Chain in user activity
- **~$6.5–7B TVL** — strong DeFi ecosystem
- **Sub-cent fees** — attractive for retail and high-frequency users
- **Growing adoption** — memecoins, NFTs, DeFi, and real-world use cases

---

## Technical Overview: Solana vs EVM

| Aspect | EVM (Ethereum, L2s) | Solana |
|--------|---------------------|--------|
| **Language** | Solidity | Rust (native) or C |
| **Account Model** | Contract storage | Account-based, PDA (Program Derived Addresses) |
| **Transactions** | Sequential, single chain | Parallel, optimistic concurrency |
| **Token Standard** | ERC-20 | SPL Token |
| **Wallet** | MetaMask, WalletConnect | Phantom, Solflare, Backpack |
| **SDK** | ethers.js, viem | @solana/web3.js, @solana/spl-token |
| **Program Deployment** | Deploy contract bytecode | Deploy BPF program, rent-exempt |

---

## Integration Approaches

### Option A: Native Solana (Recommended for Token Deployment)

- **Stack:** @solana/web3.js + @solana/spl-token
- **Token creation:** SPL Token Program (`createMint`, `createAccount`, `mintTo`)
- **Pros:** Lowest fees, native UX, no program deployment for basic tokens
- **Cons:** Separate codebase, different UX patterns

### Option B: Neon EVM (EVM on Solana)

- **Stack:** Deploy existing Solidity contracts via Neon EVM
- **Pros:** Reuse TokenFactory, DEX contracts
- **Cons:** Higher fees than native, smaller ecosystem, extra bridge step for users

### Option C: Hybrid

- **Token creation:** Native SPL (Option A)
- **DEX/AMM:** Integrate with existing Solana DEXs (Jupiter, Raydium, Orca) via APIs
- **Pros:** Best UX, leverage established liquidity
- **Cons:** No proprietary DEX initially

**Recommendation:** Start with **Option A (Native SPL)** for the Deploy Token feature, and **Option C (Hybrid)** for swap/pools by integrating Jupiter or Raydium APIs.

---

## Scope: Solana Integration Phases

### Phase 1: Foundation (Weeks 1–2)

1. **Solana wallet connection**
   - Phantom, Solflare, Backpack via `@solana/wallet-adapter-react`
   - Chain selector: EVM vs Solana
   - Persist Solana wallet state separately from EVM

2. **Solana config**
   - Mainnet + Devnet RPC endpoints
   - Explorer URLs (Solscan, Solana FM)
   - Native token: SOL

3. **Multi-chain wallet context**
   - Extend `WalletContext` or create `SolanaWalletContext`
   - Detect chain type (EVM vs Solana) and route accordingly

### Phase 2: Token Deployment (Weeks 2–4)

1. **SPL token creation**
   - Use `@solana/spl-token` `createMint`, `createAccount`, `mintTo`
   - UI: Name, symbol, decimals, supply, metadata (logo, website, etc.)
   - Metadata: Metaplex Token Metadata standard (optional but recommended)

2. **Cost structure**
   - Rent-exempt: ~0.002 SOL for mint + token account
   - No program deployment for standard SPL tokens
   - Service fee: configurable (e.g., 0.1 SOL or USD equivalent)

3. **Deploy Token page**
   - Chain selector: EVM networks vs Solana
   - When Solana selected: show Solana-specific form, use SPL flow

### Phase 3: Swaps & Pools (Weeks 4–6)

1. **Jupiter / Raydium integration**
   - Jupiter API for swaps (best execution)
   - Or Raydium/Orca for pool data
   - Swap page: support Solana when Solana wallet connected

2. **Portfolio**
   - Fetch SPL token balances
   - Display SOL + SPL tokens in portfolio

### Phase 4: Bridge & Cross-Chain (Future)

- Bridge SOL/SPL ↔ EVM tokens via Wormhole, LayerZero, or Allbridge
- Out of scope for initial integration

---

## Tech Stack for Solana

| Component | Library / Tool |
|-----------|----------------|
| Connection | @solana/web3.js |
| SPL Tokens | @solana/spl-token |
| Wallet UI | @solana/wallet-adapter-react, @solana/wallet-adapter-wallets |
| Swaps | Jupiter API (jup.ag) or Raydium SDK |
| Metadata | @metaplex-foundation/mpl-token-metadata (optional) |

### Dependencies to Add

```json
{
  "@solana/web3.js": "^1.87.0",
  "@solana/spl-token": "^0.3.9",
  "@solana/wallet-adapter-base": "^0.9.23",
  "@solana/wallet-adapter-react": "^0.15.35",
  "@solana/wallet-adapter-react-ui": "^0.9.35",
  "@solana/wallet-adapter-wallets": "^0.19.32"
}
```

---

## File Structure (Proposed)

```
frontend/src/
├── config/
│   ├── contracts.js        # EVM contracts
│   ├── solanaConfig.js     # Solana RPC, programs
│   └── networks.js         # EVM networks (unchanged)
├── contexts/
│   ├── WalletContext.js    # EVM (existing)
│   └── SolanaWalletContext.js  # NEW: Solana wallet state
├── hooks/
│   ├── useWallet.js        # EVM (existing)
│   └── useSolanaWallet.js  # NEW
├── services/
│   ├── tokenFactoryService.js   # EVM (existing)
│   └── solanaTokenService.js    # NEW: SPL token creation
├── pages/
│   └── DeployToken.js      # Extend: chain selector, Solana flow
└── components/
    └── SolanaWalletProvider.js  # NEW: wraps Solana wallet adapter
```

---

## Solana-Specific Considerations

### Rent-Exempt Minimums

- Mint account: ~0.00144 SOL
- Token account: ~0.00204 SOL
- Metadata (Metaplex): additional ~0.01 SOL

### No Smart Contract for Token Creation

- SPL tokens are created via the Token Program; no custom program needed for basic tokens
- "Token factory" on Solana = frontend + backend (optional) that orchestrates SPL token creation

### Metadata

- For logos, name, symbol: use Metaplex Token Metadata or store off-chain (IPFS) and reference in creation flow

---

## Success Criteria

- [ ] User can connect Phantom/Solflare and see Solana balance
- [ ] User can deploy an SPL token (name, symbol, supply) on Solana mainnet/devnet
- [ ] Deploy Token page supports chain selector: EVM networks | Solana
- [ ] Token creation completes with sub-dollar fees on Solana
- [ ] Portfolio shows Solana tokens when Solana wallet connected

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Solana network instability | Use multiple RPCs, retry logic |
| Wallet fragmentation | Support top 3: Phantom, Solflare, Backpack |
| SPL vs ERC-20 differences | Clear UI copy, tooltips |
| Fee volatility (SOL price) | Quote fees in SOL at tx time |

---

## Next Steps

1. Install Solana dependencies in frontend
2. Implement `SolanaWalletContext` + `SolanaWalletProvider`
3. Add Solana option to chain selector / Deploy Token page
4. Implement `solanaTokenService.js` for SPL token creation
5. Test on Devnet, then Mainnet

---

*Last updated: February 2025*

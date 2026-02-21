# Solana Integration & Security

Solana is integrated as a non-EVM stack alongside EVM networks. This document covers the integration plan and security practices. See [integration.md](integration.md) for prioritization and roadmap.

---

## Why Solana first?

- **~17M+ active addresses** (7-day) — high user activity
- **~$6.5–7B TVL** — strong DeFi ecosystem
- **Sub-cent fees** — attractive for retail
- **Growing adoption** — memecoins, NFTs, DeFi

---

## Technical overview: Solana vs EVM

| Aspect | EVM | Solana |
|--------|-----|--------|
| Language | Solidity | Rust (native) |
| Account model | Contract storage | Account-based, PDA |
| Token standard | ERC-20 | SPL Token |
| Wallet | MetaMask, WalletConnect | Phantom, Solflare, Backpack |
| SDK | ethers.js, viem | @solana/web3.js, @solana/spl-token |

---

## Integration approach

- **Token creation:** Native SPL via @solana/spl-token (createMint, createAccount, mintTo). No custom program for basic tokens.
- **Swap / Pools:** Jupiter and Raydium links (hybrid; no proprietary DEX initially).
- **Stack:** @solana/web3.js, @solana/spl-token, @solana/wallet-adapter-react.

---

## Scope (phases)

### Phase 1: Foundation
- Solana wallet connection (Phantom, Solflare, Backpack) via wallet-adapter
- Solana config: Mainnet + Devnet RPC, explorer URLs
- Multi-chain: SolanaWalletContext, chain type (EVM vs Solana)

### Phase 2: Token deployment
- SPL token creation with Metaplex Token Metadata
- Deploy Token page: chain selector EVM | Solana, Solana-specific form
- Cost: rent-exempt (~0.002 SOL mint + ATA), service fee configurable

### Phase 3: Swap & portfolio
- Jupiter / Raydium for swaps and pool links
- Portfolio: SOL + SPL token balances (getParsedTokenAccountsByOwner)

### Phase 4: Bridge (future)
- SOL/SPL ↔ EVM via Wormhole, LayerZero, or Allbridge — out of scope for initial integration

---

## Security & industry standards

### Token & NFT creation

- **Input validation:** Name max 32 chars; symbol max 10; decimals 0–9 (9 standard for Solana); initial supply bounded; image max 10MB, image MIME only.
- **Transaction security:** Simulate with `connection.simulateTransaction()` before send. No private keys in frontend; user wallet signs all txs.
- **Metaplex:** SPL tokens include Metaplex Token Metadata (CreateMetadataAccountV3). NFTs: metadata + immutable mint (mint authority revoked). Metadata and images on Cloudflare R2 (public HTTPS).
- **Fee transparency:** Cost estimates in UI (rent + tx fee); user approves exact tx in wallet.

### Wallet & network

- **Providers:** window.solana (Phantom, Solflare, Backpack). Account change and disconnect handled.
- **Mainnet/Devnet:** User-controlled in UI, persisted in localStorage. Default: devnet unless `REACT_APP_SOLANA_NETWORK=mainnet`.

### Backend

- Optional POST to `/api/solana/deployments` after successful mint. D1 table `solana_deployments` stores mint, creator, network, type, name, symbol, metadata URI, signature.
- Run D1 migration `0003_solana_deployments.sql` before deploying backend. R2 configured for metadata/images. Set `REACT_APP_SOLANA_MAINNET_RPC` for production.

---

## Success criteria

- [ ] User can connect Phantom/Solflare and see Solana balance
- [ ] User can deploy SPL token (name, symbol, supply) on mainnet/devnet
- [ ] Deploy Token page: chain selector EVM | Solana
- [ ] Token creation completes with sub-dollar fees
- [ ] Portfolio shows Solana tokens when Solana wallet connected

---

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Network instability | Multiple RPCs, retry logic |
| Wallet fragmentation | Support Phantom, Solflare, Backpack |
| Fee volatility | Quote fees in SOL at tx time |

---

*Last updated: February 2025*

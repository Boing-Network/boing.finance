# Solana integration

Solana is a first-class non-EVM stack beside EVM and Boing L1. Prioritization: [integration.md](./integration.md).

*Last reviewed: August 2026.*

## Why Solana

High activity, large DeFi TVL, sub-cent fees, and a mature aggregator (Jupiter). Metrics change quickly; treat third-party TVL tables as snapshots, not SLAs.

## Stack (this repo)

| Aspect | Implementation |
|--------|----------------|
| RPC / web3 | `@solana/web3.js`, `@solana/spl-token` |
| Metadata | `@metaplex-foundation/mpl-token-metadata` |
| Wallet | Custom **`SolanaWalletContext.jsx`** — **Phantom** and **Solflare** (`window.solana` / `window.solflare`). Not `@solana/wallet-adapter-react`. |
| Swap | In-app **Jupiter** (`SolanaAggregatorSwap.jsx`, backend `/api/aggregator`) |
| Pools | External Raydium (and similar) links — no proprietary Solana AMM in this repo |

## Shipped

- [x] Connect Phantom / Solflare; SOL balance; chain type EVM vs Solana
- [x] Mainnet + Devnet RPC and explorers; network persisted in `localStorage`. Default: devnet unless `REACT_APP_SOLANA_NETWORK=mainnet`
- [x] SPL token deploy on Deploy Token (chain selector EVM | Solana), Metaplex metadata, R2 for images
- [x] Jupiter swaps on Swap when Solana is selected; market board via GeckoTerminal
- [x] Portfolio: SOL + SPL balances (`getParsedTokenAccountsByOwner`)
- [x] Optional `POST /api/solana/deployments` + D1 `solana_deployments` (`backend/drizzle/0003_solana_deployments.sql`)

## Not in initial scope

- SOL/SPL ↔ EVM bridge (Wormhole / LayerZero / Allbridge)
- First-party Solana DEX / pool creation

## Security

- **Input validation:** name ≤ 32 chars; symbol ≤ 10; decimals 0–9; supply bounded; image ≤ 10MB, image MIME only.
- **Transactions:** simulate with `connection.simulateTransaction()` before send. No private keys in the frontend; the wallet signs.
- **Metaplex:** CreateMetadataAccountV3; NFTs revoke mint authority. Metadata/images on Cloudflare R2.
- **Fees:** UI shows rent + tx fee; user approves the exact tx.
- **RPC:** set `REACT_APP_SOLANA_MAINNET_RPC` for production.

## Risks

| Risk | Mitigation |
|------|------------|
| Network instability | Configurable RPC, retries |
| Wallet fragmentation | Phantom + Solflare; prompt if neither is injected |
| Fee volatility | Quote rent/fees in SOL at tx time |

# Solana Security & Industry Standards

This document outlines the security measures and industry standards implemented for Solana integration in Boing.Finance.

## Token & NFT Creation

### Input Validation
- **Name**: Max 32 chars, required
- **Symbol**: Max 10 chars, required
- **Decimals**: 0-9 (9 standard for Solana)
- **Initial supply**: Bounded to prevent overflow
- **Image**: Max 10MB, image MIME types only

### Transaction Security
- **Simulation before send**: All token and NFT creation transactions are simulated with `connection.simulateTransaction()` before sending. If simulation fails, the transaction is not sent.
- **No private keys in frontend**: Keypairs are generated in-memory only for mint accounts; the user's wallet (Phantom/Solflare) signs all transactions. No keys are stored or transmitted.

### Metaplex Standard
- **Token Metadata**: All SPL tokens include Metaplex Token Metadata (CreateMetadataAccountV3) for discoverability on explorers and wallets.
- **NFT Metadata**: SPL NFTs include Metaplex metadata and immutable mint (mint authority revoked after creation) per industry best practice.
- **R2 Storage**: Metadata JSON and images are stored on Cloudflare R2 with public HTTPS URLs. No IPFS dependency for Solana flows.

### Fee Transparency
- Cost estimates displayed in UI (rent for mint, ATA, metadata + tx fee)
- Users approve exact transaction in wallet before signing

## Wallet Integration

- **Standard providers**: Uses `window.solana` (Phantom, Solflare, Backpack compatible)
- **Account change handling**: Listens for `accountChanged` and updates state
- **Disconnect**: Cleans state on disconnect

## Network Toggle

- **Mainnet/Devnet**: User-controlled via UI. Persisted in `localStorage`. Default: devnet unless `REACT_APP_SOLANA_NETWORK=mainnet`.

## Backend

- **Deployment records**: Optional POST to `/api/solana/deployments` after successful mint. Non-blocking; failures are logged but do not affect UX.
- **D1 table**: `solana_deployments` stores mint address, creator, network, type, name, symbol, metadata URI, signature.

## Deployment Readiness

- Run D1 migration `0003_solana_deployments.sql` before deploying backend.
- Ensure R2 bucket is configured for metadata and image uploads.
- Set `REACT_APP_SOLANA_MAINNET_RPC` for production (consider paid RPC for reliability).

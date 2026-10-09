# Linked NFT collection + fungible token

Display-only MVP for pairing NFT collections with project tokens on boing.finance.

## Product rules (2026-10-09)

| Rule | Behavior |
|------|----------|
| Cardinality | **Many-to-many** — one token may link to many collections and vice versa |
| Mutability | Links can be **updated or removed** after create |
| Enforcement | **Display-only** — no on-chain registry tx yet |
| Soft-gate | Prefer same wallet/deployer on both sides; warn but do not block |
| Schema | `boing.linked_nft_token.v1` |

## Surfaces

| Route | Role |
|-------|------|
| `/linked-project` | Hub: paste existing addresses, list/edit all browser-local links |
| `/create-nft` | After native collection deploy (or on Review for EVM), link step |
| `/deploy-token` | After native token deploy (or EVM deploy success), link step |

Query helpers: `?collection=` / `?token=` on `/linked-project`; `?linkToken=` on Create NFT; `?linkCollection=` on Deploy Token.

## Schema

Canonical JSON (also hashed with Blake3 for optional `description_hash` / indexer use):

```json
{
  "schema": "boing.linked_nft_token.v1",
  "collections": ["0x…"],
  "tokens": ["0x…"],
  "linker": "0x…",
  "updated_at": "2026-10-09T00:00:00.000Z"
}
```

Implementation: `frontend/src/utils/linkedNftToken.js`. Prefers `boing-sdk` exports (`normalizeLinkedNftToken`, `descriptionHashHexFromLinkedNftToken`, …) when present; otherwise uses the local encode above.

Browser storage key: `boing.finance.linked_nft_token.v1` (edges). Deployer hints: `boing.finance.asset_deployer_hints.v1`.

## Not in this MVP

- On-chain `register_linked_pair` registry
- Mint gating by companion token balance
- Observer / FreshMint discovery of peers (consumers can adopt the same schema later)

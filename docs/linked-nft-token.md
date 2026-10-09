# Linked NFT collection + fungible token (on-chain)

Enforced many-to-many links on boing.finance via the Boing VM registry (network PR #42).

## Product rules

| Rule | Behavior |
|------|----------|
| Cardinality | **Many-to-many** |
| Mutability | **register_link** / **unlink_at** |
| Auth | **Claimer of both** AccountIds (`claim_asset` first) |
| Soft-gate | Advisory only |
| Metadata schema | `boing.linked_nft_token.v1` — **cache only** |

## Selectors (SDK)

| Op | Sel | Calldata |
|----|-----|----------|
| `claim_asset` | `0xE0` | 64 |
| `register_link` | `0xE1` | 96 |
| `unlink_at` | `0xE2` | 64 |
| `links_count` | `0xE3` | 32 |
| `get_link_at` | `0xE4` | 64 → 64 |
| `get_asset_claimer` | `0xE5` | 64 |
| `transfer_asset_claimer` | `0xE6` | 96 |

CREATE2 salt: `BOING_NFT_TOKEN_LINK_REG_V1`.

## Finance wiring

| Path | Role |
|------|------|
| `frontend/src/services/linkedNftTokenRegistry.js` | Prefer boing-sdk encode/decode; local 0xE0–0xE6 fallback until SDK merge |
| `/linked-project` | Claim / register / unlink / query |
| Create NFT / Deploy Token | Post-deploy panel → same service |

### Env

```bash
# Required until end_user publishes the id
REACT_APP_BOING_LINKED_NFT_TOKEN_REGISTRY=0x…

# Recommended for links_count / get_link_at without Express signing
REACT_APP_BOING_RPC_UNSIGNED_SIMULATE_METHOD=boing_simulateContractCall
```

Until `boing-sdk` with `linkedNftTokenRegistry` is on main, point the file dep at network branch `cursor/linked-nft-token-sdk-277c` (SHA `abf8808`) or rely on the local encode fallback.

## Upstream

- [boing.network PR #42](https://github.com/Boing-Network/boing.network/pull/42)
- `docs/BOING-LINKED-NFT-TOKEN.md` in boing.network

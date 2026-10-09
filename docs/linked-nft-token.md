# Linked NFT collection + fungible token (on-chain)

Enforced many-to-many links between NFT collections and project tokens on boing.finance.

## Product rules (updated 2026-10-09)

| Rule | Behavior |
|------|----------|
| Cardinality | **Many-to-many** |
| Mutability | Links can be **registered and unlinked** after create |
| Enforcement | **On-chain registry** (not soft-gate, not browser localStorage) |
| Soft-gate | Prefer same wallet/deployer; **advisory only** before submit |
| Schema | `boing.linked_nft_token.v1` — optional metadata companion |

Display-only browser drafts are **paused**. Official reads/writes go through the registry.

## Blockers (current)

| Dependency | Status |
|------------|--------|
| Registry AccountId | Unpublished — set `REACT_APP_BOING_LINKED_NFT_TOKEN_REGISTRY` or wait for `end_user.canonical_linked_nft_token_registry` |
| SDK calldata / list helpers | Pending boing.network [PR #42](https://github.com/Boing-Network/boing.network/pull/42) **follow-up** (on-chain registry). Current #42 is display-only schema helpers. |
| Finance wiring | Stubbed: refuses to invent selector bytes; UI shows blocked status until both address + SDK encode helpers exist |

Finance looks for SDK names such as:

- `encodeRegisterLinkedNftTokenPairCalldataHex` / `encodeUnlinkLinkedNftTokenPairCalldataHex`
- `encodeLinkedNftTokenPeersCountCalldataHex` / `encodeLinkedNftTokenGetPeerAtCalldataHex`
- `resolveLinkedNftTokenRegistryAccountIdHex`

(Aliases with similar shapes are also accepted — see `frontend/src/services/linkedNftTokenRegistry.js`.)

## Surfaces

| Route | Role |
|-------|------|
| `/linked-project` | Hub: paste AccountIds, register/unlink when registry ready |
| `/create-nft` | After native collection deploy, link step → registry |
| `/deploy-token` | After native token deploy, link step → registry |

Query helpers: `?collection=` / `?token=` on `/linked-project`; `?linkToken=` on Create NFT; `?linkCollection=` on Deploy Token.

## Env

```bash
# 32-byte registry AccountId (wins until RPC end_user publishes the canonical id)
# REACT_APP_BOING_LINKED_NFT_TOKEN_REGISTRY=0x…
```

## Related

- boing.network docs (when merged): `BOING-LINKED-NFT-TOKEN.md`
- DEX precedent: factory `register_pair` (fungible–fungible–pool only)

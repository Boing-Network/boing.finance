# Linked NFT collection + fungible token (on-chain)

Enforced many-to-many NFT ↔ fungible token links on boing.finance via the Boing VM **linked NFT–token registry** (boing.network [PR #42](https://github.com/Boing-Network/boing.network/pull/42); finance wiring [PR #15](https://github.com/Boing-Network/boing.finance/pull/15) @ `21035a0`).

**Authority is on-chain.** Soft-gate and `boing.linked_nft_token.v1` metadata are advisory / optional cache only — not a substitute for registry registration. The former display-only / localStorage MVP is **superseded**.

## Product rules

| Rule | Behavior |
|------|----------|
| Cardinality | **Many-to-many** (no 1:1 cap) |
| Mutability | **register_link** / **unlink_at** after create |
| Auth | **Dual asset-claimer** — first `claim_asset` wins per AccountId; register/unlink require claimer of **both** sides |
| Soft-gate | Same-deployer advisory only |
| Metadata schema | `boing.linked_nft_token.v1` — **cache only** (not consensus) |

## Public testnet registry

| Field | Value |
|-------|--------|
| Network | Boing public testnet (`https://testnet-rpc.boing.network/`) |
| Registry AccountId | `0xebf9f0190f415852f90d0e60343126201248ab96273fdbf8acc5fe5fa03c3dd8` |
| CREATE2 salt | `BOING_NFT_TOKEN_LINK_REG_V1` |
| Env (Pages CI) | `REACT_APP_BOING_LINKED_NFT_TOKEN_REGISTRY` in `frontend/env/github-build.*.env` |
| Mainnet | Not deployed (apps target testnet RPC today) |

Optional later: `end_user.canonical_linked_nft_token_registry` on `boing_getNetworkInfo` (finance already accepts that field when present).

## UX (boing.finance)

**Guided create:** **[`/project-pack`](https://boing.finance/project-pack)** (nav: Launch → Project pack) — collection + token + companions in one flow. Product UI stays plain-language (companions / link); selectors and registry AccountId stay in this doc.

**Manage existing:** **[`/linked-project`](https://boing.finance/linked-project)** (nav: Launch → Manage links).

| Step | Action | Selector |
|------|--------|----------|
| 1 | **Claim** each asset AccountId (`claim_asset`) | `0xE0` |
| 2 | **Register** the NFT ↔ token pair (`register_link`) | `0xE1` |
| 3 | **Unlink** when needed (`unlink_at`) | `0xE2` |
| Query | List links (`links_count` / `get_link_at`) | `0xE3` / `0xE4` |

Project pack prefers SDK `buildLinkedNftTokenProjectPack` ([boing.network #48](https://github.com/Boing-Network/boing.network/pull/48); branch `cursor/sdk-project-pack` until merge) — joint CREATE2 deploys + claim×2 + `register_link`. Falls back to composing `buildLinkedNftTokenPairDeploys` + register flow on older SDK installs.

Post-deploy panels on **Create NFT** and **Deploy Token** reuse `LinkedNftTokenPanel` → `linkedNftTokenRegistry`. Claim soon after deploy so a third party cannot front-run `claim_asset`.

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

## Finance wiring

| Path | Role |
|------|------|
| `frontend/src/services/projectPackDeploy.js` | Guided pack: prefer `buildLinkedNftTokenProjectPack`, QA + Express submit |
| `frontend/src/pages/ProjectPack.jsx` | Plain-language wizard at `/project-pack` |
| `frontend/src/services/linkedNftTokenRegistry.js` | Prefer boing-sdk encode/decode; local 0xE0–0xE6 fallback for stale installs |
| `frontend/src/components/LinkedNftTokenPanel.jsx` | Claim / register / unlink / query UI (Manage links) |
| `/project-pack` | Guided create (collection + token + companions) |
| `/linked-project` | Manage / unlink existing companions |
| Create NFT / Deploy Token | Post-deploy panel → same service; CTA to Project pack |
| In-app docs | Developer Tools → Boing L1 section; Help Center |

### Env

```bash
# Public testnet (baked in github-build production/staging env)
REACT_APP_BOING_LINKED_NFT_TOKEN_REGISTRY=0xebf9f0190f415852f90d0e60343126201248ab96273fdbf8acc5fe5fa03c3dd8

# Recommended for links_count / get_link_at without Express signing
REACT_APP_BOING_RPC_UNSIGNED_SIMULATE_METHOD=boing_simulateContractCall
```

Canonical catalog: `frontend/.env.example`. Resolution order also accepts `REACT_APP_BOING_NATIVE_VM_LINKED_NFT_TOKEN_REGISTRY`, contracts `nativeVm.linkedNftTokenRegistry`, and network `end_user.canonical_linked_nft_token_registry`.

`boing-sdk` registry helpers are on **boing.network main** (merged [PR #42](https://github.com/Boing-Network/boing.network/pull/42)).

### Verify registry (public)

```bash
curl -fsS -A boing-sdk/json-rpc -X POST https://testnet-rpc.boing.network/ \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"boing_simulateContractCall","params":["0xebf9f0190f415852f90d0e60343126201248ab96273fdbf8acc5fe5fa03c3dd8","0x00000000000000000000000000000000000000000000000000000000000000e3"]}'
```

Expect `success: true` and a zero word for empty `links_count`.

## Upstream / ops

- Protocol + bytecode: `docs/BOING-LINKED-NFT-TOKEN.md` in boing.network
- Network PR: [boing.network#42](https://github.com/Boing-Network/boing.network/pull/42)
- Finance PR: [boing.finance#15](https://github.com/Boing-Network/boing.finance/pull/15) (`21035a0`)
- Deploy / env ops handoff: project store `docs/linked-nft-token-registry-deploy.md`

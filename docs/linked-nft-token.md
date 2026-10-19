# Linked NFT collection + fungible token (on-chain)

Enforced many-to-many NFT ↔ fungible token links on boing.finance via the Boing VM **linked NFT–token registry** (boing.network [PR #42](https://github.com/Boing-Network/boing.network/pull/42); finance wiring [PR #15](https://github.com/Boing-Network/boing.finance/pull/15) @ `21035a0`).

**Authority is on-chain.** Soft-gate and `boing.linked_nft_token.v1` metadata are advisory / optional cache only — not a substitute for registry registration. The former display-only / localStorage MVP is **superseded**.

## Product rules

| Rule | Behavior |
|------|----------|
| Cardinality | **Many-to-many** (no 1:1 cap) |
| Mutability | **register_link** / **unlink_at** after create |
| Auth | **Dual asset-claimer**: register/unlink require the claimer of **both** sides. Registry v2: an asset's claimer is its **creator** (see below); nobody else can claim it |
| Soft-gate | Same-deployer advisory only |
| Metadata schema | `boing.linked_nft_token.v1` — **cache only** (not consensus) |

## Public testnet registry

| Field | Value |
|-------|--------|
| Network | Boing public testnet (`https://testnet-rpc.boing.network/`) |
| Registry AccountId | `0xf704485ad29f56bb6516ac822fcf9ca8fcb6c4266e22c9ed7f9c6908668655dd` |
| CREATE2 salt | `BOING_NFT_TOKEN_LINK_REG_V2` (registry v2, block 1174) |
| Previous (v1) | `0xebf9f0190f415852f90d0e60343126201248ab96273fdbf8acc5fe5fa03c3dd8`, first `claim_asset` caller won; its claims and links were copied into v2 |
| Env (Pages CI) | `REACT_APP_BOING_LINKED_NFT_TOKEN_REGISTRY` in `frontend/env/github-build.*.env` |
| Mainnet | Not deployed (apps target testnet RPC today) |

### Who can claim (registry v2)

v1 let the **first caller** of `claim_asset(asset)` become the claimer, so anyone watching the mempool could claim
a freshly deployed collection or token before its creator and block them from linking it. v2 closes that:

- **New assets** are claimed **inside their own deploy transaction**. boing.finance deploys every token and NFT
  collection with `0xFD` init code that, besides setting the creator as admin (and, for tokens, minting the supply),
  calls `claim_self(creator)` (selector `0xE7`) on the registry. The registry takes the caller as the asset, so only
  the asset itself can claim itself, and only once. Deploys: Deploy Token (one signature), Create NFT, Project pack.
- **Assets that existed before v2** have a recorded deployer (the sender of their deploy tx, copied at v2 deploy).
  `claim_asset(asset)` succeeds only when the sender is that deployer (`get_asset_deployer` = `0xE8`).
- Anyone else's `claim_asset` fails. v1 claims and links were carried over unchanged (none were squatted).
- Assets deployed after v2 by tools that do not add the claim to their init code cannot be claimed (and so not linked).

Optional later: `end_user.canonical_linked_nft_token_registry` on `boing_getNetworkInfo` (finance already accepts that field when present).

## UX (boing.finance)

**Guided create:** **[`/project-pack`](https://boing.finance/project-pack)** (nav: Launch → Project pack) — collection + token + companions in one flow. Product UI stays plain-language (companions / link); selectors and registry AccountId stay in this doc.

**Manage existing:** **[`/linked-project`](https://boing.finance/linked-project)** (nav: Launch → Manage links).

**Link-gated actions (v1):** After companions are verified on-chain, **Add a pool** unlocks on Project pack success and Manage links. Create pool with `?collection=&token=&requireCompanions=1` blocks native pool create until the pair is linked. Plain Create pool (no query) stays ungated. See project store `docs/link-gated-actions.md`.

**Builder attestation (optional, on-chain):** After companions are linked, Project pack success and Manage links offer **Attest as builder** / show **Builder attested** (revoke when you are the builder). Separate registry + claimer from companions — see [Builder attestation](#builder-attestation-on-chain) below. Soft wallet-proof helpers from [#23](https://github.com/Boing-Network/boing.finance/pull/23) may remain in-tree; the primary panel is on-chain.
| Step | Action | Selector |
|------|--------|----------|
| 1 | **Claim** each asset: automatic in its deploy tx (`claim_self`, v2); pre-v2 assets: recorded deployer only (`claim_asset`) | `0xE7` / `0xE0` |
| 2 | **Register** the NFT ↔ token pair (`register_link`) | `0xE1` |
| 3 | **Unlink** when needed (`unlink_at`) | `0xE2` |
| Query | List links (`links_count` / `get_link_at`) | `0xE3` / `0xE4` |

Project pack planning lives in `frontend/src/services/projectPackPlan.js` (pure, tested by `scripts/project-pack-plan.test.mjs`). It uses SDK `buildLinkedNftTokenProjectPack` with `claimAtDeploy` — joint CREATE2 deploys (each claims itself) + `register_link`, three transactions — and falls back to composing `buildLinkedNftTokenPairDeploys` + register flow on older SDK installs.

**Pack token = Boing token v2, minted to the creator at deploy.** The token deploy passes `tokenBytecodeHexOverride` = `buildBoingTokenV2MintAtDeployBytecodeHex({ supply })` (`services/boingTokenV2Launch.js`): `0xFD` init + the unchanged v2 runtime (`boingTokenBytecodeHex(2)`, the same code as Deploy token and the v8/v9 custody pools). The init runs inside the deploy transaction with `CALLER` = deployer and stores admin = deployer (`0x…f0`), `balance[deployer] = supply` and mint-once = 1 (`0x…f1`), then returns the v2 runtime. So:

- the creator holds the whole supply as soon as the token exists, and `mint_first` is already spent (no one can mint more);
- there is no transaction gap in which another account could call the empty token first and become its admin. A separate `mint_first` at nonce n+1 would leave that gap: the node packs blocks by (nonce, sender), so a third-party call with nonce n or n+1 can be ordered between the deploy and the mint.
- Supply: the pack's supply field (default `PROJECT_PACK_DEFAULT_TOKEN_SUPPLY` = 1,000,000,000 in `config/projectPack.js`), whole units, 1 .. 2^128−1, validated by `parseBoingTokenV2Supply` like Deploy token. The supply is part of the token bytecode, so it changes the predicted token address; the page locks it once the collection (whose deploy names that address) is on chain.
- The token init also calls the registry's `claim_self(creator)`, and the collection deploy is wrapped the same way (`buildBoingNftCollectionAtDeployBytecodeHex` in `services/boingDeployInit.js`: admin slot `0x…e0` = creator + `claim_self`), so both sides are claimed by the creator in their deploy transactions and the pack is three transactions: collection, token, `register_link`.

**Deploy Token (solo) uses the same init:** one transaction, one signature. The deploy stores admin = creator, the whole supply on the creator, mint-once = 1, and claims the token in the registry. Check: `node scripts/check-boing-token-deploy.mjs --dry-run` / `--execute [--supply N]`.

Testnet check with the page's planner: `node scripts/check-project-pack-deploy.mjs --dry-run` / `--execute [--supply N]` (key from `BOING_SECRET_HEX`, never printed).

Post-deploy panels on **Create NFT** and **Deploy Token** reuse `LinkedNftTokenPanel` → `linkedNftTokenRegistry`. Assets deployed here are already claimed by their creator, so linking is a single `register_link`. An unclaimed asset can only be claimed by its recorded deployer; otherwise the panel explains why it cannot be linked.

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
| `claim_self` (v2, called by the asset itself) | `0xE7` | 64 |
| `get_asset_deployer` (v2) | `0xE8` | 64 → 32 |

## Finance wiring

| Path | Role |
|------|------|
| `frontend/src/services/projectPackDeploy.js` | Guided pack: prefer `buildLinkedNftTokenProjectPack`, QA + Express submit |
| `frontend/src/pages/ProjectPack.jsx` | Plain-language wizard at `/project-pack` |
| `frontend/src/services/linkedNftTokenRegistry.js` | Prefer boing-sdk encode/decode; local 0xE0–0xE6 fallback; `areCompanionsLinkedOnChain` / `buildProjectPoolPath` |
| `frontend/src/components/CompanionLinkGate.jsx` | Plain-language lock/unlock for link-gated actions |
| `frontend/src/hooks/useCompanionsLinked.js` | Live registry companion check |
| `frontend/src/components/BuilderAttestationPanel.jsx` | On-chain attest / status / revoke (see [Builder attestation](#builder-attestation-on-chain)) |
| `frontend/src/utils/builderAttestation.js` | Soft wallet-proof helpers (optional; not primary UI) |
| `frontend/src/services/builderAttestationSign.js` | Soft `boing_signMessage` path (optional; not primary UI) |
| `frontend/src/components/LinkedNftTokenPanel.jsx` | Claim / register / unlink / query UI (Manage links) |
| `frontend/src/components/NativeBoingCreatePoolPanel.jsx` | Project-pool query gate (`requireCompanions=1`) |
| `/project-pack` | Guided create (collection + token + companions) |
| `/linked-project` | Manage / unlink existing companions |
| Create NFT / Deploy Token | Post-deploy panel → same service; CTA to Project pack |
| In-app docs | Developer Tools → Boing L1 section; Help Center |

### Env

```bash
# Public testnet (baked in github-build production/staging env)
REACT_APP_BOING_LINKED_NFT_TOKEN_REGISTRY=0xf704485ad29f56bb6516ac822fcf9ca8fcb6c4266e22c9ed7f9c6908668655dd

# Required for Manage links / companion list reads (links_count / get_link_at) without Express signing.
# Baked in github-build production/staging env — without it the UI shows "Ready to link" but
# "Could not load companions right now" because unsigned simulate never runs.
REACT_APP_BOING_RPC_UNSIGNED_SIMULATE_METHOD=boing_simulateContractCall
```

Canonical catalog: `frontend/.env.example`. Resolution order also accepts `REACT_APP_BOING_NATIVE_VM_LINKED_NFT_TOKEN_REGISTRY`, contracts `nativeVm.linkedNftTokenRegistry`, and network `end_user.canonical_linked_nft_token_registry`.

`boing-sdk` registry helpers are on **boing.network main** (merged [PR #42](https://github.com/Boing-Network/boing.network/pull/42)).

### Verify registry (public)

```bash
curl -fsS -A boing-sdk/json-rpc -X POST https://testnet-rpc.boing.network/ \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"boing_simulateContractCall","params":["0xf704485ad29f56bb6516ac822fcf9ca8fcb6c4266e22c9ed7f9c6908668655dd","0x00000000000000000000000000000000000000000000000000000000000000e3"]}'
```

Expect `success: true` and a zero word for empty `links_count`.

## Upstream / ops

- Protocol + bytecode: `docs/BOING-LINKED-NFT-TOKEN.md` in boing.network
- Network PR: [boing.network#42](https://github.com/Boing-Network/boing.network/pull/42)
- Finance PR: [boing.finance#15](https://github.com/Boing-Network/boing.finance/pull/15) (`21035a0`)
- Deploy / env ops handoff: project store `docs/linked-nft-token-registry-deploy.md`

## Builder attestation (on-chain)

Optional builder signal for a companion project. **Authority is on-chain** via a dedicated attestation registry (not companions, not wallet-signed JSON). Soft wallet-proof UX from [#23](https://github.com/Boing-Network/boing.finance/pull/23) is secondary; this panel reads/writes the live registry.

| Field | Value |
|-------|--------|
| Network | Boing public testnet (`https://testnet-rpc.boing.network/`) |
| Registry AccountId | `0x734077a9f926077d39e84ec278b77b7b600c840f7101809646d8797a6a9e1816` |
| CREATE2 salt | `BOING_BUILDER_ATTEST_REG_V1` |
| Env (Pages CI) | `REACT_APP_BOING_BUILDER_ATTESTATION_REGISTRY` in `frontend/env/github-build.*.env` |
| SDK | `builderAttestationRegistry.ts` on **boing.network main** ([#49](https://github.com/Boing-Network/boing.network/pull/49)) |
| Mainnet | Not deployed |

### Product rules

| Rule | Behavior |
|------|----------|
| When to offer CTA | App policy: after companions linked (Project pack success + Manage links) |
| Auth | Separate dual asset-claimer on **this** registry (claim×2 then attest) |
| Revoke | Recorded builder **or** current dual claimer |
| Note | Hash on-chain OK; finance chrome omits note field |
| Copy | **Attest as builder** / **Builder attested** — no registry jargon in chrome |

### Finance wiring

| Path | Role |
|------|------|
| `frontend/src/services/builderAttestationRegistry.js` | Prefer SDK encode/decode; local 0xE0–0xE6 fallback; claim / attest / revoke / list |
| `frontend/src/hooks/useBuilderAttested.js` | Live registry scan for a pair |
| `frontend/src/components/BuilderAttestationPanel.jsx` | Plain-language CTA + status |
| `/project-pack` (done) | Optional attest after companions linked |
| `/linked-project` | Same panel under Manage links |

```bash
REACT_APP_BOING_BUILDER_ATTESTATION_REGISTRY=0x734077a9f926077d39e84ec278b77b7b600c840f7101809646d8797a6a9e1816
```

Protocol: `docs/BOING-BUILDER-ATTESTATION.md` in boing.network. Design/ops: project store `docs/builder-attestations-onchain.md` · `docs/builder-attestation-registry-deploy.md`.

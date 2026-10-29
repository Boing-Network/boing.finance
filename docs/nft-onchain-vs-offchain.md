# Create NFT: on-chain vs off-chain (Boing L1)

> 👋 **Everyday users:** after **Deploy & mint on Boing**, ownership and metadata hashes are on-chain. Images prefer L1 blobs when Express can PutBlob; otherwise they stay on R2/HTTP.  
> 🛠️ **Developers:** wizard default is **Prefer L1 media blobs**. Bulk PutBlob needs **Boing Express 0.1.22+** (`putBlobSession`). Collection JSON stays on R2/HTTP.

What lands on Boing L1 vs off-chain after Create NFT (Standard + Large set) finishes **Deploy & mint**.

---

## Short verdict

**Yes for ownership + metadata commitments.** Media bytes land on L1 when PutBlob succeeds; otherwise they remain R2/HTTP (or IPFS). Marketplaces reconstruct the collection from the chain + resolvable metadata URIs.

Completing **Deploy & mint on Boing**:

1. Deploys the collection contract (`purpose nft`, name, symbol, `description_hash`).
2. Publishes collection catalog JSON to **R2/HTTP** (`boing.nft_collection_metadata.v1`) with per-token `metadata_hash` / `token_id`.
3. Runs chunked **`mint_batch` (`0x06`)** for every prepared row: on-chain **owner** + **metadata hash** for token ids `1..N`.

---

## Prefer L1 blobs (default)

| Path | Behavior |
|------|----------|
| **Default (checked)** | Upload prefers **L1 PutBlob** when size ≤ live cap (`boing_getMediaBlobParams.effectiveMaxBytesAtTip`). Metadata `image` → `boing://blob/0x{blobId}`. |
| **Fallback** | R2/HTTP (or IPFS) if over cap, PutBlob fails, Express missing, file over wallet-safe size (~4 MiB raw), or user unchecks Prefer L1. |
| **Bulk (2+ files)** | Express **0.1.22+** `putBlobSession`: one `boing_requestPutBlobSession` approval, then pipelined PutBlob. Older Express still signs PutBlob but prompts per file. |
| **Collection JSON** | Always R2/HTTP; committed on-chain via `description_hash`. |

UI copy: Create NFT Prefer L1 checkbox; `NativeBoingNftDeploySection`; in-app Help → Create NFT.

---

## On-chain vs off-chain

### On-chain after a successful Deploy & mint

| Item | How |
|------|-----|
| Collection AccountId | Deploy receipt (reference NFT collection template) |
| `asset_name` / `asset_symbol` | Deploy meta |
| `purpose_category` | Typically `nft` |
| `description_hash` | Blake3-256 of collection JSON |
| Token ids `1..N` owners | `mint_batch` → connected Express AccountId |
| Per-token `metadata_hash` | `mint_batch` |
| Media bytes (when PutBlob used) | Tx PutBlob; URI `boing://blob/0x…`; fetch via `boing_getBlob` |

### Off-chain after publish

| Item | Notes |
|------|--------|
| Cover / media (fallback) | `POST …/api/r2/upload` or multipart; also when Prefer L1 is off |
| Collection metadata JSON | `metadata/{blake3}.json` on R2 |
| Per-token JSON (≤200 tokens) | Best-effort same key pattern; large sets rely on the catalog |

---

## Caps (finance-facing)

| Cap | Value |
|-----|--------|
| Protocol default | 16 MiB (`MAX_MEDIA_BLOB_BYTES`) |
| PHASE7 active | 256 MiB (`effectiveMaxBytesAtTip`) — ops activation on the node |
| Finance wallet-safe PutBlob | ~4 MiB raw (larger → R2 fallback even if protocol allows more) |
| `mint_batch` chunk | Default 50 (`REACT_APP_BOING_NFT_MINT_BATCH_CHUNK`); template max 500 |

---

## Marketplace reconstruction

1. Read catalog `tokens[i].image`.
2. If `boing://blob/0x…` → `boing_getBlob(id)` → render bytes.
3. If `https://` / `ipfs://` → fetch as before.

---

## Not finance-specific

**Phase 34 blob download ACL** (publisher allowlists / capability tickets / explorer download gate) lives on **boing.network** + **boing.observer**, not in this app’s Create NFT path. Finance only publishes blobs and resolves `boing://blob/…` for display. See network `docs/HANDOFF_BLOB_DOWNLOAD_ACL.md` / Observer blob download UI.

---

## Code map

| Path | Role |
|------|------|
| `frontend/src/pages/CreateNFT.jsx` | Prefer L1 checkbox (default on) |
| `frontend/src/services/boingL1MediaBlobUpload.js` | PutBlob + session + R2 fallback |
| `frontend/src/utils/boingBlobMediaUrl.js` / `BoingBlobImage.jsx` | Display resolver |
| `frontend/src/components/NativeBoingNftDeploySection.jsx` | Deploy + mint |
| `frontend/.env.example` | `REACT_APP_BOING_NFT_MINT_BATCH_CHUNK`, media budget |

Upstream: `@boing-network/boing-sdk` media blob helpers; Boing Express `put_blob` / `putBlobSession` (0.1.22+).

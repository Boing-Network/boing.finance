# Boing VM “contracts”, deploy, and Observer transparency

This clarifies what **deploying smart contracts** means on **Boing L1 (6913)** and how **boing.observer** fits a **full public DEX** story.

## Transparency stack (four layers)

| Layer | Role |
|-------|------|
| **Boing VM + RPC** | Execution, storage, events — the foundation for on-chain “contracts.” |
| **boing.observer** | Shows **accounts** / **transactions** (and richer **contract** views as the team ships them: bytecode, storage, etc.). |
| **“Etherscan-verified” clarity** | Needs **published artifacts / interfaces** (upstream canonical deploy docs) and/or a **verifier** product if the network adds one — **not** something the frontend alone can replace. |
| **boing.finance** | Wires deploy/swap, **links to Observer**, derives **`tx_id`** from the signed tx for **`boing_getTransactionReceipt`**, and surfaces **View contract** when receipts expose the new **AccountId** (e.g. via logs). |

## Is deploying “smart contracts” possible on Boing?

**Yes — as Boing VM programs, not as EVM bytecode from this repo’s Solidity tree.**

| Concept | EVM (e.g. Sepolia) | Boing L1 (6913) |
|--------|---------------------|------------------|
| Deploy unit | Contract bytecode from `solc` | **Boing VM bytecode** (templates in **boing-sdk** / env overrides) |
| Address | 20-byte `0x…` | **32-byte `AccountId`** (`0x` + 64 hex) |
| How dApps deploy | `ethers.ContractFactory` / MetaMask | **Boing Express** + **`contract_deploy_meta`** (+ QA), RPC simulate/submit |
| Solidity in `contracts/` | Deployed here | **Reference / EVM deployments** — not loaded as-is on Boing VM (see [boing-l1-vs-evm-dex.md](./boing-l1-vs-evm-dex.md)) |

So users **can** deploy **executable on-chain logic** (tokens, NFT collections, pools, future factory/router modules) **if** the **bytecode matches the node**, passes **QA**, and the wallet can sign the native tx. That **is** the Boing analogue of “deploying a contract.”

## Will we need to build more?

**Yes, in layers** — not everything is “one Solidity monorepo deploy.”

1. **Protocol / VM** (Boing Network): execution rules, RPC, canonical templates, optional **verification** or **metadata registry** for public transparency.
2. **Explorer (boing.observer)**: account + tx views, and ideally **rich contract pages** (bytecode, key storage, events) for **32-byte** accounts — product work on the Observer side.
3. **dApp (boing.finance)**: connect flows, deep links to Observer, error messages when templates drift (Phase P0), and later **post-deploy links** when the API exposes the created `AccountId`.
4. **“Fully transparent like Etherscan verified”**: usually needs **published interfaces / artifact hashes** (already partially documented upstream) and/or a **formal verifier** if the chain adds one — **not** something the frontend alone can fake.

## What the public can see on boing.observer today

The app uses account URLs shaped like:

`https://boing.observer/account/{accountHex}`

(see `frontend/src/config/boingExplorerUrls.js`.)

Whatever **Observer** renders for that account (balance history, transactions, contract bytecode, storage — **depends on Observer + RPC capabilities**). For **“functionalities fully transparent”**, plan on:

- **On-chain**: clear logs / read APIs for the VM programs you deploy.
- **Off-chain**: canonical docs (e.g. upstream **BOING-CANONICAL-DEPLOY-ARTIFACTS** / handoff docs) so anyone can map **bytecode hash → behavior**.
- **Explorer**: UI that surfaces those reads in a user-friendly way.

## Related docs

- [boing-l1-vs-evm-dex.md](./boing-l1-vs-evm-dex.md) — EVM vs Boing VM DEX.
- [boing-l1-dex-roadmap.md](./boing-l1-dex-roadmap.md) — phased DEX + reliability work.
- Upstream [HANDOFF-DEPENDENT-PROJECTS.md](https://github.com/Boing-Network/boing.network/blob/main/docs/HANDOFF-DEPENDENT-PROJECTS.md) — Express, Observer, partner backlog.

# Handoff: Boing Network — dApp-ready discovery for new tokens & pools

**Audience:** Boing Network core, RPC, indexer teams  
**Consumer:** boing.finance (and any wallet / partner dApp using `boing-sdk`)  
**User outcome:** After deploying a fungible token and registering a DEX pair, users can **see the pair and swap without pasting raw 32-byte ids**—or with minimal friction—after a refresh.

---

## What partner dApps already do (no chain change)

`boing.finance` aggregates discovery from several sources (see also [HANDOFF_Boing_Network_Global_Token_Discovery.md](./HANDOFF_Boing_Network_Global_Token_Discovery.md) and [INTEGRATION_NATIVE_DEX_L1_DISCOVERY.md](./INTEGRATION_NATIVE_DEX_L1_DISCOVERY.md)):

| Source | Role |
|--------|------|
| `boing_getNetworkInfo` | Default CP pool / factory hints for bootstrapping the UI |
| `boing_listDexPools` (paginated) | Enumerate registered pools so **new pairs appear** without client log scans |
| `boing_listDexTokens` (paginated) | Trade-relevant token set derived from DEX state |
| Optional indexer URL (operator) | TVL, labels, history—**enrichment**, not sole source of truth |
| Register-pair log scan (fallback) | dApp can merge **only if** env configures a from-block scan; heavier than L1 list RPCs |

The in-app **Swap** tab targets the **canonical/default** CP pool only. **New factory pairs** are surfaced under **Pools** + **Smart route**, which executes multihop routing when routes exist on-chain.

---

## What the chain must provide for “seamless” discovery

Without these, dApps fall back to manual token ids, narrower pool lists, or expensive log scans.

### 1. Stable, documented L1 discovery RPCs (highest leverage)

Implement and **advertise** in `boing_rpcSupportedMethods` / `boing_getRpcMethodCatalog` (so clients do not rely on probing):

- **`boing_listDexPools`** — cursor pagination; each row includes pool id and both token ids (and ideally **token decimals** on the row for display / slippage UX).
- **`boing_listDexTokens`** — same pagination contract; rows keyed by 32-byte token id with **symbol, name, decimals** when available.

These methods should reflect **new registrations within normal block finality** so a user who just created a pool sees it after **Refresh** in the dApp—without rescans from genesis on every load.

*Reference spec:* [HANDOFF_Boing_Network_Global_Token_Discovery.md](./HANDOFF_Boing_Network_Global_Token_Discovery.md) §3.

### 2. Reliable `boing_getNetworkInfo` (or equivalent) defaults

End-user UIs need a **non-zero default pool / factory** pointer when present so the primary **Swap** tab and routing hints work without brittle deploy-time env overrides.

### 3. Register-pair / factory events queryable for routing

**Smart route** builds paths from factory registration and pool graph data. If list RPCs are absent or lagging, nodes should still expose **consistent** access to registration logs or a routing directory that matches what the factory emits—otherwise routing may fail for new pairs until an indexer catches up.

### 4. Optional but high-UX: public indexer or stats URL

A small JSON snapshot (pools, token labels, coarse TVL) is still valuable for sorting and charts, but **must not** be the only way to learn that a new pool exists—not all users will run a proprietary indexer.

---

## Definition of done (product check)

On **Boing testnet** (or mainnet when live), after a user:

1. Deploys a standard fungible token, and  
2. Registers a constant-product pool with the network DEX factory,

then **without** editing dApp source:

- The new pool appears in partner **Pool** UIs within one **Refresh** / short wait (assuming RPC implements list RPCs above).  
- The user can open **Smart route** with prefilled legs (from pool row) or pick tokens from a list that includes **on-chain** symbols/names for pool legs.  
- Swapping uses the same **Boing Express** signing flow as the default pool swap.

If any step still requires users to **copy-paste 64-character hex** for routine pairs, treat that as a **node / RPC gap** first, then indexer.

---

## Message you can paste to Boing Network stakeholders

> For third-party DeFi frontends (including boing.finance) to auto-surface **newly deployed tokens and factory pools**, we need **production `boing_listDexPools` and `boing_listDexTokens`** on public RPC—paginated, advertised in the RPC method catalog, and updated as new blocks finalize—plus stable **`boing_getNetworkInfo`** defaults. Without that, wallets and dApps cannot offer Uniswap-style “see new pair → swap” without fragile log scans from user-tuned genesis blocks or a centralized token list. Optional indexers remain useful for TVL and search ranking, but **L1 discovery RPCs are the baseline** for trust-minimized, seamless UX. Aligned spec: repo doc **HANDOFF_Boing_Network_Global_Token_Discovery.md**.

---

## Related repo artifacts

- [HANDOFF_Boing_Network_Global_Token_Discovery.md](./HANDOFF_Boing_Network_Global_Token_Discovery.md) — full architecture & proposed RPC shapes  
- [INTEGRATION_NATIVE_DEX_L1_DISCOVERY.md](./INTEGRATION_NATIVE_DEX_L1_DISCOVERY.md) — env flags the dApp uses when RPCs exist  
- [boing-l1-vs-evm-dex.md](./boing-l1-vs-evm-dex.md) — EVM vs native VM DEX surfaces

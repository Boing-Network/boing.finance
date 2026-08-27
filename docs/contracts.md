# Smart contracts (EVM)

> 👋 **Everyday users:** EVM deploys use a normal EVM wallet. Boing L1 deploys use Boing Express — these Solidity files do **not** run on Boing.  
> 🛠️ **Developers:** live addresses in `frontend/src/config/contracts.js`. Boing L1: [native-dex.md](./native-dex.md).  
> 🛰️ **Operators:** DEXFactoryV2 enablement runbook is below.

Which features need on-chain deploys, current status, and how to enable the **DEXFactoryV2** stack on listed EVM networks.

**Live addresses:** `frontend/src/config/contracts.js` (human-readable history: [contract-registry.md](./contract-registry.md)).  
**Boing L1 (6913)** uses the native VM AMM, not these Solidity contracts — [native-dex.md](./native-dex.md).  
**Governance (undeployed):** `contracts/GOVERNANCE_CONTRACTS.md`.

*Last reviewed: August 2026.*

---

## Current status

### Deployed

- **TokenFactory:** Ethereum, Polygon, BSC, Arbitrum, Optimism, Base, Sepolia.
- **DEXFactoryV2 + router + locker:** **Sepolia only** (`0x291A…` factory). Other listed EVM chains (except Ethereum) are **pre-funding**: wrapped native + hub tokens + deploy scripts are in repo; factory/router stay zero until protocol deploy.

**Ethereum (chain id 1)** is excluded from the DEX rollout. **zkSync Era (324)** needs the zkSync compiler, not vanilla Hardhat.

| Feature | Contracts required | Status |
|---------|-------------------|--------|
| Deploy Token | TokenFactory | Live on TokenFactory networks |
| Create Pool / Liquidity | DEXFactory, DEXRouter | Sepolia: Boing factory. Other EVM: Uniswap/Pancake V2 Create Pool where mapped. Liquidity page still needs Boing router. |
| Swap | Optional (DEXRouter) | Boing DEX when factory is set; else **LI.FI** (EVM) / **Jupiter** (Solana) |
| Bridge | Optional | External bridges / aggregator |
| Portfolio / Analytics / token browse | No | APIs (CoinGecko, RPC, Etherscan, GeckoTerminal) |
| Governance / staking | BoingGovernor, Treasury, … | **Not deployed** — placeholders in `contracts.js` |

### In-app swaps without Boing pools

Swap routes through **LI.FI** on EVM and **Jupiter** on Solana (`GET /api/aggregator/quote`). Optional Worker secrets `LIFI_API_KEY`, `JUPITER_API_KEY`. Tokens with no market still have no route.

---

## EVM DEX enablement (up to funding)

In-app AMM on listed EVM networks needs a live **DEXFactoryV2 + LiquidityLocker + DEXRouter** and a canonical **wrapped native**. It does **not** need seeded liquidity until users (or operators) run **Create Pool**.

| Stage | What it is | Status |
|--------|------------|--------|
| 1. Config | RPC, explorer, wrapped native, hub tokens | Ready for listed EVM chains except Ethereum |
| 2. Protocol deploy | Factory, locker, router (no LP) | Scripts ready; addresses zero until broadcast |
| 3. App wiring | Paste addresses into `contracts.js` | Swap / Create Pool / Pools light up via `getFeatureSupport` |
| 4. Funding | Create Pool (and later extra pairs) | Not done by the deploy script |

Empty factories after stage 3 are expected: the picker can show hub tokens; Swap quotes fail with insufficient liquidity until someone funds.

### Deploy (operator)

```bash
cd contracts
# No private key — checks RPC + wrapped-native bytecode
npm run check:dex

# One chain (needs DEPLOYER_PRIVATE_KEY + gas)
npx hardhat run scripts/deploy-dex.js --network polygon

# All rollout chains except Sepolia (already live)
npm run deploy:dex:all
# or: node scripts/deploy-dex-multi-network.js --only base,bsc
```

Each successful deploy writes `contracts/deployments/dex-<chainId>.json` and prints a `contracts.js` snippet. **Do not** add initial liquidity in the deploy script.

Historical Sepolia JSON dumps (superseded) live under `contracts/deployments/archive/`.

### After addresses are live

1. Set `dexFactory`, `dexRouter`, `liquidityLocker` (keep existing `weth`).
2. Verify on the explorer.
3. Funding: Create Pool with wrapped native + a hub stable (or any ERC-20 pair).

---

## Priority

1. **High:** Deploy DEXFactory to listed EVM mainnets except Ethereum.
2. **Medium:** Verify factory/router/locker; then fund via Create Pool.
3. **Low:** Native CrossChainBridge (or keep using external bridges).

Rough gas (indicative): Ethereum high four figures USD; L2s tens of USD; Polygon/BSC low single digits. See [deployment.md](./deployment.md) for the cost plan.

---

## Related

- `contracts/CONTRACTS_AUDIT.md` — historical audit notes
- `contracts/TOKEN_DEPLOYMENT_OPTIMIZATION_NOTES.md` — TokenFactory follow-ups (do not change already-deployed factories lightly)

# EVM DEX enablement (up to funding)

In-app AMM swap on listed EVM networks needs a live **DEXFactoryV2 + LiquidityLocker + DEXRouter** and a canonical **wrapped native**. It does **not** need seeded liquidity until users (or operators) run **Create Pool**.

**Ethereum (chain id 1) is excluded** from this rollout. **Boing L1 (6913)** uses the native VM AMM, not these Solidity contracts. **zkSync Era (324)** needs the zkSync compiler, not vanilla Hardhat.

## Stages

| Stage | What it is | Status in this repo |
|--------|------------|---------------------|
| 1. Config | RPC, explorer, wrapped native, hub tokens | Ready for listed EVM chains except Ethereum |
| 2. Protocol deploy | Factory, locker, router (no LP) | Scripts ready; addresses still zero until you broadcast |
| 3. App wiring | Paste addresses into `frontend/src/config/contracts.js` | Swap / Create Pool / Pools light up via `getFeatureSupport` |
| 4. Funding | Create Pool (and later extra pairs) | **Not done here** — that is seeding liquidity |

Empty factories are expected after stage 3: the picker can show hub tokens, Create Pool can open a pair, Swap quotes fail with insufficient liquidity until someone funds.

## Deploy (operator)

```bash
cd contracts
# No private key — checks RPC + wrapped-native bytecode
npm run check:dex

# One chain (needs DEPLOYER_PRIVATE_KEY + gas)
npx hardhat run scripts/deploy-dex.js --network polygon

# All rollout chains except Sepolia (already live)
node scripts/deploy-dex-multi-network.js
# or: node scripts/deploy-dex-multi-network.js --only base,bsc
```

Each successful deploy writes `contracts/deployments/dex-<chainId>.json` and prints the `contracts.js` snippet. **Do not** add initial liquidity in the deploy script.

## After addresses are live

1. Set `dexFactory`, `dexRouter`, `liquidityLocker` (keep existing `weth`).
2. Verify on the explorer.
3. Funding: Create Pool with wrapped native + a hub stable (or any ERC-20 pair).

Sepolia already has the protocol (`0x291A…` factory). Solana stays on Jupiter / Raydium links, not this stack.

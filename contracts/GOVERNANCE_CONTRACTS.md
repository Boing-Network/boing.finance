# Governance & BOING Contracts

Foundation contracts for boing.finance governance, treasury, and BOING ecosystem. Deploy when ready; mainnet deployment can occur once you have funds.

## Contracts

| Contract | Description |
|----------|-------------|
| `BoingToken.sol` | ERC20 + ERC20Votes + ERC20Permit for governance and rewards |
| `BoingGovernor.sol` | Full Governor with TimelockController (for mainnet) |
| `BoingGovernorSimple.sol` | Governor without timelock (for testnets) |
| `Treasury.sol` | Holds ETH/tokens; only owner (Timelock or multisig) can withdraw |
| `BoingNFTStaking.sol` | Stake ERC721 NFTs, earn BOING rewards |

## Deployment

1. **Compile** (resolve DEXFactoryV2 stack-too-deep if needed):
   ```bash
   cd contracts && npm run compile
   ```

2. **Deploy governance stack** (Sepolia):
   ```bash
   npx hardhat run scripts/deploy-governance.js --network sepolia
   ```

3. **Register addresses** in backend `contract_registry`:
   ```bash
   # Example: POST to your backend
   curl -X PUT https://your-api/api/governance/contracts \
     -H "Content-Type: application/json" \
     -d '{"chainId": 11155111, "contractName": "boingToken", "address": "0x..."}'
   ```

4. **Update frontend** `src/config/contracts.js` with deployed addresses per chain.

## Backend Integration

- **Governance API** (`/api/governance`): proposals, votes, treasury snapshots, contract registry
- **BOING API** (`/api/boing`): user points, activity history, accrue points
- Run D1 migration: `node apply-d1-migration.js` (includes governance/points tables)

## Frontend Integration

- `governanceApi.js` – proposals, votes, treasury, contracts
- `boingApi.js` – points, activity
- Governance pages (Proposals, Vote, Treasury) and BOING Points page use these services
- Contract addresses from `config/contracts.js` (placeholders until deployment)

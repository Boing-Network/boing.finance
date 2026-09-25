/**
 * Lightweight wiring assertions for EVM capability gates (no ethers / Vite required).
 * Run: node scripts/check-evm-capability-wiring.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const contracts = read('src/config/contracts.js');
const feature = read('src/config/featureSupport.js');
const uni = read('src/config/uniswapV2Compat.js');
const swap = read('src/pages/Swap.jsx');
const deploy = read('src/pages/DeployToken.jsx');
const createPool = read('src/pages/CreatePool.jsx');
const agg = readFileSync(join(root, '../backend/src/routes/aggregatorRoutes.js'), 'utf8');

const fails = [];
const assert = (cond, msg) => {
  if (!cond) fails.push(msg);
};

assert(feature.includes('getUniswapV2Compat'), 'featureSupport must import Uniswap V2 compat');
assert(feature.includes("swap: hasDex ? 'boing'"), 'featureSupport must prefer boing swap when dex live');
assert(feature.includes('createPool: hasDex || hasUniswapV2'), 'createPool must allow Uniswap V2 fallback');
assert(uni.includes('56:') && uni.includes('PancakeSwap'), 'BSC must map PancakeSwap V2');
assert(uni.includes('8453:') && uni.includes('0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6'), 'Base Uniswap V2 factory present');
assert(contracts.includes('11155111:') && contracts.includes('0x291A02126420b53eCaAE518466Ac65C8482D3feb'), 'Sepolia dexFactory live');
assert(contracts.includes('6913:') && !/6913:\s*\{[^}]*dexFactory:\s*'0x[0-9a-fA-F]{40}'/s.test(contracts), 'Boing L1 must not use 20-byte EVM dexFactory');
assert(contracts.includes('nativeConstantProductPool'), 'Boing L1 uses nativeConstantProductPool');
assert(swap.includes('getAmmVenue'), 'Swap must resolve AMM venue (Boing or Uniswap/Pancake)');
assert(swap.includes('preferBoingAmm'), 'Swap must prefer Boing AMM when factory live');
assert(swap.includes('getEvmAggregatorQuote'), 'Swap must wire LI.FI aggregator quotes');
assert(createPool.includes('getUniswapV2Compat'), 'CreatePool must fall back to Uniswap V2');
assert(deploy.includes('TokenFactory is not deployed on this network'), 'DeployToken must honest-gate missing factory');
assert(deploy.includes('isZeroEvmAddress'), 'DeployToken must use isZeroEvmAddress');
assert(agg.includes('LIFI_NATIVE') && agg.includes('isAllowedEvmTokenAddress'), 'Aggregator route must allow LI.FI native sentinel');

// TokenFactory live chains claimed by docs
for (const id of ['1', '56', '137', '8453', '10', '42161', '11155111']) {
  const re = new RegExp(`${id}:\\s*\\{[\\s\\S]*?tokenFactory:\\s*'(0x[0-9a-fA-F]{40})'`);
  const m = contracts.match(re);
  assert(m && !/^0x0+$/i.test(m[1]), `TokenFactory should be non-zero for chain ${id}`);
}

if (fails.length) {
  console.error('EVM capability wiring check FAILED:');
  for (const f of fails) console.error(' -', f);
  process.exit(1);
}
console.log('EVM capability wiring check OK');

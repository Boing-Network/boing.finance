import { pickExpressProviderForDeploy, executeBoingLaunchWizardDeploy } from './boingNativeLaunchWizardDeploy';
import { waitForBoingDeployReceiptAccount } from './boingDeployReceiptFollowup';
import { boingExpressContractCallSignSimulateSubmit } from './boingExpressNativeTx';
import { encodeNativeAmmAddLiquidityCalldataHex, encodeNativeAmmSetTokensCalldataHex } from './nativeAmmCalldata';
import { encodeNativeDexRegisterPairCalldataHex } from './nativeDexFactoryCalldata';
import { nativeAccountsAccessListJson } from './nativeAmmAccessList';
import { normalizeNativeVmTokenId32 } from './nativeVmTokenRegistry';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';

const U64_MAX = (1n << 64n) - 1n;

function parsePositiveU64(raw, label) {
  const t = String(raw ?? '').trim();
  if (!t) throw new Error(`Enter a positive integer for ${label}.`);
  let n;
  try {
    n = BigInt(t);
  } catch {
    throw new Error(`${label} must be a whole number in pool units.`);
  }
  if (n <= 0n) throw new Error(`${label} must be greater than 0.`);
  if (n > U64_MAX) throw new Error(`${label} exceeds the native AMM u64 range.`);
  return n;
}

function accessListFor(accounts) {
  const list = nativeAccountsAccessListJson(accounts);
  return list ? { access_list: list } : {};
}

async function contractCall(provider, contract, calldata, accounts) {
  return boingExpressContractCallSignSimulateSubmit(provider, {
    type: 'contract_call',
    contract,
    calldata,
    ...accessListFor(accounts),
  });
}

/**
 * Deploy a native CP pool, bind token ids, seed the first add_liquidity, and optionally register on the factory.
 * Does not claim success if deploy inclusion or seeding fails.
 *
 * @returns {Promise<{
 *   ok: boolean,
 *   code?: string,
 *   message?: string,
 *   poolId?: string | null,
 *   deployTxHash?: string,
 *   boingTxIdHex?: string | null,
 *   setTokensTxHash?: string | null,
 *   addLiquidityTxHash?: string | null,
 *   registerTxHash?: string | null,
 *   setTokensSkipped?: boolean,
 *   registerSkipped?: boolean,
 *   warnings?: string[],
 * }>}
 */
export async function createBoingNativeConstantProductPool({
  getWalletProvider,
  account,
  tokenAHex,
  tokenBHex,
  amountA,
  amountB,
  factoryHex,
  poolLabel,
  poolSymbol,
  purposeCategory,
  qaPoolAcknowledged,
  customBytecode,
  descriptionHash,
}) {
  const warnings = [];
  const tokenA = normalizeNativeVmTokenId32(tokenAHex);
  const tokenB = normalizeNativeVmTokenId32(tokenBHex);
  if (!tokenA || !tokenB) {
    return { ok: false, code: 'bad_tokens', message: 'Pick two 32-byte token account ids.' };
  }
  if (tokenA === tokenB) {
    return { ok: false, code: 'same_token', message: 'Token A and Token B must be different.' };
  }

  let amountABn;
  let amountBBn;
  try {
    amountABn = parsePositiveU64(amountA, 'Token A amount');
    amountBBn = parsePositiveU64(amountB, 'Token B amount');
  } catch (e) {
    return { ok: false, code: 'bad_amount', message: e?.message || 'Invalid amounts.' };
  }

  const provider = pickExpressProviderForDeploy(getWalletProvider);
  if (!provider) {
    return { ok: false, code: 'no_provider', message: 'Boing Express provider not found.' };
  }

  const deploy = await executeBoingLaunchWizardDeploy({
    kind: 'liquidity_pool',
    getWalletProvider,
    poolLabel: (poolLabel || '').trim() || undefined,
    poolSymbol: (poolSymbol || '').trim() || undefined,
    customBytecode,
    descriptionHash,
    purposeCategory,
    qaPoolAcknowledged,
  });
  if (!deploy.ok) {
    return {
      ok: false,
      code: deploy.code || 'deploy_failed',
      message: deploy.message,
      qaResult: deploy.qaResult,
    };
  }

  const poolId = deploy.boingTxIdHex
    ? await waitForBoingDeployReceiptAccount(deploy.boingTxIdHex, { maxAttempts: 32, delayMs: 1500 })
    : null;
  if (!poolId) {
    return {
      ok: false,
      code: 'deploy_unconfirmed',
      message:
        'Pool bytecode was submitted, but the deployed account id is not in the receipt yet. Open the transaction on boing.observer and finish set_tokens / add liquidity from Native VM if it included.',
      deployTxHash: deploy.txHash,
      boingTxIdHex: deploy.boingTxIdHex,
      poolId: null,
    };
  }

  let setTokensTxHash = null;
  let setTokensSkipped = false;
  try {
    setTokensTxHash = await contractCall(
      provider,
      poolId,
      encodeNativeAmmSetTokensCalldataHex(tokenA, tokenB),
      [account, poolId, tokenA, tokenB]
    );
  } catch (e) {
    setTokensSkipped = true;
    warnings.push(
      `set_tokens did not land (${formatBoingExpressRpcError(e)}). v1 ledger-only pools skip this; add liquidity may still work.`
    );
  }

  let addLiquidityTxHash = null;
  try {
    addLiquidityTxHash = await contractCall(
      provider,
      poolId,
      encodeNativeAmmAddLiquidityCalldataHex(amountABn, amountBBn, 0n),
      [account, poolId, tokenA, tokenB]
    );
  } catch (e) {
    return {
      ok: false,
      code: 'add_liquidity_failed',
      message: `Pool deployed at ${poolId}, but the first add_liquidity failed: ${formatBoingExpressRpcError(e)}`,
      poolId,
      deployTxHash: deploy.txHash,
      boingTxIdHex: deploy.boingTxIdHex,
      setTokensTxHash,
      setTokensSkipped,
      warnings,
    };
  }

  const factory = normalizeNativeVmTokenId32(factoryHex || '');
  let registerTxHash = null;
  let registerSkipped = !factory;
  if (factory) {
    try {
      registerTxHash = await contractCall(
        provider,
        factory,
        encodeNativeDexRegisterPairCalldataHex(tokenA, tokenB, poolId),
        [account, factory, poolId, tokenA, tokenB]
      );
    } catch (e) {
      registerSkipped = true;
      warnings.push(
        `Factory register_pair failed (${formatBoingExpressRpcError(e)}). The pool exists; an operator who controls the factory can register it later.`
      );
    }
  } else {
    warnings.push('No native DEX factory id is published on this network, so the pair was not registered for discovery.');
  }

  return {
    ok: true,
    poolId,
    deployTxHash: deploy.txHash,
    boingTxIdHex: deploy.boingTxIdHex,
    setTokensTxHash,
    addLiquidityTxHash,
    registerTxHash,
    setTokensSkipped,
    registerSkipped,
    warnings,
  };
}

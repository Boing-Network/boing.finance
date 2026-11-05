/**
 * Create a Boing Network fungible token (reference template v2) via Boing Express.
 *
 * One transaction: mint-at-deploy init sets admin = deployer, credits the whole supply,
 * marks mint_first used, and (when configured) claims the token in the linked NFT↔token registry.
 */
import { transactionIdFromSignedTransactionHex } from '@boing-network/boing-sdk';
import { BOING_QA_PURPOSE_TOKEN } from '../config/boingQa';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';
import { boingWalletMissingMessage } from '../utils/boingWalletDiscovery';
import { waitForBoingTxReceipt } from './boingDeployReceiptFollowup';
import {
  boingExpressSignDeployMeta,
  fetchBoingAccountNonceString,
} from './boingExpressNativeTx';
import {
  buildBoingLaunchIntegrationInput,
  pickExpressProviderForDeploy,
  preflightBoingLaunchInput,
} from './boingNativeLaunchWizardDeploy';
import { submitBoingSignedTransaction } from './boingNativeVm';
import { normalizeBoingFaucetAccountHex } from './boingTestnetRpc';
import { buildBoingTokenV2LaunchTx, parseBoingTokenV2Supply } from './boingTokenV2Launch';
import { resolveLinkedNftTokenClaimRegistryHex } from './linkedNftTokenRegistry';
import { rememberDeployedNativeVmToken } from './nativeVmTokenRegistry';

export { getBundledNativeFungibleBytecodeHex, computeEffectiveNativeDeployBytecode } from './boingNativeLaunchWizardDeploy';

async function submitSigned(signedHex) {
  const sub = await submitBoingSignedTransaction(signedHex);
  return sub && typeof sub === 'object' && sub.tx_hash != null ? String(sub.tx_hash) : String(sub);
}

/**
 * @param {object} input
 * @param {() => import('ethers').Eip1193Provider | null} input.getWalletProvider
 * @param {string} input.account
 * @param {string} input.name
 * @param {string} input.symbol
 * @param {string|number} input.supply — whole tokens (v2 has no decimals)
 * @param {string} [input.customBytecode]
 * @param {string} [input.descriptionHash]
 * @param {boolean} [input.qaPoolAcknowledged]
 * @param {(stage: 'qa' | 'sign' | 'submit' | 'confirm') => void} [input.onStage]
 * @returns {Promise<
 *   | { ok: true, txHash: string, boingTxIdHex: string | null, tokenHex: string, supply: string,
 *       confirmed: boolean, qaResult: object }
 *   | { ok: false, code: string, message: string, qaResult?: object, txHash?: string, tokenHex?: string }
 * >}
 */
export async function createBoingNativeToken({
  getWalletProvider,
  account,
  name,
  symbol,
  supply,
  customBytecode = '',
  descriptionHash = '',
  qaPoolAcknowledged = false,
  onStage,
}) {
  let input;
  let supplyBn;
  try {
    input = buildBoingLaunchIntegrationInput('token', {
      tokenName: name,
      tokenSymbol: symbol,
      customBytecode,
      descriptionHash,
      purpose: BOING_QA_PURPOSE_TOKEN,
    });
    supplyBn = parseBoingTokenV2Supply(supply);
  } catch (e) {
    return { ok: false, code: 'invalid_input', message: e?.message || 'Could not build the token deploy.' };
  }

  const sender = normalizeBoingFaucetAccountHex(account || '');
  if (!sender) {
    return { ok: false, code: 'no_account', message: 'Connect Boing Express (no Boing account found).' };
  }
  const provider = pickExpressProviderForDeploy(getWalletProvider);
  if (!provider) {
    return { ok: false, code: 'no_provider', message: boingWalletMissingMessage() };
  }

  onStage?.('qa');
  const claimRegistryHex = resolveLinkedNftTokenClaimRegistryHex();
  let launch;
  try {
    const nonce = await fetchBoingAccountNonceString(sender);
    launch = buildBoingTokenV2LaunchTx({
      senderHex: sender,
      nonce,
      name: input.name,
      symbol: input.symbol,
      supply: supplyBn,
      purpose: input.purpose,
      descriptionHashHex: input.descriptionHashHex,
      runtimeHexOverride: input.bytecodeHexOverride,
      claimRegistryHex,
    });
  } catch (e) {
    return { ok: false, code: 'prepare_failed', message: e?.message || 'Could not prepare the deploy.' };
  }

  let pre;
  try {
    pre = (await preflightBoingLaunchInput({ ...input, bytecodeHexOverride: launch.deployTx.bytecode })).qa;
  } catch (e) {
    return { ok: false, code: 'qa_rpc_failed', message: e?.message || 'QA preflight (boing_qaCheck) failed.' };
  }
  if (pre.result === 'reject') {
    return {
      ok: false,
      code: 'qa_reject',
      message: pre.message || 'QA rejected — fix name, symbol, or Advanced bytecode.',
      qaResult: pre,
    };
  }
  if (pre.result === 'unsure' && !qaPoolAcknowledged) {
    return {
      ok: false,
      code: 'qa_unsure_unack',
      message: 'QA returned “unsure” — confirm the community QA pool checkbox, then try again.',
      qaResult: pre,
    };
  }

  let signedDeploy;
  try {
    onStage?.('sign');
    signedDeploy = await boingExpressSignDeployMeta(provider, launch.deployTx);
  } catch (e) {
    return { ok: false, code: 'sign_failed', message: formatBoingExpressRpcError(e), qaResult: pre };
  }

  const boingTxIdHex = (() => {
    try {
      return transactionIdFromSignedTransactionHex(signedDeploy);
    } catch {
      return null;
    }
  })();

  onStage?.('submit');
  let txHash;
  try {
    txHash = await submitSigned(signedDeploy);
  } catch (e) {
    return { ok: false, code: 'send_failed', message: formatBoingExpressRpcError(e), qaResult: pre };
  }

  onStage?.('confirm');
  const receipt = await waitForBoingTxReceipt(boingTxIdHex, { maxAttempts: 40, delayMs: 1200 });
  if (receipt && receipt.success === false) {
    return {
      ok: false,
      code: 'deploy_failed',
      message: `The deploy failed on chain${receipt.error ? `: ${receipt.error}` : '.'}`,
      txHash,
      tokenHex: launch.tokenHex,
      qaResult: pre,
    };
  }

  rememberDeployedNativeVmToken({
    id: launch.tokenHex,
    symbol: input.symbol,
    name: input.name,
  });

  return {
    ok: true,
    txHash,
    boingTxIdHex,
    tokenHex: launch.tokenHex,
    supply: launch.supply.toString(),
    confirmed: Boolean(receipt),
    qaResult: pre,
  };
}

/**
 * Create many tokens one after another (each needs its own Express approval).
 * Stops on the first hard failure unless `continueOnError` is true.
 *
 * @param {object} input
 * @param {Array<{ name: string, symbol: string, supply: string }>} input.rows
 * @param {(info: { index: number, total: number, row: object, result?: object }) => void} [input.onProgress]
 * @param {boolean} [input.continueOnError]
 * @param {Omit<Parameters<typeof createBoingNativeToken>[0], 'name'|'symbol'|'supply'|'onStage'>} input.shared
 */
export async function createBoingNativeTokenBatch({
  rows,
  onProgress,
  continueOnError = false,
  ...shared
}) {
  const list = Array.isArray(rows) ? rows : [];
  const results = [];
  for (let i = 0; i < list.length; i += 1) {
    const row = list[i];
    onProgress?.({ index: i, total: list.length, row, phase: 'start' });
    const result = await createBoingNativeToken({
      ...shared,
      name: row.name,
      symbol: row.symbol,
      supply: row.supply,
    });
    results.push({ row, result });
    onProgress?.({ index: i, total: list.length, row, result, phase: 'done' });
    if (!result.ok && !continueOnError) break;
  }
  return results;
}

/**
 * Create a Boing Network fungible token (reference template v2) via Boing Express.
 *
 * One transaction: mint-at-deploy init sets admin = deployer, credits the whole supply,
 * marks mint_first used, and (when configured) claims the token in the linked NFT↔token registry.
 *
 * Platform fee (percent of initial mint) is planned in {@link planCreateTokenPlatformFee}.
 * When a fee recipient is configured and feeAmount > 0, a follow-up reference-token transfer
 * collects the fee share (separate Express approval). Live builds use the committed treasury
 * AccountId (overridable via `REACT_APP_CREATE_TOKEN_FEE_RECIPIENT`).
 */
import {
  bytesToHex,
  encodeReferenceTransferCalldata,
  transactionIdFromSignedTransactionHex,
  validateHex32,
} from '@boing-network/boing-sdk';
import { BOING_QA_PURPOSE_TOKEN } from '../config/boingQa';
import { planCreateTokenPlatformFee } from '../config/createTokenFee';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';
import { boingWalletMissingMessage } from '../utils/boingWalletDiscovery';
import { waitForBoingTxReceipt } from './boingDeployReceiptFollowup';
import {
  boingExpressSignDeployMeta,
  boingExpressSignTransaction,
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
 * Optional post-create transfer of the platform fee share to the treasury AccountId.
 * No-op (skipped) when fee is 0 or recipient is unset.
 *
 * @param {object} input
 * @param {() => import('ethers').Eip1193Provider | null} input.getWalletProvider
 * @param {string} input.account
 * @param {string} input.tokenHex
 * @param {ReturnType<typeof planCreateTokenPlatformFee>} input.feePlan
 * @param {(stage: 'fee_sign' | 'fee_submit' | 'fee_confirm') => void} [input.onStage]
 */
export async function collectCreateTokenPlatformFee({
  getWalletProvider,
  account,
  tokenHex,
  feePlan,
  onStage,
}) {
  if (!feePlan?.collectionReady || feePlan.feeAmount <= 0n) {
    return {
      ok: true,
      skipped: true,
      reason: feePlan?.recipient ? 'fee_zero' : 'recipient_unset',
      feePlan,
    };
  }
  const sender = normalizeBoingFaucetAccountHex(account || '');
  if (!sender) {
    return { ok: false, skipped: false, code: 'no_account', message: 'Connect Boing Express to pay the platform fee.', feePlan };
  }
  const provider = pickExpressProviderForDeploy(getWalletProvider);
  if (!provider) {
    return { ok: false, skipped: false, code: 'no_provider', message: boingWalletMissingMessage(), feePlan };
  }
  let token;
  let to;
  try {
    token = validateHex32(tokenHex).toLowerCase();
    to = validateHex32(feePlan.recipient).toLowerCase();
  } catch (e) {
    return { ok: false, skipped: false, code: 'invalid_fee_accounts', message: e?.message || 'Invalid fee recipient or token.', feePlan };
  }

  try {
    const nonce = await fetchBoingAccountNonceString(sender);
    const tx = {
      type: 'contract_call',
      contract: token,
      calldata: bytesToHex(encodeReferenceTransferCalldata(to, feePlan.feeAmount)),
      access_list: { read: [sender, token, to], write: [sender, token, to] },
      nonce: String(nonce),
    };
    onStage?.('fee_sign');
    const signed = await boingExpressSignTransaction(provider, tx);
    const boingTxIdHex = (() => {
      try {
        return transactionIdFromSignedTransactionHex(signed);
      } catch {
        return null;
      }
    })();
    onStage?.('fee_submit');
    const txHash = await submitSigned(signed);
    onStage?.('fee_confirm');
    const receipt = await waitForBoingTxReceipt(boingTxIdHex, { maxAttempts: 40, delayMs: 1200 });
    if (receipt && receipt.success === false) {
      return {
        ok: false,
        skipped: false,
        code: 'fee_transfer_failed',
        message: `Platform fee transfer failed on chain${receipt.error ? `: ${receipt.error}` : '.'}`,
        txHash,
        boingTxIdHex,
        feePlan,
      };
    }
    return { ok: true, skipped: false, txHash, boingTxIdHex, confirmed: Boolean(receipt), feePlan };
  } catch (e) {
    return {
      ok: false,
      skipped: false,
      code: 'fee_transfer_error',
      message: formatBoingExpressRpcError(e),
      feePlan,
    };
  }
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
 * @param {boolean} [input.collectPlatformFee=true] — attempt fee transfer when recipient is configured
 * @param {(stage: 'qa' | 'sign' | 'submit' | 'confirm' | 'fee_sign' | 'fee_submit' | 'fee_confirm') => void} [input.onStage]
 * @returns {Promise<
 *   | { ok: true, txHash: string, boingTxIdHex: string | null, tokenHex: string, supply: string,
 *       confirmed: boolean, qaResult: object, platformFee: object, feeCollection?: object }
 *   | { ok: false, code: string, message: string, qaResult?: object, txHash?: string, tokenHex?: string,
 *       platformFee?: object, feeCollection?: object }
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
  collectPlatformFee = true,
  onStage,
}) {
  let input;
  let supplyBn;
  let platformFee;
  try {
    input = buildBoingLaunchIntegrationInput('token', {
      tokenName: name,
      tokenSymbol: symbol,
      customBytecode,
      descriptionHash,
      purpose: BOING_QA_PURPOSE_TOKEN,
    });
    supplyBn = parseBoingTokenV2Supply(supply);
    platformFee = planCreateTokenPlatformFee(supplyBn);
  } catch (e) {
    return { ok: false, code: 'invalid_input', message: e?.message || 'Could not build the token deploy.' };
  }

  const sender = normalizeBoingFaucetAccountHex(account || '');
  if (!sender) {
    return { ok: false, code: 'no_account', message: 'Connect Boing Express (no Boing account found).', platformFee };
  }
  const provider = pickExpressProviderForDeploy(getWalletProvider);
  if (!provider) {
    return { ok: false, code: 'no_provider', message: boingWalletMissingMessage(), platformFee };
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
    return { ok: false, code: 'prepare_failed', message: e?.message || 'Could not prepare the deploy.', platformFee };
  }

  let pre;
  try {
    pre = (await preflightBoingLaunchInput({ ...input, bytecodeHexOverride: launch.deployTx.bytecode })).qa;
  } catch (e) {
    return { ok: false, code: 'qa_rpc_failed', message: e?.message || 'QA preflight (boing_qaCheck) failed.', platformFee };
  }
  if (pre.result === 'reject') {
    return {
      ok: false,
      code: 'qa_reject',
      message: pre.message || 'QA rejected — fix name, symbol, or Advanced bytecode.',
      qaResult: pre,
      platformFee,
    };
  }
  if (pre.result === 'unsure' && !qaPoolAcknowledged) {
    return {
      ok: false,
      code: 'qa_unsure_unack',
      message: 'QA returned “unsure” — confirm the community QA pool checkbox, then try again.',
      qaResult: pre,
      platformFee,
    };
  }

  let signedDeploy;
  try {
    onStage?.('sign');
    signedDeploy = await boingExpressSignDeployMeta(provider, launch.deployTx);
  } catch (e) {
    return { ok: false, code: 'sign_failed', message: formatBoingExpressRpcError(e), qaResult: pre, platformFee };
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
    return { ok: false, code: 'send_failed', message: formatBoingExpressRpcError(e), qaResult: pre, platformFee };
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
      platformFee,
    };
  }

  rememberDeployedNativeVmToken({
    id: launch.tokenHex,
    symbol: input.symbol,
    name: input.name,
  });

  let feeCollection;
  if (collectPlatformFee && platformFee.collectionReady) {
    feeCollection = await collectCreateTokenPlatformFee({
      getWalletProvider,
      account: sender,
      tokenHex: launch.tokenHex,
      feePlan: platformFee,
      onStage,
    });
  } else {
    feeCollection = {
      ok: true,
      skipped: true,
      reason: platformFee.recipient ? 'collect_disabled' : 'recipient_unset',
      feePlan: platformFee,
    };
  }

  return {
    ok: true,
    txHash,
    boingTxIdHex,
    tokenHex: launch.tokenHex,
    supply: launch.supply.toString(),
    confirmed: Boolean(receipt),
    qaResult: pre,
    platformFee,
    feeCollection,
  };
}

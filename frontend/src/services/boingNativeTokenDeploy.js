import { transactionIdFromSignedTransactionHex } from 'boing-sdk';
import { BOING_QA_PURPOSE_TOKEN } from '../config/boingQa';
import {
  buildBoingLaunchIntegrationInput,
  pickExpressProviderForDeploy,
  preflightBoingLaunchInput,
  preflightBoingLaunchWizardByKind,
} from './boingNativeLaunchWizardDeploy';
import {
  boingExpressSignDeployMeta,
  boingExpressSignTransaction,
  fetchBoingAccountNonceString,
} from './boingExpressNativeTx';
import { submitBoingSignedTransaction } from './boingNativeVm';
import { normalizeBoingFaucetAccountHex } from './boingTestnetRpc';
import { waitForBoingTxReceipt } from './boingDeployReceiptFollowup';
import { buildBoingTokenV2LaunchTxs, parseBoingTokenV2Supply } from './boingTokenV2Launch';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';
import { boingWalletMissingMessage } from '../utils/boingWalletDiscovery';

export {
  pickExpressProviderForDeploy,
  getBundledNativeFungibleBytecodeHex,
  computeEffectiveNativeDeployBytecode,
  LEGACY_FUNGIBLE_BYTECODE_ENV,
} from './boingNativeLaunchWizardDeploy';

/**
 * Build the Boing token v2 `contract_deploy_meta` and run `boing_qaCheck` on it.
 *
 * @param {object} input
 * @param {string} input.tokenName
 * @param {string} input.tokenSymbol
 * @param {string} [input.customBytecode]
 * @param {string} [input.descriptionHash]
 * @param {string} [input.purpose]
 * @returns {Promise<{ result: string, message?: string, rule_id?: string }>}
 */
export async function preflightReferenceFungibleDeployQa({
  tokenName,
  tokenSymbol,
  customBytecode = '',
  descriptionHash = '',
  purpose = BOING_QA_PURPOSE_TOKEN,
}) {
  const { qa } = await preflightBoingLaunchWizardByKind('token', {
    tokenName,
    tokenSymbol,
    customBytecode,
    descriptionHash,
    purpose,
  });
  return qa;
}

async function submitSigned(signedHex) {
  const sub = await submitBoingSignedTransaction(signedHex);
  return sub && typeof sub === 'object' && sub.tx_hash != null ? String(sub.tx_hash) : String(sub);
}

/**
 * Launch a Boing token v2: QA, then Express signs the deploy (nonce n) and the one-time `mint_first`
 * of the whole supply to the deployer (nonce n+1); both are signed before either is submitted.
 *
 * @param {object} input
 * @param {() => import('ethers').Eip1193Provider | null} input.getWalletProvider
 * @param {string} input.senderHex — connected Boing account
 * @param {string} input.tokenName
 * @param {string} input.tokenSymbol
 * @param {string|number} input.initialSupply — whole tokens
 * @param {string} [input.customBytecode]
 * @param {string} [input.descriptionHash]
 * @param {boolean} [input.qaPoolAcknowledged]
 * @param {(stage: 'qa' | 'sign_deploy' | 'sign_mint' | 'submit' | 'confirm') => void} [input.onStage]
 * @returns {Promise<
 *   | { ok: true, txHash: string, boingTxIdHex: string | null, mintTxIdHex: string | null, tokenHex: string,
 *       supply: string, mintConfirmed: boolean, mintError: string | null, qaResult: object }
 *   | { ok: false, code: string, message: string, qaResult?: object }
 * >}
 */
export async function executeBoingNativeTokenDeploy({
  getWalletProvider,
  senderHex,
  tokenName,
  tokenSymbol,
  initialSupply,
  customBytecode = '',
  descriptionHash = '',
  qaPoolAcknowledged = false,
  onStage,
}) {
  let input;
  let supply;
  try {
    input = buildBoingLaunchIntegrationInput('token', {
      tokenName,
      tokenSymbol,
      customBytecode,
      descriptionHash,
      purpose: BOING_QA_PURPOSE_TOKEN,
    });
    supply = parseBoingTokenV2Supply(initialSupply);
  } catch (e) {
    return { ok: false, code: 'invalid_input', message: e?.message || 'Could not build deploy transaction.' };
  }
  const sender = normalizeBoingFaucetAccountHex(senderHex || '');
  if (!sender) {
    return { ok: false, code: 'no_account', message: 'Connect Boing Express (no Boing account found).' };
  }
  const p = pickExpressProviderForDeploy(getWalletProvider);
  if (!p) return { ok: false, code: 'no_provider', message: boingWalletMissingMessage() };

  onStage?.('qa');
  let pre;
  try {
    pre = (await preflightBoingLaunchInput(input)).qa;
  } catch (e) {
    return { ok: false, code: 'qa_rpc_failed', message: e?.message || 'QA preflight (boing_qaCheck) failed.' };
  }
  if (pre.result === 'reject') {
    return { ok: false, code: 'qa_reject', message: pre.message || 'QA rejected — fix bytecode or metadata.', qaResult: pre };
  }
  if (pre.result === 'unsure' && !qaPoolAcknowledged) {
    return {
      ok: false,
      code: 'qa_unsure_unack',
      message: 'QA returned “unsure” — confirm the community QA pool checkbox, then deploy again.',
      qaResult: pre,
    };
  }

  let launch;
  try {
    const nonce = await fetchBoingAccountNonceString(sender);
    launch = buildBoingTokenV2LaunchTxs({
      senderHex: sender,
      nonce,
      name: input.name,
      symbol: input.symbol,
      supply,
      purpose: input.purpose,
      descriptionHashHex: input.descriptionHashHex,
      bytecodeHexOverride: input.bytecodeHexOverride,
    });
  } catch (e) {
    return { ok: false, code: 'prepare_failed', message: e?.message || 'Could not prepare the deploy.', qaResult: pre };
  }

  let signedDeploy;
  let signedMint;
  try {
    onStage?.('sign_deploy');
    signedDeploy = await boingExpressSignDeployMeta(p, launch.deployTx);
    onStage?.('sign_mint');
    signedMint = await boingExpressSignTransaction(p, launch.mintTx);
  } catch (e) {
    // Nothing was submitted.
    return { ok: false, code: 'sign_failed', message: formatBoingExpressRpcError(e), qaResult: pre };
  }

  const boingTxIdHex = (() => {
    try {
      return transactionIdFromSignedTransactionHex(signedDeploy);
    } catch {
      return null;
    }
  })();
  const mintTxIdHex = (() => {
    try {
      return transactionIdFromSignedTransactionHex(signedMint);
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

  const base = {
    ok: true,
    txHash,
    boingTxIdHex,
    mintTxIdHex,
    tokenHex: launch.tokenHex,
    supply: launch.supply.toString(),
    qaResult: pre,
  };

  let mintError = null;
  try {
    await submitSigned(signedMint);
  } catch (e) {
    // The node may refuse nonce n+1 until the deploy is in a block: wait for it, then resubmit once.
    const deployReceipt = await waitForBoingTxReceipt(boingTxIdHex, { maxAttempts: 30, delayMs: 1200 });
    if (deployReceipt && deployReceipt.success !== false) {
      try {
        await submitSigned(signedMint);
      } catch (e2) {
        mintError = formatBoingExpressRpcError(e2);
      }
    } else {
      mintError = deployReceipt ? 'The deploy transaction failed on chain.' : formatBoingExpressRpcError(e);
    }
  }
  if (mintError) return { ...base, mintConfirmed: false, mintError };

  onStage?.('confirm');
  const mintReceipt = await waitForBoingTxReceipt(mintTxIdHex, { maxAttempts: 40, delayMs: 1200 });
  if (mintReceipt && mintReceipt.success === false) {
    return { ...base, mintConfirmed: false, mintError: 'The mint transaction failed on chain.' };
  }
  return { ...base, mintConfirmed: Boolean(mintReceipt), mintError: null };
}

import { transactionIdFromSignedTransactionHex } from '@boing-network/boing-sdk';
import { BOING_QA_PURPOSE_TOKEN } from '../config/boingQa';
import {
  buildBoingLaunchIntegrationInput,
  pickExpressProviderForDeploy,
  preflightBoingLaunchInput,
  preflightBoingLaunchWizardByKind,
} from './boingNativeLaunchWizardDeploy';
import { boingExpressSignDeployMeta, fetchBoingAccountNonceString } from './boingExpressNativeTx';
import { submitBoingSignedTransaction } from './boingNativeVm';
import { normalizeBoingFaucetAccountHex } from './boingTestnetRpc';
import { waitForBoingTxReceipt } from './boingDeployReceiptFollowup';
import { buildBoingTokenV2LaunchTx, parseBoingTokenV2Supply } from './boingTokenV2Launch';
import { resolveLinkedNftTokenClaimRegistryHex } from './linkedNftTokenRegistry';
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

/** Linked NFT↔token registry the new token claims itself in (null = none configured for this network). */
function tokenClaimRegistryHex() {
  return resolveLinkedNftTokenClaimRegistryHex();
}

/**
 * Launch a Boing token v2 in ONE transaction (one Express signature): the v2 runtime wrapped in `0xFD`
 * init code that, inside the deploy, sets admin = the deployer, credits the whole supply to the deployer,
 * marks `mint_first` as used and claims the token for the deployer in the linked NFT↔token registry v2
 * (`buildBoingTokenV2LaunchTx`). There is no separate mint transaction, so nobody can call the new token
 * before its supply and admin are in place.
 *
 * @param {object} input
 * @param {() => import('ethers').Eip1193Provider | null} input.getWalletProvider
 * @param {string} input.senderHex — connected Boing account
 * @param {string} input.tokenName
 * @param {string} input.tokenSymbol
 * @param {string|number} input.initialSupply — whole tokens
 * @param {string} [input.customBytecode] — Advanced: runtime with the v1/v2 reference fungible storage layout
 * @param {string} [input.descriptionHash]
 * @param {boolean} [input.qaPoolAcknowledged]
 * @param {(stage: 'qa' | 'sign' | 'submit' | 'confirm') => void} [input.onStage]
 * @returns {Promise<
 *   | { ok: true, txHash: string, boingTxIdHex: string | null, tokenHex: string, supply: string,
 *       confirmed: boolean, claimRegistryHex: string | null, qaResult: object }
 *   | { ok: false, code: string, message: string, qaResult?: object, txHash?: string, tokenHex?: string }
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
  const claimRegistryHex = tokenClaimRegistryHex();
  let launch;
  try {
    const nonce = await fetchBoingAccountNonceString(sender);
    launch = buildBoingTokenV2LaunchTx({
      senderHex: sender,
      nonce,
      name: input.name,
      symbol: input.symbol,
      supply,
      purpose: input.purpose,
      descriptionHashHex: input.descriptionHashHex,
      runtimeHexOverride: input.bytecodeHexOverride,
      claimRegistryHex,
    });
  } catch (e) {
    return { ok: false, code: 'prepare_failed', message: e?.message || 'Could not prepare the deploy.' };
  }

  // QA the exact bytecode that will be signed (init + runtime).
  let pre;
  try {
    pre = (await preflightBoingLaunchInput({ ...input, bytecodeHexOverride: launch.deployTx.bytecode })).qa;
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

  let signedDeploy;
  try {
    onStage?.('sign');
    signedDeploy = await boingExpressSignDeployMeta(p, launch.deployTx);
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
      message: `The deploy transaction failed on chain${receipt.error ? `: ${receipt.error}` : '.'}`,
      txHash,
      tokenHex: launch.tokenHex,
      qaResult: pre,
    };
  }
  return {
    ok: true,
    txHash,
    boingTxIdHex,
    tokenHex: launch.tokenHex,
    supply: launch.supply.toString(),
    confirmed: Boolean(receipt),
    claimRegistryHex,
    qaResult: pre,
  };
}

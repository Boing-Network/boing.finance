import {
  buildContractDeployMetaTx,
  resolveReferenceFungibleTemplateBytecodeHex,
} from 'boing-sdk';
import { qaCheckBoingDeploy } from './boingNativeVm';
import { boingExpressSendTransaction } from './boingExpressNativeTx';
import { BOING_QA_EMPTY_DESCRIPTION_HASH, BOING_QA_PURPOSE_TOKEN, isValidBoingQaPurpose } from '../config/boingQa';
import { getWindowBoingProvider } from '../utils/boingWalletDiscovery';
import { tryParseEvenLengthDeployBytecodeHex } from '../utils/boingDeployBytecodeHex';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';

const LEGACY_FUNGIBLE_BYTECODE_ENV = 'REACT_APP_BOING_REFERENCE_TOKEN_BYTECODE';

export function pickExpressProviderForDeploy(getWalletProvider) {
  try {
    const p = typeof getWalletProvider === 'function' ? getWalletProvider('boingExpress') : null;
    if (p && typeof p.request === 'function') return p;
  } catch {
    /* ignore */
  }
  return getWindowBoingProvider();
}

export function getBundledNativeFungibleBytecodeHex() {
  return (
    resolveReferenceFungibleTemplateBytecodeHex({
      extraEnvKeys: [LEGACY_FUNGIBLE_BYTECODE_ENV],
    }) ?? ''
  );
}

export function computeEffectiveNativeDeployBytecode(customBytecodeRaw, bundledBytecode) {
  const c = (customBytecodeRaw || '').trim();
  if (c) {
    return tryParseEvenLengthDeployBytecodeHex(c) ?? '';
  }
  return bundledBytecode || '';
}

/**
 * Run QA + Boing Express `contract_deploy_meta` for reference fungible template flow.
 * @param {object} input
 * @param {() => import('ethers').Eip1193Provider | null} input.getWalletProvider
 * @param {string} input.tokenName
 * @param {string} input.tokenSymbol
 * @param {string} [input.customBytecode]
 * @param {string} [input.descriptionHash]
 * @param {boolean} [input.qaPoolAcknowledged]
 * @returns {Promise<{ ok: true, txHash: string, qaResult: object } | { ok: false, code: string, message: string, qaResult?: object }>}
 */
export async function executeBoingNativeTokenDeploy({
  getWalletProvider,
  tokenName,
  tokenSymbol,
  customBytecode = '',
  descriptionHash = '',
  qaPoolAcknowledged = false,
}) {
  const purpose = BOING_QA_PURPOSE_TOKEN;
  const bundled = getBundledNativeFungibleBytecodeHex();
  const bc = computeEffectiveNativeDeployBytecode(customBytecode, bundled);

  if (!bc) {
    return {
      ok: false,
      code: 'no_bytecode',
      message:
        'No deploy bytecode — set REACT_APP_BOING_REFERENCE_FUNGIBLE_TEMPLATE_BYTECODE_HEX or paste hex under Advanced.',
    };
  }
  if (!isValidBoingQaPurpose(purpose)) {
    return { ok: false, code: 'invalid_purpose', message: 'Invalid QA purpose.' };
  }

  const name = tokenName?.trim() || '';
  const sym = (tokenSymbol?.trim() || '').toUpperCase();
  if (!name || !sym) {
    return { ok: false, code: 'missing_meta', message: 'Token name and symbol are required.' };
  }

  const p = pickExpressProviderForDeploy(getWalletProvider);
  if (!p) {
    return { ok: false, code: 'no_provider', message: 'Boing Express provider not found.' };
  }

  const pre = await qaCheckBoingDeploy(bc, {
    purposeCategory: purpose,
    descriptionHash: descriptionHash.trim() || undefined,
    assetName: name,
    assetSymbol: sym,
    emptyDescriptionHash: BOING_QA_EMPTY_DESCRIPTION_HASH,
  });

  if (pre.result === 'reject') {
    return {
      ok: false,
      code: 'qa_reject',
      message: pre.message || 'QA rejected — fix bytecode or metadata.',
      qaResult: pre,
    };
  }
  if (pre.result === 'unsure' && !qaPoolAcknowledged) {
    return {
      ok: false,
      code: 'qa_unsure_unack',
      message:
        'QA returned “unsure” — confirm the community QA pool checkbox, then deploy again.',
      qaResult: pre,
    };
  }

  try {
    const tx = buildContractDeployMetaTx({
      bytecodeHex: bc,
      assetName: name,
      assetSymbol: sym,
      purposeCategory: purpose,
      descriptionHashHex: descriptionHash.trim() || undefined,
    });
    const hash = await boingExpressSendTransaction(p, tx);
    const txHash = typeof hash === 'string' ? hash : JSON.stringify(hash);
    return { ok: true, txHash, qaResult: pre };
  } catch (e) {
    return {
      ok: false,
      code: 'send_failed',
      message: formatBoingExpressRpcError(e),
      qaResult: pre,
    };
  }
}

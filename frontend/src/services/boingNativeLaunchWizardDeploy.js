import { ethers } from 'ethers';
import {
  preflightBoingIntegrationDeploy,
  resolveNativeConstantProductPoolBytecodeHex,
  resolveReferenceFungibleTemplateBytecodeHex,
  resolveReferenceNftCollectionTemplateBytecodeHex,
} from 'boing-sdk';
import { createBoingBrowserRpcClient } from './boingTestnetRpc';
import { boingExpressSendTransaction } from './boingExpressNativeTx';
import { BOING_QA_PURPOSE_TOKEN, isValidBoingQaPurpose } from '../config/boingQa';
import { getWindowBoingProvider } from '../utils/boingWalletDiscovery';
import { tryParseEvenLengthDeployBytecodeHex } from '../utils/boingDeployBytecodeHex';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';

export const LEGACY_FUNGIBLE_BYTECODE_ENV = 'REACT_APP_BOING_REFERENCE_TOKEN_BYTECODE';
/** Optional extra env name for NFT collection template (SDK already checks REACT_APP_BOING_REFERENCE_NFT_COLLECTION_TEMPLATE_BYTECODE_HEX). */
export const LEGACY_NFT_BYTECODE_ENV = 'REACT_APP_BOING_REFERENCE_NFT_BYTECODE_HEX';

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

export function getBundledNativeNftCollectionBytecodeHex() {
  return (
    resolveReferenceNftCollectionTemplateBytecodeHex({
      extraEnvKeys: [LEGACY_NFT_BYTECODE_ENV],
    }) ?? ''
  );
}

export function getBundledNativePoolBytecodeHex() {
  return resolveNativeConstantProductPoolBytecodeHex() ?? '';
}

export function computeEffectiveNativeDeployBytecode(customBytecodeRaw, bundledBytecode) {
  const c = (customBytecodeRaw || '').trim();
  if (c) {
    return tryParseEvenLengthDeployBytecodeHex(c) ?? '';
  }
  return bundledBytecode || '';
}

/**
 * Fetches `boing_chainHeight` for timelock unlock height and derives `mintFirstTotalSupplyWei` when
 * max-wallet % needs supply (see `buildReferenceFungibleSecuredDeployMetaTx` in boing-sdk).
 *
 * @param {Record<string, unknown>} fields
 * @returns {Promise<Record<string, unknown>>}
 */
export async function enrichBoingTokenLaunchFields(fields) {
  const n = fields.nativeTokenSecurity;
  const out = { ...fields };
  if (!n || typeof n !== 'object') return out;

  const client = createBoingBrowserRpcClient();
  if (n.timelock) {
    const h = await client.chainHeight();
    out.chainContext = { chainHeight: BigInt(h) };
  }

  const wantPct =
    (n.maxWallet || n.antiWhale) &&
    typeof n.maxWalletPercentage === 'string' &&
    n.maxWalletPercentage.trim() !== '';
  if (wantPct) {
    const rawSupply = fields.initialSupply;
    const dec = fields.tokenDecimals;
    if (rawSupply != null && String(rawSupply).trim() !== '' && dec != null && Number(dec) >= 0) {
      try {
        out.mintFirstTotalSupplyWei = ethers.parseUnits(String(rawSupply).trim() || '0', Number(dec));
      } catch {
        /* SDK may fall back to maxTxAmount for wallet cap */
      }
    }
  }
  return out;
}

/**
 * @param {'token' | 'nft' | 'liquidity_pool'} kind
 * @param {Record<string, unknown>} fields
 */
export function buildBoingLaunchIntegrationInput(kind, fields) {
  switch (kind) {
    case 'token': {
      const tokenName = fields.tokenName;
      const tokenSymbol = fields.tokenSymbol;
      const customBytecode = fields.customBytecode ?? '';
      const descriptionHash = fields.descriptionHash ?? '';
      const nativeTokenSecurity = fields.nativeTokenSecurity;
      const purpose = fields.purpose ?? BOING_QA_PURPOSE_TOKEN;
      const name = typeof tokenName === 'string' ? tokenName.trim() : '';
      const sym = typeof tokenSymbol === 'string' ? tokenSymbol.trim().toUpperCase() : '';
      if (!name || !sym) {
        throw new Error('Token name and symbol are required.');
      }
      if (!isValidBoingQaPurpose(purpose)) {
        throw new Error('Invalid QA purpose.');
      }
      const bundled = getBundledNativeFungibleBytecodeHex();
      const bc = computeEffectiveNativeDeployBytecode(customBytecode, bundled);
      if (!bc) {
        throw new Error(
          'No deploy bytecode — set REACT_APP_BOING_REFERENCE_FUNGIBLE_TEMPLATE_BYTECODE_HEX or paste hex under Advanced.',
        );
      }
      const custom = (customBytecode || '').trim();
      const bytecodeHexOverride = custom ? tryParseEvenLengthDeployBytecodeHex(customBytecode) || undefined : undefined;
      if (custom && !bytecodeHexOverride) {
        throw new Error('Invalid bytecode: use even-length hex (optional 0x prefix).');
      }
      return {
        kind: 'token',
        assetName: name,
        assetSymbol: sym,
        purposeCategory: purpose,
        descriptionHashHex: descriptionHash.trim() || undefined,
        nativeTokenSecurity:
          nativeTokenSecurity && typeof nativeTokenSecurity === 'object' ? nativeTokenSecurity : undefined,
        chainContext: fields.chainContext,
        mintFirstTotalSupplyWei: fields.mintFirstTotalSupplyWei,
        bytecodeHexOverride,
        extraEnvKeys: [LEGACY_FUNGIBLE_BYTECODE_ENV],
      };
    }
    case 'nft': {
      const collectionName = fields.collectionName;
      const collectionSymbol = fields.collectionSymbol;
      const customBytecode = fields.customBytecode ?? '';
      const descriptionHash = fields.descriptionHash ?? '';
      const purpose = fields.purpose ?? 'nft';
      const name = typeof collectionName === 'string' ? collectionName.trim() : '';
      const sym = typeof collectionSymbol === 'string' ? collectionSymbol.trim().toUpperCase() : '';
      if (!name || !sym) {
        throw new Error('Collection name and symbol are required.');
      }
      if (!isValidBoingQaPurpose(purpose)) {
        throw new Error('Invalid QA purpose.');
      }
      const bundled = getBundledNativeNftCollectionBytecodeHex();
      const bc = computeEffectiveNativeDeployBytecode(customBytecode, bundled);
      if (!bc) {
        throw new Error(
          'No collection bytecode — set REACT_APP_BOING_REFERENCE_NFT_COLLECTION_TEMPLATE_BYTECODE_HEX or paste hex under Advanced.',
        );
      }
      const custom = (customBytecode || '').trim();
      const bytecodeHexOverride = custom ? tryParseEvenLengthDeployBytecodeHex(customBytecode) || undefined : undefined;
      if (custom && !bytecodeHexOverride) {
        throw new Error('Invalid bytecode: use even-length hex (optional 0x prefix).');
      }
      return {
        kind: 'nft',
        collectionName: name,
        collectionSymbol: sym,
        purposeCategory: purpose,
        descriptionHashHex: descriptionHash.trim() || undefined,
        bytecodeHexOverride,
        extraEnvKeys: [LEGACY_NFT_BYTECODE_ENV],
      };
    }
    case 'liquidity_pool': {
      const poolLabel = fields.poolLabel;
      const poolSymbol = fields.poolSymbol;
      const customBytecode = fields.customBytecode ?? '';
      const descriptionHash = fields.descriptionHash ?? '';
      const rawPurpose = fields.purposeCategory;
      const purposeCategory =
        rawPurpose != null && String(rawPurpose).trim()
          ? String(rawPurpose).trim().toLowerCase()
          : 'dapp';
      if (!isValidBoingQaPurpose(purposeCategory)) {
        throw new Error('Invalid QA purpose for pool deploy.');
      }
      const bundled = getBundledNativePoolBytecodeHex();
      const bc = computeEffectiveNativeDeployBytecode(customBytecode, bundled);
      if (!bc) {
        throw new Error(
          'No pool bytecode — set BOING_NATIVE_AMM_BYTECODE_HEX (or REACT_APP_/VITE_ variant) or paste hex under Advanced.',
        );
      }
      const custom = (customBytecode || '').trim();
      const bytecodeHexOverride = custom ? tryParseEvenLengthDeployBytecodeHex(customBytecode) || undefined : undefined;
      if (custom && !bytecodeHexOverride) {
        throw new Error('Invalid bytecode: use even-length hex (optional 0x prefix).');
      }
      const out = {
        kind: 'liquidity_pool',
        purposeCategory,
        descriptionHashHex: descriptionHash.trim() || undefined,
        bytecodeHexOverride,
      };
      if (typeof poolLabel === 'string' && poolLabel.trim()) {
        out.poolLabel = poolLabel.trim();
      }
      if (typeof poolSymbol === 'string' && poolSymbol.trim()) {
        out.poolSymbol = poolSymbol.trim();
      }
      return out;
    }
    default:
      throw new Error(`Unknown launch kind: ${String(kind)}`);
  }
}

/**
 * @param {'token' | 'nft' | 'liquidity_pool'} kind
 * @param {Record<string, unknown>} fields
 */
export async function preflightBoingLaunchWizardByKind(kind, fields) {
  const client = createBoingBrowserRpcClient();
  let merged = fields;
  if (kind === 'token') {
    merged = await enrichBoingTokenLaunchFields(fields);
  }
  const input = buildBoingLaunchIntegrationInput(kind, merged);
  return preflightBoingIntegrationDeploy(client, input);
}

/**
 * @param {import('boing-sdk').BoingClient} client
 * @param {import('boing-sdk').BoingIntegrationDeployInput} input
 */
export async function preflightBoingLaunchWizard(client, input) {
  return preflightBoingIntegrationDeploy(client, input);
}

/**
 * @param {object} opts
 * @param {'token' | 'nft' | 'liquidity_pool'} opts.kind
 * @param {() => import('ethers').Eip1193Provider | null} opts.getWalletProvider
 * @param {boolean} [opts.qaPoolAcknowledged]
 * @param {Record<string, unknown>} opts.fields — passed to {@link buildBoingLaunchIntegrationInput}
 * @returns {Promise<{ ok: true, txHash: string, qaResult: object } | { ok: false, code: string, message: string, qaResult?: object }>}
 */
export async function executeBoingLaunchWizardDeploy({ kind, getWalletProvider, qaPoolAcknowledged = false, ...fields }) {
  let mergedFields = fields;
  if (kind === 'token') {
    try {
      mergedFields = await enrichBoingTokenLaunchFields(fields);
    } catch (e) {
      return {
        ok: false,
        code: 'enrich_failed',
        message: e?.message || 'Could not prepare deploy (chain height or supply).',
      };
    }
  }

  let input;
  try {
    input = buildBoingLaunchIntegrationInput(kind, mergedFields);
  } catch (e) {
    return {
      ok: false,
      code: 'invalid_input',
      message: e?.message || 'Could not build deploy transaction.',
    };
  }

  const p = pickExpressProviderForDeploy(getWalletProvider);
  if (!p) {
    return { ok: false, code: 'no_provider', message: 'Boing Express provider not found.' };
  }

  const client = createBoingBrowserRpcClient();
  let pre;
  let tx;
  try {
    const r = await preflightBoingIntegrationDeploy(client, input);
    pre = r.qa;
    tx = r.tx;
  } catch (e) {
    return {
      ok: false,
      code: 'qa_rpc_failed',
      message: e?.message || 'QA preflight (boing_qaCheck) failed.',
    };
  }

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

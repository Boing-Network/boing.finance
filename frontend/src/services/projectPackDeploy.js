/**
 * Project pack: joint NFT collection + fungible token CREATE2 deploys, then companion link.
 *
 * Prefer boing-sdk `buildLinkedNftTokenProjectPack` (network PR #48 / main after merge).
 * Falls back to composing `buildLinkedNftTokenPairDeploys` + register flow when the helper
 * is not yet on the installed SDK.
 */

import * as boingSdk from 'boing-sdk';
import { createBoingBrowserRpcClient } from './boingTestnetRpc';
import { boingExpressSendTransaction, boingExpressContractCallSignSimulateSubmit } from './boingExpressNativeTx';
import { pickExpressProviderForDeploy } from './boingNativeLaunchWizardDeploy';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';
import { isBoingNativeAccountIdHex } from '../utils/boingWalletDiscovery';
import {
  getLinkedNftTokenRegistryStatus,
  getLinkedNftTokenRegistrySdkApi,
  resolveLinkedNftTokenRegistryId,
} from './linkedNftTokenRegistry';
import { rememberAssetDeployer } from '../utils/linkedNftToken';

const EXTRA_NFT_ENV = ['REACT_APP_BOING_REFERENCE_NFT_BYTECODE_HEX'];
const EXTRA_TOKEN_ENV = ['REACT_APP_BOING_REFERENCE_TOKEN_BYTECODE'];

function pickFn(...candidates) {
  for (const c of candidates) {
    if (typeof c === 'function') return c;
  }
  return null;
}

/**
 * Resolve registry id for pack planning (env / contracts / network, else SDK canonical testnet).
 */
function resolvePackRegistryHex(opts = {}) {
  const { registryId } = resolveLinkedNftTokenRegistryId(opts);
  if (registryId) return registryId;
  const canonical = boingSdk.CANONICAL_BOING_TESTNET_LINKED_NFT_TOKEN_REGISTRY_HEX;
  if (typeof canonical === 'string' && isBoingNativeAccountIdHex(canonical)) {
    return `0x${canonical.replace(/^0x/i, '').toLowerCase()}`;
  }
  return '0xebf9f0190f415852f90d0e60343126201248ab96273fdbf8acc5fe5fa03c3dd8';
}

/**
 * Plan a full project pack (deploys + claim×2 + register).
 *
 * @param {object} input
 * @param {string} input.deployerHex
 * @param {string} input.collectionName
 * @param {string} input.collectionSymbol
 * @param {string} input.tokenName
 * @param {string} input.tokenSymbol
 * @param {string} [input.collectionSaltHex]
 * @param {string} [input.note]
 * @param {string} [input.registryHex32]
 * @param {string} [input.senderHex32]
 * @param {{ endUser?: object, networkInfo?: object }} [input.registryOpts]
 */
export function planProjectPackPair(input) {
  const deployer = String(input.deployerHex || '').trim().toLowerCase();
  if (!isBoingNativeAccountIdHex(deployer)) {
    throw new Error('Connect a Boing account to plan your project.');
  }
  const collectionName = String(input.collectionName || '').trim();
  const collectionSymbol = String(input.collectionSymbol || '').trim();
  const tokenName = String(input.tokenName || '').trim();
  const tokenSymbol = String(input.tokenSymbol || '').trim();
  if (!collectionName || !collectionSymbol) {
    throw new Error('Collection name and symbol are required.');
  }
  if (!tokenName || !tokenSymbol) {
    throw new Error('Token name and symbol are required.');
  }

  const buildPack = pickFn(boingSdk.buildLinkedNftTokenProjectPack);
  const buildPair = pickFn(boingSdk.buildLinkedNftTokenPairDeploys);
  const randomSalt = pickFn(boingSdk.randomLinkedNftTokenCollectionSaltHex);
  const registryHex32 =
    (input.registryHex32 && String(input.registryHex32).trim()) ||
    resolvePackRegistryHex(input.registryOpts || {});
  const senderHex32 =
    (input.senderHex32 && String(input.senderHex32).trim().toLowerCase()) || deployer;

  const salt =
    (input.collectionSaltHex && String(input.collectionSaltHex).trim()) ||
    (randomSalt ? randomSalt() : undefined);

  const pairFields = {
    deployerHex: deployer,
    collectionName,
    collectionSymbol,
    tokenName,
    tokenSymbol,
    collectionSaltHex: salt,
    note: input.note,
    collectionExtraEnvKeys: EXTRA_NFT_ENV,
    tokenExtraEnvKeys: EXTRA_TOKEN_ENV,
  };

  if (buildPack) {
    const pack = buildPack({
      ...pairFields,
      registryHex32,
      senderHex32,
    });
    return {
      source: 'sdk_project_pack',
      collectionSaltHex: pack.collectionSaltHex,
      tokenSaltHex: pack.tokenSaltHex,
      predictedCollectionAddress: pack.predictedCollectionAddress,
      predictedTokenAddress: pack.predictedTokenAddress,
      collectionDeployTx: pack.collectionDeployTx,
      tokenDeployTx: pack.tokenDeployTx,
      collectionLink: pack.collectionLink,
      tokenLink: pack.tokenLink,
      registryHex32: pack.registryHex32,
      senderHex32: pack.senderHex32,
      registerFlowTxs: pack.registerFlowTxs,
      submitOrder: pack.submitOrder,
    };
  }

  if (!buildPair) {
    throw new Error(
      'This app build is missing project pack helpers. Update boing-sdk (network PR #48 / main).'
    );
  }

  const pair = buildPair(pairFields);
  const sdkApi = getLinkedNftTokenRegistrySdkApi();
  let registerFlowTxs = null;
  if (sdkApi.buildFlowTxs) {
    registerFlowTxs = sdkApi.buildFlowTxs({
      senderHex32,
      registryHex32,
      collectionHex32: pair.predictedCollectionAddress,
      tokenHex32: pair.predictedTokenAddress,
    });
  }

  return {
    source: 'sdk_pair_compose',
    collectionSaltHex: pair.collectionSaltHex,
    tokenSaltHex: pair.tokenSaltHex,
    predictedCollectionAddress: pair.predictedCollectionAddress,
    predictedTokenAddress: pair.predictedTokenAddress,
    collectionDeployTx: pair.collectionDeployTx,
    tokenDeployTx: pair.tokenDeployTx,
    collectionLink: pair.collectionLink,
    tokenLink: pair.tokenLink,
    registryHex32,
    senderHex32,
    registerFlowTxs,
    submitOrder: ['collectionDeploy', 'tokenDeploy', 'claimCollection', 'claimToken', 'registerLink'],
  };
}

/**
 * QA-check a ready `contract_deploy_meta` tx from the pack planner.
 * @param {import('boing-sdk').ContractDeployMetaTxObject} tx
 */
export async function preflightProjectPackDeployTx(tx) {
  const preflight = pickFn(boingSdk.preflightContractDeployMetaWithUi);
  if (!preflight) {
    throw new Error('QA preflight helper unavailable in boing-sdk.');
  }
  const client = createBoingBrowserRpcClient();
  return preflight(client, tx);
}

/**
 * @param {object} opts
 * @param {() => unknown} opts.getWalletProvider
 * @param {import('boing-sdk').ContractDeployMetaTxObject} opts.tx
 * @param {boolean} [opts.qaPoolAcknowledged]
 */
export async function executeProjectPackDeployTx({
  getWalletProvider,
  tx,
  qaPoolAcknowledged = false,
}) {
  if (!tx || tx.type !== 'contract_deploy_meta') {
    return { ok: false, code: 'invalid_tx', message: 'Missing deploy transaction.' };
  }

  let qa;
  try {
    const pre = await preflightProjectPackDeployTx(tx);
    qa = pre.qa;
  } catch (e) {
    return {
      ok: false,
      code: 'qa_rpc_failed',
      message: e?.message || 'Could not check this deploy. Try again.',
    };
  }

  if (qa?.result === 'reject') {
    return {
      ok: false,
      code: 'qa_reject',
      message: qa.message || 'This deploy was rejected. Adjust names or try again later.',
      qaResult: qa,
    };
  }
  if (qa?.result === 'unsure' && !qaPoolAcknowledged) {
    return {
      ok: false,
      code: 'qa_unsure_unack',
      message: 'Confirm you understand this may need an extra review, then try again.',
      qaResult: qa,
    };
  }

  const provider = pickExpressProviderForDeploy(getWalletProvider);
  if (!provider) {
    return {
      ok: false,
      code: 'no_provider',
      message: 'Connect Boing Express to continue.',
    };
  }

  try {
    const sendRes = await boingExpressSendTransaction(provider, tx, { returnSubmitMeta: true });
    const txHash = typeof sendRes === 'string' ? sendRes : String(sendRes.txHash);
    const boingTxIdHex =
      typeof sendRes === 'object' && sendRes.boingTxIdHex ? sendRes.boingTxIdHex : null;
    return { ok: true, txHash, boingTxIdHex, qaResult: qa };
  } catch (e) {
    return {
      ok: false,
      code: 'send_failed',
      message: formatBoingExpressRpcError(e) || e?.message || 'Deploy failed',
      qaResult: qa,
    };
  }
}

/**
 * Submit claim×2 + register_link from a planned pack (or rebuild via register helpers).
 */
export async function linkProjectPackCompanions({
  getWalletProvider,
  collectionId,
  tokenId,
  linker,
  endUser = null,
  networkInfo = null,
  deployerAccount = null,
  registerFlowTxs = null,
} = {}) {
  const status = getLinkedNftTokenRegistryStatus({ endUser, networkInfo });
  if (!status.canWrite && !registerFlowTxs?.length) {
    return {
      ok: false,
      code: status.code,
      message:
        'Companion linking is not available right now. Check your connection and try again.',
      status,
    };
  }

  if (deployerAccount && collectionId) rememberAssetDeployer(collectionId, deployerAccount);
  if (deployerAccount && tokenId) rememberAssetDeployer(tokenId, deployerAccount);

  const provider = pickExpressProviderForDeploy(getWalletProvider);
  if (!provider?.request) {
    return {
      ok: false,
      code: 'no_provider',
      message: 'Connect Boing Express to continue.',
      status,
    };
  }
  if (!linker || !isBoingNativeAccountIdHex(linker)) {
    return {
      ok: false,
      code: 'no_sender',
      message: 'Connected Boing account required.',
      status,
    };
  }

  const txHashes = [];
  try {
    let flow = Array.isArray(registerFlowTxs) && registerFlowTxs.length ? registerFlowTxs : null;
    if (!flow && status.sdk.buildFlowTxs && status.registryId) {
      flow = status.sdk.buildFlowTxs({
        senderHex32: linker,
        registryHex32: status.registryId,
        collectionHex32: collectionId,
        tokenHex32: tokenId,
      });
    }
    if (!flow?.length) {
      return {
        ok: false,
        code: 'no_flow',
        message: 'Could not build companion link steps. Update the app and try again.',
        status,
      };
    }
    for (const tx of flow) {
      txHashes.push(await boingExpressContractCallSignSimulateSubmit(provider, tx));
    }
    return {
      ok: true,
      txHash: txHashes[txHashes.length - 1] || null,
      txHashes,
      registryId: status.registryId || null,
      collectionId,
      tokenId,
      status,
    };
  } catch (e) {
    return {
      ok: false,
      code: 'submit_failed',
      message: formatBoingExpressRpcError(e) || e?.message || 'Could not link companions',
      txHashes,
      status,
    };
  }
}

export function getProjectPackRegistryReady(opts = {}) {
  return getLinkedNftTokenRegistryStatus(opts);
}

/** True when installed boing-sdk exports the joint project-pack helper. */
export function hasSdkProjectPackHelper() {
  return typeof boingSdk.buildLinkedNftTokenProjectPack === 'function';
}

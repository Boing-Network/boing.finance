/**
 * Project pack: joint NFT collection + fungible token CREATE2 deploys, then companion link.
 *
 * Planning lives in the pure `projectPackPlan.js` (token = Boing token v2 with the whole supply
 * minted to the creator inside the deploy transaction); this module adds QA, wallet and registry I/O.
 */

import * as boingSdk from 'boing-sdk';
import { createBoingBrowserRpcClient } from './boingTestnetRpc';
import {
  boingExpressSendTransaction,
  boingExpressContractCallSignSimulateSubmit,
  isBoingInvalidNonceError,
} from './boingExpressNativeTx';
import { pickExpressProviderForDeploy } from './boingNativeLaunchWizardDeploy';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';
import { isBoingNativeAccountIdHex } from '../utils/boingWalletDiscovery';
import { planProjectPack } from './projectPackPlan';
import {
  getLinkedNftTokenRegistryStatus,
  resolveLinkedNftTokenRegistryId,
  nodeBatchSupport,
} from './linkedNftTokenRegistry';
import { flowTxsToBatchTx, isWalletBatchUnsupportedError, shouldUseLinkBatch } from '../utils/linkedNftLinkBatch';
import { rememberAssetDeployer } from '../utils/linkedNftToken';

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
 * Plan a full project pack (deploys + claim×2 + register) for the connected account.
 * Thin wrapper over the pure {@link planProjectPack} that resolves the registry for this network.
 *
 * @param {object} input
 * @param {string} input.deployerHex
 * @param {string} input.collectionName
 * @param {string} input.collectionSymbol
 * @param {string} input.tokenName
 * @param {string} input.tokenSymbol
 * @param {string | bigint} [input.tokenSupply] — whole tokens; minted to the deployer inside the token deploy
 * @param {string} [input.collectionSaltHex]
 * @param {string} [input.note]
 * @param {string} [input.registryHex32]
 * @param {{ endUser?: object, networkInfo?: object }} [input.registryOpts]
 */
export function planProjectPackPair(input) {
  const deployer = String(input.deployerHex || '').trim().toLowerCase();
  if (!isBoingNativeAccountIdHex(deployer)) {
    throw new Error('Connect a Boing account to plan your project.');
  }
  const registryHex32 =
    (input.registryHex32 && String(input.registryHex32).trim()) ||
    resolvePackRegistryHex(input.registryOpts || {});
  return planProjectPack({
    deployerHex: deployer,
    collectionName: input.collectionName,
    collectionSymbol: input.collectionSymbol,
    tokenName: input.tokenName,
    tokenSymbol: input.tokenSymbol,
    tokenSupply: input.tokenSupply,
    collectionSaltHex: input.collectionSaltHex,
    note: input.note,
    registryHex32,
    senderHex32: deployer,
  });
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
 * @param {string} [opts.senderHex] — deployer account; used to refresh nonce + wait for inclusion
 */
export async function executeProjectPackDeployTx({
  getWalletProvider,
  tx,
  qaPoolAcknowledged = false,
  senderHex = null,
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

  const sender =
    senderHex && isBoingNativeAccountIdHex(senderHex) ? String(senderHex).toLowerCase() : null;

  try {
    const sendRes = await boingExpressSendTransaction(provider, tx, {
      returnSubmitMeta: true,
      senderHex: sender,
      refreshNonce: Boolean(sender),
      waitForInclusion: Boolean(sender),
    });
    const txHash = typeof sendRes === 'string' ? sendRes : String(sendRes.txHash);
    const boingTxIdHex =
      typeof sendRes === 'object' && sendRes.boingTxIdHex ? sendRes.boingTxIdHex : null;
    return { ok: true, txHash, boingTxIdHex, qaResult: qa };
  } catch (e) {
    return {
      ok: false,
      code: isBoingInvalidNonceError(e) ? 'invalid_nonce' : 'send_failed',
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
    const sender = String(linker).toLowerCase();
    const submitOpts = { senderHex: sender, refreshNonce: true, waitForInclusion: true, retryOnInvalidNonce: true };
    // One wallet approval: claim×2 + register_link as a single native batch tx when node + wallet support it.
    const support = await nodeBatchSupport();
    if (shouldUseLinkBatch(flow.length, support) && flow.every((t) => (t?.type ?? t?.txType) === 'contract_call')) {
      try {
        const hash = await boingExpressContractCallSignSimulateSubmit(provider, flowTxsToBatchTx(flow), submitOpts);
        txHashes.push(typeof hash === 'string' ? hash : String(hash?.txHash || hash));
        return {
          ok: true,
          txHash: txHashes[0] || null,
          txHashes,
          batched: true,
          registryId: status.registryId || null,
          collectionId,
          tokenId,
          status,
        };
      } catch (e) {
        if (!isWalletBatchUnsupportedError(e)) throw e;
      }
    }
    for (const tx of flow) {
      // Fresh app-RPC nonce + wait for inclusion between claim×2 and register_link so the
      // wallet never signs with a nonce from before the prior guided-flow deploy/link step.
      const hash = await boingExpressContractCallSignSimulateSubmit(provider, tx, {
        senderHex: sender,
        refreshNonce: true,
        waitForInclusion: true,
        retryOnInvalidNonce: true,
      });
      txHashes.push(typeof hash === 'string' ? hash : String(hash?.txHash || hash));
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
      code: isBoingInvalidNonceError(e) ? 'invalid_nonce' : 'submit_failed',
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

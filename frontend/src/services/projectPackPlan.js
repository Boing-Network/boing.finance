/**
 * Project pack planner (pure: no React, no RPC, no wallet; Node-testable with
 * `node --test scripts/project-pack-plan.test.mjs`).
 *
 * Two CREATE2 deploys (NFT collection + fungible token) with mutual linked-schema `description_hash`
 * commits, then the registry `claim_asset` x2 + `register_link` flow (boing-sdk linkedNftToken*).
 *
 * The token is a **Boing token v2** (same runtime as the Deploy token page and the v8 / v9 custody
 * pools). Its deploy bytecode wraps that runtime in a `0xFD` init that mints the whole
 * chosen supply (default {@link PROJECT_PACK_DEFAULT_TOKEN_SUPPLY}) to the deployer, records the deployer as admin and marks the one-time
 * `mint_first` as used, all inside the deploy transaction. A separate `mint_first` transaction is not
 * used: the node packs blocks by (nonce, sender), so another account's call could land between a
 * deploy at nonce n and a mint at nonce n+1 and become admin of the empty token.
 */
import {
  buildLinkedNftTokenPairDeploys,
  buildLinkedNftTokenProjectPack,
  buildLinkedNftTokenRegisterFlowTxs,
  randomLinkedNftTokenCollectionSaltHex,
  validateHex32,
} from 'boing-sdk';
import { PROJECT_PACK_DEFAULT_TOKEN_SUPPLY } from '../config/projectPack.js';
import { buildBoingTokenV2MintAtDeployBytecodeHex, parseBoingTokenV2Supply } from './boingTokenV2Launch.js';

export const PROJECT_PACK_SUBMIT_ORDER = Object.freeze([
  'collectionDeploy',
  // Token v2 deploy; the init mints the full supply to the creator in the same transaction.
  'tokenDeploy',
  'claimCollection',
  'claimToken',
  'registerLink',
]);

/** Version tag stored with in-progress drafts (a different token bytecode means a different token address). */
export const PROJECT_PACK_TOKEN_TEMPLATE = 'v2-mint-at-deploy';

/**
 * @param {object} input
 * @param {string} input.deployerHex — creator AccountId (deploys both, receives the supply, claims, links)
 * @param {string} input.collectionName
 * @param {string} input.collectionSymbol
 * @param {string} input.tokenName
 * @param {string} input.tokenSymbol
 * @param {string} input.registryHex32 — linked NFT↔token registry AccountId
 * @param {string} [input.collectionSaltHex] — random when omitted
 * @param {string} [input.senderHex32] — defaults to the deployer
 * @param {string} [input.note]
 * @param {bigint | string | number} [input.tokenSupply] — whole tokens, 1 .. 2^128-1 (same rules as the solo deploy);
 *   defaults to PROJECT_PACK_DEFAULT_TOKEN_SUPPLY
 * @param {object} [input.sdk] — boing-sdk overrides (tests)
 */
export function planProjectPack(input) {
  const sdk = {
    buildLinkedNftTokenPairDeploys,
    buildLinkedNftTokenProjectPack,
    buildLinkedNftTokenRegisterFlowTxs,
    randomLinkedNftTokenCollectionSaltHex,
    ...(input.sdk || {}),
  };
  let deployer;
  try {
    deployer = validateHex32(String(input.deployerHex || '').trim()).toLowerCase();
  } catch {
    throw new Error('Connect a Boing account to plan your project.');
  }
  const collectionName = String(input.collectionName || '').trim();
  const collectionSymbol = String(input.collectionSymbol || '').trim();
  const tokenName = String(input.tokenName || '').trim();
  const tokenSymbol = String(input.tokenSymbol || '').trim();
  if (!collectionName || !collectionSymbol) throw new Error('Collection name and symbol are required.');
  if (!tokenName || !tokenSymbol) throw new Error('Token name and symbol are required.');
  const registryHex32 = validateHex32(String(input.registryHex32 || '').trim()).toLowerCase();
  const senderHex32 = validateHex32(String(input.senderHex32 || deployer).trim()).toLowerCase();
  if (senderHex32 !== deployer) {
    // The init mints to the deploy transaction's sender, and the deployer must also claim both assets.
    throw new Error('The project pack must be deployed, claimed and linked by the same account.');
  }

  const rawSupply = input.tokenSupply == null || String(input.tokenSupply).trim() === '' ? PROJECT_PACK_DEFAULT_TOKEN_SUPPLY : input.tokenSupply;
  const tokenSupply = parseBoingTokenV2Supply(rawSupply);
  const tokenBytecodeHex = buildBoingTokenV2MintAtDeployBytecodeHex({ supply: tokenSupply });
  const salt =
    (input.collectionSaltHex && String(input.collectionSaltHex).trim()) ||
    (typeof sdk.randomLinkedNftTokenCollectionSaltHex === 'function' ? sdk.randomLinkedNftTokenCollectionSaltHex() : undefined);

  const pairFields = {
    deployerHex: deployer,
    collectionName,
    collectionSymbol,
    tokenName,
    tokenSymbol,
    collectionSaltHex: salt,
    note: input.note,
    // Explicit v2 mint-at-deploy bytecode: wins over any REACT_APP_* fungible bytecode env override.
    tokenBytecodeHexOverride: tokenBytecodeHex,
    collectionExtraEnvKeys: ['REACT_APP_BOING_REFERENCE_NFT_BYTECODE_HEX'],
    tokenPurposeCategory: 'token',
  };

  let pair;
  let registerFlowTxs;
  let source;
  if (typeof sdk.buildLinkedNftTokenProjectPack === 'function') {
    const pack = sdk.buildLinkedNftTokenProjectPack({ ...pairFields, registryHex32, senderHex32 });
    pair = pack;
    registerFlowTxs = pack.registerFlowTxs;
    source = 'sdk_project_pack';
  } else {
    pair = sdk.buildLinkedNftTokenPairDeploys(pairFields);
    registerFlowTxs = sdk.buildLinkedNftTokenRegisterFlowTxs({
      senderHex32,
      registryHex32,
      collectionHex32: pair.predictedCollectionAddress,
      tokenHex32: pair.predictedTokenAddress,
    });
    source = 'sdk_pair_compose';
  }
  if (String(pair.tokenDeployTx?.bytecode || '').toLowerCase() !== tokenBytecodeHex.toLowerCase()) {
    throw new Error('Token deploy bytecode mismatch (expected the v2 mint-at-deploy template).');
  }

  return {
    source,
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
    submitOrder: PROJECT_PACK_SUBMIT_ORDER,
    tokenTemplate: PROJECT_PACK_TOKEN_TEMPLATE,
    tokenSupply,
    tokenSupplyRecipient: deployer,
  };
}

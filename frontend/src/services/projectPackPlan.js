/**
 * Project pack planner (pure: no React, no RPC, no wallet; Node-testable with
 * `node --test scripts/project-pack-plan.test.mjs`).
 *
 * Two CREATE2 deploys (NFT collection + fungible token) with mutual linked-schema `description_hash`
 * commits, then the registry `register_link` (boing-sdk linkedNftToken*). Three transactions.
 *
 * Both deploys claim themselves for the creator in the linked NFT↔token registry v2 from their `0xFD` init
 * code (`claim_self`, see boingDeployInit.js), so nobody can claim the new AccountIds first and the old
 * `claim_asset` x2 transactions are gone. The collection init also sets its admin slot to the creator.
 *
 * The token is a **Boing token v2** (same runtime as the Deploy token page and the v8 / v9 custody
 * pools). Its deploy bytecode wraps that runtime in a `0xFD` init that mints the whole
 * chosen supply (default {@link PROJECT_PACK_DEFAULT_TOKEN_SUPPLY}) to the deployer, records the deployer as admin and marks the one-time
 * `mint_first` as used, all inside the deploy transaction. A separate `mint_first` transaction is not
 * used: the node packs blocks by (nonce, sender), so another account's call could land between a
 * deploy at nonce n and a mint at nonce n+1 and become admin of the empty token.
 */
import {
  resolveReferenceNftCollectionTemplateBytecodeHex,
  buildLinkedNftTokenPairDeploys,
  buildLinkedNftTokenProjectPack,
  buildLinkedNftTokenRegisterFlowTxs,
  randomLinkedNftTokenCollectionSaltHex,
  validateHex32,
} from 'boing-sdk';
import { PROJECT_PACK_DEFAULT_TOKEN_SUPPLY } from '../config/projectPack.js';
import { buildBoingTokenV2MintAtDeployBytecodeHex, parseBoingTokenV2Supply } from './boingTokenV2Launch.js';
import { buildBoingNftCollectionAtDeployBytecodeHex } from './boingDeployInit.js';

const COLLECTION_EXTRA_ENV_KEYS = ['REACT_APP_BOING_REFERENCE_NFT_BYTECODE_HEX'];

export const PROJECT_PACK_SUBMIT_ORDER = Object.freeze([
  'collectionDeploy',
  // Token v2 deploy; the init mints the full supply to the creator in the same transaction.
  'tokenDeploy',
  // Both deploys already claimed themselves (registry v2 claim_self in their init code).
  'registerLink',
]);

/** Version tag stored with in-progress drafts (a different token bytecode means a different token address). */
export const PROJECT_PACK_TOKEN_TEMPLATE = 'v2-mint-claim-at-deploy';

/**
 * @param {object} input
 * @param {string} input.deployerHex — creator AccountId (deploys both, receives the supply, is the claimer, links)
 * @param {string} [input.collectionRuntimeHex] — collection runtime (default: SDK reference collection template)
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
    // The inits mint to and claim for the deploy transaction's sender, who must also send register_link.
    throw new Error('The project pack must be deployed, claimed and linked by the same account.');
  }

  const rawSupply = input.tokenSupply == null || String(input.tokenSupply).trim() === '' ? PROJECT_PACK_DEFAULT_TOKEN_SUPPLY : input.tokenSupply;
  const tokenSupply = parseBoingTokenV2Supply(rawSupply);
  const tokenBytecodeHex = buildBoingTokenV2MintAtDeployBytecodeHex({ supply: tokenSupply, claimRegistryHex: registryHex32 });
  const collectionRuntimeHex =
    input.collectionRuntimeHex ||
    (sdk.resolveReferenceNftCollectionTemplateBytecodeHex || resolveReferenceNftCollectionTemplateBytecodeHex)({
      extraEnvKeys: COLLECTION_EXTRA_ENV_KEYS,
    });
  const collectionBytecodeHex = buildBoingNftCollectionAtDeployBytecodeHex({
    runtimeHex: collectionRuntimeHex,
    claimRegistryHex: registryHex32,
  });
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
    // Reference collection runtime + init (admin = creator, claim_self in the registry).
    collectionBytecodeHexOverride: collectionBytecodeHex,
    collectionExtraEnvKeys: COLLECTION_EXTRA_ENV_KEYS,
    tokenPurposeCategory: 'token',
  };

  let pair;
  let registerFlowTxs;
  let source;
  if (typeof sdk.buildLinkedNftTokenProjectPack === 'function') {
    const pack = sdk.buildLinkedNftTokenProjectPack({ ...pairFields, registryHex32, senderHex32, claimAtDeploy: true });
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
      includeClaims: false,
    });
    source = 'sdk_pair_compose';
  }
  if (String(pair.tokenDeployTx?.bytecode || '').toLowerCase() !== tokenBytecodeHex.toLowerCase()) {
    throw new Error('Token deploy bytecode mismatch (expected the v2 mint-at-deploy template).');
  }
  if (String(pair.collectionDeployTx?.bytecode || '').toLowerCase() !== collectionBytecodeHex.toLowerCase()) {
    throw new Error('Collection deploy bytecode mismatch (expected the claim-at-deploy collection).');
  }
  if (registerFlowTxs.length !== 1) {
    throw new Error('Expected a single register_link step (both deploys claim themselves).');
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

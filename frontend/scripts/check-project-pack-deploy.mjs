#!/usr/bin/env node
/**
 * Project pack testnet check using the SAME planner as the Project pack page
 * (`src/services/projectPackPlan.js`). Boing Express signing is replaced by a key signer.
 *
 *   node scripts/check-project-pack-deploy.mjs --sender 0x...      # read-only: nonce, balance, planned addresses
 *   node scripts/check-project-pack-deploy.mjs --dry-run           # sign both deploys offline + simulate them (no submit)
 *   node scripts/check-project-pack-deploy.mjs --execute [--supply 4206900000] [--symbol PKT]
 *        # real run: collection deploy, token deploy (supply minted to the deployer at deploy; both claim
 *        # themselves in the registry v2 from their init code), register_link, then verify balance / admins /
 *        # mint-once / claimers / link, and dry-run outsider claims as a throwaway account (funded with 1 testnet BOING; must be rejected).
 * Needs BOING_SECRET_HEX for --dry-run / --execute (never printed).
 */
import {
  BoingClient,
  boingTokenBytecodeHex,
  CANONICAL_BOING_TESTNET_LINKED_NFT_TOKEN_REGISTRY_HEX,
  buildLinkedNftTokenRegistryContractCallTx,
  encodeLinkedNftTokenGetAssetClaimerCalldataHex,
  encodeReferenceMintFirstCalldata,
  getBoingTokenBalance,
  hexToAccountId,
  hexToBytes,
  mergeLinkedNftTokenRegistryAccessListWithSimulation,
  senderHexFromSecretKey,
  signTransactionInputForClient,
  submitSignedTransactionIdempotent,
  transactionIdFromSignedTransactionHex,
} from '@boing-network/boing-sdk';
import { planProjectPack } from '../src/services/projectPackPlan.js';
import { BOING_TOKEN_ADMIN_SLOT_HEX, BOING_TOKEN_MINT_ONCE_SLOT_HEX } from '../src/services/boingTokenV2Launch.js';
import { BOING_NFT_COLLECTION_ADMIN_SLOT_HEX } from '../src/services/boingDeployInit.js';
import { probeOutsiderClaims } from './lib/registry-v2-probe.mjs';

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const rpc = opt('--rpc', process.env.BOING_RPC_URL || 'https://testnet-rpc.boing.network/');
const execute = flag('--execute');
const dryRun = flag('--dry-run');
const tag = Date.now().toString(36).slice(-4).toUpperCase();
const symbol = opt('--symbol', `PK${tag}`);
const supply = opt('--supply', undefined);
const registry = opt('--registry', CANONICAL_BOING_TESTNET_LINKED_NFT_TOKEN_REGISTRY_HEX);
const client = new BoingClient(rpc);

const secret = process.env.BOING_SECRET_HEX ? hexToBytes(process.env.BOING_SECRET_HEX.trim()) : null;
if ((execute || dryRun) && !secret) throw new Error('--execute / --dry-run need BOING_SECRET_HEX');
const senderHex = (secret ? await senderHexFromSecretKey(secret) : opt('--sender', '')).toLowerCase();
if (!senderHex) throw new Error('pass --sender 0x... (or BOING_SECRET_HEX)');
const sender = hexToAccountId(senderHex);

const plan = planProjectPack({
  deployerHex: senderHex,
  collectionName: `Pack Check ${tag}`,
  collectionSymbol: `PC${tag}`,
  tokenName: `Pack Check Token ${tag}`,
  tokenSymbol: symbol,
  tokenSupply: supply,
  registryHex32: registry,
  note: 'boing.finance project pack check',
});
const acct = await client.getAccount(senderHex);
console.log(`rpc ${rpc}`);
console.log(`sender ${senderHex} nonce ${acct?.nonce ?? 0} balance ${acct?.balance_boing ?? acct?.balance ?? '?'} BOING, head ${await client.chainHeight()}`);
console.log(`collection (predicted) ${plan.predictedCollectionAddress}`);
console.log(`token (predicted)      ${plan.predictedTokenAddress}  ${plan.tokenDeployTx.asset_symbol}, supply ${plan.tokenSupply} -> deployer, ${(plan.tokenDeployTx.bytecode.length - 2) / 2} bytes (${plan.tokenTemplate})`);
console.log(`registry ${plan.registryHex32}; steps ${plan.submitOrder.join(' -> ')}`);
if (!execute && !dryRun) process.exit(0);

async function nonceNow() {
  return BigInt((await client.getAccount(senderHex))?.nonce ?? 0);
}
function deployInput(tx, nonce) {
  return {
    nonce,
    sender,
    payload: {
      kind: 'contractDeployWithPurposeAndMetadata',
      bytecode: hexToBytes(tx.bytecode),
      purposeCategory: tx.purpose_category,
      descriptionHash: tx.description_hash ? hexToBytes(tx.description_hash) : null,
      assetName: tx.asset_name,
      assetSymbol: tx.asset_symbol,
      create2Salt: tx.create2_salt ? hexToBytes(tx.create2_salt) : null,
    },
    accessList: { read: [sender], write: [sender] },
  };
}
function callInput(tx, nonce, accessList = tx.access_list) {
  return {
    nonce,
    sender,
    payload: { kind: 'contractCall', contract: hexToAccountId(tx.contract), calldata: hexToBytes(tx.calldata) },
    accessList: { read: accessList.read.map(hexToAccountId), write: accessList.write.map(hexToAccountId) },
  };
}
async function waitReceipt(id, label) {
  for (let i = 0; i < 60; i++) {
    const rc = await client.getTransactionReceipt(id);
    if (rc) {
      console.log(`  ${label} included block ${rc.block_height ?? '?'} success=${rc.success}${rc.error ? ` (${rc.error})` : ''}`);
      if (rc.success === false) throw new Error(`${label} failed`);
      return rc;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`${label}: no receipt after 120 s`);
}
async function signSimSubmitDeploy(tx, label, submit) {
  const signed = await signTransactionInputForClient(client, deployInput(tx, await nonceNow()), secret);
  const id = transactionIdFromSignedTransactionHex(signed);
  const sim = await client.simulateTransaction(signed);
  console.log(`${label} ${id} simulate success=${sim.success} gas=${sim.gas_used}${sim.error ? ` (${sim.error})` : ''}`);
  if (!sim.success) throw new Error(`${label} simulation failed`);
  if (!submit) return null;
  console.log(`  submit: ${await submitSignedTransactionIdempotent(client, signed)}`);
  await waitReceipt(id, label);
  return id;
}
async function registryCall(tx, label, submit) {
  const n = await nonceNow();
  let signed = await signTransactionInputForClient(client, callInput(tx, n), secret);
  let sim = await client.simulateTransaction(signed);
  if (sim.success && sim.access_list_covers_suggestion === false) {
    const merged = mergeLinkedNftTokenRegistryAccessListWithSimulation(senderHex, plan.registryHex32, sim);
    signed = await signTransactionInputForClient(client, callInput(tx, n, merged), secret);
    sim = await client.simulateTransaction(signed);
  }
  const id = transactionIdFromSignedTransactionHex(signed);
  console.log(`${label} ${id} simulate success=${sim.success}${sim.error ? ` (${sim.error})` : ''}`);
  if (!sim.success) throw new Error(`${label} simulation failed`);
  if (!submit) return sim;
  console.log(`  submit: ${await submitSignedTransactionIdempotent(client, signed)}`);
  await waitReceipt(id, label);
  return id;
}

if (dryRun) {
  // Both deploys are independent CREATE2 deploys, so both can be simulated against the current state.
  await signSimSubmitDeploy(plan.collectionDeployTx, 'collection deploy', false);
  await signSimSubmitDeploy(plan.tokenDeployTx, 'token deploy (mints at deploy)', false);
  console.log('[dry-run] nothing submitted');
  process.exit(0);
}

const out = {};
out.collectionDeploy = await signSimSubmitDeploy(plan.collectionDeployTx, 'collection deploy', true);
out.tokenDeploy = await signSimSubmitDeploy(plan.tokenDeployTx, 'token deploy (mints at deploy)', true);
const [reg] = plan.registerFlowTxs; // both deploys already claimed themselves
out.registerLink = await registryCall(reg, 'register_link', true);

console.log('\n== verification ==');
const token = plan.predictedTokenAddress;
const code = await client.getContractCode(token).catch(() => null);
const bal = await getBoingTokenBalance(client, token, senderHex);
const admin = (await client.getContractStorage(token, BOING_TOKEN_ADMIN_SLOT_HEX)).value.toLowerCase();
const once = BigInt((await client.getContractStorage(token, BOING_TOKEN_MINT_ONCE_SLOT_HEX)).value);
console.log(`deployer balance ${bal} / supply ${plan.tokenSupply}: ${bal === plan.tokenSupply ? 'OK' : 'MISMATCH'}`);
console.log(`admin slot ${admin}: ${admin === senderHex ? 'OK (deployer)' : 'MISMATCH'}`);
console.log(`mint-once flag ${once}: ${once === 1n ? 'OK (set)' : 'MISMATCH'}`);
const colAdmin = (await client.getContractStorage(plan.predictedCollectionAddress, BOING_NFT_COLLECTION_ADMIN_SLOT_HEX)).value.toLowerCase();
console.log(`collection admin slot ${colAdmin}: ${colAdmin === senderHex ? 'OK (deployer)' : 'MISMATCH'}`);
if (code?.bytecode) {
  const same = code.bytecode.toLowerCase() === boingTokenBytecodeHex(2).toLowerCase();
  console.log(`stored runtime ${(code.bytecode.length - 2) / 2} bytes, identical to the v2 template: ${same ? 'OK' : 'MISMATCH'}`);
}
// A second mint_first by the deployer must be a no-op (simulated only).
const mintAgain = await signTransactionInputForClient(
  client,
  callInput({ contract: token, calldata: `0x${Buffer.from(encodeReferenceMintFirstCalldata(senderHex, 5n)).toString('hex')}`, access_list: { read: [senderHex, token], write: [senderHex, token] } }, await nonceNow()),
  secret,
);
const simAgain = await client.simulateTransaction(mintAgain);
console.log(`second mint_first (simulated, not submitted): success=${simAgain.success}, return ${simAgain.return_data || '0x'} (template stops silently; balance unchanged is checked on chain above)`);
for (const [label, asset] of [['collection', plan.predictedCollectionAddress], ['token', token]]) {
  const q = buildLinkedNftTokenRegistryContractCallTx(senderHex, plan.registryHex32, encodeLinkedNftTokenGetAssetClaimerCalldataHex(asset));
  const s = await client.simulateTransaction(await signTransactionInputForClient(client, callInput(q, await nonceNow()), secret));
  const claimer = s.return_data ? `0x${s.return_data.replace(/^0x/, '').slice(-64)}` : '';
  console.log(`registry claimer of ${label}: ${claimer} ${claimer === senderHex ? 'OK' : 'MISMATCH'}`);
}
const probe = await probeOutsiderClaims(client, {
  registry: plan.registryHex32,
  collection: plan.predictedCollectionAddress,
  token,
  funder: { secret, hex: senderHex },
});
console.log(`throwaway account ${probe.outsider} (funded by tx ${probe.fundTx}; key in memory only)`);
for (const r of probe.results) {
  console.log(`throwaway ${probe.outsider.slice(0, 12)}… ${r.label} (dry-run): ${r.success ? 'ACCEPTED (MISMATCH)' : `rejected OK (${r.error || 'failed'})`}`);
}
try {
  const t = await client.getDexToken(token);
  console.log(`node token discovery: ${JSON.stringify(t)}`);
} catch (e) {
  console.log(`node token discovery: ${e.message}`);
}
console.log(`\ntx ids ${JSON.stringify(out)}`);

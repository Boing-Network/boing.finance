#!/usr/bin/env node
/**
 * Boing token v2 deploy check using the SAME builder as the Deploy token page
 * (`buildBoingTokenV2LaunchTx` in `src/services/boingTokenV2Launch.js`). The Boing Express signing step is
 * replaced by a key signer. The launch is ONE transaction: the deploy's `0xFD` init sets admin = deployer,
 * credits the whole supply to the deployer, marks `mint_first` used and claims the token in the linked
 * NFT↔token registry v2.
 *
 *   node scripts/check-boing-token-v2-deploy.mjs --sender 0x...            # read-only: nonce, balance, predicted token
 *   node scripts/check-boing-token-v2-deploy.mjs --dry-run                 # sign the deploy offline + simulate it (no submit)
 *   node scripts/check-boing-token-v2-deploy.mjs --execute --name "X" --symbol X --supply 1000000 \
 *        [--transfer-to 0x... --transfer-amount 1234]                      # real deploy (+ transfer); needs BOING_SECRET_HEX
 *   node scripts/check-boing-token-v2-deploy.mjs --probe-token 0x... [--probe-submit]   # only the outsider-claim probe
 *   [--registry 0x...]   linked NFT↔token registry (default: SDK canonical testnet v2); --no-claim to omit the claim
 *   [--probe-submit]     also submit the throwaway's claim_asset on chain (expected: failed receipt)
 * After --execute: verifies balance / admin / mint-once / stored runtime / registry claimer, then funds a throwaway
 * account with 1 testnet BOING and has it try claim_asset(token) (must be rejected). No key is ever printed.
 */
import {
  BoingClient,
  boingTokenBytecodeHex,
  buildBoingTokenTransferTransaction,
  CANONICAL_BOING_TESTNET_LINKED_NFT_TOKEN_REGISTRY_HEX,
  getBoingTokenBalance,
  hexToAccountId,
  hexToBytes,
  senderHexFromSecretKey,
  signTransactionInputForClient,
  submitSignedTransactionIdempotent,
  transactionIdFromSignedTransactionHex,
} from 'boing-sdk';
import {
  BOING_TOKEN_ADMIN_SLOT_HEX,
  BOING_TOKEN_MINT_ONCE_SLOT_HEX,
  buildBoingTokenV2LaunchTx,
} from '../src/services/boingTokenV2Launch.js';
import { probeOutsiderClaims, readClaimer } from './lib/registry-v2-probe.mjs';

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const rpc = opt('--rpc', process.env.BOING_RPC_URL || 'https://testnet-rpc.boing.network/');
const execute = flag('--execute');
const dryRun = flag('--dry-run');
const name = opt('--name', 'Finance V2 Check');
const symbol = opt('--symbol', 'FV2C');
const supply = opt('--supply', '1000000');
const registry = flag('--no-claim') ? null : opt('--registry', CANONICAL_BOING_TESTNET_LINKED_NFT_TOKEN_REGISTRY_HEX).toLowerCase();
const transferTo = opt('--transfer-to', null);
const transferAmount = BigInt(opt('--transfer-amount', '0'));
const client = new BoingClient(rpc);

const secret = process.env.BOING_SECRET_HEX ? hexToBytes(process.env.BOING_SECRET_HEX.trim()) : null;
if ((execute || dryRun) && !secret) throw new Error('--execute / --dry-run need BOING_SECRET_HEX');
const senderHex = (secret ? await senderHexFromSecretKey(secret) : opt('--sender', '')).toLowerCase();
if (!senderHex) throw new Error('pass --sender 0x... (or BOING_SECRET_HEX)');
const expect = process.env.BOING_EXPECT_SENDER_HEX?.trim().toLowerCase();
if (expect && expect !== senderHex) throw new Error(`signer ${senderHex} != BOING_EXPECT_SENDER_HEX`);

const probeSubmit = flag('--probe-submit');
async function runProbe(token) {
  const probe = await probeOutsiderClaims(client, { registry, token, funder: { secret, hex: senderHex }, submit: probeSubmit });
  console.log(`throwaway account ${probe.outsider} (funded by tx ${probe.fundTx}; key in memory only)`);
  for (const r of probe.results) {
    console.log(`  ${r.label} as throwaway: ${r.success ? 'ACCEPTED (MISMATCH)' : `rejected OK (${r.error || 'failed'})`}`);
  }
  if (probe.onchain) {
    console.log(`  on chain: tx ${probe.onchain.txId} block ${probe.onchain.block} success=${probe.onchain.success}${probe.onchain.error ? ` (${probe.onchain.error})` : ''} ${probe.onchain.success ? 'MISMATCH' : 'rejected OK'}`);
  }
  const claimer = await readClaimer(client, registry, token);
  console.log(`  claimer afterwards: ${claimer}`);
  return probe.allRejected;
}
const probeOnly = opt('--probe-token', null);
if (probeOnly) {
  if (!secret || !registry) throw new Error('--probe-token needs BOING_SECRET_HEX (funder) and a registry');
  const ok = await runProbe(probeOnly.toLowerCase());
  console.log(ok ? 'PROBE OK: every outsider claim was rejected' : 'PROBE FAILED');
  process.exit(ok ? 0 : 1);
}

const acct = await client.getAccount(senderHex);
const nonce = BigInt(acct?.nonce ?? 0);
console.log(`rpc ${rpc}`);
console.log(`sender ${senderHex} nonce ${nonce} balance ${acct?.balance ?? '?'} BOING, head ${await client.chainHeight()}`);

const launch = buildBoingTokenV2LaunchTx({ senderHex, nonce, name, symbol, supply, claimRegistryHex: registry });
console.log(`token (predicted) ${launch.tokenHex}`);
console.log(
  `deploy: ${launch.deployTx.asset_name} / ${launch.deployTx.asset_symbol}, purpose ${launch.deployTx.purpose_category}, ` +
    `bytecode ${(launch.deployTx.bytecode.length - 2) / 2} bytes (init + v2 runtime), nonce ${launch.deployTx.nonce}`
);
console.log(`at deploy: admin = sender, ${launch.supply} -> sender, mint-once = 1, registry claim ${registry || 'none'}`);
if (!execute && !dryRun) process.exit(0);

/** Express JSON -> SDK TransactionInput (what Boing Express does for `contract_deploy_meta`). */
const sender = hexToAccountId(senderHex);
const deployInput = {
  nonce: BigInt(launch.deployTx.nonce),
  sender,
  payload: {
    kind: 'contractDeployWithPurposeAndMetadata',
    bytecode: hexToBytes(launch.deployTx.bytecode),
    purposeCategory: launch.deployTx.purpose_category,
    descriptionHash: launch.deployTx.description_hash ? hexToBytes(launch.deployTx.description_hash) : null,
    assetName: launch.deployTx.asset_name,
    assetSymbol: launch.deployTx.asset_symbol,
    create2Salt: null,
  },
  accessList: { read: [sender], write: [sender] },
};
const signedDeploy = await signTransactionInputForClient(client, deployInput, secret);
const deployId = transactionIdFromSignedTransactionHex(signedDeploy);
const qa = await client.qaCheck(
  launch.deployTx.bytecode,
  launch.deployTx.purpose_category,
  launch.deployTx.description_hash ?? undefined,
  launch.deployTx.asset_name,
  launch.deployTx.asset_symbol
);
console.log(`QA ${qa.result}${qa.message ? ` (${qa.message})` : ''}`);
const sim = await client.simulateTransaction(signedDeploy);
console.log(`deploy ${deployId} simulate success=${sim.success} gas=${sim.gas_used ?? '?'}${sim.error ? ` (${sim.error})` : ''}`);
if (!sim.success) throw new Error('deploy simulation failed');
if (!execute) {
  console.log('[dry-run] nothing submitted (one transaction to sign: the deploy)');
  process.exit(0);
}

async function waitReceipt(id, label) {
  for (let i = 0; i < 60; i++) {
    const rc = await client.getTransactionReceipt(id);
    if (rc) {
      console.log(`  ${label} included block ${rc.block_height ?? rc.blockHeight ?? '?'} success=${rc.success} gas=${rc.gas_used ?? '?'}${rc.error ? ` (${rc.error})` : ''}`);
      if (rc.success === false) throw new Error(`${label} failed`);
      return rc;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`${label}: no receipt after 120 s`);
}

console.log(`submit deploy: ${await submitSignedTransactionIdempotent(client, signedDeploy)}`);
await waitReceipt(deployId, 'deploy');
const nonceAfter = BigInt((await client.getAccount(senderHex))?.nonce ?? 0);
console.log(`sender nonce ${nonce} -> ${nonceAfter} (${nonceAfter - nonce} transaction)`);

console.log('\n== verification ==');
const token = launch.tokenHex;
const checks = [];
const check = (label, ok, detail) => {
  checks.push(ok);
  console.log(`${label}: ${detail} ${ok ? 'OK' : 'MISMATCH'}`);
};
const bal = await getBoingTokenBalance(client, token, senderHex);
check('creator balance', bal === launch.supply, `${bal} / supply ${launch.supply}`);
const admin = (await client.getContractStorage(token, BOING_TOKEN_ADMIN_SLOT_HEX)).value.toLowerCase();
check('admin slot', admin === senderHex, admin);
const once = BigInt((await client.getContractStorage(token, BOING_TOKEN_MINT_ONCE_SLOT_HEX)).value);
check('mint-once flag', once === 1n, String(once));
const code = await client.getContractCode(token).catch(() => null);
check('stored runtime == v2 template', code?.bytecode?.toLowerCase() === boingTokenBytecodeHex(2).toLowerCase(), `${code?.bytecode ? (code.bytecode.length - 2) / 2 : 0} bytes`);
check('one transaction', nonceAfter - nonce === 1n, `${nonceAfter - nonce}`);
if (registry) {
  const claimer = await readClaimer(client, registry, token);
  check('registry claimer', claimer === senderHex, String(claimer));
  check('outsider claims rejected', await runProbe(token), 'see above');
}
try {
  const t = await client.getDexToken(token);
  console.log(`node token discovery: ${JSON.stringify(t)}`);
} catch (e) {
  console.log(`node token discovery: ${e.message}`);
}

if (transferTo && transferAmount > 0n) {
  const n2 = BigInt((await client.getAccount(senderHex))?.nonce ?? 0);
  const tx = buildBoingTokenTransferTransaction({ nonce: n2, senderHex, tokenHex: token, toHex: transferTo, amount: transferAmount });
  const signed = await signTransactionInputForClient(client, tx, secret);
  const id = transactionIdFromSignedTransactionHex(signed);
  const s2 = await client.simulateTransaction(signed);
  if (!s2.success) throw new Error(`transfer simulation failed: ${s2.error}`);
  console.log(`submit transfer ${transferAmount} -> ${transferTo.slice(0, 12)}…: ${await submitSignedTransactionIdempotent(client, signed)} (${id})`);
  await waitReceipt(id, 'transfer');
  const [a, b] = [await getBoingTokenBalance(client, token, senderHex), await getBoingTokenBalance(client, token, transferTo)];
  console.log(`balances: sender ${a} (expected ${launch.supply - transferAmount}), recipient ${b} (expected ${transferAmount})`);
}
console.log(`\nTOKEN ${token} DEPLOY_TX ${deployId} ${checks.every(Boolean) ? 'ALL CHECKS OK' : 'SOME CHECKS FAILED'}`);
if (!checks.every(Boolean)) process.exit(1);

#!/usr/bin/env node
/**
 * Boing token v2 deploy check using the SAME builders as the Deploy token page
 * (`src/services/boingTokenV2Launch.js`). The Boing Express signing step is replaced by a key signer.
 *
 *   node scripts/check-boing-token-v2-deploy.mjs --sender 0x...            # read-only: nonce, balance, predicted token
 *   node scripts/check-boing-token-v2-deploy.mjs --dry-run                 # sign deploy + mint offline, simulate the deploy (no submit)
 *   node scripts/check-boing-token-v2-deploy.mjs --execute --name "X" --symbol X --supply 1000000 \
 *        [--transfer-to 0x... --transfer-amount 1234]                      # real deploy + mint (+ transfer); needs BOING_SECRET_HEX
 */
import {
  BoingClient,
  buildBoingTokenDeployTransaction,
  buildBoingTokenTransferTransaction,
  getBoingTokenBalance,
  hexToAccountId,
  hexToBytes,
  senderHexFromSecretKey,
  signTransactionInputForClient,
  submitSignedTransactionIdempotent,
  transactionIdFromSignedTransactionHex,
} from 'boing-sdk';
import { buildBoingTokenV2LaunchTxs } from '../src/services/boingTokenV2Launch.js';

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const rpc = opt('--rpc', process.env.BOING_RPC_URL || 'https://testnet-rpc.boing.network/');
const execute = flag('--execute');
const dryRun = flag('--dry-run');
const name = opt('--name', 'Finance V2 Check');
const symbol = opt('--symbol', 'FV2C');
const supply = opt('--supply', '1000000');
const transferTo = opt('--transfer-to', null);
const transferAmount = BigInt(opt('--transfer-amount', '0'));
const client = new BoingClient(rpc);

const secret = process.env.BOING_SECRET_HEX ? hexToBytes(process.env.BOING_SECRET_HEX.trim()) : null;
if ((execute || dryRun) && !secret) throw new Error('--execute / --dry-run need BOING_SECRET_HEX');
const senderHex = (secret ? await senderHexFromSecretKey(secret) : opt('--sender', '')).toLowerCase();
if (!senderHex) throw new Error('pass --sender 0x... (or BOING_SECRET_HEX)');
const expect = process.env.BOING_EXPECT_SENDER_HEX?.trim().toLowerCase();
if (expect && expect !== senderHex) throw new Error(`signer ${senderHex} != BOING_EXPECT_SENDER_HEX`);

const acct = await client.getAccount(senderHex);
const nonce = BigInt(acct?.nonce ?? 0);
console.log(`rpc ${rpc}`);
console.log(`sender ${senderHex} nonce ${nonce} balance ${acct?.balance ?? '?'} BOING, head ${await client.chainHeight()}`);

const launch = buildBoingTokenV2LaunchTxs({ senderHex, nonce, name, symbol, supply });
console.log(`token (predicted) ${launch.tokenHex}`);
console.log(`deploy: ${launch.deployTx.asset_name} / ${launch.deployTx.asset_symbol}, purpose ${launch.deployTx.purpose_category}, bytecode ${(launch.deployTx.bytecode.length - 2) / 2} bytes, nonce ${launch.deployTx.nonce}`);
console.log(`mint_first: ${launch.supply} -> ${senderHex.slice(0, 12)}…, nonce ${launch.mintTx.nonce}`);
if (!execute && !dryRun) process.exit(0);

/** Express JSON -> SDK TransactionInput (what Boing Express does for these two shapes). */
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
const mintInput = {
  nonce: BigInt(launch.mintTx.nonce),
  sender,
  payload: { kind: 'contractCall', contract: hexToAccountId(launch.mintTx.contract), calldata: hexToBytes(launch.mintTx.calldata) },
  accessList: { read: launch.mintTx.access_list.read.map(hexToAccountId), write: launch.mintTx.access_list.write.map(hexToAccountId) },
};
const signedDeploy = await signTransactionInputForClient(client, deployInput, secret);
const signedMint = await signTransactionInputForClient(client, mintInput, secret);
// Same bytes as the SDK / `boing token deploy` for the same nonce and metadata.
const sdkDeploy = await signTransactionInputForClient(client, buildBoingTokenDeployTransaction({ nonce, senderHex, name: deployInput.payload.assetName, symbol: deployInput.payload.assetSymbol }), secret);
console.log(`deploy tx byte-identical to SDK boing token deploy: ${signedDeploy === sdkDeploy}`);
const deployId = transactionIdFromSignedTransactionHex(signedDeploy);
const mintId = transactionIdFromSignedTransactionHex(signedMint);
const sim = await client.simulateTransaction(signedDeploy);
console.log(`deploy ${deployId} simulate success=${sim.success}${sim.error ? ` (${sim.error})` : ''}`);
console.log(`mint   ${mintId} (simulated after the deploy lands)`);
if (!execute) {
  console.log('[dry-run] nothing submitted');
  process.exit(0);
}

async function waitReceipt(id, label) {
  for (let i = 0; i < 60; i++) {
    const rc = await client.getTransactionReceipt(id);
    if (rc) {
      console.log(`  ${label} included block ${rc.block_height ?? rc.blockHeight ?? '?'} success=${rc.success}${rc.error ? ` (${rc.error})` : ''}`);
      if (rc.success === false) throw new Error(`${label} failed`);
      return rc;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`${label}: no receipt after 120 s`);
}

console.log(`submit deploy: ${await submitSignedTransactionIdempotent(client, signedDeploy)}`);
try {
  console.log(`submit mint: ${await submitSignedTransactionIdempotent(client, signedMint)}`);
} catch (e) {
  console.log(`mint submit refused before the deploy landed (${e.message}); waiting for the deploy, then resubmitting`);
  await waitReceipt(deployId, 'deploy');
  console.log(`submit mint: ${await submitSignedTransactionIdempotent(client, signedMint)}`);
}
await waitReceipt(deployId, 'deploy');
await waitReceipt(mintId, 'mint');
const bal = await getBoingTokenBalance(client, launch.tokenHex, senderHex);
console.log(`balance after mint: ${bal} (expected ${launch.supply}) ${bal === launch.supply ? 'OK' : 'MISMATCH'}`);

if (transferTo && transferAmount > 0n) {
  const n2 = BigInt((await client.getAccount(senderHex))?.nonce ?? 0);
  const tx = buildBoingTokenTransferTransaction({ nonce: n2, senderHex, tokenHex: launch.tokenHex, toHex: transferTo, amount: transferAmount });
  const signed = await signTransactionInputForClient(client, tx, secret);
  const id = transactionIdFromSignedTransactionHex(signed);
  const s2 = await client.simulateTransaction(signed);
  if (!s2.success) throw new Error(`transfer simulation failed: ${s2.error}`);
  console.log(`submit transfer ${transferAmount} -> ${transferTo.slice(0, 12)}…: ${await submitSignedTransactionIdempotent(client, signed)} (${id})`);
  await waitReceipt(id, 'transfer');
  const [a, b] = [await getBoingTokenBalance(client, launch.tokenHex, senderHex), await getBoingTokenBalance(client, launch.tokenHex, transferTo)];
  console.log(`balances: sender ${a} (expected ${launch.supply - transferAmount}), recipient ${b} (expected ${transferAmount})`);
}
console.log(`TOKEN ${launch.tokenHex} DEPLOY_TX ${deployId} MINT_TX ${mintId}`);

#!/usr/bin/env node
/**
 * Custody-swap check using the SAME service code as the UI (`src/services/nativeDexCustodySwap.js`).
 *
 *   node scripts/check-custody-swap.mjs                       # read-only: discover pools, quote, allowance state
 *   node scripts/check-custody-swap.mjs --dry-run             # also sign approve + swap offline (no submit)
 *   node scripts/check-custody-swap.mjs --execute --amount 5 --in usdc   # real swap (needs BOING_SECRET_HEX)
 *
 * Wallet step replaced by a key signer that mirrors Boing Express: sign -> simulate -> submit -> wait for receipt.
 */
import {
  BoingClient,
  CANONICAL_BOING_TESTNET_BOING_TOKEN_HEX,
  CANONICAL_BOING_TESTNET_USDC_TOKEN_HEX,
  buildBoingPoolCallTransaction,
  getBoingTokenBalance,
  hexToBytes,
  senderHexFromSecretKey,
  signTransactionInput,
  submitSignedTransactionIdempotent,
  transactionIdFromSignedTransactionHex,
} from 'boing-sdk';
import { CUSTODY_APPROVAL, executeCustodySwap, loadCustodyPools, planCustodySwap } from '../src/services/nativeDexCustodySwap.js';

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const rpc = opt('--rpc', process.env.BOING_RPC_URL || 'https://testnet-rpc.boing.network/');
const execute = flag('--execute');
const dryRun = flag('--dry-run');
const amountIn = BigInt(opt('--amount', '5'));
const tokenInHex = opt('--in', 'usdc') === 'boing' ? CANONICAL_BOING_TESTNET_BOING_TOKEN_HEX : CANONICAL_BOING_TESTNET_USDC_TOKEN_HEX;
const client = new BoingClient(rpc);

const secret = process.env.BOING_SECRET_HEX ? hexToBytes(process.env.BOING_SECRET_HEX.trim()) : null;
if ((execute || dryRun) && !secret) throw new Error('--execute / --dry-run need BOING_SECRET_HEX');
const senderHex = secret ? await senderHexFromSecretKey(secret) : opt('--sender', null);
if (!senderHex) throw new Error('pass --sender 0x... (or BOING_SECRET_HEX)');

const pools = await loadCustodyPools(client);
console.log(`custody pools: ${pools.length}`);
for (const p of pools) console.log(`  ${p.poolHex} ${p.tokenAHex.slice(0, 10)}/${p.tokenBHex.slice(0, 10)} reserves ${p.reserveA}:${p.reserveB}`);
const pool = pools.find((p) => p.tokenAHex === tokenInHex.toLowerCase() || p.tokenBHex === tokenInHex.toLowerCase());
if (!pool) throw new Error('no custody pool for that token');

const plan = await planCustodySwap(client, { poolHex: pool.poolHex, tokenInHex, amountIn, slippagePercent: 0.5, senderHex });
console.log(`quote: ${amountIn} in -> ${plan.amountOut} out (min ${plan.minOut}), allowance ${plan.allowance} => ${plan.approvalState}`);

const tokenOutHex = plan.hop.tokenOutHex;
const bal = async () => [await getBoingTokenBalance(client, tokenInHex, senderHex), await getBoingTokenBalance(client, tokenOutHex, senderHex)];

/** Key signer mirroring boingExpressContractCallSignSimulateSubmit. */
async function signSimulateSubmit(expressTx, o = {}) {
  const acct = await client.getAccount(senderHex);
  const tx = buildBoingPoolCallTransaction({
    nonce: BigInt(acct?.nonce ?? 0),
    senderHex,
    poolHex: expressTx.contract,
    calldata: hexToBytes(expressTx.calldata),
    extraAccountsHex: expressTx.access_list.read,
  });
  const signedHex = await signTransactionInput(tx, secret);
  const boingTxIdHex = transactionIdFromSignedTransactionHex(signedHex);
  const sim = await client.simulateTransaction(signedHex);
  if (!sim.success) throw new Error(`simulation failed: ${sim.error}`);
  if (dryRun) {
    console.log(`  [dry-run] signed ${boingTxIdHex} (not submitted)`);
    return { txHash: null, boingTxIdHex };
  }
  const r = await submitSignedTransactionIdempotent(client, signedHex);
  console.log(`  submitted ${boingTxIdHex} (${r})`);
  if (o.waitForInclusion) {
    for (let i = 0; i < 60; i++) {
      const rc = await client.getTransactionReceipt(boingTxIdHex);
      if (rc) {
        console.log(`  included block ${rc.block_height ?? rc.blockHeight ?? '?'} success=${rc.success}`);
        if (rc.success === false) throw new Error(`tx failed: ${rc.error ?? 'unknown'}`);
        break;
      }
      await new Promise((r2) => setTimeout(r2, 2000));
    }
  }
  return { txHash: r, boingTxIdHex };
}

if (dryRun) {
  // Only the first tx can be simulated before the approve lands; sign it offline.
  if (plan.approveTx) await signSimulateSubmit((await import('boing-sdk')).boingContractCallToExpressTx(plan.approveTx));
  else await signSimulateSubmit((await import('boing-sdk')).boingContractCallToExpressTx(plan.swapTx));
  console.log('dry run ok');
} else if (execute) {
  const before = await bal();
  const res = await executeCustodySwap(client, plan, { senderHex, signSimulateSubmit, onState: (s) => console.log(`state: ${s}`) });
  const after = await bal();
  console.log(`balances in/out before ${before.join('/')} after ${after.join('/')}`);
  console.log(JSON.stringify({ approve: res.approve?.boingTxIdHex ?? null, swap: res.swap.boingTxIdHex }));
  if (before[0] - after[0] !== amountIn) throw new Error('input delta mismatch');
  if (after[1] - before[1] < plan.minOut) throw new Error('output below minOut');
  console.log(`ok: ${CUSTODY_APPROVAL.DONE}`);
}
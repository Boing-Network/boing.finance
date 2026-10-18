/**
 * Add / remove liquidity on custody (v8/v9) pools, signed through an injected `signSimulateSubmit`
 * (Boing Express in the app, a key in scripts). Only imports `boing-sdk`, so it also runs in Node.
 * Approvals are for EXACTLY the deposit amount and wait for inclusion before the pool call.
 *
 * v10 pools pairing native BOING (wBOING) use ONE batch instead (one Boing Express confirmation):
 *   add:    wBOING.deposit (BOING sent as call value) -> approve wBOING -> approve other token -> add_liquidity
 *   remove: remove_liquidity -> wBOING.withdraw_all (the BOING side arrives as native BOING)
 */

const lc = (h) => String(h || '').toLowerCase();

/** Batch request for a native-BOING add (exported for tests). Nonce is refreshed by the signer. */
export function buildNativeAddLiquidityRequest(p) {
  const w = lc(p.wboingHex || WBOING_HEX);
  const [boingAmount, otherHex, otherAmount] = isNativeBoingId(p.tokenAHex) || lc(p.tokenAHex) === w
    ? [p.amountA, p.tokenBHex, p.amountB]
    : [p.amountB, p.tokenAHex, p.amountA];
  const tx = buildBatchTransaction({
    nonce: 0n,
    senderHex: p.senderHex,
    calls: [
      { kind: 'contractCallWithValue', contractHex: w, calldata: encodeWboingDepositCalldata(), value: boingAmount },
      { kind: 'contractCall', contractHex: w, calldata: encodeReferenceApproveCalldata(p.poolHex, boingAmount) },
      { kind: 'contractCall', contractHex: otherHex, calldata: encodeReferenceApproveCalldata(p.poolHex, otherAmount) },
      { kind: 'contractCall', contractHex: p.poolHex, calldata: encodeBoingPoolV8AddLiquidityCalldata(p.amountA, p.amountB, p.minLp ?? 1n, 0n) },
    ],
  });
  return boingTxToExpressRequest(tx);
}

/** Batch request for a native-BOING remove (exported for tests). */
export function buildNativeRemoveLiquidityRequest(p) {
  const w = lc(p.wboingHex || WBOING_HEX);
  const tx = buildBatchTransaction({
    nonce: 0n,
    senderHex: p.senderHex,
    calls: [
      { kind: 'contractCall', contractHex: p.poolHex, calldata: encodeBoingPoolV8RemoveLiquidityCalldata(p.burn, p.minA, p.minB, 0n) },
      { kind: 'contractCall', contractHex: w, calldata: encodeWboingWithdrawAllCalldata() },
    ],
    accessList: (() => {
      const ids = [p.senderHex, p.poolHex, p.tokenAHex, p.tokenBHex, w].map(lc).filter((v, i, a) => a.indexOf(v) === i);
      return { read: ids, write: ids };
    })(),
  });
  return boingTxToExpressRequest(tx);
}

/** True when the pool pairs native BOING (either side is wBOING). */
const isNativePair = (p) => isNativeBoingId(p.tokenAHex) || isNativeBoingId(p.tokenBHex);
import {
  boingContractCallToExpressTx,
  boingTxToExpressRequest,
  buildBatchTransaction,
  buildBoingPoolCallTransaction,
  buildBoingTokenApproveTransaction,
  encodeBoingPoolV8AddLiquidityCalldata,
  encodeBoingPoolV8RemoveLiquidityCalldata,
  encodeReferenceApproveCalldata,
  encodeWboingDepositCalldata,
  encodeWboingWithdrawAllCalldata,
  getBoingTokenAllowance,
} from 'boing-sdk';
import { WBOING_HEX, isNativeBoingId } from './boingSwapQuote.js';

/**
 * @param {import('boing-sdk').BoingClient} client
 * @param {{ poolHex: string, tokenAHex: string, tokenBHex: string, amountA: bigint, amountB: bigint, minLp?: bigint,
 *   senderHex: string, signSimulateSubmit: Function, onState?: (s: string) => void }} p
 */
export async function executeAddLiquidity(client, p) {
  const out = { approvals: [], add: null };
  if (isNativePair(p)) {
    p.onState?.('add_native');
    out.add = await p.signSimulateSubmit(buildNativeAddLiquidityRequest(p), { waitForInclusion: true });
    return out;
  }
  const legs = [
    [p.tokenAHex, p.amountA, 'a'],
    [p.tokenBHex, p.amountB, 'b'],
  ];
  for (const [token, amount, side] of legs) {
    const have = await getBoingTokenAllowance(client, token, p.senderHex, p.poolHex);
    if (have >= amount) continue;
    p.onState?.(`approve_${side}`);
    const tx = buildBoingTokenApproveTransaction({ nonce: 0n, senderHex: p.senderHex, tokenHex: token, toHex: p.poolHex, amount });
    out.approvals.push(await p.signSimulateSubmit(boingContractCallToExpressTx(tx), { waitForInclusion: true }));
  }
  p.onState?.('add');
  const tx = buildBoingPoolCallTransaction({
    nonce: 0n,
    senderHex: p.senderHex,
    poolHex: p.poolHex,
    calldata: encodeBoingPoolV8AddLiquidityCalldata(p.amountA, p.amountB, p.minLp ?? 1n, 0n),
    extraAccountsHex: [p.tokenAHex, p.tokenBHex],
  });
  out.add = await p.signSimulateSubmit(boingContractCallToExpressTx(tx), { waitForInclusion: true });
  return out;
}

/**
 * @param {import('boing-sdk').BoingClient} _client
 * @param {{ poolHex: string, tokenAHex: string, tokenBHex: string, burn: bigint, minA: bigint, minB: bigint,
 *   senderHex: string, signSimulateSubmit: Function }} p
 */
export async function executeRemoveLiquidity(_client, p) {
  if (isNativePair(p)) return p.signSimulateSubmit(buildNativeRemoveLiquidityRequest(p), { waitForInclusion: true });
  const tx = buildBoingPoolCallTransaction({
    nonce: 0n,
    senderHex: p.senderHex,
    poolHex: p.poolHex,
    calldata: encodeBoingPoolV8RemoveLiquidityCalldata(p.burn, p.minA, p.minB, 0n),
    extraAccountsHex: [p.tokenAHex, p.tokenBHex],
  });
  return p.signSimulateSubmit(boingContractCallToExpressTx(tx), { waitForInclusion: true });
}

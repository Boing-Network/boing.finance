/**
 * Add / remove liquidity on custody (v8/v9) pools, signed through an injected `signSimulateSubmit`
 * (Boing Express in the app, a key in scripts). Only imports `boing-sdk`, so it also runs in Node.
 * Approvals are for EXACTLY the deposit amount and wait for inclusion before the pool call.
 */
import {
  boingContractCallToExpressTx,
  buildBoingPoolCallTransaction,
  buildBoingTokenApproveTransaction,
  encodeBoingPoolV8AddLiquidityCalldata,
  encodeBoingPoolV8RemoveLiquidityCalldata,
  getBoingTokenAllowance,
} from 'boing-sdk';

/**
 * @param {import('boing-sdk').BoingClient} client
 * @param {{ poolHex: string, tokenAHex: string, tokenBHex: string, amountA: bigint, amountB: bigint, minLp?: bigint,
 *   senderHex: string, signSimulateSubmit: Function, onState?: (s: string) => void }} p
 */
export async function executeAddLiquidity(client, p) {
  const out = { approvals: [], add: null };
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
  const tx = buildBoingPoolCallTransaction({
    nonce: 0n,
    senderHex: p.senderHex,
    poolHex: p.poolHex,
    calldata: encodeBoingPoolV8RemoveLiquidityCalldata(p.burn, p.minA, p.minB, 0n),
    extraAccountsHex: [p.tokenAHex, p.tokenBHex],
  });
  return p.signSimulateSubmit(boingContractCallToExpressTx(tx), { waitForInclusion: true });
}

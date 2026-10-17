/**
 * Custody (v8/v9) pool swaps through the canonical custody router.
 *
 * Flow: discover pools (`boing_listDexPools` + custody probe) -> live quote -> read allowance ->
 * approve the router for EXACTLY `amountIn` when needed (waits for inclusion) -> router swap with a
 * slippage-bounded `min_out`. The v1 ledger-pool swap panel is untouched.
 *
 * Only imports `boing-sdk` so it runs in Node too (see `scripts/check-custody-swap.mjs`); wallet signing is injected.
 */
import {
  CANONICAL_BOING_TESTNET_CUSTODY_ROUTER_HEX,
  boingContractCallToExpressTx,
  discoverBoingCustodyPools,
  getBoingTokenAllowance,
  quoteBoingCustodySwap,
} from 'boing-sdk';

export const CUSTODY_ROUTER_HEX =
  (typeof process !== 'undefined' && process.env?.REACT_APP_BOING_CUSTODY_ROUTER?.trim()) ||
  CANONICAL_BOING_TESTNET_CUSTODY_ROUTER_HEX;

/** UI states for the allowance / approval step. */
export const CUSTODY_APPROVAL = Object.freeze({
  IDLE: 'idle',
  CHECKING: 'checking',
  SUFFICIENT: 'sufficient',
  NEEDS_APPROVAL: 'needs_approval',
  APPROVING: 'approving',
  APPROVED: 'approved',
  SWAPPING: 'swapping',
  DONE: 'done',
  ERROR: 'error',
});

/** @param {import('boing-sdk').BoingClient} client */
export async function loadCustodyPools(client) {
  return discoverBoingCustodyPools(client);
}

/**
 * Deploy name / symbol for custody tokens via full `boing_getDexToken` (not light), best effort.
 * @param {import('boing-sdk').BoingClient} client
 * @param {string[]} ids
 * @returns {Promise<Array<{ id: string, symbol: string, name: string }>>}
 */
export async function loadCustodyTokenMetadata(client, ids) {
  const rows = await Promise.all(
    (ids || []).slice(0, 25).map(async (id) => {
      try {
        const r = await client.getDexToken(id);
        if (!r) return null;
        return { id: String(r.id || id).toLowerCase(), symbol: String(r.symbol || ''), name: String(r.name || '') };
      } catch {
        return null;
      }
    }),
  );
  return rows.filter(Boolean);
}

/** Slippage percent (UI, e.g. 0.5) -> bps bigint, clamped to [0, 5000]. */
export function slippagePercentToBps(pct) {
  const n = Number(pct);
  if (!Number.isFinite(n) || n < 0) return 50n;
  return BigInt(Math.min(5000, Math.round(n * 100)));
}

/**
 * @param {import('boing-sdk').BoingClient} client
 * @param {{ poolHex: string, tokenInHex: string, amountIn: bigint, slippagePercent: number, senderHex: string, routerHex?: string }} p
 */
export async function planCustodySwap(client, p) {
  return quoteBoingCustodySwap(client, {
    poolHex: p.poolHex,
    tokenInHex: p.tokenInHex,
    amountIn: p.amountIn,
    slippageBps: slippagePercentToBps(p.slippagePercent),
    senderHex: p.senderHex,
    routerHex: p.routerHex || CUSTODY_ROUTER_HEX,
  });
}

/**
 * Execute a plan. `signSimulateSubmit(expressTx, { waitForInclusion })` signs in the wallet (or with a key in
 * scripts), simulates, submits and returns `{ txHash, boingTxIdHex }`. Nonces are refreshed by the signer.
 * Re-reads the allowance after the approval so the swap never runs without one.
 *
 * @param {import('boing-sdk').BoingClient} client
 * @param {import('boing-sdk').BoingCustodySwapPlan} plan
 * @param {{ senderHex: string, routerHex?: string, signSimulateSubmit: Function, onState?: (s: string) => void }} o
 */
export async function executeCustodySwap(client, plan, o) {
  const routerHex = o.routerHex || CUSTODY_ROUTER_HEX;
  const set = (s) => o.onState?.(s);
  const out = { approve: null, swap: null };
  if (plan.approveTx) {
    set(CUSTODY_APPROVAL.APPROVING);
    out.approve = await o.signSimulateSubmit(boingContractCallToExpressTx(plan.approveTx), { waitForInclusion: true });
    const now = await getBoingTokenAllowance(client, plan.hop.tokenInHex, o.senderHex, routerHex);
    if (now < plan.amountIn) throw new Error(`Approval not visible yet (allowance ${now} < ${plan.amountIn}); retry in a moment.`);
    set(CUSTODY_APPROVAL.APPROVED);
  }
  set(CUSTODY_APPROVAL.SWAPPING);
  out.swap = await o.signSimulateSubmit(boingContractCallToExpressTx(plan.swapTx), { waitForInclusion: true });
  set(CUSTODY_APPROVAL.DONE);
  return out;
}
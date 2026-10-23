/**
 * LP vault v2 (custody v8/v9 pools): balanced deposit -> shares, withdraw shares -> both tokens.
 * Imports only `boing-sdk` (Node-testable); wallet signing is injected like `nativeDexCustodySwap.js`.
 */
import {
  CANONICAL_BOING_TESTNET_LP_VAULT_V2_HEX,
  boingContractCallToExpressTx,
  buildBoingLpVaultV2DepositFlow,
  buildBoingLpVaultV2WithdrawTransaction,
  getBoingLpVaultV2Shares,
  getBoingLpVaultV2State,
  getBoingPoolState,
  getBoingTokenAllowance,
  getBoingTokenBalance,
  quoteBoingLpVaultV2Deposit,
  quoteBoingLpVaultV2Withdraw,
} from '@boing-network/boing-sdk';

export const LP_VAULT_V2_HEX =
  (typeof process !== 'undefined' && process.env?.REACT_APP_BOING_LP_VAULT_V2?.trim()) || CANONICAL_BOING_TESTNET_LP_VAULT_V2_HEX;

/** Vault config + pool reserves + (optional) holder shares / balances / allowances to the vault. */
export async function loadLpVaultV2(client, holderHex, vaultHex = LP_VAULT_V2_HEX) {
  const vault = await getBoingLpVaultV2State(client, vaultHex);
  if (!vault.configured) throw new Error('LP vault v2 is not configured');
  const pool = await getBoingPoolState(client, vault.poolHex);
  const out = { vaultHex, vault, pool, holder: null };
  if (holderHex) {
    const [shares, balA, balB, allowA, allowB] = await Promise.all([
      getBoingLpVaultV2Shares(client, vaultHex, holderHex),
      getBoingTokenBalance(client, vault.tokenAHex, holderHex),
      getBoingTokenBalance(client, vault.tokenBHex, holderHex),
      getBoingTokenAllowance(client, vault.tokenAHex, holderHex, vaultHex),
      getBoingTokenAllowance(client, vault.tokenBHex, holderHex, vaultHex),
    ]);
    out.holder = { shares, balA, balB, allowA, allowB };
  }
  return out;
}

const cfgOf = (s) => ({ vaultHex: s.vaultHex, poolHex: s.vault.poolHex, tokenAHex: s.vault.tokenAHex, tokenBHex: s.vault.tokenBHex });

/** Plan a balanced deposit for `amountA`; approvals are skipped when the current allowance already covers them. */
export function planLpVaultV2Deposit(s, senderHex, amountA, slippageBps = 50n) {
  const q = quoteBoingLpVaultV2Deposit(s.pool, amountA, slippageBps);
  const [apA, apB, dep] = buildBoingLpVaultV2DepositFlow(0n, senderHex, cfgOf(s), q.amountA, q.amountB, q.minShares);
  const needA = !s.holder || s.holder.allowA < q.amountA;
  const needB = !s.holder || s.holder.allowB < q.amountB;
  const steps = [];
  if (needA) steps.push({ label: 'approve A', tx: boingContractCallToExpressTx(apA) });
  if (needB) steps.push({ label: 'approve B', tx: boingContractCallToExpressTx(apB) });
  steps.push({ label: 'deposit', tx: boingContractCallToExpressTx(dep) });
  return { ...q, needA, needB, steps };
}

export function planLpVaultV2Withdraw(s, senderHex, shares, slippageBps = 50n) {
  if (shares <= 0n) throw new Error('shares must be > 0');
  if (s.holder && shares > s.holder.shares) throw new Error('more shares than you hold');
  const q = quoteBoingLpVaultV2Withdraw(s.pool, shares, slippageBps);
  const tx = buildBoingLpVaultV2WithdrawTransaction(0n, senderHex, cfgOf(s), shares, q.minA, q.minB);
  return { ...q, shares, steps: [{ label: 'withdraw', tx: boingContractCallToExpressTx(tx) }] };
}

/** Run plan steps in order; each waits for inclusion (later steps simulate against applied approvals). */
export async function executeLpVaultV2Steps(plan, signSimulateSubmit, onStep) {
  const results = [];
  for (const st of plan.steps) {
    onStep?.(st.label);
    results.push({ label: st.label, ...(await signSimulateSubmit(st.tx, { waitForInclusion: true })) });
  }
  onStep?.('done');
  return results;
}
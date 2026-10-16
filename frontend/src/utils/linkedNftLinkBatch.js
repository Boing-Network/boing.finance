/**
 * Pure helpers for the linked NFT ↔ token registry flow: decide which steps are needed
 * (skip assets the linker already claims) and pack them into ONE native Boing batch tx
 * (`type: 'batch'`, Rust payload variant 9, max 16 steps) so the wallet prompts once.
 */

export const LINK_BATCH_MAX_STEPS = 16;

const ZERO32 = `0x${'0'.repeat(64)}`;

function norm(h) {
  const t = String(h || '').trim().toLowerCase();
  if (!t) return '';
  return t.startsWith('0x') ? t : `0x${t}`;
}

/** Last 32-byte word of `get_asset_claimer` return data → claimer hex, or null when unclaimed / unknown. */
export function decodeClaimerReturnData(returnDataHex) {
  const raw = String(returnDataHex || '').replace(/^0x/i, '').toLowerCase();
  if (raw.length < 64) return null;
  const w = `0x${raw.slice(-64)}`;
  return w === ZERO32 ? null : w;
}

/**
 * @param {{
 *   linker: string, registryId: string, collection: string, token: string,
 *   claimers?: Record<string, string|null|undefined>, // undefined = unknown (claim anyway; claim is idempotent for the same claimer)
 *   encodeClaim: (asset: string) => string, encodeRegister: (collection: string, token: string) => string,
 * }} p
 * @returns {{ ok: true, steps: { contract: string, calldata: string, label: string }[] } | { ok: false, code: string, message: string }}
 */
export function planLinkSteps(p) {
  const linker = norm(p.linker);
  const registry = norm(p.registryId);
  const claimers = p.claimers || {};
  const steps = [];
  for (const [asset, label] of [[p.collection, 'collection'], [p.token, 'token']]) {
    const a = norm(asset);
    const c = claimers[a];
    if (c !== undefined && c !== null && norm(c) !== linker) {
      return {
        ok: false,
        code: 'claimed_by_other',
        message: `The ${label} ${a.slice(0, 10)}… is claimed in the registry by ${norm(c).slice(0, 10)}…, not your connected account. Only the claimer of both sides can link.`,
      };
    }
    if (c === undefined || c === null) {
      steps.push({ contract: registry, calldata: p.encodeClaim(a), label: `Claim ${label}` });
    }
  }
  steps.push({ contract: registry, calldata: p.encodeRegister(norm(p.collection), norm(p.token)), label: 'Register link' });
  return { ok: true, steps };
}

/** One Express `batch` request carrying every step (single signature, atomic). */
export function buildLinkBatchTx({ linker, registryId, steps, assets = [] }) {
  if (!Array.isArray(steps) || steps.length === 0) throw new Error('No steps to batch');
  if (steps.length > LINK_BATCH_MAX_STEPS) throw new Error(`Batch exceeds ${LINK_BATCH_MAX_STEPS} steps`);
  const accounts = [...new Set([linker, registryId, ...assets, ...steps.map((s) => s.contract)].filter(Boolean).map(norm))];
  return {
    type: 'batch',
    calls: steps.map((s) => ({ type: 'contract_call', contract: norm(s.contract), calldata: s.calldata })),
    access_list: { read: accounts, write: accounts },
  };
}

/** Wallet builds without batch signing answer with this; fall back to one tx per step. */
export function isWalletBatchUnsupportedError(e) {
  const m = String(e?.message || e || '');
  return /unsupported transaction type:?\s*batch|unknown (tx|transaction) type.*batch|batch.*not supported/i.test(m);
}

/** Decide batch vs sequential: batch only when >1 step, within the cap, and the node advertises batch. */
export function shouldUseLinkBatch(stepCount, { nodeBatch = false, maxSteps = LINK_BATCH_MAX_STEPS } = {}) {
  return stepCount > 1 && nodeBatch && stepCount <= Math.min(maxSteps || LINK_BATCH_MAX_STEPS, LINK_BATCH_MAX_STEPS);
}
/** Pack prebuilt Express `contract_call` txs (e.g. SDK register-flow txs) into one `batch`, merging access lists. */
export function flowTxsToBatchTx(flow) {
  if (!Array.isArray(flow) || flow.length === 0) throw new Error('No steps to batch');
  if (flow.length > LINK_BATCH_MAX_STEPS) throw new Error(`Batch exceeds ${LINK_BATCH_MAX_STEPS} steps`);
  const read = new Set();
  const write = new Set();
  const calls = flow.map((tx, i) => {
    const type = tx?.type ?? tx?.txType;
    if (type !== 'contract_call') throw new Error(`Step ${i + 1} is ${type}; only contract calls can be batched here`);
    for (const a of tx.access_list?.read || []) read.add(norm(a));
    for (const a of tx.access_list?.write || []) write.add(norm(a));
    read.add(norm(tx.contract));
    write.add(norm(tx.contract));
    return { type: 'contract_call', contract: norm(tx.contract), calldata: tx.calldata };
  });
  return { type: 'batch', calls, access_list: { read: [...read], write: [...write] } };
}
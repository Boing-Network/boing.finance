/**
 * "Publish interface" flow for the on-chain interface registry (boing.network docs/INTERFACE-REGISTRY.md).
 * Pure helpers with an injected `rpc(method, params)` so they run in node tests and in the browser.
 *
 * Trust model (same checks boing.observer applies before showing "Published by deployer"):
 *  - the claimer must be the contract's deployer (nonce-derived or CREATE2 deploy from the wallet), and
 *  - BLAKE3 of the bytes served at the URI must equal the recorded hash.
 */
import { blake3 } from '@noble/hashes/blake3';
import {
  CANONICAL_BOING_TESTNET_INTERFACE_BLOB_STORE_HEX,
  CANONICAL_BOING_TESTNET_INTERFACE_REGISTRY_HEX,
  INTERFACE_REGISTRY_MAX_URI_BYTES,
  buildHostInterfaceBlobFlow,
  isInterfaceBlobUri,
  parseInterfaceBlobUri,
  buildPublishInterfaceFlowTxs,
  fetchInterfaceRecord,
  interfaceJsonHashHex,
  predictCreate2ContractAddress,
} from '@boing-network/boing-sdk';

export const INTERFACE_SCHEMA = 'boing-interface/v1';
export const PARAM_TYPES = ['account', 'u128', 'u64', 'bytes32', 'bool', 'u8'];
export const MAX_NONCE_SCAN = 200_000;
export const INTERFACE_REGISTRY_ID = CANONICAL_BOING_TESTNET_INTERFACE_REGISTRY_HEX;
export const INTERFACE_BLOB_STORE_ID = CANONICAL_BOING_TESTNET_INTERFACE_BLOB_STORE_HEX;

const h64 = (h) => String(h ?? '').trim().replace(/^0x/i, '').toLowerCase();
export const hex0x = (h) => `0x${h64(h)}`;
export const isAccountHex = (h) => /^[0-9a-f]{64}$/.test(h64(h));

function hexToBytes(h) {
  const s = h64(h);
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return out;
}
const bytesToHex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

/** `BLAKE3(sender || nonce_le)` (nonce-derived deploy address), 64 hex without 0x. */
export function nonceDerivedAddress(sender, nonce) {
  const buf = new Uint8Array(40);
  buf.set(hexToBytes(sender), 0);
  let n = Number(nonce);
  for (let i = 0; i < 8; i++) {
    buf[32 + i] = n % 256;
    n = Math.floor(n / 256);
  }
  return bytesToHex(blake3(buf));
}

/** Bytes from a JSON byte array or hex string. */
function asBytes(v) {
  if (Array.isArray(v)) return Uint8Array.from(v.map(Number));
  if (typeof v === 'string' && /^(0x)?[0-9a-f]*$/i.test(v) && h64(v).length % 2 === 0) return hexToBytes(v);
  return null;
}

/** Inner payload object of a block tx (`{ ContractDeployWithPurpose: {...} }` or flat `{ kind, ... }`). */
export function deployPayloadParts(payload) {
  if (!payload || typeof payload !== 'object') return null;
  let inner = payload;
  const keys = Object.keys(payload);
  if (keys.length === 1 && payload[keys[0]] && typeof payload[keys[0]] === 'object' && !Array.isArray(payload[keys[0]])) {
    inner = payload[keys[0]];
  }
  const bytecode = asBytes(inner.bytecode);
  if (!bytecode) return null;
  const saltRaw = inner.create2_salt ?? inner.create2Salt ?? null;
  const salt = saltRaw == null ? null : asBytes(saltRaw);
  return { bytecode, salt: salt && salt.length === 32 ? salt : null };
}

/**
 * Is `wallet` the deployer of `contract`? Checks nonce-derived addresses for every nonce the wallet used, then
 * CREATE2 deploys found in the wallet's history (`boing_getAccountTransactions` + block lookup).
 * @returns {Promise<{ ok: boolean, method?: 'nonce'|'create2', nonce?: number, height?: number, reason?: string }>}
 */
export async function verifyDeployer(rpc, wallet, contract, { maxPages = 5 } = {}) {
  const w = h64(wallet);
  const c = h64(contract);
  let nonce = 0;
  try {
    const acc = await rpc('boing_getAccount', [hex0x(w)]);
    nonce = Number(acc?.nonce ?? 0) || 0;
  } catch {
    nonce = 0;
  }
  for (let i = 0; i < Math.min(nonce, MAX_NONCE_SCAN); i++) {
    if (nonceDerivedAddress(w, i) === c) return { ok: true, method: 'nonce', nonce: i };
  }
  let cursor = null;
  for (let page = 0; page < maxPages; page++) {
    let r;
    try {
      r = await rpc('boing_getAccountTransactions', [hex0x(w), { cursor, limit: 100 }]);
    } catch {
      break;
    }
    for (const row of r?.transactions ?? []) {
      const kind = String(row?.payload?.kind ?? '');
      if (row?.direction !== 'out' || !kind.startsWith('contract_deploy') || !Number.isInteger(row.block_height)) continue;
      let block;
      try {
        block = await rpc('boing_getBlockByHeight', [row.block_height]);
      } catch {
        continue;
      }
      const txs = block?.transactions ?? [];
      const cands = Number.isInteger(row.tx_index) ? [txs[row.tx_index]] : txs;
      for (const tx of cands) {
        if (!tx || h64(tx.sender) !== w) continue;
        const parts = deployPayloadParts(tx.payload);
        if (!parts?.salt) continue;
        const predicted = h64(predictCreate2ContractAddress(hex0x(w), parts.salt, parts.bytecode));
        if (predicted === c) return { ok: true, method: 'create2', height: row.block_height };
      }
    }
    cursor = r?.next_cursor ?? null;
    if (!cursor) break;
  }
  return {
    ok: false,
    reason: 'This wallet did not deploy the contract (no nonce-derived or CREATE2 deploy from it matches the address).',
  };
}

/** Contract code + deployer check + current registry record for the page's first step. */
export async function inspectContract(rpc, { wallet, contract, registry = INTERFACE_REGISTRY_ID }) {
  if (!isAccountHex(contract)) return { ok: false, code: 'bad_address', message: 'Enter a 32-byte contract id (0x + 64 hex).' };
  const code = await rpc('boing_getContractCode', [hex0x(contract)]);
  if (!code || !code.bytecode) {
    return { ok: false, code: 'not_contract', message: 'No contract code at this address (boing_getContractCode returned null).' };
  }
  const getStorage = async (reg, key) => rpc('boing_getContractStorage', [reg, key]);
  const [deployer, rec] = await Promise.all([
    wallet ? verifyDeployer(rpc, wallet, contract) : Promise.resolve({ ok: false, reason: 'Connect Boing Express.' }),
    fetchInterfaceRecord(getStorage, hex0x(contract), registry).catch(() => ({ claimer: null, record: null })),
  ]);
  const claimer = rec.claimer ? h64(rec.claimer) : null;
  const claimedByOther = Boolean(claimer && wallet && claimer !== h64(wallet));
  return {
    ok: true,
    code: { codeHash: h64(code.code_hash), size: Number(code.size) || h64(code.bytecode).length / 2 },
    deployer,
    claimer,
    claimedByOther,
    record: rec.record
      ? { ...rec.record, claimer: h64(rec.record.claimer), publisher: h64(rec.record.publisher), interfaceHash: h64(rec.record.interfaceHash) }
      : null,
  };
}

/**
 * Validate an interface document against the shape boing.observer accepts.
 * @returns {{ ok: true, doc: object, warnings: string[] } | { ok: false, errors: string[] }}
 */
export function validateInterfaceDoc(input) {
  const errors = [];
  const warnings = [];
  let v = input;
  if (typeof input === 'string') {
    try {
      v = JSON.parse(input);
    } catch (e) {
      return { ok: false, errors: [`JSON does not parse: ${e.message}`] };
    }
  }
  if (!v || typeof v !== 'object' || Array.isArray(v)) return { ok: false, errors: ['Top level must be a JSON object.'] };
  if (!Array.isArray(v.functions)) return { ok: false, errors: ['Missing "functions" array.'] };
  if (v.functions.length === 0) warnings.push('No functions listed.');
  const seen = new Set();
  v.functions.forEach((f, i) => {
    const at = `functions[${i}]`;
    if (!f || typeof f !== 'object') {
      errors.push(`${at} must be an object.`);
      return;
    }
    if (!Number.isInteger(f.selector) || f.selector < 0 || f.selector > 255) errors.push(`${at}.selector must be an integer 0..255.`);
    else if (seen.has(f.selector)) warnings.push(`${at}.selector 0x${f.selector.toString(16).padStart(2, '0')} is listed twice.`);
    else seen.add(f.selector);
    if (typeof f.name !== 'string' || !f.name.trim()) errors.push(`${at}.name is required.`);
    if (f.kind !== undefined && f.kind !== 'read' && f.kind !== 'write') errors.push(`${at}.kind must be "read" or "write".`);
    if (f.params !== undefined && !Array.isArray(f.params)) errors.push(`${at}.params must be an array.`);
    (Array.isArray(f.params) ? f.params : []).forEach((p, j) => {
      if (!p || !PARAM_TYPES.includes(p.type)) errors.push(`${at}.params[${j}].type must be one of ${PARAM_TYPES.join(', ')}.`);
      if (!p || typeof p.name !== 'string' || !p.name) errors.push(`${at}.params[${j}].name is required.`);
    });
  });
  if (v.schema !== undefined && v.schema !== INTERFACE_SCHEMA) warnings.push(`schema is "${v.schema}"; expected "${INTERFACE_SCHEMA}".`);
  return errors.length ? { ok: false, errors } : { ok: true, doc: v, warnings };
}

/** Exact bytes to host and hash: pretty JSON + trailing newline. */
export function canonicalInterfaceText(doc) {
  return `${JSON.stringify(doc, null, 2)}\n`;
}

export function interfaceHashOfText(text) {
  return h64(interfaceJsonHashHex(text));
}

/**
 * Draft interface from the observer's analysis (`/api/contract/interface`): template / published names, plus
 * placeholder entries for decoded selectors nothing describes.
 */
export function draftFromObserver(contract, obs) {
  const fns = (obs?.functions ?? []).map((f) => ({
    selector: f.selector,
    name: f.name,
    params: (f.params ?? []).map((p) => ({ name: p.name, type: p.type, ...(p.note ? { note: p.note } : {}) })),
    kind: f.kind === 'read' ? 'read' : 'write',
    description: f.description ?? '',
    access: f.access ?? '',
    ...(f.returns ? { returns: f.returns } : {}),
  }));
  const described = new Set(fns.map((f) => f.selector));
  for (const s of obs?.decodedSelectors ?? []) {
    if (!described.has(s)) {
      fns.push({ selector: s, name: `fn_0x${s.toString(16).padStart(2, '0')}`, params: [], kind: 'write', description: 'TODO: describe', access: '' });
    }
  }
  fns.sort((a, b) => a.selector - b.selector);
  return {
    schema: INTERFACE_SCHEMA,
    network: 'boing-testnet',
    contract: hex0x(contract),
    name: obs?.label ?? 'My contract',
    ...(obs?.summary ? { summary: obs.summary } : {}),
    functions: fns,
  };
}

/** URI rules enforced by the registry (<=192 UTF-8 bytes) and the observer (https only). */
export function checkUri(uri) {
  const u = String(uri ?? '').trim();
  if (!u) return { ok: false, message: 'Enter the https URL where the JSON file will be served.' };
  if (isInterfaceBlobUri(u)) {
    return parseInterfaceBlobUri(u) ? { ok: true, uri: u, onChain: true } : { ok: false, message: 'Malformed boing://iface-blob/ URI.' };
  }
  if (!/^https:\/\//i.test(u)) return { ok: false, message: 'The URI must start with https:// (the observer only fetches https), or use Host on Boing.' };
  const len = new TextEncoder().encode(u).length;
  if (len > INTERFACE_REGISTRY_MAX_URI_BYTES) return { ok: false, message: `The URI is ${len} bytes; the registry stores at most ${INTERFACE_REGISTRY_MAX_URI_BYTES}.` };
  return { ok: true, uri: u };
}

/**
 * Steps to publish. Claim only when unclaimed; refuse when another account holds the claim or the wallet
 * is not the deployer (the observer would ignore the record).
 */
export function planPublish({ wallet, contract, interfaceHash, uri, claimer, deployerOk, registry = INTERFACE_REGISTRY_ID, hostTxs = [] }) {
  if (!deployerOk) return { ok: false, code: 'not_deployer', message: 'Only the contract deployer can publish an interface the observer will trust.' };
  if (claimer && h64(claimer) !== h64(wallet)) {
    return { ok: false, code: 'claimed_by_other', message: `The contract is already claimed in the registry by 0x${h64(claimer)}.` };
  }
  const u = checkUri(uri);
  if (!u.ok) return { ok: false, code: 'bad_uri', message: u.message };
  const txs = buildPublishInterfaceFlowTxs({
    senderHex32: hex0x(wallet),
    contractHex32: hex0x(contract),
    interfaceHashHex32: hex0x(interfaceHash),
    uri: u.uri,
    registryHex32: hex0x(registry),
    alreadyClaimed: Boolean(claimer),
  });
  const claim = txs.length === 2 ? [txs[0]] : [];
  const all = [...claim, ...hostTxs, txs[txs.length - 1]];
  if (all.length > MAX_BATCH_CALLS) {
    return { ok: false, code: 'too_large', message: `This needs ${all.length} calls; one batch holds ${MAX_BATCH_CALLS}. Shorten the interface JSON.` };
  }
  return {
    ok: true,
    txs: all,
    steps: [
      ...(claim.length ? ['Claim the contract in the registry'] : []),
      ...(hostTxs.length ? [`Store the JSON on Boing (${hostTxs.length} blob store write${hostTxs.length > 1 ? 's' : ''})`] : []),
      'Record interface hash + URI',
    ],
  };
}

/** Node batch limit (boing_primitives::MAX_BATCH_CALLS). */
export const MAX_BATCH_CALLS = 16;

/**
 * Built-in hosting ("Host on Boing"): store the exact canonical JSON (deflate-raw when smaller) in the
 * interface blob store under the wallet's namespace and use its boing://iface-blob/ URI.
 */
export async function planBoingHosting({ wallet, interfaceHash, text, store = INTERFACE_BLOB_STORE_ID }) {
  const jsonBytes = new TextEncoder().encode(text);
  const flow = await buildHostInterfaceBlobFlow({
    senderHex32: hex0x(wallet),
    interfaceHashHex32: hex0x(interfaceHash),
    jsonBytes,
    storeHex32: hex0x(store),
  });
  return { ...flow, jsonBytes: jsonBytes.length, gas: flow.words * 20_000 };
}

/** Has the registry caught up with what we published? */
export function recordMatches(record, { interfaceHash, uri, wallet }) {
  return Boolean(
    record &&
      h64(record.interfaceHash) === h64(interfaceHash) &&
      record.uri === uri &&
      h64(record.publisher) === h64(wallet),
  );
}

export function observerContractUrl(base, contract) {
  return `${String(base || 'https://boing.observer').replace(/\/+$/, '')}/account/${hex0x(contract)}?network=testnet`;
}
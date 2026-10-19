/**
 * `0xFD` deploy init code for Boing assets (pure, Node-testable).
 *
 * A Boing deploy whose bytecode starts with `0xFD` runs the rest as **init code** inside the deploy
 * transaction (CALLER = the deployer, ADDRESS = the new contract); the init's RETURN data becomes the
 * stored contract code (boing.network `vm.rs`, `CONTRACT_DEPLOY_INIT_CODE_MARKER`). boing.finance uses it
 * so that a new asset is complete in the same transaction that creates it:
 *   - admin slot = creator (the reference templates otherwise make the FIRST caller admin),
 *   - token: the whole supply credited to the creator and `mint_first` marked as used,
 *   - linked NFT↔token registry v2: `claim_self(creator)` so the creator is the asset's claimer.
 * The stored runtime is the unchanged template, so template / decimals detection keeps working.
 */
import { buildLinkedNftTokenClaimSelfInitSnippetHex, validateHex32 } from 'boing-sdk';

export const OP = Object.freeze({
  STOP: 0x00,
  XOR: 0x18,
  CALLER: 0x33,
  MSTORE: 0x52,
  SSTORE: 0x55,
  PUSH32: 0x7f,
  CALL: 0xf1,
  RETURN: 0xf3,
});

/** `CONTRACT_DEPLOY_INIT_CODE_MARKER` (boing-primitives). */
export const BOING_DEPLOY_INIT_MARKER = 0xfd;

/** Reference NFT collection lazy-admin slot (`ref_nft_collection_admin_key`, `k[31] == 0xe0`). */
export const BOING_NFT_COLLECTION_ADMIN_SLOT_HEX = `0x${'00'.repeat(31)}e0`;

export function hexToU8(hex) {
  const h = String(hex).replace(/^0x/i, '');
  if (h.length % 2) throw new Error('odd hex length');
  if (h && !/^[0-9a-fA-F]+$/.test(h)) throw new Error('invalid hex');
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function u8ToHex(u8) {
  let s = '0x';
  for (const b of u8) s += b.toString(16).padStart(2, '0');
  return s;
}

export function word(bigintValue) {
  const w = new Uint8Array(32);
  let v = BigInt(bigintValue);
  for (let i = 31; i >= 0 && v > 0n; i--) {
    w[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return w;
}

/** Small byte builder for init code. */
export function initWriter() {
  const bytes = [];
  return {
    bytes,
    op(...codes) {
      bytes.push(...codes);
    },
    push32(w) {
      if (w.length !== 32) throw new Error('PUSH32 needs 32 bytes');
      bytes.push(OP.PUSH32, ...w);
    },
    raw(u8) {
      for (const b of u8) bytes.push(b);
    },
  };
}

/** Runtime must be a plain runtime (an init deploy would be wrapped twice). */
export function runtimeBytesForInit(runtimeHex) {
  const runtime = hexToU8(runtimeHex);
  if (runtime.length === 0) throw new Error('runtime bytecode is empty');
  if (runtime[0] === BOING_DEPLOY_INIT_MARKER) {
    throw new Error('Paste runtime bytecode, not deploy init code (it starts with 0xfd).');
  }
  return runtime;
}

/** `CALL registry.claim_self(CALLER)` (linked NFT↔token registry v2); empty when no registry. */
export function appendRegistryClaim(w, registryHex32) {
  if (!registryHex32) return;
  w.raw(hexToU8(buildLinkedNftTokenClaimSelfInitSnippetHex(validateHex32(registryHex32))));
}

/** Copy `runtime` to memory in 32-byte words, RETURN(0, len), STOP; then prefix the 0xFD marker. */
export function finishInitDeploy(w, runtime) {
  const padded = new Uint8Array(Math.ceil(runtime.length / 32) * 32);
  padded.set(runtime);
  for (let off = 0; off < padded.length; off += 32) {
    w.push32(padded.subarray(off, off + 32));
    w.push32(word(BigInt(off)));
    w.op(OP.MSTORE);
  }
  w.push32(word(BigInt(runtime.length)));
  w.push32(word(0n));
  w.op(OP.RETURN, OP.STOP);
  return u8ToHex(Uint8Array.from([BOING_DEPLOY_INIT_MARKER, ...w.bytes]));
}

/**
 * Reference NFT collection created with its creator as admin and (optionally) as registry claimer, in
 * the deploy transaction. Without this the first account to call the new collection becomes its admin.
 * @param {{ runtimeHex: string, claimRegistryHex?: string | null }} input
 * @returns {`0x${string}`}
 */
export function buildBoingNftCollectionAtDeployBytecodeHex({ runtimeHex, claimRegistryHex = null }) {
  const runtime = runtimeBytesForInit(runtimeHex);
  const w = initWriter();
  w.op(OP.CALLER);
  w.push32(hexToU8(BOING_NFT_COLLECTION_ADMIN_SLOT_HEX));
  w.op(OP.SSTORE);
  appendRegistryClaim(w, claimRegistryHex);
  return finishInitDeploy(w, runtime);
}

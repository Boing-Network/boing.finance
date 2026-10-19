/**
 * Boing token v2 launch: pure builders (no React, no RPC; Node-testable with
 * `node --test scripts/boing-token-v2-launch.test.mjs`).
 *
 * boing.finance deploys the **reference fungible template v2** (`boingTokenBytecodeHex(2)` in boing-sdk,
 * the same template as `boing token deploy` and the tokens the v8 / v9 custody pools hold):
 * `transfer`, one-time `mint_first`, `approve`, `transfer_from`, `allowance`. Amounts are whole units
 * (no decimals). Name and symbol go in the deploy transaction's asset metadata, which is what the
 * node's token discovery (`boing_listDexTokens` / `boing_getDexToken`), boing.observer and Boing Express read.
 *
 * The whole supply is minted once, to the deployer, by a `mint_first` signed with the next nonce.
 * Both transactions are signed before either is submitted, so a rejected second signature leaves
 * nothing on chain, and the mint lands right behind the deploy (the first `mint_first` caller becomes
 * the token admin, so it must be ours).
 */
import {
  boingTokenBytecodeHex,
  buildContractDeployMetaTx,
  bytesToHex,
  encodeReferenceMintFirstCalldata,
  predictNonceDerivedContractAddress,
  REFERENCE_FUNGIBLE_BALANCE_XOR,
  validateBoingTokenMetadata,
  validateHex32,
} from 'boing-sdk';

export const BOING_TOKEN_V2_VERSION = 2;
/** v2 balances are whole units. */
export const BOING_TOKEN_V2_DECIMALS = 0;
export const BOING_TOKEN_V2_PURPOSE = 'token';
const U128_MAX = (1n << 128n) - 1n;

/**
 * Deploy-form security options the v2 template has no code for. They stay available on EVM and Solana;
 * on Boing they are hidden (a restricted transfer path would also break custody-pool `transfer_from`).
 */
export const BOING_TOKEN_V2_UNSUPPORTED_SECURITY = Object.freeze([
  'enableFreezing',
  'enableBlacklist',
  'maxTxAmount',
  'antiBot',
  'cooldown',
  'antiWhale',
  'pauseFunction',
  'timelock',
  'maxWallet',
]);

/** What a v2 token guarantees by construction (recorded in the launch metadata document). */
export const BOING_TOKEN_V2_SECURITY = Object.freeze({
  // One `mint_first`, ever: no one can mint after the initial supply.
  renounceMint: true,
  // The admin's only power is that one mint, so nothing is left to renounce after it.
  renounceOwnership: true,
});

/** v2 template bytecode from boing-sdk (ignores any env override, so the deploy is always v2). */
export function boingTokenV2BytecodeHex() {
  return boingTokenBytecodeHex(BOING_TOKEN_V2_VERSION);
}

/**
 * Parse the initial supply (whole tokens, digits only, 1 .. 2^128-1).
 * @param {unknown} raw
 * @returns {bigint}
 */
export function parseBoingTokenV2Supply(raw) {
  const s = String(raw ?? '').trim().replace(/[_,\s]/g, '');
  if (!s) throw new Error('Enter an initial supply.');
  if (!/^\d+$/.test(s)) throw new Error('Initial supply must be a whole number (Boing tokens have no decimals).');
  const v = BigInt(s);
  if (v <= 0n) throw new Error('Initial supply must be greater than 0.');
  if (v > U128_MAX) throw new Error('Initial supply is too large (max 2^128 - 1).');
  return v;
}

/**
 * Express `contract_deploy_meta` for the v2 template (no nonce).
 * @param {{ name: string, symbol: string, purpose?: string, descriptionHashHex?: string, bytecodeHexOverride?: string }} input
 */
export function buildBoingTokenV2DeployMetaTx({ name, symbol, purpose, descriptionHashHex, bytecodeHexOverride }) {
  const n = String(name ?? '').trim();
  const sym = String(symbol ?? '').trim().toUpperCase();
  if (!n || !sym) throw new Error('Token name and symbol are required.');
  validateBoingTokenMetadata(n, sym);
  const override = String(bytecodeHexOverride ?? '').trim();
  return buildContractDeployMetaTx({
    bytecodeHex: override || boingTokenV2BytecodeHex(),
    assetName: n,
    assetSymbol: sym,
    purposeCategory: purpose || BOING_TOKEN_V2_PURPOSE,
    descriptionHashHex: String(descriptionHashHex ?? '').trim() || undefined,
  });
}

/**
 * Express `contract_call` for the one-time `mint_first(to, amount)`.
 * Access list = SDK `buildBoingTokenMintTransaction` ([sender, token] read and write).
 * @param {{ senderHex: string, tokenHex: string, amount: bigint, toHex?: string }} input
 */
export function buildBoingTokenV2MintTx({ senderHex, tokenHex, amount, toHex }) {
  const sender = validateHex32(senderHex).toLowerCase();
  const token = validateHex32(tokenHex).toLowerCase();
  const to = validateHex32(toHex || sender).toLowerCase();
  if (typeof amount !== 'bigint' || amount <= 0n || amount > U128_MAX) throw new Error('mint amount must be 1 .. 2^128-1');
  return {
    type: 'contract_call',
    contract: token,
    calldata: bytesToHex(encodeReferenceMintFirstCalldata(to, amount)),
    access_list: { read: [sender, token], write: [sender, token] },
  };
}

/**
 * Deploy (nonce n) + mint_first (nonce n+1) with the nonce-derived token address.
 * @param {{ senderHex: string, nonce: bigint | number | string, name: string, symbol: string, supply: unknown,
 *   purpose?: string, descriptionHashHex?: string, bytecodeHexOverride?: string }} input
 * @returns {{ tokenHex: string, supply: bigint, deployTx: Record<string, unknown>, mintTx: Record<string, unknown> }}
 */
export function buildBoingTokenV2LaunchTxs(input) {
  const senderHex = validateHex32(input.senderHex).toLowerCase();
  const nonce = BigInt(input.nonce);
  if (nonce < 0n) throw new Error('nonce must be >= 0');
  const supply = parseBoingTokenV2Supply(input.supply);
  const tokenHex = predictNonceDerivedContractAddress(senderHex, nonce).toLowerCase();
  const deployTx = {
    ...buildBoingTokenV2DeployMetaTx(input),
    nonce: nonce.toString(),
  };
  const mintTx = {
    ...buildBoingTokenV2MintTx({ senderHex, tokenHex, amount: supply }),
    nonce: (nonce + 1n).toString(),
  };
  return { tokenHex, supply, deployTx, mintTx };
}

/* ------------------------------------------------------------------------------------------------
 * Mint-at-deploy (project pack): the v2 runtime wrapped in a `0xFD` init that runs inside the deploy
 * transaction itself. The init (CALLER = the deployer) stores, in the new token's storage:
 *   admin slot      = deployer          (same slot the v2 lazy-admin prologue checks)
 *   balance[deployer] = supply          (v1/v2 balance slot: holder ^ REF_FUNGIBLE_BALANCE_XOR)
 *   mint-once flag  = 1                 (so `mint_first` is already spent)
 * then RETURNs the unchanged v2 runtime, which becomes the contract code. One transaction, so there
 * is no moment where the token exists without an admin and anyone else could call it first.
 * Same init mechanism as the secured fungible template (boing-sdk referenceFungibleSecuredDeployBytecode);
 * no VM change. Storage layout: boing.network crates/boing-execution/src/reference_token.rs
 * (admin 0x..f0, mint-once 0x..f1, balance XOR mask).
 * ---------------------------------------------------------------------------------------------- */

const OP = Object.freeze({ STOP: 0x00, XOR: 0x18, CALLER: 0x33, MSTORE: 0x52, SSTORE: 0x55, PUSH32: 0x7f, RETURN: 0xf3 });
/** `CONTRACT_DEPLOY_INIT_CODE_MARKER` (boing-primitives). */
export const BOING_DEPLOY_INIT_MARKER = 0xfd;
/** v1/v2 reference fungible admin slot (`ref_fungible_admin_key`). */
export const BOING_TOKEN_ADMIN_SLOT_HEX = `0x${'00'.repeat(31)}f0`;
/** v1/v2 reference fungible mint-once slot (`ref_fungible_mint_once_key`). */
export const BOING_TOKEN_MINT_ONCE_SLOT_HEX = `0x${'00'.repeat(31)}f1`;

function hexToU8(hex) {
  const h = String(hex).replace(/^0x/i, '');
  if (h.length % 2) throw new Error('odd hex length');
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function u8ToHex(u8) {
  let s = '0x';
  for (const b of u8) s += b.toString(16).padStart(2, '0');
  return s;
}

function word(bigintValue) {
  const w = new Uint8Array(32);
  let v = BigInt(bigintValue);
  for (let i = 31; i >= 0 && v > 0n; i--) {
    w[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return w;
}

/**
 * `0xFD || init` deploy bytecode: v2 runtime with the whole `supply` minted to the deployer at deploy.
 * @param {{ supply: unknown, runtimeHex?: string, balanceXorMask?: Uint8Array }} input
 * @returns {`0x${string}`}
 */
export function buildBoingTokenV2MintAtDeployBytecodeHex({ supply, runtimeHex, balanceXorMask } = {}) {
  const amount = parseBoingTokenV2Supply(supply);
  const runtime = hexToU8(runtimeHex || boingTokenV2BytecodeHex());
  const mask = balanceXorMask || REFERENCE_FUNGIBLE_BALANCE_XOR;
  if (!(mask instanceof Uint8Array) || mask.length !== 32) throw new Error('balance XOR mask must be 32 bytes');
  const bytes = [];
  const push32 = (w) => {
    bytes.push(OP.PUSH32);
    for (const b of w) bytes.push(b);
  };
  // admin = CALLER
  bytes.push(OP.CALLER);
  push32(hexToU8(BOING_TOKEN_ADMIN_SLOT_HEX));
  bytes.push(OP.SSTORE);
  // balance[CALLER ^ mask] = supply
  push32(word(amount));
  bytes.push(OP.CALLER);
  push32(mask);
  bytes.push(OP.XOR, OP.SSTORE);
  // mint-once = 1
  push32(word(1n));
  push32(hexToU8(BOING_TOKEN_MINT_ONCE_SLOT_HEX));
  bytes.push(OP.SSTORE);
  // copy runtime to memory in 32-byte words, then RETURN(0, len)
  const padded = new Uint8Array(Math.ceil(runtime.length / 32) * 32);
  padded.set(runtime);
  for (let off = 0; off < padded.length; off += 32) {
    push32(padded.subarray(off, off + 32));
    push32(word(BigInt(off)));
    bytes.push(OP.MSTORE);
  }
  push32(word(BigInt(runtime.length)));
  push32(word(0n));
  bytes.push(OP.RETURN, OP.STOP);
  return u8ToHex(Uint8Array.from([BOING_DEPLOY_INIT_MARKER, ...bytes]));
}

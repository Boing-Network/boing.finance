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
 * The whole supply is minted to the deployer **inside the deploy transaction**: the v2 runtime is wrapped in
 * `0xFD` init code (see {@link buildBoingTokenV2MintAtDeployBytecodeHex}) that sets admin = deployer,
 * credits the supply and marks `mint_first` as used, then claims the token for the deployer in the linked
 * NFT↔token registry v2. One transaction and one signature (Deploy token and the project pack alike), so
 * there is no window between deploy and mint in which another account could call the token first.
 */
import {
  appendRegistryClaim,
  BOING_DEPLOY_INIT_MARKER,
  finishInitDeploy,
  hexToU8,
  initWriter,
  OP,
  runtimeBytesForInit,
  word,
} from './boingDeployInit.js';
import {
  boingTokenBytecodeHex,
  buildContractDeployMetaTx,
  bytesToHex,
  encodeReferenceMintFirstCalldata,
  predictNonceDerivedContractAddress,
  REFERENCE_FUNGIBLE_BALANCE_XOR,
  validateBoingTokenMetadata,
  validateHex32,
} from '@boing-network/boing-sdk';

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
 * The single launch transaction (Deploy token page): v2 runtime + mint-at-deploy init at `nonce`, with the
 * nonce-derived token address. `runtimeHexOverride` (Advanced) replaces the v2 runtime; it must use the
 * v1/v2 reference fungible storage layout, since the init writes admin / balance / mint-once slots.
 * @param {{ senderHex: string, nonce: bigint | number | string, name: string, symbol: string, supply: unknown,
 *   purpose?: string, descriptionHashHex?: string, runtimeHexOverride?: string, claimRegistryHex?: string | null }} input
 * @returns {{ tokenHex: string, supply: bigint, deployTx: Record<string, unknown> }}
 */
export function buildBoingTokenV2LaunchTx(input) {
  const senderHex = validateHex32(input.senderHex).toLowerCase();
  const nonce = BigInt(input.nonce);
  if (nonce < 0n) throw new Error('nonce must be >= 0');
  const supply = parseBoingTokenV2Supply(input.supply);
  const tokenHex = predictNonceDerivedContractAddress(senderHex, nonce).toLowerCase();
  const bytecode = buildBoingTokenV2MintAtDeployBytecodeHex({
    supply,
    runtimeHex: String(input.runtimeHexOverride ?? '').trim() || undefined,
    claimRegistryHex: input.claimRegistryHex || null,
  });
  const deployTx = {
    ...buildBoingTokenV2DeployMetaTx({ ...input, bytecodeHexOverride: bytecode }),
    nonce: nonce.toString(),
  };
  return { tokenHex, supply, deployTx };
}

/* ------------------------------------------------------------------------------------------------
 * Mint-at-deploy (Deploy token + project pack): the v2 runtime wrapped in a `0xFD` init that runs inside the deploy
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

/** v1/v2 reference fungible admin slot (`ref_fungible_admin_key`). */
export const BOING_TOKEN_ADMIN_SLOT_HEX = `0x${'00'.repeat(31)}f0`;
/** v1/v2 reference fungible mint-once slot (`ref_fungible_mint_once_key`). */
export const BOING_TOKEN_MINT_ONCE_SLOT_HEX = `0x${'00'.repeat(31)}f1`;
export { BOING_DEPLOY_INIT_MARKER };

/**
 * `0xFD || init` deploy bytecode: v2 runtime with the whole `supply` minted to the deployer at deploy.
 * With `claimRegistryHex` the init also calls the linked NFT↔token registry v2 `claim_self(deployer)`
 * (the registry faults, and so the whole deploy fails, if the token were somehow already claimed).
 * @param {{ supply: unknown, runtimeHex?: string, balanceXorMask?: Uint8Array, claimRegistryHex?: string | null }} input
 * @returns {`0x${string}`}
 */
export function buildBoingTokenV2MintAtDeployBytecodeHex({ supply, runtimeHex, balanceXorMask, claimRegistryHex = null } = {}) {
  const amount = parseBoingTokenV2Supply(supply);
  const runtime = runtimeBytesForInit(runtimeHex || boingTokenV2BytecodeHex());
  const mask = balanceXorMask || REFERENCE_FUNGIBLE_BALANCE_XOR;
  if (!(mask instanceof Uint8Array) || mask.length !== 32) throw new Error('balance XOR mask must be 32 bytes');
  const w = initWriter();
  // admin = CALLER
  w.op(OP.CALLER);
  w.push32(hexToU8(BOING_TOKEN_ADMIN_SLOT_HEX));
  w.op(OP.SSTORE);
  // balance[CALLER ^ mask] = supply
  w.push32(word(amount));
  w.op(OP.CALLER);
  w.push32(mask);
  w.op(OP.XOR, OP.SSTORE);
  // mint-once = 1
  w.push32(word(1n));
  w.push32(hexToU8(BOING_TOKEN_MINT_ONCE_SLOT_HEX));
  w.op(OP.SSTORE);
  // linked NFT↔token registry v2: the creator is the token's claimer from this transaction on
  appendRegistryClaim(w, claimRegistryHex);
  return finishInitDeploy(w, runtime);
}

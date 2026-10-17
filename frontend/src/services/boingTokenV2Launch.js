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

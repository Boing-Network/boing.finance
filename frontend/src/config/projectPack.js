/**
 * Project pack (NFT collection + token in one guided flow) settings.
 *
 * The pack token is a Boing token v2 whose whole supply is minted to the creator inside the deploy
 * transaction (see `buildBoingTokenV2MintAtDeployBytecodeHex` in services/boingTokenV2Launch.js).
 * Boing token v2 balances are whole units (no decimals).
 */

/** Default supply prefilled in the pack's supply field, in whole tokens (1 .. 2^128-1). Change it here only. */
export const PROJECT_PACK_DEFAULT_TOKEN_SUPPLY = 1_000_000_000n;

/** "1,000,000,000" */
export const PROJECT_PACK_DEFAULT_TOKEN_SUPPLY_LABEL = PROJECT_PACK_DEFAULT_TOKEN_SUPPLY.toLocaleString('en-US');

/** Whole-unit supply for display: "1,000,000,000" (bigint-safe beyond 2^53). */
export function formatPackSupply(value) {
  try {
    return BigInt(value).toLocaleString('en-US');
  } catch {
    return String(value ?? '');
  }
}

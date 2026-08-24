#!/usr/bin/env node
/**
 * Guard CI env vs boing-sdk historical 6913 pool hex.
 * Hosted Fly testnet currently leaves `end_user.canonical_native_cp_pool` unset — when
 * REACT_APP_BOING_NATIVE_AMM_POOL is empty, skip (do not bake a dead pool id).
 */
import { CANONICAL_BOING_TESTNET_NATIVE_CP_POOL_HEX } from 'boing-sdk';

const envPool = process.env.REACT_APP_BOING_NATIVE_AMM_POOL?.trim().toLowerCase() || '';
const embedded = String(CANONICAL_BOING_TESTNET_NATIVE_CP_POOL_HEX || '').trim().toLowerCase();

if (!envPool) {
  console.log(
    'verify-canonical-testnet-pool-embed: skipped (REACT_APP_BOING_NATIVE_AMM_POOL unset; hosted testnet has no published pool)',
  );
  process.exit(0);
}

if (embedded !== envPool) {
  console.error('verify-canonical-testnet-pool-embed: mismatch');
  console.error('  boing-sdk CANONICAL_BOING_TESTNET_NATIVE_CP_POOL_HEX:', embedded);
  console.error('  REACT_APP_BOING_NATIVE_AMM_POOL:', envPool);
  process.exit(1);
}

console.log('verify-canonical-testnet-pool-embed: ok', embedded);

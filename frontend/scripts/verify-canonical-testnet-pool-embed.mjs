#!/usr/bin/env node
/**
 * Fail CI when embedded 6913 native CP pool id drifts from live public testnet canon.
 * Expects boing-sdk built (postinstall) and optional Vite env from github-build.*.env.
 */
import { CANONICAL_BOING_TESTNET_NATIVE_CP_POOL_HEX } from 'boing-sdk';

const EXPECTED =
  process.env.REACT_APP_BOING_NATIVE_AMM_POOL?.trim().toLowerCase() ||
  '0x7247ddc3180fdc4d3fd1e716229bfa16bad334a07d28aa9fda9ad1bfa7bdacc3';

const embedded = String(CANONICAL_BOING_TESTNET_NATIVE_CP_POOL_HEX || '').trim().toLowerCase();

if (embedded !== EXPECTED) {
  console.error('verify-canonical-testnet-pool-embed: mismatch');
  console.error('  boing-sdk CANONICAL_BOING_TESTNET_NATIVE_CP_POOL_HEX:', embedded);
  console.error('  expected (env or live canon):', EXPECTED);
  process.exit(1);
}

console.log('verify-canonical-testnet-pool-embed: ok', embedded);

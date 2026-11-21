#!/usr/bin/env node
/**
 * Testnet attestor / relayer dry-run for Boing ↔ Base.
 *
 * Modes:
 *   --dry-run     Print digests and required env; do not submit txs (default)
 *   --watch-boing Poll Boing RPC for BridgeLockToBase receipts and print Base mint calldata hints
 *   --watch-base  Poll Base vault BurnedToBoing events and print Boing claim digest hints
 *
 * Required for live submit (Nico-held):
 *   BOING_RPC                 default https://testnet-rpc.boing.network/
 *   BASE_SEPOLIA_RPC
 *   BRIDGE_VAULT              Base vault address
 *   ATTESTOR_ECDSA_KEYS       comma-separated hex secp256k1 keys (validator bridge keys)
 *   ATTESTOR_ED25519_SECRETS  comma-separated 32-byte hex Boing validator secrets (for claims)
 *
 * This script does **not** hold inventory. It only signs attestations and submits
 * already-funded user/operator txs.
 */
import { createHash } from 'node:crypto';

const args = new Set(process.argv.slice(2));
const dry = args.has('--dry-run') || (!args.has('--watch-boing') && !args.has('--watch-base'));

const BOING_RPC = process.env.BOING_RPC || 'https://testnet-rpc.boing.network/';
const BASE_RPC = process.env.BASE_SEPOLIA_RPC || '';
const VAULT = process.env.BRIDGE_VAULT || '';

function blake3UnavailableNote() {
  return 'Use @noble/hashes/blake3 in production attestor; this dry-run prints env checklist only.';
}

function checklist() {
  console.log(`Boing ↔ Base attestor — ${dry ? 'DRY RUN' : 'LIVE MODE REQUESTED'}`);
  console.log('');
  console.log('Env checklist:');
  console.log(`  BOING_RPC=${BOING_RPC}`);
  console.log(`  BASE_SEPOLIA_RPC=${BASE_RPC || '(unset)'}`);
  console.log(`  BRIDGE_VAULT=${VAULT || '(unset)'}`);
  console.log(`  ATTESTOR_ECDSA_KEYS=${process.env.ATTESTOR_ECDSA_KEYS ? '(set)' : '(unset)'}`);
  console.log(
    `  ATTESTOR_ED25519_SECRETS=${process.env.ATTESTOR_ED25519_SECRETS ? '(set)' : '(unset)'}`,
  );
  console.log('');
  console.log('Protocol:');
  console.log('  Boing→Base: watch BridgeLockToBase → ECDSA-sign mint digest → vault.mintWithAttestation');
  console.log('  Base→Boing: watch BurnedToBoing → Ed25519-sign burn digest → BridgeClaimFromBase');
  console.log('  Quorum: ≥ ⌈2W/3⌉ stake on both sides (vault stake mirror + Boing bonded stake).');
  console.log('  Fee: 0.5% (50 bps) — no inventory.');
  console.log('');
  console.log(blake3UnavailableNote());
  if (!VAULT || !BASE_RPC) {
    console.log('');
    console.log('Nico must deploy Base Sepolia vault first (scripts/bridge/deploy-base-sepolia.sh).');
  }
  console.log('');
  console.log('Activation: set BOING_BRIDGE_ACTIVATION_HEIGHT on every Boing node, then restart.');
}

async function probeBoing() {
  try {
    const res = await fetch(BOING_RPC, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': 'boing-bridge-attestor/0.1' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'boing_getNetworkInfo',
        params: [],
      }),
    });
    const json = await res.json();
    const h = json?.result?.bridge_activation_height;
    console.log(
      `Boing network: chain_id=${json?.result?.chain_id} tip≈${json?.result?.head_height} bridge_activation_height=${h === undefined ? '(field pending deploy)' : h}`,
    );
  } catch (e) {
    console.warn('Boing RPC probe failed:', e.message || e);
  }
}

checklist();
await probeBoing();

if (args.has('--watch-boing') || args.has('--watch-base')) {
  console.log('');
  console.log(
    'Watch loops are intentionally thin in this dry-run package: after vault deploy + activation,',
  );
  console.log('extend this script with ethers event filters and boing_getTransactionReceipt polling.');
  console.log('Fingerprint:', createHash('sha256').update('boing-bridge-attestor-v1').digest('hex').slice(0, 16));
}

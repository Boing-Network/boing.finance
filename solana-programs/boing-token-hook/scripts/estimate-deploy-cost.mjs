#!/usr/bin/env node
/**
 * Rent-exempt cost of deploying boing_token_hook (BPF Upgradeable Loader).
 * Does not send a transaction. Uses the on-chain rent formula:
 *   (128 + data_len) * 6_960 lamports
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const LAMPORTS_PER_BYTE = 6960n;
const ACCOUNT_OVERHEAD = 128n;
const LAMPORTS_PER_SOL = 1_000_000_000n;
const PROGRAM_ACCOUNT_LEN = 36;
const PROGRAMDATA_HEADER = 45;
const BUFFER_HEADER = 37;
const USD_PER_SOL = Number(process.env.SOL_USD || 82);

function rentExemptLamports(dataLen) {
  return (ACCOUNT_OVERHEAD + BigInt(dataLen)) * LAMPORTS_PER_BYTE;
}

function sol(lamports) {
  return Number(lamports) / Number(LAMPORTS_PER_SOL);
}

function usd(lamports) {
  return sol(lamports) * USD_PER_SOL;
}

function findSo() {
  const deployDir = join(root, 'target', 'deploy');
  const sbfDir = join(root, 'target', 'sbpf-solana-solana', 'release');
  const candidates = [];
  for (const dir of [deployDir, sbfDir, join(root, 'target', 'deploy')]) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (name.endsWith('.so')) candidates.push(join(dir, name));
    }
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => statSync(b).size - statSync(a).size);
  return candidates[0];
}

const soPath = findSo();
if (!soPath) {
  console.error('No compiled .so found. Run `anchor build` (or scripts/docker-build.sh) first.');
  process.exit(1);
}

const soBytes = statSync(soPath).size;
const programAccount = rentExemptLamports(PROGRAM_ACCOUNT_LEN);
const programData = rentExemptLamports(PROGRAMDATA_HEADER + soBytes);
const buffer = rentExemptLamports(BUFFER_HEADER + soBytes);
const lasting = programAccount + programData;
const peak = lasting + buffer;

const fmt = (lamports) =>
  `${sol(lamports).toFixed(4)} SOL  (~$${usd(lamports).toFixed(2)} at $${USD_PER_SOL}/SOL)`;

console.log(`Binary: ${soPath}`);
console.log(`Size:   ${soBytes.toLocaleString()} bytes (${(soBytes / 1024).toFixed(1)} KB)`);
console.log('');
console.log('Mock deploy rent (refundable bond, not a burn)');
console.log(`  Program account (36 B):     ${fmt(programAccount)}`);
console.log(`  ProgramData (${PROGRAMDATA_HEADER + soBytes} B): ${fmt(programData)}`);
console.log(`  Temporary buffer:           ${fmt(buffer)}  (returned after deploy)`);
console.log(`  Peak wallet debit:          ${fmt(peak)}`);
console.log(`  Locked after buffer close:  ${fmt(lasting)}`);
console.log('');
console.log('Per-token extra (hook config, not this program)');
console.log('  Policy PDA ~110 B + ExtraAccountMetaList + cooldown PDA ≈ 0.002–0.004 SOL on top of the ~0.014 SOL mint.');
console.log('');
console.log('This script does not broadcast. For a local mock send:');
console.log('  solana-test-validator');
console.log('  solana program deploy target/deploy/boing_token_hook.so --url localhost');

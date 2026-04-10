#!/usr/bin/env node
/**
 * Build native DEX indexer JSON for REACT_APP_BOING_NATIVE_DEX_INDEXER_STATS_URL (static file or live API).
 *
 * Examples:
 *   cd frontend && node scripts/native-dex-indexer-cli.mjs > ../public/native-dex-indexer-stats.json
 *   NATIVE_DEX_INDEXER_OUT_PATH=./public/native-dex-indexer-stats.json NATIVE_DEX_INDEXER_STATE_PATH=./.native-dex-indexer-state.json node scripts/native-dex-indexer-cli.mjs
 *   NATIVE_DEX_INDEXER_RPC_URL=https://testnet-rpc.boing.network NATIVE_DEX_INDEXER_REGISTER_FROM_BLOCK=0 node scripts/native-dex-indexer-cli.mjs
 *
 * Env (optional): same REACT_APP_BOING_NATIVE_* overrides as the web build; NATIVE_DEX_INDEXER_LOG_SCAN_BLOCKS (default 8000);
 * NATIVE_DEX_INDEXER_REGISTER_FROM_BLOCK for factory register_pair merge; NATIVE_DEX_INDEXER_STATE_PATH for persistent history.
 */

import { writeFileSync } from 'node:fs';
import { buildNativeDexIndexerStats } from '../indexer/buildNativeDexIndexerStats.mjs';

const outPath = (process.env.NATIVE_DEX_INDEXER_OUT_PATH || '').trim();

const payload = await buildNativeDexIndexerStats();
const json = JSON.stringify(payload, null, 2);

if (outPath) {
  writeFileSync(outPath, `${json}\n`, 'utf8');
  process.stderr.write(`native-dex-indexer: wrote ${outPath}\n`);
} else {
  process.stdout.write(`${json}\n`);
}

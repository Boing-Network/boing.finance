/**
 * Chain-wide fungible-style contract deploy discovery (not DEX-scoped).
 * Replays finalized blocks via `boing_getBlockByHeight` and extracts deploy txs using boing-sdk helpers.
 */

import {
  extractUniversalContractDeploymentsFromBlock,
  fetchBlocksWithReceiptsForHeightRange,
} from 'boing-sdk';
import { normalizeNativeVmTokenId32 } from './nativeVmTokenRegistry';

/**
 * @returns {{
 *   enabled: boolean,
 *   span: number,
 *   maxConcurrent: number,
 * }}
 */
export function readFungibleDeployDiscoveryConfig() {
  const dis = (process.env.REACT_APP_BOING_NATIVE_FUNGIBLE_DEPLOY_DISCOVERY || '1').trim();
  const enabled =
    dis !== '0' && dis.toLowerCase() !== 'off' && dis.toLowerCase() !== 'false' && dis.toLowerCase() !== 'no';
  const rawSpan = (process.env.REACT_APP_BOING_NATIVE_FUNGIBLE_DEPLOY_SCAN_BLOCKS || '').trim();
  const spanParsed = rawSpan === '' ? 2048 : parseInt(rawSpan, 10);
  const span = Number.isFinite(spanParsed) ? Math.min(50_000, Math.max(1, spanParsed)) : 2048;
  const concRaw = (process.env.REACT_APP_BOING_NATIVE_FUNGIBLE_DEPLOY_SCAN_CONCURRENCY || '2').trim();
  const concParsed = parseInt(concRaw, 10);
  const maxConcurrent = Number.isFinite(concParsed) ? Math.min(8, Math.max(1, concParsed)) : 2;
  return { enabled, span, maxConcurrent };
}

/**
 * @param {Record<string, unknown>} row — row from {@link extractUniversalContractDeploymentsFromBlock}
 * @returns {boolean}
 */
export function isFungibleStyleDeployRow(row) {
  if (!row || typeof row !== 'object') return false;
  const kind = row.payloadKind;
  if (kind === 'ContractDeployWithPurposeAndMetadata') {
    const pc = String(row.purposeCategory || '')
      .trim()
      .toLowerCase();
    if (pc === 'nft') return false;
    if (pc === 'token' || pc === 'meme') return true;
    if (typeof row.assetSymbol === 'string' && row.assetSymbol.trim()) return true;
    return false;
  }
  if (kind === 'ContractDeployWithPurpose') {
    const pc = String(row.purposeCategory || '')
      .trim()
      .toLowerCase();
    return pc === 'token' || pc === 'meme';
  }
  return false;
}

/**
 * @param {import('boing-sdk').BoingClient} client
 * @param {number} headHeight — inclusive chain tip height
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{
 *   entries: Array<{ id: string, symbol: string, name: string }>,
 *   fromHeight: number | null,
 *   toHeight: number | null,
 *   scannedBlocks: number,
 * }>}
 */
export async function collectFungibleStyleDeployPickerEntries(client, headHeight, options = {}) {
  const cfg = readFungibleDeployDiscoveryConfig();
  if (!cfg.enabled) {
    return { entries: [], fromHeight: null, toHeight: null, scannedBlocks: 0 };
  }
  const toH = Math.floor(Number(headHeight));
  if (!Number.isFinite(toH) || toH < 0) {
    return { entries: [], fromHeight: null, toHeight: null, scannedBlocks: 0 };
  }
  const fromH = Math.max(0, toH - cfg.span + 1);
  const bundles = await fetchBlocksWithReceiptsForHeightRange(client, fromH, toH, {
    maxConcurrent: cfg.maxConcurrent,
    onMissingBlock: 'omit',
    signal: options.signal,
  });

  /** @type {Map<string, { id: string, symbol: string, name: string, height: number }>} */
  const byId = new Map();
  for (const bundle of bundles) {
    if (!bundle || typeof bundle !== 'object') continue;
    const block = /** @type {{ block?: unknown }} */ (bundle).block;
    if (!block) continue;
    const deploys = extractUniversalContractDeploymentsFromBlock(block);
    for (const d of deploys) {
      if (!isFungibleStyleDeployRow(/** @type {Record<string, unknown>} */ (d))) continue;
      const row = /** @type {Record<string, unknown>} */ (d);
      const id = normalizeNativeVmTokenId32(String(row.contractHex || ''));
      if (!id) continue;
      const symRaw = typeof row.assetSymbol === 'string' ? row.assetSymbol.trim() : '';
      const nmRaw = typeof row.assetName === 'string' ? row.assetName.trim() : '';
      const symbol = symRaw.slice(0, 16) || `${id.slice(0, 8)}…${id.slice(-4)}`;
      const name = nmRaw.slice(0, 80) || symbol;
      const bh =
        typeof row.blockHeight === 'number' && Number.isFinite(row.blockHeight)
          ? row.blockHeight
          : typeof bundle.height === 'number'
            ? bundle.height
            : -1;
      const prev = byId.get(id);
      if (!prev || bh >= prev.height) {
        byId.set(id, { id, symbol, name, height: bh });
      }
    }
  }

  const entries = [...byId.values()].map(({ id, symbol, name }) => ({ id, symbol, name }));
  return {
    entries,
    fromHeight: fromH,
    toHeight: toH,
    scannedBlocks: bundles.length,
  };
}

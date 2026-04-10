import { filterMapNativeAmmRpcLogs, getLogsChunked } from 'boing-sdk';

/**
 * @typedef {{
 *   swapCount: number,
 *   volumeInSum: string,
 *   addLiquidityCount: number,
 *   removeLiquidityCount: number,
 *   fromBlock: number,
 *   toBlock: number,
 *   logRows: number,
 * }} ScanRow
 */

/**
 * Default block span for swap / AMM log scans (`boing_getLogs`, chunked per node limits).
 */
export function getConfiguredSwapLogScanBlocks() {
  const raw = (process.env.REACT_APP_BOING_NATIVE_DEX_SWAP_LOG_SCAN_BLOCKS || '').trim();
  const n = raw === '' ? 2000 : parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 2000;
  return Math.min(n, 50_000);
}

/**
 * Fetch native AMM Log2 rows for pools in `[fromBlock, toBlock]` and aggregate swap volume + liquidity events.
 *
 * @param {import('boing-sdk').BoingClient} client
 * @param {string[]} poolHexes32
 * @param {number} headHeight — chain tip (inclusive upper bound)
 * @param {number} [blockSpan]
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Map<string, { swapCount: number, volumeInSum: string, addLiquidityCount: number, removeLiquidityCount: number, fromBlock: number, toBlock: number, logRows: number }>>}
 */
export async function scanNativeAmmActivityForPools(client, poolHexes32, headHeight, blockSpan, options = {}) {
  const span = blockSpan ?? getConfiguredSwapLogScanBlocks();
  const toB = Math.floor(Number(headHeight));
  if (!Number.isFinite(toB) || toB < 0) {
    return new Map();
  }
  const fromB = Math.max(0, toB - span + 1);
  /** @type {Map<string, { swapCount: number, volumeInSum: bigint, addLiquidityCount: number, removeLiquidityCount: number, fromBlock: number, toBlock: number, logRows: number }>} */
  const acc = new Map();

  const pools = [...new Set((poolHexes32 || []).map((p) => (p || '').trim().toLowerCase()).filter(Boolean))];

  for (const pool of pools) {
    if (options.signal?.aborted) {
      const err = new Error('Aborted');
      err.name = 'AbortError';
      throw err;
    }
    let logs = [];
    try {
      logs = await getLogsChunked(
        client,
        {
          fromBlock: fromB,
          toBlock: toB,
          address: pool,
        },
        { maxConcurrent: 1, signal: options.signal }
      );
    } catch {
      acc.set(pool, {
        swapCount: 0,
        volumeInSum: 0n,
        addLiquidityCount: 0,
        removeLiquidityCount: 0,
        fromBlock: fromB,
        toBlock: toB,
        logRows: 0,
      });
      continue;
    }

    const parsed = filterMapNativeAmmRpcLogs(logs);
    let swapCount = 0;
    let addLiquidityCount = 0;
    let removeLiquidityCount = 0;
    let volumeInSum = 0n;
    for (const ev of parsed) {
      if (ev.address && ev.address.toLowerCase() !== pool) continue;
      switch (ev.kind) {
        case 'swap':
          swapCount += 1;
          volumeInSum += ev.amountIn;
          break;
        case 'addLiquidity':
          addLiquidityCount += 1;
          break;
        case 'removeLiquidity':
          removeLiquidityCount += 1;
          break;
        default:
          break;
      }
    }
    acc.set(pool, {
      swapCount,
      volumeInSum,
      addLiquidityCount,
      removeLiquidityCount,
      fromBlock: fromB,
      toBlock: toB,
      logRows: logs.length,
    });
  }

  const out = new Map();
  for (const [k, v] of acc) {
    out.set(k, {
      swapCount: v.swapCount,
      volumeInSum: v.volumeInSum.toString(),
      addLiquidityCount: v.addLiquidityCount,
      removeLiquidityCount: v.removeLiquidityCount,
      fromBlock: v.fromBlock,
      toBlock: v.toBlock,
      logRows: v.logRows,
    });
  }
  return out;
}

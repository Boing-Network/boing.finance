import { ethers } from 'ethers';
import { getContractAddress } from '../config/contracts';

/** Uniswap V2–style `PairCreated` on `DEXFactoryV2.sol`. */
const PAIR_CREATED_TOPIC = ethers.id('PairCreated(address,address,address,uint256)');

const DEFAULT_MAX_BLOCK_SPAN = 250_000;
const DEFAULT_CHUNK_SIZE = 8_000;

/**
 * @param {string | undefined} topic
 * @returns {string | null} checksummed 20-byte address
 */
function topicIndexedAddress(topic) {
  if (!topic || typeof topic !== 'string') return null;
  const t = topic.toLowerCase();
  if (!/^0x[0-9a-f]{64}$/.test(t)) return null;
  try {
    return ethers.getAddress(`0x${t.slice(-40)}`);
  } catch {
    return null;
  }
}

/**
 * Collect token addresses that appear in `PairCreated` logs for the chain's configured `dexFactory`.
 * Uses chunked `eth_getLogs` from `(tip - maxBlockSpan)` through tip.
 *
 * @param {import('ethers').Provider} provider
 * @param {number} chainId
 * @param {{ maxBlockSpan?: number, chunkSize?: number, signal?: AbortSignal }} [options]
 * @returns {Promise<string[]>} lowercase `0x` + 40 hex addresses
 */
export async function fetchTradeableEvmTokenAddressesFromDexFactory(provider, chainId, options = {}) {
  const factory = getContractAddress(chainId, 'dexFactory');
  if (!factory || factory === ethers.ZeroAddress) return [];

  const maxSpan = options.maxBlockSpan ?? DEFAULT_MAX_BLOCK_SPAN;
  const chunk = options.chunkSize ?? DEFAULT_CHUNK_SIZE;

  const tip = await provider.getBlockNumber();
  const fromB = Math.max(0, tip - maxSpan + 1);

  const out = new Set();

  for (let start = fromB; start <= tip; start += chunk) {
    if (options.signal?.aborted) {
      const err = new Error('Aborted');
      err.name = 'AbortError';
      throw err;
    }
    const end = Math.min(tip, start + chunk - 1);
    let logs;
    try {
      logs = await provider.getLogs({
        address: factory,
        topics: [PAIR_CREATED_TOPIC],
        fromBlock: start,
        toBlock: end,
      });
    } catch {
      continue;
    }
    for (const log of logs) {
      const t0 = topicIndexedAddress(log.topics[1]);
      const t1 = topicIndexedAddress(log.topics[2]);
      if (t0) out.add(t0.toLowerCase());
      if (t1) out.add(t1.toLowerCase());
    }
  }

  return [...out];
}

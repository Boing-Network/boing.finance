import {
  encodeNativeDexSwap2RouterCalldata128Hex,
  encodeNativeDexSwap3RouterCalldata128Hex,
  encodeNativeDexSwap4RouterCalldata128Hex,
} from 'boing-sdk';
import { encodeNativeAmmSwapCalldataHex } from './nativeAmmCalldata';

/**
 * @param {string} hex — `encodeNativeAmmSwapCalldataHex` output (`0x` + 256 hex chars)
 * @returns {Uint8Array}
 */
export function swapCalldataHexToUint8Array128(hex) {
  const h = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (!/^[0-9a-fA-F]{256}$/i.test(h)) {
    throw new Error('Expected 128-byte native AMM swap calldata (256 hex chars)');
  }
  const out = new Uint8Array(128);
  for (let i = 0; i < 128; i += 1) {
    out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/**
 * Multihop swap router calldata (2–4 pools). Pair with `contract_call` to the configured swap router module.
 * @param {import('boing-sdk').CpSwapRoute} route
 * @param {number} slippageBps
 * @returns {string}
 */
export function buildMultihopRouterCalldataHexFromRoute(route, slippageBps = 50) {
  const hops = route.hops;
  const n = hops.length;
  if (n < 2 || n > 4) {
    throw new Error('Multihop router expects 2–4 hops');
  }
  const bps = BigInt(Math.min(10_000, Math.max(0, slippageBps)));

  const inners = hops.map((hop) => {
    const minOut = (hop.amountOut * (10_000n - bps)) / 10_000n;
    const hex = encodeNativeAmmSwapCalldataHex(hop.directionForSwapCalldata, hop.amountIn, minOut);
    return swapCalldataHexToUint8Array128(hex);
  });

  const pools = hops.map((h) => h.venue.poolHex);

  if (n === 2) {
    return encodeNativeDexSwap2RouterCalldata128Hex(pools[0], inners[0], pools[1], inners[1]);
  }
  if (n === 3) {
    return encodeNativeDexSwap3RouterCalldata128Hex(
      pools[0],
      inners[0],
      pools[1],
      inners[1],
      pools[2],
      inners[2]
    );
  }
  return encodeNativeDexSwap4RouterCalldata128Hex(
    pools[0],
    inners[0],
    pools[1],
    inners[1],
    pools[2],
    inners[2],
    pools[3],
    inners[3]
  );
}

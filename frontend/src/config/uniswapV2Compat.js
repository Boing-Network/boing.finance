/**
 * Permissionless Uniswap V2–compatible factory + router for Create Pool when Boing DEXFactory
 * is not deployed on the chain. Addresses from official Uniswap v2 deployments (docs.uniswap.org)
 * except BNB Smart Chain, which uses PancakeSwap V2 (the chain’s standard constant-product AMM).
 */
import { ethers } from 'ethers';

const ZERO = '0x0000000000000000000000000000000000000000';

/** @typedef {{ factory: string, router: string, venue: string, feePercent: string }} UniswapV2Compat */

/** @type {Record<number, UniswapV2Compat>} */
const BY_CHAIN_ID = {
  1: {
    factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
    router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    venue: 'Uniswap V2',
    feePercent: '0.3',
  },
  10: {
    factory: '0x0c3c1c532F1e39EdF36BE9Fe0bE1410313E074Bf',
    router: '0x4A7b5Da61326A6379179b40d00F57E5bbDC962c2',
    venue: 'Uniswap V2',
    feePercent: '0.3',
  },
  56: {
    factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
    router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    venue: 'PancakeSwap V2',
    feePercent: '0.25',
  },
  137: {
    factory: '0x9e5A52f57b3038F1B8EeE45F28b3C1967e22799C',
    router: '0xedf6066a2b290C185783862C7F4776A2C8077AD1',
    venue: 'Uniswap V2',
    feePercent: '0.3',
  },
  8453: {
    factory: '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6',
    router: '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
    venue: 'Uniswap V2',
    feePercent: '0.3',
  },
  42161: {
    factory: '0xf1D7CC64Fb4452F05c498126312eBE29f30Fbcf9',
    router: '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
    venue: 'Uniswap V2',
    feePercent: '0.3',
  },
  43114: {
    factory: '0x9e5A52f57b3038F1B8EeE45F28b3C1967e22799C',
    router: '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
    venue: 'Uniswap V2',
    feePercent: '0.3',
  },
  81457: {
    factory: '0x5C346464d33F90bABaf70dB6388507CC889C1070',
    router: '0xBB66Eb1c5e875933D44DAe661dbD80e5D9B03035',
    venue: 'Uniswap V2',
    feePercent: '0.3',
  },
  11155111: {
    factory: '0xF62c03E08ada871A0bEb309762E260a7a6a880E6',
    router: '0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3',
    venue: 'Uniswap V2',
    feePercent: '0.3',
  },
};

/**
 * @param {number} chainId
 * @returns {(UniswapV2Compat & { spender: string }) | null}
 */
export function getUniswapV2Compat(chainId) {
  const row = BY_CHAIN_ID[Number(chainId)];
  if (!row) return null;
  try {
    const factory = ethers.getAddress(row.factory);
    const router = ethers.getAddress(row.router);
    if (factory === ZERO || router === ZERO) return null;
    return { ...row, factory, router, spender: router };
  } catch {
    return null;
  }
}

export function getChainsWithUniswapV2Compat() {
  return Object.keys(BY_CHAIN_ID).map(Number).filter((id) => getUniswapV2Compat(id));
}

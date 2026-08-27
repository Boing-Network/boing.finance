import { ethers } from 'ethers';
import { ensureExactAllowance } from './evmAmmPairActions';

const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) view returns (address)',
];

const ROUTER_ABI = [
  'function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity)',
];

function deadlineFromMinutes(minutes = 20) {
  return Math.floor(Date.now() / 1000) + Math.max(1, minutes) * 60;
}

function applySlippage(amount, slippageBps) {
  const bps = BigInt(Math.min(10_000, Math.max(0, Number(slippageBps) || 0)));
  return (amount * (10_000n - bps)) / 10_000n;
}

/**
 * Approve the Uniswap/Pancake V2 router, then `addLiquidity` (router creates the pair if missing).
 * @returns {Promise<{ txHash: string, pairAddress: string, amountA: bigint, amountB: bigint, liquidity: bigint }>}
 */
export async function createUniswapV2PoolWithLiquidity({
  signer,
  factoryAddress,
  routerAddress,
  tokenA,
  tokenB,
  amountADesired,
  amountBDesired,
  slippageBps = 50,
  recipient,
  deadlineMinutes = 20,
}) {
  if (!signer) {
    throw new Error('Connect an EVM wallet to create this pool.');
  }
  const token0 = ethers.getAddress(tokenA);
  const token1 = ethers.getAddress(tokenB);
  if (token0 === token1) {
    throw new Error('Choose two different tokens.');
  }
  const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, signer);
  const router = new ethers.Contract(routerAddress, ROUTER_ABI, signer);
  const to = recipient || (await signer.getAddress());

  const existing = await factory.getPair(token0, token1);
  const pairExists = existing && existing !== ethers.ZeroAddress;
  const amountAMin = pairExists ? applySlippage(amountADesired, slippageBps) : amountADesired;
  const amountBMin = pairExists ? applySlippage(amountBDesired, slippageBps) : amountBDesired;

  await ensureExactAllowance(token0, routerAddress, amountADesired, signer);
  await ensureExactAllowance(token1, routerAddress, amountBDesired, signer);

  const tx = await router.addLiquidity(
    token0,
    token1,
    amountADesired,
    amountBDesired,
    amountAMin,
    amountBMin,
    to,
    deadlineFromMinutes(deadlineMinutes)
  );
  const receipt = await tx.wait();
  if (!receipt?.hash) {
    throw new Error('Pool transaction was sent but no receipt was returned. Check the explorer.');
  }

  const pairAddress = await factory.getPair(token0, token1);
  if (!pairAddress || pairAddress === ethers.ZeroAddress) {
    throw new Error(`Liquidity tx confirmed (${receipt.hash}) but the pair is still missing on the factory.`);
  }

  return {
    txHash: receipt.hash,
    pairAddress,
    amountA: amountADesired,
    amountB: amountBDesired,
    liquidity: 0n,
  };
}

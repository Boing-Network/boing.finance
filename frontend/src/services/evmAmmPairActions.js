import { ethers } from 'ethers';
import { getContractAddress } from '../config/contracts';

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) view returns (address)',
];

const PAIR_ABI = [
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function balanceOf(address owner) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

const ROUTER_ABI = [
  'function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity)',
  'function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB)',
  'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
  'function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable returns (uint256[] amounts)',
  'function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
];

export function getAmountOut(amountIn, reserveIn, reserveOut) {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0n;
  const amountInWithFee = amountIn * 997n;
  return (amountInWithFee * reserveOut) / (reserveIn * 1000n + amountInWithFee);
}

export function getRouterAddress(chainId) {
  const address = getContractAddress(chainId, 'dexRouter');
  if (!address || address === ethers.ZeroAddress) {
    throw new Error('DEX router is not deployed on this network.');
  }
  return address;
}

export function getFactoryAddress(chainId) {
  const address = getContractAddress(chainId, 'dexFactory');
  if (!address || address === ethers.ZeroAddress) {
    throw new Error('DEX factory is not deployed on this network.');
  }
  return address;
}

export async function ensureExactAllowance(tokenAddress, spender, amount, signer) {
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  const owner = await signer.getAddress();
  const current = await token.allowance(owner, spender);
  if (current >= amount) return null;
  const tx = await token.approve(spender, amount);
  await tx.wait();
  return tx.hash;
}

export function getFactoryContract(chainId, runner) {
  return new ethers.Contract(getFactoryAddress(chainId), FACTORY_ABI, runner);
}

export async function getPairAddress(chainId, tokenA, tokenB, runner) {
  const factory = getFactoryContract(chainId, runner);
  const pairAddress = await factory.getPair(tokenA, tokenB);
  if (!pairAddress || pairAddress === ethers.ZeroAddress) {
    throw new Error('No pool exists for this pair. Create the pool first.');
  }
  return pairAddress;
}

export async function getOrientedReserves(pair, tokenIn) {
  const [token0, reserves] = await Promise.all([pair.token0(), pair.getReserves()]);
  const inIs0 = ethers.getAddress(tokenIn) === ethers.getAddress(token0);
  return inIs0
    ? { reserveIn: reserves[0], reserveOut: reserves[1] }
    : { reserveIn: reserves[1], reserveOut: reserves[0] };
}

/** Pair-oriented quote (does not trust the deployed router’s getAmountsOut). */
export async function quoteExactIn(chainId, provider, tokenIn, tokenOut, amountIn) {
  const pairAddress = await getPairAddress(chainId, tokenIn, tokenOut, provider);
  const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
  const { reserveIn, reserveOut } = await getOrientedReserves(pair, tokenIn);
  const amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
  return { pair: pairAddress, amountOut, reserveIn, reserveOut };
}

function deadlineFromMinutes(minutes = 20) {
  return Math.floor(Date.now() / 1000) + Math.max(1, minutes) * 60;
}

export async function swapExactTokensViaRouter({
  chainId,
  signer,
  tokenIn,
  tokenOut,
  amountIn,
  minOut,
  recipient,
  nativeIn = false,
  nativeOut = false,
  deadlineMinutes = 20,
}) {
  const to = recipient || (await signer.getAddress());
  const routerAddress = getRouterAddress(chainId);
  const router = new ethers.Contract(routerAddress, ROUTER_ABI, signer);
  const deadline = deadlineFromMinutes(deadlineMinutes);
  const path = [tokenIn, tokenOut];

  if (!nativeIn) {
    await ensureExactAllowance(tokenIn, routerAddress, amountIn, signer);
  }

  let tx;
  if (nativeIn) {
    tx = await router.swapExactETHForTokens(minOut, path, to, deadline, { value: amountIn });
  } else if (nativeOut) {
    tx = await router.swapExactTokensForETH(amountIn, minOut, path, to, deadline);
  } else {
    tx = await router.swapExactTokensForTokens(amountIn, minOut, path, to, deadline);
  }
  const receipt = await tx.wait();
  return { hash: receipt.hash, router: routerAddress };
}

export async function addLiquidityViaRouter({
  chainId,
  signer,
  tokenA,
  tokenB,
  amountADesired,
  amountBDesired,
  amountAMin,
  amountBMin,
  recipient,
  deadlineMinutes = 20,
}) {
  const to = recipient || (await signer.getAddress());
  const routerAddress = getRouterAddress(chainId);
  await getPairAddress(chainId, tokenA, tokenB, signer);
  await ensureExactAllowance(tokenA, routerAddress, amountADesired, signer);
  await ensureExactAllowance(tokenB, routerAddress, amountBDesired, signer);
  const router = new ethers.Contract(routerAddress, ROUTER_ABI, signer);
  const tx = await router.addLiquidity(
    tokenA,
    tokenB,
    amountADesired,
    amountBDesired,
    amountAMin,
    amountBMin,
    to,
    deadlineFromMinutes(deadlineMinutes),
  );
  const receipt = await tx.wait();
  return { hash: receipt.hash };
}

export async function removeLiquidityViaRouter({
  chainId,
  signer,
  tokenA,
  tokenB,
  liquidity,
  amountAMin,
  amountBMin,
  recipient,
  deadlineMinutes = 20,
}) {
  const to = recipient || (await signer.getAddress());
  const routerAddress = getRouterAddress(chainId);
  const pairAddress = await getPairAddress(chainId, tokenA, tokenB, signer);
  await ensureExactAllowance(pairAddress, routerAddress, liquidity, signer);
  const router = new ethers.Contract(routerAddress, ROUTER_ABI, signer);
  const tx = await router.removeLiquidity(
    tokenA,
    tokenB,
    liquidity,
    amountAMin,
    amountBMin,
    to,
    deadlineFromMinutes(deadlineMinutes),
  );
  const receipt = await tx.wait();
  return { hash: receipt.hash, pair: pairAddress };
}

export async function readUserLpPosition({ chainId, provider, account, tokenA, tokenB }) {
  const pairAddress = await getPairAddress(chainId, tokenA, tokenB, provider);
  const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
  const [lp, supply, token0, reserves, symbol0, symbol1] = await Promise.all([
    pair.balanceOf(account),
    pair.totalSupply(),
    pair.token0(),
    pair.getReserves(),
    new ethers.Contract(tokenA, ERC20_ABI, provider).symbol().catch(() => 'T0'),
    new ethers.Contract(tokenB, ERC20_ABI, provider).symbol().catch(() => 'T1'),
  ]);
  const share = supply > 0n ? (lp * 10000n) / supply : 0n;
  const aIs0 = ethers.getAddress(tokenA) === ethers.getAddress(token0);
  const amountA = supply > 0n ? (lp * (aIs0 ? reserves[0] : reserves[1])) / supply : 0n;
  const amountB = supply > 0n ? (lp * (aIs0 ? reserves[1] : reserves[0])) / supply : 0n;
  return {
    pair: pairAddress,
    lp,
    supply,
    shareBps: share,
    amountA,
    amountB,
    symbol0,
    symbol1,
    tokenA,
    tokenB,
  };
}

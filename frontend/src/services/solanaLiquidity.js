import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import {
  assertSolanaPayerFunded,
  formatSolanaSimulationError,
  simulateLegacyTransaction,
} from './solanaDeployTx';
import {
  encodeU64LE,
  ensureAtaIx,
  getRaydiumCpmmAuthority,
  getRaydiumCpmmCluster,
  parseSplAmount,
} from './solanaCreatePool';

const DEPOSIT_DISCRIMINATOR = Uint8Array.from([242, 35, 198, 137, 82, 225, 242, 182]);
const WITHDRAW_DISCRIMINATOR = Uint8Array.from([183, 18, 70, 156, 148, 109, 161, 34]);
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

const POOL_LAYOUT_MIN = 341;

function readPubkey(data, offset) {
  return new PublicKey(data.subarray(offset, offset + 32));
}

function readU64LE(data, offset) {
  let n = 0n;
  for (let i = 0; i < 8; i += 1) {
    n |= BigInt(data[offset + i]) << (8n * BigInt(i));
  }
  return n;
}

function applySlippage(amount, bps = 50) {
  return (BigInt(amount) * (10_000n - BigInt(bps))) / 10_000n;
}

function encodeDepositOrWithdrawData(discriminator, lpAmount, amountA, amountB) {
  const data = new Uint8Array(8 + 8 + 8 + 8);
  data.set(discriminator, 0);
  data.set(encodeU64LE(lpAmount), 8);
  data.set(encodeU64LE(amountA), 16);
  data.set(encodeU64LE(amountB), 24);
  return data;
}

/**
 * Decode Raydium CPMM pool account (discriminator + CpmmPoolInfoLayout pubkeys / decimals / lpAmount).
 * @param {Uint8Array | Buffer} data
 */
export function decodeRaydiumCpmmPool(data) {
  if (!data || data.length < POOL_LAYOUT_MIN) {
    throw new Error('Not a Raydium CPMM pool account (too short).');
  }
  return {
    configId: readPubkey(data, 8),
    creator: readPubkey(data, 40),
    vaultA: readPubkey(data, 72),
    vaultB: readPubkey(data, 104),
    mintLp: readPubkey(data, 136),
    mintA: readPubkey(data, 168),
    mintB: readPubkey(data, 200),
    mintProgramA: readPubkey(data, 232),
    mintProgramB: readPubkey(data, 264),
    observationId: readPubkey(data, 296),
    lpDecimals: data[330],
    mintDecimalA: data[331],
    mintDecimalB: data[332],
    lpAmount: readU64LE(data, 333),
  };
}

async function tokenAccountAmount(connection, pubkey) {
  const bal = await connection.getTokenAccountBalance(pubkey, 'confirmed');
  return BigInt(bal?.value?.amount || '0');
}

/**
 * Load an existing Raydium CPMM pool and the connected wallet's LP share.
 */
export async function fetchRaydiumCpmmPool({ connection, poolId, ownerAddress, network = 'devnet' }) {
  if (!connection) throw new Error('Solana RPC is not connected.');
  const poolPk = new PublicKey(String(poolId).trim());
  const cluster = getRaydiumCpmmCluster(network);
  const info = await connection.getAccountInfo(poolPk, 'confirmed');
  if (!info?.data) throw new Error('No account at that pool id on this cluster.');
  if (!info.owner.equals(cluster.programId)) {
    throw new Error(
      `That account is not a Raydium CPMM pool on ${network === 'mainnet' ? 'mainnet' : 'devnet'}.`
    );
  }
  const decoded = decodeRaydiumCpmmPool(info.data);
  const [reserveA, reserveB] = await Promise.all([
    tokenAccountAmount(connection, decoded.vaultA),
    tokenAccountAmount(connection, decoded.vaultB),
  ]);

  let userLp = 0n;
  if (ownerAddress) {
    const owner = new PublicKey(ownerAddress);
    const lpAta = getAssociatedTokenAddressSync(decoded.mintLp, owner, false, TOKEN_PROGRAM_ID);
    try {
      const acct = await getAccount(connection, lpAta, 'confirmed', TOKEN_PROGRAM_ID);
      userLp = BigInt(acct.amount.toString());
    } catch {
      userLp = 0n;
    }
  }

  const supply = decoded.lpAmount;
  const shareBps = supply > 0n ? (userLp * 10000n) / supply : 0n;
  const amountA = supply > 0n ? (userLp * reserveA) / supply : 0n;
  const amountB = supply > 0n ? (userLp * reserveB) / supply : 0n;

  return {
    poolId: poolPk.toBase58(),
    programId: cluster.programId,
    authority: getRaydiumCpmmAuthority(cluster.programId),
    ...decoded,
    reserveA,
    reserveB,
    userLp,
    shareBps,
    amountA,
    amountB,
  };
}

export function quoteCpmmTokenBForTokenA(amountA, reserveA, reserveB) {
  const a = BigInt(amountA);
  const ra = BigInt(reserveA);
  const rb = BigInt(reserveB);
  if (a <= 0n || ra <= 0n || rb <= 0n) return 0n;
  return (a * rb) / ra;
}

export function lpTokensForDeposit(amountA, amountB, reserveA, reserveB, supply) {
  const a = BigInt(amountA);
  const b = BigInt(amountB);
  const ra = BigInt(reserveA);
  const rb = BigInt(reserveB);
  const s = BigInt(supply);
  if (a <= 0n || b <= 0n || ra <= 0n || rb <= 0n || s <= 0n) return 0n;
  const lpA = (a * s) / ra;
  const lpB = (b * s) / rb;
  return lpA < lpB ? lpA : lpB;
}

async function sendSignedLegacyTx({ connection, owner, signTransaction, network, instructions }) {
  await assertSolanaPayerFunded(connection, owner, network, 20_000_000);
  const tx = new Transaction();
  for (const ix of instructions) tx.add(ix);
  tx.feePayer = owner;
  const sim = await simulateLegacyTransaction(connection, tx);
  if (sim?.value?.err) {
    throw new Error(formatSolanaSimulationError(sim, network));
  }
  const latest = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = latest.blockhash;
  const signed = await signTransaction(tx);
  const signature = await connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });
  await connection.confirmTransaction(
    { signature, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight },
    'confirmed'
  );
  return signature;
}

/**
 * Deposit both sides into an existing Raydium CPMM pool.
 */
export async function depositRaydiumCpmmLiquidity({
  connection,
  ownerAddress,
  signTransaction,
  poolId,
  amountA,
  amountB,
  network = 'devnet',
}) {
  if (!signTransaction) throw new Error('Solana wallet is not connected.');
  const owner = new PublicKey(ownerAddress);
  const pool = await fetchRaydiumCpmmPool({ connection, poolId, ownerAddress, network });
  const amountABn = parseSplAmount(amountA, pool.mintDecimalA);
  const amountBBn = parseSplAmount(amountB, pool.mintDecimalB);
  const lpAmount = lpTokensForDeposit(amountABn, amountBBn, pool.reserveA, pool.reserveB, pool.lpAmount);
  if (lpAmount <= 0n) {
    throw new Error('Amounts are too small relative to current reserves, or the pool has no LP supply yet.');
  }

  const userA = await ensureAtaIx(connection, owner, pool.mintA, pool.mintProgramA);
  const userB = await ensureAtaIx(connection, owner, pool.mintB, pool.mintProgramB);
  const userLp = await ensureAtaIx(connection, owner, pool.mintLp, TOKEN_PROGRAM_ID);
  if (userA.ix || userB.ix) {
    throw new Error('Create the associated token accounts for both mints (and hold the deposit amounts) first.');
  }

  const [balA, balB] = await Promise.all([
    getAccount(connection, userA.ata, 'confirmed', pool.mintProgramA),
    getAccount(connection, userB.ata, 'confirmed', pool.mintProgramB),
  ]);
  if (BigInt(balA.amount.toString()) < amountABn) {
    throw new Error('Not enough token A in this wallet for the deposit.');
  }
  if (BigInt(balB.amount.toString()) < amountBBn) {
    throw new Error('Not enough token B in this wallet for the deposit.');
  }

  const amountMaxA = amountABn;
  const amountMaxB = amountBBn;

  const keys = [
    { pubkey: owner, isSigner: true, isWritable: false },
    { pubkey: pool.authority, isSigner: false, isWritable: false },
    { pubkey: new PublicKey(pool.poolId), isSigner: false, isWritable: true },
    { pubkey: userLp.ata, isSigner: false, isWritable: true },
    { pubkey: userA.ata, isSigner: false, isWritable: true },
    { pubkey: userB.ata, isSigner: false, isWritable: true },
    { pubkey: pool.vaultA, isSigner: false, isWritable: true },
    { pubkey: pool.vaultB, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: pool.mintA, isSigner: false, isWritable: false },
    { pubkey: pool.mintB, isSigner: false, isWritable: false },
    { pubkey: pool.mintLp, isSigner: false, isWritable: true },
  ];

  const ix = new TransactionInstruction({
    programId: pool.programId,
    keys,
    data: Buffer.from(encodeDepositOrWithdrawData(DEPOSIT_DISCRIMINATOR, lpAmount, amountMaxA, amountMaxB)),
  });

  const instructions = [];
  if (userLp.ix) instructions.push(userLp.ix);
  instructions.push(ix);

  const signature = await sendSignedLegacyTx({
    connection,
    owner,
    signTransaction,
    network,
    instructions,
  });
  return { signature, poolId: pool.poolId, lpAmount: lpAmount.toString() };
}

/**
 * Burn LP tokens and withdraw both sides from an existing Raydium CPMM pool.
 */
export async function withdrawRaydiumCpmmLiquidity({
  connection,
  ownerAddress,
  signTransaction,
  poolId,
  lpAmount,
  network = 'devnet',
  slippageBps = 50,
}) {
  if (!signTransaction) throw new Error('Solana wallet is not connected.');
  const owner = new PublicKey(ownerAddress);
  const pool = await fetchRaydiumCpmmPool({ connection, poolId, ownerAddress, network });
  const lpBn =
    typeof lpAmount === 'bigint' ? lpAmount : parseSplAmount(String(lpAmount), pool.lpDecimals);
  if (lpBn <= 0n) throw new Error('Enter a positive LP amount to burn.');
  if (lpBn > pool.userLp) throw new Error('You do not hold that much LP in this wallet.');

  const userA = await ensureAtaIx(connection, owner, pool.mintA, pool.mintProgramA);
  const userB = await ensureAtaIx(connection, owner, pool.mintB, pool.mintProgramB);
  const userLpAta = getAssociatedTokenAddressSync(pool.mintLp, owner, false, TOKEN_PROGRAM_ID);

  const outA = pool.lpAmount > 0n ? (lpBn * pool.reserveA) / pool.lpAmount : 0n;
  const outB = pool.lpAmount > 0n ? (lpBn * pool.reserveB) / pool.lpAmount : 0n;
  const amountMinA = applySlippage(outA, slippageBps);
  const amountMinB = applySlippage(outB, slippageBps);

  const keys = [
    { pubkey: owner, isSigner: true, isWritable: false },
    { pubkey: pool.authority, isSigner: false, isWritable: false },
    { pubkey: new PublicKey(pool.poolId), isSigner: false, isWritable: true },
    { pubkey: userLpAta, isSigner: false, isWritable: true },
    { pubkey: userA.ata, isSigner: false, isWritable: true },
    { pubkey: userB.ata, isSigner: false, isWritable: true },
    { pubkey: pool.vaultA, isSigner: false, isWritable: true },
    { pubkey: pool.vaultB, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: pool.mintA, isSigner: false, isWritable: false },
    { pubkey: pool.mintB, isSigner: false, isWritable: false },
    { pubkey: pool.mintLp, isSigner: false, isWritable: true },
    { pubkey: MEMO_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  const ix = new TransactionInstruction({
    programId: pool.programId,
    keys,
    data: Buffer.from(encodeDepositOrWithdrawData(WITHDRAW_DISCRIMINATOR, lpBn, amountMinA, amountMinB)),
  });

  const instructions = [];
  if (userA.ix) instructions.push(userA.ix);
  if (userB.ix) instructions.push(userB.ix);
  instructions.push(ix);

  const signature = await sendSignedLegacyTx({
    connection,
    owner,
    signTransaction,
    network,
    instructions,
  });
  return { signature, poolId: pool.poolId, lpAmount: lpBn.toString() };
}

export function formatSplAmount(amount, decimals) {
  const n = BigInt(amount || 0);
  const d = Number(decimals || 0);
  if (d <= 0) return n.toString();
  const base = 10n ** BigInt(d);
  const whole = n / base;
  const frac = n % base;
  if (frac === 0n) return whole.toString();
  return `${whole.toString()}.${frac.toString().padStart(d, '0').replace(/0+$/, '')}`;
}

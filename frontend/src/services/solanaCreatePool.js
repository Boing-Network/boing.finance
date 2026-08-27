import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
} from '@solana/spl-token';
import {
  assertSolanaPayerFunded,
  formatSolanaSimulationError,
  simulateLegacyTransaction,
} from './solanaDeployTx';

const INIT_DISCRIMINATOR = Uint8Array.from([175, 175, 109, 31, 13, 152, 155, 237]);
const AUTH_SEED = Buffer.from('vault_and_lp_mint_auth_seed');
const POOL_SEED = Buffer.from('pool');
const POOL_LP_MINT_SEED = Buffer.from('pool_lp_mint');
const POOL_VAULT_SEED = Buffer.from('pool_vault');
const OBSERVATION_SEED = Buffer.from('observation');

const MAINNET = {
  programId: new PublicKey('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C'),
  feeAccount: new PublicKey('DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8'),
  defaultConfig: new PublicKey('D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2'),
  configApi: 'https://api-v3.raydium.io/main/cpmm-config',
};

const DEVNET = {
  programId: new PublicKey('DRaycpLY18LhpbydsBWbVJtxpNv9oXPgjRSfpF2bWpYb'),
  feeAccount: new PublicKey('3oE58BKVt8KuYkGxx8zBojugnymWmBiyafWgMrnb6eYy'),
  defaultConfig: new PublicKey('5MxLgy9oPdTC3YgkiePHqr3EoCRD9uLVYRQS2ANAs7wy'),
  configApi: 'https://api-v3-devnet.raydium.io/main/cpmm-config',
};

const CREATE_POOL_LAMPORTS = 150_000_000n;
const RENT_BUFFER_LAMPORTS = 120_000_000n;

function clusterConfig(network) {
  return network === 'mainnet' ? MAINNET : DEVNET;
}

export function getRaydiumCpmmCluster(network) {
  return clusterConfig(network);
}

export function getRaydiumCpmmAuthority(programId) {
  const [authority] = PublicKey.findProgramAddressSync([AUTH_SEED], programId);
  return authority;
}

export function encodeU64LE(value) {
  const n = BigInt(value);
  const out = new Uint8Array(8);
  let x = n;
  for (let i = 0; i < 8; i += 1) {
    out[i] = Number(x & 0xffn);
    x >>= 8n;
  }
  return out;
}

export function parseSplAmount(raw, decimals) {
  const t = String(raw ?? '').trim();
  if (!t || !/^\d+(\.\d+)?$/.test(t)) {
    throw new Error('Enter a valid token amount.');
  }
  const [whole, frac = ''] = t.split('.');
  if (frac.length > Number(decimals)) {
    throw new Error(`Amount has more than ${decimals} decimal places.`);
  }
  const fracPadded = (frac + '0'.repeat(Number(decimals))).slice(0, Number(decimals));
  const n = BigInt(whole || '0') * 10n ** BigInt(decimals) + BigInt(fracPadded || '0');
  if (n <= 0n) throw new Error('Amounts must be greater than 0.');
  if (n > 2n ** 64n - 1n) throw new Error('Amount exceeds u64 (Raydium CPMM limit).');
  return n;
}

function pubkeyCmp(a, b) {
  const aa = a.toBuffer();
  const bb = b.toBuffer();
  for (let i = 0; i < 32; i += 1) {
    if (aa[i] !== bb[i]) return aa[i] < bb[i] ? -1 : 1;
  }
  return 0;
}

export async function loadMint(connection, mint) {
  try {
    const info = await getMint(connection, mint, 'confirmed', TOKEN_PROGRAM_ID);
    return { mint: info, programId: TOKEN_PROGRAM_ID };
  } catch {
    const info = await getMint(connection, mint, 'confirmed', TOKEN_2022_PROGRAM_ID);
    return { mint: info, programId: TOKEN_2022_PROGRAM_ID };
  }
}

async function resolveConfigId(network, preferredTradeFeeRate = 2500) {
  const cfg = clusterConfig(network);
  try {
    const res = await fetch(cfg.configApi);
    if (res.ok) {
      const json = await res.json();
      const rows = Array.isArray(json?.data) ? json.data : [];
      const shown = rows.filter((r) => r?.showWithUI !== false && r?.id);
      const match =
        shown.find((r) => Number(r.tradeFeeRate) === preferredTradeFeeRate) || shown[0] || rows[0];
      if (match?.id) return new PublicKey(match.id);
    }
  } catch {
    /* use baked default */
  }
  return cfg.defaultConfig;
}

function derivePoolKeys(programId, configId, mintA, mintB) {
  const [authority] = PublicKey.findProgramAddressSync([AUTH_SEED], programId);
  const [poolId] = PublicKey.findProgramAddressSync(
    [POOL_SEED, configId.toBuffer(), mintA.toBuffer(), mintB.toBuffer()],
    programId
  );
  const [lpMint] = PublicKey.findProgramAddressSync([POOL_LP_MINT_SEED, poolId.toBuffer()], programId);
  const [vaultA] = PublicKey.findProgramAddressSync(
    [POOL_VAULT_SEED, poolId.toBuffer(), mintA.toBuffer()],
    programId
  );
  const [vaultB] = PublicKey.findProgramAddressSync(
    [POOL_VAULT_SEED, poolId.toBuffer(), mintB.toBuffer()],
    programId
  );
  const [observationId] = PublicKey.findProgramAddressSync([OBSERVATION_SEED, poolId.toBuffer()], programId);
  return { authority, poolId, lpMint, vaultA, vaultB, observationId };
}

export async function ensureAtaIx(connection, owner, mint, tokenProgram) {
  const ata = getAssociatedTokenAddressSync(mint, owner, false, tokenProgram);
  try {
    await getAccount(connection, ata, 'confirmed', tokenProgram);
    return { ata, ix: null };
  } catch {
    return {
      ata,
      ix: createAssociatedTokenAccountInstruction(owner, ata, owner, mint, tokenProgram, ASSOCIATED_TOKEN_PROGRAM_ID),
    };
  }
}

/**
 * Create a Raydium CPMM pool (constant-product) and seed it with the user's SPL balances.
 * @returns {Promise<{ signature: string, poolId: string, lpMint: string, tradeFeeRate: number }>}
 */
export async function createSolanaRaydiumCpmmPool({
  connection,
  ownerAddress,
  signTransaction,
  mintA,
  mintB,
  amountA,
  amountB,
  network = 'devnet',
  tradeFeeRate = 2500,
}) {
  if (!connection) throw new Error('Solana RPC is not connected.');
  if (!signTransaction) throw new Error('Solana wallet is not connected.');
  const owner = new PublicKey(ownerAddress);
  const mintAPk = new PublicKey(String(mintA).trim());
  const mintBPk = new PublicKey(String(mintB).trim());
  if (mintAPk.equals(mintBPk)) throw new Error('Choose two different mints.');

  const [mintAInfo, mintBInfo] = await Promise.all([
    loadMint(connection, mintAPk),
    loadMint(connection, mintBPk),
  ]);
  let amountABn = parseSplAmount(amountA, mintAInfo.mint.decimals);
  let amountBBn = parseSplAmount(amountB, mintBInfo.mint.decimals);

  let token0 = mintAPk;
  let token1 = mintBPk;
  let token0Program = mintAInfo.programId;
  let token1Program = mintBInfo.programId;
  let amount0 = amountABn;
  let amount1 = amountBBn;
  if (pubkeyCmp(mintAPk, mintBPk) > 0) {
    token0 = mintBPk;
    token1 = mintAPk;
    token0Program = mintBInfo.programId;
    token1Program = mintAInfo.programId;
    amount0 = amountBBn;
    amount1 = amountABn;
  }

  const cluster = clusterConfig(network);
  const configId = await resolveConfigId(network, tradeFeeRate);
  const keys = derivePoolKeys(cluster.programId, configId, token0, token1);

  const existing = await connection.getAccountInfo(keys.poolId, 'confirmed');
  if (existing) {
    throw new Error(`A Raydium CPMM pool for this pair already exists: ${keys.poolId.toBase58()}`);
  }

  await assertSolanaPayerFunded(
    connection,
    owner,
    network,
    Number(CREATE_POOL_LAMPORTS + RENT_BUFFER_LAMPORTS)
  );

  const userA = await ensureAtaIx(connection, owner, token0, token0Program);
  const userB = await ensureAtaIx(connection, owner, token1, token1Program);
  const userLp = getAssociatedTokenAddressSync(keys.lpMint, owner, false, TOKEN_PROGRAM_ID);

  if (userA.ix || userB.ix) {
    throw new Error(
      'Create the associated token accounts for both mints (and hold the seed amounts) before creating the pool.'
    );
  }

  const [balA, balB] = await Promise.all([
    getAccount(connection, userA.ata, 'confirmed', token0Program),
    getAccount(connection, userB.ata, 'confirmed', token1Program),
  ]);
  if (balA.amount < amount0) {
    throw new Error(`Not enough ${token0.toBase58().slice(0, 6)}… in this wallet for the Token A seed.`);
  }
  if (balB.amount < amount1) {
    throw new Error(`Not enough ${token1.toBase58().slice(0, 6)}… in this wallet for the Token B seed.`);
  }

  const data = new Uint8Array(8 + 8 + 8 + 8);
  data.set(INIT_DISCRIMINATOR, 0);
  data.set(encodeU64LE(amount0), 8);
  data.set(encodeU64LE(amount1), 16);
  data.set(encodeU64LE(0n), 24);

  const ix = new TransactionInstruction({
    programId: cluster.programId,
    keys: [
      { pubkey: owner, isSigner: true, isWritable: false },
      { pubkey: configId, isSigner: false, isWritable: false },
      { pubkey: keys.authority, isSigner: false, isWritable: false },
      { pubkey: keys.poolId, isSigner: false, isWritable: true },
      { pubkey: token0, isSigner: false, isWritable: false },
      { pubkey: token1, isSigner: false, isWritable: false },
      { pubkey: keys.lpMint, isSigner: false, isWritable: true },
      { pubkey: userA.ata, isSigner: false, isWritable: true },
      { pubkey: userB.ata, isSigner: false, isWritable: true },
      { pubkey: userLp, isSigner: false, isWritable: true },
      { pubkey: keys.vaultA, isSigner: false, isWritable: true },
      { pubkey: keys.vaultB, isSigner: false, isWritable: true },
      { pubkey: cluster.feeAccount, isSigner: false, isWritable: true },
      { pubkey: keys.observationId, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: token0Program, isSigner: false, isWritable: false },
      { pubkey: token1Program, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(data),
  });

  const tx = new Transaction();
  tx.add(ix);
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

  return {
    signature,
    poolId: keys.poolId.toBase58(),
    lpMint: keys.lpMint.toBase58(),
    tradeFeeRate,
  };
}

export function solanaCreatePoolFeeHint(network) {
  return network === 'mainnet'
    ? 'Raydium CPMM charges 0.15 SOL to create a pool, plus rent. You need both SPL balances in this wallet.'
    : 'Devnet Raydium CPMM charges 0.15 SOL (devnet) plus rent. You need both SPL balances on this cluster.';
}

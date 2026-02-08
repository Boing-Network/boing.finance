/**
 * Solana SPL Token Service
 * Creates SPL tokens - builds transaction for wallet to sign
 */
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  createInitializeMint2Instruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
} from '@solana/spl-token';

/**
 * Build and execute SPL token creation transaction
 * @param {Connection} connection - Solana connection
 * @param {string} ownerAddress - Owner/wallet public key (base58)
 * @param {Function} signTransaction - Wallet's signTransaction(Transaction)
 * @param {object} params - { name, symbol, decimals, initialSupply }
 * @returns {{ mintAddress: string, signature: string }}
 */
export async function createSPLToken(connection, ownerAddress, signTransaction, params) {
  const { decimals = 9, initialSupply = '0' } = params;
  const owner = new PublicKey(ownerAddress);
  const supplyAmount = BigInt(Math.floor(parseFloat(String(initialSupply || '0')) * Math.pow(10, decimals)));

  const mintKeypair = Keypair.generate();
  const lamports = await getMinimumBalanceForRentExemptMint(connection);

  const transaction = new Transaction();

  // 1. Create mint account
  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: owner,
      newAccountPubkey: mintKeypair.publicKey,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMint2Instruction(
      mintKeypair.publicKey,
      decimals,
      owner,
      null,
      TOKEN_PROGRAM_ID
    )
  );

  // 2. Create associated token account
  const ata = getAssociatedTokenAddressSync(
    mintKeypair.publicKey,
    owner,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  transaction.add(
    createAssociatedTokenAccountInstruction(
      owner,
      ata,
      owner,
      mintKeypair.publicKey,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
  );

  // 3. Mint initial supply
  if (supplyAmount > 0n) {
    transaction.add(
      createMintToInstruction(
        mintKeypair.publicKey,
        ata,
        owner,
        supplyAmount,
        [],
        TOKEN_PROGRAM_ID
      )
    );
  }

  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.feePayer = owner;

  transaction.sign(mintKeypair);
  const signed = await signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });
  await connection.confirmTransaction(signature, 'confirmed');

  return {
    mintAddress: mintKeypair.publicKey.toBase58(),
    tokenAccountAddress: ata.toBase58(),
    signature,
  };
}

export function estimateCreateTokenCost() {
  const MINT_RENT = 0.00144 * 1e9;
  const ATA_RENT = 0.00203928 * 1e9;
  const TX_FEE = 5000;
  return Math.ceil(MINT_RENT + ATA_RENT + TX_FEE);
}

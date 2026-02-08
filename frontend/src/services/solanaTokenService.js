/**
 * Solana SPL Token Service - Industry-standard with Metaplex metadata
 * Creates SPL tokens with R2-hosted metadata (name, symbol, logo URI)
 * Security: input validation, simulation before send
 */
import {
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
import { createCreateMetadataAccountV3Instruction } from '@metaplex-foundation/mpl-token-metadata';
import { getMetadataPDA } from './solanaMetaplex';
import { uploadMetadataToR2ForSolana, uploadToR2ForSolana } from '../utils/solanaStorage';

// Validation
const NAME_MAX = 32;
const SYMBOL_MAX = 10;
const SUPPLY_MAX = '1000000000000000';

function validateTokenParams(params) {
  const { name, symbol, decimals, initialSupply } = params;
  if (!name || typeof name !== 'string') throw new Error('Token name is required');
  const n = name.trim();
  if (n.length > NAME_MAX) throw new Error(`Name must be ≤${NAME_MAX} chars`);
  if (!symbol || typeof symbol !== 'string') throw new Error('Token symbol is required');
  const s = symbol.trim().toUpperCase();
  if (s.length > SYMBOL_MAX) throw new Error(`Symbol must be ≤${SYMBOL_MAX} chars`);
  const d = Number(decimals);
  if (!Number.isInteger(d) || d < 0 || d > 9) throw new Error('Decimals must be 0-9');
  const supply = String(initialSupply || '0').trim();
  if (BigInt(supply) > BigInt(SUPPLY_MAX)) throw new Error('Initial supply too large');
}

/**
 * Create SPL token with Metaplex metadata (R2)
 * @param {Connection} connection
 * @param {string} ownerAddress
 * @param {Function} signTransaction
 * @param {object} params - { name, symbol, decimals, initialSupply, logoFile? }
 */
export async function createSPLToken(connection, ownerAddress, signTransaction, params) {
  validateTokenParams(params);
  const { name, symbol, decimals = 9, initialSupply = '0', logoFile } = params;
  const owner = new PublicKey(ownerAddress);
  const supplyAmount = BigInt(Math.floor(parseFloat(String(initialSupply || '0')) * Math.pow(10, Number(decimals))));

  // 1. Upload metadata to R2
  let imageUri = '';
  if (logoFile) {
    const img = await uploadToR2ForSolana(logoFile);
    imageUri = img.url;
  }
  const metadata = {
    name: name.trim(),
    symbol: symbol.trim().toUpperCase(),
    description: `${name.trim()} - SPL Token on Solana`,
    image: imageUri,
  };
  const { url: metadataUri } = await uploadMetadataToR2ForSolana(metadata);

  const mintKeypair = Keypair.generate();
  const lamports = await getMinimumBalanceForRentExemptMint(connection);
  const [metadataPDA] = getMetadataPDA(mintKeypair.publicKey);

  const transaction = new Transaction();

  // Create mint
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
      Number(decimals),
      owner,
      null,
      TOKEN_PROGRAM_ID
    )
  );

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

  // Metaplex metadata (industry standard)
  transaction.add(
    createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataPDA,
        mint: mintKeypair.publicKey,
        mintAuthority: owner,
        payer: owner,
        updateAuthority: owner,
      },
      {
        createMetadataAccountArgsV3: {
          data: {
            name: name.trim().slice(0, 32),
            symbol: symbol.trim().toUpperCase().slice(0, 10),
            uri: metadataUri,
            sellerFeeBasisPoints: 0,
            creators: null,
            collection: null,
            uses: null,
          },
          isMutable: true,
          collectionDetails: null,
        },
      }
    )
  );

  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.feePayer = owner;
  transaction.sign(mintKeypair);

  // Simulate before send (security)
  const sim = await connection.simulateTransaction(transaction);
  if (sim.value.err) {
    throw new Error(`Simulation failed: ${JSON.stringify(sim.value.err)}`);
  }

  const signed = await signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });
  await connection.confirmTransaction(signature, 'confirmed');

  return {
    mintAddress: mintKeypair.publicKey.toBase58(),
    tokenAccountAddress: ata.toBase58(),
    metadataUri,
    signature,
  };
}

export function estimateCreateTokenCost() {
  const MINT_RENT = 0.00144 * 1e9;
  const ATA_RENT = 0.00203928 * 1e9;
  const METADATA_RENT = 0.01 * 1e9; // ~0.01 SOL for Metaplex metadata
  const TX_FEE = 10000;
  return Math.ceil(MINT_RENT + ATA_RENT + METADATA_RENT + TX_FEE);
}

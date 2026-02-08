/**
 * Solana NFT Service - Industry-standard with Metaplex metadata
 * Creates SPL NFTs (0 decimals, supply 1) with R2-hosted metadata
 * Security: input validation, simulation before send, immutable mint
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
  createSetAuthorityInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  AuthorityType,
} from '@solana/spl-token';
import { createCreateMetadataAccountV3Instruction } from '@metaplex-foundation/mpl-token-metadata';
import { getMetadataPDA } from './solanaMetaplex';
import { uploadMetadataToR2ForSolana, uploadToR2ForSolana } from '../utils/solanaStorage';

const NAME_MAX = 32;
const SYMBOL_MAX = 10;
const IMAGE_MAX_MB = 10;

function validateNftParams(params) {
  const { name, symbol, imageFile } = params;
  if (!name || typeof name !== 'string') throw new Error('Name is required');
  if (name.trim().length > NAME_MAX) throw new Error(`Name must be ≤${NAME_MAX} chars`);
  if (!symbol || typeof symbol !== 'string') throw new Error('Symbol is required');
  if (symbol.trim().toUpperCase().length > SYMBOL_MAX) throw new Error(`Symbol must be ≤${SYMBOL_MAX} chars`);
  if (!imageFile || !(imageFile instanceof File)) throw new Error('Image file is required');
  if (!imageFile.type.startsWith('image/')) throw new Error('File must be an image');
  if (imageFile.size > IMAGE_MAX_MB * 1024 * 1024) throw new Error(`Image must be ≤${IMAGE_MAX_MB}MB`);
}

/**
 * Create SPL NFT with Metaplex metadata (R2)
 */
export async function createSPLNFT(connection, ownerAddress, signTransaction, params) {
  validateNftParams(params);
  const { name, symbol, description, imageFile, attributes = [] } = params;
  const owner = new PublicKey(ownerAddress);

  // 1. Upload image to R2
  const imageResult = await uploadToR2ForSolana(imageFile);
  const imageUri = imageResult.url;

  // 2. Build and upload metadata JSON to R2
  const metadata = {
    name: name.trim(),
    symbol: symbol.trim().toUpperCase(),
    description: description || '',
    image: imageUri,
    attributes: Array.isArray(attributes) ? attributes.filter(a => a?.trait_type && a?.value != null) : [],
  };
  const { url: metadataUri } = await uploadMetadataToR2ForSolana(metadata);

  const mintKeypair = Keypair.generate();
  const lamports = await getMinimumBalanceForRentExemptMint(connection);
  const [metadataPDA] = getMetadataPDA(mintKeypair.publicKey);

  const transaction = new Transaction();

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
      0,
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
    ),
    createMintToInstruction(
      mintKeypair.publicKey,
      ata,
      owner,
      1,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  // Metaplex metadata (industry standard - Magic Eden, Tensor compatible)
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

  // Immutable: revoke mint authority (industry best practice)
  transaction.add(
    createSetAuthorityInstruction(
      mintKeypair.publicKey,
      owner,
      AuthorityType.MintTokens,
      null,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.feePayer = owner;
  transaction.sign(mintKeypair);

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
    imageUri,
    signature,
  };
}

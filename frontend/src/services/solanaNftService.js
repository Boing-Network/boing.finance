/**
 * Solana NFT (SPL Token) Service
 * Creates SPL mints with decimals=0, supply=1 (NFT standard)
 * Uses IPFS for metadata (Metaplex-compatible format)
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
import { uploadToIPFS, uploadMetadataToIPFS } from '../utils/ipfsUpload';

/**
 * Create a single SPL NFT (0 decimals, supply 1)
 * @param {Connection} connection - Solana connection
 * @param {string} ownerAddress - Owner public key (base58)
 * @param {Function} signTransaction - Wallet signTransaction
 * @param {object} params - { name, symbol, description, imageFile, attributes? }
 */
export async function createSPLNFT(connection, ownerAddress, signTransaction, params) {
  const { name, symbol, description, imageFile, attributes = [] } = params;
  const owner = new PublicKey(ownerAddress);

  if (!name || !symbol || !imageFile) {
    throw new Error('Name, symbol, and image are required');
  }

  // 1. Upload image to IPFS
  const imageResult = await uploadToIPFS(imageFile);
  const imageUri = imageResult?.url || imageResult?.gatewayUrls?.[0] || (imageResult?.hash ? `https://ipfs.io/ipfs/${imageResult.hash}` : null);
  if (!imageUri) throw new Error('Failed to upload image');

  // 2. Build metadata (Metaplex-compatible)
  const metadata = {
    name,
    symbol,
    description: description || '',
    image: imageUri,
    attributes: Array.isArray(attributes) ? attributes.filter(a => a?.trait_type && a?.value != null) : [],
  };
  const metaResult = await uploadMetadataToIPFS(metadata);
  const metadataUri = metaResult?.url || metaResult?.gatewayUrls?.[0] || (metaResult?.hash ? `https://ipfs.io/ipfs/${metaResult.hash}` : null);
  if (!metadataUri) throw new Error('Failed to upload metadata');

  // 3. Create mint (decimals=0 for NFT)
  const mintKeypair = Keypair.generate();
  const lamports = await getMinimumBalanceForRentExemptMint(connection);

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
      0, // decimals = 0 for NFT
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
      1, // supply = 1 for NFT
      [],
      TOKEN_PROGRAM_ID
    ),
    // Freeze mint authority so no more can be minted (optional, makes it immutable)
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

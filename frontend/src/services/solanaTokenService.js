/**
 * Solana SPL Token Service - Industry-standard with Metaplex metadata
 * Creates SPL tokens with R2-hosted metadata (name, symbol, logo URI)
 * Security: input validation, simulation before send
 */
import {
  Keypair,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
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
import { formatSolanaRpcError } from '../config/solanaConfig';
import {
  assertSolanaPayerFunded,
  formatSolanaSimulationError,
  simulateLegacyTransaction,
  SOLANA_DEPLOY_RENT_LAMPORTS,
} from './solanaDeployTx';

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

function resolveSplAuthorities(params, supplyAmount) {
  const renounceOwnership = Boolean(params.renounceOwnership);
  const renounceMint = renounceOwnership || Boolean(params.renounceMint);
  const enableFreezing = !renounceOwnership && (Boolean(params.enableFreezing) || Boolean(params.enableBlacklist));
  const immutableMetadata = renounceOwnership || Boolean(params.immutableMetadata);
  if (renounceMint && supplyAmount <= 0n) {
    throw new Error('Set an initial supply before removing mint authority, or keep mint authority to mint later.');
  }
  return { renounceMint, enableFreezing, immutableMetadata };
}

/**
 * Create SPL token with Metaplex metadata (R2)
 * @param {Connection} connection
 * @param {string} ownerAddress
 * @param {Function} signTransaction
 * @param {object} params - { name, symbol, decimals, initialSupply, logoFile?, network?,
 *   renounceMint?, enableFreezing?, enableBlacklist?, immutableMetadata?, renounceOwnership? }
 */
export async function createSPLToken(connection, ownerAddress, signTransaction, params) {
  validateTokenParams(params);
  const { name, symbol, decimals = 9, initialSupply = '0', logoFile, network = 'devnet' } = params;
  const owner = new PublicKey(ownerAddress);
  const supplyAmount = BigInt(Math.floor(parseFloat(String(initialSupply || '0')) * Math.pow(10, Number(decimals))));
  const authorities = resolveSplAuthorities(params, supplyAmount);
  try {
    await assertSolanaPayerFunded(connection, owner, network);
  } catch (error) {
    throw new Error(error?.message?.includes('SOL') ? error.message : formatSolanaRpcError(error, network));
  }

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
  let lamports;
  try {
    lamports = await getMinimumBalanceForRentExemptMint(connection);
  } catch (error) {
    throw new Error(formatSolanaRpcError(error, network));
  }
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
      authorities.enableFreezing ? owner : null,
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
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
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
          isMutable: !authorities.immutableMetadata,
          collectionDetails: null,
        },
      }
    )
  );

  if (authorities.renounceMint) {
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
  }

  transaction.feePayer = owner;
  let sim;
  try {
    sim = await simulateLegacyTransaction(connection, transaction, [mintKeypair]);
  } catch (error) {
    throw new Error(formatSolanaRpcError(error, network));
  }
  if (sim.value.err) {
    throw new Error(formatSolanaSimulationError(sim, network));
  }
  transaction.sign(mintKeypair);

  const signed = await signTransaction(transaction);
  try {
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
      authorities: {
        mintAuthority: authorities.renounceMint ? null : ownerAddress,
        freezeAuthority: authorities.enableFreezing ? ownerAddress : null,
        metadataMutable: !authorities.immutableMetadata,
      },
    };
  } catch (error) {
    throw new Error(formatSolanaRpcError(error, network));
  }
}

export function estimateCreateTokenCost() {
  return SOLANA_DEPLOY_RENT_LAMPORTS;
}

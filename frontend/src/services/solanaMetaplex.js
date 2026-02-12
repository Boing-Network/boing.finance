/**
 * Solana Metaplex Token Metadata - PDA derivation and constants
 * Industry-standard metadata for SPL tokens and NFTs
 */
import { PublicKey } from '@solana/web3.js';

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// Browser-safe seed for PDA (Buffer is Node-only; TextEncoder is native in browsers)
const METADATA_SEED = new TextEncoder().encode('metadata');

/**
 * Derive metadata PDA for a mint (Metaplex standard)
 * @param {PublicKey} mint - Token mint public key
 * @returns {[PublicKey, number]}
 */
export function getMetadataPDA(mint) {
  return PublicKey.findProgramAddressSync(
    [METADATA_SEED, TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  );
}

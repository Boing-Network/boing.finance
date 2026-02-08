/**
 * Solana Metaplex Token Metadata - PDA derivation and constants
 * Industry-standard metadata for SPL tokens and NFTs
 */
import { PublicKey } from '@solana/web3.js';

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

/**
 * Derive metadata PDA for a mint (Metaplex standard)
 * @param {PublicKey} mint - Token mint public key
 * @returns {[PublicKey, number]}
 */
export function getMetadataPDA(mint) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  );
}

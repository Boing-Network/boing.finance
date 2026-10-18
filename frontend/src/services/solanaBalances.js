/** SOL + SPL balances of a Solana wallet on mainnet (for Bridge → My Tokens). */
import { getSolanaRpcEndpoints } from '../config/solanaConfig';

const TOKEN_PROGRAM = 'TokenkegQfeYyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAs6EPSAc4p46vePMaBk6uRu';
export const SOL_NATIVE_ADDRESS = '11111111111111111111111111111111';

let connPromise = null;
async function mainnetConnection() {
  if (!connPromise) {
    connPromise = (async () => {
      const { Connection } = await import('@solana/web3.js');
      const url = getSolanaRpcEndpoints('mainnet')[0];
      return new Connection(url, 'confirmed');
    })();
  }
  return connPromise;
}

export async function getSolanaMainnetConnection() {
  return mainnetConnection();
}

/** @returns {Promise<Array<{ address: string, amount: string, decimals: number }>>} */
export async function fetchSolanaBalances(owner) {
  const { PublicKey } = await import('@solana/web3.js');
  const conn = await mainnetConnection();
  const pk = new PublicKey(owner);
  const [lamports, ...programs] = await Promise.all([
    conn.getBalance(pk),
    ...[TOKEN_PROGRAM, TOKEN_2022_PROGRAM].map((p) =>
      conn.getParsedTokenAccountsByOwner(pk, { programId: new PublicKey(p) }).catch(() => ({ value: [] }))
    ),
  ]);
  const out = [];
  if (lamports > 0) out.push({ address: SOL_NATIVE_ADDRESS, amount: String(lamports), decimals: 9 });
  const byMint = new Map();
  for (const res of programs) {
    for (const acc of res.value || []) {
      const info = acc.account?.data?.parsed?.info;
      const amt = info?.tokenAmount;
      if (!info?.mint || !amt?.amount || amt.amount === '0') continue;
      const prev = byMint.get(info.mint);
      const sum = (prev ? BigInt(prev.amount) : 0n) + BigInt(amt.amount);
      byMint.set(info.mint, { address: info.mint, amount: sum.toString(), decimals: Number(amt.decimals) });
    }
  }
  return out.concat([...byMint.values()]);
}

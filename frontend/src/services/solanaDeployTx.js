import { TransactionMessage, VersionedTransaction } from '@solana/web3.js';

export const SOLANA_DEPLOY_RENT_LAMPORTS = Math.ceil(
  0.00144 * 1e9 + // mint
  0.00203928 * 1e9 + // ATA
  0.01 * 1e9 + // Metaplex metadata
  10_000 // tx fee
);

function clusterLabel(network = 'devnet') {
  return network === 'mainnet' ? 'Mainnet' : 'Devnet';
}

export async function assertSolanaPayerFunded(connection, owner, network = 'devnet', lamportsNeeded = SOLANA_DEPLOY_RENT_LAMPORTS) {
  let info;
  try {
    info = await connection.getAccountInfo(owner, 'confirmed');
  } catch (error) {
    throw error;
  }
  const cluster = clusterLabel(network);
  if (!info) {
    throw new Error(
      `This wallet has no SOL on Solana ${cluster}. Fund ${owner.toBase58()} on ${cluster}, or switch Mainnet/Devnet in the wallet panel.`
    );
  }
  if (info.lamports < lamportsNeeded) {
    const have = (info.lamports / 1e9).toFixed(4);
    const need = (lamportsNeeded / 1e9).toFixed(4);
    throw new Error(
      `Not enough SOL on ${cluster} to pay rent. Need about ${need} SOL; this wallet has ${have} SOL.`
    );
  }
}

export function formatSolanaSimulationError(sim, network = 'devnet') {
  const err = sim?.value?.err;
  const errText = typeof err === 'string' ? err : JSON.stringify(err);
  const logs = Array.isArray(sim?.value?.logs) ? sim.value.logs : [];
  const hint = logs.filter((line) => /failed|error|AccountNotFound|insufficient/i.test(line)).slice(-4);
  if (err === 'AccountNotFound' || /AccountNotFound/.test(errText)) {
    return `Simulation failed: the fee payer was not found on Solana ${clusterLabel(network)}. This wallet needs SOL on that cluster (check Mainnet vs Devnet).`;
  }
  if (hint.length) {
    return `Simulation failed: ${errText}. ${hint.join(' ')}`;
  }
  return `Simulation failed: ${errText}`;
}

/**
 * Simulate a legacy Transaction via VersionedTransaction so we can pass
 * sigVerify: false. web3.js rejects a config object on the legacy overload.
 */
export async function simulateLegacyTransaction(connection, transaction, extraSigners = []) {
  const latest = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = latest.blockhash;
  const message = new TransactionMessage({
    payerKey: transaction.feePayer,
    recentBlockhash: latest.blockhash,
    instructions: transaction.instructions,
  }).compileToV0Message();
  const vtx = new VersionedTransaction(message);
  if (extraSigners.length) {
    vtx.sign(extraSigners);
  }
  return connection.simulateTransaction(vtx, {
    sigVerify: false,
    replaceRecentBlockhash: true,
    commitment: 'confirmed',
  });
}

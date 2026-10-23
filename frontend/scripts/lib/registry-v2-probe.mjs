/**
 * Linked NFT↔token registry v2 checks shared by the testnet check scripts.
 *
 * `probeOutsiderClaims` makes a THROWAWAY Ed25519 key in memory (never printed, never stored), and asks the node
 * to dry-run, as that account, `claim_asset(asset)` for each asset and `register_link(collection, token)`.
 * Registry v2 must reject all of them: the assets are claimed by their creator at deploy, and only an asset's
 * recorded deployer may claim it. The node only simulates as a sender that exists, so the throwaway account is
 * first sent a small amount of testnet BOING by the check's funder (`fundAccount`). With `submit`, the throwaway
 * also signs and submits its `claim_asset(token)` so the rejection is recorded on chain as a failed receipt.
 */
import { randomBytes } from 'node:crypto';
import {
  buildContractCallTransaction,
  buildTransferTransaction,
  encodeLinkedNftTokenClaimAssetCalldataHex,
  hexToBytes,
  signTransactionInputForClient,
  submitSignedTransactionIdempotent,
  transactionIdFromSignedTransactionHex,
  encodeLinkedNftTokenGetAssetClaimerCalldataHex,
  encodeLinkedNftTokenGetAssetDeployerCalldataHex,
  encodeLinkedNftTokenRegisterLinkCalldataHex,
  senderHexFromSecretKey,
} from '@boing-network/boing-sdk';

export async function throwawayAccount() {
  const secret = new Uint8Array(randomBytes(32));
  const hex = (await senderHexFromSecretKey(secret)).toLowerCase();
  return { secret, hex };
}

const lastWord = (rd) => {
  const raw = String(rd || '').replace(/^0x/i, '');
  return raw.length >= 64 ? `0x${raw.slice(-64).toLowerCase()}` : null;
};

export async function readClaimer(client, registry, asset) {
  const s = await client.simulateContractCall(registry, encodeLinkedNftTokenGetAssetClaimerCalldataHex(asset));
  return lastWord(s.return_data);
}

export async function readDeployerRecord(client, registry, asset) {
  const s = await client.simulateContractCall(registry, encodeLinkedNftTokenGetAssetDeployerCalldataHex(asset));
  return lastWord(s.return_data);
}

async function waitReceipt(client, id) {
  for (let i = 0; i < 60; i++) {
    const rc = await client.getTransactionReceipt(id);
    if (rc) return rc;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`no receipt for ${id} after 120 s`);
}

/** Transfer `amount` (raw units) from the funder to `toHex`; waits for inclusion. Returns the tx id. */
export async function fundAccount(client, { funderSecret, funderHex, toHex, amount }) {
  const nonce = BigInt((await client.getAccount(funderHex))?.nonce ?? 0);
  const tx = buildTransferTransaction({ nonce, senderHex: funderHex, toHex, amount, accessList: { read: [funderHex, toHex], write: [funderHex, toHex] } });
  const signed = await signTransactionInputForClient(client, tx, funderSecret);
  const id = transactionIdFromSignedTransactionHex(signed);
  await submitSignedTransactionIdempotent(client, signed);
  const rc = await waitReceipt(client, id);
  if (rc.success === false) throw new Error(`funding transfer failed: ${rc.error || ''}`);
  return id;
}

/**
 * @param {import('@boing-network/boing-sdk').BoingClient} client
 * @param {{ registry: string, collection?: string|null, token?: string|null, funder?: { secret: Uint8Array, hex: string },
 *   fundAmount?: bigint, submit?: boolean }} opts
 * @returns {Promise<{ outsider: string, fundTx: string|null, results: { label: string, success: boolean, error: string | null }[],
 *   onchain: { txId: string, success: boolean, error: string|null, block: number|null } | null, allRejected: boolean }>}
 */
export async function probeOutsiderClaims(client, { registry, collection = null, token = null, funder = null, fundAmount = 10n ** 18n, submit = false }) {
  const who = await throwawayAccount();
  let fundTx = null;
  if (funder) fundTx = await fundAccount(client, { funderSecret: funder.secret, funderHex: funder.hex, toHex: who.hex, amount: fundAmount });
  const calls = [];
  if (collection) calls.push(['claim_asset(collection)', encodeLinkedNftTokenClaimAssetCalldataHex(collection)]);
  if (token) calls.push(['claim_asset(token)', encodeLinkedNftTokenClaimAssetCalldataHex(token)]);
  if (collection && token) calls.push(['register_link(collection, token)', encodeLinkedNftTokenRegisterLinkCalldataHex(collection, token)]);
  const results = [];
  for (const [label, calldata] of calls) {
    const s = await client.simulateContractCall(registry, calldata, { senderHex: who.hex });
    results.push({ label, success: Boolean(s.success), error: s.error || null });
  }
  let onchain = null;
  const target = token || collection;
  if (submit && target) {
    const nonce = BigInt((await client.getAccount(who.hex))?.nonce ?? 0);
    const acl = [who.hex, registry.toLowerCase(), target];
    const tx = buildContractCallTransaction({
      nonce,
      senderHex: who.hex,
      contractHex: registry,
      calldata: hexToBytes(encodeLinkedNftTokenClaimAssetCalldataHex(target)),
      accessList: { read: acl, write: acl },
    });
    const signed = await signTransactionInputForClient(client, tx, who.secret);
    const txId = transactionIdFromSignedTransactionHex(signed);
    const sim = await client.simulateTransaction(signed);
    results.push({ label: `signed claim_asset(${token ? 'token' : 'collection'}) simulate`, success: Boolean(sim.success), error: sim.error || null });
    await submitSignedTransactionIdempotent(client, signed);
    const rc = await waitReceipt(client, txId);
    onchain = { txId, success: rc.success !== false, error: rc.error || null, block: rc.block_height ?? null };
  }
  const allRejected = results.every((r) => !r.success) && (!onchain || !onchain.success);
  return { outsider: who.hex, fundTx, results, onchain, allRejected };
}

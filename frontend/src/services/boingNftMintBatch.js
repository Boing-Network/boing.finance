import {
  encodeReferenceMintBatchCalldata,
  MAX_REFERENCE_NFT_MINT_BATCH,
  referenceNftTokenIdWordFromU64,
} from 'boing-sdk';
import { boingExpressContractCallSignSimulateSubmit } from './boingExpressNativeTx';
import { pickExpressProviderForDeploy } from './boingNativeLaunchWizardDeploy';
import { prepareOnChainNftMintRows, publishNftTokenMetadataDocuments } from '../utils/nftCollectionMetadata';
import { boingWalletMissingMessage } from '../utils/boingWalletDiscovery';

function bytesToHex(bytes) {
  let s = '0x';
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, '0');
  }
  return s;
}

export function encodeReferenceMintBatchCalldataHex(toHexAccount32, tokenIdsHex32, metadataHashesHex32) {
  return bytesToHex(encodeReferenceMintBatchCalldata(toHexAccount32, tokenIdsHex32, metadataHashesHex32));
}

/**
 * Safe chunk size for reference NFT `mint_batch`.
 * Template v3 caps at 500 (40M gas). Default 50 reduces OutOfGas risk on older nodes and keeps
 * Express approval calldata modest; override with REACT_APP_BOING_NFT_MINT_BATCH_CHUNK.
 */
export function resolveNftMintBatchChunkSize() {
  const raw =
    (typeof process !== 'undefined' &&
      process.env &&
      (process.env.REACT_APP_BOING_NFT_MINT_BATCH_CHUNK ||
        process.env.BOING_NFT_MINT_BATCH_CHUNK ||
        process.env.VITE_BOING_NFT_MINT_BATCH_CHUNK)) ||
    '';
  const n = Number.parseInt(String(raw).trim(), 10);
  if (Number.isFinite(n) && n >= 1) {
    return Math.min(MAX_REFERENCE_NFT_MINT_BATCH, Math.trunc(n));
  }
  return 50;
}

/**
 * Split prepared mint rows into chunks of `chunkSize` (1..MAX_REFERENCE_NFT_MINT_BATCH).
 * @template T
 * @param {T[]} rows
 * @param {number} [chunkSize]
 * @returns {T[][]}
 */
export function chunkNftMintRows(rows, chunkSize = resolveNftMintBatchChunkSize()) {
  const size = Math.max(1, Math.min(MAX_REFERENCE_NFT_MINT_BATCH, Math.trunc(Number(chunkSize) || 50)));
  const list = Array.isArray(rows) ? rows : [];
  const out = [];
  for (let i = 0; i < list.length; i += size) {
    out.push(list.slice(i, i + size));
  }
  return out;
}

/**
 * Submit one `mint_batch` ContractCall via Express (fresh app-RPC nonce + wait for inclusion).
 */
export async function submitReferenceNftMintBatch({
  getWalletProvider,
  collectionAccountId,
  recipientHex,
  rows,
  senderHex,
  signal,
}) {
  const contract = String(collectionAccountId || '').trim();
  const to = String(recipientHex || senderHex || '').trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(contract)) {
    throw new Error('Collection AccountId is not a 32-byte hex id.');
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(to)) {
    throw new Error('Mint recipient must be a 32-byte AccountId.');
  }
  if (!Array.isArray(rows) || rows.length < 1) {
    throw new Error('mint_batch requires at least one token row.');
  }
  if (rows.length > MAX_REFERENCE_NFT_MINT_BATCH) {
    throw new Error(`mint_batch chunk exceeds n≤${MAX_REFERENCE_NFT_MINT_BATCH}.`);
  }

  const p = pickExpressProviderForDeploy(getWalletProvider);
  if (!p) {
    throw new Error(boingWalletMissingMessage());
  }

  const tokenIdsHex32 = rows.map((r) => referenceNftTokenIdWordFromU64(BigInt(r.tokenId)));
  const metadataHashesHex32 = rows.map((r) => String(r.metadataHash || '').trim());
  for (const h of metadataHashesHex32) {
    if (!/^0x[0-9a-fA-F]{64}$/.test(h)) {
      throw new Error('Each token needs a 32-byte metadata hash.');
    }
  }

  const calldata = encodeReferenceMintBatchCalldataHex(to, tokenIdsHex32, metadataHashesHex32);
  const sender = String(senderHex || to).trim();

  return boingExpressContractCallSignSimulateSubmit(
    p,
    {
      type: 'contract_call',
      contract,
      calldata,
      access_list: {
        read: [sender, contract],
        write: [sender, contract],
      },
    },
    {
      senderHex: sender,
      refreshNonce: true,
      waitForInclusion: true,
      retryOnInvalidNonce: true,
      returnSubmitMeta: true,
      signal,
    }
  );
}

/**
 * After collection deploy: optionally publish per-token JSON, then chunked `mint_batch` for the full set.
 *
 * @param {{
 *   getWalletProvider: Function,
 *   collectionAccountId: string,
 *   recipientHex: string,
 *   tokens?: unknown[],
 *   preparedRows?: { tokenId: number, tokenDoc: object, metadataHash: string }[],
 *   collectionName?: string,
 *   chunkSize?: number,
 *   publishTokenJson?: boolean,
 *   tokenJsonMax?: number,
 *   signal?: AbortSignal,
 *   onProgress?: (p: object) => void,
 * }} opts
 */
export async function mintReferenceNftSetChunked(opts) {
  const {
    getWalletProvider,
    collectionAccountId,
    recipientHex,
    tokens,
    preparedRows,
    collectionName = '',
    chunkSize = resolveNftMintBatchChunkSize(),
    publishTokenJson = true,
    tokenJsonMax = 200,
    signal,
    onProgress,
  } = opts;

  const rows = Array.isArray(preparedRows) && preparedRows.length
    ? preparedRows
    : prepareOnChainNftMintRows(tokens, { collectionName });
  if (rows.length === 0) {
    return { ok: true, skipped: true, total: 0, batches: [], failedBatchIndexes: [] };
  }

  const report = (partial) => {
    onProgress?.({
      phase: partial.phase || 'mint',
      total: rows.length,
      minted: partial.minted ?? 0,
      batchIndex: partial.batchIndex ?? 0,
      batchCount: partial.batchCount ?? 0,
      message: partial.message || '',
      error: partial.error || null,
      failedBatchIndexes: partial.failedBatchIndexes || [],
      tokenJson: partial.tokenJson || null,
    });
  };

  let tokenJson = null;
  if (publishTokenJson && rows.length <= tokenJsonMax) {
    report({ phase: 'token_json', message: `Uploading per-token metadata (0/${rows.length})…` });
    tokenJson = await publishNftTokenMetadataDocuments(rows, {
      concurrency: 6,
      onProgress: (p) => {
        report({
          phase: 'token_json',
          tokenJson: p,
          message: `Uploading per-token metadata (${p.done}/${p.total})…`,
        });
      },
    });
  } else if (publishTokenJson && rows.length > tokenJsonMax) {
    report({
      phase: 'token_json',
      message: `Skipping per-token JSON upload for ${rows.length} tokens (use collection catalog).`,
      tokenJson: { skipped: true, reason: 'over_max', max: tokenJsonMax },
    });
  }

  const chunks = chunkNftMintRows(rows, chunkSize);
  const batches = [];
  const failedBatchIndexes = [];
  let minted = 0;

  for (let i = 0; i < chunks.length; i += 1) {
    if (signal?.aborted) {
      throw new Error('Mint aborted.');
    }
    const chunk = chunks[i];
    report({
      phase: 'mint',
      minted,
      batchIndex: i + 1,
      batchCount: chunks.length,
      message: `Minting batch ${i + 1} of ${chunks.length} (${chunk.length} tokens)…`,
      failedBatchIndexes: [...failedBatchIndexes],
      tokenJson,
    });
    try {
      const result = await submitReferenceNftMintBatch({
        getWalletProvider,
        collectionAccountId,
        recipientHex,
        rows: chunk,
        senderHex: recipientHex,
        signal,
      });
      batches.push({
        index: i,
        ok: true,
        tokenIds: chunk.map((r) => r.tokenId),
        txHash: result?.txHash ?? result,
        boingTxIdHex: result?.boingTxIdHex ?? null,
      });
      minted += chunk.length;
      report({
        phase: 'mint',
        minted,
        batchIndex: i + 1,
        batchCount: chunks.length,
        message: `Batch ${i + 1} of ${chunks.length} included.`,
        failedBatchIndexes: [...failedBatchIndexes],
        tokenJson,
      });
    } catch (e) {
      failedBatchIndexes.push(i);
      batches.push({
        index: i,
        ok: false,
        tokenIds: chunk.map((r) => r.tokenId),
        error: e?.message || String(e),
      });
      report({
        phase: 'mint',
        minted,
        batchIndex: i + 1,
        batchCount: chunks.length,
        message: `Batch ${i + 1} failed.`,
        error: e?.message || String(e),
        failedBatchIndexes: [...failedBatchIndexes],
        tokenJson,
      });
      // Stop on first failure so the user can retry from that batch without overlapping ids.
      break;
    }
  }

  const ok = failedBatchIndexes.length === 0 && minted === rows.length;
  return {
    ok,
    total: rows.length,
    minted,
    chunkSize,
    batches,
    failedBatchIndexes,
    remainingRows: failedBatchIndexes.length
      ? rows.slice(minted)
      : [],
    tokenJson,
    rows,
  };
}

/**
 * Retry minting remaining rows after a partial failure (same chunking rules).
 */
export async function retryReferenceNftMintRemaining(opts) {
  const { remainingRows, ...rest } = opts;
  if (!Array.isArray(remainingRows) || remainingRows.length === 0) {
    return { ok: true, skipped: true, total: 0, batches: [], failedBatchIndexes: [] };
  }
  return mintReferenceNftSetChunked({
    ...rest,
    preparedRows: remainingRows,
    publishTokenJson: false,
  });
}

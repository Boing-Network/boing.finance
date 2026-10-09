import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import {
  LINKED_NFT_TOKEN_SCHEMA,
  buildLinkedDocumentFromPair,
  buildLinkedDocumentForAsset,
  descriptionHashHexFromLinkedNftToken,
  isLinkableAssetAddress,
  listLinksForAsset,
  removeLinkedPair,
  softGateSameDeployer,
  upsertLinkedPair,
} from '../utils/linkedNftToken';

/**
 * Mutable many-to-many NFT collection ↔ fungible token link UI (display-only MVP).
 */
export default function LinkedNftTokenPanel({
  seedCollectionId = '',
  seedTokenId = '',
  collectionLabel = '',
  tokenLabel = '',
  compact = false,
  showHubLink = true,
  title = 'Linked project',
}) {
  const { account } = useWallet();
  const [collectionId, setCollectionId] = useState(seedCollectionId || '');
  const [tokenId, setTokenId] = useState(seedTokenId || '');
  const [links, setLinks] = useState([]);

  const seed = useMemo(() => {
    if (seedCollectionId && isLinkableAssetAddress(seedCollectionId)) return { side: 'collection', id: seedCollectionId };
    if (seedTokenId && isLinkableAssetAddress(seedTokenId)) return { side: 'token', id: seedTokenId };
    return null;
  }, [seedCollectionId, seedTokenId]);

  const refresh = useCallback(() => {
    if (seed?.id) setLinks(listLinksForAsset(seed.id));
    else if (collectionId && isLinkableAssetAddress(collectionId)) setLinks(listLinksForAsset(collectionId));
    else if (tokenId && isLinkableAssetAddress(tokenId)) setLinks(listLinksForAsset(tokenId));
    else setLinks([]);
  }, [seed, collectionId, tokenId]);

  useEffect(() => {
    if (seedCollectionId) setCollectionId(seedCollectionId);
  }, [seedCollectionId]);

  useEffect(() => {
    if (seedTokenId) setTokenId(seedTokenId);
  }, [seedTokenId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  let previewWarning = null;
  if (isLinkableAssetAddress(collectionId) && isLinkableAssetAddress(tokenId)) {
    previewWarning = softGateSameDeployer({ collectionId, tokenId, linker: account });
  }

  let schemaPreview = null;
  if (isLinkableAssetAddress(collectionId) && isLinkableAssetAddress(tokenId)) {
    schemaPreview = buildLinkedDocumentFromPair(collectionId, tokenId, { linker: account });
  } else if (seed?.id) {
    schemaPreview = buildLinkedDocumentForAsset(seed.id, { linker: account });
  }

  let schemaHash = '';
  if (schemaPreview && (schemaPreview.collections?.length || schemaPreview.tokens?.length)) {
    try {
      schemaHash = descriptionHashHexFromLinkedNftToken(schemaPreview);
    } catch {
      schemaHash = '';
    }
  }

  const onSave = () => {
    try {
      const { warning } = upsertLinkedPair({
        collectionId,
        tokenId,
        linker: account,
        collectionLabel,
        tokenLabel,
      });
      if (warning) toast(warning, { icon: '⚠️', duration: 5000 });
      else toast.success('Link saved (display-only)');
      refresh();
    } catch (e) {
      toast.error(e?.message || 'Could not save link');
    }
  };

  const onUnlink = (cId, tId) => {
    removeLinkedPair(cId, tId);
    toast.success('Link removed');
    refresh();
  };

  const copyHash = () => {
    if (!schemaHash) return;
    navigator.clipboard.writeText(schemaHash).then(
      () => toast.success('Schema description_hash copied'),
      () => toast.error('Copy failed')
    );
  };

  const shellClass = compact
    ? 'rounded-xl border p-4 text-left mt-4'
    : 'rounded-2xl border p-5 sm:p-6 text-left';

  return (
    <section
      className={shellClass}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'rgba(0, 229, 255, 0.28)',
      }}
      data-tour="linked-nft-token-panel"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="text-base sm:text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Link NFT collections and fungible tokens as a mutable many-to-many pair. Display-only for now (
            <code className="text-[10px]">{LINKED_NFT_TOKEN_SCHEMA}</code>
            ) — not enforced on-chain.
          </p>
        </div>
        {showHubLink ? (
          <Link
            to="/linked-project"
            className="text-sm underline shrink-0"
            style={{ color: 'var(--finance-primary)' }}
          >
            Open Linked project →
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            NFT collection address
          </label>
          <input
            type="text"
            value={collectionId}
            onChange={(e) => setCollectionId(e.target.value.trim())}
            placeholder="0x… (Boing AccountId or EVM)"
            className="w-full px-3 py-2 rounded-lg text-sm font-mono"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
            disabled={Boolean(seedCollectionId)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Fungible token address
          </label>
          <input
            type="text"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value.trim())}
            placeholder="0x… (Boing AccountId or EVM)"
            className="w-full px-3 py-2 rounded-lg text-sm font-mono"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
            disabled={Boolean(seedTokenId)}
          />
        </div>
      </div>

      {previewWarning ? (
        <p
          className="text-xs rounded-lg border px-3 py-2 mb-3"
          style={{
            borderColor: 'rgba(245, 158, 11, 0.5)',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            color: 'var(--text-secondary)',
          }}
          role="status"
        >
          <strong style={{ color: 'var(--text-primary)' }}>Soft-gate:</strong> {previewWarning}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={onSave}
          disabled={!isLinkableAssetAddress(collectionId) || !isLinkableAssetAddress(tokenId)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--finance-green-mid)' }}
        >
          Save / update link
        </button>
        {schemaHash ? (
          <button
            type="button"
            onClick={copyHash}
            className="px-4 py-2 rounded-lg text-sm font-medium border"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            Copy schema hash
          </button>
        ) : null}
      </div>

      {links.length > 0 ? (
        <div className="space-y-2 mb-3">
          <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            Current links ({links.length}) — editable anytime
          </p>
          <ul className="space-y-2">
            {links.map((row) => (
              <li
                key={row.id}
                className="rounded-lg border px-3 py-2 text-xs font-mono break-all"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}
              >
                <div style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--text-primary)' }}>NFT</span> {row.collectionId}
                  {row.collectionLabel ? ` · ${row.collectionLabel}` : ''}
                </div>
                <div className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--text-primary)' }}>Token</span> {row.tokenId}
                  {row.tokenLabel ? ` · ${row.tokenLabel}` : ''}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onUnlink(row.collectionId, row.tokenId)}
                    className="text-xs underline"
                    style={{ color: 'var(--finance-red-light)' }}
                  >
                    Unlink
                  </button>
                  <Link
                    to={`/linked-project?collection=${encodeURIComponent(row.collectionId)}&token=${encodeURIComponent(row.tokenId)}`}
                    className="text-xs underline"
                    style={{ color: 'var(--finance-primary)' }}
                  >
                    Manage
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
          No links yet. Paste an existing peer address or deploy the other side first — 1:1 is not required.
        </p>
      )}

      {schemaPreview && (schemaPreview.collections?.length || schemaPreview.tokens?.length) ? (
        <details className="rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
          <summary className="cursor-pointer text-xs font-medium px-3 py-2" style={{ color: 'var(--text-primary)' }}>
            Schema preview ({LINKED_NFT_TOKEN_SCHEMA})
          </summary>
          <pre
            className="text-[10px] px-3 pb-3 overflow-x-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            {JSON.stringify(schemaPreview, null, 2)}
            {schemaHash ? `\n\n// description_hash\n${schemaHash}` : ''}
          </pre>
        </details>
      ) : null}
    </section>
  );
}

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import {
  buildLinkedDocumentFromPair,
  descriptionHashHexFromLinkedNftToken,
  isLinkableAssetAddress,
  softGateSameDeployer,
} from '../utils/linkedNftToken';
import {
  buildProjectPoolPath,
  claimLinkedNftTokenAsset,
  getLinkedNftTokenRegistryStatus,
  listLinkedNftTokenLinksOnChain,
  registerLinkedNftTokenPairOnChain,
  unlinkLinkedNftTokenPairOnChain,
} from '../services/linkedNftTokenRegistry';
import CompanionLinkGate from './CompanionLinkGate';
import BuilderAttestationPanel from './BuilderAttestationPanel';

/**
 * On-chain NFT ↔ token link UI: claim → register_link / unlink_at / query.
 */
export default function LinkedNftTokenPanel({
  seedCollectionId = '',
  seedTokenId = '',
  collectionLabel = '',
  tokenLabel = '',
  compact = false,
  showHubLink = true,
  title = 'Companions',
}) {
  const { account, getWalletProvider, walletType, isConnected } = useWallet();
  const dexIntegration = useBoingNativeDexIntegration();
  const defaults = dexIntegration?.defaults || null;
  const endUser = defaults?.endUser || defaults?.end_user || null;
  const networkInfo = defaults?.networkInfo || null;

  const [collectionId, setCollectionId] = useState(seedCollectionId || '');
  const [tokenId, setTokenId] = useState(seedTokenId || '');
  const [busy, setBusy] = useState(false);
  const [ackSoftGate, setAckSoftGate] = useState(false);
  const [lastTx, setLastTx] = useState(null);
  const [links, setLinks] = useState([]);
  const [listError, setListError] = useState('');

  const status = useMemo(
    () => getLinkedNftTokenRegistryStatus({ endUser, networkInfo }),
    [endUser, networkInfo]
  );

  useEffect(() => {
    if (seedCollectionId) setCollectionId(seedCollectionId);
  }, [seedCollectionId]);

  useEffect(() => {
    if (seedTokenId) setTokenId(seedTokenId);
  }, [seedTokenId]);

  const previewWarning = useMemo(() => {
    if (!isLinkableAssetAddress(collectionId) || !isLinkableAssetAddress(tokenId)) return null;
    return softGateSameDeployer({ collectionId, tokenId, linker: account });
  }, [collectionId, tokenId, account]);

  const schemaPreview = useMemo(() => {
    if (!isLinkableAssetAddress(collectionId) || !isLinkableAssetAddress(tokenId)) return null;
    return buildLinkedDocumentFromPair(collectionId, tokenId, { linker: account });
  }, [collectionId, tokenId, account]);

  const schemaHash = useMemo(() => {
    if (!schemaPreview) return '';
    try {
      return descriptionHashHexFromLinkedNftToken(schemaPreview);
    } catch {
      return '';
    }
  }, [schemaPreview]);

  const refreshLinks = useCallback(async () => {
    if (!status.canRead) {
      setLinks([]);
      setListError('');
      return;
    }
    const seed =
      (seedCollectionId && isLinkableAssetAddress(seedCollectionId) && seedCollectionId) ||
      (seedTokenId && isLinkableAssetAddress(seedTokenId) && seedTokenId) ||
      null;
    const listed = await listLinkedNftTokenLinksOnChain({
      endUser,
      networkInfo,
      origin: account || null,
      filterCollectionId:
        seedCollectionId && isLinkableAssetAddress(seedCollectionId) ? seedCollectionId : null,
      filterTokenId: seedTokenId && isLinkableAssetAddress(seedTokenId) ? seedTokenId : null,
    });
    if (!listed.ok) {
      // If filters empty, still try unfiltered for hub
      if (!seed) {
        const all = await listLinkedNftTokenLinksOnChain({
          endUser,
          networkInfo,
          origin: account || null,
        });
        if (all.ok) {
          setLinks(all.links);
          setListError('');
          return;
        }
        setLinks([]);
        setListError(all.message || listed.message || 'Could not query registry');
        return;
      }
      setLinks([]);
      setListError(listed.message || 'Could not query registry');
      return;
    }
    setLinks(listed.links);
    setListError('');
  }, [status.canRead, endUser, networkInfo, account, seedCollectionId, seedTokenId]);

  useEffect(() => {
    void refreshLinks();
  }, [refreshLinks]);

  const expressOk = isConnected && walletType === 'boingExpress';

  const run = async (fn, okMsg) => {
    setBusy(true);
    try {
      const result = await fn();
      if (!result.ok) {
        if (result.code === 'soft_gate') {
          toast(result.message, { icon: '⚠️', duration: 6000 });
          return;
        }
        toast.error(result.message || 'Registry call failed');
        return;
      }
      if (result.txHash) setLastTx(result.txHash);
      else if (result.txHashes?.length) setLastTx(result.txHashes[result.txHashes.length - 1]);
      if (result.softGateWarning) toast(result.softGateWarning, { icon: '⚠️' });
      toast.success(okMsg);
      await refreshLinks();
    } finally {
      setBusy(false);
    }
  };

  const onClaimCollection = () =>
    run(
      () =>
        claimLinkedNftTokenAsset({
          getWalletProvider,
          assetId: collectionId,
          linker: account,
          endUser,
          networkInfo,
        }),
      'Collection claimed'
    );

  const onClaimToken = () =>
    run(
      () =>
        claimLinkedNftTokenAsset({
          getWalletProvider,
          assetId: tokenId,
          linker: account,
          endUser,
          networkInfo,
        }),
      'Token claimed'
    );

  const onRegister = () =>
    run(
      () =>
        registerLinkedNftTokenPairOnChain({
          getWalletProvider,
          collectionId,
          tokenId,
          linker: account,
          endUser,
          networkInfo,
          acknowledgeSoftGate: ackSoftGate || !previewWarning,
        }),
      'Companions linked'
    );

  const onUnlinkPair = () =>
    run(
      () =>
        unlinkLinkedNftTokenPairOnChain({
          getWalletProvider,
          collectionId,
          tokenId,
          linker: account,
          endUser,
          networkInfo,
        }),
      'Link unlinked'
    );

  const onUnlinkIndex = (index) =>
    run(
      () =>
        unlinkLinkedNftTokenPairOnChain({
          getWalletProvider,
          index,
          linker: account,
          endUser,
          networkInfo,
        }),
      `Unlinked slot #${index}`
    );

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
            Link a collection and a token as companions, or unlink a pair. Starting fresh? Use Project pack.
          </p>
        </div>
        {showHubLink ? (
          <Link
            to="/project-pack"
            className="text-sm underline shrink-0"
            style={{ color: 'var(--finance-primary)' }}
          >
            Project pack →
          </Link>
        ) : null}
      </div>

      <div
        className="text-xs rounded-lg border px-3 py-2 mb-3"
        style={{
          borderColor:
            status.code === 'ready' ? 'rgba(16, 185, 129, 0.45)' : 'rgba(245, 158, 11, 0.5)',
          backgroundColor:
            status.code === 'ready' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
          color: 'var(--text-secondary)',
        }}
        role="status"
      >
        <strong style={{ color: 'var(--text-primary)' }}>
          {status.code === 'ready' ? 'Ready to link' : 'Not available yet'}
        </strong>
        {status.code === 'ready'
          ? ' — claim each side if needed, then register companions.'
          : ' — companion linking is not set up on this network yet.'}
        {collectionLabel || tokenLabel ? (
          <span className="block mt-1">
            {collectionLabel ? `Collection: ${collectionLabel}. ` : ''}
            {tokenLabel ? `Token: ${tokenLabel}.` : ''}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Collection id
          </label>
          <input
            type="text"
            value={collectionId}
            onChange={(e) => setCollectionId(e.target.value.trim())}
            placeholder="0x… (32-byte)"
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
            Token id
          </label>
          <input
            type="text"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value.trim())}
            placeholder="0x… (32-byte)"
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
        <div
          className="text-xs rounded-lg border px-3 py-2 mb-3"
          style={{
            borderColor: 'rgba(245, 158, 11, 0.5)',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            color: 'var(--text-secondary)',
          }}
        >
          <p>
            <strong style={{ color: 'var(--text-primary)' }}>Note:</strong> {previewWarning}
          </p>
          <label className="flex items-start gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 shrink-0"
              checked={ackSoftGate}
              onChange={(e) => setAckSoftGate(e.target.checked)}
            />
            <span>I understand — continue linking anyway.</span>
          </label>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={onClaimCollection}
          disabled={busy || !status.canWrite || !expressOk || !isLinkableAssetAddress(collectionId)}
          className="px-3 py-2 rounded-lg text-sm font-medium border disabled:opacity-50"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          Claim collection
        </button>
        <button
          type="button"
          onClick={onClaimToken}
          disabled={busy || !status.canWrite || !expressOk || !isLinkableAssetAddress(tokenId)}
          className="px-3 py-2 rounded-lg text-sm font-medium border disabled:opacity-50"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          Claim token
        </button>
        <button
          type="button"
          onClick={onRegister}
          disabled={
            busy ||
            !status.canWrite ||
            !expressOk ||
            !isLinkableAssetAddress(collectionId) ||
            !isLinkableAssetAddress(tokenId) ||
            (Boolean(previewWarning) && !ackSoftGate)
          }
          className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--finance-green-mid)' }}
        >
          {busy ? 'Linking…' : 'Link companions'}
        </button>
        <button
          type="button"
          onClick={onUnlinkPair}
          disabled={
            busy ||
            !status.canWrite ||
            !expressOk ||
            !isLinkableAssetAddress(collectionId) ||
            !isLinkableAssetAddress(tokenId)
          }
          className="px-4 py-2 rounded-lg text-sm font-medium border disabled:opacity-50"
          style={{ borderColor: 'var(--border-color)', color: 'var(--finance-red-light)' }}
        >
          Unlink
        </button>
        <button
          type="button"
          onClick={() => void refreshLinks()}
          disabled={busy || !status.canRead}
          className="px-3 py-2 rounded-lg text-sm font-medium border disabled:opacity-50"
          style={{ borderColor: 'var(--border-color)', color: 'var(--finance-primary)' }}
        >
          Refresh
        </button>
      </div>

      {!expressOk ? (
        <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
          Connect Boing Express to link or unlink companions.
        </p>
      ) : null}

      {lastTx ? (
        <p className="text-xs font-mono break-all mb-3" style={{ color: 'var(--text-secondary)' }}>
          Last tx: {lastTx}
        </p>
      ) : null}

      {listError ? (
        <p className="text-xs mb-3" style={{ color: 'var(--finance-gold)' }}>
          Could not load companions right now. You can still link a pair below.
        </p>
      ) : null}

      {isLinkableAssetAddress(collectionId) && isLinkableAssetAddress(tokenId) ? (
        <div className="mb-3 space-y-3">
          <CompanionLinkGate
            collectionId={collectionId}
            tokenId={tokenId}
            actionLabel="Add a pool"
            unlockedHref={buildProjectPoolPath({ collectionId, tokenId })}
            compact
          />
          <BuilderAttestationPanel collectionId={collectionId} tokenId={tokenId} compact />
        </div>
      ) : null}

      {links.length > 0 ? (
        <ul className="space-y-2 mb-3">
          {links.map((row) => (
            <li
              key={`${row.index}-${row.collectionId}-${row.tokenId}`}
              className="rounded-lg border px-3 py-2 text-xs font-mono break-all"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}
            >
              <div style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--text-primary)' }}>Linked pair</span>{' '}
                <span className="opacity-70">#{row.index}</span>
              </div>
              <div className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                Collection {row.collectionId}
              </div>
              <div className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                Token {row.tokenId}
              </div>
              <div className="mt-2 flex flex-wrap gap-3">
                <Link
                  to={buildProjectPoolPath({
                    collectionId: row.collectionId,
                    tokenId: row.tokenId,
                  })}
                  className="text-xs underline"
                  style={{ color: 'var(--finance-primary)' }}
                >
                  Add a pool
                </Link>
                <button
                  type="button"
                  className="text-xs underline"
                  style={{ color: 'var(--finance-red-light)' }}
                  disabled={busy || !status.canWrite || !expressOk}
                  onClick={() => onUnlinkIndex(row.index)}
                >
                  Unlink
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
          No companions loaded yet. Refresh after you link a pair.
        </p>
      )}

      {schemaPreview && schemaHash ? (
        <details className="rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
          <summary className="cursor-pointer text-xs font-medium px-3 py-2" style={{ color: 'var(--text-primary)' }}>
            Advanced: optional metadata cache
          </summary>
          <pre
            className="text-[10px] px-3 pb-3 overflow-x-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            {JSON.stringify(schemaPreview, null, 2)}
            {`\n\n// description_hash (not authoritative)\n${schemaHash}`}
          </pre>
        </details>
      ) : null}
    </section>
  );
}

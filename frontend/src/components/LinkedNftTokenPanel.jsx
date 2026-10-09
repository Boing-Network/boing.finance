import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import {
  LINKED_NFT_TOKEN_SCHEMA,
  buildLinkedDocumentFromPair,
  descriptionHashHexFromLinkedNftToken,
  isLinkableAssetAddress,
  softGateSameDeployer,
} from '../utils/linkedNftToken';
import {
  getLinkedNftTokenRegistryStatus,
  registerLinkedNftTokenPairOnChain,
  unlinkLinkedNftTokenPairOnChain,
} from '../services/linkedNftTokenRegistry';

/**
 * On-chain NFT collection ↔ fungible token link UI (many-to-many, mutable).
 * Soft-gate may warn; registry reads/writes are required for an official link.
 */
export default function LinkedNftTokenPanel({
  seedCollectionId = '',
  seedTokenId = '',
  collectionLabel = '',
  tokenLabel = '',
  compact = false,
  showHubLink = true,
  title = 'Linked project (on-chain)',
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
  const [onChainPeers, setOnChainPeers] = useState([]);

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

  const refreshPeersNote = useCallback(() => {
    // Full peer listing waits on SDK list ABI + RPC helper; keep empty until ready.
    if (!status.canRead) {
      setOnChainPeers([]);
      return;
    }
    setOnChainPeers([]);
  }, [status.canRead]);

  useEffect(() => {
    refreshPeersNote();
  }, [refreshPeersNote]);

  const onRegister = async () => {
    setBusy(true);
    try {
      const result = await registerLinkedNftTokenPairOnChain({
        getWalletProvider,
        collectionId,
        tokenId,
        linker: account,
        endUser,
        networkInfo,
        acknowledgeSoftGate: ackSoftGate || !previewWarning,
      });
      if (!result.ok) {
        if (result.code === 'soft_gate') {
          toast(result.message, { icon: '⚠️', duration: 6000 });
          setAckSoftGate(false);
          return;
        }
        toast.error(result.message || 'Registry register failed');
        return;
      }
      setLastTx(result.txHash || null);
      if (result.softGateWarning) toast(result.softGateWarning, { icon: '⚠️' });
      toast.success('Link registered on-chain');
      refreshPeersNote();
    } finally {
      setBusy(false);
    }
  };

  const onUnlink = async () => {
    setBusy(true);
    try {
      const result = await unlinkLinkedNftTokenPairOnChain({
        getWalletProvider,
        collectionId,
        tokenId,
        linker: account,
        endUser,
        networkInfo,
      });
      if (!result.ok) {
        toast.error(result.message || 'Registry unlink failed');
        return;
      }
      setLastTx(result.txHash || null);
      toast.success('Link unlinked on-chain');
      refreshPeersNote();
    } finally {
      setBusy(false);
    }
  };

  const shellClass = compact
    ? 'rounded-xl border p-4 text-left mt-4'
    : 'rounded-2xl border p-5 sm:p-6 text-left';

  const expressOk = isConnected && walletType === 'boingExpress';

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
            Register NFT collections and fungible tokens as a mutable many-to-many pair on the{' '}
            <strong style={{ color: 'var(--text-primary)' }}>on-chain registry</strong>. Soft-gate prefers the
            same deployer but does not authorize the link. Schema{' '}
            <code className="text-[10px]">{LINKED_NFT_TOKEN_SCHEMA}</code> may accompany metadata.
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
        <strong style={{ color: 'var(--text-primary)' }}>Registry:</strong> {status.message}
        {status.registryId ? (
          <span className="block font-mono mt-1 break-all">{status.registryId}</span>
        ) : null}
        {collectionLabel || tokenLabel ? (
          <span className="block mt-1">
            {collectionLabel ? `Collection label: ${collectionLabel}. ` : ''}
            {tokenLabel ? `Token label: ${tokenLabel}.` : ''}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            NFT collection AccountId
          </label>
          <input
            type="text"
            value={collectionId}
            onChange={(e) => setCollectionId(e.target.value.trim())}
            placeholder="0x… (32-byte Boing AccountId)"
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
            Fungible token AccountId
          </label>
          <input
            type="text"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value.trim())}
            placeholder="0x… (32-byte Boing AccountId)"
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
            <strong style={{ color: 'var(--text-primary)' }}>Soft-gate:</strong> {previewWarning}
          </p>
          <label className="flex items-start gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 shrink-0"
              checked={ackSoftGate}
              onChange={(e) => setAckSoftGate(e.target.checked)}
            />
            <span>I understand soft-gate is advisory; submit the registry tx anyway.</span>
          </label>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 mb-4">
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
          {busy ? 'Submitting…' : 'Register on-chain'}
        </button>
        <button
          type="button"
          onClick={onUnlink}
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
          Unlink on-chain
        </button>
      </div>

      {!expressOk ? (
        <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
          Connect Boing Express on Boing testnet to submit registry transactions.
        </p>
      ) : null}

      {lastTx ? (
        <p className="text-xs font-mono break-all mb-3" style={{ color: 'var(--text-secondary)' }}>
          Last tx: {lastTx}
        </p>
      ) : null}

      {onChainPeers.length > 0 ? (
        <ul className="text-xs space-y-1 mb-3 font-mono" style={{ color: 'var(--text-secondary)' }}>
          {onChainPeers.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      ) : (
        <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
          Official peer lists load from the registry once SDK list helpers + a published registry id are
          available. Browser-only drafts are disabled.
        </p>
      )}

      {schemaPreview && schemaHash ? (
        <details className="rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
          <summary className="cursor-pointer text-xs font-medium px-3 py-2" style={{ color: 'var(--text-primary)' }}>
            Optional metadata schema preview ({LINKED_NFT_TOKEN_SCHEMA})
          </summary>
          <pre
            className="text-[10px] px-3 pb-3 overflow-x-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            {JSON.stringify(schemaPreview, null, 2)}
            {`\n\n// description_hash (metadata only — not a registry substitute)\n${schemaHash}`}
          </pre>
        </details>
      ) : null}
    </section>
  );
}

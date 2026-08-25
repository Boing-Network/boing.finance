import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { isBoingTestnetChainId, REFERENCE_NFT_COLLECTION_TEMPLATE_VERSION } from 'boing-sdk';
import { useWallet } from '../contexts/WalletContext';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import {
  computeEffectiveNativeDeployBytecode,
  executeBoingLaunchWizardDeploy,
  getBundledNativeNftCollectionBytecodeHex,
  preflightBoingLaunchWizardByKind,
} from '../services/boingNativeLaunchWizardDeploy';
import { commitReferenceNftMetadataHash } from '../services/boingNftMetadataCommit';
import { BOING_QA_PURPOSE_OPTIONS, isValidBoingQaPurpose } from '../config/boingQa';
import { tryParseEvenLengthDeployBytecodeHex } from '../utils/boingDeployBytecodeHex';
import { isPublicAssetUri } from '../utils/nftCollectionMetadata';
import {
  showBoingContractIncludedToast,
  showBoingLaunchDeploySuccessToast,
} from '../utils/boingDeploySuccessToast';
import { scheduleBoingDeployReceiptFollowup } from '../services/boingDeployReceiptFollowup';
import { buildBoingExplorerAccountUrl, buildBoingExplorerTxUrl } from '../config/boingExplorerUrls';
import { formatBoingExpressRpcError } from '../utils/boingExpressRpcError';

const DEFAULT_NFT_PURPOSE = 'nft';

/**
 * Native Boing NFT collection deploy for Create NFT review step (Boing Express + testnet).
 */
const NativeBoingNftDeploySection = forwardRef(function NativeBoingNftDeploySection(
  {
    collectionName,
    collectionSymbol,
    embedInWizard = false,
    onDeployGateChange,
    metadataUri = '',
    committedDescriptionHash = '',
    coverImageUri = '',
    onEnsureMetadataPublished,
  },
  ref
) {
  const { chainId, walletType, isConnected, getWalletProvider } = useWallet();
  const { explorerBaseUrl } = useBoingNativeDexIntegration();
  const [purpose, setPurpose] = useState(DEFAULT_NFT_PURPOSE);

  const bundledBytecode = useMemo(() => getBundledNativeNftCollectionBytecodeHex(), []);
  const hasBundled = Boolean(bundledBytecode);

  const [customBytecode, setCustomBytecode] = useState('');
  const [descriptionHash, setDescriptionHash] = useState('');
  const [qaBusy, setQaBusy] = useState(false);
  const [qaResult, setQaResult] = useState(null);
  const [lastTx, setLastTx] = useState(null);
  const [lastBoingTxId, setLastBoingTxId] = useState(null);
  const [lastDeployedAccount, setLastDeployedAccount] = useState(null);
  const [qaPoolAcknowledged, setQaPoolAcknowledged] = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);

  const effectiveBytecode = useMemo(
    () => computeEffectiveNativeDeployBytecode(customBytecode, bundledBytecode),
    [customBytecode, bundledBytecode]
  );

  const effectiveDescriptionHash = (descriptionHash.trim() || committedDescriptionHash || '').trim();
  const hasImage = isPublicAssetUri(coverImageUri);
  const hasMetadataUri = isPublicAssetUri(metadataUri);

  const deployBlocked =
    !effectiveBytecode || (qaResult?.result === 'unsure' && !qaPoolAcknowledged);

  useEffect(() => {
    setQaPoolAcknowledged(false);
  }, [effectiveBytecode, effectiveDescriptionHash, purpose]);

  useEffect(() => {
    onDeployGateChange?.({ canSubmit: !deployBlocked && isConnected });
  }, [deployBlocked, isConnected, onDeployGateChange]);

  const envHint =
    'Set REACT_APP_BOING_REFERENCE_NFT_COLLECTION_TEMPLATE_BYTECODE_HEX (or BOING_/VITE_ variant), or paste hex under Advanced.';

  const resolvePublished = useCallback(async () => {
    if (hasImage && hasMetadataUri && effectiveDescriptionHash) {
      return {
        metadataUri,
        descriptionHash: effectiveDescriptionHash,
        coverImageUri,
      };
    }
    if (typeof onEnsureMetadataPublished !== 'function') {
      throw new Error('Upload an image or paste an image URL, then publish collection metadata before deploy.');
    }
    setPublishBusy(true);
    try {
      const published = await onEnsureMetadataPublished();
      if (!published?.descriptionHash || !isPublicAssetUri(published.coverImageUri || published.image)) {
        throw new Error('Collection metadata must include a public image URL.');
      }
      return published;
    } finally {
      setPublishBusy(false);
    }
  }, [
    coverImageUri,
    effectiveDescriptionHash,
    hasImage,
    hasMetadataUri,
    metadataUri,
    onEnsureMetadataPublished,
  ]);

  const runQa = async () => {
    const bc = effectiveBytecode;
    if (!bc) {
      toast.error(hasBundled ? 'Bytecode missing — fix Advanced override.' : envHint);
      return;
    }
    if (!isValidBoingQaPurpose(purpose)) {
      toast.error('Choose a valid QA purpose category.');
      return;
    }
    setQaBusy(true);
    setQaResult(null);
    setQaPoolAcknowledged(false);
    try {
      let hash = effectiveDescriptionHash;
      if (!hash) {
        const published = await resolvePublished();
        hash = published.descriptionHash;
      }
      const { qa } = await preflightBoingLaunchWizardByKind('nft', {
        collectionName,
        collectionSymbol,
        customBytecode,
        descriptionHash: hash,
        purpose,
      });
      setQaResult(qa);
      if (qa.result === 'allow') toast.success('QA: allow');
      else if (qa.result === 'reject') toast.error(qa.message || 'QA: reject');
      else toast('QA: unsure — may go to community pool', { icon: '⚠️' });
    } catch (e) {
      toast.error(e?.message || 'boing_qaCheck failed');
    } finally {
      setQaBusy(false);
    }
  };

  const runDeployInternal = useCallback(async () => {
    let published;
    try {
      published = await resolvePublished();
    } catch (e) {
      toast.error(e?.message || 'Could not publish collection metadata.');
      return null;
    }
    const hashForDeploy = descriptionHash.trim() || published.descriptionHash;
    const result = await executeBoingLaunchWizardDeploy({
      kind: 'nft',
      getWalletProvider,
      collectionName,
      collectionSymbol,
      customBytecode,
      descriptionHash: hashForDeploy,
      qaPoolAcknowledged,
      purpose,
    });
    if (result.qaResult) setQaResult(result.qaResult);
    if (!result.ok) {
      toast.error(result.message);
      return null;
    }
    setLastTx(result.txHash);
    setLastBoingTxId(result.boingTxIdHex ?? null);
    setLastDeployedAccount(null);
    showBoingLaunchDeploySuccessToast({
      txHash: result.txHash,
      boingTxIdHex: result.boingTxIdHex,
      deployedAccountId: null,
      explorerBaseUrl,
      celebration: {
        deploymentKind: 'Native NFT collection',
        details: [
          { label: 'Collection name', value: String(collectionName || '').trim() || '—' },
          { label: 'Symbol', value: String(collectionSymbol || '').trim().toUpperCase() || '—' },
          { label: 'QA purpose', value: String(purpose || 'nft') },
          { label: 'Image', value: published.coverImageUri || published.image || '—' },
          { label: 'Metadata', value: published.metadataUri || '—' },
        ],
      },
    });
    scheduleBoingDeployReceiptFollowup(result.boingTxIdHex, (id) => {
      setLastDeployedAccount(id);
      showBoingContractIncludedToast(id, explorerBaseUrl);
      void (async () => {
        try {
          await commitReferenceNftMetadataHash({
            getWalletProvider,
            collectionAccountId: id,
            metadataHashHex32: hashForDeploy,
          });
          toast.success('Collection metadata hash bound on-chain (token 1).');
        } catch (e) {
          toast(
            `Collection deployed. Token metadata slot was not updated yet: ${formatBoingExpressRpcError(e)}`,
            { icon: '⚠️' }
          );
        }
      })();
    });
    return result.txHash;
  }, [
    collectionName,
    collectionSymbol,
    customBytecode,
    descriptionHash,
    getWalletProvider,
    purpose,
    qaPoolAcknowledged,
    explorerBaseUrl,
    resolvePublished,
  ]);

  useImperativeHandle(
    ref,
    () => ({
      canDeploy: () => !deployBlocked,
      runDeploy: runDeployInternal,
    }),
    [deployBlocked, runDeployInternal]
  );

  if (!isBoingTestnetChainId(chainId) || walletType !== 'boingExpress' || !isConnected) {
    return null;
  }

  const shellClass = embedInWizard
    ? 'rounded-xl border p-4 text-left mb-4'
    : 'mb-6 rounded-xl border p-5 text-left';
  const shellStyle = embedInWizard
    ? {
        backgroundColor: 'var(--bg-tertiary)',
        borderColor: 'rgba(34, 197, 94, 0.35)',
      }
    : {
        backgroundColor: 'var(--bg-card)',
        borderColor: 'rgba(34, 197, 94, 0.4)',
      };

  return (
    <section className={shellClass} style={shellStyle}>
      <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        Deploy native collection (Boing VM)
      </h3>
      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
        Uploads collection metadata (image URL + token JSON) to network storage, then deploys with that
        document&apos;s <code className="text-[10px]">description_hash</code>. This does not mint token IDs.{' '}
        <Link to="/docs?section=boing-l1" className="text-green-400 underline text-sm">
          Docs: Boing L1 &amp; Express
        </Link>
        {' · '}
        <Link to="/boing/native-vm" className="text-green-400 underline text-sm">
          Native VM tools
        </Link>
      </p>

      <div
        className="text-xs rounded-lg px-3 py-2 mb-3 border space-y-1"
        style={{
          borderColor: hasImage ? 'rgba(34, 197, 94, 0.45)' : 'rgba(251, 191, 36, 0.45)',
          backgroundColor: hasImage ? 'rgba(34, 197, 94, 0.08)' : 'transparent',
          color: 'var(--text-secondary)',
        }}
      >
        <p>
          <strong style={{ color: 'var(--text-primary)' }}>Image:</strong>{' '}
          {hasImage ? (
            <a href={coverImageUri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline break-all">
              {coverImageUri}
            </a>
          ) : (
            'Upload a file or paste a public image URL so metadata can be committed.'
          )}
        </p>
        <p>
          <strong style={{ color: 'var(--text-primary)' }}>Metadata JSON:</strong>{' '}
          {hasMetadataUri ? (
            <a href={metadataUri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline break-all">
              {metadataUri}
            </a>
          ) : (
            'Will upload on deploy (or when you publish from Review).'
          )}
        </p>
        {effectiveDescriptionHash ? (
          <p className="font-mono break-all">
            <strong style={{ color: 'var(--text-primary)' }}>description_hash:</strong> {effectiveDescriptionHash}
          </p>
        ) : null}
      </div>

      {hasBundled ? (
        <p
          className="text-xs rounded-lg px-3 py-2 mb-3 border"
          style={{
            borderColor: 'rgba(34, 197, 94, 0.45)',
            backgroundColor: 'rgba(34, 197, 94, 0.08)',
            color: 'var(--text-secondary)',
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>Reference NFT collection template loaded.</strong> Template line:{' '}
          <code className="text-[10px]">{REFERENCE_NFT_COLLECTION_TEMPLATE_VERSION}</code>.
        </p>
      ) : (
        <p
          className="text-xs rounded-lg px-3 py-2 mb-3 border"
          style={{
            borderColor: 'rgba(251, 191, 36, 0.45)',
            color: 'var(--text-secondary)',
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>No default collection bytecode in this build.</strong> {envHint}
        </p>
      )}

      {qaResult?.result === 'unsure' && (
        <label
          className="flex items-start gap-2 text-xs mb-3 cursor-pointer rounded-lg border px-3 py-2"
          style={{ borderColor: 'rgba(251, 191, 36, 0.5)', color: 'var(--text-secondary)' }}
        >
          <input
            type="checkbox"
            className="mt-0.5 shrink-0"
            checked={qaPoolAcknowledged}
            onChange={(e) => setQaPoolAcknowledged(e.target.checked)}
          />
          <span>
            I understand this deploy may be{' '}
            <strong style={{ color: 'var(--text-primary)' }}>queued for the community QA pool</strong>.
          </span>
        </label>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={runDeployInternal}
          disabled={deployBlocked || publishBusy}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--finance-green-mid)' }}
        >
          {publishBusy ? 'Publishing metadata…' : embedInWizard ? 'Deploy native collection' : 'Deploy collection'}
        </button>
      </div>

      {!hasBundled && !effectiveBytecode && (
        <p className="text-xs mb-3 rounded-lg px-3 py-2 border" style={{ borderColor: 'rgba(251, 191, 36, 0.35)', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Bytecode required.</strong> Expand <strong>Advanced</strong> below (it opens automatically here), paste
          even-length deploy hex, or set <code className="text-[10px]">REACT_APP_BOING_REFERENCE_NFT_COLLECTION_TEMPLATE_BYTECODE_HEX</code> in{' '}
          <code className="text-[10px]">frontend/.env.local</code> and restart the dev server.
        </p>
      )}

      <details
        className="mb-2 rounded-lg border"
        style={{ borderColor: 'var(--border-color)' }}
        defaultOpen={!hasBundled}
      >
        <summary className="cursor-pointer text-sm font-medium px-3 py-2" style={{ color: 'var(--text-primary)' }}>
          Advanced — bytecode, description hash, QA purpose
        </summary>
        <div className="px-3 pb-3 pt-1 space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
              QA purpose category
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full text-sm p-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              {BOING_QA_PURPOSE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
              Override bytecode (hex)
            </label>
            <textarea
              value={customBytecode}
              onChange={(e) => setCustomBytecode(e.target.value)}
              rows={4}
              placeholder={hasBundled ? 'Leave empty for bundled template…' : '0x…'}
              className="w-full text-sm p-2 rounded-lg border font-mono"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
            {customBytecode.trim() && !tryParseEvenLengthDeployBytecodeHex(customBytecode) && (
              <p className="text-xs mt-1 text-amber-400">Enter even-length hex (optional 0x prefix).</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
              description_hash override (optional, 32-byte hex)
            </label>
            <input
              type="text"
              value={descriptionHash}
              onChange={(e) => setDescriptionHash(e.target.value)}
              placeholder={committedDescriptionHash || 'Leave empty to use the uploaded metadata hash'}
              className="w-full text-sm p-2 rounded-lg border font-mono"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <button
            type="button"
            onClick={runQa}
            disabled={qaBusy || publishBusy || !effectiveBytecode}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--finance-primary)' }}
          >
            {qaBusy || publishBusy ? 'Running…' : 'Run QA check'}
          </button>
          {qaResult && (
            <pre
              className="text-xs p-2 rounded-lg overflow-x-auto"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
            >
              {JSON.stringify(qaResult, null, 2)}
            </pre>
          )}
        </div>
      </details>

      {lastTx && !embedInWizard && (
        <div className="text-xs mt-2 space-y-1" style={{ color: 'var(--text-secondary)' }}>
          <p className="font-mono break-all">Submit ack: {lastTx}</p>
          {lastDeployedAccount && (
            <a
              href={buildBoingExplorerAccountUrl(explorerBaseUrl, lastDeployedAccount)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 underline block"
            >
              View collection contract on boing.observer
            </a>
          )}
          {lastBoingTxId && !lastDeployedAccount && (
            <a
              href={buildBoingExplorerTxUrl(explorerBaseUrl, lastBoingTxId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 underline block"
            >
              Track transaction on boing.observer
            </a>
          )}
        </div>
      )}
    </section>
  );
});

export default NativeBoingNftDeploySection;

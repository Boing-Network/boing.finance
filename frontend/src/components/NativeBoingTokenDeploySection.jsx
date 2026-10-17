import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { isBoingTestnetChainId } from 'boing-sdk';
import { useWallet } from '../contexts/WalletContext';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import {
  computeEffectiveNativeDeployBytecode,
  executeBoingNativeTokenDeploy,
  getBundledNativeFungibleBytecodeHex,
  preflightReferenceFungibleDeployQa,
} from '../services/boingNativeTokenDeploy';
import { BOING_QA_PURPOSE_TOKEN, isValidBoingQaPurpose } from '../config/boingQa';
import { tryParseEvenLengthDeployBytecodeHex } from '../utils/boingDeployBytecodeHex';
import { isPublicAssetUri } from '../utils/nftCollectionMetadata';
import {
  showBoingContractIncludedToast,
  showBoingLaunchDeploySuccessToast,
} from '../utils/boingDeploySuccessToast';
import { BOING_TOKEN_V2_DECIMALS } from '../services/boingTokenV2Launch';
import { buildBoingExplorerAccountUrl, buildBoingExplorerTxUrl } from '../config/boingExplorerUrls';
import { rememberAssetDeployer } from '../utils/linkedNftToken';
import LinkedNftTokenPanel from './LinkedNftTokenPanel';

/**
 * Native Boing token deploy helper for Deploy Token page.
 * @typedef {{ runDeploy: () => Promise<string | null>, canDeploy: () => boolean }} NativeBoingTokenDeployHandle
 */

const NativeBoingTokenDeploySection = forwardRef(function NativeBoingTokenDeploySection(
  {
    tokenName,
    tokenSymbol,
    embedInWizard = false,
    initialSupply = '',
    onDeployGateChange,
    metadataUri = '',
    committedDescriptionHash = '',
    logoUri = '',
    onEnsureMetadataPublished,
    onDeployed,
    linkCollectionId = '',
  },
  ref
) {
  const { chainId, walletType, isConnected, getWalletProvider, account } = useWallet();
  const { explorerBaseUrl } = useBoingNativeDexIntegration();
  const purpose = BOING_QA_PURPOSE_TOKEN;

  const bundledBytecode = useMemo(() => getBundledNativeFungibleBytecodeHex(), []);
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
  const [stage, setStage] = useState(null);
  const [mintNote, setMintNote] = useState(null);

  const effectiveBytecode = useMemo(
    () => computeEffectiveNativeDeployBytecode(customBytecode, bundledBytecode),
    [customBytecode, bundledBytecode]
  );

  const effectiveDescriptionHash = (descriptionHash.trim() || committedDescriptionHash || '').trim();
  const hasLogo = isPublicAssetUri(logoUri);
  const hasMetadataUri = isPublicAssetUri(metadataUri);

  const deployBlocked =
    !effectiveBytecode || (qaResult?.result === 'unsure' && !qaPoolAcknowledged);

  const gateEligible =
    isBoingTestnetChainId(chainId) && walletType === 'boingExpress' && isConnected;

  const blockedReason = useMemo(() => {
    if (!gateEligible) return null;
    if (!effectiveBytecode) {
      return hasBundled
        ? 'Fix or clear the Advanced bytecode field (invalid hex).'
        : 'Boing token v2 template missing from this build — update boing-sdk.';
    }
    if (qaResult?.result === 'unsure' && !qaPoolAcknowledged) {
      return 'Acknowledge the community QA pool checkbox below before deploying.';
    }
    return null;
  }, [gateEligible, effectiveBytecode, hasBundled, qaResult, qaPoolAcknowledged]);

  useEffect(() => {
    setQaPoolAcknowledged(false);
  }, [effectiveBytecode, effectiveDescriptionHash]);

  useEffect(() => {
    onDeployGateChange?.({
      canSubmit: gateEligible && !deployBlocked,
      blockedReason: gateEligible && deployBlocked ? blockedReason : null,
    });
  }, [gateEligible, deployBlocked, blockedReason, onDeployGateChange]);

  const envHint = 'Boing token v2 template missing from this build — update boing-sdk, or paste hex under Advanced.';

  const resolvePublished = useCallback(async () => {
    if (hasMetadataUri && effectiveDescriptionHash) {
      return {
        metadataUri,
        descriptionHash: effectiveDescriptionHash,
        logoUri,
      };
    }
    if (typeof onEnsureMetadataPublished !== 'function') {
      return {
        metadataUri: metadataUri || '',
        descriptionHash: effectiveDescriptionHash,
        logoUri,
      };
    }
    setPublishBusy(true);
    try {
      return await onEnsureMetadataPublished();
    } finally {
      setPublishBusy(false);
    }
  }, [
    effectiveDescriptionHash,
    hasMetadataUri,
    logoUri,
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
      if (!hash && typeof onEnsureMetadataPublished === 'function') {
        const published = await resolvePublished();
        hash = published?.descriptionHash || '';
      }
      const r = await preflightReferenceFungibleDeployQa({
        tokenName,
        tokenSymbol,
        customBytecode,
        descriptionHash: hash,
        purpose,
      });
      setQaResult(r);
      if (r.result === 'allow') toast.success('QA: allow');
      else if (r.result === 'reject') toast.error(r.message || 'QA: reject');
      else toast('QA: unsure — may go to community pool', { icon: '⚠️' });
    } catch (e) {
      toast.error(e?.message || 'boing_qaCheck failed');
    } finally {
      setQaBusy(false);
    }
  };

  const runDeployInternal = useCallback(async () => {
    let published = { metadataUri, descriptionHash: effectiveDescriptionHash, logoUri };
    try {
      published = await resolvePublished();
    } catch (e) {
      toast.error(e?.message || 'Could not publish token metadata.');
      return null;
    }
    const hashForDeploy = descriptionHash.trim() || published?.descriptionHash || '';
    setMintNote(null);
    let result;
    try {
      result = await executeBoingNativeTokenDeploy({
        getWalletProvider,
        senderHex: account,
        tokenName,
        tokenSymbol,
        initialSupply,
        customBytecode,
        descriptionHash: hashForDeploy,
        qaPoolAcknowledged,
        onStage: setStage,
      });
    } finally {
      setStage(null);
    }
    if (result.qaResult) setQaResult(result.qaResult);
    if (!result.ok) {
      toast.error(result.message);
      return null;
    }
    setLastTx(result.txHash);
    setLastBoingTxId(result.boingTxIdHex ?? null);
    setLastDeployedAccount(result.tokenHex);
    if (account) rememberAssetDeployer(result.tokenHex, account);
    if (result.mintError) {
      const note = `Token deployed, but minting the supply failed: ${result.mintError}`;
      setMintNote(note);
      toast.error(note);
    } else if (!result.mintConfirmed) {
      setMintNote('Mint submitted; still waiting for a block to include it. Check boing.observer in a moment.');
    }
    showBoingLaunchDeploySuccessToast({
      txHash: result.txHash,
      boingTxIdHex: result.boingTxIdHex,
      deployedAccountId: result.tokenHex,
      explorerBaseUrl,
      celebration: {
        deploymentKind: 'Boing token (v2)',
        details: [
          { label: 'Name', value: String(tokenName || '').trim() || '—' },
          { label: 'Symbol', value: String(tokenSymbol || '').trim().toUpperCase() || '—' },
          { label: 'Decimals', value: `${BOING_TOKEN_V2_DECIMALS} (whole units)` },
          { label: 'Supply', value: `${result.supply}${result.mintError ? ' (mint failed)' : ''}` },
          { label: 'Token', value: result.tokenHex },
          ...(published?.logoUri ? [{ label: 'Logo', value: published.logoUri }] : []),
          ...(published?.metadataUri ? [{ label: 'Metadata', value: published.metadataUri }] : []),
        ],
      },
    });
    if (result.mintConfirmed) showBoingContractIncludedToast(result.tokenHex, explorerBaseUrl);
    onDeployed?.({ accountId: result.tokenHex, kind: 'token', name: tokenName, symbol: tokenSymbol });
    return result.txHash;
  }, [
    account,
    customBytecode,
    descriptionHash,
    effectiveDescriptionHash,
    getWalletProvider,
    initialSupply,
    logoUri,
    metadataUri,
    onDeployed,
    qaPoolAcknowledged,
    tokenName,
    tokenSymbol,
    resolvePublished,
    explorerBaseUrl,
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
      {!embedInWizard && (
        <>
          <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Deploy on Boing
          </h2>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            Use the name and symbol from the form above, then deploy. Express will ask you to approve.
          </p>
        </>
      )}

      {embedInWizard && (
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          Uses the same name, symbol and supply as this wizard. Express will ask you to approve the deploy and the mint.
        </p>
      )}

      {(hasLogo || hasMetadataUri || effectiveDescriptionHash) && (
        <div
          className="text-xs rounded-lg px-3 py-2 mb-3 border space-y-1"
          style={{
            borderColor: 'rgba(34, 197, 94, 0.45)',
            backgroundColor: 'rgba(34, 197, 94, 0.08)',
            color: 'var(--text-secondary)',
          }}
        >
          <p>
            <strong style={{ color: 'var(--text-primary)' }}>Logo:</strong>{' '}
            {hasLogo ? (
              <a href={logoUri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline break-all">
                {logoUri}
              </a>
            ) : (
              'Optional — upload a file or paste a URL in Token Logo to include it in metadata.'
            )}
          </p>
          <p>
            <strong style={{ color: 'var(--text-primary)' }}>Metadata JSON:</strong>{' '}
            {hasMetadataUri ? (
              <a href={metadataUri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline break-all">
                {metadataUri}
              </a>
            ) : (
              'Will upload on deploy.'
            )}
          </p>
          {effectiveDescriptionHash ? (
            <p className="font-mono break-all">
              <strong style={{ color: 'var(--text-primary)' }}>description_hash:</strong> {effectiveDescriptionHash}
            </p>
          ) : null}
        </div>
      )}

      {hasBundled ? (
        <p
          className="text-xs rounded-lg px-3 py-2 mb-3 border"
          style={{
            borderColor: 'rgba(34, 197, 94, 0.45)',
            backgroundColor: 'rgba(34, 197, 94, 0.08)',
            color: 'var(--text-secondary)',
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>Boing token v2.</strong>{' '}
          Same token as the Boing swap pools: transfer, approve and transfer_from, whole units (no decimals). Express
          asks you to approve two transactions: the deploy, then a one-time mint of the whole supply to your account.
          No one can mint more afterwards.
        </p>
      ) : (
        <p
          className="text-xs rounded-lg px-3 py-2 mb-3 border"
          style={{
            borderColor: 'rgba(251, 191, 36, 0.45)',
            color: 'var(--text-secondary)',
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>No default template in this build.</strong> {envHint}
        </p>
      )}

      {stage && (
        <p role="status" data-testid="boing-token-deploy-stage" className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
          {{
            qa: 'Running the QA check…',
            sign_deploy: 'Approve the deploy in Boing Express (1 of 2)…',
            sign_mint: 'Approve the mint in Boing Express (2 of 2)…',
            submit: 'Submitting…',
            confirm: 'Waiting for the mint to be included…',
          }[stage] || 'Working…'}
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
            <strong style={{ color: 'var(--text-primary)' }}>queued for the community QA pool</strong> (governance vote may
            be required before it lands on-chain).
          </span>
        </label>
      )}

      {!embedInWizard && (
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            onClick={runDeployInternal}
            disabled={deployBlocked || publishBusy}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--finance-green-mid)' }}
          >
            Deploy token
          </button>
        </div>
      )}

      <details className="mb-2 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
        <summary className="cursor-pointer text-sm font-medium px-3 py-2" style={{ color: 'var(--text-primary)' }}>
          Advanced — bytecode override, description hash, QA check
        </summary>
        <div className="px-3 pb-3 pt-1 space-y-3">
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Leave bytecode empty to deploy Boing token v2 from boing-sdk. A pasted template still gets the one-time mint call. QA
            purpose for this flow is <code className="text-[10px]">{purpose}</code>.
          </p>
          <div>
            <label
              htmlFor="native-boing-token-bytecode-override"
              className="block text-xs font-medium mb-1"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Override bytecode (hex)
            </label>
            <textarea
              id="native-boing-token-bytecode-override"
              name="nativeBoingTokenBytecodeOverride"
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
            <label
              htmlFor="native-boing-token-description-hash"
              className="block text-xs font-medium mb-1"
              style={{ color: 'var(--text-tertiary)' }}
            >
              description_hash (optional, 32-byte hex)
            </label>
            <p className="text-[10px] mb-1" style={{ color: 'var(--text-tertiary)' }}>
              Leave empty to commit the uploaded token metadata (logo, links, supply). Filling this field overrides that
              commitment.
            </p>
            <input
              id="native-boing-token-description-hash"
              name="nativeBoingTokenDescriptionHash"
              type="text"
              value={descriptionHash}
              onChange={(e) => setDescriptionHash(e.target.value)}
              placeholder={committedDescriptionHash || '0x… or leave empty'}
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
            {qaBusy ? 'Running QA…' : 'Run QA check'}
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

      {lastTx && (
        <div className="text-xs mt-2 space-y-1" style={{ color: 'var(--text-secondary)' }}>
          <p className="font-mono break-all">Submit ack: {lastTx}</p>
          {lastDeployedAccount && (
            <p className="font-mono break-all" data-testid="boing-token-deployed-id">Token: {lastDeployedAccount}</p>
          )}
          {mintNote && <p className="text-amber-400">{mintNote}</p>}
          {lastDeployedAccount && (
            <a
              href={buildBoingExplorerAccountUrl(explorerBaseUrl, lastDeployedAccount)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 underline block"
            >
              View contract on boing.observer
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

      {lastDeployedAccount ? (
        <LinkedNftTokenPanel
          compact
          seedTokenId={lastDeployedAccount}
          seedCollectionId={linkCollectionId}
          tokenLabel={tokenSymbol || tokenName}
          title="Link an NFT collection"
        />
      ) : null}
    </section>
  );
});

export default NativeBoingTokenDeploySection;

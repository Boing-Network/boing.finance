import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import { useCompanionsLinked } from '../hooks/useCompanionsLinked';
import { useBuilderAttested } from '../hooks/useBuilderAttested';
import { isLinkableAssetAddress } from '../utils/linkedNftToken';
import {
  attestAsBuilderOnChain,
  getBuilderAttestationRegistryStatus,
  revokeBuilderAttestationOnChain,
} from '../services/builderAttestationRegistry';

function shortId(hex) {
  const t = String(hex || '');
  if (t.length < 14) return t;
  return `${t.slice(0, 8)}…${t.slice(-6)}`;
}

/**
 * Optional on-chain builder attestation CTA (app policy: prefer after companions linked).
 * Plain language only — no registry / selector jargon.
 */
export default function BuilderAttestationPanel({
  collectionId = '',
  tokenId = '',
  compact = false,
  className = '',
  /** When true, hide Attest CTA unless companions are linked (product default). */
  requireCompanions = true,
}) {
  const { account, getWalletProvider, walletType, isConnected } = useWallet();
  const dexIntegration = useBoingNativeDexIntegration();
  const defaults = dexIntegration?.defaults || null;
  const endUser = defaults?.endUser || defaults?.end_user || null;
  const networkInfo = defaults?.networkInfo || null;

  const idsOk = isLinkableAssetAddress(collectionId) && isLinkableAssetAddress(tokenId);
  const [busy, setBusy] = useState(false);
  const [lastTx, setLastTx] = useState(null);

  const status = getBuilderAttestationRegistryStatus({ endUser, networkInfo });
  const companions = useCompanionsLinked({
    collectionId,
    tokenId,
    endUser,
    networkInfo,
    origin: account || null,
    enabled: Boolean(idsOk && requireCompanions),
  });
  const {
    state,
    attested,
    message,
    attestations,
    ownAttestation,
    refresh,
  } = useBuilderAttested({
    collectionId,
    tokenId,
    builderId: account || null,
    endUser,
    networkInfo,
    origin: account || null,
    enabled: idsOk,
  });

  if (!idsOk) return null;

  const expressOk = isConnected && walletType === 'boingExpress';
  const companionsReady = !requireCompanions || companions.linked;
  const companionsChecking = requireCompanions && companions.checking;
  const canAttest =
    status.canWrite &&
    expressOk &&
    companionsReady &&
    !ownAttestation &&
    !busy &&
    state !== 'checking';
  const canRevoke =
    status.canWrite && expressOk && Boolean(ownAttestation) && !busy;

  const border =
    attested || ownAttestation
      ? 'rgba(16, 185, 129, 0.45)'
      : state === 'checking' || companionsChecking
        ? 'var(--border-color)'
        : state === 'unavailable' || !status.canWrite
          ? 'rgba(245, 158, 11, 0.5)'
          : 'rgba(59, 140, 255, 0.28)';
  const bg =
    attested || ownAttestation
      ? 'rgba(16, 185, 129, 0.08)'
      : state === 'unavailable' || !status.canWrite
        ? 'rgba(245, 158, 11, 0.08)'
        : 'var(--bg-tertiary)';

  let title = 'Builder';
  let body = message || 'Optional: confirm on-chain that you built this project.';
  if (ownAttestation) {
    title = "You're listed as builder";
    body = `Signed${ownAttestation.builderId ? ` (${shortId(ownAttestation.builderId)})` : ''}.`;
  } else if (attested) {
    title = 'Builder confirmed';
    const latest = attestations[0];
    body = latest
      ? `Someone attested as builder (${shortId(latest.builderId)}).`
      : 'This project has a builder confirmation on-chain.';
  } else if (!companionsReady && requireCompanions) {
    title = "Show you're the builder";
    body = companionsChecking
      ? 'Checking link…'
      : "Link your collection and token first, then you can confirm you're the builder.";
  } else if (state === 'not_attested') {
    title = "Show you're the builder";
    body = 'Optional. Sign in your wallet to confirm on-chain.';
  } else if (state === 'checking') {
    title = 'Checking…';
    body = 'Looking up builder confirmation for this project.';
  } else if (state === 'unavailable' || !status.canWrite) {
    title = 'Builder confirmation';
    body = 'Could not check this right now. Try again in a moment.';
  }

  const run = async (fn, okMsg) => {
    setBusy(true);
    try {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.message || 'Something went wrong');
        return;
      }
      if (result.txHash) setLastTx(result.txHash);
      else if (result.txHashes?.length) setLastTx(result.txHashes[result.txHashes.length - 1]);
      toast.success(okMsg);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const onAttest = () =>
    run(
      () =>
        attestAsBuilderOnChain({
          getWalletProvider,
          collectionId,
          tokenId,
          linker: account,
          endUser,
          networkInfo,
        }),
      'Builder attested'
    );

  const onRevoke = () =>
    run(
      () =>
        revokeBuilderAttestationOnChain({
          getWalletProvider,
          index: ownAttestation?.index ?? null,
          collectionId,
          tokenId,
          linker: account,
          endUser,
          networkInfo,
        }),
      'Attestation revoked'
    );

  const statusVariant =
    attested || ownAttestation
      ? 'td-status--success'
      : state === 'unavailable' || !status.canWrite
        ? 'td-status--warn'
        : 'td-status--info';

  return (
    <div
      className={`td-status ${statusVariant} ${compact ? 'px-3 py-2.5' : ''} text-sm ${className}`}
      style={{ borderColor: border, backgroundColor: bg }}
      data-testid="builder-attestation-panel"
      data-attest-state={ownAttestation ? 'own' : state}
      data-companions-ready={companionsReady ? '1' : '0'}
      role="status"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="td-status__title">{title}</p>
          <p className="mt-1 text-xs sm:text-sm">{body}</p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="td-btn td-btn--link text-xs shrink-0"
          disabled={busy}
        >
          Refresh
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {canAttest ? (
          <button
            type="button"
            onClick={onAttest}
            className="td-btn td-btn--primary text-xs sm:text-sm"
            data-testid="builder-attest-cta"
          >
            {busy ? 'Signing…' : 'Confirm as builder'}
          </button>
        ) : null}
        {canRevoke ? (
          <button
            type="button"
            onClick={onRevoke}
            className="td-btn td-btn--ghost text-xs sm:text-sm"
            style={{ color: 'var(--finance-red-light)' }}
            data-testid="builder-revoke-cta"
          >
            {busy ? 'Revoking…' : 'Revoke attestation'}
          </button>
        ) : null}
        {!expressOk && companionsReady && !ownAttestation ? (
          <p className="text-xs w-full" style={{ color: 'var(--text-tertiary)' }}>
            Connect Boing Express to attest as builder.
          </p>
        ) : null}
      </div>

      {lastTx ? (
        <p className="text-xs font-mono break-all mt-2" style={{ color: 'var(--text-tertiary)' }}>
          Last tx: {shortId(lastTx)}
        </p>
      ) : null}
    </div>
  );
}

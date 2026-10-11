import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import { useCompanionsLinked } from '../hooks/useCompanionsLinked';
import { isLinkableAssetAddress } from '../utils/linkedNftToken';
import {
  clearStoredBuilderAttestation,
  exportBuilderAttestationJson,
  loadStoredBuilderAttestation,
  pairStorageKey,
  saveBuilderAttestationProof,
  verifyBuilderAttestationProof,
} from '../utils/builderAttestation';
import { signBuilderAttestation } from '../services/builderAttestationSign';

/**
 * Plain-language builder attestation: sign, show status, export, verify.
 * Prefer companions linked before offering the primary attest CTA.
 */
export default function BuilderAttestationPanel({
  collectionId = '',
  tokenId = '',
  compact = false,
  className = '',
}) {
  const { account, getWalletProvider, walletType, isConnected } = useWallet();
  const dexIntegration = useBoingNativeDexIntegration();
  const defaults = dexIntegration?.defaults || null;
  const endUser = defaults?.endUser || defaults?.end_user || null;
  const networkInfo = defaults?.networkInfo || null;

  const idsReady =
    isLinkableAssetAddress(collectionId) && isLinkableAssetAddress(tokenId);

  const { state: companionState, linked } = useCompanionsLinked({
    collectionId,
    tokenId,
    endUser,
    networkInfo,
    origin: account || null,
    enabled: idsReady,
  });

  const [proof, setProof] = useState(null);
  const [note, setNote] = useState('');
  const [paste, setPaste] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!idsReady) {
      setProof(null);
      return;
    }
    setProof(loadStoredBuilderAttestation(collectionId, tokenId));
  }, [collectionId, tokenId, idsReady]);

  const expressOk = isConnected && walletType === 'boingExpress';
  const canAttest = expressOk && idsReady && linked;

  const status = useMemo(() => {
    if (!idsReady) {
      return {
        title: 'Builder attestation',
        body: 'Add a collection and token to attest this project.',
        tone: 'neutral',
      };
    }
    if (proof) {
      return {
        title: 'Builder attested',
        body: 'Signed by your wallet. Share the proof so others can check it.',
        tone: 'ok',
      };
    }
    if (companionState === 'checking' || companionState === 'idle') {
      return {
        title: 'Builder attestation',
        body: 'Checking companions before you can attest…',
        tone: 'neutral',
      };
    }
    if (!linked) {
      return {
        title: 'Link companions first',
        body: 'Attest as builder after this collection and token are linked as companions.',
        tone: 'warn',
      };
    }
    return {
      title: 'Attest as builder',
      body: 'Sign a short statement that you are the builder of this project. Not an on-chain record — a checkable wallet proof.',
      tone: 'ready',
    };
  }, [idsReady, proof, companionState, linked]);

  const border =
    status.tone === 'ok'
      ? 'rgba(16, 185, 129, 0.45)'
      : status.tone === 'warn'
        ? 'rgba(245, 158, 11, 0.5)'
        : 'var(--border-color)';
  const bg =
    status.tone === 'ok'
      ? 'rgba(16, 185, 129, 0.08)'
      : status.tone === 'warn'
        ? 'rgba(245, 158, 11, 0.08)'
        : 'var(--bg-tertiary)';

  const onAttest = async () => {
    if (!canAttest) return;
    setBusy(true);
    try {
      const result = await signBuilderAttestation({
        getWalletProvider,
        builder: account,
        collectionId,
        tokenId,
        note,
        persist: true,
      });
      if (!result.ok) {
        toast.error(result.message || 'Could not attest');
        return;
      }
      setProof(result.proof);
      toast.success('Builder attested');
    } finally {
      setBusy(false);
    }
  };

  const onCopyProof = async () => {
    if (!proof) return;
    const text = exportBuilderAttestationJson(proof);
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Proof copied');
    } catch {
      toast.error('Could not copy proof');
    }
  };

  const onClearLocal = () => {
    clearStoredBuilderAttestation(collectionId, tokenId);
    setProof(null);
    toast.success('Local proof cleared');
  };

  const onVerifyPaste = () => {
    const checked = verifyBuilderAttestationProof(paste);
    setVerifyResult(checked);
    if (checked.ok && checked.proof) {
      const pasteKey = pairStorageKey(checked.proof.collection, checked.proof.token);
      const panelKey = idsReady ? pairStorageKey(collectionId, tokenId) : '';
      if (pasteKey && panelKey && pasteKey === panelKey) {
        const saved = saveBuilderAttestationProof(checked.proof);
        if (saved.ok) setProof(saved.proof);
      }
      toast.success(checked.message);
    } else {
      toast.error(checked.message || 'Could not verify');
    }
  };

  return (
    <section
      className={`${compact ? 'rounded-lg px-3 py-2.5' : 'rounded-xl px-3 py-3'} border text-sm ${className}`}
      style={{ borderColor: border, backgroundColor: bg, color: 'var(--text-secondary)' }}
      data-testid="builder-attestation-panel"
      data-attest-tone={status.tone}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {status.title}
          </p>
          <p className="mt-1 text-xs sm:text-sm">{status.body}</p>
        </div>
      </div>

      {proof ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-mono break-all" style={{ color: 'var(--text-tertiary)' }}>
            Builder {proof.builder}
          </p>
          {proof.note ? (
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Note: {proof.note}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void onCopyProof()}
              className="inline-flex px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold"
              style={{ backgroundColor: 'var(--finance-primary)', color: '#041018' }}
              data-testid="builder-attest-copy"
            >
              Copy proof
            </button>
            <button
              type="button"
              onClick={onClearLocal}
              className="inline-flex px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              Clear local
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {linked ? (
            <>
              <label className="block text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Optional note
                <input
                  type="text"
                  value={note}
                  maxLength={280}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Short note (optional)"
                  className="mt-1 w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                  disabled={busy || !canAttest}
                />
              </label>
              <button
                type="button"
                onClick={() => void onAttest()}
                disabled={busy || !canAttest}
                className="inline-flex px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: 'var(--finance-primary)', color: '#041018' }}
                data-testid="builder-attest-sign"
              >
                {busy ? 'Waiting for wallet…' : 'Attest as builder'}
              </button>
              {!expressOk ? (
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Connect Boing Express to sign.
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      )}

      <details className="mt-3">
        <summary
          className="cursor-pointer text-xs font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          Check a proof
        </summary>
        <div className="mt-2 space-y-2">
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            rows={4}
            placeholder="Paste a builder proof JSON…"
            className="w-full px-3 py-2 rounded-lg text-xs font-mono"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
            data-testid="builder-attest-paste"
          />
          <button
            type="button"
            onClick={onVerifyPaste}
            className="inline-flex px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            data-testid="builder-attest-verify"
          >
            Verify
          </button>
          {verifyResult ? (
            <p
              className="text-xs"
              style={{
                color: verifyResult.ok ? 'var(--finance-green-mid)' : 'var(--finance-gold)',
              }}
              data-testid="builder-attest-verify-result"
            >
              {verifyResult.ok ? 'Proof checks out.' : verifyResult.message}
            </p>
          ) : null}
        </div>
      </details>
    </section>
  );
}

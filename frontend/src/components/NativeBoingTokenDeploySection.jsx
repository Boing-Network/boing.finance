import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { REFERENCE_FUNGIBLE_TEMPLATE_VERSION } from 'boing-sdk';
import { useWallet } from '../contexts/WalletContext';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { qaCheckBoingDeploy } from '../services/boingNativeVm';
import {
  computeEffectiveNativeDeployBytecode,
  executeBoingNativeTokenDeploy,
  getBundledNativeFungibleBytecodeHex,
} from '../services/boingNativeTokenDeploy';
import { BOING_QA_EMPTY_DESCRIPTION_HASH, BOING_QA_PURPOSE_TOKEN, isValidBoingQaPurpose } from '../config/boingQa';
import { tryParseEvenLengthDeployBytecodeHex } from '../utils/boingDeployBytecodeHex';

/**
 * Native Boing token deploy helper for Deploy Token page.
 * @typedef {{ runDeploy: () => Promise<string | null>, canDeploy: () => boolean }} NativeBoingTokenDeployHandle
 */

const NativeBoingTokenDeploySection = forwardRef(function NativeBoingTokenDeploySection(
  { tokenName, tokenSymbol, embedInWizard = false, onDeployGateChange },
  ref
) {
  const { chainId, walletType, isConnected, getWalletProvider } = useWallet();
  const purpose = BOING_QA_PURPOSE_TOKEN;

  const bundledBytecode = useMemo(() => getBundledNativeFungibleBytecodeHex(), []);
  const hasBundled = Boolean(bundledBytecode);

  const [customBytecode, setCustomBytecode] = useState('');
  const [descriptionHash, setDescriptionHash] = useState('');
  const [qaBusy, setQaBusy] = useState(false);
  const [qaResult, setQaResult] = useState(null);
  const [lastTx, setLastTx] = useState(null);
  const [qaPoolAcknowledged, setQaPoolAcknowledged] = useState(false);

  const effectiveBytecode = useMemo(
    () => computeEffectiveNativeDeployBytecode(customBytecode, bundledBytecode),
    [customBytecode, bundledBytecode]
  );

  const deployBlocked =
    !effectiveBytecode || (qaResult?.result === 'unsure' && !qaPoolAcknowledged);

  useEffect(() => {
    setQaPoolAcknowledged(false);
  }, [effectiveBytecode, descriptionHash]);

  useEffect(() => {
    onDeployGateChange?.({ canSubmit: !deployBlocked && isConnected });
  }, [deployBlocked, isConnected, onDeployGateChange]);

  const envHint =
    'Set REACT_APP_BOING_REFERENCE_FUNGIBLE_TEMPLATE_BYTECODE_HEX (or legacy REACT_APP_BOING_REFERENCE_TOKEN_BYTECODE), or paste hex under Advanced.';

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
      const name = tokenName?.trim() || '';
      const sym = tokenSymbol?.trim() || '';
      const r = await qaCheckBoingDeploy(bc, {
        purposeCategory: purpose,
        descriptionHash: descriptionHash.trim() || undefined,
        assetName: name || undefined,
        assetSymbol: sym || undefined,
        emptyDescriptionHash: BOING_QA_EMPTY_DESCRIPTION_HASH,
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
    const result = await executeBoingNativeTokenDeploy({
      getWalletProvider,
      tokenName,
      tokenSymbol,
      customBytecode,
      descriptionHash,
      qaPoolAcknowledged,
    });
    if (result.qaResult) setQaResult(result.qaResult);
    if (!result.ok) {
      toast.error(result.message);
      return null;
    }
    setLastTx(result.txHash);
    toast.success('Submitted — check explorer or Native VM page for receipt.');
    return result.txHash;
  }, [
    customBytecode,
    descriptionHash,
    getWalletProvider,
    qaPoolAcknowledged,
    tokenName,
    tokenSymbol,
  ]);

  useImperativeHandle(
    ref,
    () => ({
      canDeploy: () => !deployBlocked,
      runDeploy: runDeployInternal,
    }),
    [deployBlocked, runDeployInternal]
  );

  if (chainId !== BOING_NATIVE_L1_CHAIN_ID || walletType !== 'boingExpress' || !isConnected) {
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
            Deploy on Boing testnet (native token)
          </h2>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            Enter <strong>name</strong> and <strong>symbol</strong> in the main form above, then <strong>Deploy token</strong>.
            Boing Express will open for approval—same rhythm as EVM deploy, with a Boing wallet instead of MetaMask. This is
            a native VM contract with QA metadata, not an ERC-20.{' '}
            <Link to="/boing/native-vm" className="text-green-400 underline text-sm">
              Native VM tools
            </Link>{' '}
            for low-level bytecode and other transaction kinds.
          </p>
        </>
      )}

      {embedInWizard && (
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Boing native deploy:</strong> uses the same name and symbol as
          this wizard. Boing Express will ask you to approve the deploy transaction (not an ERC-20 factory).{' '}
          <Link to="/boing/native-vm" className="text-green-400 underline text-sm">
            Native VM tools
          </Link>
        </p>
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
          <strong style={{ color: 'var(--text-primary)' }}>Standard fungible template loaded.</strong>{' '}
          {embedInWizard
            ? 'Use Deploy below; open Advanced only for overrides or QA.'
            : 'Bytecode is not shown on this screen. Open Advanced only if you need to override hex, set description_hash, or run an explicit QA check.'}{' '}
          SDK template line: <code className="text-[10px]">{REFERENCE_FUNGIBLE_TEMPLATE_VERSION}</code>.
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
            disabled={deployBlocked}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: '#059669' }}
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
            Leave bytecode empty to use the resolved template ({hasBundled ? 'from env / SDK' : 'configure env first'}). QA
            purpose for this flow is <code className="text-[10px]">{purpose}</code>.
          </p>
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
              description_hash (optional, 32-byte hex)
            </label>
            <input
              type="text"
              value={descriptionHash}
              onChange={(e) => setDescriptionHash(e.target.value)}
              placeholder="0x… or leave empty"
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
            disabled={qaBusy || !effectiveBytecode}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: '#2563eb' }}
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

      {lastTx && !embedInWizard && (
        <p className="text-xs font-mono break-all mt-2" style={{ color: 'var(--text-secondary)' }}>
          Result: {lastTx}
        </p>
      )}
    </section>
  );
});

export default NativeBoingTokenDeploySection;

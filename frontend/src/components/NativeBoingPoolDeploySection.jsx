import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { isBoingTestnetChainId } from 'boing-sdk';
import { useWallet } from '../contexts/WalletContext';
import {
  computeEffectiveNativeDeployBytecode,
  executeBoingLaunchWizardDeploy,
  getBundledNativePoolBytecodeHex,
  preflightBoingLaunchWizardByKind,
} from '../services/boingNativeLaunchWizardDeploy';
import { BOING_QA_PURPOSE_OPTIONS, isValidBoingQaPurpose } from '../config/boingQa';
import { tryParseEvenLengthDeployBytecodeHex } from '../utils/boingDeployBytecodeHex';
import {
  showBoingContractIncludedToast,
  showBoingLaunchDeploySuccessToast,
} from '../utils/boingDeploySuccessToast';
import { scheduleBoingDeployReceiptFollowup } from '../services/boingDeployReceiptFollowup';
import { getBoingObserverAccountUrl, getBoingObserverTxUrl } from '../config/boingExplorerUrls';

const DEFAULT_POOL_PURPOSE = 'dapp';

/**
 * Operator / advanced: deploy native constant-product pool bytecode via Boing Express (QA uses `dapp` by default).
 */
export default function NativeBoingPoolDeploySection() {
  const { chainId, walletType, isConnected, getWalletProvider } = useWallet();
  const [purposeCategory, setPurposeCategory] = useState(DEFAULT_POOL_PURPOSE);
  const [poolLabel, setPoolLabel] = useState('');
  const [poolSymbol, setPoolSymbol] = useState('');

  const bundledBytecode = useMemo(() => getBundledNativePoolBytecodeHex(), []);
  const hasBundled = Boolean(bundledBytecode);

  const [customBytecode, setCustomBytecode] = useState('');
  const [descriptionHash, setDescriptionHash] = useState('');
  const [qaBusy, setQaBusy] = useState(false);
  const [qaResult, setQaResult] = useState(null);
  const [qaPoolAcknowledged, setQaPoolAcknowledged] = useState(false);
  const [lastTx, setLastTx] = useState(null);
  const [lastBoingTxId, setLastBoingTxId] = useState(null);
  const [lastDeployedAccount, setLastDeployedAccount] = useState(null);

  const effectiveBytecode = useMemo(
    () => computeEffectiveNativeDeployBytecode(customBytecode, bundledBytecode),
    [customBytecode, bundledBytecode]
  );

  const deployBlocked =
    !effectiveBytecode || (qaResult?.result === 'unsure' && !qaPoolAcknowledged);

  useEffect(() => {
    setQaPoolAcknowledged(false);
  }, [effectiveBytecode, descriptionHash, purposeCategory, poolLabel, poolSymbol]);

  const envHint =
    'Set BOING_NATIVE_AMM_BYTECODE_HEX or REACT_APP_BOING_NATIVE_AMM_BYTECODE_HEX (output from dump_native_amm_pool), or paste hex below.';

  const runQa = async () => {
    if (!effectiveBytecode) {
      toast.error(hasBundled ? 'Bytecode missing — fix override.' : envHint);
      return;
    }
    if (!isValidBoingQaPurpose(purposeCategory)) {
      toast.error('Choose a valid QA purpose category.');
      return;
    }
    setQaBusy(true);
    setQaResult(null);
    setQaPoolAcknowledged(false);
    try {
      const { qa } = await preflightBoingLaunchWizardByKind('liquidity_pool', {
        poolLabel: poolLabel.trim() || undefined,
        poolSymbol: poolSymbol.trim() || undefined,
        customBytecode,
        descriptionHash,
        purposeCategory,
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

  const runDeploy = useCallback(async () => {
    const result = await executeBoingLaunchWizardDeploy({
      kind: 'liquidity_pool',
      getWalletProvider,
      poolLabel: poolLabel.trim() || undefined,
      poolSymbol: poolSymbol.trim() || undefined,
      customBytecode,
      descriptionHash,
      purposeCategory,
      qaPoolAcknowledged,
    });
    if (result.qaResult) setQaResult(result.qaResult);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setLastTx(result.txHash);
    setLastBoingTxId(result.boingTxIdHex ?? null);
    setLastDeployedAccount(null);
    showBoingLaunchDeploySuccessToast({
      txHash: result.txHash,
      boingTxIdHex: result.boingTxIdHex,
      deployedAccountId: null,
    });
    scheduleBoingDeployReceiptFollowup(result.boingTxIdHex, (id) => {
      setLastDeployedAccount(id);
      showBoingContractIncludedToast(id);
    });
  }, [
    customBytecode,
    descriptionHash,
    getWalletProvider,
    poolLabel,
    poolSymbol,
    purposeCategory,
    qaPoolAcknowledged,
  ]);

  if (!isBoingTestnetChainId(chainId) || walletType !== 'boingExpress' || !isConnected) {
    return null;
  }

  return (
    <section
      className="mb-6 rounded-xl border p-5 text-left"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'rgba(59, 130, 246, 0.45)',
      }}
    >
      <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        Deploy native CP pool contract
      </h3>
      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
        For operators bringing up a <strong>new</strong> constant-product pool: QA defaults to{' '}
        <code className="text-[10px]">purpose_category: dapp</code> per Boing native AMM docs. After deploy, configure the pool
        id in env / <code className="text-[10px]">contracts.js</code>.{' '}
        <Link to="/boing/native-vm" className="text-cyan-400 underline text-sm">
          Native VM
        </Link>
      </p>

      {hasBundled ? (
        <p
          className="text-xs rounded-lg px-3 py-2 mb-3 border"
          style={{
            borderColor: 'rgba(59, 130, 246, 0.35)',
            color: 'var(--text-secondary)',
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>Pool bytecode found in env.</strong> Leave Advanced override empty
          to use it.
        </p>
      ) : (
        <p
          className="text-xs rounded-lg px-3 py-2 mb-3 border"
          style={{ borderColor: 'rgba(251, 191, 36, 0.45)', color: 'var(--text-secondary)' }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>No pool bytecode in env.</strong> {envHint}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Pool label (optional — QA display)
          </label>
          <input
            type="text"
            value={poolLabel}
            onChange={(e) => setPoolLabel(e.target.value)}
            placeholder="Native CP Pool"
            className="w-full text-sm p-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Pool symbol (optional)
          </label>
          <input
            type="text"
            value={poolSymbol}
            onChange={(e) => setPoolSymbol(e.target.value)}
            placeholder="POOL"
            className="w-full text-sm p-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

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
          onClick={runDeploy}
          disabled={deployBlocked}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--finance-primary)' }}
        >
          Deploy pool via Boing Express
        </button>
      </div>

      <details className="mb-1 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
        <summary className="cursor-pointer text-sm font-medium px-3 py-2" style={{ color: 'var(--text-primary)' }}>
          Advanced — bytecode override, description hash, QA purpose
        </summary>
        <div className="px-3 pb-3 pt-1 space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
              QA purpose (default dapp for pool bytecode)
            </label>
            <select
              value={purposeCategory}
              onChange={(e) => setPurposeCategory(e.target.value)}
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
              placeholder={hasBundled ? 'Leave empty for env template…' : '0x…'}
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
              description_hash (optional)
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
            style={{ backgroundColor: 'var(--finance-purple)' }}
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
        <div className="text-xs mt-3 space-y-1" style={{ color: 'var(--text-secondary)' }}>
          <p className="font-mono break-all">Submit ack: {lastTx}</p>
          {lastDeployedAccount && (
            <a
              href={getBoingObserverAccountUrl(lastDeployedAccount)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 underline block"
            >
              View pool contract on boing.observer
            </a>
          )}
          {lastBoingTxId && !lastDeployedAccount && (
            <a
              href={getBoingObserverTxUrl(lastBoingTxId)}
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
}

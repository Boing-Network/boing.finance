import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { isBoingTestnetChainId } from 'boing-sdk';
import { useWallet } from '../contexts/WalletContext';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import NativeVmTokenPickerField from './NativeVmTokenPickerField';
import {
  computeEffectiveNativeDeployBytecode,
  getBundledNativePoolBytecodeHex,
  preflightBoingLaunchWizardByKind,
} from '../services/boingNativeLaunchWizardDeploy';
import { createBoingNativeConstantProductPool } from '../services/boingNativeCreatePool';
import { BOING_QA_PURPOSE_OPTIONS, isValidBoingQaPurpose } from '../config/boingQa';
import { showDeployCelebration } from '../utils/deployCelebration';
import { buildBoingExplorerAccountUrl, buildBoingExplorerTxUrl } from '../config/boingExplorerUrls';

const DEFAULT_POOL_PURPOSE = 'dapp';

function shortHex(h) {
  if (!h || typeof h !== 'string') return '—';
  const t = h.trim();
  if (t.length < 18) return t || '—';
  return `${t.slice(0, 10)}…${t.slice(-6)}`;
}

/**
 * Deploy a new native constant-product pool, bind two token ids, and seed the first add_liquidity.
 */
export default function NativeBoingCreatePoolPanel() {
  const { chainId, walletType, isConnected, getWalletProvider, account } = useWallet();
  const { explorerBaseUrl, venues, indexerPickerTokens, effectiveFactoryHex } = useBoingNativeDexIntegration();

  const [tokenA, setTokenA] = useState('');
  const [tokenB, setTokenB] = useState('');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [poolLabel, setPoolLabel] = useState('');
  const [poolSymbol, setPoolSymbol] = useState('');
  const [purposeCategory, setPurposeCategory] = useState(DEFAULT_POOL_PURPOSE);
  const [customBytecode, setCustomBytecode] = useState('');
  const [descriptionHash, setDescriptionHash] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [qaBusy, setQaBusy] = useState(false);
  const [qaResult, setQaResult] = useState(null);
  const [qaPoolAcknowledged, setQaPoolAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const bundledBytecode = useMemo(() => getBundledNativePoolBytecodeHex(), []);
  const effectiveBytecode = useMemo(
    () => computeEffectiveNativeDeployBytecode(customBytecode, bundledBytecode),
    [customBytecode, bundledBytecode]
  );
  const deployBlocked = !effectiveBytecode || (qaResult?.result === 'unsure' && !qaPoolAcknowledged);

  if (!isBoingTestnetChainId(chainId)) return null;

  if (walletType !== 'boingExpress' || !isConnected) {
    return (
      <section
        className="mb-6 rounded-xl border p-5 text-left"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'rgba(59, 130, 246, 0.45)' }}
      >
        <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Create a native pool
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Connect <strong>Boing Express</strong> on Boing testnet (6913) to deploy a constant-product pool, bind two token
          accounts, and seed the first liquidity. This is not the EVM factory form.
        </p>
      </section>
    );
  }

  const runQa = async () => {
    if (!effectiveBytecode) {
      toast.error(
        bundledBytecode
          ? 'Bytecode missing — fix the Advanced override.'
          : 'Set BOING_NATIVE_AMM_BYTECODE_HEX / REACT_APP_BOING_NATIVE_AMM_BYTECODE_HEX, or paste pool bytecode under Advanced.'
      );
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

  const onCreate = async () => {
    if (deployBlocked) {
      toast.error(
        !effectiveBytecode
          ? 'Pool bytecode is not available in this build. Operators: publish native AMM bytecode, or paste it under Advanced.'
          : 'QA returned unsure — acknowledge the community pool checkbox first.'
      );
      return;
    }
    setBusy(true);
    setLastResult(null);
    try {
      const result = await createBoingNativeConstantProductPool({
        getWalletProvider,
        account,
        tokenAHex: tokenA,
        tokenBHex: tokenB,
        amountA,
        amountB,
        factoryHex: effectiveFactoryHex,
        poolLabel,
        poolSymbol,
        purposeCategory,
        qaPoolAcknowledged,
        customBytecode,
        descriptionHash,
      });
      setLastResult(result);
      if (!result.ok) {
        toast.error(result.message || 'Could not create the native pool.');
        return;
      }
      for (const w of result.warnings || []) {
        toast(w, { icon: 'ℹ️', duration: 7000 });
      }
      showDeployCelebration({
        deploymentKind: 'Native liquidity pool',
        details: [
          { label: 'Pool', value: result.poolId },
          { label: 'Token A', value: shortHex(tokenA) },
          { label: 'Token B', value: shortHex(tokenB) },
          ...(result.registerSkipped ? [{ label: 'Factory', value: 'Not registered (see note)' }] : []),
        ],
        boingTxIdHex: result.boingTxIdHex,
        contractAddress: result.poolId,
        explorerBaseUrl,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className="mb-6 rounded-xl border p-5 text-left"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'rgba(59, 130, 246, 0.45)' }}
    >
      <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        Create a native pool
      </h3>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        Deploys constant-product pool bytecode, calls <code className="text-[10px]">set_tokens</code>, then{' '}
        <code className="text-[10px]">add_liquidity</code> with your amounts (that first deposit sets the ratio). If a
        factory id is published, the app also tries <code className="text-[10px]">register_pair</code>. First-seed
        liquidity is an MVP donation into the pool — there is no Uniswap-style LP NFT on this path.{' '}
        <Link to="/boing/native-vm" className="text-cyan-400 underline">
          Native VM
        </Link>
      </p>

      <div className="grid gap-3 sm:grid-cols-2 mb-3">
        <NativeVmTokenPickerField
          label="Token A"
          value={tokenA}
          onChange={setTokenA}
          excludeHex={tokenB}
          venueTokens={venues}
          indexerTokens={indexerPickerTokens}
          inputTestId="native-create-pool-token-a"
        />
        <NativeVmTokenPickerField
          label="Token B"
          value={tokenB}
          onChange={setTokenB}
          excludeHex={tokenA}
          venueTokens={venues}
          indexerTokens={indexerPickerTokens}
          inputTestId="native-create-pool-token-b"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mb-3">
        <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Token A amount (integer units)
          <input
            type="text"
            inputMode="numeric"
            value={amountA}
            onChange={(e) => setAmountA(e.target.value)}
            className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            placeholder="1000000"
          />
        </label>
        <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Token B amount (integer units)
          <input
            type="text"
            inputMode="numeric"
            value={amountB}
            onChange={(e) => setAmountB(e.target.value)}
            className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            placeholder="1000000"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mb-3">
        <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Pool label (optional)
          <input
            type="text"
            value={poolLabel}
            onChange={(e) => setPoolLabel(e.target.value)}
            className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </label>
        <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Pool symbol (optional)
          <input
            type="text"
            value={poolSymbol}
            onChange={(e) => setPoolSymbol(e.target.value)}
            className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </label>
      </div>

      <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
        Factory: {effectiveFactoryHex ? shortHex(effectiveFactoryHex) : 'not published — pair will not be listed until an operator registers it'}
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={runQa}
          disabled={qaBusy || busy}
          className="px-4 py-2 rounded-lg text-sm font-medium border"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          {qaBusy ? 'Checking QA…' : 'Run QA'}
        </button>
        <button
          type="button"
          onClick={onCreate}
          disabled={busy || deployBlocked || !tokenA || !tokenB || !amountA || !amountB}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
          style={{ background: 'var(--accent-teal, #0891b2)' }}
        >
          {busy ? 'Creating pool…' : 'Create native pool'}
        </button>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="px-4 py-2 rounded-lg text-sm border"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
        >
          {showAdvanced ? 'Hide advanced' : 'Advanced bytecode'}
        </button>
      </div>

      {qaResult?.result === 'unsure' && (
        <label className="flex items-start gap-2 text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
          <input
            type="checkbox"
            checked={qaPoolAcknowledged}
            onChange={(e) => setQaPoolAcknowledged(e.target.checked)}
          />
          QA is unsure — send this deploy to the community QA pool.
        </label>
      )}

      {showAdvanced && (
        <div className="space-y-3 mb-3">
          <label className="block text-sm" style={{ color: 'var(--text-secondary)' }}>
            QA purpose
            <select
              value={purposeCategory}
              onChange={(e) => setPurposeCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              {BOING_QA_PURPOSE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label || opt.value}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm" style={{ color: 'var(--text-secondary)' }}>
            Bytecode override (hex)
            <textarea
              value={customBytecode}
              onChange={(e) => setCustomBytecode(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-xs font-mono"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              placeholder={bundledBytecode ? 'Leave empty to use bundled pool bytecode' : '0x…'}
            />
          </label>
          <label className="block text-sm" style={{ color: 'var(--text-secondary)' }}>
            Description hash (optional)
            <input
              type="text"
              value={descriptionHash}
              onChange={(e) => setDescriptionHash(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-xs font-mono"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </label>
        </div>
      )}

      {lastResult?.ok && lastResult.poolId && (
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Pool{' '}
          <a
            className="text-cyan-400 underline"
            href={buildBoingExplorerAccountUrl(explorerBaseUrl, lastResult.poolId)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {shortHex(lastResult.poolId)}
          </a>
          {lastResult.deployTxHash ? (
            <>
              {' '}
              ·{' '}
              <a
                className="text-cyan-400 underline"
                href={buildBoingExplorerTxUrl(explorerBaseUrl, lastResult.boingTxIdHex || lastResult.deployTxHash)}
                target="_blank"
                rel="noopener noreferrer"
              >
                deploy tx
              </a>
            </>
          ) : null}
        </p>
      )}
    </section>
  );
}

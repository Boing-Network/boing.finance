import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { boingPoolBytecodeHex, isBoingTestnetChainId } from 'boing-sdk';
import { KNOWN_BOING_TOKENS } from '../services/boingSwapQuote';
import { useWallet } from '../contexts/WalletContext';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import NativeVmTokenPickerField from './NativeVmTokenPickerField';
import CompanionLinkGate from './CompanionLinkGate';
import {
  computeEffectiveNativeDeployBytecode,
  getBundledNativePoolBytecodeHex,
  preflightBoingLaunchWizardByKind,
} from '../services/boingNativeLaunchWizardDeploy';
import { createBoingNativeConstantProductPool } from '../services/boingNativeCreatePool';
import { BOING_QA_PURPOSE_OPTIONS, isValidBoingQaPurpose } from '../config/boingQa';
import { showDeployCelebration } from '../utils/deployCelebration';
import { buildBoingExplorerAccountUrl, buildBoingExplorerTxUrl } from '../config/boingExplorerUrls';
import { isBoingNativeAccountIdHex } from '../utils/boingWalletDiscovery';

const DEFAULT_POOL_PURPOSE = 'dapp';

function shortHex(h) {
  if (!h || typeof h !== 'string') return '—';
  const t = h.trim();
  if (t.length < 18) return t || '—';
  return `${t.slice(0, 10)}…${t.slice(-6)}`;
}

/**
 * Deploy a new native constant-product pool, bind two token ids, and seed the first add_liquidity.
 * Primary surface: pick two tokens + amounts + create. Advanced / other flows stay collapsed.
 */
export default function NativeBoingCreatePoolPanel() {
  const { chainId, walletType, isConnected, getWalletProvider, account } = useWallet();
  const { explorerBaseUrl, venues, indexerPickerTokens, effectiveFactoryHex } = useBoingNativeDexIntegration();
  const [searchParams] = useSearchParams();

  const projectCollection = String(searchParams.get('collection') || '').trim();
  const projectToken = String(searchParams.get('token') || '').trim();
  const requireCompanions = searchParams.get('requireCompanions') === '1';
  const projectGateActive =
    requireCompanions &&
    isBoingNativeAccountIdHex(projectCollection) &&
    isBoingNativeAccountIdHex(projectToken);

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
  const [companionsLinked, setCompanionsLinked] = useState(!projectGateActive);

  useEffect(() => {
    if (isBoingNativeAccountIdHex(projectToken) && !tokenA) {
      setTokenA(projectToken);
    }
  }, [projectToken, tokenA]);

  // `?pair=usdc` (default when a token is prefilled) / `?pair=0x…` prefills Token B.
  const pairParam = String(searchParams.get('pair') || '').trim().toLowerCase();
  useEffect(() => {
    if (tokenB) return;
    const want = isBoingNativeAccountIdHex(pairParam)
      ? pairParam
      : pairParam || (isBoingNativeAccountIdHex(projectToken) ? 'usdc' : '');
    if (!want) return;
    const hit = isBoingNativeAccountIdHex(want)
      ? want
      : Object.keys(KNOWN_BOING_TOKENS).find((id) => KNOWN_BOING_TOKENS[id].symbol.toLowerCase() === want);
    if (hit && hit.toLowerCase() !== String(projectToken).toLowerCase()) setTokenB(hit);
  }, [pairParam, projectToken, tokenB]);

  useEffect(() => {
    if (!projectGateActive) setCompanionsLinked(true);
  }, [projectGateActive]);

  // Custody pool v8 (token-v2 pairs, approvals, swaps through the swap card) unless an operator overrides it.
  const bundledBytecode = useMemo(() => {
    try {
      return boingPoolBytecodeHex(8);
    } catch {
      return getBundledNativePoolBytecodeHex();
    }
  }, []);
  const effectiveBytecode = useMemo(
    () => computeEffectiveNativeDeployBytecode(customBytecode, bundledBytecode),
    [customBytecode, bundledBytecode]
  );
  const deployBlocked =
    !effectiveBytecode ||
    (qaResult?.result === 'unsure' && !qaPoolAcknowledged) ||
    (projectGateActive && !companionsLinked);

  if (!isBoingTestnetChainId(chainId)) return null;

  if (walletType !== 'boingExpress' || !isConnected) {
    return (
      <section className="td-card text-left mb-6 p-5" data-testid="native-create-pool-connect">
        <h3 className="td-section-title mb-1">Create a pool</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Connect <strong>Boing Express</strong> on Boing testnet to pick two tokens and seed the first liquidity.
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
        customBytecode: customBytecode.trim() || bundledBytecode,
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
    if (projectGateActive && !companionsLinked) {
      toast.error('Link your collection and token before creating the pool.');
      return;
    }
    if (deployBlocked) {
      toast.error(
        !effectiveBytecode
          ? 'Pool bytecode is not available in this build. Operators: publish native AMM bytecode, or paste it under Advanced.'
          : projectGateActive && !companionsLinked
            ? 'Link your collection and token before creating the pool.'
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
    <section className="td-card text-left mb-6 p-5 sm:p-6" data-testid="native-create-pool-panel">
      <h3 className="td-section-title mb-1">Create a pool</h3>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        Pick two tokens and deposit the first liquidity. That first deposit sets the starting price. Express will ask
        you to approve each step.
      </p>

      {projectGateActive ? (
        <div className="mb-4">
          <CompanionLinkGate
            collectionId={projectCollection}
            tokenId={projectToken}
            actionLabel="Create pool"
            showUnlockLink={false}
            onStateChange={({ linked }) => setCompanionsLinked(Boolean(linked))}
          />
          <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Project pool — your token is prefilled as Token A. Pick a base token for Token B.
          </p>
        </div>
      ) : null}

      <div className="td-status td-status--info text-xs mb-4">
        <p className="mb-0">
          Don&apos;t see your token? Paste its AccountId below, then{' '}
          <strong style={{ color: 'var(--text-primary)' }}>Save current id to my tokens</strong>. Tokens you deploy on
          this browser are saved automatically. Tokens that never joined a pool may not appear in the network directory
          yet.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <NativeVmTokenPickerField
          label="Token A"
          value={tokenA}
          onChange={setTokenA}
          excludeHex={tokenB}
          venueTokens={venues}
          indexerTokens={indexerPickerTokens}
          inputTestId="native-create-pool-token-a"
          helpHint={false}
        />
        <NativeVmTokenPickerField
          label="Token B"
          value={tokenB}
          onChange={setTokenB}
          excludeHex={tokenA}
          venueTokens={venues}
          indexerTokens={indexerPickerTokens}
          inputTestId="native-create-pool-token-b"
          helpHint={false}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-4" id="initial-liquidity">
        <label className="td-field">
          <span className="td-field__label">Amount of Token A</span>
          <input
            type="text"
            inputMode="numeric"
            value={amountA}
            data-testid="create-pool-amount-a"
            onChange={(e) => setAmountA(e.target.value.replace(/[^\d]/g, ''))}
            className="td-field__input"
            placeholder="1000000"
          />
          <span className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Whole numbers only (no decimals in this flow).
          </span>
        </label>
        <label className="td-field">
          <span className="td-field__label">Amount of Token B</span>
          <input
            type="text"
            inputMode="numeric"
            value={amountB}
            data-testid="create-pool-amount-b"
            onChange={(e) => setAmountB(e.target.value.replace(/[^\d]/g, ''))}
            className="td-field__input"
            placeholder="1000000"
          />
          <span className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Whole numbers only (no decimals in this flow).
          </span>
        </label>
      </div>

      {!effectiveFactoryHex ? (
        <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
          Listing may take a moment after create — refresh Pools if your pair doesn&apos;t appear right away.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={onCreate}
          data-testid="create-pool-submit"
          disabled={
            busy ||
            deployBlocked ||
            !tokenA ||
            !tokenB ||
            !amountA ||
            !amountB ||
            (projectGateActive && !companionsLinked)
          }
          className="td-btn td-btn--primary disabled:opacity-50"
        >
          {busy
            ? 'Creating pool…'
            : projectGateActive && !companionsLinked
              ? 'Link collection & token first'
              : 'Create pool'}
        </button>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="td-btn td-btn--ghost"
          data-testid="create-pool-advanced-toggle"
        >
          {showAdvanced ? 'Hide advanced' : 'Advanced'}
        </button>
      </div>

      <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
        Need to swap or add liquidity to an existing pool?{' '}
        <Link className="td-btn td-btn--link text-xs" to="/swap">
          Swap
        </Link>
        {' · '}
        <Link className="td-btn td-btn--link text-xs" to="/liquidity">
          Liquidity
        </Link>
        {' · '}
        <Link className="td-btn td-btn--link text-xs" to="/pools">
          Pools
        </Link>
      </p>

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
        <div className="space-y-3 mb-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Optional label, review check, and bytecode overrides for operators.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="td-field">
              <span className="td-field__label">Pool label (optional)</span>
              <input
                type="text"
                value={poolLabel}
                onChange={(e) => setPoolLabel(e.target.value)}
                className="td-field__input"
              />
            </label>
            <label className="td-field">
              <span className="td-field__label">Pool symbol (optional)</span>
              <input
                type="text"
                value={poolSymbol}
                onChange={(e) => setPoolSymbol(e.target.value)}
                className="td-field__input"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={runQa}
            disabled={qaBusy || busy}
            className="td-btn td-btn--ghost text-sm"
          >
            {qaBusy ? 'Checking…' : 'Run review check'}
          </button>
          <label className="td-field">
            <span className="td-field__label">Review purpose</span>
            <select
              value={purposeCategory}
              onChange={(e) => setPurposeCategory(e.target.value)}
              className="td-field__input"
            >
              {BOING_QA_PURPOSE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label || opt.value}
                </option>
              ))}
            </select>
          </label>
          <label className="td-field">
            <span className="td-field__label">Bytecode override (hex)</span>
            <textarea
              value={customBytecode}
              onChange={(e) => setCustomBytecode(e.target.value)}
              rows={4}
              className="td-field__input text-xs font-mono"
              placeholder={bundledBytecode ? 'Leave empty to use bundled pool bytecode' : '0x…'}
            />
          </label>
          <label className="td-field">
            <span className="td-field__label">Description hash (optional)</span>
            <input
              type="text"
              value={descriptionHash}
              onChange={(e) => setDescriptionHash(e.target.value)}
              className="td-field__input text-xs font-mono"
            />
          </label>
        </div>
      )}

      {lastResult?.ok && lastResult.poolId && (
        <div
          className="mb-3 rounded-lg border p-3 text-sm"
          style={{ borderColor: 'var(--border-color)' }}
          data-testid="create-pool-success"
        >
          <p style={{ color: 'var(--text-primary)' }}>Pool created. It now shows in the swap token list and on Pools.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              className="td-btn td-btn--primary"
              to={`/swap?nativeTokenIn=${tokenB}&nativeTokenOut=${tokenA}`}
              data-testid="create-pool-swap-now"
            >
              Swap it now
            </Link>
            <Link className="td-btn td-btn--ghost" to="/pools">
              View in Pools
            </Link>
          </div>
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

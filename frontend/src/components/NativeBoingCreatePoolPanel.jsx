import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { boingPoolBytecodeHex, getBoingTokenBalance, isBoingTestnetChainId } from '@boing-network/boing-sdk';
import {
  BOING_DECIMALS,
  formatTokenAmount,
  isNativeBoingId,
  KNOWN_BOING_TOKENS,
  NATIVE_FEE_RESERVE,
  parseTokenAmount,
  sanitizeAmountInput,
  toAmountInput,
} from '../services/boingSwapQuote';
import { getSharedBoingClient } from '../services/boingNativeDexClient';
import { useWallet } from '../contexts/WalletContext';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import NativeVmTokenPickerField from './NativeVmTokenPickerField';
import { useTokenLabels } from '../hooks/useTokenLabels';
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
import { normalizeNativeVmTokenId32 } from '../services/nativeVmTokenRegistry';

const DEFAULT_POOL_PURPOSE = 'dapp';

function shortHex(h) {
  if (!h || typeof h !== 'string') return '—';
  const t = h.trim();
  if (t.length < 18) return t || '—';
  return `${t.slice(0, 10)}…${t.slice(-6)}`;
}

function normTokenId(id) {
  return normalizeNativeVmTokenId32(id) || String(id || '').trim().toLowerCase();
}

/** Decimals for amount fields: known tokens (BOING=18), then directory / indexer, else whole units (0). */
function decimalsForToken(id, indexerTokens = [], venues = []) {
  const n = normTokenId(id);
  if (!n) return 0;
  if (isNativeBoingId(n)) return BOING_DECIMALS;
  const known = KNOWN_BOING_TOKENS[n]?.decimals;
  if (typeof known === 'number') return known;
  for (const t of indexerTokens || []) {
    if (normTokenId(t?.id) === n && typeof t.decimals === 'number') return t.decimals;
  }
  for (const v of venues || []) {
    if (normTokenId(v?.tokenAHex) === n && typeof v.tokenADecimals === 'number') return v.tokenADecimals;
    if (normTokenId(v?.tokenBHex) === n && typeof v.tokenBDecimals === 'number') return v.tokenBDecimals;
  }
  return 0;
}

function balanceDisplay(balance, decimals) {
  if (balance == null) return 'Balance: …';
  return `Balance: ${formatTokenAmount(balance, decimals, 4)}`;
}

/** Max fill for the amount field (human units). Keeps 1 BOING for fees when the side is native BOING. */
function maxAmountInput(balance, tokenId, decimals) {
  if (balance == null || balance <= 0n) return '';
  const spend = isNativeBoingId(tokenId) && balance > NATIVE_FEE_RESERVE ? balance - NATIVE_FEE_RESERVE : balance;
  return spend > 0n ? toAmountInput(spend, decimals) : '';
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
  const labelOf = useTokenLabels([tokenA, tokenB]);
  const symA = tokenA && labelOf(tokenA.toLowerCase()).resolved ? labelOf(tokenA.toLowerCase()).symbol : 'Token A';
  const symB = tokenB && labelOf(tokenB.toLowerCase()).resolved ? labelOf(tokenB.toLowerCase()).symbol : 'Token B';
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [balances, setBalances] = useState(/** @type {Record<string, bigint | null>} */ ({}));
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
  const client = useMemo(() => getSharedBoingClient(), []);

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

  // Wallet balances for the selected Token A / Token B (same sources as Swap / Liquidity).
  useEffect(() => {
    if (!isConnected || !account || walletType !== 'boingExpress') {
      setBalances({});
      return undefined;
    }
    let off = false;
    const ids = [tokenA, tokenB].map(normTokenId).filter(Boolean);
    if (!ids.length) {
      setBalances({});
      return undefined;
    }
    const readOne = async (id) => {
      if (isNativeBoingId(id)) {
        return BigInt((await client.getAccount(account))?.balance ?? 0);
      }
      return getBoingTokenBalance(client, id, account);
    };
    Promise.all(
      ids.map(async (id) => {
        try {
          return [id, await readOne(id)];
        } catch {
          return [id, null];
        }
      })
    ).then((rows) => {
      if (!off) setBalances(Object.fromEntries(rows));
    });
    return () => {
      off = true;
    };
  }, [client, isConnected, account, walletType, tokenA, tokenB]);

  const balA = tokenA ? balances[normTokenId(tokenA)] : null;
  const balB = tokenB ? balances[normTokenId(tokenB)] : null;
  const decA = decimalsForToken(tokenA, indexerPickerTokens, venues);
  const decB = decimalsForToken(tokenB, indexerPickerTokens, venues);
  const amountABase = parseTokenAmount(amountA, decA);
  const amountBBase = parseTokenAmount(amountB, decB);

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
    if (!amountABase || !amountBBase) {
      toast.error(
        !amountA?.trim() || !amountB?.trim()
          ? 'Enter positive amounts for both tokens.'
          : 'Amounts must match each token decimals (BOING allows up to 18 fraction digits; most test tokens are whole units).'
      );
      return;
    }
    if ((balA != null && amountABase > balA) || (balB != null && amountBBase > balB)) {
      toast.error('Amount exceeds wallet balance.');
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
        amountA: amountABase.toString(),
        amountB: amountBBase.toString(),
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
          { label: 'Token A', value: `${labelOf(tokenA.toLowerCase()).symbol} (${shortHex(tokenA)})` },
          { label: 'Token B', value: `${labelOf(tokenB.toLowerCase()).symbol} (${shortHex(tokenB)})` },
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
        Pick two tokens and deposit the first liquidity. That first deposit sets the starting price. Boing Express will
        ask you to confirm up to four steps: deploy the pool, bind the tokens, seed liquidity, then register the pair.
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
          Pick tokens from the list. Missing one? Open{' '}
          <strong style={{ color: 'var(--text-primary)' }}>Paste custom token id</strong> under Token A or B, then save
          it to my tokens. Deploys on this browser are saved automatically.
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
          hideAddressField
          balanceLabel={tokenA && isConnected ? balanceDisplay(balA, decA) : null}
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
          hideAddressField
          balanceLabel={tokenB && isConnected ? balanceDisplay(balB, decB) : null}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-4" id="initial-liquidity">
        <label className="td-field">
          <span className="td-field__label flex items-baseline justify-between gap-2">
            <span>Amount of {symA}</span>
            {tokenA && isConnected ? (
              <button
                type="button"
                className="text-xs font-normal hover:underline tabular-nums"
                style={{ color: 'var(--text-tertiary)' }}
                data-testid="create-pool-balance-a"
                onClick={() => setAmountA(maxAmountInput(balA, tokenA, decA))}
                title="Use wallet balance"
              >
                {balanceDisplay(balA, decA)}
              </button>
            ) : null}
          </span>
          <input
            type="text"
            inputMode={decA ? 'decimal' : 'numeric'}
            value={amountA}
            data-testid="create-pool-amount-a"
            onChange={(e) => setAmountA(sanitizeAmountInput(e.target.value, decA))}
            className="td-field__input"
            placeholder={decA ? '200' : '1000000'}
          />
          <span className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {decA
              ? `Human amount (${decA} decimals). Example: 200 = 200 ${symA}.`
              : 'Whole units (this token has 0 decimals).'}
          </span>
        </label>
        <label className="td-field">
          <span className="td-field__label flex items-baseline justify-between gap-2">
            <span>Amount of {symB}</span>
            {tokenB && isConnected ? (
              <button
                type="button"
                className="text-xs font-normal hover:underline tabular-nums"
                style={{ color: 'var(--text-tertiary)' }}
                data-testid="create-pool-balance-b"
                onClick={() => setAmountB(maxAmountInput(balB, tokenB, decB))}
                title="Use wallet balance"
              >
                {balanceDisplay(balB, decB)}
              </button>
            ) : null}
          </span>
          <input
            type="text"
            inputMode={decB ? 'decimal' : 'numeric'}
            value={amountB}
            data-testid="create-pool-amount-b"
            onChange={(e) => setAmountB(sanitizeAmountInput(e.target.value, decB))}
            className="td-field__input"
            placeholder={decB ? '200' : '1000000'}
          />
          <span className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {decB
              ? `Human amount (${decB} decimals). Example: 200 = 200 ${symB}.`
              : 'Whole units (this token has 0 decimals).'}
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
            !amountABase ||
            !amountBBase ||
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
        <Link className="td-btn td-btn--link text-xs" to="/pools?tab=liquidity">
          Your liquidity
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
        <div className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
          <p className="mb-0">
            Pool{' '}
            <a
              className="text-cyan-400 underline"
              href={buildBoingExplorerAccountUrl(explorerBaseUrl, lastResult.poolId)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {shortHex(lastResult.poolId)}
            </a>
          </p>
          <ul className="list-none space-y-0.5 pl-0 mb-0">
            {lastResult.boingTxIdHex || lastResult.deployTxHash ? (
              <li>
                1. Deploy —{' '}
                <a
                  className="text-cyan-400 underline"
                  href={buildBoingExplorerTxUrl(explorerBaseUrl, lastResult.boingTxIdHex || lastResult.deployTxHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {shortHex(lastResult.boingTxIdHex || lastResult.deployTxHash)}
                </a>
              </li>
            ) : null}
            {lastResult.setTokensTxHash ? (
              <li>
                2. Bind tokens —{' '}
                <a
                  className="text-cyan-400 underline"
                  href={buildBoingExplorerTxUrl(explorerBaseUrl, lastResult.setTokensTxHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {shortHex(lastResult.setTokensTxHash)}
                </a>
              </li>
            ) : lastResult.setTokensSkipped ? (
              <li>2. Bind tokens — skipped</li>
            ) : null}
            {lastResult.addLiquidityTxHash ? (
              <li>
                3. Seed liquidity —{' '}
                <a
                  className="text-cyan-400 underline"
                  href={buildBoingExplorerTxUrl(explorerBaseUrl, lastResult.addLiquidityTxHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {shortHex(lastResult.addLiquidityTxHash)}
                </a>
              </li>
            ) : null}
            {lastResult.registerTxHash ? (
              <li>
                4. Register pair —{' '}
                <a
                  className="text-cyan-400 underline"
                  href={buildBoingExplorerTxUrl(explorerBaseUrl, lastResult.registerTxHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {shortHex(lastResult.registerTxHash)}
                </a>
              </li>
            ) : lastResult.registerSkipped ? (
              <li>4. Register pair — skipped (pool still exists)</li>
            ) : null}
          </ul>
        </div>
      )}
    </section>
  );
}

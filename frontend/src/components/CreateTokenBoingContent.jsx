/**
 * Create Token (Boing L1): Standard one-token deploy.
 * Platform fee = 0.5% of initial mint (live; matches bridge fee target).
 */
import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { isBoingTestnetChainId } from '@boing-network/boing-sdk';
import { useWallet } from '../contexts/WalletContext';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import {
  StatusBanner,
  TradeDeployButton,
} from './PageLayout';
import EmptyState from './EmptyState';
import { useConnectBoingExpress } from './BoingOnlyGate';
import {
  createTokenFeeNoticeText,
  getCreateTokenFeeLabel,
  planCreateTokenPlatformFee,
} from '../config/createTokenFee';
import {
  computeEffectiveNativeDeployBytecode,
  createBoingNativeToken,
  getBundledNativeFungibleBytecodeHex,
} from '../services/boingNativeCreateToken';
import { preflightBoingLaunchWizardByKind } from '../services/boingNativeLaunchWizardDeploy';
import { parseBoingTokenV2Supply, BOING_TOKEN_V2_DECIMALS } from '../services/boingTokenV2Launch';
import { tryParseEvenLengthDeployBytecodeHex } from '../utils/boingDeployBytecodeHex';
import { showDeployCelebration } from '../utils/deployCelebration';
import { buildBoingExplorerAccountUrl, buildBoingExplorerTxUrl } from '../config/boingExplorerUrls';
import { isValidBoingQaPurpose, BOING_QA_PURPOSE_TOKEN } from '../config/boingQa';

export default function CreateTokenBoingContent() {
  const { chainId, walletType, isConnected, getWalletProvider, account } = useWallet();
  const { explorerBaseUrl } = useBoingNativeDexIntegration();
  const { connect } = useConnectBoingExpress();

  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [supply, setSupply] = useState('1000000');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customBytecode, setCustomBytecode] = useState('');
  const [descriptionHash, setDescriptionHash] = useState('');
  const [qaBusy, setQaBusy] = useState(false);
  const [qaResult, setQaResult] = useState(null);
  const [qaPoolAcknowledged, setQaPoolAcknowledged] = useState(false);

  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const bundledBytecode = useMemo(() => getBundledNativeFungibleBytecodeHex(), []);
  const effectiveBytecode = useMemo(
    () => computeEffectiveNativeDeployBytecode(customBytecode, bundledBytecode),
    [customBytecode, bundledBytecode]
  );
  const deployBlocked =
    !effectiveBytecode || (qaResult?.result === 'unsure' && !qaPoolAcknowledged);

  const feePreview = useMemo(() => {
    try {
      const supplyBn = parseBoingTokenV2Supply(supply);
      return planCreateTokenPlatformFee(supplyBn);
    } catch {
      return planCreateTokenPlatformFee(0n);
    }
  }, [supply]);

  if (!isConnected) {
    return (
      <>
        <Helmet>
          <title>Create Token | boing.finance — Boing Network</title>
          <meta
            name="description"
            content="Create a fungible token on Boing Network. One-token Standard deploy with a platform fee as a percent of initial mint."
          />
        </Helmet>
        <div className="relative z-10 container mx-auto px-4 py-8" data-testid="create-token-page">
          <div className="mx-auto max-w-3xl">
            <div className="td-card p-6">
              <EmptyState
                variant="tokens"
                title="Connect Boing Express"
                description="Connect to create a token on Boing Network."
                action={connect}
                actionLabel="Connect Boing Express"
                secondaryLabel="Browse pools"
                secondaryHref="/pools"
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!isBoingTestnetChainId(chainId) || walletType !== 'boingExpress') {
    return (
      <>
        <Helmet>
          <title>Create Token | boing.finance</title>
        </Helmet>
        <div className="relative z-10 container mx-auto px-4 py-8" data-testid="create-token-wrong-wallet">
          <div className="mx-auto max-w-xl td-card p-6 text-center">
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Use Boing Express
            </h1>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Token creation runs on Boing Network and needs Boing Express connected.
            </p>
            <TradeDeployButton type="button" onClick={connect}>
              Connect Boing Express
            </TradeDeployButton>
          </div>
        </div>
      </>
    );
  }

  const runQa = async () => {
    const n = name.trim();
    const s = symbol.trim().toUpperCase();
    if (!n || !s) {
      toast.error('Enter a token name and symbol first.');
      return;
    }
    if (!effectiveBytecode) {
      toast.error(
        bundledBytecode
          ? 'Fix or clear the Advanced bytecode field.'
          : 'Boing token v2 template missing from this build — update boing-sdk.'
      );
      return;
    }
    if (!isValidBoingQaPurpose(BOING_QA_PURPOSE_TOKEN)) {
      toast.error('Invalid QA purpose.');
      return;
    }
    setQaBusy(true);
    setQaResult(null);
    setQaPoolAcknowledged(false);
    try {
      const { qa } = await preflightBoingLaunchWizardByKind('token', {
        tokenName: n,
        tokenSymbol: s,
        customBytecode,
        descriptionHash,
        purpose: BOING_QA_PURPOSE_TOKEN,
      });
      setQaResult(qa);
      if (qa.result === 'allow') toast.success('Review check: allow');
      else if (qa.result === 'reject') toast.error(qa.message || 'Review check: reject');
      else toast('Review check: unsure — may go to community pool', { icon: '⚠️' });
    } catch (e) {
      toast.error(e?.message || 'boing_qaCheck failed');
    } finally {
      setQaBusy(false);
    }
  };

  const celebrateOne = (result, tokenName, tokenSymbol) => {
    const fee = result.platformFee;
    const details = [
      { label: 'Name', value: tokenName },
      { label: 'Symbol', value: tokenSymbol },
      { label: 'Supply', value: `${result.supply} (whole units)` },
      { label: 'Token', value: result.tokenHex },
    ];
    if (fee?.feeAmount > 0n) {
      details.push({
        label: 'Platform fee',
        value: `${fee.feeLabel} → ${fee.feeAmount.toString()} tokens`,
      });
    }
    showDeployCelebration({
      deploymentKind: 'Boing token',
      details,
      boingTxIdHex: result.boingTxIdHex,
      contractAddress: result.tokenHex,
      explorerBaseUrl,
    });
  };

  const onCreateStandard = async () => {
    const n = name.trim();
    const s = symbol.trim().toUpperCase();
    if (!n || !s) {
      toast.error('Name and symbol are required.');
      return;
    }
    try {
      parseBoingTokenV2Supply(supply);
    } catch (e) {
      toast.error(e?.message || 'Invalid supply.');
      return;
    }
    if (deployBlocked) {
      toast.error(
        !effectiveBytecode
          ? 'Token bytecode is not available in this build.'
          : 'QA returned unsure — acknowledge the community pool checkbox first.'
      );
      return;
    }
    setBusy(true);
    setLastResult(null);
    setStage(null);
    try {
      const result = await createBoingNativeToken({
        getWalletProvider,
        account,
        name: n,
        symbol: s,
        supply,
        customBytecode,
        descriptionHash,
        qaPoolAcknowledged,
        onStage: setStage,
      });
      setLastResult(result);
      if (!result.ok) {
        toast.error(result.message || 'Could not create the token.');
        return;
      }
      celebrateOne(result, n, s);
      if (result.feeCollection && !result.feeCollection.skipped && !result.feeCollection.ok) {
        toast.error(result.feeCollection.message || 'Token created, but platform fee transfer failed.');
      } else if (!result.confirmed) {
        toast('Submitted — waiting for inclusion. Check boing.observer shortly.', { icon: 'ℹ️' });
      }
    } finally {
      setBusy(false);
      setStage(null);
    }
  };

  const stageLabel =
    {
      qa: 'Running review check…',
      sign: 'Approve in Boing Express…',
      submit: 'Submitting…',
      confirm: 'Waiting for inclusion…',
      fee_sign: 'Approve platform fee transfer…',
      fee_submit: 'Submitting platform fee…',
      fee_confirm: 'Confirming platform fee…',
    }[stage] || null;

  return (
    <>
      <Helmet>
        <title>Create Token | boing.finance — Boing Network</title>
        <meta
          name="description"
          content="Create a fungible token on Boing Network. Standard one-token deploy with a platform fee as a percent of initial mint."
        />
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 py-8" data-testid="create-token-page">
        <div className="mx-auto max-w-3xl space-y-4">
          <header>
            <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Create Token
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Name it, set the supply, then publish on Boing Network. Whole units only (no decimals).
            </p>
          </header>

          <StatusBanner variant="info">
            <p className="text-sm mb-0">
              Boing token <strong style={{ color: 'var(--text-primary)' }}>v2</strong> — one Express signature creates
              the token. Your wallet receives the mint minus the platform fee (fee goes to treasury at deploy). Nobody
              can mint more afterwards. Add a pool next to make it swappable.
            </p>
          </StatusBanner>

          <StatusBanner variant="warn" data-testid="create-token-fee-notice">
            <p className="text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
              Platform fee: <strong>{getCreateTokenFeeLabel()} of initial mint</strong>
            </p>
            <p className="text-xs mb-0" style={{ color: 'var(--text-secondary)' }}>
              {createTokenFeeNoticeText(feePreview)}
              {feePreview.feeAmount > 0n ? (
                <>
                  {' '}
                  Preview for this supply: <strong>{feePreview.feeAmount.toString()}</strong> fee tokens ·{' '}
                  <strong>{feePreview.creatorAmount.toString()}</strong> remain with you after collection.
                </>
              ) : null}
            </p>
          </StatusBanner>

          <section className="td-card text-left p-5 sm:p-6" data-testid="create-token-panel">
            <h2 className="td-section-title mb-1">Standard</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Create one fungible token. Express will ask once to approve the deploy
              {feePreview.collectionReady ? ' (platform fee is credited to treasury in that same approval)' : ''}.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 mb-4">
              <label className="td-field">
                <span className="td-field__label">Name *</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="td-field__input"
                  placeholder="My Token"
                  data-testid="create-token-name"
                  autoComplete="off"
                />
              </label>
              <label className="td-field">
                <span className="td-field__label">Symbol *</span>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="td-field__input"
                  placeholder="MTK"
                  maxLength={32}
                  data-testid="create-token-symbol"
                  autoComplete="off"
                />
              </label>
            </div>
            <label className="td-field mb-4 block">
              <span className="td-field__label">Initial supply *</span>
              <input
                type="text"
                inputMode="numeric"
                value={supply}
                onChange={(e) => setSupply(e.target.value.replace(/[^\d_,\s]/g, ''))}
                className="td-field__input"
                placeholder="1000000"
                data-testid="create-token-supply"
              />
              <span className="text-xs mt-1 block" style={{ color: 'var(--text-tertiary)' }}>
                Whole numbers only · {BOING_TOKEN_V2_DECIMALS} decimals (all units go to your account at mint)
              </span>
            </label>

            <div className="flex flex-wrap gap-2 mb-3">
              <TradeDeployButton
                type="button"
                onClick={onCreateStandard}
                disabled={busy || deployBlocked || !name.trim() || !symbol.trim() || !supply.trim()}
                data-testid="create-token-submit"
              >
                {busy ? stageLabel || 'Creating…' : 'Create token'}
              </TradeDeployButton>
              <TradeDeployButton
                type="button"
                variant="ghost"
                onClick={() => setShowAdvanced((v) => !v)}
                data-testid="create-token-advanced-toggle"
              >
                {showAdvanced ? 'Hide advanced' : 'Advanced'}
              </TradeDeployButton>
            </div>

            <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
              After create:{' '}
              <Link className="td-btn td-btn--link text-xs" to="/create-pool">
                Create pool
              </Link>
              {' · '}
              <Link className="td-btn td-btn--link text-xs" to="/swap">
                Swap
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

            {stageLabel && (
              <p role="status" className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                {stageLabel}
              </p>
            )}

            {showAdvanced && (
              <div className="space-y-3 mb-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Optional review check and bytecode override for operators. Leave bytecode empty to use Boing token
                  v2 from boing-sdk.
                </p>
                <button
                  type="button"
                  onClick={runQa}
                  disabled={qaBusy || busy || !name.trim() || !symbol.trim()}
                  className="td-btn td-btn--ghost text-sm"
                >
                  {qaBusy ? 'Checking…' : 'Run review check'}
                </button>
                <label className="td-field">
                  <span className="td-field__label">Bytecode override (hex)</span>
                  <textarea
                    value={customBytecode}
                    onChange={(e) => setCustomBytecode(e.target.value)}
                    rows={4}
                    className="td-field__input text-xs font-mono"
                    placeholder={bundledBytecode ? 'Leave empty for Boing token v2' : '0x…'}
                  />
                  {customBytecode.trim() && !tryParseEvenLengthDeployBytecodeHex(customBytecode) ? (
                    <span className="text-xs text-amber-400 mt-1 block">Enter even-length hex (optional 0x).</span>
                  ) : null}
                </label>
                <label className="td-field">
                  <span className="td-field__label">Description hash (optional)</span>
                  <input
                    type="text"
                    value={descriptionHash}
                    onChange={(e) => setDescriptionHash(e.target.value)}
                    className="td-field__input text-xs font-mono"
                    placeholder="0x…"
                  />
                </label>
              </div>
            )}

            {lastResult?.ok && lastResult.tokenHex ? (
              <div
                className="rounded-lg border p-3 text-sm"
                style={{ borderColor: 'var(--border-color)' }}
                data-testid="create-token-success"
              >
                <p style={{ color: 'var(--text-primary)' }}>
                  Token created. Create a pool with USDC to make it swappable.
                </p>
                {lastResult.platformFee?.feeAmount > 0n ? (
                  <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }} data-testid="create-token-fee-result">
                    Platform fee {lastResult.platformFee.feeLabel}: {lastResult.platformFee.feeAmount.toString()} tokens
                    {lastResult.feeCollection?.skipped
                      ? ' — collection deferred (treasury not configured).'
                      : lastResult.feeCollection?.mintedAtDeploy
                        ? ' — credited to treasury at deploy.'
                      : lastResult.feeCollection?.ok
                        ? ' — transferred to treasury.'
                        : lastResult.feeCollection?.ok === false
                          ? ` — transfer failed: ${lastResult.feeCollection.message || 'unknown error'}`
                          : '.'}
                  </p>
                ) : null}
                <p className="text-xs mt-2 font-mono break-all" style={{ color: 'var(--text-secondary)' }}>
                  {lastResult.tokenHex}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    className="td-btn td-btn--primary"
                    to={`/create-pool?token=${lastResult.tokenHex}&pair=usdc`}
                    data-testid="create-token-make-pool"
                  >
                    Create a pool
                  </Link>
                  <a
                    className="td-btn td-btn--ghost"
                    href={buildBoingExplorerAccountUrl(explorerBaseUrl, lastResult.tokenHex)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on explorer
                  </a>
                  {lastResult.boingTxIdHex || lastResult.txHash ? (
                    <a
                      className="td-btn td-btn--ghost"
                      href={buildBoingExplorerTxUrl(
                        explorerBaseUrl,
                        lastResult.boingTxIdHex || lastResult.txHash
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Deploy tx
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </>
  );
}

/**
 * Create Token (Boing L1): Standard (one token) and Large set (CSV batch).
 * Fresh Finance UX — same shell language as Create Pool / Staking.
 */
import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { isBoingTestnetChainId } from '@boing-network/boing-sdk';
import { useWallet } from '../contexts/WalletContext';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import {
  SegmentedControl,
  StatusBanner,
  TradeDeployButton,
} from './PageLayout';
import EmptyState from './EmptyState';
import { useConnectBoingExpress } from './BoingOnlyGate';
import {
  computeEffectiveNativeDeployBytecode,
  createBoingNativeToken,
  createBoingNativeTokenBatch,
  getBundledNativeFungibleBytecodeHex,
} from '../services/boingNativeCreateToken';
import { preflightBoingLaunchWizardByKind } from '../services/boingNativeLaunchWizardDeploy';
import { parseBoingTokenV2Supply, BOING_TOKEN_V2_DECIMALS } from '../services/boingTokenV2Launch';
import { tryParseEvenLengthDeployBytecodeHex } from '../utils/boingDeployBytecodeHex';
import { showDeployCelebration } from '../utils/deployCelebration';
import {
  parseTokenCreateCsv,
  TOKEN_CREATE_CSV_MAX_ROWS,
  TOKEN_CREATE_CSV_TEMPLATE,
} from '../utils/tokenCreateCsv';
import { buildBoingExplorerAccountUrl, buildBoingExplorerTxUrl } from '../config/boingExplorerUrls';
import { isValidBoingQaPurpose, BOING_QA_PURPOSE_TOKEN } from '../config/boingQa';

function shortHex(h) {
  if (!h || typeof h !== 'string') return '—';
  const t = h.trim();
  if (t.length < 18) return t || '—';
  return `${t.slice(0, 10)}…${t.slice(-6)}`;
}

const MODE_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'large', label: 'Large set' },
];

export default function CreateTokenBoingContent() {
  const { chainId, walletType, isConnected, getWalletProvider, account } = useWallet();
  const { explorerBaseUrl } = useBoingNativeDexIntegration();
  const { connect } = useConnectBoingExpress();

  const [mode, setMode] = useState('standard');

  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [supply, setSupply] = useState('1000000');

  const [csvText, setCsvText] = useState('');
  const [csvFileName, setCsvFileName] = useState('');
  const parsedCsv = useMemo(() => (csvText ? parseTokenCreateCsv(csvText) : null), [csvText]);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customBytecode, setCustomBytecode] = useState('');
  const [descriptionHash, setDescriptionHash] = useState('');
  const [qaBusy, setQaBusy] = useState(false);
  const [qaResult, setQaResult] = useState(null);
  const [qaPoolAcknowledged, setQaPoolAcknowledged] = useState(false);

  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(null);
  const [batchProgress, setBatchProgress] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [batchResults, setBatchResults] = useState(null);

  const bundledBytecode = useMemo(() => getBundledNativeFungibleBytecodeHex(), []);
  const effectiveBytecode = useMemo(
    () => computeEffectiveNativeDeployBytecode(customBytecode, bundledBytecode),
    [customBytecode, bundledBytecode]
  );
  const deployBlocked =
    !effectiveBytecode || (qaResult?.result === 'unsure' && !qaPoolAcknowledged);

  if (!isConnected) {
    return (
      <>
        <Helmet>
          <title>Create Token | boing.finance — Boing Network</title>
          <meta
            name="description"
            content="Create a fungible token on Boing Network. Standard one-token deploy or Large set CSV batch."
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
    showDeployCelebration({
      deploymentKind: 'Boing token',
      details: [
        { label: 'Name', value: tokenName },
        { label: 'Symbol', value: tokenSymbol },
        { label: 'Supply', value: `${result.supply} (whole units)` },
        { label: 'Token', value: result.tokenHex },
      ],
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
    setBatchResults(null);
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
      if (!result.confirmed) {
        toast('Submitted — waiting for inclusion. Check boing.observer shortly.', { icon: 'ℹ️' });
      }
    } finally {
      setBusy(false);
      setStage(null);
    }
  };

  const onCsvFile = async (file) => {
    if (!file) return;
    setCsvFileName(file.name);
    const text = await file.text();
    setCsvText(text);
    setBatchResults(null);
  };

  const onCreateLargeSet = async () => {
    if (!parsedCsv || parsedCsv.rows.length === 0) {
      toast.error('Upload a valid CSV with name, symbol, and supply columns.');
      return;
    }
    if (parsedCsv.errors.length) {
      toast.error(parsedCsv.errors[0]);
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
    setBatchResults(null);
    setBatchProgress({ done: 0, total: parsedCsv.rows.length });
    try {
      const results = await createBoingNativeTokenBatch({
        rows: parsedCsv.rows,
        getWalletProvider,
        account,
        customBytecode,
        descriptionHash,
        qaPoolAcknowledged,
        continueOnError: false,
        onProgress: ({ index, total, phase }) => {
          if (phase === 'start') setBatchProgress({ done: index, total, labeling: `Signing ${index + 1} of ${total}…` });
          if (phase === 'done') setBatchProgress({ done: index + 1, total });
        },
      });
      setBatchResults(results);
      const okCount = results.filter((r) => r.result?.ok).length;
      const lastOk = [...results].reverse().find((r) => r.result?.ok);
      if (okCount === 0) {
        toast.error(results[0]?.result?.message || 'No tokens were created.');
        return;
      }
      toast.success(`Created ${okCount} of ${results.length} token${results.length === 1 ? '' : 's'}.`);
      if (lastOk?.result) {
        celebrateOne(lastOk.result, lastOk.row.name, lastOk.row.symbol);
      }
    } finally {
      setBusy(false);
      setBatchProgress(null);
    }
  };

  const stageLabel =
    {
      qa: 'Running review check…',
      sign: 'Approve in Boing Express…',
      submit: 'Submitting…',
      confirm: 'Waiting for inclusion…',
    }[stage] || null;

  return (
    <>
      <Helmet>
        <title>Create Token | boing.finance — Boing Network</title>
        <meta
          name="description"
          content="Create a fungible token on Boing Network. Standard one-token deploy or Large set CSV batch."
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

          <SegmentedControl
            aria-label="Create token mode"
            value={mode}
            onChange={(v) => {
              setMode(v);
              setLastResult(null);
              setBatchResults(null);
            }}
            options={MODE_OPTIONS}
          />

          <StatusBanner variant="info">
            <p className="text-sm mb-0">
              Boing token <strong style={{ color: 'var(--text-primary)' }}>v2</strong> — one Express signature creates
              the token and puts the whole supply in your account. Nobody can mint more afterwards. Add a pool next to
              make it swappable.
            </p>
          </StatusBanner>

          <section className="td-card text-left p-5 sm:p-6" data-testid="create-token-panel">
            {mode === 'standard' ? (
              <>
                <h2 className="td-section-title mb-1">Standard</h2>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Create one fungible token. Express will ask you to approve the deploy.
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
                    Whole numbers only · {BOING_TOKEN_V2_DECIMALS} decimals (all units go to your account)
                  </span>
                </label>
              </>
            ) : (
              <>
                <h2 className="td-section-title mb-1">Large set</h2>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Upload a CSV to create up to {TOKEN_CREATE_CSV_MAX_ROWS} tokens. Each row needs its own Express
                  approval — keep the set small enough to finish in one sitting.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <a
                    className="td-btn td-btn--ghost text-sm"
                    href="/templates/token-create-batch.csv"
                    download="token-create-batch.csv"
                    data-testid="create-token-csv-template"
                  >
                    Download CSV template
                  </a>
                  <label className="td-btn td-btn--ghost text-sm cursor-pointer">
                    Upload CSV
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="sr-only"
                      data-testid="create-token-csv-input"
                      onChange={(e) => onCsvFile(e.target.files?.[0])}
                    />
                  </label>
                  <button
                    type="button"
                    className="td-btn td-btn--link text-sm"
                    onClick={() => {
                      setCsvText(TOKEN_CREATE_CSV_TEMPLATE);
                      setCsvFileName('example.csv');
                    }}
                  >
                    Load example
                  </button>
                </div>
                {csvFileName ? (
                  <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
                    File: {csvFileName}
                  </p>
                ) : null}
                {parsedCsv?.errors?.length ? (
                  <StatusBanner variant="warn" className="mb-3">
                    <ul className="text-sm list-disc pl-4 mb-0">
                      {parsedCsv.errors.slice(0, 5).map((err) => (
                        <li key={err}>{err}</li>
                      ))}
                    </ul>
                  </StatusBanner>
                ) : null}
                {parsedCsv?.warnings?.length ? (
                  <p className="text-xs mb-3 text-amber-300">{parsedCsv.warnings.join(' ')}</p>
                ) : null}
                {parsedCsv?.rows?.length ? (
                  <div className="mb-4 overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
                    <table className="w-full text-sm" data-testid="create-token-csv-preview">
                      <thead>
                        <tr style={{ color: 'var(--text-tertiary)' }}>
                          <th className="text-left px-3 py-2 font-medium">#</th>
                          <th className="text-left px-3 py-2 font-medium">Name</th>
                          <th className="text-left px-3 py-2 font-medium">Symbol</th>
                          <th className="text-left px-3 py-2 font-medium">Supply</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedCsv.rows.map((row, i) => (
                          <tr key={`${row.symbol}-${i}`} style={{ color: 'var(--text-primary)' }}>
                            <td className="px-3 py-2 tabular-nums">{i + 1}</td>
                            <td className="px-3 py-2">{row.name}</td>
                            <td className="px-3 py-2 font-mono">{row.symbol}</td>
                            <td className="px-3 py-2 tabular-nums">{row.supply}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
                    Columns: <code className="text-xs">name</code>, <code className="text-xs">symbol</code>,{' '}
                    <code className="text-xs">supply</code>
                  </p>
                )}
              </>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
              <TradeDeployButton
                type="button"
                onClick={mode === 'standard' ? onCreateStandard : onCreateLargeSet}
                disabled={
                  busy ||
                  deployBlocked ||
                  (mode === 'standard'
                    ? !name.trim() || !symbol.trim() || !supply.trim()
                    : !parsedCsv?.rows?.length || Boolean(parsedCsv?.errors?.length))
                }
                data-testid="create-token-submit"
              >
                {busy
                  ? mode === 'large' && batchProgress
                    ? `Creating ${batchProgress.done}/${batchProgress.total}…`
                    : stageLabel || 'Creating…'
                  : mode === 'standard'
                    ? 'Create token'
                    : `Create ${parsedCsv?.rows?.length || 0} token${(parsedCsv?.rows?.length || 0) === 1 ? '' : 's'}`}
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

            {(stageLabel || batchProgress?.labeling) && (
              <p role="status" className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                {batchProgress?.labeling || stageLabel}
              </p>
            )}

            {showAdvanced && (
              <div className="space-y-3 mb-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Optional review check and bytecode override for operators. Leave bytecode empty to use Boing token
                  v2 from boing-sdk.
                </p>
                {mode === 'standard' ? (
                  <button
                    type="button"
                    onClick={runQa}
                    disabled={qaBusy || busy || !name.trim() || !symbol.trim()}
                    className="td-btn td-btn--ghost text-sm"
                  >
                    {qaBusy ? 'Checking…' : 'Run review check'}
                  </button>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Large set runs the review check automatically before each deploy.
                  </p>
                )}
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

            {batchResults?.length ? (
              <div
                className="rounded-lg border p-3 text-sm space-y-2"
                style={{ borderColor: 'var(--border-color)' }}
                data-testid="create-token-batch-results"
              >
                <p style={{ color: 'var(--text-primary)' }}>
                  Batch results · {batchResults.filter((r) => r.result?.ok).length} ok / {batchResults.length} tried
                </p>
                <ul className="space-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {batchResults.map(({ row, result }, i) => (
                    <li key={`${row.symbol}-${i}`} className="font-mono break-all">
                      {row.symbol}:{' '}
                      {result.ok ? (
                        <>
                          <a
                            className="text-cyan-400 underline"
                            href={buildBoingExplorerAccountUrl(explorerBaseUrl, result.tokenHex)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {shortHex(result.tokenHex)}
                          </a>
                          {' · '}
                          <Link
                            className="text-cyan-400 underline"
                            to={`/create-pool?token=${result.tokenHex}&pair=usdc`}
                          >
                            pool
                          </Link>
                        </>
                      ) : (
                        <span className="text-amber-300">{result.message || 'failed'}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </>
  );
}

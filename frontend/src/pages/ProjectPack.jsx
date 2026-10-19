import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import {
  planProjectPackPair,
  executeProjectPackDeployTx,
  linkProjectPackCompanions,
  getProjectPackRegistryReady,
} from '../services/projectPackDeploy';
import { scheduleBoingDeployReceiptFollowup } from '../services/boingDeployReceiptFollowup';
import {
  BOING_OBSERVER_BASE_URL,
  buildBoingExplorerAccountUrl,
} from '../config/boingExplorerUrls';
import { isBoingNativeAccountIdHex } from '../utils/boingWalletDiscovery';
import { rememberAssetDeployer } from '../utils/linkedNftToken';
import { rememberDeployedNativeVmToken } from '../services/nativeVmTokenRegistry';
import CompanionLinkGate from '../components/CompanionLinkGate';
import BuilderAttestationPanel from '../components/BuilderAttestationPanel';
import { buildProjectPoolPath } from '../services/linkedNftTokenRegistry';
import { parseBoingTokenV2Supply } from '../services/boingTokenV2Launch';
import { PROJECT_PACK_DEFAULT_TOKEN_SUPPLY, formatPackSupply } from '../config/projectPack';
import {
  TradeDeployShell,
  TradeDeployHero,
  StepRail,
  PageCard,
  TradeDeployButton,
} from '../components/PageLayout';

const STEPS = [
  { id: 'details', label: 'Details' },
  { id: 'collection', label: 'Collection' },
  { id: 'token', label: 'Token' },
  { id: 'link', label: 'Link' },
  { id: 'done', label: 'Done' },
];

// v3: both deploys claim themselves in the linked NFT↔token registry v2 from their init code (and the
// collection sets its admin), which changes both predicted addresses; v2 / v1 drafts are not resumed.
const STORAGE_KEY = 'boing.finance.projectPack.v3';

function supplyError(raw) {
  try {
    parseBoingTokenV2Supply(raw);
    return null;
  } catch (e) {
    return e?.message || 'Enter a whole-number supply.';
  }
}

function loadDraft() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveDraft(state) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function shortId(hex) {
  const t = String(hex || '');
  if (t.length < 18) return t;
  return `${t.slice(0, 10)}…${t.slice(-8)}`;
}

function CopyField({ label, value }) {
  if (!value) return null;
  return (
    <div className="rounded-xl border px-3 py-2.5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
      <div className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </div>
      <div className="flex items-center gap-2">
        <code className="text-xs font-mono break-all flex-1" style={{ color: 'var(--text-primary)' }}>
          {value}
        </code>
        <button
          type="button"
          className="text-xs shrink-0 underline"
          style={{ color: 'var(--finance-primary)' }}
          onClick={() => {
            void navigator.clipboard?.writeText(value);
            toast.success('Copied');
          }}
        >
          Copy
        </button>
      </div>
    </div>
  );
}

export default function ProjectPack() {
  const { account, isConnected, walletType, getWalletProvider, connectWallet } = useWallet();
  const dexIntegration = useBoingNativeDexIntegration();
  const explorerBaseUrl = dexIntegration?.explorerBaseUrl || BOING_OBSERVER_BASE_URL;
  const defaults = dexIntegration?.defaults || null;
  const endUser = defaults?.endUser || defaults?.end_user || null;
  const networkInfo = defaults?.networkInfo || null;

  const draft = useMemo(() => loadDraft(), []);

  const [step, setStep] = useState(draft?.step || 'details');
  const [projectName, setProjectName] = useState(draft?.projectName || '');
  const [collectionName, setCollectionName] = useState(draft?.collectionName || '');
  const [collectionSymbol, setCollectionSymbol] = useState(draft?.collectionSymbol || '');
  const [tokenName, setTokenName] = useState(draft?.tokenName || '');
  const [tokenSymbol, setTokenSymbol] = useState(draft?.tokenSymbol || '');
  const [tokenSupply, setTokenSupply] = useState(draft?.tokenSupply || PROJECT_PACK_DEFAULT_TOKEN_SUPPLY.toString());
  const [collectionSaltHex, setCollectionSaltHex] = useState(draft?.collectionSaltHex || '');
  const [predictedCollection, setPredictedCollection] = useState(draft?.predictedCollection || '');
  const [predictedToken, setPredictedToken] = useState(draft?.predictedToken || '');
  const [collectionId, setCollectionId] = useState(draft?.collectionId || '');
  const [tokenId, setTokenId] = useState(draft?.tokenId || '');
  const [collectionTx, setCollectionTx] = useState(draft?.collectionTx || '');
  const [tokenTx, setTokenTx] = useState(draft?.tokenTx || '');
  const [linkTx, setLinkTx] = useState(draft?.linkTx || '');
  const [linked, setLinked] = useState(Boolean(draft?.linked));
  const [busy, setBusy] = useState(false);
  const [qaAck, setQaAck] = useState(false);
  const [pairCache, setPairCache] = useState(null);

  const expressOk = isConnected && walletType === 'boingExpress';
  const registry = useMemo(
    () => getProjectPackRegistryReady({ endUser, networkInfo }),
    [endUser, networkInfo]
  );

  const displayProject =
    projectName.trim() ||
    collectionName.trim() ||
    tokenName.trim() ||
    'Your project';

  useEffect(() => {
    if (step === 'done' && linked) {
      clearDraft();
      return;
    }
    saveDraft({
      step,
      projectName,
      collectionName,
      collectionSymbol,
      tokenName,
      tokenSymbol,
      tokenSupply,
      collectionSaltHex,
      predictedCollection,
      predictedToken,
      collectionId,
      tokenId,
      collectionTx,
      tokenTx,
      linkTx,
      linked,
    });
  }, [
    step,
    projectName,
    collectionName,
    collectionSymbol,
    tokenName,
    tokenSymbol,
    tokenSupply,
    collectionSaltHex,
    predictedCollection,
    predictedToken,
    collectionId,
    tokenId,
    collectionTx,
    tokenTx,
    linkTx,
    linked,
  ]);

  const tokenSupplyError = supplyError(tokenSupply);
  const supplyLabel = tokenSupplyError ? '' : formatPackSupply(parseBoingTokenV2Supply(tokenSupply));
  const symbolLabel = tokenSymbol.trim().toUpperCase() || 'tokens';
  // The token address depends on the supply (it is part of the deploy bytecode), and the collection's
  // deploy already names that address: freeze the supply once the collection is on chain.
  const supplyLocked = Boolean(collectionTx);

  const rebuildPlan = () => {
    if (!account || !isBoingNativeAccountIdHex(account)) return null;
    try {
      const plan = planProjectPackPair({
        deployerHex: account,
        collectionName,
        collectionSymbol,
        tokenName,
        tokenSymbol,
        tokenSupply,
        collectionSaltHex: collectionSaltHex || undefined,
        note: projectName.trim() || undefined,
        registryOpts: { endUser, networkInfo },
      });
      setCollectionSaltHex(plan.collectionSaltHex);
      setPredictedCollection(plan.predictedCollectionAddress);
      setPredictedToken(plan.predictedTokenAddress);
      setPairCache(plan);
      return plan;
    } catch (e) {
      toast.error(e?.message || 'Could not plan project');
      return null;
    }
  };

  const onContinueDetails = () => {
    const plan = rebuildPlan();
    if (!plan) return;
    setStep('collection');
  };

  const onDeployCollection = async () => {
    if (!expressOk) {
      toast.error('Connect Boing Express to create your collection.');
      return;
    }
    const plan = pairCache || rebuildPlan();
    if (!plan) return;
    setBusy(true);
    try {
      const result = await executeProjectPackDeployTx({
        getWalletProvider,
        tx: plan.collectionDeployTx,
        qaPoolAcknowledged: qaAck,
        senderHex: account,
      });
      if (!result.ok) {
        if (result.code === 'qa_unsure_unack') setQaAck(false);
        toast.error(result.message);
        return;
      }
      setCollectionTx(result.txHash);
      const predicted = plan.predictedCollectionAddress;
      setCollectionId(predicted);
      setPredictedCollection(predicted);
      if (account) rememberAssetDeployer(predicted, account);
      if (result.boingTxIdHex) {
        scheduleBoingDeployReceiptFollowup(result.boingTxIdHex, (id) => {
          setCollectionId(id);
          if (account) rememberAssetDeployer(id, account);
        });
      }
      toast.success('Collection ready');
      setStep('token');
    } finally {
      setBusy(false);
    }
  };

  const onDeployToken = async () => {
    if (!expressOk) {
      toast.error('Connect Boing Express to create your token.');
      return;
    }
    const plan = pairCache || rebuildPlan();
    if (!plan) return;
    setBusy(true);
    try {
      const result = await executeProjectPackDeployTx({
        getWalletProvider,
        tx: plan.tokenDeployTx,
        qaPoolAcknowledged: qaAck,
        senderHex: account,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setTokenTx(result.txHash);
      const predicted = plan.predictedTokenAddress;
      setTokenId(predicted);
      setPredictedToken(predicted);
      if (account) rememberAssetDeployer(predicted, account);
      rememberDeployedNativeVmToken({
        id: predicted,
        symbol: String(tokenSymbol || '').trim().toUpperCase() || 'TOKEN',
        name: String(tokenName || '').trim() || 'Project token',
      });
      if (result.boingTxIdHex) {
        scheduleBoingDeployReceiptFollowup(result.boingTxIdHex, (id) => {
          setTokenId(id);
          if (account) rememberAssetDeployer(id, account);
          rememberDeployedNativeVmToken({
            id,
            symbol: String(tokenSymbol || '').trim().toUpperCase() || 'TOKEN',
            name: String(tokenName || '').trim() || 'Project token',
          });
        });
      }
      toast.success(`Token ready: ${formatPackSupply(plan.tokenSupply)} ${tokenSymbol.toUpperCase()} are in your wallet`);
      setStep('link');
    } finally {
      setBusy(false);
    }
  };

  const onLinkCompanions = async () => {
    if (!expressOk) {
      toast.error('Connect Boing Express to link companions.');
      return;
    }
    const c = collectionId || predictedCollection;
    const t = tokenId || predictedToken;
    if (!c || !t) {
      toast.error('Collection and token are needed before linking.');
      return;
    }
    setBusy(true);
    try {
      const plan = pairCache || rebuildPlan();
      const result = await linkProjectPackCompanions({
        getWalletProvider,
        collectionId: c,
        tokenId: t,
        linker: account,
        endUser,
        networkInfo,
        deployerAccount: account,
        registerFlowTxs: plan?.registerFlowTxs || null,
      });
      if (!result.ok) {
        toast.error(
          result.code === 'registry_unpublished'
            ? 'Companion linking is not available on this network yet.'
            : result.code === 'invalid_nonce'
              ? 'A previous step is still settling. Wait a moment, then try Link companions again.'
              : result.message || 'Could not link companions'
        );
        return;
      }
      if (result.txHash) setLinkTx(result.txHash);
      else if (result.txHashes?.length) setLinkTx(result.txHashes[result.txHashes.length - 1]);
      setLinked(true);
      toast.success('Companions linked');
      setStep('done');
    } finally {
      setBusy(false);
    }
  };

  const detailsReady =
    collectionName.trim() &&
    collectionSymbol.trim() &&
    tokenName.trim() &&
    tokenSymbol.trim() &&
    !tokenSupplyError;

  return (
    <>
      <Helmet>
        <title>Project pack | boing.finance</title>
        <meta
          name="description"
          content="Launch a project: create an NFT collection and a token, then connect them in one guided flow."
        />
      </Helmet>
      <TradeDeployShell width="narrow">
          <TradeDeployHero
            eyebrow="Launch"
            title="Project pack"
            subtitle="Create an NFT collection and a project token, then connect them so wallets and explorers show them as one project."
          />

          {step !== 'done' ? (
            <StepRail
              steps={STEPS.filter((s) => s.id !== 'done')}
              currentId={step}
            />
          ) : null}

          {!isConnected ? (
            <PageCard className="text-center">
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Connect to start
              </h2>
              <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
                Use Boing Express so you can create your collection and token, then connect them in one place.
              </p>
              <TradeDeployButton type="button" variant="green" onClick={() => connectWallet?.()}>
                Connect wallet
              </TradeDeployButton>
            </PageCard>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28 }}
                className="td-card min-w-0 overflow-x-hidden"
              >
                {step === 'details' ? (
                  <>
                    <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      Name your project
                    </h2>
                    <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
                      Tell us the collection and token you want to launch together.
                    </p>
                    <div className="space-y-4">
                      <label className="block">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                          Project name (optional)
                        </span>
                        <input
                          type="text"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          placeholder="e.g. Neon Garden"
                          className="mt-1 w-full px-3 py-2.5 rounded-lg text-sm"
                          style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="block">
                          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                            Collection name
                          </span>
                          <input
                            type="text"
                            value={collectionName}
                            onChange={(e) => setCollectionName(e.target.value)}
                            placeholder="Collection name"
                            className="mt-1 w-full px-3 py-2.5 rounded-lg text-sm"
                            style={{
                              backgroundColor: 'var(--bg-tertiary)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-primary)',
                            }}
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                            Collection symbol
                          </span>
                          <input
                            type="text"
                            value={collectionSymbol}
                            onChange={(e) => setCollectionSymbol(e.target.value)}
                            placeholder="e.g. NG"
                            className="mt-1 w-full px-3 py-2.5 rounded-lg text-sm uppercase"
                            style={{
                              backgroundColor: 'var(--bg-tertiary)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-primary)',
                            }}
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                            Token name
                          </span>
                          <input
                            type="text"
                            value={tokenName}
                            onChange={(e) => setTokenName(e.target.value)}
                            placeholder="Token name"
                            className="mt-1 w-full px-3 py-2.5 rounded-lg text-sm"
                            style={{
                              backgroundColor: 'var(--bg-tertiary)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-primary)',
                            }}
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                            Token symbol
                          </span>
                          <input
                            type="text"
                            value={tokenSymbol}
                            onChange={(e) => setTokenSymbol(e.target.value)}
                            placeholder="e.g. NGT"
                            className="mt-1 w-full px-3 py-2.5 rounded-lg text-sm uppercase"
                            style={{
                              backgroundColor: 'var(--bg-tertiary)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-primary)',
                            }}
                          />
                        </label>
                      </div>
                      <label className="block">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                          Token supply
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={tokenSupply}
                          onChange={(e) => setTokenSupply(e.target.value)}
                          disabled={supplyLocked}
                          placeholder={PROJECT_PACK_DEFAULT_TOKEN_SUPPLY.toString()}
                          aria-invalid={Boolean(tokenSupplyError)}
                          aria-describedby="project-pack-supply-help"
                          data-testid="project-pack-supply"
                          className="mt-1 w-full px-3 py-2.5 rounded-lg text-sm disabled:opacity-60"
                          style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            border: `1px solid ${tokenSupplyError ? 'rgba(239, 68, 68, 0.7)' : 'var(--border-color)'}`,
                            color: 'var(--text-primary)',
                          }}
                        />
                        <span id="project-pack-supply-help" className="mt-1 block text-xs" data-testid="project-pack-supply-help">
                          {tokenSupplyError ? (
                            <span style={{ color: 'rgb(248, 113, 113)' }}>{tokenSupplyError}</span>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)' }}>
                              You&apos;ll receive{' '}
                              <strong style={{ color: 'var(--text-primary)' }}>
                                {supplyLabel} {symbolLabel}
                              </strong>
                              . Whole tokens, no decimals; nobody can mint more later.
                              {supplyLocked ? ' Locked because your collection is already created.' : ''}
                            </span>
                          )}
                        </span>
                      </label>
                    </div>
                    {!expressOk ? (
                      <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Switch to Boing Express for this flow.
                      </p>
                    ) : null}
                    <div className="mt-6 flex flex-wrap gap-3 justify-between items-center">
                      <Link
                        to="/linked-project"
                        className="text-sm underline"
                        style={{ color: 'var(--finance-primary)' }}
                      >
                        Already have both? Manage links
                      </Link>
                      <button
                        type="button"
                        disabled={!detailsReady || !expressOk}
                        onClick={onContinueDetails}
                        className="px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                        style={{ backgroundColor: 'var(--finance-primary)', color: '#041018' }}
                      >
                        Continue
                      </button>
                    </div>
                  </>
                ) : null}

                {step === 'collection' ? (
                  <>
                    <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      Create the collection
                    </h2>
                    <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
                      Confirm to publish <strong style={{ color: 'var(--text-primary)' }}>{collectionName}</strong>{' '}
                      ({collectionSymbol.toUpperCase()}). Your collection id is ready below.
                    </p>
                    <CopyField label="Collection id (preview)" value={predictedCollection} />
                    <label
                      htmlFor="project-pack-qa-ack"
                      className="flex items-start gap-2.5 mt-4 text-sm cursor-pointer rounded-lg border px-3 py-2.5 min-w-0 w-full overflow-hidden"
                      style={{
                        borderColor: 'rgba(251, 191, 36, 0.45)',
                        color: 'var(--text-secondary)',
                        backgroundColor: 'rgba(251, 191, 36, 0.06)',
                      }}
                    >
                      <input
                        id="project-pack-qa-ack"
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border"
                        style={{ accentColor: 'var(--finance-primary)' }}
                        checked={qaAck}
                        onChange={(e) => setQaAck(e.target.checked)}
                      />
                      <span className="min-w-0 flex-1 break-words leading-snug">
                        I understand this may need an extra review before it goes live.
                      </span>
                    </label>
                    <div className="mt-6 flex flex-wrap gap-3 justify-between">
                      <button
                        type="button"
                        onClick={() => setStep('details')}
                        className="px-4 py-2 rounded-lg text-sm border"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={busy || !predictedCollection}
                        onClick={onDeployCollection}
                        className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                        style={{ backgroundColor: 'var(--finance-green-mid)' }}
                      >
                        {busy ? 'Creating…' : 'Create collection'}
                      </button>
                    </div>
                  </>
                ) : null}

                {step === 'token' ? (
                  <>
                    <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      Create the token
                    </h2>
                    <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
                      Collection is ready. Next, publish <strong style={{ color: 'var(--text-primary)' }}>{tokenName}</strong>{' '}
                      ({tokenSymbol.toUpperCase()}).
                    </p>
                    <div
                      className="rounded-xl border px-4 py-3 mb-4"
                      style={{ borderColor: 'rgba(16, 185, 129, 0.45)', backgroundColor: 'rgba(16, 185, 129, 0.08)' }}
                      data-testid="project-pack-supply-review"
                    >
                      <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                        You&apos;ll receive {supplyLabel} {symbolLabel}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        The full supply goes to your account ({shortId(account)}) in the same transaction that
                        creates the token. No allocations, no fees in tokens, and no one can mint more.
                      </p>
                    </div>
                    <div className="space-y-3 mb-4">
                      <CopyField label="Collection id" value={collectionId || predictedCollection} />
                      <CopyField label="Token id (preview)" value={predictedToken} />
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3 justify-between">
                      <button
                        type="button"
                        onClick={() => setStep('collection')}
                        className="px-4 py-2 rounded-lg text-sm border"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={busy || !predictedToken}
                        onClick={onDeployToken}
                        className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                        style={{ backgroundColor: 'var(--finance-green-mid)' }}
                      >
                        {busy ? 'Creating…' : 'Create token'}
                      </button>
                    </div>
                  </>
                ) : null}

                {step === 'link' ? (
                  <>
                    <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      Connect collection &amp; token
                    </h2>
                    <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
                      Link them as companions — one project. Other apps can show the connection once it is on-chain.
                    </p>
                    <div className="space-y-3 mb-4">
                      <CopyField label="Collection" value={collectionId || predictedCollection} />
                      <CopyField label="Token" value={tokenId || predictedToken} />
                    </div>
                    {!registry.canWrite ? (
                      <p
                        className="text-sm rounded-lg border px-3 py-2 mb-3"
                        style={{
                          borderColor: 'rgba(245, 158, 11, 0.5)',
                          backgroundColor: 'rgba(245, 158, 11, 0.08)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        Linking is not available on this network yet. You can finish later from{' '}
                        <Link to="/linked-project" className="underline" style={{ color: 'var(--finance-primary)' }}>
                          Manage links
                        </Link>
                        .
                      </p>
                    ) : null}
                    <div className="mt-6 flex flex-wrap gap-3 justify-between">
                      <button
                        type="button"
                        onClick={() => setStep('token')}
                        className="px-4 py-2 rounded-lg text-sm border"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={busy || !registry.canWrite}
                        onClick={onLinkCompanions}
                        className="px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                        style={{ backgroundColor: 'var(--finance-primary)', color: '#041018' }}
                      >
                        {busy ? 'Linking…' : 'Link collection & token'}
                      </button>
                    </div>
                  </>
                ) : null}

                {step === 'done' ? (
                  <>
                    <motion.div
                      initial={{ scale: 0.96, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    >
                      <p
                        className="text-xs font-semibold uppercase tracking-wide mb-2"
                        style={{ color: 'var(--finance-green-mid)' }}
                      >
                        Project ready
                      </p>
                      <h2
                        className="text-2xl sm:text-3xl font-bold mb-2"
                        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
                      >
                        {displayProject}
                      </h2>
                      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                        Your collection and token are connected. Next: view the project, or add a pool so people can trade.
                      </p>
                      <div className="space-y-3 mb-6">
                        <CopyField label="Collection" value={collectionId || predictedCollection} />
                        <CopyField label="Token" value={tokenId || predictedToken} />
                        {supplyLabel ? (
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }} data-testid="project-pack-done-supply">
                            Supply: <strong style={{ color: 'var(--text-primary)' }}>{supplyLabel} {symbolLabel}</strong>, all in your wallet.
                          </p>
                        ) : null}
                        <div
                          className="rounded-xl border px-3 py-2.5 text-sm"
                          style={{
                            borderColor: 'rgba(16, 185, 129, 0.45)',
                            backgroundColor: 'rgba(16, 185, 129, 0.08)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          Status: <strong>Linked</strong>
                          {linkTx ? (
                            <span className="block text-xs mt-1 font-mono" style={{ color: 'var(--text-tertiary)' }}>
                              {shortId(linkTx)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 mb-5">
                        <a
                          href={buildBoingExplorerAccountUrl(
                            explorerBaseUrl,
                            collectionId || predictedCollection
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
                          style={{ backgroundColor: 'var(--finance-green-mid)' }}
                        >
                          View project
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            clearDraft();
                            setStep('details');
                            setProjectName('');
                            setCollectionName('');
                            setCollectionSymbol('');
                            setTokenName('');
                            setTokenSymbol('');
                            setTokenSupply(PROJECT_PACK_DEFAULT_TOKEN_SUPPLY.toString());
                            setCollectionSaltHex('');
                            setPredictedCollection('');
                            setPredictedToken('');
                            setCollectionId('');
                            setTokenId('');
                            setCollectionTx('');
                            setTokenTx('');
                            setLinkTx('');
                            setLinked(false);
                            setPairCache(null);
                            setQaAck(false);
                          }}
                          className="px-4 py-2.5 rounded-lg text-sm underline"
                          style={{ color: 'var(--finance-primary)' }}
                        >
                          Start another project
                        </button>
                      </div>
                      <div className="mb-5 space-y-3">
                        <CompanionLinkGate
                          collectionId={collectionId || predictedCollection}
                          tokenId={tokenId || predictedToken}
                          actionLabel="Add a pool"
                          unlockedHref={buildProjectPoolPath({
                            collectionId: collectionId || predictedCollection,
                            tokenId: tokenId || predictedToken,
                          })}
                        />
                        <details className="rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
                          <summary
                            className="cursor-pointer text-xs font-medium px-3 py-2"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            Optional: show you&apos;re the builder
                          </summary>
                          <div className="px-3 pb-3">
                            <BuilderAttestationPanel
                              collectionId={collectionId || predictedCollection}
                              tokenId={tokenId || predictedToken}
                              requireCompanions
                            />
                          </div>
                        </details>
                      </div>
                      {(collectionTx || tokenTx) && (
                        <p className="mt-5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          Collection tx {shortId(collectionTx)}
                          {tokenTx ? ` · Token tx ${shortId(tokenTx)}` : ''}
                        </p>
                      )}
                    </motion.div>
                  </>
                ) : null}
              </motion.div>
            </AnimatePresence>
          )}

          <p className="mt-6 text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Prefer separate steps?{' '}
            <Link to="/create-nft" className="underline" style={{ color: 'var(--finance-primary)' }}>
              Create NFT
            </Link>
            {' · '}
            <Link to="/deploy-token" className="underline" style={{ color: 'var(--finance-primary)' }}>
              Deploy token
            </Link>
            {' · '}
            <Link to="/linked-project" className="underline" style={{ color: 'var(--finance-primary)' }}>
              Manage links
            </Link>
          </p>
      </TradeDeployShell>
    </>
  );
}

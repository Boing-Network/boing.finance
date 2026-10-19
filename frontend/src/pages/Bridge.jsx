import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useNetwork } from '../hooks/useNetwork';
import { useSolanaWallet } from '../contexts/SolanaWalletContext';
import { getApiUrl } from '../config';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { PLATFORM_BRIDGE_FEE, PLATFORM_BRIDGE_FEE_LABEL, buildLifiDeepLink } from '../config/bridge';
import TokenManagementModal from '../components/TokenManagementModal';
import ChainPicker from '../components/bridge/ChainPicker';
import TokenLogo from '../components/bridge/TokenLogo';
import EmptyState from '../components/EmptyState';
import { useLifiChains, useLifiTokens } from '../hooks/useLifi';
import { useBridgeBalances } from '../hooks/useBridgeBalances';
import { fetchLifiQuote, fetchLifiStatus } from '../services/lifiApi';
import { executeEvmStep, executeSolanaStep } from '../services/bridgeExecution';
import { transactionTrackingService } from '../services/transactionTrackingService.js';
import {
  canSignOnChainType,
  chainTypeLabel,
  explainLifiError,
  explainStatus,
  formatDuration,
  formatUsd,
  fromBaseUnits,
  isNativeTokenAddress,
  isValidAddressForChain,
  matchTokenOnChain,
  previewAddressForChain,
  sanitizeAmount,
  summarizeQuote,
  toBaseUnits,
} from '../utils/lifiCore';

const SLIPPAGE_OPTIONS = [0.1, 0.5, 1, 3];
const RECENT_KEY = 'boing_bridge_recent_v1';
const card = { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' };
const muted = { color: 'var(--text-tertiary)' };
const short = (a) => (a && a.length > 14 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a || '');
const scanUrl = (hash) => `https://scan.li.fi/tx/${hash}`;

function loadRecent() {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function saveRecent(list) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 20)));
  } catch {
    /* ignore */
  }
}

function errText(e, ctx) {
  return explainLifiError({ ...(e?.body || {}), status: e?.status, code: e?.code ?? e?.body?.code, message: e?.shortMessage || e?.message || '' }, ctx);
}

function TokenButton({ token, onClick, testId }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="td-btn td-btn--ghost shrink-0 justify-center gap-2"
      data-testid={testId}
      aria-label={`Token: ${token?.symbol || 'choose'}`}
    >
      {token && <TokenLogo src={token.logoURI} label={token.symbol} size={22} />}
      <span className="font-medium">{token?.symbol || 'Select token'}</span>
      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

const PHASE_LABEL = {
  switch: 'Switching your wallet to the sending network…',
  'approve-reset': 'Resetting the old token approval (confirm in your wallet)…',
  approve: 'Allow the bridge to use your token (confirm in your wallet)…',
  'approve-wait': 'Waiting for the approval to confirm…',
  send: 'Confirm the transfer in your wallet…',
  sent: 'Sent. Waiting for confirmation…',
  confirmed: 'Confirmed on the sending network. Bridging…',
};

export default function Bridge() {
  const wallet = useWalletConnection();
  const { account, chainId: walletChainId, walletType, getActiveEip1193, connectWithRetry } = wallet;
  const sol = useSolanaWallet();
  const { network } = useNetwork();
  const { chains, byId, loading: chainsLoading, error: chainsError, retry: retryChains } = useLifiChains();

  const [fromChainId, setFromChainId] = useState(1);
  const [toChainId, setToChainId] = useState(8453);
  const fromChain = byId.get(fromChainId) || null;
  const toChain = byId.get(toChainId) || null;
  const fromTokens = useLifiTokens(fromChainId);
  const toTokens = useLifiTokens(toChainId);
  const [fromToken, setFromToken] = useState(null);
  const [toToken, setToToken] = useState(null);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [tokenModal, setTokenModal] = useState(/** @type {null | 'from' | 'to'} */ (null));
  const [quoteState, setQuoteState] = useState({ step: null, summary: null, at: 0, error: '', loading: false, real: false });
  const [run, setRun] = useState(/** @type {any} */ (null));
  const [recent, setRecent] = useState(loadRecent);
  const [serverHistory, setServerHistory] = useState([]);
  const [howItWorksExpanded, setHowItWorksExpanded] = useState(false);
  const didDefaultChain = useRef(false);

  const evmAccount = walletType === 'boingExpress' ? null : account || null;
  const solAddress = sol.address || null;
  const fromBalances = useBridgeBalances(fromChain, { evmAccount, solanaAddress: solAddress });
  const toBalances = useBridgeBalances(toChain, { evmAccount, solanaAddress: solAddress });

  // Start from the wallet's network when it is a LI.FI chain.
  useEffect(() => {
    if (didDefaultChain.current || !chains.length || !evmAccount) return;
    const id = Number(walletChainId);
    if (byId.has(id) && id !== toChainId) {
      didDefaultChain.current = true;
      setFromChainId(id);
    }
  }, [chains.length, byId, evmAccount, walletChainId, toChainId]);

  // Keep the same asset when the network changes (USDC → USDC, ETH → ETH), else the gas token.
  useEffect(() => {
    if (!fromTokens.loading && fromTokens.tokens.length) {
      setFromToken((t) => (t && t.chainId === fromChainId ? t : matchTokenOnChain(t, fromTokens.tokens)));
    }
  }, [fromChainId, fromTokens.loading, fromTokens.tokens]);
  useEffect(() => {
    if (!toTokens.loading && toTokens.tokens.length) {
      setToToken((t) => (t && t.chainId === toChainId ? t : matchTokenOnChain(t, toTokens.tokens)));
    }
  }, [toChainId, toTokens.loading, toTokens.tokens]);

  // Bridge history saved by the API (best effort).
  useEffect(() => {
    if (!account) return;
    axios
      .get(`${getApiUrl()}/bridge/transactions`, { params: { address: account } })
      .then((r) => setServerHistory(r.data?.success ? r.data.data || [] : []))
      .catch(() => setServerHistory([]));
  }, [account]);

  const canSend = Boolean(fromChain && canSignOnChainType(fromChain.chainType));
  const sender = fromChain?.chainType === 'EVM' ? evmAccount : fromChain?.chainType === 'SVM' ? solAddress : null;
  const sameType = fromChain && toChain && fromChain.chainType === toChain.chainType;
  const walletForDest = toChain?.chainType === 'EVM' ? evmAccount : toChain?.chainType === 'SVM' ? solAddress : null;
  const [showRecipient, setShowRecipient] = useState(false);
  const needsRecipientField = Boolean(toChain && fromChain && (!sameType || showRecipient));
  const recipientTrim = recipient.trim();
  const recipientValid = recipientTrim ? isValidAddressForChain(recipientTrim, toChain) : false;
  const realRecipient = recipientTrim ? (recipientValid ? recipientTrim : null) : sameType && sender ? sender : walletForDest || null;
  const fromAmount = fromToken ? toBaseUnits(amount, fromToken.decimals) : null;
  const balanceRaw = fromBalances.balanceOf(fromToken);
  const insufficient = Boolean(fromAmount && balanceRaw != null && sender && BigInt(balanceRaw) < BigInt(fromAmount));
  const samePair = fromChainId === toChainId && fromToken && toToken && fromToken.address.toLowerCase() === toToken.address.toLowerCase();

  const quoteInput = useMemo(() => {
    if (!fromChain || !toChain || !fromToken || !toToken || !fromAmount || fromAmount === '0' || samePair || !canSend) return null;
    if (recipientTrim && !recipientValid) return null;
    const fromAddress = sender || previewAddressForChain(fromChain);
    const toAddress = realRecipient || previewAddressForChain(toChain);
    if (!fromAddress || !toAddress) return null;
    return {
      fromChain: fromChain.id,
      toChain: toChain.id,
      fromToken: fromToken.address,
      toToken: toToken.address,
      fromAmount,
      fromAddress,
      toAddress,
      slippage: slippage / 100,
      real: Boolean(sender && realRecipient),
    };
  }, [fromChain, toChain, fromToken, toToken, fromAmount, samePair, canSend, recipientTrim, recipientValid, sender, realRecipient, slippage]);
  const quoteKey = quoteInput ? JSON.stringify(quoteInput) : '';

  const getQuote = useCallback(
    async (input, signal) => {
      const step = await fetchLifiQuote(input, { signal });
      return { step, summary: summarizeQuote(step, { platformFee: input.fromChain !== input.toChain ? PLATFORM_BRIDGE_FEE : 0 }) };
    },
    []
  );

  useEffect(() => {
    if (!quoteInput) {
      setQuoteState({ step: null, summary: null, at: 0, error: '', loading: false, real: false });
      return undefined;
    }
    const ctrl = new AbortController();
    setQuoteState((s) => ({ ...s, loading: true, error: '' }));
    const timer = setTimeout(async () => {
      try {
        const { step, summary } = await getQuote(quoteInput, ctrl.signal);
        if (!ctrl.signal.aborted) setQuoteState({ step, summary, at: Date.now(), error: '', loading: false, real: quoteInput.real });
      } catch (e) {
        if (ctrl.signal.aborted || e?.name === 'AbortError') return;
        setQuoteState({ step: null, summary: null, at: 0, error: errText(e, { fromSymbol: fromToken?.symbol }), loading: false, real: false });
      }
    }, 700);
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- quoteKey captures quoteInput
  }, [quoteKey, getQuote]);

  // Track sent transfers with LI.FI GET /v1/status until they finish.
  const recentRef = useRef(recent);
  recentRef.current = recent;
  const updateRecent = useCallback((id, patch) => {
    setRecent((list) => {
      const next = list.map((r) => (r.id === id ? { ...r, ...patch } : r));
      saveRecent(next);
      return next;
    });
  }, []);
  const pendingIds = recent.filter((r) => r.state === 'pending' && r.txHash).map((r) => r.id).join(',');
  useEffect(() => {
    if (!pendingIds) return undefined;
    let stop = false;
    const tick = async () => {
      for (const r of recentRef.current.filter((x) => x.state === 'pending' && x.txHash)) {
        try {
          const st = await fetchLifiStatus({ txHash: r.txHash, bridge: r.tool, fromChain: r.fromChainId, toChain: r.toChainId });
          const { state, text } = explainStatus(st);
          if (stop) return;
          updateRecent(r.id, {
            state,
            statusText: text,
            receivingTx: st?.receiving?.txHash || r.receivingTx || '',
            receivingLink: st?.receiving?.txLink || r.receivingLink || '',
            sendingLink: st?.sending?.txLink || r.sendingLink || '',
            receivedAmount: st?.receiving?.amount || r.receivedAmount || '',
          });
          if (state !== 'pending') {
            if (state === 'done') toast.success(`${r.toSymbol} arrived on ${r.toChainName}`);
            else if (state === 'failed') toast.error('A bridge transfer failed. See Recent bridges.');
            fromBalances.refresh();
          }
        } catch {
          /* try again next round */
        }
      }
    };
    tick();
    const id = setInterval(tick, 12000);
    return () => {
      stop = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- poll while pending transfers exist
  }, [pendingIds, updateRecent]);

  const summary = quoteState.summary;
  const busy = Boolean(run && run.phase !== 'done' && run.phase !== 'error');

  const blocker = (() => {
    if (chainsError) return chainsError;
    if (!fromChain || !toChain) return chainsLoading ? 'Loading networks…' : 'Choose both networks.';
    if (!canSend) return `boing.finance can't send from ${fromChain.name} yet (no ${chainTypeLabel(fromChain.chainType)} wallet connection). You can still receive on ${fromChain.name} from another network.`;
    if (samePair) return 'Pick a different token or network to receive.';
    if (amount && !fromAmount) return `Enter a valid amount (up to ${fromToken?.decimals ?? 18} decimals).`;
    if (recipientTrim && !recipientValid) return `That is not a valid ${toChain.name} address.`;
    return '';
  })();

  const connectSender = async () => {
    if (fromChain?.chainType === 'SVM') {
      try {
        await sol.connectWallet();
      } catch (e) {
        toast.error(e?.message || 'Could not connect a Solana wallet.');
      }
      return;
    }
    await connectWithRetry();
  };

  const buttonLabel = (() => {
    if (busy) return 'Bridging…';
    if (!canSend) return 'Sending from this network is not supported';
    if (!sender) {
      if (fromChain?.chainType === 'EVM' && walletType === 'boingExpress') return 'Connect an EVM wallet';
      return fromChain?.chainType === 'SVM' ? 'Connect Solana wallet' : 'Connect wallet';
    }
    if (!amount) return 'Enter an amount';
    if (insufficient) return `Not enough ${fromToken?.symbol}`;
    if (!realRecipient) return `Enter the ${toChain?.name} address to receive on`;
    if (quoteState.loading) return 'Finding the best route…';
    if (!summary) return 'No route yet';
    return fromChainId === toChainId ? `Swap via ${summary.toolName}` : `Bridge via ${summary.toolName}`;
  })();

  const buttonDisabled = busy || !canSend || (sender && (!amount || insufficient || !realRecipient || quoteState.loading || !summary || Boolean(blocker)));

  const handleBridge = async () => {
    if (!sender) {
      if (fromChain?.chainType === 'EVM' && walletType === 'boingExpress') {
        toast.error('Boing Express signs on Boing only. Disconnect it and connect MetaMask or another EVM wallet to bridge.');
        return;
      }
      await connectSender();
      return;
    }
    if (!quoteInput || !realRecipient) return;
    const ctx = { fromSymbol: fromToken.symbol };
    const runId = `${Date.now()}`;
    setRun({ id: runId, phase: 'quote', text: 'Getting a fresh quote…' });
    try {
      let step = quoteState.step;
      const fresh = quoteState.real && Date.now() - quoteState.at < 45_000 && step?.action?.fromAddress === sender;
      if (!fresh) {
        const q = await getQuote({ ...quoteInput, fromAddress: sender, toAddress: realRecipient });
        step = q.step;
        setQuoteState({ step: q.step, summary: q.summary, at: Date.now(), error: '', loading: false, real: true });
      }
      if (!step?.transactionRequest) throw new Error('No route found for this pair and amount.');
      const s = summarizeQuote(step);
      const onProgress = (phase, info) => setRun((r) => ({ ...r, phase, text: PHASE_LABEL[phase] || r?.text, ...(info || {}) }));
      let txHash;
      if (fromChain.chainType === 'EVM') {
        const raw = getActiveEip1193?.() || (typeof window !== 'undefined' ? window.ethereum : null);
        if (!raw?.request) throw new Error('Connect an EVM wallet to bridge from this network.');
        txHash = await executeEvmStep({ raw, account: sender, chain: fromChain, step, onProgress });
      } else {
        txHash = await executeSolanaStep({ wallet: typeof window !== 'undefined' ? window.solana : null, step, onProgress });
      }
      const entry = {
        id: txHash,
        txHash,
        tool: step.tool,
        state: 'pending',
        statusText: 'Bridging in progress…',
        fromChainId: fromChain.id,
        toChainId: toChain.id,
        fromChainName: fromChain.name,
        toChainName: toChain.name,
        fromSymbol: fromToken.symbol,
        toSymbol: toToken.symbol,
        toDecimals: toToken.decimals,
        amount,
        estimate: fromBaseUnits(s.toAmount, s.toDecimals, 6),
        at: new Date().toISOString(),
      };
      setRecent((list) => {
        const next = [entry, ...list.filter((r) => r.id !== entry.id)];
        saveRecent(next);
        return next;
      });
      setRun({ id: runId, phase: 'done', txHash, text: 'Sent. Track it under Recent bridges below.' });
      toast.success(`Transfer sent via ${s.toolName}`);
      fromBalances.refresh();
      transactionTrackingService
        .trackBridgeTransaction(txHash, { fromChain: fromChain.id, toChain: toChain.id, userAddress: sender, token: fromToken.symbol, amount })
        .catch(() => {});
    } catch (e) {
      const text = errText(e, ctx);
      setRun({ id: runId, phase: 'error', text });
      toast.error(text);
    }
  };

  const switchSides = () => {
    setFromChainId(toChainId);
    setToChainId(fromChainId);
    setFromToken(toToken);
    setToToken(fromToken);
    setRecipient('');
    setShowRecipient(false);
  };

  const setMax = () => {
    if (balanceRaw == null || !fromToken) return;
    let raw = BigInt(balanceRaw);
    // Leave a little gas token for fees.
    if (isNativeTokenAddress(fromToken.address)) {
      const reserve = fromChain?.chainType === 'SVM' ? 10_000_000n : 10n ** BigInt(Math.max(0, fromToken.decimals - 3));
      raw = raw > reserve ? raw - reserve : 0n;
    }
    setAmount(fromBaseUnits(raw.toString(), fromToken.decimals, fromToken.decimals).replace(/,/g, ''));
  };

  const deepLink = buildLifiDeepLink({ fromChain: fromChainId, toChain: toChainId, fromToken: fromToken?.address, toToken: toToken?.address, fromAmount: fromAmount || undefined });
  const receiveHuman = summary ? fromBaseUnits(summary.toAmount, summary.toDecimals, 6) : '';
  const minHuman = summary ? fromBaseUnits(summary.toAmountMin, summary.toDecimals, 6) : '';
  const totalCostUSD = summary ? (Number(summary.fromAmountUSD) || 0) - (Number(summary.toAmountUSD) || 0) + summary.gasUSD : null;
  const history = [...recent, ...serverHistory.filter((h) => !recent.some((r) => r.txHash === h.txHash))];

  return (
    <>
      <Helmet>
        <title>Bridge | boing.finance — Cross-chain transfers on 70+ networks</title>
        <meta name="description" content="Move tokens between Ethereum, Base, Arbitrum, Solana, Bitcoin and dozens more networks, routed by LI.FI. A small platform fee applies." />
        <meta name="keywords" content="cross-chain bridge, token bridge, LI.FI, Solana bridge, boing finance" />
        <meta property="og:title" content="Bridge | boing.finance" />
        <meta property="og:description" content="Move tokens between 70+ networks, routed by LI.FI." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/bridge" />
      </Helmet>
      <div className="relative w-full min-w-0">
        <div className="td-shell td-shell--narrow">
          <h1 className="sr-only">Bridge tokens between {chains.length ? `${chains.length} networks` : 'networks'}</h1>

          {network && Number(network.chainId) === BOING_NATIVE_L1_CHAIN_ID && (
            <div className="mb-6 rounded-xl border px-4 py-3 text-sm" role="status" style={{ borderColor: 'rgba(45, 212, 191, 0.45)', backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>On Boing L1:</strong> the bridge moves tokens between LI.FI networks (Boing
              testnet isn&apos;t one of them). Move BOING with Boing Express for now.{' '}
              <Link to="/docs" className="td-btn--link">
                Learn more
              </Link>
              .
            </div>
          )}

          <div
            id="bridge-form"
            className="mb-6 rounded-2xl p-4 shadow-xl sm:p-6"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: '0 4px 24px var(--shadow)' }}
            data-testid="bridge-form"
          >
            {/* From */}
            <div className="rounded-xl p-4" style={card}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                  From
                </span>
                {sender && (
                  <span style={muted} data-testid="bridge-sender">
                    {short(sender)}
                  </span>
                )}
              </div>
              <ChainPicker label="From network" side="from" chains={chains} value={fromChainId} onChange={setFromChainId} loading={chainsLoading} error={chainsError} onRetry={retryChains} />
              <div className="mt-3 flex items-center gap-3">
                <label htmlFor="bridge-amount" className="sr-only">
                  Amount
                </label>
                <input
                  id="bridge-amount"
                  inputMode="decimal"
                  autoComplete="off"
                  value={amount}
                  onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
                  placeholder="0.0"
                  className="min-w-0 flex-1 bg-transparent text-xl font-bold focus:outline-none sm:text-2xl"
                  style={{ color: 'var(--text-primary)' }}
                  data-testid="bridge-amount"
                />
                <TokenButton token={fromToken} onClick={() => setTokenModal('from')} testId="bridge-token-from" />
              </div>
              <div className="mt-1 flex items-center justify-between text-xs" style={muted}>
                <span>{summary?.fromAmountUSD ? formatUsd(summary.fromAmountUSD) : ''}</span>
                {sender && balanceRaw != null && fromToken && (
                  <button type="button" onClick={setMax} className="hover:underline" data-testid="bridge-balance">
                    Balance: {fromBaseUnits(balanceRaw, fromToken.decimals, 6)} · Max
                  </button>
                )}
              </div>
            </div>

            <div className="-my-2 flex justify-center">
              <button type="button" onClick={switchSides} className="td-icon-btn relative z-10" aria-label="Switch networks" data-testid="bridge-switch">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            {/* To */}
            <div className="rounded-xl p-4" style={card}>
              <div className="mb-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                To
              </div>
              <ChainPicker label="To network" side="to" chains={chains} value={toChainId} onChange={setToChainId} loading={chainsLoading} error={chainsError} onRetry={retryChains} />
              <div className="mt-3 flex items-center gap-3">
                <div className="min-w-0 flex-1 truncate text-xl font-bold sm:text-2xl" style={{ color: receiveHuman ? 'var(--text-primary)' : 'var(--text-tertiary)' }} data-testid="bridge-receive">
                  {quoteState.loading ? '…' : receiveHuman ? `~${receiveHuman}` : '0.0'}
                </div>
                <TokenButton token={toToken} onClick={() => setTokenModal('to')} testId="bridge-token-to" />
              </div>
              <div className="mt-1 text-xs" style={muted}>
                {summary?.toAmountUSD ? formatUsd(summary.toAmountUSD) : ''}
              </div>
              {!needsRecipientField && toChain && (
                <button type="button" className="mt-2 text-xs hover:underline" style={muted} onClick={() => setShowRecipient(true)} data-testid="bridge-recipient-toggle">
                  Send to a different address
                </button>
              )}
              {needsRecipientField && (
                <div className="mt-3">
                  <label htmlFor="bridge-recipient" className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Receive at ({toChain?.name} address)
                  </label>
                  <input
                    id="bridge-recipient"
                    type="text"
                    autoComplete="off"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder={walletForDest ? `${short(walletForDest)} (your connected wallet)` : `Paste your ${toChain?.name} address`}
                    className="td-field__input w-full text-sm"
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: `1px solid ${recipientTrim && !recipientValid ? 'var(--finance-red)' : 'var(--border-color)'}`, color: 'var(--text-primary)' }}
                    data-testid="bridge-recipient"
                  />
                  <p className="mt-1 text-xs" style={muted}>
                    {walletForDest && !recipientTrim ? 'Leave empty to receive in your connected wallet.' : 'Double-check it: transfers to a wrong address cannot be reversed.'}
                  </p>
                </div>
              )}
            </div>

            {/* Quote summary */}
            <div className="mt-4 space-y-2 text-sm" data-testid="bridge-quote">
              {quoteState.loading && !summary && (
                <p style={muted} data-testid="bridge-quote-loading">
                  Finding the best route…
                </p>
              )}
              {summary && (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span style={muted}>Route</span>
                    <span className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }} data-testid="bridge-quote-tool">
                      {summary.toolLogo && <TokenLogo src={summary.toolLogo} label={summary.toolName} size={18} />}
                      {summary.toolName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span style={muted}>Arrives in</span>
                    <span style={{ color: 'var(--text-primary)' }} data-testid="bridge-quote-eta">
                      {formatDuration(summary.durationSec) || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span style={muted}>Total cost (fees + gas)</span>
                    <span style={{ color: 'var(--text-primary)' }} data-testid="bridge-quote-cost">
                      {totalCostUSD != null && Number.isFinite(totalCostUSD) ? `~${formatUsd(Math.max(0, totalCostUSD))}` : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span style={muted}>Price protection</span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {slippage}% max slippage · at least {minHuman} {summary.toSymbol}
                    </span>
                  </div>
                  {!quoteState.real && (
                    <p className="text-xs" style={muted} data-testid="bridge-quote-preview-note">
                      Preview quote. We refresh it with your wallet before you confirm.
                    </p>
                  )}
                  <details className="rounded-xl p-3" style={card} data-testid="bridge-quote-details">
                    <summary className="cursor-pointer text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Route details
                    </summary>
                    <div className="mt-3 space-y-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <div>
                        <p className="mb-1 font-semibold" style={{ color: 'var(--text-primary)' }}>
                          Slippage
                        </p>
                        <div className="flex gap-2" role="radiogroup" aria-label="Max slippage">
                          {SLIPPAGE_OPTIONS.map((s) => (
                            <button
                              key={s}
                              type="button"
                              role="radio"
                              aria-checked={slippage === s}
                              onClick={() => setSlippage(s)}
                              className={`rounded-md px-2 py-1 ${slippage === s ? 'td-segmented__btn--active' : ''}`}
                              style={slippage === s ? undefined : { border: '1px solid var(--border-color)' }}
                            >
                              {s}%
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="mb-1 font-semibold" style={{ color: 'var(--text-primary)' }}>
                          Fees
                        </p>
                        <ul className="space-y-1" data-testid="bridge-quote-fees">
                          {summary.fees.map((f, i) => (
                            <li key={`${f.name}-${i}`} className="flex justify-between gap-2">
                              <span>
                                {f.name}
                                {f.included ? '' : ' (paid on top)'}
                              </span>
                              <span>
                                {f.token ? `${fromBaseUnits(f.amount, f.token.decimals, 6)} ${f.token.symbol}` : ''}
                                {f.amountUSD != null ? ` · ${formatUsd(f.amountUSD)}` : ''}
                              </span>
                            </li>
                          ))}
                          {summary.platformFeeAmount && (
                            <li className="flex justify-between gap-2">
                              <span>of which boing.finance platform fee ({PLATFORM_BRIDGE_FEE_LABEL})</span>
                              <span>{summary.platformFeeUSD != null ? formatUsd(summary.platformFeeUSD) : ''}</span>
                            </li>
                          )}
                          {summary.gas.map((g, i) => (
                            <li key={`gas-${i}`} className="flex justify-between gap-2">
                              <span>Network gas (paid on top)</span>
                              <span>
                                {g.token ? `${fromBaseUnits(g.amount, g.token.decimals, 6)} ${g.token.symbol}` : ''}
                                {g.amountUSD != null ? ` · ${formatUsd(g.amountUSD)}` : ''}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="mb-1 font-semibold" style={{ color: 'var(--text-primary)' }}>
                          Steps
                        </p>
                        <ol className="list-decimal space-y-0.5 pl-4" data-testid="bridge-quote-steps">
                          {summary.steps.map((st, i) => (
                            <li key={i}>
                              {st.type === 'cross' ? 'Bridge' : st.type === 'swap' ? 'Swap' : st.type === 'protocol' ? 'Fee' : 'Step'} {st.fromSymbol} → {st.toSymbol} via {st.tool}
                              {st.fromChainId !== st.toChainId ? ` (${byId.get(st.fromChainId)?.name || st.fromChainId} → ${byId.get(st.toChainId)?.name || st.toChainId})` : ''}
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div className="space-y-0.5 break-all font-mono text-[11px]">
                        <p>Minimum received: {minHuman} {summary.toSymbol}</p>
                        {summary.approvalAddress && <p>Approval contract: {summary.approvalAddress}</p>}
                        <p>Recipient: {quoteState.real ? summary.toAddress : 'set when you connect your wallet / enter an address'}</p>
                        <p>Quote id: {summary.id}</p>
                      </div>
                      <a href={deepLink} target="_blank" rel="noopener noreferrer" className="td-btn td-btn--ghost inline-flex text-xs">
                        Open this route in Jumper (LI.FI)
                      </a>
                    </div>
                  </details>
                </>
              )}
            </div>

            {(blocker || quoteState.error) && (
              <div className="td-callout td-callout--warn mt-4" role="alert" data-testid="bridge-error">
                <p className="td-callout__body">{blocker || quoteState.error}</p>
              </div>
            )}

            {run && (
              <div className="mt-4 rounded-xl p-3 text-sm" style={card} role="status" data-testid="bridge-progress">
                <p style={{ color: run.phase === 'error' ? 'var(--finance-red)' : 'var(--text-primary)' }}>{run.text}</p>
                {run.txHash && (
                  <a href={scanUrl(run.txHash)} target="_blank" rel="noopener noreferrer" className="td-btn--link text-xs">
                    View transfer on LI.FI Scan
                  </a>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleBridge}
              disabled={buttonDisabled}
              className="td-btn td-btn--primary mt-4 w-full py-4 text-base sm:text-lg"
              data-testid="bridge-submit"
            >
              {buttonLabel}
            </button>
            <p
              className="mt-3 text-center text-xs leading-relaxed"
              style={{ color: 'var(--text-tertiary, var(--text-secondary))' }}
              data-testid="bridge-fee-notice"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="mr-1 inline-block h-3.5 w-3.5 align-[-2px] opacity-70">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
              </svg>
              <span>
                A {PLATFORM_BRIDGE_FEE_LABEL} platform fee is included in cross-chain quotes. Routes by LI.FI.
              </span>
            </p>
          </div>

          <div className="mb-6 overflow-hidden rounded-2xl shadow-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="p-4 sm:p-5">
              <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                Recent bridges
              </h3>
            </div>
            <div className="px-4 pb-4 sm:px-6 sm:pb-6" data-testid="bridge-recent">
              {history.length ? (
                <div className="space-y-3">
                  {history.map((tx) => {
                    const state = tx.state || tx.status || 'pending';
                    const tone = state === 'done' || state === 'completed' ? 'td-status-dot--ok' : state === 'failed' ? 'td-status-dot--fail' : 'td-status-dot--pending';
                    return (
                      <div key={tx.id || tx.txHash} className="rounded-xl p-3" style={card}>
                        <div className="flex items-center gap-3">
                          <div className={`td-status-dot ${tone}`} aria-hidden="true" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {tx.amount} {tx.fromSymbol || tx.fromToken || tx.token} → {tx.toSymbol || tx.toToken || tx.token}
                            </p>
                            <p className="text-xs" style={muted}>
                              {tx.fromChainName || byId.get(Number(tx.fromChain))?.name || tx.fromChain} → {tx.toChainName || byId.get(Number(tx.toChain))?.name || tx.toChain}
                              {tx.at || tx.timestamp ? ` · ${new Date(tx.at || tx.timestamp).toLocaleString()}` : ''}
                            </p>
                            {tx.statusText && (
                              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                {tx.statusText}
                              </p>
                            )}
                          </div>
                        </div>
                        {tx.txHash && (
                          <div className="mt-2 flex flex-wrap gap-3 text-xs">
                            <a className="td-btn--link" href={tx.sendingLink || scanUrl(tx.txHash)} target="_blank" rel="noopener noreferrer">
                              Sent tx
                            </a>
                            {tx.receivingLink && (
                              <a className="td-btn--link" href={tx.receivingLink} target="_blank" rel="noopener noreferrer">
                                Received tx
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  variant="bridge"
                  title="No bridge transactions yet"
                  description="Transfers you send appear here with live status until they arrive."
                  actionLabel="Bridge tokens"
                  actionHref="#bridge-form"
                />
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl shadow-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <button onClick={() => setHowItWorksExpanded(!howItWorksExpanded)} className="flex w-full items-center justify-between p-4 text-left transition-opacity hover:opacity-90 sm:p-5" type="button">
              <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                How it works
              </h3>
              <svg className={`h-5 w-5 transition-transform ${howItWorksExpanded ? 'rotate-180' : ''}`} style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {howItWorksExpanded && (
              <div className="grid grid-cols-1 gap-6 px-4 pb-6 text-sm md:grid-cols-3 sm:px-6" style={{ color: 'var(--text-secondary)' }}>
                <div>
                  <h4 className="mb-1 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    1. Get a quote
                  </h4>
                  <p>LI.FI compares bridges and exchanges and picks the cheapest route. You see what you receive after fees.</p>
                </div>
                <div>
                  <h4 className="mb-1 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    2. Confirm in your wallet
                  </h4>
                  <p>
                    For tokens, the first time you allow the bridge to use the exact amount, then you confirm the transfer. Network gas is paid on the sending
                    network; a {PLATFORM_BRIDGE_FEE_LABEL} platform fee is included in the quote.
                  </p>
                </div>
                <div>
                  <h4 className="mb-1 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    3. Tokens arrive
                  </h4>
                  <p>We follow the transfer with LI.FI until it lands. boing.finance never holds your tokens.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <TokenManagementModal
          isOpen={tokenModal != null}
          onClose={() => setTokenModal(null)}
          onTokenSelect={(t) => (tokenModal === 'to' ? setToToken(t) : setFromToken(t))}
          chain={tokenModal === 'to' ? toChain : fromChain}
          tokens={tokenModal === 'to' ? toTokens.tokens : fromTokens.tokens}
          tokensLoading={tokenModal === 'to' ? toTokens.loading : fromTokens.loading}
          tokensError={tokenModal === 'to' ? toTokens.error : fromTokens.error}
          onRetry={tokenModal === 'to' ? toTokens.retry : fromTokens.retry}
          balances={tokenModal === 'to' ? toBalances : fromBalances}
          walletHint={
            (tokenModal === 'to' ? toChain : fromChain) && !canSignOnChainType((tokenModal === 'to' ? toChain : fromChain).chainType)
              ? `boing.finance can't read ${(tokenModal === 'to' ? toChain : fromChain).name} wallets yet.`
              : ''
          }
        />
      </div>
    </>
  );
}

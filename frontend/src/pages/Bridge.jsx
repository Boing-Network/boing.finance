import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useWallet } from '../contexts/WalletContext';
import { useNetwork } from '../hooks/useNetwork';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { getApiUrl } from '../config';
import { getSupportedNetworks } from '../config/networks';
import TokenManagementModal from '../components/TokenManagementModal';
import EmptyState from '../components/EmptyState';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import {
  PLATFORM_BRIDGE_FEE_LABEL,
  buildLifiDeepLink,
  getBridgeFallbackUrl,
  getBridgeTokensForChain,
  getLifiFeeRecipient,
  resolveBridgeToken,
} from '../config/bridge';
import { getEvmBridgeQuote, sendAggregatorSwap } from '../services/aggregatorSwapService';
import { transactionTrackingService } from '../services/transactionTrackingService.js';

function formatDuration(seconds) {
  if (seconds == null || !Number.isFinite(Number(seconds))) return null;
  const s = Math.max(0, Math.round(Number(seconds)));
  if (s < 60) return `~${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `~${m} min`;
  return `~${(m / 60).toFixed(1)} h`;
}

export default function Bridge() {
  const { account, switchNetworkWithRetry } = useWalletConnection();
  const { provider: walletProvider, signer: walletSigner, chainId: walletChainId } = useWallet();
  const { network } = useNetwork();

  const [amount, setAmount] = useState('');
  const [fromChain, setFromChain] = useState(1);
  const [toChain, setToChain] = useState(8453);
  const [fromAsset, setFromAsset] = useState(() => resolveBridgeToken(1, 'ETH'));
  const [toAsset, setToAsset] = useState(() => resolveBridgeToken(8453, 'ETH'));
  const [bridgeTransactions, setBridgeTransactions] = useState([]);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [selectingToken, setSelectingToken] = useState(null);
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [quoting, setQuoting] = useState(false);
  const [bridging, setBridging] = useState(false);
  const [recentBridgesExpanded, setRecentBridgesExpanded] = useState(true);
  const [howItWorksExpanded, setHowItWorksExpanded] = useState(false);
  const [feeRecipient, setFeeRecipient] = useState(getLifiFeeRecipient());

  const supportedNetworks = useMemo(
    () =>
      getSupportedNetworks()
        .filter((n) => !n.features?.includes('boingNativeL1') && !n.features?.includes('solana'))
        .map((n) => ({
          id: n.chainId,
          name: n.name,
          symbol: n.symbol || n.nativeCurrency?.symbol,
          rpcUrl: n.rpcUrl,
        })),
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const apiUrl = getApiUrl();
        const response = await axios.get(`${apiUrl}/aggregator/bridge-config`);
        const evm = response.data?.data?.feeRecipient || response.data?.data?.feeRecipients?.evm;
        if (!cancelled && evm) setFeeRecipient(evm);
      } catch {
        /* keep build-time recipient */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const next = resolveBridgeToken(fromChain, fromAsset?.symbol) || getBridgeTokensForChain(fromChain)[0];
    if (next) setFromAsset(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rematch symbol when chain changes
  }, [fromChain]);

  useEffect(() => {
    const next = resolveBridgeToken(toChain, toAsset?.symbol) || getBridgeTokensForChain(toChain)[0];
    if (next) setToAsset(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rematch symbol when chain changes
  }, [toChain]);

  useEffect(() => {
    const loadTransactions = async () => {
      if (!account) return;
      try {
        const apiUrl = getApiUrl();
        const response = await axios.get(`${apiUrl}/bridge/transactions`, {
          params: { address: account },
        });
        if (response.data.success) {
          setBridgeTransactions(response.data.data || []);
        }
      } catch (error) {
        console.error('Failed to load bridge transactions:', error);
        setBridgeTransactions([]);
      }
    };
    loadTransactions();
  }, [account]);

  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0 || fromChain === toChain || !fromAsset?.address || !toAsset?.address) {
      setQuote(null);
      setQuoteError('');
      setQuoting(false);
      return undefined;
    }

    const quoteAddress = account || '0x0000000000000000000000000000000000000001';
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setQuoting(true);
      setQuoteError('');
      try {
        const next = await getEvmBridgeQuote({
          fromChain,
          toChain,
          fromToken: fromAsset,
          toToken: toAsset,
          amountHuman: amount,
          fromAddress: quoteAddress,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (!next?.transactionRequest) {
          setQuote(null);
          setQuoteError('No LI.FI route for this pair. Try USDC, native gas, or open the aggregator.');
          return;
        }
        setQuote(next);
      } catch (err) {
        if (controller.signal.aborted) return;
        setQuote(null);
        setQuoteError(err?.message || 'Quote failed');
      } finally {
        if (!controller.signal.aborted) setQuoting(false);
      }
    }, 450);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [account, amount, fromChain, toChain, fromAsset, toAsset]);

  const deepLink = buildLifiDeepLink({
    fromChain,
    toChain,
    fromToken: fromAsset?.address,
    toToken: toAsset?.address,
    fromAmount: quote?.fromAmount,
  });

  const handleBridge = async () => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (fromChain === toChain) {
      toast.error('Source and destination chains must be different');
      return;
    }
    if (!walletProvider) {
      toast.error('Connect an EVM wallet to execute the bridge');
      return;
    }

    setBridging(true);
    try {
      if (Number(walletChainId) !== Number(fromChain)) {
        const switched = await switchNetworkWithRetry(fromChain);
        if (!switched) {
          toast.error('Switch your wallet to the source network to continue');
          return;
        }
      }
      const fresh = await getEvmBridgeQuote({
        fromChain,
        toChain,
        fromToken: fromAsset,
        toToken: toAsset,
        amountHuman: amount,
        fromAddress: account,
      });
      const toUse = fresh?.transactionRequest ? fresh : quote;
      if (!toUse?.transactionRequest) {
        toast.error('No live route. Opening LI.FI instead.');
        window.open(deepLink, '_blank', 'noopener,noreferrer');
        return;
      }
      const signer = walletSigner ?? (await walletProvider.getSigner());
      toast(`Routing via ${toUse.venue} (includes ${PLATFORM_BRIDGE_FEE_LABEL} platform fee)…`, { duration: 2500 });
      const result = await sendAggregatorSwap(toUse, signer);
      toast.success(`Bridge submitted via ${toUse.venue}`);
      try {
        await transactionTrackingService.trackBridgeTransaction(result.txHash, {
          fromChain,
          toChain,
          userAddress: account,
          token: fromAsset.symbol,
          amount,
        });
      } catch {
        /* history is best-effort */
      }
      setBridgeTransactions((prev) => [
        {
          id: result.txHash,
          txHash: result.txHash,
          status: 'pending',
          amount,
          fromToken: fromAsset.symbol,
          toToken: toAsset.symbol,
          fromChain,
          toChain,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch (error) {
      const msg = error?.shortMessage || error?.message || 'Bridge failed';
      toast.error(msg);
    } finally {
      setBridging(false);
    }
  };

  const handleTokenSelect = (token) => {
    const chain = selectingToken === 'to' ? toChain : fromChain;
    const resolved = resolveBridgeToken(chain, token);
    if (!resolved) return;
    if (selectingToken === 'from') setFromAsset(resolved);
    else if (selectingToken === 'to') setToAsset(resolved);
    setTokenModalOpen(false);
  };

  const openTokenModal = (tokenType) => {
    setSelectingToken(tokenType);
    setTokenModalOpen(true);
  };

  const switchChains = () => {
    setFromChain(toChain);
    setToChain(fromChain);
    setFromAsset(toAsset);
    setToAsset(fromAsset);
  };

  const getNetworkInfo = (chainId) => supportedNetworks.find((n) => n.id === chainId);

  const getStatusTone = (status) => {
    switch (status) {
      case 'completed':
        return { text: 'var(--finance-green, #22c55e)', dot: 'td-status-dot--ok' };
      case 'pending':
        return { text: 'var(--finance-amber, #e8b84a)', dot: 'td-status-dot--pending' };
      case 'failed':
        return { text: 'var(--finance-red)', dot: 'td-status-dot--fail' };
      default:
        return { text: 'var(--text-tertiary)', dot: 'td-status-dot--idle' };
    }
  };

  const canSubmit =
    Boolean(account) &&
    Boolean(amount) &&
    parseFloat(amount) > 0 &&
    fromChain !== toChain &&
    !quoting &&
    !bridging;

  const estimatedTime = formatDuration(quote?.executionDuration);

  return (
    <>
      <Helmet>
        <title>Bridge | boing.finance — Aggregator-powered cross-chain transfers</title>
        <meta
          name="description"
          content="Move tokens between EVM networks on boing.finance. A small platform fee applies."
        />
        <meta name="keywords" content="cross-chain bridge, token bridge, boing finance, EVM" />
        <meta property="og:title" content="Bridge | boing.finance" />
        <meta
          property="og:description"
          content="Aggregator-powered EVM bridge with a 0.5% platform service fee."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/bridge" />
      </Helmet>
      <div className="relative w-full min-w-0">
        <div className="td-shell td-shell--narrow">
          <header className="td-hero">
            <span className="td-hero__eyebrow">Trade</span>
            <h1 className="td-hero__title">Bridge</h1>
            <p className="td-hero__subtitle">
              Move tokens between EVM networks. A {PLATFORM_BRIDGE_FEE_LABEL} platform fee applies.
            </p>
          </header>

          {network && Number(network.chainId) === BOING_NATIVE_L1_CHAIN_ID && (
            <div
              className="mb-6 rounded-xl border px-4 py-3 text-sm"
              role="status"
              style={{
                borderColor: 'rgba(45, 212, 191, 0.45)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-secondary)',
              }}
            >
              <strong style={{ color: 'var(--text-primary)' }}>On Boing L1:</strong> bridging here is for EVM chains.
              Move BOING with Boing Express for now.{' '}
              <Link to="/docs" className="td-btn--link">
                Learn more
              </Link>
              .
            </div>
          )}

          <div
            id="bridge-form"
            className="rounded-2xl p-4 sm:p-6 shadow-xl mb-6"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 24px var(--shadow)',
            }}
          >
            <div className="space-y-4 mb-6">
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    From
                  </span>
                </div>
                <select
                  value={fromChain}
                  onChange={(e) => setFromChain(parseInt(e.target.value, 10))}
                  className="td-field__input text-sm sm:text-base font-medium"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {supportedNetworks.map((net) => (
                    <option key={net.id} value={net.id}>
                      {net.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center -my-1">
                <button
                  type="button"
                  onClick={switchChains}
                  className="td-icon-btn"
                  aria-label="Switch networks"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                </button>
              </div>

              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    To
                  </span>
                </div>
                <select
                  value={toChain}
                  onChange={(e) => setToChain(parseInt(e.target.value, 10))}
                  className="td-field__input text-sm sm:text-base font-medium"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {supportedNetworks.map((net) => (
                    <option key={net.id} value={net.id}>
                      {net.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <button
                onClick={() => openTokenModal('from')}
                type="button"
                className="td-btn td-btn--ghost w-full sm:w-auto justify-center"

              >
                <span className="font-medium text-sm sm:text-base">{fromAsset?.symbol || 'From token'}</span>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <button
                onClick={() => openTokenModal('to')}
                type="button"
                className="td-btn td-btn--ghost w-full sm:w-auto justify-center"

              >
                <span className="font-medium text-sm sm:text-base">{toAsset?.symbol || 'To token'}</span>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div
              className="rounded-xl p-4 mb-6"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
                  Amount
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <label htmlFor="bridge-amount" className="sr-only">
                  Amount
                </label>
                <input
                  id="bridge-amount"
                  name="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-xl sm:text-2xl font-bold focus:outline-none min-w-0"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div
              className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3 mb-4 text-sm"
              style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--text-tertiary)' }}>Platform fee:</span>
                <span style={{ color: 'var(--text-primary)' }}>{PLATFORM_BRIDGE_FEE_LABEL}</span>
              </div>
              {quote?.gasCostUSD != null && (
                <div className="flex items-center gap-2">
                  <span style={{ color: 'var(--text-tertiary)' }}>Est. gas:</span>
                  <span style={{ color: 'var(--text-primary)' }}>${quote.gasCostUSD}</span>
                </div>
              )}
              {estimatedTime && (
                <div className="flex items-center gap-2">
                  <span style={{ color: 'var(--text-tertiary)' }}>Time:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{estimatedTime}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--text-tertiary)' }}>Route:</span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {quoting
                    ? 'Quoting…'
                    : quote?.venue
                      ? `${quote.venue} via LI.FI`
                      : `${getNetworkInfo(fromChain)?.name || fromChain} → ${getNetworkInfo(toChain)?.name || toChain}`}
                </span>
              </div>
              {quote?.amountOutHuman && (
                <div className="flex items-center gap-2">
                  <span style={{ color: 'var(--text-tertiary)' }}>You receive:</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    ~{quote.amountOutHuman} {toAsset?.symbol}
                  </span>
                </div>
              )}
            </div>

            {quoteError && (
              <div className="td-callout td-callout--warn mb-3" role="alert">
                <p className="td-callout__body">{quoteError}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleBridge}
                disabled={!canSubmit}
                className="td-btn td-btn--primary w-full py-4 text-base sm:text-lg"
              >
                {!account
                  ? 'Connect wallet'
                  : bridging
                    ? 'Bridging…'
                    : quoting
                      ? 'Fetching route…'
                      : quote
                        ? `Bridge via ${quote.venue}`
                        : 'Get a route'}
              </button>
              <details className="td-lifi-strip">
                <summary className="td-lifi-strip__label cursor-pointer">Prefer the advanced bridge UI?</summary>
                <a
                  href={quote ? deepLink : getBridgeFallbackUrl(fromChain)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="td-btn td-btn--ghost text-sm mt-2 inline-flex"
                >
                  Open external bridge
                </a>
              </details>
            </div>
          </div>

          <div
            className="rounded-2xl shadow-lg mb-6 overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              onClick={() => setRecentBridgesExpanded(!recentBridgesExpanded)}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:opacity-90 transition-opacity"
            >
              <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                Recent bridges
              </h3>
              <svg
                className={`w-5 h-5 transition-transform ${recentBridgesExpanded ? 'rotate-180' : ''}`}
                style={{ color: 'var(--text-secondary)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {recentBridgesExpanded && (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                {bridgeTransactions.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {bridgeTransactions.map((tx) => (
                      <div
                        key={tx.id || tx.txHash}
                        className="rounded-xl p-3 sm:p-4 mb-3"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                          <div className="flex items-center space-x-3">
                            <div className={`td-status-dot ${getStatusTone(tx.status).dot}`} aria-hidden="true" />
                            <div>
                              <p className="font-medium text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                                {tx.amount} {tx.fromToken || tx.token} → {tx.toToken || tx.token}
                              </p>
                              <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {getNetworkInfo(tx.fromChain)?.name || tx.fromChain} →{' '}
                                {getNetworkInfo(tx.toChain)?.name || tx.toChain}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                            <span className="text-xs sm:text-sm font-medium" style={{ color: getStatusTone(tx.status).text }}>
                              {tx.status
                                ? tx.status.charAt(0).toUpperCase() + tx.status.slice(1)
                                : 'Pending'}
                            </span>
                            {tx.timestamp && (
                              <span className="text-xs sm:text-sm" style={{ color: 'var(--text-tertiary)' }}>
                                {new Date(tx.timestamp).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {tx.txHash && (
                          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                            <code className="text-xs font-mono break-all" style={{ color: 'var(--text-secondary)' }}>
                              {tx.txHash}
                            </code>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    variant="bridge"
                    title="No bridge transactions yet"
                    description="Complete a transfer to see history here. Destination status is tracked by the aggregator, not a Boing relayer."
                    actionLabel="Bridge tokens"
                    actionHref="#bridge-form"
                  />
                )}
              </div>
            )}
          </div>

          <div
            className="rounded-2xl shadow-lg overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              onClick={() => setHowItWorksExpanded(!howItWorksExpanded)}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:opacity-90 transition-opacity"
            >
              <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                How it works
              </h3>
              <svg
                className={`w-5 h-5 transition-transform ${howItWorksExpanded ? 'rotate-180' : ''}`}
                style={{ color: 'var(--text-secondary)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {howItWorksExpanded && (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ backgroundColor: 'var(--finance-primary)', color: '#041018' }}
                    >
                      <span className="font-bold text-lg">1</span>
                    </div>
                    <h4 className="font-semibold mb-2 text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                      Quote via LI.FI
                    </h4>
                    <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Routes use third-party bridges and DEXs. You receive whatever the quote shows after fees.
                    </p>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ backgroundColor: 'var(--finance-primary)', color: '#041018' }}
                    >
                      <span className="font-bold text-lg">2</span>
                    </div>
                    <h4 className="font-semibold mb-2 text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                      {PLATFORM_BRIDGE_FEE_LABEL} platform fee
                    </h4>
                    <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Taken from the sending token by LI.FI's integrator fee. Plus network gas and any bridge/DEX fees.
                    </p>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ backgroundColor: 'var(--finance-primary)', color: '#041018' }}
                    >
                      <span className="font-bold text-lg">3</span>
                    </div>
                    <h4 className="font-semibold mb-2 text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                      Sign once
                    </h4>
                    <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Your wallet sends the LI.FI transaction on the source chain. Destination arrival is handled by the
                      route — Boing does not custody tokens.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <TokenManagementModal
          isOpen={tokenModalOpen}
          onClose={() => setTokenModalOpen(false)}
          onTokenSelect={handleTokenSelect}
          currentNetwork={selectingToken === 'to' ? toChain : fromChain}
          account={account}
          provider={walletProvider}
          chainId={selectingToken === 'to' ? toChain : fromChain}
        />
      </div>
    </>
  );
}

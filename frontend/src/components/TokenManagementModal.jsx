import React, { useEffect, useMemo, useState } from 'react';
import useEscapeKey from '../hooks/useEscapeKey';
import TokenLogo from './bridge/TokenLogo';
import VirtualList from './bridge/VirtualList';
import { fetchLifiToken } from '../services/lifiApi';
import {
  chainTypeLabel,
  explainLifiError,
  formatUsd,
  fromBaseUnits,
  isNativeTokenAddress,
  looksLikeTokenAddress,
  sameAddress,
  searchTokens,
  sortTokensPopular,
} from '../utils/lifiCore';

const CUSTOM_KEY = 'boing_bridge_custom_tokens_v1';

function loadCustom(chainId) {
  try {
    const all = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '{}');
    return Array.isArray(all[chainId]) ? all[chainId] : [];
  } catch {
    return [];
  }
}

function saveCustom(chainId, list) {
  try {
    const all = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '{}');
    all[chainId] = list;
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(all));
  } catch {
    /* storage full or blocked: keep in memory only */
  }
}

const TABS = [
  { key: 'my-tokens', label: 'My Tokens' },
  { key: 'popular', label: 'Popular' },
  { key: 'custom', label: 'Custom' },
  { key: 'import', label: 'Import' },
];

const muted = { color: 'var(--text-tertiary)' };

function TokenRow({ token, balance, onSelect, onRemove, badge }) {
  const human = balance != null && balance !== '0' ? fromBaseUnits(balance, token.decimals, 6) : '';
  const usd = human && token.priceUSD ? formatUsd(Number(fromBaseUnits(balance, token.decimals, 8).replace(/,/g, '')) * Number(token.priceUSD)) : '';
  return (
    <div
      role="option"
      aria-selected="false"
      tabIndex={0}
      onClick={() => onSelect(token)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSelect(token);
      }}
      className="flex h-full cursor-pointer items-center gap-3 rounded-lg px-2 transition-colors hover:bg-[var(--bg-tertiary)]"
      data-testid="bridge-token-option"
      data-symbol={token.symbol}
      data-address={token.address}
    >
      <TokenLogo src={token.logoURI} label={token.symbol} size={32} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate font-medium" style={{ color: 'var(--text-primary)' }}>
          <span className="truncate">{token.symbol}</span>
          {badge && (
            <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
              {badge}
            </span>
          )}
        </p>
        <p className="truncate text-xs" style={muted}>
          {token.name}
        </p>
      </div>
      {human && (
        <div className="text-right">
          <p className="text-sm tabular-nums" style={{ color: 'var(--text-primary)' }} data-testid="bridge-token-balance">
            {human}
          </p>
          {usd && (
            <p className="text-xs tabular-nums" style={muted}>
              {usd}
            </p>
          )}
        </div>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(token);
          }}
          className="p-1 text-sm"
          style={{ color: 'var(--finance-red)' }}
          aria-label={`Remove ${token.symbol}`}
        >
          ×
        </button>
      )}
    </div>
  );
}

/**
 * Bridge "Select Token": every LI.FI token on the chosen network.
 * - My Tokens: your balances (EVM via LI.FI, Solana via RPC).
 * - Popular: the full LI.FI list, gas token and major coins first; search by symbol, name or address
 *   (falls back to LI.FI GET /v1/token for tokens outside the default list, e.g. BONK).
 * - Custom: tokens you imported. Import: paste an address, checked with LI.FI GET /v1/token.
 */
export default function TokenManagementModal({ isOpen, onClose, onTokenSelect, chain, tokens, tokensLoading, tokensError, onRetry, balances, walletHint }) {
  useEscapeKey(isOpen, onClose);
  const chainId = chain?.id;
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('popular');
  const [customTokens, setCustomTokens] = useState([]);
  const [remote, setRemote] = useState({ q: '', token: null, loading: false });
  const [importAddress, setImportAddress] = useState('');
  const [importState, setImportState] = useState({ loading: false, token: null, error: '' });

  useEffect(() => {
    if (chainId != null) setCustomTokens(loadCustom(chainId));
    setImportState({ loading: false, token: null, error: '' });
    setImportAddress('');
  }, [chainId]);

  useEffect(() => {
    if (!isOpen) return;
    setSearchTerm('');
    setActiveTab(balances?.supported && balances.list.length ? 'my-tokens' : 'popular');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pick the starting tab when the modal opens
  }, [isOpen, chainId]);

  const popular = useMemo(() => sortTokensPopular(tokens || []), [tokens]);
  const byAddress = useMemo(() => {
    const m = new Map();
    for (const t of tokens || []) m.set(t.address.toLowerCase(), t);
    return m;
  }, [tokens]);

  const myTokens = useMemo(() => {
    const list = (balances?.list || []).map((b) => {
      const known = byAddress.get(String(b.address).toLowerCase()) || (isNativeTokenAddress(b.address) ? popular.find((t) => isNativeTokenAddress(t.address)) : null);
      return known ? { ...known, amount: b.amount } : { chainId, address: b.address, symbol: b.symbol || 'Unknown', name: b.name || b.address, decimals: b.decimals, logoURI: b.logoURI || '', priceUSD: b.priceUSD || '', amount: b.amount, verified: false };
    });
    const usd = (t) => Number(fromBaseUnits(t.amount, t.decimals, 8).replace(/,/g, '')) * (Number(t.priceUSD) || 0);
    return list.sort((a, b) => usd(b) - usd(a));
  }, [balances?.list, byAddress, popular, chainId]);

  const base = activeTab === 'my-tokens' ? myTokens : activeTab === 'custom' ? customTokens : popular;
  const filtered = useMemo(() => searchTokens(base, searchTerm), [base, searchTerm]);

  // Not in the cached list? Ask LI.FI for that exact address or symbol.
  const q = searchTerm.trim();
  const exactLocal = filtered.some((t) => sameAddress(t.address, q) || t.symbol.toLowerCase() === q.toLowerCase());
  useEffect(() => {
    if (!isOpen || activeTab !== 'popular' || chainId == null || q.length < 2 || exactLocal) {
      setRemote({ q: '', token: null, loading: false });
      return undefined;
    }
    const isAddr = looksLikeTokenAddress(q, chain?.chainType);
    if (!isAddr && !/^[A-Za-z0-9.$+-]{2,15}$/.test(q)) return undefined;
    const ctrl = new AbortController();
    setRemote({ q, token: null, loading: true });
    const timer = setTimeout(() => {
      fetchLifiToken(chainId, q, { signal: ctrl.signal })
        .then((token) => setRemote({ q, token, loading: false }))
        .catch(() => {
          if (!ctrl.signal.aborted) setRemote({ q, token: null, loading: false });
        });
    }, 450);
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [isOpen, activeTab, chainId, chain?.chainType, q, exactLocal]);

  const shown = useMemo(() => {
    if (activeTab === 'popular' && remote.token && remote.q === q && !filtered.some((t) => sameAddress(t.address, remote.token.address))) {
      return [{ ...remote.token, _remote: true }, ...filtered];
    }
    return filtered;
  }, [activeTab, remote, q, filtered]);

  const select = (token) => {
    const { _remote, amount, ...clean } = token;
    onTokenSelect(clean);
    onClose();
  };

  const addCustom = (token) => {
    const next = [token, ...customTokens.filter((t) => !sameAddress(t.address, token.address))];
    setCustomTokens(next);
    saveCustom(chainId, next);
  };

  const removeCustom = (token) => {
    const next = customTokens.filter((t) => !sameAddress(t.address, token.address));
    setCustomTokens(next);
    saveCustom(chainId, next);
  };

  const checkImport = async () => {
    const addr = importAddress.trim();
    if (!looksLikeTokenAddress(addr, chain?.chainType)) {
      setImportState({ loading: false, token: null, error: `That doesn't look like a token address on ${chain?.name || 'this network'}.` });
      return;
    }
    setImportState({ loading: true, token: null, error: '' });
    try {
      const token = await fetchLifiToken(chainId, addr);
      if (!sameAddress(token.address, addr) && !isNativeTokenAddress(token.address)) throw new Error('LI.FI returned a different token');
      setImportState({ loading: false, token, error: '' });
    } catch (e) {
      setImportState({ loading: false, token: null, error: explainLifiError({ ...(e?.body || {}), status: e?.status, message: e?.message || '' }) });
    }
  };

  if (!isOpen) return null;

  const emptyText =
    activeTab === 'my-tokens'
      ? balances?.supported
        ? balances.loading
          ? 'Loading your balances…'
          : balances.error || `No tokens with a balance on ${chain?.name}.`
        : walletHint || `Connect a wallet for ${chain?.name || 'this network'} to see your tokens.`
      : activeTab === 'custom'
        ? 'Tokens you import appear here.'
        : tokensLoading || remote.loading
          ? 'Searching…'
          : tokensError || 'No token matches. Paste the token address to look it up.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="token-mgmt-title" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-2xl p-4 shadow-xl sm:p-6"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
        onClick={(e) => e.stopPropagation()}
        data-testid="bridge-token-modal"
      >
        <button className="td-icon-btn absolute right-4 top-4" onClick={onClose} aria-label="Close token selection" type="button">
          ×
        </button>
        <h2 id="token-mgmt-title" className="mb-4 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Select Token
        </h2>

        {activeTab !== 'import' && (
          <div className="mb-3">
            <label htmlFor="token-mgmt-search" className="sr-only">
              Search by name, symbol or address
            </label>
            <input
              id="token-mgmt-search"
              type="text"
              autoComplete="off"
              autoFocus
              placeholder="Search name, symbol or paste address"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="td-field__input w-full text-sm"
              style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              data-testid="bridge-token-search"
            />
          </div>
        )}

        <div className="mb-3 flex gap-1 rounded-lg p-1" style={{ backgroundColor: 'var(--bg-primary)' }} role="tablist" aria-label="Token lists">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-md px-2 py-2 text-xs font-medium transition-colors sm:text-sm ${activeTab === tab.key ? 'td-segmented__btn--active' : ''}`}
              style={activeTab === tab.key ? undefined : { color: 'var(--text-secondary)' }}
              data-testid={`bridge-token-tab-${tab.key}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'import' ? (
          <div className="space-y-3" data-testid="bridge-token-import">
            <label htmlFor="token-mgmt-import-address" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Token address on {chain?.name}
            </label>
            <input
              id="token-mgmt-import-address"
              type="text"
              autoComplete="off"
              placeholder={chain?.chainType === 'EVM' ? '0x…' : 'Token address'}
              value={importAddress}
              onChange={(e) => {
                setImportAddress(e.target.value);
                setImportState({ loading: false, token: null, error: '' });
              }}
              className="td-field__input w-full text-sm"
              style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              data-testid="bridge-token-import-input"
            />
            <button type="button" onClick={checkImport} disabled={importState.loading || !importAddress.trim()} className="td-btn td-btn--primary w-full" data-testid="bridge-token-import-check">
              {importState.loading ? 'Checking with LI.FI…' : 'Check token'}
            </button>
            {importState.error && (
              <p className="text-sm" style={{ color: 'var(--finance-red)' }} role="alert" data-testid="bridge-token-import-error">
                {importState.error}
              </p>
            )}
            {importState.token && (
              <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }} data-testid="bridge-token-import-preview">
                <div className="flex items-center gap-3">
                  <TokenLogo src={importState.token.logoURI} label={importState.token.symbol} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {importState.token.symbol} <span className="text-sm font-normal" style={muted}>{importState.token.name}</span>
                    </p>
                    <p className="text-xs" style={muted}>
                      {importState.token.decimals} decimals{importState.token.priceUSD ? ` · ${formatUsd(importState.token.priceUSD)}` : ''}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs" style={{ color: importState.token.verified ? 'var(--finance-green, #22c55e)' : 'var(--finance-amber, #e8b84a)' }}>
                  {importState.token.verified
                    ? 'LI.FI supports this token and marks it verified.'
                    : 'LI.FI supports this token but has not verified it. Make sure it is the token you mean: anyone can create a token with any name.'}
                </p>
                <button
                  type="button"
                  className="td-btn td-btn--primary mt-3 w-full"
                  onClick={() => {
                    addCustom(importState.token);
                    select(importState.token);
                  }}
                  data-testid="bridge-token-import-use"
                >
                  Import and use {importState.token.symbol}
                </button>
              </div>
            )}
            <p className="text-xs" style={muted}>
              Only import tokens you trust. Copy the address from the project&apos;s official site or a block explorer.
            </p>
          </div>
        ) : shown.length > 0 ? (
          <VirtualList
            items={shown}
            rowHeight={60}
            height={384}
            getKey={(t) => `${t.address}-${t._remote ? 'r' : ''}`}
            testId="bridge-token-list"
            renderRow={(t) => (
              <TokenRow
                token={t}
                balance={activeTab === 'my-tokens' ? t.amount : balances?.balanceOf?.(t)}
                onSelect={select}
                onRemove={activeTab === 'custom' ? removeCustom : null}
                badge={t._remote ? 'LI.FI lookup' : !t.verified && activeTab !== 'my-tokens' ? 'Unverified' : ''}
              />
            )}
          />
        ) : (
          <div className="py-10 text-center text-sm" style={muted} data-testid="bridge-token-empty">
            <p>{emptyText}</p>
            {activeTab === 'popular' && tokensError && onRetry && (
              <button type="button" className="td-btn td-btn--ghost mt-3 text-sm" onClick={onRetry}>
                Try again
              </button>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-center gap-2 border-t pt-3 text-xs" style={{ borderColor: 'var(--border-color)', ...muted }} data-testid="bridge-token-network">
          {chain?.logoURI && <TokenLogo src={chain.logoURI} label={chain.name} size={16} />}
          <span>
            Network: <span style={{ color: 'var(--text-primary)' }}>{chain?.name || 'Loading…'}</span>
            {chain ? ` · ${chainTypeLabel(chain.chainType)}` : ''}
            {tokens?.length ? ` · ${tokens.length.toLocaleString('en-US')} tokens` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useOptionalBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { getBoingL1FullDexReadiness, getFeatureSupport } from '../config/featureSupport';
import { BOING_EXPRESS_ORIGIN, getExternalSwapUrl } from '../config/networkExternalLinks';
import {
  BOING_NETWORK_BOING_PATTERN_AMM_LIQUIDITY_URL,
  BOING_NETWORK_HANDOFF_DEPENDENT_PROJECTS_URL,
} from '../config/boingNetworkDocsUrls';

const SEPOLIA_CHAIN_ID = 11155111;
const NATIVE_VM_PATH = '/boing/native-vm';
const DEPLOY_TOKEN_PATH = '/deploy-token';
const SWAP_TRADE_HASH = '#boing-native-trade';
const SWAP_PATH = `/swap${SWAP_TRADE_HASH}`;
const LIQUIDITY_PATH = '/liquidity';

const FEATURE_COPY = {
  swap: {
    title: 'Trade on Boing testnet',
    body:
      'Connect with Boing Express and use the native pool panel on this page for swaps. The large swap widget below targets EVM routers (e.g. Sepolia), not Boing L1.',
  },
  createPool: {
    title: 'Liquidity on Boing testnet',
    body:
      'Add liquidity to the configured native pool from the Swap page, or use Liquidity for the compact LP + vault shortcuts. EVM “create pair” forms on this site are for other networks.',
  },
  pools: {
    title: 'Pools on Boing testnet',
    body:
      'This list reads EVM factory data when available. On 6913, follow the explorer and the native pool on Swap.',
  },
  bridge: {
    title: 'Bridge on Boing L1',
    body:
      'In-app bridge flows here target EVM-style bridges. On Boing L1 use native transfers and operator docs.',
  },
};

/**
 * When the user is on Boing native L1, EVM-centric DeFi pages show this hub first:
 * Boing VM–first guidance + links to native tools (optional Sepolia only as a separate-network reference).
 */
const STATUS_STYLE = {
  live: { label: 'Live', className: 'text-emerald-400' },
  partial: { label: 'Partial', className: 'text-amber-300' },
  planned: { label: 'Planned', className: 'text-slate-400' },
};

function Pill({ children, tone = 'ok' }) {
  const toneClass =
    tone === 'ok'
      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/35'
      : tone === 'muted'
        ? 'bg-slate-500/10 text-slate-300 border-slate-500/25'
        : 'bg-amber-500/15 text-amber-200 border-amber-500/35';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${toneClass}`}
    >
      {children}
    </span>
  );
}

export default function NativeBoingL1IntegratedHub({ feature = 'swap' }) {
  const { switchNetwork, chainId } = useWallet();
  const integration = useOptionalBoingNativeDexIntegration();
  const [switching, setSwitching] = useState(false);
  const copy = FEATURE_COPY[feature] || FEATURE_COPY.swap;

  const featureSnap = useMemo(() => {
    if (Number(chainId) !== BOING_NATIVE_L1_CHAIN_ID) return null;
    const pool = integration?.effectivePoolHex?.trim() || undefined;
    return getFeatureSupport(chainId, { nativeConstantProductPoolHex: pool || undefined });
  }, [chainId, integration?.effectivePoolHex]);

  const dexReadiness = useMemo(() => {
    if (Number(chainId) !== BOING_NATIVE_L1_CHAIN_ID) return null;
    const pool = integration?.effectivePoolHex?.trim() || undefined;
    return getBoingL1FullDexReadiness(chainId, { nativeConstantProductPoolHex: pool || undefined });
  }, [chainId, integration?.effectivePoolHex]);

  const indexerStatsLive = Boolean(integration?.remoteIndexerStats);

  const onSwitchSepolia = async () => {
    setSwitching(true);
    try {
      await switchNetwork(SEPOLIA_CHAIN_ID);
    } catch (e) {
      console.warn('switchNetwork Sepolia', e);
    } finally {
      setSwitching(false);
    }
  };

  const externalSwap = getExternalSwapUrl(SEPOLIA_CHAIN_ID);

  return (
    <section
      className="boing-feature-banner mb-6 p-5 text-left relative z-10"
      aria-labelledby="native-l1-hub-title"
    >
      <h2 id="native-l1-hub-title" className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        {copy.title}
      </h2>
      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
        {copy.body}
      </p>

      {featureSnap && (
        <div className="flex flex-wrap gap-2 mb-4">
          {featureSnap.deployToken ? (
            <Pill tone="ok">Token deploy (wizard)</Pill>
          ) : (
            <Pill tone="muted">Token deploy</Pill>
          )}
          {featureSnap.hasNativeAmm ? (
            <Pill tone="ok">Pool swap &amp; add liquidity</Pill>
          ) : (
            <Pill tone="muted">Pool not configured</Pill>
          )}
          {featureSnap.nativeVmDex?.swapParityMinimum ? (
            <Pill tone="ok">Factory + multihop router</Pill>
          ) : (
            <Pill tone="muted">Factory / router</Pill>
          )}
          {indexerStatsLive ? (
            <Pill tone="ok">Indexer stats</Pill>
          ) : (
            <Pill tone="muted">Indexer stats</Pill>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <Link
          to={DEPLOY_TOKEN_PATH}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          style={{ background: 'linear-gradient(135deg, var(--finance-primary), #0891b2)' }}
        >
          Deploy a token
        </Link>
        <Link
          to={SWAP_PATH}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          style={{ background: 'linear-gradient(135deg, var(--finance-purple), #7c3aed)' }}
        >
          Native swap
        </Link>
        <Link
          to={LIQUIDITY_PATH}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium border border-cyan-500/40 text-cyan-100 hover:bg-cyan-500/10"
        >
          Liquidity
        </Link>
        <Link
          to={NATIVE_VM_PATH}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium border"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          Advanced tools
        </Link>
      </div>

      <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
        <strong style={{ color: 'var(--text-secondary)' }}>Same Deploy wizard, different chain:</strong> on 6913 you still use{' '}
        <Link to={DEPLOY_TOKEN_PATH} className="text-cyan-400 underline font-medium">
          Deploy Token
        </Link>
        , but deployment is Boing VM bytecode + Boing Express (not MetaMask + Solidity TokenFactory). Docs:{' '}
        <a
          href={BOING_NETWORK_BOING_PATTERN_AMM_LIQUIDITY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 underline"
        >
          AMM pattern
        </a>
        ,{' '}
        <a
          href={BOING_NETWORK_HANDOFF_DEPENDENT_PROJECTS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 underline"
        >
          handoff
        </a>
        .
      </p>

      {dexReadiness && (
        <details
          className="mb-4 rounded-lg border px-3 py-2 text-xs"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
        >
          <summary className="cursor-pointer font-medium text-[var(--text-primary)] select-none">
            Operator checklist (detailed)
          </summary>
          <p className="mt-2 mb-2 opacity-90">
            Everything below is <strong>Boing VM</strong> (32-byte accounts + RPC), not Solidity factories on L1. Operators deploy
            modules and pool contracts; this app wires env + flows.
          </p>
          <ul className="space-y-2 pl-0 list-none">
            {dexReadiness.items.map((row) => {
              const st = STATUS_STYLE[row.status] || STATUS_STYLE.planned;
              return (
                <li key={row.id} className="flex flex-col sm:flex-row sm:items-start sm:gap-2 border-t border-[var(--border-color)] pt-2 first:border-t-0 first:pt-0">
                  <span className={`shrink-0 font-semibold uppercase tracking-wide text-[10px] ${st.className}`}>{st.label}</span>
                  <span className="flex-1">
                    <span className="font-medium text-[var(--text-primary)]">{row.label}</span>
                    <span className="block opacity-90 mt-0.5">{row.detail}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </details>
      )}
      <div className="flex flex-wrap gap-2">
        <a
          href={BOING_EXPRESS_ORIGIN}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--finance-primary)' }}
        >
          Get Boing Express
        </a>
        <button
          type="button"
          onClick={onSwitchSepolia}
          disabled={switching}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium border disabled:opacity-50"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          {switching ? 'Switching…' : 'Try Sepolia (EVM DEX)'}
        </button>
        {externalSwap && (
          <a
            href={externalSwap}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium border"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            External DEX (Sepolia)
          </a>
        )}
      </div>
      <p className="text-[10px] mt-3 opacity-80" style={{ color: 'var(--text-tertiary)' }}>
        Chain {BOING_NATIVE_L1_CHAIN_ID}. Routes that use several pools need those pairs to exist on the factory first;
        until then, use the native swap panel on the known pool, or open Advanced tools.
      </p>
    </section>
  );
}

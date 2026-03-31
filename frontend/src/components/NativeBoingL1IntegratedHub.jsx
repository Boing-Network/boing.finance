import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { getExternalSwapUrl } from '../config/networkExternalLinks';

const SEPOLIA_CHAIN_ID = 11155111;
const NATIVE_VM_PATH = '/boing/native-vm';
const AMM_PATTERN_DOC =
  'https://github.com/boing-network/boing.network/blob/main/docs/BOING-PATTERN-AMM-LIQUIDITY.md';

const FEATURE_COPY = {
  swap: {
    title: 'Swaps on Boing L1',
    body:
      'This page’s swap engine talks to an EVM router (Uniswap-style). Boing testnet (chain 6913) does not have those contracts configured here yet—native trading needs Boing VM AMM bytecode deployed and wired like Sepolia.',
  },
  createPool: {
    title: 'Liquidity pools on Boing L1',
    body:
      'Pool creation here uses an EVM DEXFactory. On Boing L1, liquidity lives in native VM contracts once they are deployed and exposed in this app (same pattern as EVM, different bytecode and calldata).',
  },
  pools: {
    title: 'Pool list on Boing L1',
    body:
      'Positions below are loaded from EVM subgraph / RPC paths. On Boing L1, use native tools until indexer + factory addresses are integrated.',
  },
  bridge: {
    title: 'Bridge on Boing L1',
    body:
      'Cross-chain bridges in this app target EVM ecosystems. Move assets via supported EVM chains, then use Boing native flows for L1 activity.',
  },
};

/**
 * When the user is on Boing native L1, EVM-centric DeFi pages show this hub first:
 * honest limits + links to in-app native VM tools and Sepolia DEX.
 */
export default function NativeBoingL1IntegratedHub({ feature = 'swap' }) {
  const { switchNetwork } = useWallet();
  const [switching, setSwitching] = useState(false);
  const copy = FEATURE_COPY[feature] || FEATURE_COPY.swap;

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
      className="mb-6 rounded-xl border p-5 text-left"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'rgba(20, 184, 166, 0.45)',
      }}
      aria-labelledby="native-l1-hub-title"
    >
      <h2 id="native-l1-hub-title" className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        {copy.title} — native Boing integration
      </h2>
      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
        {copy.body}{' '}
        <a href={AMM_PATTERN_DOC} target="_blank" rel="noopener noreferrer" className="text-teal-400 underline hover:text-teal-300">
          AMM pattern (docs)
        </a>
        .
      </p>
      <ul className="text-xs space-y-1.5 list-disc pl-5 mb-4" style={{ color: 'var(--text-tertiary)' }}>
        <li>
          <strong className="text-[var(--text-primary)]">Works in this app on 6913:</strong> Boing Express transfers, QA-gated deploys,
          contract calls, bond/unbond —{' '}
          <Link to={NATIVE_VM_PATH} className="text-teal-400 underline font-medium">
            Native VM &amp; RPC
          </Link>
          .
        </li>
        <li>
          <strong className="text-[var(--text-primary)]">In-app EVM DEX</strong> (swap / factory pools): switch to{' '}
          <strong>Sepolia</strong> where routers are configured, or open an external DEX.
        </li>
      </ul>
      <div className="flex flex-wrap gap-2">
        <Link
          to={NATIVE_VM_PATH}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--accent-primary, #0d9488)' }}
        >
          Open native Boing tools
        </Link>
        <button
          type="button"
          onClick={onSwitchSepolia}
          disabled={switching}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium border disabled:opacity-50"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          {switching ? 'Switching…' : 'Switch wallet to Sepolia (DEX)'}
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
        Chain {BOING_NATIVE_L1_CHAIN_ID} (0x1b01). Full parity with every EVM feature is a multi-step rollout: deploy contracts on Boing VM,
        add addresses to config, and encode calls — not a single toggle.
      </p>
    </section>
  );
}

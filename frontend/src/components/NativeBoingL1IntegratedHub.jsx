import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { BOING_EXPRESS_ORIGIN, getExternalSwapUrl } from '../config/networkExternalLinks';

const SEPOLIA_CHAIN_ID = 11155111;
const NATIVE_VM_PATH = '/boing/native-vm';
const AMM_PATTERN_DOC =
  'https://github.com/boing-network/boing.network/blob/main/docs/BOING-PATTERN-AMM-LIQUIDITY.md';

const FEATURE_COPY = {
  swap: {
    title: 'Swaps on Boing L1',
    body:
      'Boing L1 runs the Boing VM only. On testnet (6913), use the native constant-product pool panel when a pool id is configured, or Native VM / Boing Express flows. The classic swap box below is for other networks that expose an EVM router in config.',
  },
  createPool: {
    title: 'Liquidity pools on Boing L1',
    body:
      'Pool creation on Boing is via Boing VM contracts and RPC — not the EVM factory form on this page. When a native pool is configured, add liquidity from the Swap page with Boing Express; otherwise use Native VM tools.',
  },
  pools: {
    title: 'Pool list on Boing L1',
    body:
      'This list is backed by EVM factory data where configured. On Boing testnet, track native pool activity from the Swap page and explorer.',
  },
  bridge: {
    title: 'Bridge on Boing L1',
    body:
      'In-app bridge UIs that target Solidity bridges apply on EVM networks. For Boing L1, use native transfers and operator-documented bridge flows.',
  },
};

/**
 * When the user is on Boing native L1, EVM-centric DeFi pages show this hub first:
 * Boing VM–first guidance + links to native tools (optional Sepolia only as a separate-network reference).
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
          <strong className="text-[var(--text-primary)]">Other networks in this app</strong> may use an EVM router from
          config (e.g. Sepolia for testing). That path does not run on Boing L1 itself.
        </li>
      </ul>
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
        <Link
          to={NATIVE_VM_PATH}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--finance-purple)' }}
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
          {switching ? 'Switching…' : 'Optional: Sepolia (EVM DEX in this app)'}
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
        Chain {BOING_NATIVE_L1_CHAIN_ID} (0x1b01). Boing does not host Solidity factories as the source of truth;
        operators publish Boing VM module and pool ids (see env + `contracts.js` native entries), then dApps call them via Boing RPC.
      </p>
    </section>
  );
}

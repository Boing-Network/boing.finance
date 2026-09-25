import React from 'react';
import { Link } from 'react-router-dom';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { BOING_NETWORK_HANDOFF_DEPENDENT_PROJECTS_URL } from '../config/boingNetworkDocsUrls';
import { useNetwork } from '../hooks/useNetwork';

/**
 * Always-on honesty banner for /bridge.
 * Clarifies that LI.FI / EVM aggregator-style UX is not a Boing VM bridge protocol,
 * and that Boing L1 (6913) has no live cross-chain bridge module yet.
 */
export default function NativeBoingBridgeBanner() {
  const { network } = useNetwork();
  const onBoingL1 = network && Number(network.chainId) === BOING_NATIVE_L1_CHAIN_ID;

  return (
    <div
      className="mb-6 rounded-xl border px-4 py-3 text-sm space-y-2"
      role="status"
      style={{
        borderColor: 'rgba(251, 191, 36, 0.5)',
        backgroundColor: 'rgba(251, 191, 36, 0.07)',
        color: 'var(--text-secondary)',
      }}
    >
      <p>
        <strong style={{ color: 'var(--text-primary)' }}>Bridge status: planned / not live.</strong>{' '}
        This page is an <strong>honest scaffold</strong> for future cross-chain transfers. It does{' '}
        <strong>not</strong> execute LI.FI, third-party bridges, or a Boing L1 VM bridge. Estimates and forms are
        informational only; the submit button stays gated.
      </p>
      <p>
        <strong style={{ color: 'var(--text-primary)' }}>EVM desk:</strong> same-chain swaps may use LI.FI / Uniswap
        fallbacks on the Swap page when Boing DEX is not deployed. That is <em>not</em> a Boing-native bridge.
      </p>
      <p>
        <strong style={{ color: 'var(--text-primary)' }}>Boing L1 (6913):</strong>{' '}
        {onBoingL1 ? (
          <>
            you are on Boing now — native BOING transfers use{' '}
            <Link to="/boing/native-vm" className="text-cyan-400 underline hover:text-cyan-300">
              Native VM tools
            </Link>{' '}
            / Boing Express. A dedicated VM bridge protocol + UI is still product work (see capability matrix).
          </>
        ) : (
          <>
            Boing is excluded from the EVM chain picker below. Switch to chain {BOING_NATIVE_L1_CHAIN_ID} for native
            balance / Express flows; a full Boing↔EVM bridge needs protocol + operator work first.
          </>
        )}
      </p>
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        Spec / partner handoff:{' '}
        <a
          href={BOING_NETWORK_HANDOFF_DEPENDENT_PROJECTS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 underline hover:text-cyan-300"
        >
          HANDOFF-DEPENDENT-PROJECTS.md
        </a>
        {' · '}
        <Link to="/docs" className="text-cyan-400 underline hover:text-cyan-300">
          Docs
        </Link>
      </p>
    </div>
  );
}

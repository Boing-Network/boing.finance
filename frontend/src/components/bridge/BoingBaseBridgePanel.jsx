import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BOING_BASE_BRIDGE_FEE_LABEL,
  BOING_BASE_BRIDGE_TESTNET,
  boingBaseBridgeStatusLabel,
  isBoingBaseBridgeConfigured,
} from '../../config/boingBaseBridge';
import { BOING_NATIVE_L1_CHAIN_ID } from '../../config/networks';

const card = { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' };
const muted = { color: 'var(--text-tertiary)' };

/**
 * Native Boing ↔ Base panel (distinct from LI.FI). Testnet-first; no mainnet enablement here.
 */
export default function BoingBaseBridgePanel() {
  const [direction, setDirection] = useState(/** @type {'to-base' | 'to-boing'} */ ('to-base'));
  const configured = isBoingBaseBridgeConfigured();

  return (
    <div className="rounded-2xl p-5 space-y-4" style={card} data-testid="boing-base-bridge-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Boing ↔ Base
          </h2>
          <p className="text-sm mt-1" style={muted}>
            Inventory-free lock/mint · {BOING_BASE_BRIDGE_FEE_LABEL} fee · validator ⌈2/3⌉ stake
            attestation. Testnet only (Boing {BOING_NATIVE_L1_CHAIN_ID} ↔ Base Sepolia{' '}
            {BOING_BASE_BRIDGE_TESTNET.baseChainId}).
          </p>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-md"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
        >
          Native path
        </span>
      </div>

      <p className="text-sm" style={{ color: 'var(--text-secondary)' }} data-testid="boing-base-bridge-status">
        {boingBaseBridgeStatusLabel()}
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          className={`td-btn ${direction === 'to-base' ? '' : 'td-btn--ghost'}`}
          onClick={() => setDirection('to-base')}
        >
          Boing → Base
        </button>
        <button
          type="button"
          className={`td-btn ${direction === 'to-boing' ? '' : 'td-btn--ghost'}`}
          onClick={() => setDirection('to-boing')}
        >
          Base → Boing
        </button>
      </div>

      <ol className="text-sm space-y-2 list-decimal pl-5" style={{ color: 'var(--text-secondary)' }}>
        {direction === 'to-base' ? (
          <>
            <li>Connect Boing Express on chain {BOING_NATIVE_L1_CHAIN_ID}.</li>
            <li>
              Submit <code>BridgeLockToBase</code> (locks BOING; {BOING_BASE_BRIDGE_FEE_LABEL} to
              treasury).
            </li>
            <li>Validators attest; relayer calls Base vault <code>mintWithAttestation</code> → bBOING.</li>
          </>
        ) : (
          <>
            <li>On Base Sepolia, burn bBOING via vault <code>burnToBoing</code>.</li>
            <li>Validators Ed25519-attest the burn (≥ ⌈2W/3⌉ stake).</li>
            <li>
              Submit <code>BridgeClaimFromBase</code> on Boing to unlock escrowed BOING.
            </li>
          </>
        )}
      </ol>

      {!configured && (
        <p className="text-sm" style={muted}>
          Execution stays disabled in the UI until vault addresses are set. Operators: see{' '}
          <Link to="/docs" className="underline">
            docs
          </Link>{' '}
          / <code>docs/bridge.md</code> and the project pack{' '}
          <code>boing-base-bridge-implementation.md</code>.
        </p>
      )}

      {configured && (
        <div className="text-xs font-mono space-y-1" style={muted}>
          <div>vault: {BOING_BASE_BRIDGE_TESTNET.vault}</div>
          <div>bBOING: {BOING_BASE_BRIDGE_TESTNET.bridgedBoing}</div>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            Signing from this panel lands after node activation + attestor keys. Until then this is
            status + guidance only (no silent mainnet).
          </p>
        </div>
      )}
    </div>
  );
}

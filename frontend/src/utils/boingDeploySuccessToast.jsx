import React from 'react';
import toast from 'react-hot-toast';
import { getBoingObserverAccountUrl, getBoingObserverTxUrl } from '../config/boingExplorerUrls';

/**
 * @param {{ txHash?: string, boingTxIdHex?: string | null, deployedAccountId?: string | null }} result
 */
export function showBoingContractIncludedToast(deployedAccountId) {
  if (!deployedAccountId || typeof deployedAccountId !== 'string') return;
  toast.custom(
    () => (
      <div
        className="rounded-lg px-4 py-3 text-sm max-w-md shadow-lg border"
        style={{
          backgroundColor: 'var(--bg-card, #0f172a)',
          color: 'var(--text-primary, #f8fafc)',
          borderColor: 'var(--border-color, #334155)',
        }}
      >
        <div className="font-medium mb-1" style={{ color: 'var(--finance-green-mid, #22c55e)' }}>
          Contract included on-chain
        </div>
        <a
          href={getBoingObserverAccountUrl(deployedAccountId)}
          className="underline block"
          style={{ color: 'var(--accent-cyan, #38bdf8)' }}
          target="_blank"
          rel="noopener noreferrer"
        >
          View contract on boing.observer
        </a>
      </div>
    ),
    { duration: 12_000 }
  );
}

export function showBoingLaunchDeploySuccessToast(result) {
  const deployed = result.deployedAccountId && typeof result.deployedAccountId === 'string' ? result.deployedAccountId : null;
  const txId = result.boingTxIdHex && typeof result.boingTxIdHex === 'string' ? result.boingTxIdHex : null;

  toast.custom(
    () => (
      <div
        className="rounded-lg px-4 py-3 text-sm max-w-md shadow-lg border"
        style={{
          backgroundColor: 'var(--bg-card, #0f172a)',
          color: 'var(--text-primary, #f8fafc)',
          borderColor: 'var(--border-color, #334155)',
        }}
      >
        <div className="font-medium mb-1" style={{ color: 'var(--finance-green-mid, #22c55e)' }}>
          Deploy submitted
        </div>
        {deployed ? (
          <a
            href={getBoingObserverAccountUrl(deployed)}
            className="underline block"
            style={{ color: 'var(--accent-cyan, #38bdf8)' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            View contract on boing.observer
          </a>
        ) : txId ? (
          <a
            href={getBoingObserverTxUrl(txId)}
            className="underline block"
            style={{ color: 'var(--accent-cyan, #38bdf8)' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Track transaction on boing.observer
          </a>
        ) : (
          <p className="text-xs opacity-90" style={{ color: 'var(--text-secondary)' }}>
            Mempool accepted the tx. Open Native VM or explorer if links are unavailable.
          </p>
        )}
      </div>
    ),
    { duration: 10_000 }
  );
}

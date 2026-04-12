import React from 'react';
import toast from 'react-hot-toast';
import {
  BOING_OBSERVER_BASE_URL,
  buildBoingExplorerAccountUrl,
  buildBoingExplorerTxUrl,
} from '../config/boingExplorerUrls';
import { showDeployCelebration } from './deployCelebration';

/**
 * @param {string} deployedAccountId
 * @param {string | null | undefined} explorerBaseUrl
 */
export function showBoingContractIncludedToast(deployedAccountId, explorerBaseUrl) {
  if (!deployedAccountId || typeof deployedAccountId !== 'string') return;
  const base = explorerBaseUrl || BOING_OBSERVER_BASE_URL;
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
          href={buildBoingExplorerAccountUrl(base, deployedAccountId)}
          className="underline block"
          style={{ color: 'var(--accent-cyan, #38bdf8)' }}
          target="_blank"
          rel="noopener noreferrer"
        >
          View contract in explorer
        </a>
      </div>
    ),
    { duration: 12_000 }
  );
}

/**
 * @param {{
 *   txHash?: string,
 *   boingTxIdHex?: string | null,
 *   deployedAccountId?: string | null,
 *   explorerBaseUrl?: string | null,
 *   celebration?: {
 *     title?: string,
 *     deploymentKind: string,
 *     details?: Array<{ label: string, value: string }>,
 *     externalTxUrl?: string | null,
 *     externalAddressUrl?: string | null,
 *     evmExplorerBaseUrl?: string | null,
 *     links?: Array<{ label: string, href: string }>,
 *   },
 * }} result
 */
export function showBoingLaunchDeploySuccessToast(result) {
  const { celebration, ...rest } = result;
  const base = rest.explorerBaseUrl || BOING_OBSERVER_BASE_URL;
  const deployed = rest.deployedAccountId && typeof rest.deployedAccountId === 'string' ? rest.deployedAccountId : null;
  const txId = rest.boingTxIdHex && typeof rest.boingTxIdHex === 'string' ? rest.boingTxIdHex : null;

  if (celebration && typeof document !== 'undefined') {
    showDeployCelebration({
      title: celebration.title,
      deploymentKind: celebration.deploymentKind,
      details: celebration.details ?? [],
      txHash: rest.txHash,
      boingTxIdHex: rest.boingTxIdHex,
      contractAddress: rest.deployedAccountId ?? celebration.contractAddress,
      explorerBaseUrl: rest.explorerBaseUrl,
      externalTxUrl: celebration.externalTxUrl,
      externalAddressUrl: celebration.externalAddressUrl,
      evmExplorerBaseUrl: celebration.evmExplorerBaseUrl,
      links: celebration.links,
    });
  }

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
        {celebration ? (
          <p className="text-xs opacity-90" style={{ color: 'var(--text-secondary)' }}>
            See the celebration dialog for transaction details and explorer links.
          </p>
        ) : deployed ? (
          <a
            href={buildBoingExplorerAccountUrl(base, deployed)}
            className="underline block"
            style={{ color: 'var(--accent-cyan, #38bdf8)' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            View contract in explorer
          </a>
        ) : txId ? (
          <a
            href={buildBoingExplorerTxUrl(base, txId)}
            className="underline block"
            style={{ color: 'var(--accent-cyan, #38bdf8)' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Track transaction in explorer
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

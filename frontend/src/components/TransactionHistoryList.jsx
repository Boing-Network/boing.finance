import React from 'react';
import { NETWORKS } from '../config/networks';
import {
  formatRelativeTime,
  getStatusColor,
  getTransactionSubtitle,
  getTransactionTitle,
  getTransactionValue,
  openTransactionExplorer,
} from '../utils/transactionHistoryDisplay';

function TransactionTypeIcon({ type, size = 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 16 : 18;

  const wrap = (bg, children) => (
    <div className={`${dim} ${bg} rounded-full flex items-center justify-center shrink-0`}>{children}</div>
  );

  switch (type) {
    case 'swap':
      return wrap(
        'bg-blue-500',
        <svg width={iconSize} height={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    case 'liquidity':
      return wrap(
        'bg-green-500',
        <svg width={iconSize} height={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      );
    case 'bridge':
      return wrap(
        'bg-purple-500',
        <svg width={iconSize} height={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      );
    default:
      return wrap(
        'bg-gray-500',
        <svg width={iconSize} height={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

function StatusBadge({ status }) {
  if (!status) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs capitalize ${getStatusColor(status)}`}>
      {status}
    </span>
  );
}

function TransactionCard({
  tx,
  compact = false,
  showStatus = true,
  showNetwork = true,
  onOpenExplorer,
}) {
  const title = getTransactionTitle(tx);
  const subtitle = getTransactionSubtitle(tx);
  const value = getTransactionValue(tx);
  const networkName = tx.chainId
    ? NETWORKS[tx.chainId]?.name || `Chain ${tx.chainId}`
    : null;

  return (
    <article
      className={`rounded-xl border transition-colors ${
        compact
          ? 'p-3 bg-gray-700/50 border-gray-600 hover:bg-gray-700/70'
          : 'p-4 bg-theme-secondary border-theme hover:bg-theme-tertiary'
      }`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <TransactionTypeIcon type={tx.type} size={compact ? 'sm' : 'md'} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className={`font-medium truncate ${compact ? 'text-white text-sm' : 'text-theme-primary'}`}>
                  {title}
                </h3>
                {showStatus && tx.status && <StatusBadge status={tx.status} />}
              </div>
              <p className={`mt-0.5 truncate ${compact ? 'text-xs text-gray-400' : 'text-sm text-theme-secondary'}`}>
                {subtitle}
              </p>
              {showNetwork && networkName && (
                <p className="text-xs text-gray-500 mt-1 sm:hidden">{networkName}</p>
              )}
            </div>
            {value && (
              <p className={`font-medium shrink-0 ${compact ? 'text-white text-sm' : 'text-theme-primary'}`}>
                {value}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
            {showNetwork && networkName && (
              <span className="hidden sm:inline text-xs text-gray-500">{networkName}</span>
            )}
            {tx.txHash && onOpenExplorer && (
              <button
                type="button"
                onClick={() => onOpenExplorer(tx.txHash, tx.chainId)}
                aria-label={`View ${title} transaction ${tx.txHash.slice(0, 10)}… on explorer${networkName ? ` (${networkName})` : ''}`}
                className={`text-xs font-medium underline-offset-2 hover:underline ${
                  compact ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-400 hover:text-blue-300'
                }`}
              >
                View on Explorer
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Responsive transaction list — card layout on all viewports (no horizontal table squeeze).
 *
 * @param {{
 *   transactions: Array<object>,
 *   compact?: boolean,
 *   showStatus?: boolean,
 *   showNetwork?: boolean,
 *   emptyMessage?: string,
 *   className?: string,
 * }} props
 */
export default function TransactionHistoryList({
  transactions = [],
  compact = false,
  showStatus = true,
  showNetwork = true,
  emptyMessage = 'No transactions yet',
  className = '',
}) {
  if (!transactions.length) {
    return (
      <p className={`text-sm text-center py-6 ${compact ? 'text-gray-400' : 'text-theme-secondary'}`}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className={`space-y-2 sm:space-y-3 ${className}`}>
      {transactions.map((tx) => (
        <TransactionCard
          key={tx.id || tx.txHash || `${tx.type}-${tx.timestamp}`}
          tx={tx}
          compact={compact}
          showStatus={showStatus}
          showNetwork={showNetwork}
          onOpenExplorer={openTransactionExplorer}
        />
      ))}
    </div>
  );
}

export { formatRelativeTime, openTransactionExplorer };

const DEFAULT_EXPLORERS = {
  1: 'https://etherscan.io/tx/',
  137: 'https://polygonscan.com/tx/',
  56: 'https://bscscan.com/tx/',
  42161: 'https://arbiscan.io/tx/',
  10: 'https://optimistic.etherscan.io/tx/',
  8453: 'https://basescan.org/tx/',
  11155111: 'https://sepolia.etherscan.io/tx/',
};

export function formatRelativeTime(timestamp) {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function openTransactionExplorer(txHash, chainId, explorers = DEFAULT_EXPLORERS) {
  if (!txHash) return;
  const explorer = explorers[chainId] || explorers[1];
  window.open(explorer + txHash, '_blank');
}

export function getTransactionTitle(tx) {
  if (tx.type === 'swap') {
    if (tx.from && tx.to) return `${tx.from} → ${tx.to}`;
    return 'Swap';
  }
  if (tx.type === 'liquidity') {
    if (tx.action && tx.pair) return `${tx.action} ${tx.pair}`;
    if (tx.action === 'add') return 'Add Liquidity';
    if (tx.action === 'remove') return 'Remove Liquidity';
    return 'Liquidity';
  }
  if (tx.type === 'bridge') {
    if (tx.fromChain || tx.toChain) return `Bridge ${tx.fromChain || ''} → ${tx.toChain || ''}`.trim();
    if (tx.from && tx.to) return `${tx.from} → ${tx.to}`;
    return 'Bridge';
  }
  return tx.action || tx.type || 'Activity';
}

export function getTransactionSubtitle(tx) {
  const parts = [];
  if (tx.amount && typeof tx.amount === 'string') parts.push(tx.amount);
  else if (tx.amount != null) parts.push(String(tx.amount));
  if (tx.timestamp) parts.push(formatRelativeTime(tx.timestamp));
  if (tx.source === 'tracked') parts.push('tracked');
  return parts.join(' · ') || formatRelativeTime(tx.timestamp);
}

export function getTransactionValue(tx) {
  if (tx.type === 'swap' && tx.value && tx.to) return `${tx.value} ${tx.to}`;
  if (tx.type === 'liquidity' && tx.amount && tx.action) return `${tx.amount} ${tx.action}`;
  if (tx.type === 'bridge' && tx.amount && tx.from) return `${tx.amount} ${tx.from}`;
  return null;
}

export function getStatusColor(status) {
  switch (status) {
    case 'confirmed':
      return 'text-green-400';
    case 'pending':
      return 'text-yellow-400';
    case 'failed':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

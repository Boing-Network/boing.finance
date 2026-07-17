import React from 'react';
import { InfoTooltip } from './Tooltip';

/**
 * Security status panel. Live audit/honeypot APIs are not wired yet —
 * show an honest unavailable state instead of mock Certik scores.
 */
export default function SecurityBadges({
  tokenAddress,
  className = '',
}) {
  if (!tokenAddress) return null;

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">Security Status</h3>
        <InfoTooltip content="Automated audit and honeypot checks are not available in the app yet. Verify contracts on explorers and trusted scanners before interacting." />
      </div>
      <div className="rounded-lg border border-amber-500/30 bg-amber-900/20 p-3">
        <p className="text-sm font-medium text-amber-200">Live security scan unavailable</p>
        <p className="text-xs text-amber-100/80 mt-1">
          We do not show mock audit scores. Check the contract on a block explorer and independent scanners before trading or importing tokens.
        </p>
      </div>
    </div>
  );
}

import React from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useChainType, useSolanaWallet, CHAIN_TYPE_SOLANA } from '../contexts/SolanaWalletContext';
import { SOLANA_NETWORKS } from '../config/solanaConfig';

/**
 * When the user is connected to any EVM testnet or Solana devnet, explains that
 * balances are test-only (not real money), regardless of USD hints in the UI.
 */
export default function DevnetCurrencyDisclaimer() {
  const { isConnected, getCurrentNetwork } = useWallet();
  const { chainType } = useChainType();
  const { connected: solConnected, network: solanaCluster } = useSolanaWallet();

  if (chainType === CHAIN_TYPE_SOLANA) {
    if (!solConnected) return null;
    const meta = SOLANA_NETWORKS[solanaCluster] || SOLANA_NETWORKS.devnet;
    if (!meta.isTestnet) return null;
    return (
      <section
        className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pt-2 pb-0"
        aria-label="Development network currency notice"
      >
        <p
          className="rounded-lg border px-3 py-2.5 text-xs sm:text-sm leading-snug"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--finance-amber, #f59e0b) 12%, var(--bg-secondary))',
            borderColor: 'color-mix(in srgb, var(--finance-amber, #f59e0b) 35%, var(--border-color))',
            color: 'var(--text-secondary)',
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>{meta.name}</strong> uses{' '}
          <strong style={{ color: 'var(--text-primary)' }}>test SOL</strong> only — not real currency, no
          guaranteed value, and usually obtained from a faucet. The same applies to{' '}
          <strong style={{ color: 'var(--text-primary)' }}>all devnets</strong>: funds are for development
          and demos, not legal tender.
        </p>
      </section>
    );
  }

  const network = typeof getCurrentNetwork === 'function' ? getCurrentNetwork() : null;
  if (!isConnected || !network?.isTestnet) return null;

  const nativeSymbol = network.nativeCurrency?.symbol || 'native tokens';
  const netName = network.name || `Chain ${network.chainId}`;

  return (
    <section
      className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pt-2 pb-0"
      aria-label="Development network currency notice"
    >
      <p
        className="rounded-lg border px-3 py-2.5 text-xs sm:text-sm leading-snug"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--finance-amber, #f59e0b) 12%, var(--bg-secondary))',
          borderColor: 'color-mix(in srgb, var(--finance-amber, #f59e0b) 35%, var(--border-color))',
          color: 'var(--text-secondary)',
        }}
      >
        You are on <strong style={{ color: 'var(--text-primary)' }}>{netName}</strong> — balances are{' '}
        <strong style={{ color: 'var(--text-primary)' }}>test {nativeSymbol}</strong>, not real money. They
        have no guaranteed real-world value and are often free from a faucet. On{' '}
        <strong style={{ color: 'var(--text-primary)' }}>every devnet</strong>, treat tokens as fake
        currency for building and testing only; any USD amounts shown elsewhere are references or estimates,
        not a claim that test funds are redeemable.
      </p>
    </section>
  );
}

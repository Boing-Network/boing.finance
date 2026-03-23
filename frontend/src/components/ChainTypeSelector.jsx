/**
 * Chain Type Selector - Switch between EVM and Solana
 * Solana devnet/mainnet toggle lives in wallet modal and wallet dropdown (no navbar shift).
 */
import React from 'react';
import { useChainType } from '../contexts/SolanaWalletContext';

const CHAIN_TYPES = [
  { id: 'evm', label: 'EVM', networks: 'EVM chains', icon: '⟠' },
  { id: 'solana', label: 'Solana', networks: 'Mainnet & Devnet', icon: '◎' },
];

export default function ChainTypeSelector() {
  const { chainType, setChainType } = useChainType();

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <div className="flex items-center gap-1 p-1 rounded-lg bg-black/20 border" style={{ borderColor: 'var(--border-color)' }}>
        {CHAIN_TYPES.map((ct) => (
          <button
            key={ct.id}
            onClick={() => setChainType(ct.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              chainType === ct.id
                ? 'bg-[var(--secondary-bg)] text-primary'
                : 'hover:bg-white/5'
            }`}
            style={{
              color: chainType === ct.id ? 'var(--primary-color)' : 'var(--text-secondary)',
            }}
            title={ct.networks}
          >
            <span className="mr-1">{ct.icon}</span>
            {ct.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Chain Type Selector - Switch between EVM and Solana
 * When Solana: shows mainnet/devnet toggle
 */
import React from 'react';
import { useChainType, useSolanaWallet } from '../contexts/SolanaWalletContext';

const CHAIN_TYPES = [
  { id: 'evm', label: 'EVM', networks: 'EVM chains', icon: '⟠' },
  { id: 'solana', label: 'Solana', networks: 'Mainnet & Devnet', icon: '◎' },
];

export default function ChainTypeSelector() {
  const { chainType, setChainType, isSolana } = useChainType();
  const { network, setSolanaNetwork } = useSolanaWallet();

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <div className="flex items-center gap-1 p-1 rounded-lg bg-black/20 border" style={{ borderColor: 'var(--border-color)' }}>
        {CHAIN_TYPES.map((ct) => (
          <button
            key={ct.id}
            onClick={() => setChainType(ct.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              chainType === ct.id
                ? 'bg-cyan-500/30 text-cyan-300'
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
      {isSolana && (
        <div className="flex items-center gap-1 p-1 rounded-lg bg-black/10 border" style={{ borderColor: 'var(--border-color)' }}>
          {['devnet', 'mainnet'].map((net) => (
            <button
              key={net}
              onClick={() => setSolanaNetwork(net)}
              className={`px-2 py-1 rounded text-xs font-medium ${
                network === net ? 'bg-cyan-500/30 text-cyan-300' : 'hover:bg-white/5'
              }`}
              style={{ color: network === net ? 'var(--primary-color)' : 'var(--text-secondary)' }}
            >
              {net === 'mainnet' ? 'Mainnet' : 'Devnet'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

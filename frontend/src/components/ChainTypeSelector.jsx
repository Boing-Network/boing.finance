/**
 * Chain type selector — EVM / Boing / Solana.
 * Labels stay hidden from the `nav` breakpoint until 2xl so three options do not wrap the header.
 */
import React, { useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import {
  useChainType,
  CHAIN_TYPE_EVM,
  CHAIN_TYPE_BOING,
  CHAIN_TYPE_SOLANA,
} from '../contexts/SolanaWalletContext';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';

const LAST_EVM_CHAIN_KEY = 'boing_last_evm_chain_id';
const DEFAULT_EVM_CHAIN_ID = 11155111;

const CHAIN_TYPES = [
  { id: CHAIN_TYPE_EVM, label: 'EVM', networks: 'Ethereum-compatible chains', icon: '⟠' },
  { id: CHAIN_TYPE_BOING, label: 'Boing', networks: 'Boing L1 (6913)', icon: '🌀' },
  { id: CHAIN_TYPE_SOLANA, label: 'Solana', networks: 'Mainnet & Devnet', icon: '◎' },
];

function readLastEvmChainId() {
  try {
    const n = Number(localStorage.getItem(LAST_EVM_CHAIN_KEY));
    if (Number.isFinite(n) && n > 0 && n !== BOING_NATIVE_L1_CHAIN_ID) return n;
  } catch {
    /* ignore */
  }
  return DEFAULT_EVM_CHAIN_ID;
}

function writeLastEvmChainId(chainId) {
  const n = Number(chainId);
  if (!Number.isFinite(n) || n <= 0 || n === BOING_NATIVE_L1_CHAIN_ID) return;
  try {
    localStorage.setItem(LAST_EVM_CHAIN_KEY, String(n));
  } catch {
    /* ignore */
  }
}

export default function ChainTypeSelector() {
  const { chainType, setChainType } = useChainType();
  const { chainId, isConnected, switchNetwork } = useWallet();

  useEffect(() => {
    writeLastEvmChainId(chainId);
  }, [chainId]);

  useEffect(() => {
    if (Number(chainId) !== BOING_NATIVE_L1_CHAIN_ID) return;
    if (chainType === CHAIN_TYPE_SOLANA) return;
    if (chainType !== CHAIN_TYPE_BOING) setChainType(CHAIN_TYPE_BOING);
    // Only when the wallet chain id changes — not when the user clicks EVM while still on 6913.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chainType is read, not a trigger
  }, [chainId, setChainType]);

  const onSelect = async (id) => {
    if (id === chainType) return;
    setChainType(id);
    if (!isConnected || typeof switchNetwork !== 'function') return;
    if (id === CHAIN_TYPE_BOING && Number(chainId) !== BOING_NATIVE_L1_CHAIN_ID) {
      await switchNetwork(BOING_NATIVE_L1_CHAIN_ID);
    } else if (id === CHAIN_TYPE_EVM && Number(chainId) === BOING_NATIVE_L1_CHAIN_ID) {
      await switchNetwork(readLastEvmChainId());
    }
  };

  return (
    <div className="flex items-center flex-shrink-0">
      <div
        className="flex items-center gap-0.5 p-0.5 rounded-lg bg-black/20 border"
        style={{ borderColor: 'var(--border-color)' }}
        role="group"
        aria-label="Chain family"
      >
        {CHAIN_TYPES.map((ct) => {
          const selected = chainType === ct.id;
          return (
            <button
              key={ct.id}
              type="button"
              onClick={() => onSelect(ct.id)}
              aria-pressed={selected}
              aria-label={ct.label}
              title={`${ct.label} — ${ct.networks}`}
              className={`inline-flex items-center justify-center gap-1 px-1.5 py-1.5 2xl:px-2.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                selected ? 'bg-[var(--secondary-bg)] text-primary' : 'hover:bg-white/5'
              }`}
              style={{
                color: selected ? 'var(--primary-color)' : 'var(--text-secondary)',
              }}
            >
              <span aria-hidden="true">{ct.icon}</span>
              <span className="inline nav:hidden 2xl:inline">{ct.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

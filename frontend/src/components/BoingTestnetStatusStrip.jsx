import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import {
  fetchBoingTestnetChainHeight,
  requestBoingTestnetFaucet,
  normalizeBoingFaucetAccountHex
} from '../services/boingTestnetRpc';

const FAUCET_WEB = 'https://boing.network/faucet';
const TESTNET_JOIN = 'https://boing.network/testnet/join';
const BOING_WALLET = 'https://boing.express';
const BOING_OBSERVER = 'https://boing.observer';

/**
 * Compact Boing Network testnet strip: RPC tip height, ecosystem links, optional RPC faucet for Boing accounts.
 */
export default function BoingTestnetStatusStrip() {
  const { account, isConnected, walletType } = useWallet();
  const [dismissed, setDismissed] = useState(() =>
    typeof localStorage !== 'undefined' && localStorage.getItem('boing_finance_hide_testnet_strip') === '1'
  );
  const [faucetBusy, setFaucetBusy] = useState(false);

  const boingAccountHex = useMemo(
    () => (account ? normalizeBoingFaucetAccountHex(account) : null),
    [account]
  );

  const { data: chainHeight, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['boing-testnet-chain-height'],
    queryFn: () => fetchBoingTestnetChainHeight(),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1
  });

  const dismiss = () => {
    try {
      localStorage.setItem('boing_finance_hide_testnet_strip', '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const onRpcFaucet = async () => {
    if (!boingAccountHex) {
      toast.error(
        'Use a Boing account (64 hex chars). Open the web faucet, or connect with Boing Express.'
      );
      return;
    }
    setFaucetBusy(true);
    try {
      await requestBoingTestnetFaucet(boingAccountHex);
      toast.success('Faucet request accepted — BOING should arrive shortly (rate limits may apply).');
    } catch (e) {
      toast.error(e?.message || 'Faucet failed. Try the website faucet or wait and retry.');
    } finally {
      setFaucetBusy(false);
    }
  };

  if (dismissed) return null;

  const statusLabel = isLoading
    ? 'Checking RPC…'
    : isError
      ? 'Testnet RPC unreachable'
      : `Tip height ${chainHeight}`;

  return (
    <div
      className="relative z-20 w-full border-b flex flex-wrap items-center gap-x-4 gap-y-2 px-3 sm:px-4 py-2 text-xs sm:text-sm"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-secondary)'
      }}
      role="region"
      aria-label="Boing Network testnet"
    >
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        <span className="font-semibold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
          Boing testnet
        </span>
        <span
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 border"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-tertiary)'
          }}
        >
          {isFetching && !isLoading ? (
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" aria-hidden />
          ) : (
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: isError ? '#f87171' : '#34d399' }}
              aria-hidden
            />
          )}
          <span>{statusLabel}</span>
          {!isLoading && (
            <button
              type="button"
              onClick={() => refetch()}
              className="ml-1 underline-offset-2 hover:underline text-cyan-400"
            >
              Refresh
            </button>
          )}
        </span>
        {walletType === 'boingExpress' && (
          <span className="text-cyan-400/90 font-medium">Boing Express connected</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 ml-auto">
        <a
          href={FAUCET_WEB}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium px-2.5 py-1 rounded-md border transition-colors"
          style={{
            borderColor: 'var(--accent-teal)',
            color: 'var(--accent-teal)',
            backgroundColor: 'transparent'
          }}
        >
          Get testnet BOING →
        </a>
        <button
          type="button"
          disabled={faucetBusy || !isConnected}
          onClick={onRpcFaucet}
          title={
            !isConnected
              ? 'Connect a wallet first'
              : !boingAccountHex
                ? 'Requires a 32-byte Boing account id (Boing Express)'
                : 'Call boing_faucetRequest on public testnet RPC'
          }
          className="font-medium px-2.5 py-1 rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            borderColor: 'var(--border-hover)',
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-tertiary)'
          }}
        >
          {faucetBusy ? 'Requesting…' : 'Faucet (RPC)'}
        </button>
        <a
          href={TESTNET_JOIN}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline text-cyan-400/90"
        >
          Join testnet
        </a>
        <a href={BOING_OBSERVER} target="_blank" rel="noopener noreferrer" className="hover:underline">
          Explorer
        </a>
        <a href={BOING_WALLET} target="_blank" rel="noopener noreferrer" className="hover:underline">
          Boing Express
        </a>
        <button
          type="button"
          onClick={dismiss}
          className="text-theme-tertiary hover:text-theme-primary px-1"
          aria-label="Dismiss testnet strip"
        >
          ×
        </button>
      </div>
    </div>
  );
}

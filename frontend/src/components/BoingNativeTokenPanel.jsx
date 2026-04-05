import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import { getNetworkByChainId, BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import {
  fetchBoingTestnetChainHeight,
  requestBoingTestnetFaucet,
  normalizeBoingFaucetAccountHex
} from '../services/boingTestnetRpc';
import { getBoingNativeFeeUsd, BOING_USD_REFERENCE_PRICE } from '../config/boingEconomics';

const WEB_FAUCET = 'https://boing.network/faucet';
const TESTNET_JOIN = 'https://boing.network/testnet/join';
const EXPLORER = 'https://boing.observer';

function formatBalanceDisplay(raw, symbol) {
  if (raw == null || raw === '') return '—';
  const n = Number(raw);
  if (Number.isNaN(n)) return raw;
  if (Number.isInteger(n) || Math.abs(n - Math.round(n)) < 1e-9) {
    return `${Math.round(n).toLocaleString()} ${symbol}`;
  }
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${symbol}`;
}

/**
 * Shown on every app page: live Boing testnet height, native BOING balance when on chain 6913,
 * and mint paths (RPC faucet + web faucet). Helps users work with BOING as the native token.
 */
export default function BoingNativeTokenPanel() {
  const queryClient = useQueryClient();
  const { chainId, account, isConnected, walletType, switchNetwork, getAccountBalance } = useWallet();
  const [faucetBusy, setFaucetBusy] = useState(false);
  const [switchBusy, setSwitchBusy] = useState(false);

  const boingMeta = getNetworkByChainId(BOING_NATIVE_L1_CHAIN_ID);
  const nativeSymbol = boingMeta?.nativeCurrency?.symbol || 'BOING';
  const onBoing = chainId === BOING_NATIVE_L1_CHAIN_ID;

  const boingAccountHex = useMemo(
    () => (account ? normalizeBoingFaucetAccountHex(account) : null),
    [account]
  );

  const heightQuery = useQuery({
    queryKey: ['boing-testnet-chain-height'],
    queryFn: () => fetchBoingTestnetChainHeight(),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1
  });

  const balanceQuery = useQuery({
    queryKey: ['boing-native-balance', account, chainId],
    queryFn: () => getAccountBalance(),
    enabled: Boolean(isConnected && onBoing && account),
    staleTime: 15_000,
    refetchInterval: 45_000
  });

  const heightLabel = heightQuery.isLoading
    ? 'Loading height…'
    : heightQuery.isError
      ? 'RPC unavailable'
      : `Height ${heightQuery.data}`;

  const balanceUsdLabel = useMemo(() => {
    if (!onBoing || balanceQuery.data == null || balanceQuery.isLoading) return null;
    const n = parseFloat(String(balanceQuery.data).replace(/,/g, ''));
    if (Number.isNaN(n)) return null;
    const usd = getBoingNativeFeeUsd(n);
    if (usd == null) return null;
    return usd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }, [onBoing, balanceQuery.data, balanceQuery.isLoading]);

  const onRpcFaucet = async () => {
    if (!boingAccountHex) {
      toast.error(
        'Boing faucet expects a 32-byte account id. Use Boing Express or the web faucet.'
      );
      return;
    }
    setFaucetBusy(true);
    try {
      await requestBoingTestnetFaucet(boingAccountHex);
      toast.success('Mint request sent — test BOING may take a moment (rate limits apply).');
      queryClient.invalidateQueries({ queryKey: ['boing-native-balance'] });
    } catch (e) {
      toast.error(e?.message || 'RPC faucet failed. Try the web faucet.');
    } finally {
      setFaucetBusy(false);
    }
  };

  const onSwitchBoing = async () => {
    setSwitchBusy(true);
    try {
      const ok = await switchNetwork(BOING_NATIVE_L1_CHAIN_ID);
      if (ok) {
        queryClient.invalidateQueries({ queryKey: ['boing-native-balance'] });
      }
    } catch (e) {
      toast.error(e?.message || 'Could not switch to Boing testnet');
    } finally {
      setSwitchBusy(false);
    }
  };

  return (
    <section
      className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 pb-0"
      aria-label="Boing native token and testnet"
    >
      <div
        className="rounded-xl border px-3 py-3 sm:px-4 sm:py-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 shadow-sm"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-x-4 sm:gap-y-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="text-sm font-semibold whitespace-nowrap"
              style={{ color: 'var(--text-primary)' }}
            >
              Boing testnet
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-md border font-medium"
              style={{
                borderColor: 'var(--accent-teal)',
                color: 'var(--accent-teal)',
                backgroundColor: 'color-mix(in srgb, var(--accent-teal) 12%, transparent)'
              }}
            >
              Native {nativeSymbol}
            </span>
            {walletType === 'boingExpress' && (
              <span className="text-xs text-cyan-400/90 font-medium truncate">Boing Express</span>
            )}
          </div>

          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: heightQuery.isError ? 'var(--error-color)' : 'var(--success-color)'
                }}
                aria-hidden
              />
              <span>{heightLabel}</span>
              {!heightQuery.isLoading && (
                <button
                  type="button"
                  onClick={() => heightQuery.refetch()}
                  className="underline-offset-2 hover:underline text-cyan-400/90 font-medium"
                >
                  Refresh
                </button>
              )}
            </span>

            <span className="hidden sm:inline opacity-40" aria-hidden>
              |
            </span>

            <span>
              <span className="opacity-80">Balance: </span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {!isConnected
                  ? 'Connect wallet'
                  : !onBoing
                    ? `Switch to ${boingMeta?.name || 'Boing'} to view`
                    : balanceQuery.isLoading
                      ? '…'
                      : formatBalanceDisplay(balanceQuery.data, nativeSymbol)}
              </span>
              {onBoing && isConnected && !balanceQuery.isLoading && (
                <button
                  type="button"
                  onClick={() => balanceQuery.refetch()}
                  className="ml-2 underline-offset-2 hover:underline text-cyan-400/90 text-xs font-medium"
                >
                  Refresh
                </button>
              )}
              {balanceUsdLabel && (
                <span className="block sm:inline sm:ml-2 text-xs opacity-80">
                  {`≈ $${balanceUsdLabel} USD (reference @ $${BOING_USD_REFERENCE_PRICE}/BOING)`}
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!onBoing && (
            <button
              type="button"
              disabled={switchBusy || !isConnected}
              onClick={onSwitchBoing}
              title={!isConnected ? 'Connect a wallet to switch networks' : undefined}
              className="text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg border transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                borderColor: 'var(--accent-teal)',
                color: 'var(--boing-black, var(--text-primary))',
                background:
                  'linear-gradient(135deg, color-mix(in srgb, var(--accent-teal) 55%, var(--bg-primary)), color-mix(in srgb, var(--accent-cyan) 48%, var(--bg-primary)))'
              }}
            >
              {switchBusy ? 'Switching…' : `Use ${boingMeta?.name || 'Boing testnet'}`}
            </button>
          )}

          <a
            href={WEB_FAUCET}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs sm:text-sm font-medium px-3 py-2 rounded-lg border transition-colors"
            style={{
              borderColor: 'var(--border-hover)',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-tertiary)'
            }}
          >
            Mint (web)
          </a>

          <button
            type="button"
            disabled={faucetBusy || !isConnected}
            onClick={onRpcFaucet}
            title={
              !isConnected
                ? 'Connect wallet'
                : !boingAccountHex
                  ? 'Needs 32-byte Boing account (Boing Express)'
                  : 'boing_faucetRequest via RPC'
            }
            className="text-xs sm:text-sm font-medium px-3 py-2 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              borderColor: 'var(--accent-teal)',
              color: 'var(--accent-teal)',
              backgroundColor: 'transparent'
            }}
          >
            {faucetBusy ? 'Minting…' : 'Mint (RPC)'}
          </button>

          <a
            href={EXPLORER}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs sm:text-sm font-medium px-2 py-2 rounded-lg hover:underline"
            style={{ color: 'var(--text-secondary)' }}
          >
            Explorer
          </a>

          <a
            href={TESTNET_JOIN}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs sm:text-sm font-medium px-2 py-2 rounded-lg hover:underline hidden sm:inline"
            style={{ color: 'var(--text-secondary)' }}
          >
            Join testnet
          </a>
        </div>
      </div>
    </section>
  );
}

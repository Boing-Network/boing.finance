import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config.js';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { transactionTrackingService } from '../services/transactionTrackingService.js';
import toast from 'react-hot-toast';
import EmptyState from './EmptyState';
import TransactionHistoryList from './TransactionHistoryList';

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'swap', label: 'Swaps' },
  { key: 'liquidity', label: 'Liquidity' },
  { key: 'bridge', label: 'Bridge' },
];

export default function TransactionHistoryModal({ isOpen, onClose }) {
  const { account } = useWalletConnection();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef(null);
  const prevCountRef = useRef(0);
  const closeButtonRef = useRef(null);

  const loadTransactions = useCallback(async ({ silent = false } = {}) => {
    if (!account) {
      setTransactions([]);
      setLoading(false);
      setError(null);
      prevCountRef.current = 0;
      return;
    }

    if (!silent) setLoading(true);
    setError(null);
    try {
      const apiUrl = getApiUrl();
      const response = await axios.get(`${apiUrl}/transactions/${account}?filter=${filter}`);
      if (response.data.success) {
        const newTransactions = response.data.data || [];
        if (prevCountRef.current > 0 && newTransactions.length > prevCountRef.current) {
          const newCount = newTransactions.length - prevCountRef.current;
          console.log(`Found ${newCount} new transactions`);
        }
        prevCountRef.current = newTransactions.length;
        setTransactions(newTransactions);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setTransactions([]);
        prevCountRef.current = 0;
        setError(null);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);

      if (err.code === 'NETWORK_ERROR' || err.response?.status >= 500) {
        setTransactions([]);
        setError(null);
        setLastUpdated(new Date());
      } else if (err.response?.status === 404) {
        setTransactions([]);
        prevCountRef.current = 0;
        setError(null);
        setLastUpdated(new Date());
      } else {
        setError('Unable to load transaction history. Features are still being deployed.');
        setTransactions([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [account, filter]);

  useEffect(() => {
    if (isOpen && account) {
      const unsubscribe = transactionTrackingService.subscribe((newTransactions) => {
        setTransactions((prev) => {
          const existingIds = new Set(prev.map((tx) => tx.txHash));
          const uniqueNewTransactions = newTransactions.filter((tx) => !existingIds.has(tx.txHash));

          if (uniqueNewTransactions.length > 0) {
            toast.success(
              `${uniqueNewTransactions.length} new transaction${uniqueNewTransactions.length > 1 ? 's' : ''} added to history!`
            );
          }

          const next = [...uniqueNewTransactions, ...prev];
          prevCountRef.current = next.length;
          return next;
        });
        setLastUpdated(new Date());
      });

      return unsubscribe;
    }
  }, [isOpen, account]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && account) {
      loadTransactions();
      setIsPolling(true);
      pollingIntervalRef.current = setInterval(() => {
        loadTransactions({ silent: true });
      }, 30000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsPolling(false);
      };
    }

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  }, [isOpen, account, loadTransactions]);

  const handleFilterKeyDown = (e) => {
    const keys = FILTER_TABS.map((t) => t.key);
    const i = keys.indexOf(filter);
    if (e.key === 'ArrowRight' && i < keys.length - 1) {
      e.preventDefault();
      setFilter(keys[i + 1]);
    } else if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault();
      setFilter(keys[i - 1]);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-history-title"
    >
      <div
        className="bg-theme-card rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-4xl max-h-[85vh] relative border border-theme overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          className="absolute top-4 right-4 text-theme-tertiary hover:text-theme-primary"
          onClick={onClose}
          aria-label="Close transaction history"
        >
          &times;
        </button>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4 pr-8">
          <h2 id="transaction-history-title" className="text-lg sm:text-xl font-bold text-theme-primary">
            Transaction History
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {lastUpdated && (
              <div className="text-theme-tertiary text-xs whitespace-nowrap">
                Last updated: {new Date(lastUpdated).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            {isPolling && (
              <div className="flex items-center space-x-2 text-green-400 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" aria-hidden />
                <span>Live updates</span>
              </div>
            )}
          </div>
        </div>

        <div
          className="flex flex-wrap gap-1 mb-6 bg-theme-secondary rounded-lg p-1"
          role="tablist"
          aria-label="Transaction filters"
          onKeyDown={handleFilterKeyDown}
        >
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={filter === tab.key}
              tabIndex={filter === tab.key ? 0 : -1}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 min-w-[4.5rem] py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-theme-secondary hover:text-theme-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 max-h-[min(24rem,50vh)]">
          {loading ? (
            <div className="space-y-4" aria-busy="true" aria-label="Loading transactions">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-theme-secondary rounded-lg h-20" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4" aria-hidden>
                ⚠️
              </div>
              <h4 className="text-lg font-semibold text-theme-primary mb-2">Unable to Load Transaction History</h4>
              <p className="text-theme-secondary mb-4">{error}</p>
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 max-w-md mx-auto mb-4">
                <p className="text-yellow-200 text-sm">
                  <strong>Tip:</strong> Transaction history will be available once trading features are deployed to mainnet.
                </p>
              </div>
              <button
                type="button"
                onClick={() => loadTransactions()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                Try Again
              </button>
            </div>
          ) : transactions.length > 0 ? (
            <TransactionHistoryList transactions={transactions} showStatus />
          ) : (
            <EmptyState
              variant="transactions"
              title="No transactions yet"
              description="Transaction history will appear here once you start using the platform features. Most trading features are in development — token deployment is available now."
              actionLabel="Deploy token"
              actionHref="/deploy-token"
            />
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => loadTransactions()}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition duration-200 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  );
}

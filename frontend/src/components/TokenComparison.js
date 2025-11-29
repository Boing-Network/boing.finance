// Token Comparison Component
// Allows users to compare 2-3 tokens side-by-side

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
// import coingeckoService from '../services/coingeckoService'; // Will be used for price data
import { etherscanService } from '../services/etherscanService';
import { getNetworkByChainId } from '../config/networks';
import OptimizedImage from './OptimizedImage';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

const TokenComparison = ({ tokens = [], onClose }) => {
  const [selectedTokens, setSelectedTokens] = useState(tokens.slice(0, 3));
  const [comparisonData, setComparisonData] = useState([]);

  // Fetch detailed data for each selected token
  const { data: tokenDetails, isLoading } = useQuery({
    queryKey: ['token-comparison', selectedTokens.map(t => `${t.address}-${t.chainId}`).join(',')],
    queryFn: async () => {
      const details = await Promise.all(
        selectedTokens.map(async (token) => {
          try {
            // Fetch price data from CoinGecko if available
            let priceData = null;
            let marketData = null;
            
            // Try to find token on CoinGecko (this would need token mapping)
            // For now, we'll use basic data
            
            // Fetch from Etherscan
            const tokenInfo = await etherscanService.getTokenInfo(token.address, token.chainId);
            const transactions = await etherscanService.getAccountTransactions(token.address, token.chainId, 1, 10);
            
            return {
              ...token,
              tokenInfo,
              transactionCount: transactions.length,
              network: getNetworkByChainId(token.chainId),
              // Add more comparison fields
            };
          } catch (error) {
            console.error(`Error fetching data for token ${token.address}:`, error);
            return {
              ...token,
              network: getNetworkByChainId(token.chainId),
              error: error.message
            };
          }
        })
      );
      return details;
    },
    enabled: selectedTokens.length > 0,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  useEffect(() => {
    if (tokenDetails) {
      setComparisonData(tokenDetails);
    }
  }, [tokenDetails]);

  const addToken = (token) => {
    if (selectedTokens.length >= 3) {
      toast.error('Maximum 3 tokens can be compared at once');
      return;
    }
    if (selectedTokens.some(t => t.address === token.address && t.chainId === token.chainId)) {
      toast.error('Token already added to comparison');
      return;
    }
    setSelectedTokens([...selectedTokens, token]);
  };

  const removeToken = (index) => {
    setSelectedTokens(selectedTokens.filter((_, i) => i !== index));
  };

  const comparisonFields = [
    { label: 'Name', key: 'name' },
    { label: 'Symbol', key: 'symbol' },
    { label: 'Network', key: 'network', getValue: (token) => token.network?.name || 'Unknown' },
    { label: 'Address', key: 'address', getValue: (token) => `${token.address.substring(0, 6)}...${token.address.substring(token.address.length - 4)}` },
    { label: 'Decimals', key: 'decimals' },
    { label: 'Total Supply', key: 'totalSupply', format: (val) => val ? val.toLocaleString() : 'N/A' },
    { label: 'Transactions', key: 'transactionCount', format: (val) => val ? val.toLocaleString() : '0' },
    { label: 'Deployment Date', key: 'deploymentDate', format: (val) => val ? new Date(val).toLocaleDateString() : 'N/A' },
  ];

  if (isLoading && comparisonData.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-6" style={{
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--border-color)'
    }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Token Comparison
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close comparison"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Token Selection */}
      {selectedTokens.length < 3 && (
        <div className="mb-6 p-4 rounded-lg border" style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)'
        }}>
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            Add up to {3 - selectedTokens.length} more token{3 - selectedTokens.length > 1 ? 's' : ''} to compare
          </p>
          {/* Token search/select would go here */}
        </div>
      )}

      {/* Comparison Table */}
      {comparisonData.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th className="text-left p-3" style={{ color: 'var(--text-secondary)' }}>Feature</th>
                {comparisonData.map((token, index) => (
                  <th key={index} className="text-left p-3" style={{ color: 'var(--text-primary)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {token.logoUrl && (
                          <OptimizedImage
                            src={token.logoUrl}
                            alt={token.name}
                            className="w-8 h-8 rounded-full"
                            fallback={<div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs">
                              {token.symbol?.charAt(0) || '?'}
                            </div>}
                          />
                        )}
                        <div>
                          <div className="font-semibold">{token.name}</div>
                          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {token.symbol}
                          </div>
                        </div>
                      </div>
                      {onClose && (
                        <button
                          onClick={() => removeToken(index)}
                          className="text-gray-400 hover:text-red-400 transition-colors ml-2"
                          aria-label={`Remove ${token.name}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonFields.map((field, fieldIndex) => (
                <tr
                  key={fieldIndex}
                  className={fieldIndex % 2 === 0 ? '' : ''}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: fieldIndex % 2 === 0 ? 'transparent' : 'var(--bg-secondary)'
                  }}
                >
                  <td className="p-3 font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {field.label}
                  </td>
                  {comparisonData.map((token, tokenIndex) => {
                    let value = field.getValue 
                      ? field.getValue(token)
                      : token[field.key];
                    
                    if (field.format) {
                      value = field.format(value);
                    }

                    return (
                      <td key={tokenIndex} className="p-3" style={{ color: 'var(--text-primary)' }}>
                        {value || 'N/A'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Feature Matrix */}
      {comparisonData.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Security Features Comparison
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparisonData.map((token, index) => (
              <div
                key={index}
                className="rounded-lg p-4 border"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <h4 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  {token.name}
                </h4>
                <div className="space-y-2">
                  {token.securityFeatures?.map((feature, fIndex) => (
                    <div key={fIndex} className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${feature.enabled ? 'bg-green-500' : 'bg-gray-500'}`} />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {feature.name}
                      </span>
                    </div>
                  )) || (
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      No security features data available
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end space-x-4">
        <button
          onClick={() => {
            // Export comparison data
            const data = comparisonData.map(token => ({
              name: token.name,
              symbol: token.symbol,
              address: token.address,
              network: token.network?.name,
              // ... other fields
            }));
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'token-comparison.json';
            a.click();
            toast.success('Comparison data exported!');
          }}
          className="px-4 py-2 rounded-lg transition-colors"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)'
          }}
        >
          Export Comparison
        </button>
      </div>
    </div>
  );
};

export default TokenComparison;


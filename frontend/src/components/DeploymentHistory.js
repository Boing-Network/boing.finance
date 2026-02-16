// Deployment History Component
// Shows user's token deployment history

import React, { useState, useEffect } from 'react';
import { deploymentHistory } from '../utils/deploymentHistory';
import { getNetworkByChainId } from '../config/networks';

const DeploymentHistory = ({ onSelectDeployment, onClose }) => {
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('all'); // all, network, status
  const [selectedNetwork, setSelectedNetwork] = useState(null);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadHistory is stable and depends on filter/selectedNetwork
  }, [filter, selectedNetwork]);

  const loadHistory = () => {
    let filtered = deploymentHistory.getAll();
    
    if (filter === 'network' && selectedNetwork) {
      filtered = filtered.filter(d => d.network === selectedNetwork);
    } else if (filter === 'status') {
      filtered = filtered.filter(d => d.status === 'completed');
    }

    setHistory(filtered);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getNetworkName = (chainId) => {
    const network = getNetworkByChainId(chainId);
    return network?.name || `Chain ${chainId}`;
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
      deploying: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs border ${styles[status] || styles.pending}`}>
        {status || 'pending'}
      </span>
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Deployment History
        </h3>
        <button
          onClick={onClose}
          className="text-sm px-3 py-1 rounded transition-colors"
          style={{ 
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-tertiary)'
          }}
          onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
        >
          Close
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-sm px-3 py-1 rounded border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border-color)'
          }}
        >
          <option value="all">All Deployments</option>
          <option value="completed">Completed Only</option>
          <option value="network">By Network</option>
        </select>
        
        {filter === 'network' && (
          <select
            value={selectedNetwork || ''}
            onChange={(e) => setSelectedNetwork(e.target.value)}
            className="text-sm px-3 py-1 rounded border"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-color)'
            }}
          >
            <option value="">Select Network</option>
            <option value="1">Ethereum</option>
            <option value="137">Polygon</option>
            <option value="56">BSC</option>
            <option value="11155111">Sepolia</option>
          </select>
        )}
      </div>

      {/* History List */}
      {history.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No deployment history found
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {history.map((deployment) => (
            <div
              key={deployment.id}
              className="p-4 rounded-lg border cursor-pointer transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)'
              }}
              onClick={() => onSelectDeployment && onSelectDeployment(deployment)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {deployment.name || 'Unnamed Token'}
                  </h4>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {deployment.symbol || 'N/A'}
                  </p>
                </div>
                {getStatusBadge(deployment.status)}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div>
                  <span style={{ color: 'var(--text-tertiary)' }}>Network: </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {getNetworkName(deployment.network?.chainId || deployment.chainId)}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary)' }}>Date: </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(deployment.timestamp || deployment.date)}
                  </span>
                </div>
                {deployment.contractAddress && (
                  <div className="col-span-2">
                    <span style={{ color: 'var(--text-tertiary)' }}>Contract: </span>
                    <span 
                      className="font-mono cursor-pointer hover:underline"
                      style={{ color: 'var(--text-secondary)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(deployment.contractAddress);
                      }}
                    >
                      {formatAddress(deployment.contractAddress)}
                    </span>
                  </div>
                )}
                {deployment.txHash && (
                  <div className="col-span-2">
                    <span style={{ color: 'var(--text-tertiary)' }}>TX: </span>
                    <span 
                      className="font-mono cursor-pointer hover:underline"
                      style={{ color: 'var(--text-secondary)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(deployment.txHash);
                      }}
                    >
                      {formatAddress(deployment.txHash)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {history.length > 0 && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Total: {history.length} deployment{history.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeploymentHistory;


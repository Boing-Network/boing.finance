// Advanced Security Scanner Component
// Automated security audit and vulnerability detection for tokens

import React, { useState } from 'react';
import { ethers } from 'ethers';
import { getNetworkByChainId } from '../config/networks';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

const SECURITY_CHECKS = [
  {
    id: 'ownership-renounced',
    name: 'Ownership Renounced',
    description: 'Check if contract ownership has been renounced',
    severity: 'high',
    category: 'ownership'
  },
  {
    id: 'mint-disabled',
    name: 'Mint Function Disabled',
    description: 'Verify that minting cannot create new tokens',
    severity: 'high',
    category: 'supply'
  },
  {
    id: 'pause-function',
    name: 'Pause Function Status',
    description: 'Check if contract can be paused (potential risk)',
    severity: 'medium',
    category: 'functionality'
  },
  {
    id: 'blacklist-check',
    name: 'Blacklist Function',
    description: 'Verify blacklist implementation and current status',
    severity: 'medium',
    category: 'access-control'
  },
  {
    id: 'max-transaction',
    name: 'Max Transaction Limits',
    description: 'Check for transaction amount limits',
    severity: 'low',
    category: 'limits'
  },
  {
    id: 'max-wallet',
    name: 'Max Wallet Limits',
    description: 'Check for maximum wallet holding limits',
    severity: 'low',
    category: 'limits'
  },
  {
    id: 'cooldown-period',
    name: 'Cooldown Period',
    description: 'Verify cooldown between transactions',
    severity: 'low',
    category: 'limits'
  },
  {
    id: 'timelock',
    name: 'Timelock Implementation',
    description: 'Check for timelock on critical functions',
    severity: 'medium',
    category: 'governance'
  },
  {
    id: 'verified-contract',
    name: 'Contract Verification',
    description: 'Verify contract source code is verified on explorer',
    severity: 'high',
    category: 'transparency'
  },
  {
    id: 'proxy-pattern',
    name: 'Proxy Pattern Detection',
    description: 'Check if contract uses proxy pattern (upgradeable)',
    severity: 'medium',
    category: 'architecture'
  }
];

const SecurityScanner = ({ tokenAddress, chainId, onScanComplete }) => {
  const [scanResults, setScanResults] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [securityScore, setSecurityScore] = useState(0);
  const [recommendations, setRecommendations] = useState([]);

  const network = getNetworkByChainId(chainId);

  // Perform security scan
  const performScan = async () => {
    if (!tokenAddress || !chainId) {
      toast.error('Token address and chain ID are required');
      return;
    }

    setIsScanning(true);
    setScanResults([]);
    setRecommendations([]);

    try {
      const provider = new ethers.JsonRpcProvider(network?.rpcUrl);
      const results = [];
      const recs = [];

      // Standard ERC20 ABI (minimal for basic checks)
      const erc20Abi = [
        'function owner() view returns (address)',
        'function renounceOwnership()',
        'function mint(address to, uint256 amount)',
        'function paused() view returns (bool)',
        'function isBlacklisted(address account) view returns (bool)',
        'function maxTransactionAmount() view returns (uint256)',
        'function maxWalletAmount() view returns (uint256)',
        'function cooldownPeriod() view returns (uint256)',
        'function timelockDelay() view returns (uint256)'
      ];

      const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);

      // Check each security feature
      for (const check of SECURITY_CHECKS) {
        let result = {
          ...check,
          status: 'unknown',
          details: '',
          passed: false
        };

        try {
          switch (check.id) {
            case 'ownership-renounced':
              try {
                const owner = await contract.owner();
                result.status = owner === ethers.ZeroAddress ? 'passed' : 'warning';
                result.passed = owner === ethers.ZeroAddress;
                result.details = owner === ethers.ZeroAddress 
                  ? 'Ownership has been renounced' 
                  : `Owner: ${owner.substring(0, 6)}...${owner.substring(owner.length - 4)}`;
                if (!result.passed) {
                  recs.push('Consider renouncing ownership to increase trust');
                }
              } catch (error) {
                result.status = 'unknown';
                result.details = 'Could not check ownership (function may not exist)';
              }
              break;

            case 'mint-disabled':
              try {
                // Try to call mint function (will fail if disabled)
                await contract.mint.staticCall(ethers.ZeroAddress, 0);
                result.status = 'warning';
                result.passed = false;
                result.details = 'Mint function is still active';
                recs.push('Disable mint function to prevent unlimited token creation');
              } catch (error) {
                result.status = 'passed';
                result.passed = true;
                result.details = 'Mint function appears to be disabled';
              }
              break;

            case 'pause-function':
              try {
                const paused = await contract.paused();
                result.status = paused ? 'warning' : 'info';
                result.passed = !paused;
                result.details = paused ? 'Contract is currently paused' : 'Contract is not paused';
                if (paused) {
                  recs.push('Contract pause function is active - verify this is intentional');
                }
              } catch (error) {
                result.status = 'unknown';
                result.details = 'Pause function not available';
              }
              break;

            case 'blacklist-check':
              try {
                const isBlacklisted = await contract.isBlacklisted(ethers.ZeroAddress);
                result.status = 'info';
                result.passed = true;
                result.details = 'Blacklist function is available';
              } catch (error) {
                result.status = 'unknown';
                result.details = 'Blacklist function not available';
              }
              break;

            case 'max-transaction':
              try {
                const maxTx = await contract.maxTransactionAmount();
                result.status = maxTx > 0 ? 'passed' : 'info';
                result.passed = maxTx > 0;
                result.details = maxTx > 0 
                  ? `Max transaction: ${ethers.formatUnits(maxTx, 18)} tokens` 
                  : 'No max transaction limit set';
                if (!result.passed) {
                  recs.push('Consider implementing max transaction limits for security');
                }
              } catch (error) {
                result.status = 'unknown';
                result.details = 'Max transaction function not available';
              }
              break;

            case 'max-wallet':
              try {
                const maxWallet = await contract.maxWalletAmount();
                result.status = maxWallet > 0 ? 'passed' : 'info';
                result.passed = maxWallet > 0;
                result.details = maxWallet > 0 
                  ? `Max wallet: ${ethers.formatUnits(maxWallet, 18)} tokens` 
                  : 'No max wallet limit set';
              } catch (error) {
                result.status = 'unknown';
                result.details = 'Max wallet function not available';
              }
              break;

            case 'cooldown-period':
              try {
                const cooldown = await contract.cooldownPeriod();
                result.status = cooldown > 0 ? 'passed' : 'info';
                result.passed = cooldown > 0;
                result.details = cooldown > 0 
                  ? `Cooldown period: ${cooldown} seconds` 
                  : 'No cooldown period set';
              } catch (error) {
                result.status = 'unknown';
                result.details = 'Cooldown function not available';
              }
              break;

            case 'timelock':
              try {
                const delay = await contract.timelockDelay();
                result.status = delay > 0 ? 'passed' : 'info';
                result.passed = delay > 0;
                result.details = delay > 0 
                  ? `Timelock delay: ${delay} hours` 
                  : 'No timelock implemented';
              } catch (error) {
                result.status = 'unknown';
                result.details = 'Timelock function not available';
              }
              break;

            case 'verified-contract':
              // This would require explorer API integration
              result.status = 'info';
              result.details = 'Check contract verification on block explorer';
              recs.push('Verify contract source code on block explorer for transparency');
              break;

            case 'proxy-pattern':
              // Check for proxy pattern (would need more complex analysis)
              result.status = 'info';
              result.details = 'Proxy pattern detection requires deeper analysis';
              break;

            default:
              result.status = 'unknown';
              result.details = 'Check not implemented';
          }
        } catch (error) {
          result.status = 'error';
          result.details = `Error: ${error.message}`;
        }

        results.push(result);
      }

      // Calculate security score
      const passedChecks = results.filter(r => r.passed).length;
      const totalChecks = results.filter(r => r.status !== 'unknown').length;
      const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

      setScanResults(results);
      setSecurityScore(score);
      setRecommendations(recs);

      if (onScanComplete) {
        onScanComplete({ results, score, recommendations: recs });
      }

      toast.success(`Security scan complete! Score: ${score}%`);
    } catch (error) {
      console.error('Security scan error:', error);
      toast.error(`Security scan failed: ${error.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'error':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'info':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="rounded-lg border p-6" style={{
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--border-color)'
    }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Security Scanner
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Automated security audit for token contracts
          </p>
        </div>
        <button
          onClick={performScan}
          disabled={isScanning || !tokenAddress || !chainId}
          className="px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: isScanning ? 'var(--bg-secondary)' : 'var(--color-primary)',
            color: 'var(--text-primary)'
          }}
        >
          {isScanning ? (
            <span className="flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <span>Scanning...</span>
            </span>
          ) : (
            'Start Scan'
          )}
        </button>
      </div>

      {/* Security Score */}
      {securityScore > 0 && (
        <div className="mb-6 p-4 rounded-lg border" style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Security Score
            </span>
            <span className={`text-2xl font-bold ${
              securityScore >= 80 ? 'text-green-400' :
              securityScore >= 60 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {securityScore}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-700">
            <div
              className={`h-2 rounded-full transition-all ${
                securityScore >= 80 ? 'bg-green-500' :
                securityScore >= 60 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${securityScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Scan Results */}
      {scanResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Scan Results
          </h3>
          {scanResults.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold">{result.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded ${getSeverityColor(result.severity)}`}>
                      {result.severity}
                    </span>
                  </div>
                  <p className="text-sm opacity-80">{result.description}</p>
                </div>
                <div className="ml-4">
                  {result.status === 'passed' && (
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {result.status === 'warning' && (
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  {result.status === 'error' && (
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              <p className="text-xs mt-2 opacity-70">{result.details}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-6 p-4 rounded-lg border" style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)'
        }}>
          <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Recommendations
          </h3>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span className="text-blue-400 mt-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Token Info */}
      {tokenAddress && (
        <div className="mt-6 p-4 rounded-lg border" style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)'
        }}>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Token Address:</span>
              <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                {tokenAddress.substring(0, 6)}...{tokenAddress.substring(tokenAddress.length - 4)}
              </span>
            </div>
            {network && (
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Network:</span>
                <span style={{ color: 'var(--text-primary)' }}>{network.name}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityScanner;


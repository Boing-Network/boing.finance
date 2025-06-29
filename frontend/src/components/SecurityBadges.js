import React, { useState, useEffect } from 'react';
import { InfoTooltip, WarningTooltip } from './Tooltip';

export default function SecurityBadges({ 
  tokenAddress, 
  network, 
  className = '',
  showDetails = false 
}) {
  const [securityInfo, setSecurityInfo] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tokenAddress) {
      loadSecurityInfo();
    }
  }, [tokenAddress, network]);

  const loadSecurityInfo = async () => {
    setLoading(true);
    try {
      const mockSecurityInfo = {
        auditStatus: 'audited',
        auditScore: 95,
        auditDate: '2024-01-15',
        auditor: 'Certik',
        verified: true,
        honeypotRisk: 'low',
        ownershipRenounced: true,
        liquidityLocked: true,
        lockPercentage: 85,
        lockDuration: '2 years',
        verifiedSource: true,
        proxyContract: false,
        blacklisted: false,
        warnings: [],
        lastUpdated: Date.now()
      };
      
      setSecurityInfo(mockSecurityInfo);
    } catch (error) {
      console.error('Failed to load security info:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAuditStatusColor = (status) => {
    switch (status) {
      case 'audited': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getAuditStatusIcon = (status) => {
    switch (status) {
      case 'audited':
        return (
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'pending':
        return (
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'failed':
        return (
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getRiskLevelColor = (risk) => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getRiskLevelIcon = (risk) => {
    switch (risk) {
      case 'low':
        return (
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        );
      case 'medium':
        return (
          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
        );
      case 'high':
        return (
          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
        );
      default:
        return (
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        );
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Security Status</h3>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-700 rounded h-6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Security Status</h3>
        <div className="flex items-center space-x-2">
          <InfoTooltip content="Security information and audit status for this token" />
          <button
            onClick={loadSecurityInfo}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Refresh security info"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Security Badges */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Audit Status */}
        <div className={`flex items-center space-x-2 p-3 rounded-lg ${
          securityInfo.auditStatus === 'audited' ? 'bg-green-900/20 border border-green-500/20' :
          securityInfo.auditStatus === 'pending' ? 'bg-yellow-900/20 border border-yellow-500/20' :
          'bg-red-900/20 border border-red-500/20'
        }`}>
          {getAuditStatusIcon(securityInfo.auditStatus)}
          <div>
            <p className={`text-sm font-medium capitalize ${getAuditStatusColor(securityInfo.auditStatus)}`}>
              {securityInfo.auditStatus}
            </p>
            <p className="text-xs text-gray-400">
              {securityInfo.auditScore}% Score
            </p>
          </div>
        </div>

        {/* Verification Status */}
        <div className={`flex items-center space-x-2 p-3 rounded-lg ${
          securityInfo.verified ? 'bg-green-900/20 border border-green-500/20' : 'bg-red-900/20 border border-red-500/20'
        }`}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className={`text-sm font-medium ${securityInfo.verified ? 'text-green-400' : 'text-red-400'}`}>
              {securityInfo.verified ? 'Verified' : 'Unverified'}
            </p>
            <p className="text-xs text-gray-400">Contract</p>
          </div>
        </div>

        {/* Honeypot Risk */}
        <div className={`flex items-center space-x-2 p-3 rounded-lg ${
          securityInfo.honeypotRisk === 'low' ? 'bg-green-900/20 border border-green-500/20' :
          securityInfo.honeypotRisk === 'medium' ? 'bg-yellow-900/20 border border-yellow-500/20' :
          'bg-red-900/20 border border-red-500/20'
        }`}>
          {getRiskLevelIcon(securityInfo.honeypotRisk)}
          <div>
            <p className={`text-sm font-medium capitalize ${getRiskLevelColor(securityInfo.honeypotRisk)}`}>
              {securityInfo.honeypotRisk} Risk
            </p>
            <p className="text-xs text-gray-400">Honeypot</p>
          </div>
        </div>

        {/* Liquidity Lock */}
        <div className={`flex items-center space-x-2 p-3 rounded-lg ${
          securityInfo.liquidityLocked ? 'bg-green-900/20 border border-green-500/20' : 'bg-red-900/20 border border-red-500/20'
        }`}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div>
            <p className={`text-sm font-medium ${securityInfo.liquidityLocked ? 'text-green-400' : 'text-red-400'}`}>
              {securityInfo.liquidityLocked ? 'Locked' : 'Unlocked'}
            </p>
            <p className="text-xs text-gray-400">Liquidity</p>
          </div>
        </div>
      </div>

      {/* Detailed Security Info */}
      {showDetails && (
        <div className="space-y-3 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Audit Details */}
            <div className="bg-gray-750 rounded-lg p-3">
              <h4 className="text-sm font-medium text-white mb-2">Audit Information</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Auditor:</span>
                  <span className="text-white">{securityInfo.auditor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span className="text-white">{securityInfo.auditDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Score:</span>
                  <span className="text-white">{securityInfo.auditScore}/100</span>
                </div>
              </div>
            </div>

            {/* Liquidity Details */}
            <div className="bg-gray-750 rounded-lg p-3">
              <h4 className="text-sm font-medium text-white mb-2">Liquidity Security</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Locked:</span>
                  <span className="text-white">{securityInfo.lockPercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white">{securityInfo.lockDuration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ownership:</span>
                  <span className={`${securityInfo.ownershipRenounced ? 'text-green-400' : 'text-red-400'}`}>
                    {securityInfo.ownershipRenounced ? 'Renounced' : 'Not Renounced'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {securityInfo.warnings && securityInfo.warnings.length > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <WarningTooltip content="Security warnings and potential risks" />
                <h4 className="text-sm font-medium text-yellow-400">Security Warnings</h4>
              </div>
              <ul className="text-xs text-yellow-300 space-y-1">
                {securityInfo.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Contract Info */}
          <div className="bg-gray-750 rounded-lg p-3">
            <h4 className="text-sm font-medium text-white mb-2">Contract Information</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Source Verified:</span>
                <span className={`${securityInfo.verifiedSource ? 'text-green-400' : 'text-red-400'}`}>
                  {securityInfo.verifiedSource ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Proxy Contract:</span>
                <span className={`${securityInfo.proxyContract ? 'text-yellow-400' : 'text-green-400'}`}>
                  {securityInfo.proxyContract ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Blacklisted:</span>
                <span className={`${securityInfo.blacklisted ? 'text-red-400' : 'text-green-400'}`}>
                  {securityInfo.blacklisted ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Last Updated:</span>
          <span className="text-white">
            {new Date(securityInfo.lastUpdated).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
} 
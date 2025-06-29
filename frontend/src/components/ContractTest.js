import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { getContractAddresses, isNetworkSupported } from '../config/contracts';
import { ethers } from 'ethers';

// Basic ABI for ERC20 functions
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

// Basic ABI for DEX Factory
const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) view returns (address pair)',
  'function allPairs(uint) view returns (address pair)',
  'function allPairsLength() view returns (uint)'
];

const ContractTest = () => {
  const { isConnected, chainId, provider } = useWallet();
  const [contractInfo, setContractInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testContracts = async () => {
    if (!isConnected || !chainId || !provider) return;
    setLoading(true);
    setError(null);
    try {
      const contracts = getContractAddresses(chainId);
      if (!contracts) {
        setError('No contracts configured for this network');
        return;
      }
      const info = {};

      // Test DEX Factory
      if (contracts.dexFactory && contracts.dexFactory !== '0x0000000000000000000000000000000000000000') {
        try {
          const factory = new ethers.Contract(contracts.dexFactory, FACTORY_ABI, provider);
          const pairCount = await factory.allPairsLength();
          info.factory = {
            address: contracts.dexFactory,
            pairCount: pairCount.toString(),
            status: '✅ Connected'
          };
        } catch (err) {
          info.factory = {
            address: contracts.dexFactory,
            status: '❌ Error: ' + err.message
          };
        }
      }

      // Test Mock Tokens
      if (contracts.tokens) {
        info.tokens = {};
        for (const [tokenName, tokenAddress] of Object.entries(contracts.tokens)) {
          if (tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000') {
            try {
              const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
              const [name, symbol, decimals, totalSupply] = await Promise.all([
                token.name(),
                token.symbol(),
                token.decimals(),
                token.totalSupply()
              ]);
              
              info.tokens[tokenName] = {
                address: tokenAddress,
                name,
                symbol,
                decimals: decimals.toString(),
                totalSupply: ethers.formatUnits(totalSupply, decimals),
                status: '✅ Connected'
              };
            } catch (err) {
              info.tokens[tokenName] = {
                address: tokenAddress,
                status: '❌ Error: ' + err.message
              };
            }
          }
        }
      }

      // Test WETH
      if (contracts.weth && contracts.weth !== '0x0000000000000000000000000000000000000000') {
        try {
          const weth = new ethers.Contract(contracts.weth, ERC20_ABI, provider);
          const [name, symbol, decimals, totalSupply] = await Promise.all([
            weth.name(),
            weth.symbol(),
            weth.decimals(),
            weth.totalSupply()
          ]);
          
          info.weth = {
            address: contracts.weth,
            name,
            symbol,
            decimals: decimals.toString(),
            totalSupply: ethers.formatUnits(totalSupply, decimals),
            status: '✅ Connected'
          };
        } catch (err) {
          info.weth = {
            address: contracts.weth,
            status: '❌ Error: ' + err.message
          };
        }
      }

      setContractInfo(info);
    } catch (err) {
      setError('Failed to test contracts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && chainId) {
      testContracts();
    }
  }, [isConnected, chainId]);

  if (!isConnected) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Contract Test</h3>
        <p className="text-gray-400">Please connect your wallet to test contracts</p>
      </div>
    );
  }

  const currentNetwork = chainId ? `Chain ID: ${chainId}` : 'Unknown Network';
  const isSupported = isNetworkSupported(chainId);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Contract Test</h3>
      
      <div className="mb-4">
        <p className="text-gray-300">Network: {currentNetwork}</p>
        <p className={`text-sm ${isSupported ? 'text-green-400' : 'text-red-400'}`}>
          {isSupported ? '✅ Contracts deployed on this network' : '❌ No contracts deployed on this network'}
        </p>
      </div>

      {loading && (
        <div className="flex items-center space-x-2 text-blue-400">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Testing contracts...</span>
        </div>
      )}

      {error && (
        <div className="text-red-400 mb-4">
          <p>Error: {error}</p>
        </div>
      )}

      {Object.keys(contractInfo).length > 0 && (
        <div className="space-y-4">
          {/* Factory Info */}
          {contractInfo.factory && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">DEX Factory</h4>
              <div className="text-sm text-gray-300 space-y-1">
                <p>Address: <span className="font-mono">{contractInfo.factory.address}</span></p>
                <p>Status: {contractInfo.factory.status}</p>
                {contractInfo.factory.pairCount && (
                  <p>Total Pairs: {contractInfo.factory.pairCount}</p>
                )}
              </div>
            </div>
          )}

          {/* WETH Info */}
          {contractInfo.weth && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">WETH</h4>
              <div className="text-sm text-gray-300 space-y-1">
                <p>Address: <span className="font-mono">{contractInfo.weth.address}</span></p>
                <p>Name: {contractInfo.weth.name}</p>
                <p>Symbol: {contractInfo.weth.symbol}</p>
                <p>Decimals: {contractInfo.weth.decimals}</p>
                <p>Total Supply: {contractInfo.weth.totalSupply}</p>
                <p>Status: {contractInfo.weth.status}</p>
              </div>
            </div>
          )}

          {/* Mock Tokens Info */}
          {contractInfo.tokens && Object.keys(contractInfo.tokens).length > 0 && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Mock Tokens</h4>
              <div className="space-y-3">
                {Object.entries(contractInfo.tokens).map(([tokenName, tokenInfo]) => (
                  <div key={tokenName} className="border-l-2 border-gray-600 pl-3">
                    <h5 className="text-white text-sm font-medium">{tokenName}</h5>
                    <div className="text-sm text-gray-300 space-y-1">
                      <p>Address: <span className="font-mono">{tokenInfo.address}</span></p>
                      {tokenInfo.name && <p>Name: {tokenInfo.name}</p>}
                      {tokenInfo.symbol && <p>Symbol: {tokenInfo.symbol}</p>}
                      {tokenInfo.decimals && <p>Decimals: {tokenInfo.decimals}</p>}
                      {tokenInfo.totalSupply && <p>Total Supply: {tokenInfo.totalSupply}</p>}
                      <p>Status: {tokenInfo.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={testContracts}
        disabled={loading}
        className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        {loading ? 'Testing...' : 'Test Contracts'}
      </button>
    </div>
  );
};

export default ContractTest; 
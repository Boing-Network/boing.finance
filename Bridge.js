import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import config from '../config';

const Bridge = () => {
  const [fromChain, setFromChain] = useState('1');
  const [toChain, setToChain] = useState('137');
  const [token, setToken] = useState('');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const chains = [
    { id: '1', name: 'Ethereum', symbol: 'ETH' },
    { id: '137', name: 'Polygon', symbol: 'MATIC' },
    { id: '56', name: 'BSC', symbol: 'BNB' },
    { id: '42161', name: 'Arbitrum', symbol: 'ARB' }
  ];

  const tokens = [
    { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000' },
    { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8' },
    { symbol: 'USDT', name: 'Tether USD', address: '0xC0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8' },
    { symbol: 'LINK', name: 'Chainlink', address: '0xD0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8' }
  ];

  const bridgeMutation = useMutation(
    async (bridgeData) => {
      // This would call the actual bridge contract
      const response = await axios.post(`${config.apiUrl}/bridge/transfer`, bridgeData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Bridge transfer initiated successfully!');
        setAmount('');
        setRecipient('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Bridge transfer failed');
      }
    }
  );

  const handleBridge = () => {
    if (!fromChain || !toChain || !token || !amount || !recipient) {
      toast.error('Please fill in all fields');
      return;
    }

    if (fromChain === toChain) {
      toast.error('Source and destination chains must be different');
      return;
    }

    bridgeMutation.mutate({
      fromChain,
      toChain,
      token,
      amount,
      recipient
    });
  };

  const getEstimatedFee = () => {
    // Mock fee calculation
    const baseFee = 0.001;
    const chainFee = fromChain === '1' ? 0.002 : 0.0005;
    return (baseFee + chainFee).toFixed(4);
  };

  const getEstimatedTime = () => {
    // Mock time estimation
    if (fromChain === '1') return '5-10 minutes';
    if (toChain === '1') return '10-15 minutes';
    return '2-5 minutes';
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Cross-Chain Bridge</h1>
        <p className="text-gray-300">Transfer tokens between different blockchains</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bridge Form */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Bridge Transfer</h2>
            
            <div className="space-y-6">
              {/* From Chain */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  From Chain
                </label>
                <select
                  value={fromChain}
                  onChange={(e) => setFromChain(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {chains.map((chain) => (
                    <option key={chain.id} value={chain.id}>
                      {chain.name} ({chain.symbol})
                    </option>
                  ))}
                </select>
              </div>

              {/* To Chain */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  To Chain
                </label>
                <select
                  value={toChain}
                  onChange={(e) => setToChain(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {chains.map((chain) => (
                    <option key={chain.id} value={chain.id}>
                      {chain.name} ({chain.symbol})
                    </option>
                  ))}
                </select>
              </div>

              {/* Token */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token
                </label>
                <select
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a token</option>
                  {tokens.map((t) => (
                    <option key={t.address} value={t.address}>
                      {t.symbol} - {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Bridge Button */}
              <button
                onClick={handleBridge}
                disabled={bridgeMutation.isLoading || isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
              >
                {bridgeMutation.isLoading ? 'Processing...' : 'Bridge Tokens'}
              </button>
            </div>
          </div>
        </div>

        {/* Bridge Info */}
        <div className="space-y-6">
          {/* Transfer Info */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Transfer Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Estimated Fee</span>
                <span className="text-white">{getEstimatedFee()} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Estimated Time</span>
                <span className="text-white">{getEstimatedTime()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Minimum Amount</span>
                <span className="text-white">0.001</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Maximum Amount</span>
                <span className="text-white">100.0</span>
              </div>
            </div>
          </div>

          {/* Supported Chains */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Supported Chains</h3>
            <div className="space-y-2">
              {chains.map((chain) => (
                <div key={chain.id} className="flex items-center justify-between">
                  <span className="text-gray-300">{chain.name}</span>
                  <span className="text-green-400 text-sm">✓</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transfers */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Transfers</h3>
            <div className="space-y-3">
              <div className="text-sm">
                <p className="text-gray-300">ETH → Polygon</p>
                <p className="text-gray-400 text-xs">2.5 ETH • 5 minutes ago</p>
              </div>
              <div className="text-sm">
                <p className="text-gray-300">USDC → BSC</p>
                <p className="text-gray-400 text-xs">1000 USDC • 1 hour ago</p>
              </div>
              <div className="text-sm">
                <p className="text-gray-300">LINK → Arbitrum</p>
                <p className="text-gray-400 text-xs">50 LINK • 2 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bridge Status */}
      <div className="mt-8 bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Bridge Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">99.9%</div>
            <div className="text-gray-300 text-sm">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">5.2min</div>
            <div className="text-gray-300 text-sm">Average Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">$2.5M</div>
            <div className="text-gray-300 text-sm">Total Volume</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bridge; 
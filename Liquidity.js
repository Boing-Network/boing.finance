import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import config from '../config';

const Liquidity = () => {
  const [selectedPool, setSelectedPool] = useState(null);
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');
  const [liquidityTokens, setLiquidityTokens] = useState('');
  const [activeTab, setActiveTab] = useState('add');
  const queryClient = useQueryClient();

  // Fetch user's liquidity positions
  const { data: positions, isLoading: positionsLoading } = useQuery(
    ['liquidity-positions', '0x123'], // Replace with actual user address
    async () => {
      const response = await axios.get(`${config.apiUrl}/liquidity/positions/0x123`);
      return response.data.data;
    },
    { refetchInterval: 30000 }
  );

  // Fetch all pools
  const { data: pools } = useQuery(
    ['liquidity-pools'],
    async () => {
      const response = await axios.get(`${config.apiUrl}/liquidity/pools`);
      return response.data.data;
    },
    { refetchInterval: 30000 }
  );

  // Add liquidity mutation
  const addLiquidityMutation = useMutation(
    async (liquidityData) => {
      const response = await axios.post(`${config.apiUrl}/liquidity/add`, liquidityData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Liquidity added successfully!');
        queryClient.invalidateQueries(['liquidity-positions']);
        queryClient.invalidateQueries(['liquidity-pools']);
        setAmount0('');
        setAmount1('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to add liquidity');
      }
    }
  );

  // Remove liquidity mutation
  const removeLiquidityMutation = useMutation(
    async (liquidityData) => {
      const response = await axios.post(`${config.apiUrl}/liquidity/remove`, liquidityData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Liquidity removed successfully!');
        queryClient.invalidateQueries(['liquidity-positions']);
        queryClient.invalidateQueries(['liquidity-pools']);
        setLiquidityTokens('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to remove liquidity');
      }
    }
  );

  const handleAddLiquidity = () => {
    if (!selectedPool || !amount0 || !amount1) {
      toast.error('Please fill in all fields');
      return;
    }

    addLiquidityMutation.mutate({
      pairAddress: selectedPool.address,
      provider: '0x123', // Replace with actual user address
      amount0,
      amount1
    });
  };

  const handleRemoveLiquidity = () => {
    if (!selectedPool || !liquidityTokens) {
      toast.error('Please fill in all fields');
      return;
    }

    removeLiquidityMutation.mutate({
      pairAddress: selectedPool.address,
      provider: '0x123', // Replace with actual user address
      liquidityTokens
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Liquidity Management</h1>
        <p className="text-gray-300">Add or remove liquidity from trading pools to earn fees</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg mb-8">
        <button
          onClick={() => setActiveTab('add')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'add'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Add Liquidity
        </button>
        <button
          onClick={() => setActiveTab('remove')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'remove'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Remove Liquidity
        </button>
        <button
          onClick={() => setActiveTab('positions')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'positions'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          My Positions
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {activeTab === 'add' && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Add Liquidity</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Pool
                  </label>
                  <select
                    value={selectedPool?.address || ''}
                    onChange={(e) => {
                      const pool = pools?.find(p => p.address === e.target.value);
                      setSelectedPool(pool);
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a pool</option>
                    {pools?.map((pool) => (
                      <option key={pool.address} value={pool.address}>
                        {pool.token0Symbol}/{pool.token1Symbol}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPool && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {selectedPool.token0Symbol} Amount
                      </label>
                      <input
                        type="number"
                        value={amount0}
                        onChange={(e) => setAmount0(e.target.value)}
                        placeholder="0.0"
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {selectedPool.token1Symbol} Amount
                      </label>
                      <input
                        type="number"
                        value={amount1}
                        onChange={(e) => setAmount1(e.target.value)}
                        placeholder="0.0"
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <button
                      onClick={handleAddLiquidity}
                      disabled={addLiquidityMutation.isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                    >
                      {addLiquidityMutation.isLoading ? 'Adding...' : 'Add Liquidity'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'remove' && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Remove Liquidity</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Pool
                  </label>
                  <select
                    value={selectedPool?.address || ''}
                    onChange={(e) => {
                      const pool = pools?.find(p => p.address === e.target.value);
                      setSelectedPool(pool);
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a pool</option>
                    {pools?.map((pool) => (
                      <option key={pool.address} value={pool.address}>
                        {pool.token0Symbol}/{pool.token1Symbol}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPool && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        LP Tokens to Remove
                      </label>
                      <input
                        type="number"
                        value={liquidityTokens}
                        onChange={(e) => setLiquidityTokens(e.target.value)}
                        placeholder="0.0"
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <button
                      onClick={handleRemoveLiquidity}
                      disabled={removeLiquidityMutation.isLoading}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                    >
                      {removeLiquidityMutation.isLoading ? 'Removing...' : 'Remove Liquidity'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'positions' && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">My Liquidity Positions</h2>
              
              {positionsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-300 mt-2">Loading positions...</p>
                </div>
              ) : positions?.length > 0 ? (
                <div className="space-y-4">
                  {positions.map((position) => (
                    <div key={position.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-medium text-white">
                          {position.token0Symbol}/{position.token1Symbol}
                        </h3>
                        <span className="text-sm text-gray-300">
                          {parseFloat(position.liquidityTokens).toFixed(4)} LP
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">{position.token0Symbol}</p>
                          <p className="text-white">{parseFloat(position.amount0).toFixed(6)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">{position.token1Symbol}</p>
                          <p className="text-white">{parseFloat(position.amount1).toFixed(6)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-300">No liquidity positions found</p>
                  <p className="text-gray-400 text-sm mt-2">Add liquidity to start earning fees</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pool Stats */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Pool Statistics</h3>
            {selectedPool ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Pool Address</span>
                  <span className="text-white text-sm font-mono">
                    {selectedPool.address.slice(0, 8)}...{selectedPool.address.slice(-6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Supply</span>
                  <span className="text-white">
                    {parseFloat(selectedPool.totalSupply).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Fee Rate</span>
                  <span className="text-white">
                    {(parseFloat(selectedPool.feeRate) * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">{selectedPool.token0Symbol} Reserve</span>
                  <span className="text-white">
                    {parseFloat(selectedPool.reserve0).toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">{selectedPool.token1Symbol} Reserve</span>
                  <span className="text-white">
                    {parseFloat(selectedPool.reserve1).toFixed(6)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Select a pool to view statistics</p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="text-sm">
                <p className="text-gray-300">Added liquidity to ETH/USDC</p>
                <p className="text-gray-400 text-xs">2 hours ago</p>
              </div>
              <div className="text-sm">
                <p className="text-gray-300">Removed liquidity from LINK/ETH</p>
                <p className="text-gray-400 text-xs">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Liquidity; 
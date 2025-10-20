import React, { useState } from 'react';
import { useBlockchainPools } from '../hooks/useBlockchainPools';
import { useWallet } from '../contexts/WalletContext';
import toast from 'react-hot-toast';

const BlockchainPoolTest = () => {
  const { account, chainId } = useWallet();
  const [testResults, setTestResults] = useState({});
  const [isTesting, setIsTesting] = useState(false);
  
  const {
    isInitialized,
    isLoading,
    error,
    initializeService,
    getUserPositions,
    getAllPools,
    getUserCreatedPools,
    getPoolInfo,
    getPoolAnalytics,
    getUserPortfolioValue,
    getUserLocks
  } = useBlockchainPools();

  const runTest = async (testName, testFunction) => {
    try {
      setIsTesting(true);
      const result = await testFunction();
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        }
      }));
      toast.success(`${testName} completed successfully`);
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          success: false,
          error: err.message,
          timestamp: new Date().toISOString()
        }
      }));
      toast.error(`${testName} failed: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const runAllTests = async () => {
    if (!isInitialized) {
      await runTest('Initialize Service', initializeService);
    }
    
    if (isInitialized) {
      await runTest('Get All Pools', () => getAllPools(10));
      if (account) {
        await runTest('Get User Positions', getUserPositions);
        await runTest('Get User Created Pools', getUserCreatedPools);
        await runTest('Get Portfolio Value', getUserPortfolioValue);
        await runTest('Get User Locks', getUserLocks);
      }
    }
  };

  if (!account) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Blockchain Pool Test</h3>
        <p className="text-gray-400">Please connect your wallet to test blockchain integration.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Blockchain Pool Test</h3>
      
      {/* Status */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Network:</span>
          <span className="text-white">{chainId}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Account:</span>
          <span className="text-white font-mono text-sm">{account}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Initialized:</span>
          <span className={isInitialized ? 'text-green-400' : 'text-red-400'}>
            {isInitialized ? '✅ Yes' : '❌ No'}
          </span>
        </div>
        {error && (
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Error:</span>
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Test Controls */}
      <div className="mb-6 space-y-2">
        <button
          onClick={runAllTests}
          disabled={isTesting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium"
        >
          {isTesting ? 'Running Tests...' : 'Run All Tests'}
        </button>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => runTest('Initialize Service', initializeService)}
            disabled={isTesting || isInitialized}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium"
          >
            Initialize
          </button>
          <button
            onClick={() => runTest('Get All Pools', () => getAllPools(5))}
            disabled={isTesting || !isInitialized}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium"
          >
            Get Pools
          </button>
        </div>
      </div>

      {/* Test Results */}
      <div className="space-y-3">
        <h4 className="text-md font-semibold text-white">Test Results:</h4>
        {Object.entries(testResults).map(([testName, result]) => (
          <div key={testName} className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">{testName}</span>
              <span className={result.success ? 'text-green-400' : 'text-red-400'}>
                {result.success ? '✅' : '❌'}
              </span>
            </div>
            <div className="text-sm text-gray-400">
              {result.success ? (
                <div>
                  <div>Data: {JSON.stringify(result.data).substring(0, 100)}...</div>
                  <div>Time: {new Date(result.timestamp).toLocaleTimeString()}</div>
                </div>
              ) : (
                <div>
                  <div>Error: {result.error}</div>
                  <div>Time: {new Date(result.timestamp).toLocaleTimeString()}</div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {Object.keys(testResults).length === 0 && (
          <p className="text-gray-400 text-sm">No tests run yet. Click "Run All Tests" to start.</p>
        )}
      </div>
    </div>
  );
};

export default BlockchainPoolTest; 
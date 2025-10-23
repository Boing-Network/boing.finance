// Base App integration test utilities
import { baseAppUtils } from '../components/BaseMiniAppWrapper';
import { baseUtils } from '../config/baseConfig';

export const testBaseAppIntegration = () => {
  const results = {
    isBaseApp: false,
    isBaseNetwork: false,
    manifestAccessible: false,
    sdkAvailable: false,
    errors: []
  };

  try {
    // Test Base App detection
    results.isBaseApp = baseAppUtils.isInBaseApp();
    console.log('Base App detection:', results.isBaseApp);

    // Test Base network detection
    const currentChainId = window.ethereum?.chainId;
    results.isBaseNetwork = baseUtils.isBaseNetwork(currentChainId);
    console.log('Base network detection:', results.isBaseNetwork);

    // Test manifest accessibility
    fetch('/.well-known/farcaster.json')
      .then(response => {
        if (response.ok) {
          results.manifestAccessible = true;
          console.log('Manifest file accessible');
        } else {
          results.errors.push('Manifest file not accessible');
        }
      })
      .catch(error => {
        results.errors.push(`Manifest fetch error: ${error.message}`);
      });

    // Test SDK availability
    try {
      // This will only work if the SDK is properly installed
      if (typeof window !== 'undefined' && window.BaseMiniApp) {
        results.sdkAvailable = true;
        console.log('Base MiniApp SDK available');
      } else {
        results.errors.push('Base MiniApp SDK not available');
      }
    } catch (error) {
      results.errors.push(`SDK check error: ${error.message}`);
    }

  } catch (error) {
    results.errors.push(`Test error: ${error.message}`);
  }

  return results;
};

// Test Base network configuration
export const testBaseNetworkConfig = () => {
  const config = baseUtils.getBaseNetworkConfig();
  const tests = {
    chainId: config.chainId === 8453,
    chainName: config.chainName === 'Base',
    rpcUrl: config.rpcUrl.includes('base.org'),
    explorer: config.explorer.includes('basescan.org'),
    nativeCurrency: config.nativeCurrency.symbol === 'ETH'
  };

  const passed = Object.values(tests).filter(Boolean).length;
  const total = Object.keys(tests).length;

  return {
    tests,
    passed,
    total,
    percentage: Math.round((passed / total) * 100)
  };
};

// Test Base App features
export const testBaseAppFeatures = () => {
  const features = {
    networkOptimization: typeof baseUtils.optimizeTransaction === 'function',
    gasEstimation: typeof baseUtils.getGasEstimate === 'function',
    explorerUrl: typeof baseUtils.getExplorerUrl === 'function',
    valueFormatting: typeof baseUtils.formatBaseValue === 'function'
  };

  const passed = Object.values(features).filter(Boolean).length;
  const total = Object.keys(features).length;

  return {
    features,
    passed,
    total,
    percentage: Math.round((passed / total) * 100)
  };
};

// Run all tests
export const runAllTests = () => {
  console.log('🧪 Running Base App integration tests...');
  
  const integrationTest = testBaseAppIntegration();
  const networkTest = testBaseNetworkConfig();
  const featuresTest = testBaseAppFeatures();

  const results = {
    integration: integrationTest,
    network: networkTest,
    features: featuresTest,
    overall: {
      passed: integrationTest.isBaseApp + networkTest.passed + featuresTest.passed,
      total: 3 + networkTest.total + featuresTest.total,
      errors: integrationTest.errors
    }
  };

  console.log('📊 Test Results:', results);
  
  if (results.overall.errors.length > 0) {
    console.warn('⚠️  Issues found:', results.overall.errors);
  } else {
    console.log('✅ All tests passed!');
  }

  return results;
};

// Auto-run tests in development
if (process.env.NODE_ENV === 'development') {
  // Run tests after a short delay to ensure everything is loaded
  setTimeout(() => {
    runAllTests();
  }, 2000);
}

export default {
  testBaseAppIntegration,
  testBaseNetworkConfig,
  testBaseAppFeatures,
  runAllTests
};

import apyCalculationService from '../services/apyCalculationService';

// Test APY calculation
async function testAPYCalculation() {
  console.log('🧪 Testing APY Calculation Service...');
  
  try {
    // Test with a mock provider and factory address
    const mockProvider = {
      getBlockNumber: async () => 1000000,
      getBlock: async (blockNumber) => ({
        timestamp: Math.floor(Date.now() / 1000)
      })
    };
    
    const mockFactoryAddress = '0x1234567890123456789012345678901234567890';
    const mockPairAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
    
    // Test APY calculation
    const apyData = await apyCalculationService.calculatePoolAPY(
      mockPairAddress,
      mockProvider,
      mockFactoryAddress,
      24
    );
    
    console.log('✅ APY Calculation Test Results:', {
      apy: `${apyData.apy.toFixed(2)}%`,
      volume24h: `$${apyData.volume24h.toFixed(2)}`,
      volume7d: `$${apyData.volume7d.toFixed(2)}`,
      swapCount: apyData.swapCount,
      feeRate: `${(apyData.feeRate * 100).toFixed(2)}%`,
      timeRange: `${apyData.timeRange}h`,
      lastUpdated: new Date(apyData.lastUpdated).toLocaleString()
    });
    
    return apyData;
  } catch (error) {
    console.error('❌ APY Calculation Test Failed:', error);
    throw error;
  }
}

// Export for use in other tests
export { testAPYCalculation };

// Run test if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.testAPYCalculation = testAPYCalculation;
} else {
  // Node.js environment
  testAPYCalculation().catch(console.error);
} 
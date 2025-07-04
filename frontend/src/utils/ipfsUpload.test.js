// Simple test for IPFS upload functionality
// This is a basic test to verify the functions work correctly

import { validateFile, createTokenMetadata, getIPFSGatewayUrl } from './ipfsUpload';

// Mock file for testing
const createMockFile = (name, size, type) => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Test validateFile function
export const testValidateFile = () => {
  console.log('Testing validateFile function...');
  
  // Test valid file
  const validFile = createMockFile('test.png', 1024 * 1024, 'image/png');
  try {
    validateFile(validFile);
    console.log('✅ Valid file test passed');
  } catch (error) {
    console.error('❌ Valid file test failed:', error.message);
  }
  
  // Test file too large
  const largeFile = createMockFile('large.png', 10 * 1024 * 1024, 'image/png');
  try {
    validateFile(largeFile);
    console.error('❌ Large file test should have failed');
  } catch (error) {
    console.log('✅ Large file test passed (correctly rejected)');
  }
  
  // Test invalid file type
  const invalidFile = createMockFile('test.txt', 1024, 'text/plain');
  try {
    validateFile(invalidFile);
    console.error('❌ Invalid file type test should have failed');
  } catch (error) {
    console.log('✅ Invalid file type test passed (correctly rejected)');
  }
};

// Test createTokenMetadata function
export const testCreateTokenMetadata = () => {
  console.log('Testing createTokenMetadata function...');
  
  const tokenData = {
    name: 'Test Token',
    symbol: 'TEST',
    description: 'A test token',
    logoUrl: 'ipfs://QmTestHash',
    website: 'https://test.com',
    network: 'Ethereum',
    decimals: 18,
    initialSupply: '1000000',
    twitter: 'https://twitter.com/test',
    telegram: 'https://t.me/test',
    discord: 'https://discord.gg/test',
    github: 'https://github.com/test',
    medium: 'https://medium.com/@test',
    reddit: 'https://reddit.com/r/test',
    renounceMint: true,
    enableBlacklist: false,
    antiBotEnabled: true,
    antiWhaleEnabled: false,
    pauseFunctionEnabled: true,
    timelockEnabled: false
  };
  
  const metadata = createTokenMetadata(tokenData);
  
  console.log('Generated metadata:', JSON.stringify(metadata, null, 2));
  
  // Verify required fields
  if (metadata.name === tokenData.name && 
      metadata.symbol === tokenData.symbol && 
      metadata.image === tokenData.logoUrl) {
    console.log('✅ Metadata creation test passed');
  } else {
    console.error('❌ Metadata creation test failed');
  }
};

// Test getIPFSGatewayUrl function
export const testGetIPFSGatewayUrl = () => {
  console.log('Testing getIPFSGatewayUrl function...');
  
  const hash = 'QmTestHash';
  const url = getIPFSGatewayUrl(hash);
  
  if (url && url.includes(hash)) {
    console.log('✅ Gateway URL test passed:', url);
  } else {
    console.error('❌ Gateway URL test failed');
  }
};

// Run all tests
export const runAllTests = () => {
  console.log('Running IPFS upload tests...\n');
  testValidateFile();
  console.log('');
  testCreateTokenMetadata();
  console.log('');
  testGetIPFSGatewayUrl();
  console.log('\nAll tests completed!');
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testIPFSUpload = runAllTests;
} 
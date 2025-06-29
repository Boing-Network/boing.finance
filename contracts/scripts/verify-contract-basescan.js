require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');

async function verifyContractOnBaseScan() {
  try {
    const contractAddress = '0x3c90c507B831353a6D21C34204007466C799667f';
    const txHash = '0x6ea445005817c6480a3dcc167a9d52fb2282a3082f1c9288cae16487e38aaa5c';
    
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`Transaction Hash: ${txHash}`);
    
    // Check if BaseScan API key is available
    if (!process.env.BASESCAN_API_KEY) {
      console.error('❌ BASESCAN_API_KEY not found in .env file');
      console.log('Please add your BaseScan API key to the .env file:');
      console.log('BASESCAN_API_KEY=your_basescan_api_key_here');
      console.log('\nGet your API key from: https://basescan.org/apis');
      return;
    }
    
    // Load the contract source code
    const contractSourcePath = path.join(__dirname, 'contracts', 'AdvancedERC20.sol');
    if (!fs.existsSync(contractSourcePath)) {
      console.error('❌ Contract source file not found:', contractSourcePath);
      return;
    }
    
    const contractSource = fs.readFileSync(contractSourcePath, 'utf8');
    console.log('✅ Contract source loaded');
    
    // Load the compiled artifact to get compiler settings
    const artifactPath = path.join(__dirname, 'artifacts', 'contracts', 'AdvancedERC20.sol', 'AdvancedERC20.json');
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    // Extract compiler settings from the artifact
    const compilerSettings = {
      optimizer: {
        enabled: true,
        runs: 200
      },
      evmVersion: "paris"
    };
    
    // Prepare the verification request
    const postData = JSON.stringify({
      apikey: process.env.BASESCAN_API_KEY,
      module: 'contract',
      action: 'verifysourcecode',
      contractaddress: contractAddress,
      sourceCode: contractSource,
      codeformat: 'solidity-single-file',
      contractname: 'AdvancedERC20',
      compilerversion: 'v0.8.20+commit.a1b79de6',
      optimizationUsed: '1',
      runs: '200',
      constructorArguements: '', // We'll use the transaction hash instead
      evmversion: 'paris',
      licenseType: '3', // MIT License
      txHash: txHash // Use transaction hash for constructor arguments
    });
    
    console.log('Sending verification request to BaseScan...');
    
    // Make the API request
    const options = {
      hostname: 'api.basescan.org',
      port: 443,
      path: '/api',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const request = https.request(options, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('\nBaseScan API Response:');
          console.log(JSON.stringify(result, null, 2));
          
          if (result.status === '1') {
            console.log('\n✅ Contract verification submitted successfully!');
            console.log(`GUID: ${result.result}`);
            console.log('\nYou can check the verification status at:');
            console.log(`https://basescan.org/address/${contractAddress}#code`);
          } else {
            console.log('\n❌ Contract verification failed:');
            console.log(`Error: ${result.result}`);
            
            if (result.result.includes('Already Verified')) {
              console.log('\nThe contract is already verified!');
              console.log(`View it at: https://basescan.org/address/${contractAddress}#code`);
            }
          }
        } catch (error) {
          console.error('Error parsing API response:', error);
          console.log('Raw response:', data);
        }
      });
    });
    
    request.on('error', (error) => {
      console.error('Error making API request:', error);
    });
    
    request.write(postData);
    request.end();
    
  } catch (error) {
    console.error('Error verifying contract:', error);
  }
}

// Also create a function to check verification status
async function checkVerificationStatus(guid) {
  try {
    if (!process.env.BASESCAN_API_KEY) {
      console.error('❌ BASESCAN_API_KEY not found in .env file');
      return;
    }
    
    const postData = JSON.stringify({
      apikey: process.env.BASESCAN_API_KEY,
      module: 'contract',
      action: 'checkverifystatus',
      guid: guid
    });
    
    const options = {
      hostname: 'api.basescan.org',
      port: 443,
      path: '/api',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const request = https.request(options, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('\nVerification Status:');
          console.log(JSON.stringify(result, null, 2));
        } catch (error) {
          console.error('Error parsing status response:', error);
          console.log('Raw response:', data);
        }
      });
    });
    
    request.on('error', (error) => {
      console.error('Error checking status:', error);
    });
    
    request.write(postData);
    request.end();
    
  } catch (error) {
    console.error('Error checking verification status:', error);
  }
}

// Export functions for use
module.exports = {
  verifyContractOnBaseScan,
  checkVerificationStatus
};

// Run verification if this script is executed directly
if (require.main === module) {
  verifyContractOnBaseScan();
} 
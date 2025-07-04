// IPFS Upload Utility
// Uses public IPFS gateways and services for uploading files and metadata

import { getBestIPFSKey, debugIPFSConfig } from '../config/ipfsConfig';

const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
  'https://ipfs.fleek.co/ipfs/',
  'https://gateway.temporal.cloud/ipfs/'
];

// Upload to Cloudflare R2 (Primary storage)
const uploadToR2 = async (file) => {
  try {
    console.log('Starting R2 upload...');
    
    // Get backend URL from environment or use default
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8787';
    console.log('Using backend URL:', backendUrl);
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${backendUrl}/api/r2/upload`, {
      method: 'POST',
      body: formData
    });
    
    console.log('R2 response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('R2 error response:', errorText);
      throw new Error(`R2 API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('R2 upload successful:', result);
    
    if (!result.success || !result.data) {
      throw new Error('R2 upload failed: Invalid response format');
    }
    
    return result.data;
  } catch (error) {
    console.error('R2 upload error:', error);
    throw error;
  }
};

// Upload file to IPFS using available services
export const uploadToIPFS = async (file, apiKey = null) => {
  try {
    // Debug configuration
    debugIPFSConfig();
    
    // Get the best available API key if none provided
    const bestKey = apiKey || getBestIPFSKey();
    
    console.log('IPFS Upload - Best key found:', bestKey ? bestKey.type : 'none');
    
    // If no API key available, throw error
    if (!bestKey) {
      throw new Error('No storage service configured. Please set up Cloudflare R2 or add an API key to your .env file.');
    }
    
    // Try authenticated services
    try {
      switch (bestKey.type) {
        case 'r2':
          console.log('Attempting R2 upload...');
          return await uploadToR2(file);
        case 'storacha':
          console.log('Attempting Storacha Network upload...');
          return await uploadToStoracha(file, bestKey.key);
        case 'web3storage':
          console.log('Attempting Web3.Storage upload...');
          return await uploadToWeb3Storage(file, bestKey.key);
        case 'infura':
          console.log('Attempting Infura upload...');
          return await uploadToInfura(file, bestKey.projectId, bestKey.projectSecret);
        case 'pinata':
          console.log('Attempting Pinata upload...');
          return await uploadToPinata(file, bestKey.key);
        default:
          throw new Error(`Unknown API key type: ${bestKey.type}`);
      }
    } catch (error) {
      console.error('Storage service failed:', error);
      throw new Error(`Upload failed: ${error.message}. Please check your configuration or try a different service.`);
    }
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

// Upload to Pinata with API key
const uploadToPinata = async (file, apiKey) => {
  try {
    console.log('Starting Pinata upload...');
    const formData = new FormData();
    formData.append('file', file);
    
    // Try JWT token first (modern API)
    let response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });
    
    console.log('Pinata JWT response status:', response.status);
    
    // If JWT fails with scope error, try legacy API key format
    if (!response.ok) {
      console.log('JWT failed, trying legacy API key format...');
      
      // Try legacy API key format (some users report this works when JWT has scope issues)
      response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': apiKey.split('.')[0] || apiKey, // Use first part of JWT as API key
          'pinata_secret_api_key': apiKey.split('.')[1] || '' // Use second part as secret
        },
        body: formData
      });
      
      console.log('Pinata legacy response status:', response.status);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pinata error response:', errorText);
      throw new Error(`Pinata API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Pinata upload successful:', result);
    const hash = result.IpfsHash;
    
    return {
      hash,
      url: `ipfs://${hash}`,
      gatewayUrls: IPFS_GATEWAYS.map(gateway => `${gateway}${hash}`)
    };
  } catch (error) {
    console.error('Pinata upload error:', error);
    throw error;
  }
};

// Upload to Infura IPFS
const uploadToInfura = async (file, projectId, projectSecret) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const auth = btoa(`${projectId}:${projectSecret}`);
    
    const response = await fetch(`https://ipfs.infura.io:5001/api/v0/add`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Infura IPFS error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    const hash = result.Hash;
    
    return {
      hash,
      url: `ipfs://${hash}`,
      gatewayUrls: IPFS_GATEWAYS.map(gateway => `${gateway}${hash}`)
    };
  } catch (error) {
    console.error('Infura upload error:', error);
    throw error;
  }
};

// Upload to Web3.Storage
const uploadToWeb3Storage = async (file, apiKey) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('https://api.web3.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Web3.Storage error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    const hash = result.cid;
    
    return {
      hash,
      url: `ipfs://${hash}`,
      gatewayUrls: IPFS_GATEWAYS.map(gateway => `${gateway}${hash}`)
    };
  } catch (error) {
    console.error('Web3.Storage upload error:', error);
    throw error;
  }
};

// Upload to Storacha Network
const uploadToStoracha = async (file, apiKey) => {
  try {
    console.log('Starting Storacha Network upload...');
    
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Create the upload request
    const response = await fetch('https://api.storacha.network/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Authorization': `Bearer ${apiKey}`,
        'X-File-Name': file.name,
        'X-File-Type': file.type
      },
      body: uint8Array
    });
    
    console.log('Storacha response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Storacha error response:', errorText);
      throw new Error(`Storacha Network error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Storacha upload successful:', result);
    
    // Storacha returns a CID (Content Identifier)
    const hash = result.cid || result.hash;
    
    return {
      hash,
      url: `ipfs://${hash}`,
      gatewayUrls: IPFS_GATEWAYS.map(gateway => `${gateway}${hash}`)
    };
  } catch (error) {
    console.error('Storacha upload error:', error);
    
    // If the main API fails, try alternative endpoints
    try {
      console.log('Trying alternative Storacha endpoint...');
      const formData = new FormData();
      formData.append('file', file);
      
      const altResponse = await fetch('https://api.storacha.network/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });
      
      if (altResponse.ok) {
        const altResult = await altResponse.json();
        const hash = altResult.cid || altResult.hash;
        
        return {
          hash,
          url: `ipfs://${hash}`,
          gatewayUrls: IPFS_GATEWAYS.map(gateway => `${gateway}${hash}`)
        };
      }
    } catch (altError) {
      console.error('Alternative Storacha endpoint also failed:', altError);
    }
    
    throw error;
  }
};

// Upload metadata to IPFS
export const uploadMetadataToIPFS = async (metadata, apiKey = null) => {
  try {
    console.log('Starting metadata upload to IPFS...');
    console.log('Metadata to upload:', metadata);
    
    const bestKey = apiKey || getBestIPFSKey();
    console.log('Best storage key found:', bestKey ? bestKey.type : 'none');
    
    if (!bestKey) {
      throw new Error('No storage service configured. Please set up Cloudflare R2 or add an API key to your .env file.');
    }
    
    switch (bestKey.type) {
      case 'r2':
        console.log('Uploading metadata to R2...');
        return await uploadMetadataToR2(metadata);
      case 'pinata':
        console.log('Uploading metadata to Pinata...');
        return await uploadMetadataToPinata(metadata, bestKey.key);
      case 'infura':
        console.log('Uploading metadata to Infura...');
        return await uploadMetadataToInfura(metadata, bestKey.projectId, bestKey.projectSecret);
      case 'web3storage':
        console.log('Uploading metadata to Web3.Storage...');
        return await uploadMetadataToWeb3Storage(metadata, bestKey.key);
      default:
        throw new Error(`Metadata upload not supported for ${bestKey.type}`);
    }
  } catch (error) {
    console.error('Metadata upload error:', error);
    throw error;
  }
};

// Upload metadata to R2
const uploadMetadataToR2 = async (metadata) => {
  try {
    console.log('Creating metadata blob...');
    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json'
    });
    
    console.log('Creating metadata file...');
    const metadataFile = new File([metadataBlob], 'metadata.json', {
      type: 'application/json'
    });
    
    console.log('Metadata file created:', {
      name: metadataFile.name,
      size: metadataFile.size,
      type: metadataFile.type
    });
    
    console.log('Calling uploadToR2 for metadata...');
    const result = await uploadToR2(metadataFile);
    console.log('Metadata upload result:', result);
    
    return result;
  } catch (error) {
    console.error('Metadata upload error:', error);
    throw error;
  }
};

// Upload metadata to Pinata
const uploadMetadataToPinata = async (metadata, apiKey) => {
  try {
    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json'
    });
    
    const metadataFile = new File([metadataBlob], 'metadata.json', {
      type: 'application/json'
    });
    
    return await uploadToPinata(metadataFile, apiKey);
  } catch (error) {
    console.error('Metadata upload error:', error);
    throw error;
  }
};

// Upload metadata to Infura
const uploadMetadataToInfura = async (metadata, projectId, projectSecret) => {
  try {
    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json'
    });
    
    const metadataFile = new File([metadataBlob], 'metadata.json', {
      type: 'application/json'
    });
    
    return await uploadToInfura(metadataFile, projectId, projectSecret);
  } catch (error) {
    console.error('Metadata upload error:', error);
    throw error;
  }
};

// Upload metadata to Web3.Storage
const uploadMetadataToWeb3Storage = async (metadata, apiKey) => {
  try {
    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json'
    });
    
    const metadataFile = new File([metadataBlob], 'metadata.json', {
      type: 'application/json'
    });
    
    return await uploadToWeb3Storage(metadataFile, apiKey);
  } catch (error) {
    console.error('Metadata upload error:', error);
    throw error;
  }
};

// Debug Pinata API Key (available in browser console)
export const debugPinataKey = async () => {
  const pinataKey = process.env.REACT_APP_PINATA_API_KEY;
  
  console.log('🔍 Debugging Pinata API Key');
  console.log('===========================');
  console.log('Key exists:', !!pinataKey);
  console.log('Key length:', pinataKey?.length);
  console.log('Key preview:', pinataKey ? pinataKey.substring(0, 50) + '...' : 'NOT FOUND');
  
  if (!pinataKey) {
    console.log('❌ No Pinata key found in environment variables');
    return;
  }
  
  // Decode JWT to check expiration
  try {
    const parts = pinataKey.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log('\n📋 JWT Payload:');
      console.log('Issued at:', new Date(payload.iat * 1000).toISOString());
      console.log('Expires at:', new Date(payload.exp * 1000).toISOString());
      console.log('Current time:', new Date().toISOString());
      console.log('Is expired:', Date.now() > payload.exp * 1000);
      console.log('User ID:', payload.user_information?.id);
      console.log('Email:', payload.user_information?.email);
      console.log('Status:', payload.user_information?.status);
    }
  } catch (error) {
    console.log('Could not decode JWT payload:', error.message);
  }
  
  // Test different API endpoints
  console.log('\n🧪 Testing Pinata API endpoints...');
  
  const endpoints = [
    {
      name: 'Authentication Test',
      url: 'https://api.pinata.cloud/data/testAuthentication',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${pinataKey}` }
    },
    {
      name: 'User Profile',
      url: 'https://api.pinata.cloud/users/getProfile',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${pinataKey}` }
    },
    {
      name: 'Pin List',
      url: 'https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=1',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${pinataKey}` }
    }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\nTesting ${endpoint.name}...`);
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: endpoint.headers
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Success:', result);
      } else {
        const errorText = await response.text();
        console.log('❌ Error:', errorText);
      }
    } catch (error) {
      console.log('❌ Network error:', error.message);
    }
  }
};

// Make debug function available globally
if (typeof window !== 'undefined') {
  window.debugPinataKey = debugPinataKey;
}

// Create token metadata object
export const createTokenMetadata = (tokenData) => {
  const metadata = {
    name: tokenData.name,
    symbol: tokenData.symbol,
    description: tokenData.description || `${tokenData.name} (${tokenData.symbol}) token`,
    image: tokenData.logoUrl || '',
    external_url: tokenData.website || '',
    attributes: [
      {
        trait_type: 'Token Type',
        value: 'ERC-20'
      },
      {
        trait_type: 'Network',
        value: tokenData.network || 'Ethereum'
      }
    ]
  };

  // Add social links if available
  if (tokenData.socialLinks) {
    Object.entries(tokenData.socialLinks).forEach(([platform, url]) => {
      if (url) {
        metadata[platform.toLowerCase()] = url;
      }
    });
  }

  return metadata;
};

// Validate file before upload
export const validateFile = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  
  if (!file) {
    throw new Error('No file provided');
  }
  
  if (file.size > maxSize) {
    throw new Error(`File size too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type not supported. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  return true;
};

// Get IPFS gateway URL
export const getIPFSGatewayUrl = (hash, gatewayIndex = 0) => {
  if (!hash) return null;
  
  const gateway = IPFS_GATEWAYS[gatewayIndex] || IPFS_GATEWAYS[0];
  return `${gateway}${hash}`;
};

// Test gateway availability
export const testGatewayAvailability = async () => {
  const testHash = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
  const results = [];
  
  for (let i = 0; i < IPFS_GATEWAYS.length; i++) {
    const gateway = IPFS_GATEWAYS[i];
    const url = `${gateway}${testHash}`;
    
    try {
      const startTime = Date.now();
      const response = await fetch(url, { method: 'HEAD' });
      const endTime = Date.now();
      
      results.push({
        gateway: gateway.replace('https://', '').replace('/ipfs/', ''),
        url,
        status: response.status,
        responseTime: endTime - startTime,
        available: response.ok
      });
    } catch (error) {
      results.push({
        gateway: gateway.replace('https://', '').replace('/ipfs/', ''),
        url,
        status: 'error',
        responseTime: null,
        available: false,
        error: error.message
      });
    }
  }
  
  return results;
};

// Get the best available gateway
export const getBestGateway = async () => {
  const results = await testGatewayAvailability();
  const available = results.filter(r => r.available);
  
  if (available.length === 0) {
    return IPFS_GATEWAYS[0]; // Fallback to first gateway
  }
  
  // Return the fastest available gateway
  const fastest = available.reduce((prev, current) => 
    (prev.responseTime < current.responseTime) ? prev : current
  );
  
  return fastest.url.replace(fastest.url.split('/ipfs/')[1], '');
}; 
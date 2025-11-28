// IPFS Configuration
// Updated to prioritize Cloudflare R2 storage for better reliability

export const IPFS_CONFIG = {
  // Cloudflare R2 Storage (Primary - most reliable)
  ENABLE_R2: true, // R2 is now the primary storage
  
  // Pinata API Key (get from https://app.pinata.cloud/)
  PINATA_API_KEY: process.env.REACT_APP_PINATA_API_KEY || null,
  
  // Infura IPFS Project ID and Secret (get from https://infura.io/)
  INFURA_PROJECT_ID: process.env.REACT_APP_INFURA_PROJECT_ID || null,
  INFURA_PROJECT_SECRET: process.env.REACT_APP_INFURA_PROJECT_SECRET || null,
  
  // Web3.Storage API Key (get from https://web3.storage/)
  WEB3_STORAGE_API_KEY: process.env.REACT_APP_WEB3_STORAGE_API_KEY || null,
  
  // Storacha Network API Key (get from https://console.storacha.network/)
  STORACHA_API_KEY: process.env.REACT_APP_STORACHA_API_KEY || null,
  
  // Enable/disable services
  ENABLE_PINATA: false, // Disabled - use R2 instead
  ENABLE_INFURA: false, // Disabled - use R2 instead
  ENABLE_WEB3_STORAGE: false, // Disabled - use R2 instead
  ENABLE_STORACHA: false, // Disabled - use R2 instead
  
  // Fallback to simulation if no API keys
  FALLBACK_TO_SIMULATION: false, // Disabled - will show error instead of fake hash
  
  // Development mode (for debugging purposes)
  DEVELOPMENT_MODE: process.env.NODE_ENV === 'development'
};

// Get the best available API key
export const getBestIPFSKey = () => {
  // Priority order: R2 > Pinata > Infura > Web3.Storage > Storacha
  if (IPFS_CONFIG.ENABLE_R2) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Using Cloudflare R2 for file uploads (primary storage)');
    }
    return { type: 'r2' };
  }
  if (IPFS_CONFIG.ENABLE_PINATA && IPFS_CONFIG.PINATA_API_KEY) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Using Pinata API key for IPFS uploads (fallback)');
    }
    return { type: 'pinata', key: IPFS_CONFIG.PINATA_API_KEY };
  }
  if (IPFS_CONFIG.ENABLE_INFURA && IPFS_CONFIG.INFURA_PROJECT_ID && IPFS_CONFIG.INFURA_PROJECT_SECRET) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Using Infura API key for IPFS uploads (fallback)');
    }
    return { 
      type: 'infura', 
      projectId: IPFS_CONFIG.INFURA_PROJECT_ID,
      projectSecret: IPFS_CONFIG.INFURA_PROJECT_SECRET
    };
  }
  if (IPFS_CONFIG.ENABLE_WEB3_STORAGE && IPFS_CONFIG.WEB3_STORAGE_API_KEY) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Using Web3.Storage API key for IPFS uploads (fallback)');
    }
    return { type: 'web3storage', key: IPFS_CONFIG.WEB3_STORAGE_API_KEY };
  }
  if (IPFS_CONFIG.ENABLE_STORACHA && IPFS_CONFIG.STORACHA_API_KEY) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Using Storacha Network API key for IPFS uploads (fallback)');
    }
    return { type: 'storacha', key: IPFS_CONFIG.STORACHA_API_KEY };
  }
  if (process.env.NODE_ENV === 'development') {
    console.log('No storage service available');
  }
  return null;
};

// Debug function to check environment variables
export const debugIPFSConfig = () => {
  // Only log in development - use logger utility
  if (process.env.NODE_ENV === 'development') {
    console.log('=== IPFS Configuration Debug ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    // Don't log actual API keys, just whether they exist
    console.log('PINATA_API_KEY exists:', !!process.env.REACT_APP_PINATA_API_KEY);
    console.log('INFURA_PROJECT_ID exists:', !!process.env.REACT_APP_INFURA_PROJECT_ID);
    console.log('WEB3_STORAGE_API_KEY exists:', !!process.env.REACT_APP_WEB3_STORAGE_API_KEY);
    console.log('STORACHA_API_KEY exists:', !!process.env.REACT_APP_STORACHA_API_KEY);
    console.log('Best API key:', getBestIPFSKey());
    console.log('================================');
  }
};

// Instructions for setting up IPFS API keys
export const IPFS_SETUP_INSTRUCTIONS = {
  pinata: {
    name: 'Pinata',
    url: 'https://app.pinata.cloud/',
    steps: [
      '1. Go to https://app.pinata.cloud/',
      '2. Create a free account',
      '3. Go to API Keys section',
      '4. Create a new API key',
      '5. Copy the JWT token',
      '6. Add to your .env file: REACT_APP_PINATA_API_KEY=your_jwt_token'
    ]
  },
  infura: {
    name: 'Infura',
    url: 'https://infura.io/',
    steps: [
      '1. Go to https://infura.io/',
      '2. Create a free account',
      '3. Create a new IPFS project',
      '4. Copy the Project ID and Project Secret',
      '5. Add to your .env file:',
      '   REACT_APP_INFURA_PROJECT_ID=your_project_id',
      '   REACT_APP_INFURA_PROJECT_SECRET=your_project_secret'
    ]
  },
  web3storage: {
    name: 'Web3.Storage',
    url: 'https://web3.storage/',
    steps: [
      '1. Go to https://web3.storage/',
      '2. Create a free account',
      '3. Go to API Tokens section',
      '4. Create a new API token',
      '5. Copy the token',
      '6. Add to your .env file: REACT_APP_WEB3_STORAGE_API_KEY=your_token'
    ]
  },
  nftstorage: {
    name: 'NFT.Storage',
    url: 'https://nft.storage/',
    steps: [
      '1. Go to https://nft.storage/',
      '2. Create a free account',
      '3. Go to API Keys section',
      '4. Create a new API key',
      '5. Copy the key',
      '6. Add to your .env file: REACT_APP_NFT_STORAGE_API_KEY=your_key'
    ]
  },
  storacha: {
    name: 'Storacha Network',
    url: 'https://console.storacha.network/',
    steps: [
      '1. Go to https://console.storacha.network/',
      '2. Create a free account',
      '3. Create a new space',
      '4. Copy the DID key (starts with did:key:)',
      '5. Add to your .env file: REACT_APP_STORACHA_API_KEY=your_did_key'
    ]
  }
}; 
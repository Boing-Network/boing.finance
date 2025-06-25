// Environment configuration
const config = {
  development: {
    apiUrl: 'http://localhost:3001/api',
    workerUrl: 'http://localhost:8787/api',
    environment: 'development'
  },
  staging: {
    apiUrl: 'https://mochi-api-staging.your-subdomain.workers.dev/api',
    workerUrl: 'https://mochi-api-staging.your-subdomain.workers.dev/api',
    environment: 'staging'
  },
  production: {
    apiUrl: 'https://mochi-api-prod.your-subdomain.workers.dev/api',
    workerUrl: 'https://mochi-api-prod.your-subdomain.workers.dev/api',
    environment: 'production'
  }
};

// Get current environment
const getEnvironment = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_ENV === 'staging' ? 'staging' : 'production';
  }
  return 'development';
};

// Export current config
const currentConfig = config[getEnvironment()];

export default currentConfig;

// Helper function to get API URL
export const getApiUrl = () => {
  // In development, prefer local server, fallback to worker
  if (getEnvironment() === 'development') {
    return currentConfig.apiUrl;
  }
  return currentConfig.workerUrl;
};

// Helper function to check if we're in development
export const isDevelopment = () => getEnvironment() === 'development';

// Helper function to check if we're in production
export const isProduction = () => getEnvironment() === 'production'; 
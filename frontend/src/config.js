// Environment configuration
const config = {
  development: {
    // Use staging API for development to avoid using the unused boing-api worker
    apiUrl: 'https://boing-api-staging.nico-chikuji.workers.dev/api',
    workerUrl: 'https://boing-api-staging.nico-chikuji.workers.dev/api',
    environment: 'development'
  },
  staging: {
    apiUrl: 'https://boing-api-staging.nico-chikuji.workers.dev/api',
    workerUrl: 'https://boing-api-staging.nico-chikuji.workers.dev/api',
    environment: 'staging'
  },
  production: {
    apiUrl: 'https://boing-api-prod.nico-chikuji.workers.dev/api',
    workerUrl: 'https://boing-api-prod.nico-chikuji.workers.dev/api',
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
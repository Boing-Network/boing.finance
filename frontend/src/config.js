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

const getEnvironment = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_ENV === 'staging' ? 'staging' : 'production';
  }
  return 'development';
};

const currentConfig = config[getEnvironment()];

export default currentConfig;

function stripTrailingSlash(url) {
  return String(url || '').replace(/\/+$/, '');
}

function stripApiSuffix(url) {
  return stripTrailingSlash(url).replace(/\/api$/i, '');
}

/** Worker origin without a trailing `/api` suffix. */
export const getApiOrigin = () => {
  const envUrl = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL;
  if (envUrl) return stripApiSuffix(envUrl);
  return stripApiSuffix(currentConfig.apiUrl || currentConfig.workerUrl || 'http://localhost:8787');
};

/** Canonical API base, always ending in `/api`. */
export const getApiUrl = () => `${getApiOrigin()}/api`;

/**
 * Join a path onto the API base without doubling `/api`.
 * Accepts `liquidity/pools`, `/liquidity/pools`, or `/api/liquidity/pools`.
 */
export const apiPath = (path = '') => {
  const cleaned = String(path || '').replace(/^\/+/, '').replace(/^api\//i, '');
  return cleaned ? `${getApiUrl()}/${cleaned}` : getApiUrl();
};

export const isDevelopment = () => getEnvironment() === 'development';

export const isProduction = () => getEnvironment() === 'production';

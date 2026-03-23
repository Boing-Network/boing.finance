// Developer Tools Component
// Provides API documentation, rate limit info, and developer resources

import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import config from '../config';

const DeveloperTools = () => {
  const [activeTab, setActiveTab] = useState('api');

  const apiEndpoints = [
    {
      method: 'GET',
      path: '/api/health',
      description: 'Health check endpoint',
      response: {
        status: 'OK',
        message: 'DEX API is running on Cloudflare Workers',
        timestamp: '2025-01-28T12:00:00.000Z',
        environment: 'production'
      }
    },
    {
      method: 'GET',
      path: '/api/tokens',
      description: 'Get list of tokens',
      queryParams: [
        { name: 'chainId', type: 'number', required: false, description: 'Filter by chain ID' },
        { name: 'limit', type: 'number', required: false, description: 'Limit results (default: 50)' },
        { name: 'offset', type: 'number', required: false, description: 'Offset for pagination' }
      ],
      response: {
        data: [],
        total: 0,
        limit: 50,
        offset: 0
      }
    },
    {
      method: 'POST',
      path: '/api/r2/upload',
      description: 'Upload file to R2 storage',
      body: {
        file: 'File (multipart/form-data)',
        metadata: 'Object (optional)'
      },
      response: {
        success: true,
        fileUrl: 'https://pub-fdf80a26d0d54acd86aa835377381ea3.r2.dev/filename.png',
        metadataUrl: 'https://pub-fdf80a26d0d54acd86aa835377381ea3.r2.dev/metadata.json'
      }
    },
    {
      method: 'GET',
      path: '/api/analytics',
      description: 'Get analytics data',
      queryParams: [
        { name: 'range', type: 'string', required: false, description: 'Time range: 24h, 7d, 30d, all' }
      ],
      response: {
        data: {
          totalDeployments: 0,
          activeUsers: 0,
          totalVolume: 0
        }
      }
    }
  ];

  const rateLimits = {
    free: {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000
    },
    authenticated: {
      requestsPerMinute: 120,
      requestsPerHour: 5000,
      requestsPerDay: 50000
    }
  };

  return (
    <>
      <Helmet>
        <title>Developer Tools | boing.finance — API & Docs</title>
        <meta name="description" content="API documentation, rate limits, and developer resources for boing.finance. Build on EVM and Solana." />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Developer Tools
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            API documentation, rate limits, and resources for developers
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b" style={{ borderColor: 'var(--border-color)' }}>
          {['api', 'rate-limits', 'examples', 'sdk'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500'
                  : ''
              }`}
              style={{
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderColor: activeTab === tab ? 'var(--color-primary)' : 'transparent'
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* API Documentation Tab */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            <div className="rounded-lg p-6 border" style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)'
            }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Base URL
              </h2>
              <code className="block p-4 rounded bg-gray-800 text-blue-400">
                {config.apiUrl}
              </code>
            </div>

            {apiEndpoints.map((endpoint, index) => (
              <div
                key={index}
                className="rounded-lg p-6 border"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <span className={`px-3 py-1 rounded text-sm font-semibold ${
                    endpoint.method === 'GET' ? 'bg-green-500/20 text-green-400' :
                    endpoint.method === 'POST' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-lg font-mono" style={{ color: 'var(--text-primary)' }}>
                    {endpoint.path}
                  </code>
                </div>
                <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {endpoint.description}
                </p>

                {endpoint.queryParams && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      Query Parameters:
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ borderColor: 'var(--border-color)' }}>
                            <th className="text-left p-2" style={{ color: 'var(--text-secondary)' }}>Name</th>
                            <th className="text-left p-2" style={{ color: 'var(--text-secondary)' }}>Type</th>
                            <th className="text-left p-2" style={{ color: 'var(--text-secondary)' }}>Required</th>
                            <th className="text-left p-2" style={{ color: 'var(--text-secondary)' }}>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {endpoint.queryParams.map((param, i) => (
                            <tr key={i} style={{ borderColor: 'var(--border-color)' }}>
                              <td className="p-2 font-mono" style={{ color: 'var(--text-primary)' }}>{param.name}</td>
                              <td className="p-2" style={{ color: 'var(--text-secondary)' }}>{param.type}</td>
                              <td className="p-2" style={{ color: 'var(--text-secondary)' }}>
                                {param.required ? 'Yes' : 'No'}
                              </td>
                              <td className="p-2" style={{ color: 'var(--text-secondary)' }}>{param.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {endpoint.body && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      Request Body:
                    </h4>
                    <pre className="p-4 rounded bg-gray-800 overflow-x-auto">
                      <code style={{ color: 'var(--text-secondary)' }}>
                        {JSON.stringify(endpoint.body, null, 2)}
                      </code>
                    </pre>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Example Response:
                  </h4>
                  <pre className="p-4 rounded bg-gray-800 overflow-x-auto">
                    <code style={{ color: 'var(--text-secondary)' }}>
                      {JSON.stringify(endpoint.response, null, 2)}
                    </code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rate Limits Tab */}
        {activeTab === 'rate-limits' && (
          <div className="space-y-6">
            <div className="rounded-lg p-6 border" style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)'
            }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Rate Limits
              </h2>
              <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                Rate limits are applied per IP address. Authenticated requests have higher limits.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(rateLimits).map(([tier, limits]) => (
                  <div
                    key={tier}
                    className="rounded-lg p-6 border"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)'
                    }}
                  >
                    <h3 className="text-xl font-bold mb-4 capitalize" style={{ color: 'var(--text-primary)' }}>
                      {tier} Tier
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-secondary)' }}>Per Minute:</span>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {limits.requestsPerMinute}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-secondary)' }}>Per Hour:</span>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {limits.requestsPerHour.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-secondary)' }}>Per Day:</span>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {limits.requestsPerDay.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded bg-yellow-500/20 border border-yellow-500/30">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <strong>Note:</strong> Rate limit headers are included in all responses:
                  <code className="block mt-2 p-2 bg-gray-800 rounded">
                    X-RateLimit-Limit: 60<br />
                    X-RateLimit-Remaining: 45<br />
                    X-RateLimit-Reset: 1640995200
                  </code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Examples Tab */}
        {activeTab === 'examples' && (
          <div className="space-y-6">
            <div className="rounded-lg p-6 border" style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)'
            }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Code Examples
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    JavaScript/TypeScript
                  </h3>
                  <pre className="p-4 rounded bg-gray-800 overflow-x-auto">
                    <code style={{ color: 'var(--text-secondary)' }}>
{`// Fetch tokens
const response = await fetch('${config.apiUrl}/tokens?chainId=1&limit=10');
const data = await response.json();
console.log(data);

// Upload file
const formData = new FormData();
formData.append('file', fileInput.files[0]);
const uploadResponse = await fetch('${config.apiUrl}/r2/upload', {
  method: 'POST',
  body: formData
});
const uploadData = await uploadResponse.json();
console.log(uploadData);`}
                    </code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    cURL
                  </h3>
                  <pre className="p-4 rounded bg-gray-800 overflow-x-auto">
                    <code style={{ color: 'var(--text-secondary)' }}>
{`# Get tokens
curl "${config.apiUrl}/tokens?chainId=1&limit=10"

# Upload file
curl -X POST "${config.apiUrl}/r2/upload" \\
  -F "file=@/path/to/file.png"`}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SDK Tab */}
        {activeTab === 'sdk' && (
          <div className="space-y-6">
            <div className="rounded-lg p-6 border" style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)'
            }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                SDK & Libraries
              </h2>
              <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                Official SDKs and libraries for integrating with boing.finance API.
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded border" style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)'
                }}>
                  <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    JavaScript SDK (Coming Soon)
                  </h3>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                    npm install @boing-finance/sdk
                  </p>
                  <code className="block p-2 rounded bg-gray-800 text-sm">
                    {`import { BoingSDK } from '@boing-finance/sdk';
const sdk = new BoingSDK({ apiUrl: '${config.apiUrl}' });`}
                  </code>
                </div>

                <div className="p-4 rounded border" style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)'
                }}>
                  <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Python SDK (Coming Soon)
                  </h3>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                    pip install boing-finance-sdk
                  </p>
                  <code className="block p-2 rounded bg-gray-800 text-sm">
                    {`from boing_finance import BoingSDK
sdk = BoingSDK(api_url='${config.apiUrl}')`}
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DeveloperTools;


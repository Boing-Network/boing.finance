import React, { useState } from 'react';

const APISection = () => {
  const [activeTab, setActiveTab] = useState('rest');

  const tabs = [
    { id: 'rest', name: 'REST API', icon: '🔌' },
    { id: 'websocket', name: 'WebSocket', icon: '⚡' },
    { id: 'sdk', name: 'SDK', icon: '📦' },
    { id: 'examples', name: 'Examples', icon: '💡' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">API Reference</h2>
        <p className="style={{ color: 'var(--text-secondary)' }} text-lg">
          Complete API documentation for integrating with boing.finance. Access real-time data, 
          execute trades, and manage liquidity programmatically.
        </p>
      </div>

      {/* API Overview */}
      <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
        <h3 className="text-xl font-semibold style={{ color: 'var(--text-primary)' }} mb-4">API Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">🔌</div>
            <h4 className="text-lg font-medium style={{ color: 'var(--text-primary)' }} mb-2">REST API</h4>
            <p className="style={{ color: 'var(--text-secondary)' }} text-sm">
              HTTP endpoints for data retrieval and transaction submission
            </p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">⚡</div>
            <h4 className="text-lg font-medium style={{ color: 'var(--text-primary)' }} mb-2">WebSocket</h4>
            <p className="style={{ color: 'var(--text-secondary)' }} text-sm">
              Real-time data streams for live updates and notifications
            </p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-2xl mb-2">📦</div>
            <h4 className="text-lg font-medium style={{ color: 'var(--text-primary)' }} mb-2">SDK</h4>
            <p className="style={{ color: 'var(--text-secondary)' }} text-sm">
              JavaScript/TypeScript libraries for easy integration
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-blue-600 style={{ color: 'var(--text-primary)' }}'
                  : 'bg-gray-700 style={{ color: 'var(--text-secondary)' }} hover:style={{ color: 'var(--text-primary)' }} hover:bg-gray-600'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'rest' && <RESTAPIContent />}
        {activeTab === 'websocket' && <WebSocketContent />}
        {activeTab === 'sdk' && <SDKContent />}
        {activeTab === 'examples' && <ExamplesContent />}
      </div>
    </div>
  );
};

const RESTAPIContent = () => (
  <div className="space-y-6">
    <div>
      <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-4">REST API Endpoints</h4>
      <p className="style={{ color: 'var(--text-secondary)' }} mb-4">
        Base URL: <code className="bg-gray-800 px-2 py-1 rounded text-blue-400">https://api.boing.finance/v1</code>
      </p>
    </div>

    {/* Market Data Endpoints */}
    <div className="bg-gray-700 rounded-lg p-4">
      <h5 className="text-md font-medium style={{ color: 'var(--text-primary)' }} mb-3">📊 Market Data</h5>
      <div className="space-y-3">
        <div>
          <code className="text-green-400">GET /pairs</code>
          <p className="style={{ color: 'var(--text-secondary)' }} text-sm mt-1">Get all trading pairs</p>
        </div>
        <div>
          <code className="text-green-400">GET /pairs/{'{pairAddress}'}</code>
          <p className="style={{ color: 'var(--text-secondary)' }} text-sm mt-1">Get specific pair details</p>
        </div>
        <div>
          <code className="text-green-400">GET /pairs/{'{pairAddress}'}/price</code>
          <p className="style={{ color: 'var(--text-secondary)' }} text-sm mt-1">Get current price for a pair</p>
        </div>
        <div>
          <code className="text-green-400">GET /pairs/{'{pairAddress}'}/volume</code>
          <p className="style={{ color: 'var(--text-secondary)' }} text-sm mt-1">Get 24h trading volume</p>
        </div>
      </div>
    </div>

    {/* Liquidity Endpoints */}
    <div className="bg-gray-700 rounded-lg p-4">
      <h5 className="text-md font-medium style={{ color: 'var(--text-primary)' }} mb-3">💧 Liquidity</h5>
      <div className="space-y-3">
        <div>
          <code className="text-green-400">GET /liquidity/pools</code>
          <p className="style={{ color: 'var(--text-secondary)' }} text-sm mt-1">Get all liquidity pools</p>
        </div>
        <div>
          <code className="text-green-400">GET /liquidity/pools/{'{poolAddress}'}</code>
          <p className="style={{ color: 'var(--text-secondary)' }} text-sm mt-1">Get specific pool details</p>
        </div>
        <div>
          <code className="text-green-400">POST /liquidity/add</code>
          <p className="style={{ color: 'var(--text-secondary)' }} text-sm mt-1">Add liquidity to a pool</p>
        </div>
        <div>
          <code className="text-green-400">POST /liquidity/remove</code>
          <p className="style={{ color: 'var(--text-secondary)' }} text-sm mt-1">Remove liquidity from a pool</p>
        </div>
      </div>
    </div>

    {/* Trading Endpoints */}
    <div className="bg-gray-700 rounded-lg p-4">
      <h5 className="text-md font-medium style={{ color: 'var(--text-primary)' }} mb-3">💱 Trading</h5>
      <div className="space-y-3">
        <div>
          <code className="text-green-400">POST /swap/quote</code>
          <p className="style={{ color: 'var(--text-secondary)' }} text-sm mt-1">Get swap quote</p>
        </div>
        <div>
          <code className="text-green-400">POST /swap/execute</code>
          <p className="style={{ color: 'var(--text-secondary)' }} text-sm mt-1">Execute a swap</p>
        </div>
        <div>
          <code className="text-green-400">GET /swap/history/{'{address}'}</code>
          <p className="style={{ color: 'var(--text-secondary)' }} text-sm mt-1">Get swap history for address</p>
        </div>
      </div>
    </div>

    {/* Bridge Endpoints */}
    <div className="bg-gray-700 rounded-lg p-4">
      <h5 className="text-md font-medium style={{ color: 'var(--text-primary)' }} mb-3">🌉 Bridge</h5>
      <div className="space-y-3">
        <div>
          <code className="text-green-400">GET /bridge/status/{'{txHash}'}</code>
          <p className="style={{ color: 'var(--text-secondary)' }} text-sm mt-1">Get bridge transaction status</p>
        </div>
        <div>
          <code className="text-green-400">POST /bridge/initiate</code>
          <p className="style={{ color: 'var(--text-secondary)' }} text-sm mt-1">Initiate cross-chain transfer</p>
        </div>
        <div>
          <code className="text-green-400">GET /bridge/history/{'{address}'}</code>
          <p className="style={{ color: 'var(--text-secondary)' }} text-sm mt-1">Get bridge history for address</p>
        </div>
      </div>
    </div>
  </div>
);

const WebSocketContent = () => (
  <div className="space-y-6">
    <div>
      <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-4">WebSocket API</h4>
      <p className="style={{ color: 'var(--text-secondary)' }} mb-4">
        WebSocket URL: <code className="bg-gray-800 px-2 py-1 rounded text-blue-400">wss://api.boing.finance/ws</code>
      </p>
    </div>

    <div className="bg-gray-700 rounded-lg p-4">
      <h5 className="text-md font-medium style={{ color: 'var(--text-primary)' }} mb-3">📡 Real-time Events</h5>
      <div className="space-y-3">
        <div>
          <code className="text-yellow-400">price_update</code>
          <p className="style={{ color: 'var(--text-secondary)' }} text-sm mt-1">Real-time price updates for trading pairs</p>
        </div>
        <div>
          <code className="text-yellow-400">swap_executed</code>
          <p className="style={{ color: 'var(--text-secondary)' }} text-sm mt-1">New swap transaction notifications</p>
        </div>
        <div>
          <code className="text-yellow-400">liquidity_change</code>
          <p className="style={{ color: 'var(--text-secondary)' }} text-sm mt-1">Liquidity pool updates</p>
        </div>
        <div>
          <code className="text-yellow-400">bridge_status</code>
          <p className="style={{ color: 'var(--text-secondary)' }} text-sm mt-1">Cross-chain bridge status updates</p>
        </div>
      </div>
    </div>

    <div className="bg-gray-700 rounded-lg p-4">
      <h5 className="text-md font-medium style={{ color: 'var(--text-primary)' }} mb-3">🔌 Connection Example</h5>
      <pre className="bg-gray-800 p-4 rounded text-sm style={{ color: 'var(--text-secondary)' }} overflow-x-auto">
{`const ws = new WebSocket('wss://api.boing.finance/ws');

ws.onopen = () => {
  // Subscribe to price updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'price_update',
    pair: '0x...'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};`}
      </pre>
    </div>
  </div>
);

const SDKContent = () => (
  <div className="space-y-6">
    <div>
      <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-4">JavaScript SDK</h4>
      <p className="style={{ color: 'var(--text-secondary)' }} mb-4">
        Install: <code className="bg-gray-800 px-2 py-1 rounded text-blue-400">npm install @boing-finance/sdk</code>
      </p>
    </div>

    <div className="bg-gray-700 rounded-lg p-4">
      <h5 className="text-md font-medium style={{ color: 'var(--text-primary)' }} mb-3">🚀 Quick Start</h5>
      <pre className="bg-gray-800 p-4 rounded text-sm style={{ color: 'var(--text-secondary)' }} overflow-x-auto">
{`import { BoingFinance } from '@boing-finance/sdk';

const boing = new BoingFinance({
  network: 'ethereum',
  rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY'
});

// Get all pairs
const pairs = await boing.getPairs();

// Get swap quote
const quote = await boing.getSwapQuote({
  tokenIn: '0x...',
  tokenOut: '0x...',
  amountIn: '1000000000000000000'
});`}
      </pre>
    </div>

    <div className="bg-gray-700 rounded-lg p-4">
      <h5 className="text-md font-medium style={{ color: 'var(--text-primary)' }} mb-3">📦 SDK Features</h5>
      <ul className="space-y-2 style={{ color: 'var(--text-secondary)' }}">
        <li>• <strong>TypeScript Support:</strong> Full type definitions</li>
        <li>• <strong>Multi-Network:</strong> Support for all supported networks</li>
        <li>• <strong>Wallet Integration:</strong> Easy wallet connection</li>
        <li>• <strong>Gas Estimation:</strong> Automatic gas cost calculation</li>
        <li>• <strong>Error Handling:</strong> Comprehensive error management</li>
        <li>• <strong>Event Streaming:</strong> Real-time data subscriptions</li>
      </ul>
    </div>
  </div>
);

const ExamplesContent = () => (
  <div className="space-y-6">
    <div>
      <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-4">Code Examples</h4>
      <p className="style={{ color: 'var(--text-secondary)' }} mb-4">
        Practical examples for common use cases and integrations.
      </p>
    </div>

    <div className="bg-gray-700 rounded-lg p-4">
      <h5 className="text-md font-medium style={{ color: 'var(--text-primary)' }} mb-3">💱 Swap Example</h5>
      <pre className="bg-gray-800 p-4 rounded text-sm style={{ color: 'var(--text-secondary)' }} overflow-x-auto">
{`// Get swap quote
const response = await fetch('https://api.boing.finance/v1/swap/quote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tokenIn: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C',
    tokenOut: '0xB0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C',
    amountIn: '1000000000000000000',
    slippage: 0.5
  })
});

const quote = await response.json();
console.log('Swap quote:', quote);`}
      </pre>
    </div>

    <div className="bg-gray-700 rounded-lg p-4">
      <h5 className="text-md font-medium style={{ color: 'var(--text-primary)' }} mb-3">💧 Add Liquidity Example</h5>
      <pre className="bg-gray-800 p-4 rounded text-sm style={{ color: 'var(--text-secondary)' }} overflow-x-auto">
{`// Add liquidity to pool
const response = await fetch('https://api.boing.finance/v1/liquidity/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tokenA: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C',
    tokenB: '0xB0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C',
    amountA: '1000000000000000000',
    amountB: '2000000000000000000',
    slippage: 0.5
  })
});

const result = await response.json();
console.log('Liquidity added:', result);`}
      </pre>
    </div>

    <div className="bg-gray-700 rounded-lg p-4">
      <h5 className="text-md font-medium style={{ color: 'var(--text-primary)' }} mb-3">🌉 Bridge Example</h5>
      <pre className="bg-gray-800 p-4 rounded text-sm style={{ color: 'var(--text-secondary)' }} overflow-x-auto">
{`// Initiate cross-chain transfer
const response = await fetch('https://api.boing.finance/v1/bridge/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C',
    amount: '1000000000000000000',
    fromChain: 'ethereum',
    toChain: 'polygon',
    recipient: '0x...'
  })
});

const bridge = await response.json();
console.log('Bridge initiated:', bridge);`}
      </pre>
    </div>
  </div>
);

export default APISection; 
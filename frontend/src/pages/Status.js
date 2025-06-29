import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const Status = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Mock status data - in a real app, this would come from an API
  const systemStatus = {
    overall: 'operational',
    uptime: '99.98%',
    lastIncident: '2024-12-15',
    responseTime: '120ms'
  };

  const services = [
    {
      name: 'Trading Platform',
      status: 'operational',
      uptime: '99.99%',
      responseTime: '85ms',
      description: 'Core DEX functionality and token swaps'
    },
    {
      name: 'Cross-Chain Bridge',
      status: 'operational',
      uptime: '99.95%',
      responseTime: '150ms',
      description: 'Asset transfers between blockchains'
    },
    {
      name: 'Liquidity Pools',
      status: 'operational',
      uptime: '99.97%',
      responseTime: '95ms',
      description: 'Automated market maker pools'
    },
    {
      name: 'Analytics Dashboard',
      status: 'operational',
      uptime: '99.90%',
      responseTime: '200ms',
      description: 'Market data and portfolio analytics'
    },
    {
      name: 'Token Deployment',
      status: 'operational',
      uptime: '99.92%',
      responseTime: '180ms',
      description: 'ERC20 token creation and deployment'
    },
    {
      name: 'API Services',
      status: 'operational',
      uptime: '99.96%',
      responseTime: '110ms',
      description: 'REST API and WebSocket connections'
    }
  ];

  const networks = [
    {
      name: 'Ethereum Mainnet',
      status: 'operational',
      blockHeight: '18,456,789',
      gasPrice: '15 Gwei',
      lastBlock: '2 seconds ago'
    },
    {
      name: 'Polygon',
      status: 'operational',
      blockHeight: '45,678,901',
      gasPrice: '30 Gwei',
      lastBlock: '1 second ago'
    },
    {
      name: 'Arbitrum One',
      status: 'operational',
      blockHeight: '12,345,678',
      gasPrice: '0.1 Gwei',
      lastBlock: '3 seconds ago'
    },
    {
      name: 'Optimism',
      status: 'operational',
      blockHeight: '8,901,234',
      gasPrice: '0.05 Gwei',
      lastBlock: '2 seconds ago'
    }
  ];

  const recentIncidents = [
    {
      id: 1,
      date: '2024-12-15',
      time: '14:30 UTC',
      title: 'Scheduled Maintenance - Bridge Protocol',
      status: 'resolved',
      description: 'Routine maintenance on cross-chain bridge infrastructure. All services restored within 30 minutes.',
      impact: 'minor',
      duration: '30 minutes'
    },
    {
      id: 2,
      date: '2024-12-10',
      time: '09:15 UTC',
      title: 'High Network Congestion - Ethereum',
      status: 'resolved',
      description: 'Increased gas fees and slower transaction processing due to network congestion. Normal operations resumed.',
      impact: 'minor',
      duration: '2 hours'
    },
    {
      id: 3,
      date: '2024-12-05',
      time: '16:45 UTC',
      title: 'API Rate Limiting Adjustment',
      status: 'resolved',
      description: 'Temporary API rate limiting to ensure optimal performance for all users.',
      impact: 'minor',
      duration: '1 hour'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
        return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'degraded':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'outage':
        return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'maintenance':
        return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
      default:
        return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
        return '🟢';
      case 'degraded':
        return '🟡';
      case 'outage':
        return '🔴';
      case 'maintenance':
        return '🔵';
      default:
        return '⚪';
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'major':
        return 'text-red-400';
      case 'minor':
        return 'text-yellow-400';
      case 'none':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <>
      <Helmet>
        <title>System Status - boing.finance</title>
        <meta name="description" content="Check the current status of boing.finance services, uptime, and incident history for our cross-chain decentralized exchange platform." />
        <meta name="keywords" content="system status, uptime, incidents, monitoring, boing.finance, DEX" />
        <meta property="og:title" content="System Status - boing.finance" />
        <meta property="og:description" content="Check the current status of boing.finance services and uptime monitoring." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/status" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="System Status - boing.finance" />
        <meta name="twitter:description" content="System status and uptime monitoring for boing.finance." />
      </Helmet>
      
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                System Status
              </h1>
              <p className="text-xl text-gray-300 mb-6">
                Real-time status of boing.finance services and infrastructure
              </p>
              <div className="flex justify-center items-center space-x-4 text-sm text-gray-400">
                <span>Last updated: {lastUpdated.toLocaleString()}</span>
                <span>•</span>
                <span>Current time: {currentTime.toLocaleString()}</span>
              </div>
            </div>

            {/* Overall Status */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Overall System Status</h2>
                <div className={`px-4 py-2 rounded-lg border ${getStatusColor(systemStatus.overall)}`}>
                  <span className="flex items-center space-x-2">
                    <span>{getStatusIcon(systemStatus.overall)}</span>
                    <span className="capitalize font-semibold">{systemStatus.overall}</span>
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">{systemStatus.uptime}</div>
                  <div className="text-gray-300 text-sm">Uptime (30 days)</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">{systemStatus.responseTime}</div>
                  <div className="text-gray-300 text-sm">Avg Response Time</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-1">{systemStatus.lastIncident}</div>
                  <div className="text-gray-300 text-sm">Last Incident</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">6/6</div>
                  <div className="text-gray-300 text-sm">Services Operational</div>
                </div>
              </div>
            </div>

            {/* Services Status */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Service Status</h2>
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.name} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{getStatusIcon(service.status)}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                        <p className="text-gray-300 text-sm">{service.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(service.status)}`}>
                        {service.status}
                      </div>
                      <div className="text-gray-300 text-sm mt-1">{service.uptime} uptime</div>
                      <div className="text-gray-400 text-xs">{service.responseTime} avg</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Network Status */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Supported Networks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {networks.map((network) => (
                  <div key={network.name} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white">{network.name}</h3>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(network.status)}`}>
                        {getStatusIcon(network.status)} {network.status}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Block Height:</span>
                        <span className="text-white">{network.blockHeight}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Gas Price:</span>
                        <span className="text-white">{network.gasPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Last Block:</span>
                        <span className="text-white">{network.lastBlock}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Incidents */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Recent Incidents</h2>
              <div className="space-y-4">
                {recentIncidents.map((incident) => (
                  <div key={incident.id} className="border border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{incident.title}</h3>
                        <p className="text-gray-400 text-sm">
                          {incident.date} at {incident.time} • Duration: {incident.duration}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                          {incident.status}
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(incident.impact)} bg-gray-700`}>
                          {incident.impact} impact
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm">{incident.description}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <a
                  href="https://status.boing.finance"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  View detailed incident history →
                </a>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Performance Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Response Times</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">P50:</span>
                      <span className="text-white">85ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">P95:</span>
                      <span className="text-white">150ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">P99:</span>
                      <span className="text-white">250ms</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Error Rates</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">4xx Errors:</span>
                      <span className="text-red-400">0.02%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">5xx Errors:</span>
                      <span className="text-red-400">0.001%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Success Rate:</span>
                      <span className="text-green-400">99.98%</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Throughput</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Requests/sec:</span>
                      <span className="text-white">1,250</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Transactions/sec:</span>
                      <span className="text-white">850</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Active Users:</span>
                      <span className="text-white">2,450</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscribe to Updates */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Stay Updated</h2>
                <p className="text-gray-300 mb-6">
                  Get notified about service updates, maintenance, and incidents
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="https://twitter.com/boing_finance"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Follow on Twitter
                  </a>
                  <a
                    href="https://discord.gg/7RDtQtQvBW"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Join Discord
                  </a>
                  <a
                    href="https://t.me/boing_finance"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Telegram Updates
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Status; 
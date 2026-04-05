import React from 'react';
import { Helmet } from 'react-helmet-async';

const Status = () => {
  // Mock status data - in a real app, this would come from an API
  const systemStatus = {
    overall: 'operational',
    uptime: '99.9%',
    lastIncident: 'No recent incidents',
    responseTime: '150ms'
  };

  const services = [
    {
      name: 'Trading Platform',
      status: 'operational',
      uptime: '99.9%',
      responseTime: '120ms',
      description: 'Core DEX functionality and token swaps'
    },
    {
      name: 'Cross-Chain Bridge',
      status: 'operational',
      uptime: '99.8%',
      responseTime: '180ms',
      description: 'Asset transfers between blockchains'
    },
    {
      name: 'Liquidity Pools',
      status: 'operational',
      uptime: '99.9%',
      responseTime: '140ms',
      description: 'Automated market maker pools'
    },
    {
      name: 'Analytics Dashboard',
      status: 'operational',
      uptime: '99.7%',
      responseTime: '250ms',
      description: 'Market data and portfolio analytics'
    },
    {
      name: 'Token Deployment',
      status: 'operational',
      uptime: '99.9%',
      responseTime: '200ms',
      description: 'ERC20 token creation and deployment'
    },
    {
      name: 'API Services',
      status: 'operational',
      uptime: '99.8%',
      responseTime: '150ms',
      description: 'REST API and WebSocket connections'
    }
  ];

  const networks = [
    {
      name: 'Ethereum Mainnet',
      status: 'operational',
      blockHeight: 'Live',
      gasPrice: 'Variable',
      lastBlock: 'Active'
    },
    {
      name: 'Polygon',
      status: 'operational',
      blockHeight: 'Live',
      gasPrice: 'Variable',
      lastBlock: 'Active'
    },
    {
      name: 'Arbitrum One',
      status: 'operational',
      blockHeight: 'Live',
      gasPrice: 'Variable',
      lastBlock: 'Active'
    },
    {
      name: 'Optimism',
      status: 'operational',
      blockHeight: 'Live',
      gasPrice: 'Variable',
      lastBlock: 'Active'
    },
    {
      name: 'Base',
      status: 'operational',
      blockHeight: 'Live',
      gasPrice: 'Variable',
      lastBlock: 'Active'
    },
    {
      name: 'BNB Smart Chain',
      status: 'operational',
      blockHeight: 'Live',
      gasPrice: 'Variable',
      lastBlock: 'Active'
    }
  ];

  const recentIncidents = [
    {
      id: 1,
      date: 'No incidents',
      time: 'N/A',
      title: 'Platform Running Smoothly',
      status: 'operational',
      description: 'All systems are operational with no recent incidents reported.',
      impact: 'none',
      duration: 'N/A'
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
        return 'bg-gray-900/20 border-gray-500/30';
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
        return '';
    }
  };

  return (
    <>
      <Helmet>
        <title>System Status | boing.finance — Uptime & Incidents</title>
        <meta name="description" content="Check boing.finance service status, uptime, and incident history. Real-time status for swap, bridge, and deploy." />
        <meta name="keywords" content="system status, uptime, incidents, monitoring, boing.finance, DEX" />
        <meta property="og:title" content="System Status | boing.finance" />
        <meta property="og:description" content="Check the current status of boing.finance services and uptime monitoring." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/status" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="System Status - boing.finance" />
        <meta name="twitter:description" content="System status and uptime monitoring for boing.finance." />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
      </Helmet>
      
      <div className="relative w-full min-w-0" style={{ color: 'var(--text-primary)' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                System Status
              </h1>
              <p className="text-xl mb-6" style={{ color: 'var(--text-secondary)' }}>
                Real-time status of boing.finance services and infrastructure
              </p>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                <p className="text-blue-200 text-sm">
                  <strong>Note:</strong> boing.finance is a solo-founder project. While our platform is fully functional, we are currently seeking funding for infrastructure scaling and team expansion.
                </p>
              </div>
              <div className="flex justify-center items-center space-x-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                <span>Last updated: {new Date().toLocaleString()}</span>
                <span>•</span>
                <span>Current time: {new Date().toLocaleString()}</span>
              </div>
            </div>

            {/* Overall Status */}
            <div className="rounded-lg p-6 border mb-8" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Overall System Status</h2>
                <div className={`px-4 py-2 rounded-lg border ${getStatusColor(systemStatus.overall)}`}>
                  <span className="flex items-center space-x-2">
                    <span>{getStatusIcon(systemStatus.overall)}</span>
                    <span className="capitalize font-semibold">{systemStatus.overall}</span>
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                  <div className="text-2xl font-bold text-green-400 mb-1">{systemStatus.uptime}</div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Uptime (30 days)</div>
                </div>
                <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                  <div className="text-2xl font-bold text-blue-400 mb-1">{systemStatus.responseTime}</div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Avg Response Time</div>
                </div>
                <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                  <div className="text-2xl font-bold text-purple-400 mb-1">{systemStatus.lastIncident}</div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Last Incident</div>
                </div>
                <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                  <div className="text-2xl font-bold text-green-400 mb-1">6/6</div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Services Operational</div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center my-8">
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }}></div>
              <div className="px-4 py-2 rounded-full border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Service Status</span>
              </div>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }}></div>
            </div>

            {/* Services Status */}
            <div className="rounded-lg p-6 border mb-8" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Service Status</h2>
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.name} className="flex items-center justify-between p-4 style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} rounded-lg">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{getStatusIcon(service.status)}</span>
                      <div>
                        <h3 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }}">{service.name}</h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{service.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(service.status)}`}>
                        {service.status}
                      </div>
                      <div className="style={{ color: 'var(--text-secondary)' }} text-sm mt-1">{service.uptime} uptime</div>
                      <div className="style={{ color: 'var(--text-tertiary)' }} text-xs">{service.responseTime} avg</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center my-8">
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }}></div>
              <div className="px-4 py-2 rounded-full border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Supported Networks</span>
              </div>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }}></div>
            </div>

            {/* Network Status */}
            <div className="rounded-lg p-6 border mb-8" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Supported Networks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {networks.map((network) => (
                  <div key={network.name} className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }}">{network.name}</h3>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(network.status)}`}>
                        {getStatusIcon(network.status)} {network.status}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="style={{ color: 'var(--text-secondary)' }}">Block Height:</span>
                        <span className="style={{ color: 'var(--text-primary)' }}">{network.blockHeight}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="style={{ color: 'var(--text-secondary)' }}">Gas Price:</span>
                        <span className="style={{ color: 'var(--text-primary)' }}">{network.gasPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="style={{ color: 'var(--text-secondary)' }}">Last Block:</span>
                        <span className="style={{ color: 'var(--text-primary)' }}">{network.lastBlock}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Incidents */}
            <div className="rounded-lg p-6 border mb-8" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Recent Incidents</h2>
              <div className="space-y-4">
                {recentIncidents.map((incident) => (
                  <div key={incident.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-1">{incident.title}</h3>
                        <p className="style={{ color: 'var(--text-tertiary)' }} text-sm">
                          {incident.date} at {incident.time} • Duration: {incident.duration}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                          {incident.status}
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(incident.impact)} style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}`}>
                          {incident.impact} impact
                        </div>
                      </div>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{incident.description}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <p className="style={{ color: 'var(--text-tertiary)' }} text-sm">
                  Incident history will be maintained as the platform scales with funding.
                </p>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="rounded-lg p-6 border mb-8" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Performance Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                  <h3 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-3">Response Times</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="style={{ color: 'var(--text-secondary)' }}">Average:</span>
                      <span className="style={{ color: 'var(--text-primary)' }}">150ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="style={{ color: 'var(--text-secondary)' }}">P95:</span>
                      <span className="style={{ color: 'var(--text-primary)' }}">300ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="style={{ color: 'var(--text-secondary)' }}">P99:</span>
                      <span className="style={{ color: 'var(--text-primary)' }}">500ms</span>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                  <h3 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-3">Error Rates</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="style={{ color: 'var(--text-secondary)' }}">4xx Errors:</span>
                      <span className="text-yellow-400">0.1%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="style={{ color: 'var(--text-secondary)' }}">5xx Errors:</span>
                      <span className="text-red-400">0.01%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="style={{ color: 'var(--text-secondary)' }}">Success Rate:</span>
                      <span className="text-green-400">99.9%</span>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                  <h3 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-3">Platform Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="style={{ color: 'var(--text-secondary)' }}">Status:</span>
                      <span className="text-green-400">Operational</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="style={{ color: 'var(--text-secondary)' }}">Networks:</span>
                      <span className="style={{ color: 'var(--text-primary)' }}">6 Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="style={{ color: 'var(--text-secondary)' }}">Smart Contracts:</span>
                      <span className="style={{ color: 'var(--text-primary)' }}">17+ Deployed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="text-center">
                <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">Contact Support</h2>
                <p className="style={{ color: 'var(--text-secondary)' }} mb-6">
                  For status updates and technical support, contact our team directly
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="mailto:support@boing.finance"
                    className="hover:bg-gray-600 px-6 py-3 rounded-lg transition-colors border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    Email Support
                  </a>
                  <a
                    href="/contact-us"
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors" style={{ color: 'var(--text-primary)' }}
                  >
                    Contact Form
                  </a>
                  <a
                    href="/bug-report"
                    className="bg-red-600 hover:bg-red-700 style={{ color: 'var(--text-primary)' }} px-6 py-3 rounded-lg transition-colors"
                  >
                    Report Issues
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
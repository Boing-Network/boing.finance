import React from 'react';

const PortfolioSection = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold style={{ color: 'var(--text-primary)' }} mb-6">Portfolio Management Guide</h2>
        <p className="style={{ color: 'var(--text-secondary)' }} text-lg leading-relaxed mb-8">
          Manage your entire DeFi portfolio across multiple blockchain networks from a single interface. 
          Track performance, analyze positions, and optimize your investments with comprehensive portfolio tools.
        </p>
      </div>

      {/* Portfolio Overview */}
      <div>
        <h3 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-6">Portfolio Overview</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
            <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-4">Total Portfolio Value</h4>
            <ul className="space-y-2 style={{ color: 'var(--text-secondary)' }}">
              <li>• Real-time valuation across all networks</li>
              <li>• USD equivalent calculations</li>
              <li>• Historical value tracking</li>
              <li>• Performance over time</li>
              <li>• Cross-chain aggregation</li>
            </ul>
          </div>

          <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
            <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-4">Asset Distribution</h4>
            <ul className="space-y-2 style={{ color: 'var(--text-secondary)' }}">
              <li>• Token allocation percentages</li>
              <li>• Network distribution</li>
              <li>• Risk assessment</li>
              <li>• Diversification metrics</li>
              <li>• Rebalancing suggestions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Cross-Chain Portfolio */}
      <div>
        <h3 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-6">Cross-Chain Portfolio Management</h3>
        <div className="space-y-6">
          <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
            <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-4">Multi-Network Support</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h5 className="style={{ color: 'var(--text-primary)' }} font-semibold mb-2">Supported Networks:</h5>
                <ul className="space-y-1 style={{ color: 'var(--text-secondary)' }} text-sm">
                  <li>• Ethereum and Layer 2s</li>
                  <li>• Polygon and BSC</li>
                  <li>• Arbitrum and Optimism</li>
                  <li>• Base, Linea, and more</li>
                  <li>• Cross-chain bridge tracking</li>
                </ul>
              </div>
              
              <div>
                <h5 className="style={{ color: 'var(--text-primary)' }} font-semibold mb-2">Unified View:</h5>
                <ul className="space-y-1 style={{ color: 'var(--text-secondary)' }} text-sm">
                  <li>• Single dashboard for all assets</li>
                  <li>• Network-specific breakdowns</li>
                  <li>• Cross-chain transfer history</li>
                  <li>• Bridge transaction tracking</li>
                  <li>• Gas fee optimization</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Tracking */}
      <div>
        <h3 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-6">Performance Tracking</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
            <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-4">Returns Analysis</h4>
            <ul className="space-y-2 style={{ color: 'var(--text-secondary)' }}">
              <li>• Total return calculation</li>
              <li>• Time-weighted returns</li>
              <li>• Risk-adjusted metrics</li>
              <li>• Benchmark comparisons</li>
              <li>• Performance attribution</li>
            </ul>
          </div>

          <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
            <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-4">Risk Metrics</h4>
            <ul className="space-y-2 style={{ color: 'var(--text-secondary)' }}">
              <li>• Portfolio volatility</li>
              <li>• Value at Risk (VaR)</li>
              <li>• Maximum drawdown</li>
              <li>• Sharpe ratio</li>
              <li>• Correlation analysis</li>
            </ul>
          </div>

          <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
            <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-4">Trading Activity</h4>
            <ul className="space-y-2 style={{ color: 'var(--text-secondary)' }}">
              <li>• Trade frequency analysis</li>
              <li>• Win/loss ratio</li>
              <li>• Average trade size</li>
              <li>• Gas cost tracking</li>
              <li>• Slippage analysis</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Asset Management */}
      <div>
        <h3 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-6">Asset Management</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
            <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-4">Token Holdings</h4>
            <ul className="space-y-2 style={{ color: 'var(--text-secondary)' }}">
              <li>• Real-time balance tracking</li>
              <li>• Token price monitoring</li>
              <li>• Unrealized P&L calculation</li>
              <li>• Cost basis tracking</li>
              <li>• Token performance history</li>
            </ul>
          </div>

          <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
            <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-4">Liquidity Positions</h4>
            <ul className="space-y-2 style={{ color: 'var(--text-secondary)' }}">
              <li>• LP token tracking</li>
              <li>• Fee earnings monitoring</li>
              <li>• Impermanent loss calculation</li>
              <li>• Pool share percentages</li>
              <li>• Liquidity optimization</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Portfolio Analytics */}
      <div>
        <h3 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-6">Advanced Portfolio Analytics</h3>
        <div className="space-y-6">
          <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
            <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-4">Asset Allocation Analysis</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h5 className="style={{ color: 'var(--text-primary)' }} font-semibold mb-2">Allocation Metrics:</h5>
                <ul className="space-y-1 style={{ color: 'var(--text-secondary)' }} text-sm">
                  <li>• Token concentration analysis</li>
                  <li>• Network diversification</li>
                  <li>• Sector allocation</li>
                  <li>• Risk concentration</li>
                  <li>• Rebalancing opportunities</li>
                </ul>
              </div>
              
              <div>
                <h5 className="style={{ color: 'var(--text-primary)' }} font-semibold mb-2">Optimization Tools:</h5>
                <ul className="space-y-1 style={{ color: 'var(--text-secondary)' }} text-sm">
                  <li>• Target allocation suggestions</li>
                  <li>• Risk-return optimization</li>
                  <li>• Tax-loss harvesting</li>
                  <li>• Yield optimization</li>
                  <li>• Cross-chain arbitrage</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h3 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-6">Transaction History & Reporting</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
            <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-4">Transaction Tracking</h4>
            <ul className="space-y-2 style={{ color: 'var(--text-secondary)' }}">
              <li>• Complete transaction history</li>
              <li>• Cross-chain transfer logs</li>
              <li>• Gas fee tracking</li>
              <li>• Slippage recording</li>
              <li>• Transaction categorization</li>
            </ul>
          </div>

          <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
            <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-4">Reporting Tools</h4>
            <ul className="space-y-2 style={{ color: 'var(--text-secondary)' }}">
              <li>• Tax reporting exports</li>
              <li>• Performance reports</li>
              <li>• Custom date ranges</li>
              <li>• CSV/PDF exports</li>
              <li>• Automated reporting</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Portfolio Alerts */}
      <div>
        <h3 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-6">Portfolio Alerts & Notifications</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
            <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-4">Price Alerts</h4>
            <ul className="space-y-2 style={{ color: 'var(--text-secondary)' }}">
              <li>• Token price thresholds</li>
              <li>• Portfolio value alerts</li>
              <li>• Percentage change notifications</li>
              <li>• Cross-chain price differences</li>
              <li>• Arbitrage opportunities</li>
            </ul>
          </div>

          <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
            <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-4">Risk Alerts</h4>
            <ul className="space-y-2 style={{ color: 'var(--text-secondary)' }}">
              <li>• High volatility warnings</li>
              <li>• Concentration alerts</li>
              <li>• Impermanent loss notifications</li>
              <li>• Gas fee spikes</li>
              <li>• Network congestion alerts</li>
            </ul>
          </div>

          <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
            <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-4">Performance Alerts</h4>
            <ul className="space-y-2 style={{ color: 'var(--text-secondary)' }}">
              <li>• Milestone achievements</li>
              <li>• Performance benchmarks</li>
              <li>• Rebalancing reminders</li>
              <li>• Fee collection alerts</li>
              <li>• Bridge completion notifications</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Portfolio Optimization */}
      <div>
        <h3 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-6">Portfolio Optimization</h3>
        <div className="space-y-6">
          <div className="style={{ backgroundColor: 'var(--bg-card)' }} rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}">
            <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-4">Optimization Strategies</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h5 className="style={{ color: 'var(--text-primary)' }} font-semibold mb-2">Risk Management:</h5>
                <ul className="space-y-1 style={{ color: 'var(--text-secondary)' }} text-sm">
                  <li>• Diversification recommendations</li>
                  <li>• Risk-adjusted positioning</li>
                  <li>• Stop-loss strategies</li>
                  <li>• Hedging opportunities</li>
                  <li>• Volatility management</li>
                </ul>
              </div>
              
              <div>
                <h5 className="style={{ color: 'var(--text-primary)' }} font-semibold mb-2">Yield Optimization:</h5>
                <ul className="space-y-1 style={{ color: 'var(--text-secondary)' }} text-sm">
                  <li>• Liquidity provision optimization</li>
                  <li>• Yield farming strategies</li>
                  <li>• Cross-chain yield opportunities</li>
                  <li>• Gas fee optimization</li>
                  <li>• Compound interest strategies</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold style={{ color: 'var(--text-primary)' }} mb-4">💡 Portfolio Best Practices</h4>
            <ul className="space-y-2 style={{ color: 'var(--text-secondary)' }}">
              <li>• Diversify across multiple networks and tokens</li>
              <li>• Regularly rebalance your portfolio</li>
              <li>• Monitor impermanent loss in liquidity positions</li>
              <li>• Keep some assets in stablecoins for opportunities</li>
              <li>• Track all transactions for tax purposes</li>
              <li>• Set up alerts for important price movements</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSection; 
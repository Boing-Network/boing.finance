import React from 'react';

const AnalyticsSection = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-6">Analytics & Data Guide</h2>
        <p className="text-gray-300 text-lg leading-relaxed mb-8">
          Explore comprehensive market data, trading analytics, and performance metrics on mochi. 
          Our analytics dashboard provides real-time insights to help you make informed trading decisions.
        </p>
      </div>

      {/* Market Overview */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6">Market Overview</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Global Metrics</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Total Value Locked (TVL) across networks</li>
              <li>• 24-hour trading volume</li>
              <li>• Number of active trading pairs</li>
              <li>• Cross-chain bridge volume</li>
              <li>• User activity and transactions</li>
            </ul>
          </div>

          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Network Performance</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Network-specific trading volume</li>
              <li>• Gas fee trends and optimization</li>
              <li>• Transaction success rates</li>
              <li>• Network congestion status</li>
              <li>• Cross-chain transfer metrics</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Price Charts */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6">Price Charts & Technical Analysis</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Chart Types</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Candlestick charts</li>
              <li>• Line charts</li>
              <li>• Volume analysis</li>
              <li>• Price action patterns</li>
              <li>• Cross-chain price comparison</li>
            </ul>
          </div>

          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Timeframes</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• 1 minute to 1 day</li>
              <li>• Real-time updates</li>
              <li>• Historical data</li>
              <li>• Custom date ranges</li>
              <li>• Time zone support</li>
            </ul>
          </div>

          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Indicators</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Moving averages</li>
              <li>• RSI and MACD</li>
              <li>• Bollinger Bands</li>
              <li>• Volume indicators</li>
              <li>• Custom indicators</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Trading Analytics */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6">Trading Analytics</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Performance Metrics</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Win/loss ratio</li>
              <li>• Average trade size</li>
              <li>• Total profit/loss</li>
              <li>• Best performing pairs</li>
              <li>• Trading frequency analysis</li>
            </ul>
          </div>

          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Risk Analysis</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Slippage analysis</li>
              <li>• Price impact tracking</li>
              <li>• Gas cost optimization</li>
              <li>• Impermanent loss monitoring</li>
              <li>• Portfolio risk assessment</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Liquidity Analytics */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6">Liquidity Analytics</h3>
        <div className="space-y-6">
          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Pool Analysis</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-white font-semibold mb-2">Pool Metrics:</h5>
                <ul className="space-y-1 text-gray-300 text-sm">
                  <li>• Total liquidity depth</li>
                  <li>• Fee earnings over time</li>
                  <li>• Impermanent loss tracking</li>
                  <li>• Pool share percentage</li>
                  <li>• Historical performance</li>
                </ul>
              </div>
              
              <div>
                <h5 className="text-white font-semibold mb-2">Optimization Tools:</h5>
                <ul className="space-y-1 text-gray-300 text-sm">
                  <li>• Optimal liquidity ranges</li>
                  <li>• Fee vs. IL analysis</li>
                  <li>• Rebalancing recommendations</li>
                  <li>• Cross-pool comparisons</li>
                  <li>• Yield optimization</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Trends */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6">Market Trends & Insights</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Trend Analysis</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Trending tokens by volume</li>
              <li>• Price momentum indicators</li>
              <li>• Market sentiment analysis</li>
              <li>• Cross-chain arbitrage opportunities</li>
              <li>• Emerging token detection</li>
            </ul>
          </div>

          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Network Insights</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Network adoption trends</li>
              <li>• Gas fee optimization patterns</li>
              <li>• Cross-chain flow analysis</li>
              <li>• User behavior metrics</li>
              <li>• Protocol comparison data</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Data Export */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6">Data Export & APIs</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">Export Options</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• CSV export for trading history</li>
              <li>• Portfolio performance reports</li>
              <li>• Tax reporting data</li>
              <li>• Custom date range exports</li>
              <li>• Real-time data feeds</li>
            </ul>
          </div>

          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-4">API Access</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• REST API endpoints</li>
              <li>• WebSocket real-time data</li>
              <li>• Rate limiting and quotas</li>
              <li>• Authentication methods</li>
              <li>• Documentation and examples</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Custom Analytics */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6">Custom Analytics</h3>
        <div className="bg-gray-750 rounded-lg p-6 border border-gray-600">
          <h4 className="text-lg font-semibold text-white mb-4">Advanced Features</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-white font-semibold mb-2">Portfolio Analytics:</h5>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li>• Asset allocation analysis</li>
                <li>• Risk-adjusted returns</li>
                <li>• Correlation analysis</li>
                <li>• Rebalancing recommendations</li>
                <li>• Performance benchmarking</li>
              </ul>
            </div>
            
            <div>
              <h5 className="text-white font-semibold mb-2">Trading Insights:</h5>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li>• Trading pattern recognition</li>
                <li>• Optimal timing analysis</li>
                <li>• Slippage optimization</li>
                <li>• Gas fee tracking</li>
                <li>• Cross-chain opportunities</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSection; 
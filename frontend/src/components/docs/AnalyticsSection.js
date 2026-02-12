import React from 'react';

const AnalyticsSection = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Analytics & Data Guide</h2>
        <p className=" text-lg leading-relaxed mb-8"
          style={{ color: 'var(--text-secondary)'  }}>
          Explore comprehensive market data, trading analytics, and performance metrics on boing.finance. 
          Our analytics dashboard provides real-time insights to help you make informed trading decisions.
        </p>
      </div>

      {/* Market Overview */}
      <div>
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Market Overview</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Global Metrics</h4>
            <ul className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
              <li>• Total Value Locked (TVL) across networks</li>
              <li>• 24-hour trading volume</li>
              <li>• Number of active trading pairs</li>
              <li>• Cross-chain bridge volume</li>
              <li>• User activity and transactions</li>
            </ul>
          </div>

          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Network Performance</h4>
            <ul className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
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
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Price Charts & Technical Analysis</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Chart Types</h4>
            <ul className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
              <li>• Candlestick charts</li>
              <li>• Line charts</li>
              <li>• Volume analysis</li>
              <li>• Price action patterns</li>
              <li>• Cross-chain price comparison</li>
            </ul>
          </div>

          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Timeframes</h4>
            <ul className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
              <li>• 1 minute to 1 day</li>
              <li>• Real-time updates</li>
              <li>• Historical data</li>
              <li>• Custom date ranges</li>
              <li>• Time zone support</li>
            </ul>
          </div>

          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Indicators</h4>
            <ul className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
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
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Trading Analytics</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Performance Metrics</h4>
            <ul className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
              <li>• Win/loss ratio</li>
              <li>• Average trade size</li>
              <li>• Total profit/loss</li>
              <li>• Best performing pairs</li>
              <li>• Trading frequency analysis</li>
            </ul>
          </div>

          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Risk Analysis</h4>
            <ul className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
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
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Liquidity Analytics</h3>
        <div className="space-y-6">
          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Pool Analysis</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h5 className=" font-semibold mb-2"
          style={{ color: 'var(--text-primary)'  }}>Pool Metrics:</h5>
                <ul className="space-y-1  text-sm"
          style={{ color: 'var(--text-secondary)'  }}>
                  <li>• Total liquidity depth</li>
                  <li>• Fee earnings over time</li>
                  <li>• Impermanent loss tracking</li>
                  <li>• Pool share percentage</li>
                  <li>• Historical performance</li>
                </ul>
              </div>
              
              <div>
                <h5 className=" font-semibold mb-2"
          style={{ color: 'var(--text-primary)'  }}>Optimization Tools:</h5>
                <ul className="space-y-1  text-sm"
          style={{ color: 'var(--text-secondary)'  }}>
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
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Market Trends & Insights</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Trend Analysis</h4>
            <ul className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
              <li>• Trending tokens by volume</li>
              <li>• Price momentum indicators</li>
              <li>• Market sentiment analysis</li>
              <li>• Cross-chain arbitrage opportunities</li>
              <li>• Emerging token detection</li>
            </ul>
          </div>

          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Network Insights</h4>
            <ul className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
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
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Data Export & APIs</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Export Options</h4>
            <ul className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
              <li>• CSV export for trading history</li>
              <li>• Portfolio performance reports</li>
              <li>• Tax reporting data</li>
              <li>• Custom date range exports</li>
              <li>• Real-time data feeds</li>
            </ul>
          </div>

          <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>API Access</h4>
            <ul className="space-y-2 "
          style={{ color: 'var(--text-secondary)'  }}>
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
        <h3 className="text-2xl font-bold  mb-6"
          style={{ color: 'var(--text-primary)'  }}>Custom Analytics</h3>
        <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
          <h4 className="text-lg font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Advanced Features</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h5 className=" font-semibold mb-2"
          style={{ color: 'var(--text-primary)'  }}>Portfolio Analytics:</h5>
              <ul className="space-y-1  text-sm"
          style={{ color: 'var(--text-secondary)'  }}>
                <li>• Asset allocation analysis</li>
                <li>• Risk-adjusted returns</li>
                <li>• Correlation analysis</li>
                <li>• Rebalancing recommendations</li>
                <li>• Performance benchmarking</li>
              </ul>
            </div>
            
            <div>
              <h5 className=" font-semibold mb-2"
          style={{ color: 'var(--text-primary)'  }}>Trading Insights:</h5>
              <ul className="space-y-1  text-sm"
          style={{ color: 'var(--text-secondary)'  }}>
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
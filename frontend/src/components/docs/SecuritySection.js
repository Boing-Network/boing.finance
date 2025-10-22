import React from 'react';

const SecuritySection = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Security</h2>
        <p className=" text-lg"
          style={{ color: 'var(--text-secondary)'  }}>
          Security measures and best practices to ensure the safety of your assets 
          and transactions on boing.finance.
        </p>
      </div>

      {/* Security Overview */}
      <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
        <h3 className="text-xl font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Security Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🔒</div>
            <h4 className="text-lg font-medium  mb-2"
          style={{ color: 'var(--text-primary)'  }}>Smart Contract Security</h4>
            <p className=" text-sm"
          style={{ color: 'var(--text-secondary)'  }}>
              Built-in security features and best practices
            </p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🛡️</div>
            <h4 className="text-lg font-medium  mb-2"
          style={{ color: 'var(--text-primary)'  }}>User Protection</h4>
            <p className=" text-sm"
          style={{ color: 'var(--text-secondary)'  }}>
              Security features to protect user funds
            </p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🔍</div>
            <h4 className="text-lg font-medium  mb-2"
          style={{ color: 'var(--text-primary)'  }}>Best Practices</h4>
            <p className=" text-sm"
          style={{ color: 'var(--text-secondary)'  }}>
              Guidelines for safe DeFi usage
            </p>
          </div>
        </div>
      </div>

      {/* Smart Contract Security */}
      <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
        <h3 className="text-xl font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Smart Contract Security</h3>
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-medium  mb-3"
          style={{ color: 'var(--text-primary)'  }}>🛡️ Security Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg p-4"
          style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <h5 className="text-md font-medium  mb-2"
          style={{ color: 'var(--text-primary)'  }}>Access Control</h5>
                <ul className="text-sm  space-y-1"
          style={{ color: 'var(--text-secondary)'  }}>
                  <li>• Role-based permissions system</li>
                  <li>• Multi-signature wallet support</li>
                  <li>• Timelock mechanisms for critical operations</li>
                  <li>• Ownership renunciation capabilities</li>
                </ul>
              </div>
              <div className="rounded-lg p-4"
          style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <h5 className="text-md font-medium  mb-2"
          style={{ color: 'var(--text-primary)'  }}>Protection Mechanisms</h5>
                <ul className="text-sm  space-y-1"
          style={{ color: 'var(--text-secondary)'  }}>
                  <li>• Reentrancy guards on all external calls</li>
                  <li>• Overflow protection with SafeMath</li>
                  <li>• Slippage controls and limits</li>
                  <li>• Emergency pause functionality</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-medium  mb-3"
          style={{ color: 'var(--text-primary)'  }}>🔍 Code Quality</h4>
            <div className="rounded-lg p-4"
          style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <ul className="text-sm  space-y-2"
          style={{ color: 'var(--text-secondary)'  }}>
                <li>• <strong>Open Source:</strong> All contracts are open source and verifiable</li>
                <li>• <strong>Best Practices:</strong> Following Solidity security best practices</li>
                <li>• <strong>Code Review:</strong> Internal code review processes</li>
                <li>• <strong>Testing:</strong> Comprehensive test coverage</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* User Security */}
      <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
        <h3 className="text-xl font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>User Security</h3>
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-medium  mb-3"
          style={{ color: 'var(--text-primary)'  }}>🔐 Wallet Security</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg p-4"
          style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <h5 className="text-md font-medium  mb-2"
          style={{ color: 'var(--text-primary)'  }}>Best Practices</h5>
                <ul className="text-sm  space-y-1"
          style={{ color: 'var(--text-secondary)'  }}>
                  <li>• Use hardware wallets for large amounts</li>
                  <li>• Keep private keys secure and offline</li>
                  <li>• Enable two-factor authentication</li>
                  <li>• Regularly update wallet software</li>
                </ul>
              </div>
              <div className="rounded-lg p-4"
          style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <h5 className="text-md font-medium  mb-2"
          style={{ color: 'var(--text-primary)'  }}>Transaction Safety</h5>
                <ul className="text-sm  space-y-1"
          style={{ color: 'var(--text-secondary)'  }}>
                  <li>• Always verify transaction details</li>
                  <li>• Check contract addresses carefully</li>
                  <li>• Use slippage protection</li>
                  <li>• Start with small amounts</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-medium  mb-3"
          style={{ color: 'var(--text-primary)'  }}>⚠️ Security Warnings</h4>
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <span className="text-red-400 text-xl">⚠️</span>
                <div className="text-red-200">
                  <h5 className="font-medium mb-2">Important Security Reminders</h5>
                  <ul className="text-sm space-y-1">
                    <li>• Never share your private keys or seed phrases</li>
                    <li>• Be cautious of phishing attempts and fake websites</li>
                    <li>• Verify all contract addresses before transactions</li>
                    <li>• Use official boing.finance links only</li>
                    <li>• Report suspicious activity immediately</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Security */}
      <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
        <h3 className="text-xl font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Network Security</h3>
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-medium  mb-3"
          style={{ color: 'var(--text-primary)'  }}>🌐 Cross-Chain Security</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg p-4"
          style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <h5 className="text-md font-medium  mb-2"
          style={{ color: 'var(--text-primary)'  }}>Bridge Security</h5>
                <ul className="text-sm  space-y-1"
          style={{ color: 'var(--text-secondary)'  }}>
                  <li>• Multi-signature bridge operations</li>
                  <li>• Time-locked bridge transactions</li>
                  <li>• Cross-chain transaction verification</li>
                  <li>• Bridge state monitoring</li>
                </ul>
              </div>
              <div className="rounded-lg p-4"
          style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <h5 className="text-md font-medium  mb-2"
          style={{ color: 'var(--text-primary)'  }}>Network Validation</h5>
                <ul className="text-sm  space-y-1"
          style={{ color: 'var(--text-secondary)'  }}>
                  <li>• Multiple RPC endpoint validation</li>
                  <li>• Network consensus verification</li>
                  <li>• Block confirmation requirements</li>
                  <li>• Chain reorganization protection</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-medium  mb-3"
          style={{ color: 'var(--text-primary)'  }}>🔗 Oracle Security</h4>
            <div className="rounded-lg p-4"
          style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <ul className="text-sm  space-y-2"
          style={{ color: 'var(--text-secondary)'  }}>
                <li>• <strong>Chainlink Integration:</strong> Industry-standard price feeds</li>
                <li>• <strong>Multi-source Validation:</strong> Cross-reference price data</li>
                <li>• <strong>Heartbeat Monitoring:</strong> Detect stale price feeds</li>
                <li>• <strong>Deviation Thresholds:</strong> Prevent price manipulation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Response */}
      <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
        <h3 className="text-xl font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Incident Response</h3>
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-medium  mb-3"
          style={{ color: 'var(--text-primary)'  }}>🚨 Emergency Procedures</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg p-4"
          style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <h5 className="text-md font-medium  mb-2"
          style={{ color: 'var(--text-primary)'  }}>Detection & Response</h5>
                <ul className="text-sm  space-y-1"
          style={{ color: 'var(--text-secondary)'  }}>
                  <li>• Automated monitoring systems</li>
                  <li>• Threat detection mechanisms</li>
                  <li>• Incident response procedures</li>
                  <li>• Emergency pause capabilities</li>
                </ul>
              </div>
              <div className="rounded-lg p-4"
          style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <h5 className="text-md font-medium  mb-2"
          style={{ color: 'var(--text-primary)'  }}>Communication</h5>
                <ul className="text-sm  space-y-1"
          style={{ color: 'var(--text-secondary)'  }}>
                  <li>• Transparent incident reporting</li>
                  <li>• Community notification systems</li>
                  <li>• Regular security updates</li>
                  <li>• Post-incident analysis</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-medium  mb-3"
          style={{ color: 'var(--text-primary)'  }}>📞 Security Contacts</h4>
            <div className="rounded-lg p-4"
          style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-md font-medium  mb-2"
          style={{ color: 'var(--text-primary)'  }}>Report Security Issues</h5>
                  <ul className="text-sm  space-y-1"
          style={{ color: 'var(--text-secondary)'  }}>
                    <li>• Email: security@boing.finance</li>
                    <li>• Discord: <a href="https://discord.gg/7RDtQtQvBW" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">#security-reports</a></li>
                    <li>• GitHub: Security advisories</li>
                    <li>• Community channels</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-md font-medium  mb-2"
          style={{ color: 'var(--text-primary)'  }}>Emergency Contacts</h5>
                  <ul className="text-sm  space-y-1"
          style={{ color: 'var(--text-secondary)'  }}>
                    <li>• Emergency: emergency@boing.finance</li>
                    <li>• Support: support@boing.finance</li>
                    <li>• Twitter: <a href="https://twitter.com/boing_finance" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">@boing_finance</a></li>
                    <li>• Telegram: <a href="https://t.me/boing_finance" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">@boing_finance</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Checklist */}
      <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
        <h3 className="text-xl font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Security Checklist</h3>
        <div className="space-y-4">
          <div className="rounded-lg p-4"
          style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <h4 className="text-lg font-medium  mb-3"
          style={{ color: 'var(--text-primary)'  }}>✅ Before Trading</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="text-sm  space-y-2"
          style={{ color: 'var(--text-secondary)'  }}>
                <li>• Verify you're on the official boing.finance website</li>
                <li>• Check that your wallet is connected securely</li>
                <li>• Confirm you're on the correct network</li>
                <li>• Review transaction details carefully</li>
              </ul>
              <ul className="text-sm  space-y-2"
          style={{ color: 'var(--text-secondary)'  }}>
                <li>• Set appropriate slippage tolerance</li>
                <li>• Ensure sufficient gas for transactions</li>
                <li>• Double-check token addresses</li>
                <li>• Start with small test transactions</li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg p-4"
          style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <h4 className="text-lg font-medium  mb-3"
          style={{ color: 'var(--text-primary)'  }}>🛡️ Ongoing Security</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="text-sm  space-y-2"
          style={{ color: 'var(--text-secondary)'  }}>
                <li>• Keep wallet software updated</li>
                <li>• Monitor for suspicious activity</li>
                <li>• Use strong, unique passwords</li>
                <li>• Enable all available security features</li>
              </ul>
              <ul className="text-sm  space-y-2"
          style={{ color: 'var(--text-secondary)'  }}>
                <li>• Regularly review transaction history</li>
                <li>• Stay informed about security updates</li>
                <li>• Report any suspicious activity</li>
                <li>• Follow official security guidelines</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySection; 
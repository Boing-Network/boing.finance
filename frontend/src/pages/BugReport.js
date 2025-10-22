import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';

const BugReport = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    steps: '',
    expected: '',
    actual: '',
    severity: 'medium',
    category: 'general',
    browser: '',
    wallet: '',
    network: '',
    email: '',
    walletAddress: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({
        title: '',
        description: '',
        steps: '',
        expected: '',
        actual: '',
        severity: 'medium',
        category: 'general',
        browser: '',
        wallet: '',
        network: '',
        email: '',
        walletAddress: ''
      });
      
      // Reset status after 5 seconds
      setTimeout(() => setSubmitStatus(null), 5000);
    }, 2000);
  };

  const severityLevels = [
    { value: 'critical', label: 'Critical', description: 'System crash, data loss, security vulnerability' },
    { value: 'high', label: 'High', description: 'Major functionality broken, significant impact' },
    { value: 'medium', label: 'Medium', description: 'Minor functionality issues, workaround available' },
    { value: 'low', label: 'Low', description: 'Cosmetic issues, minor inconveniences' }
  ];

  const bugCategories = [
    { value: 'general', label: 'General Platform' },
    { value: 'trading', label: 'Trading & Swaps' },
    { value: 'liquidity', label: 'Liquidity Pools' },
    { value: 'bridge', label: 'Cross-Chain Bridge' },
    { value: 'wallet', label: 'Wallet Connection' },
    { value: 'ui', label: 'User Interface' },
    { value: 'performance', label: 'Performance' },
    { value: 'security', label: 'Security' }
  ];

  const browsers = [
    'Chrome', 'Firefox', 'Safari', 'Edge', 'Brave', 'Opera', 'Other'
  ];

  const wallets = [
    'MetaMask', 'WalletConnect', 'Trust Wallet', 'Coinbase Wallet', 'Phantom', 'Other'
  ];

  const networks = [
    'Ethereum Mainnet', 'Polygon', 'Arbitrum One', 'Optimism', 'BSC', 'Other'
  ];

  const reportingGuidelines = [
    {
      title: 'Be Specific',
      description: 'Provide clear, detailed descriptions of the issue',
      icon: '🎯'
    },
    {
      title: 'Include Steps',
      description: 'List the exact steps to reproduce the problem',
      icon: '📝'
    },
    {
      title: 'Add Screenshots',
      description: 'Visual evidence helps us understand the issue better',
      icon: '📸'
    },
    {
      title: 'Check Existing',
      description: 'Search existing reports to avoid duplicates',
      icon: '🔍'
    }
  ];

  const securityGuidelines = [
    'Never share your private keys or seed phrases',
    'Do not include sensitive transaction details',
    'Use a test wallet address if possible',
    'Report security issues to security@boing.finance',
    'Include transaction hashes for reference only'
  ];

  return (
    <>
      <Helmet>
        <title>Bug Report - boing.finance</title>
        <meta name="description" content="Report bugs and issues with boing.finance - Help us improve our cross-chain decentralized exchange platform by submitting detailed bug reports." />
        <meta name="keywords" content="bug report, issues, feedback, support, boing.finance, DEX" />
        <meta property="og:title" content="Bug Report - boing.finance" />
        <meta property="og:description" content="Report bugs and issues with boing.finance - Help us improve our platform." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/bug-report" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Bug Report - boing.finance" />
        <meta name="twitter:description" content="Report bugs and issues with boing.finance." />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
      </Helmet>
      
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-theme-primary mb-4">
                Bug Report
              </h1>
              <p className="text-xl text-theme-secondary mb-6">
                Help us improve boing.finance by reporting bugs and issues
              </p>
              <div className="rounded-lg p-4 mb-6 border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <strong>Note:</strong> As a solo-founder project, we appreciate detailed bug reports to help us prioritize fixes and improvements. Your feedback is invaluable for our growth.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Guidelines Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Reporting Guidelines */}
                <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <h2 className="text-xl font-bold text-theme-primary mb-4">Reporting Guidelines</h2>
                  <div className="space-y-4">
                    {reportingGuidelines.map((guideline) => (
                      <div key={guideline.title} className="flex items-start space-x-3">
                        <span className="text-2xl">{guideline.icon}</span>
                        <div>
                          <h3 className="text-sm font-semibold text-theme-primary mb-1">{guideline.title}</h3>
                          <p className="text-theme-secondary text-xs">{guideline.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Security Guidelines */}
                <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <h2 className="text-xl font-bold text-theme-primary mb-4">Security Guidelines</h2>
                  <div className="space-y-2">
                    {securityGuidelines.map((guideline, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-red-400 text-sm">⚠️</span>
                        <p className="text-theme-secondary text-xs">{guideline}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alternative Reporting */}
                <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <h2 className="text-xl font-bold text-theme-primary mb-4">Other Ways to Report</h2>
                  <div className="space-y-3">
                    <a
                      href="mailto:bugs@boing.finance"
                      className="block bg-theme-secondary hover:bg-theme-tertiary px-4 py-2 rounded-lg transition-colors text-center text-theme-primary"
                    >
                      Email Bug Report
                    </a>
                    <a
                      href="/contact-us"
                      className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-center"
                    >
                      Contact Form
                    </a>
                    <a
                      href="mailto:support@boing.finance"
                      className="block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-center"
                    >
                      General Support
                    </a>
                  </div>
                </div>
              </div>

              {/* Bug Report Form */}
              <div className="lg:col-span-2">
                <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <h2 className="text-2xl font-bold text-theme-primary mb-6">Submit Bug Report</h2>
                  
                  {submitStatus === 'success' && (
                    <div className="rounded-lg p-4 mb-6 border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--success-color)' }}>
                      <div className="flex items-center space-x-2">
                        <span style={{ color: 'var(--success-color)' }}>✅</span>
                        <p style={{ color: 'var(--text-secondary)' }}>Thank you! Your bug report has been submitted successfully. We'll investigate and get back to you soon.</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-theme-primary">Basic Information</h3>
                      
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-theme-secondary mb-2">
                          Bug Title *
                        </label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          required
                          className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{ 
                            backgroundColor: 'var(--bg-secondary)', 
                            borderColor: 'var(--border-color)', 
                            color: 'var(--text-primary)' 
                          }}
                          placeholder="Brief description of the bug"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="severity" className="block text-sm font-medium text-theme-secondary mb-2">
                            Severity *
                          </label>
                          <select
                            id="severity"
                            name="severity"
                            value={formData.severity}
                            onChange={handleInputChange}
                            required
                            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{ 
                            backgroundColor: 'var(--bg-secondary)', 
                            borderColor: 'var(--border-color)', 
                            color: 'var(--text-primary)' 
                          }}
                          >
                            {severityLevels.map((level) => (
                              <option key={level.value} value={level.value}>
                                {level.label} - {level.description}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="category" className="block text-sm font-medium text-theme-secondary mb-2">
                            Category *
                          </label>
                          <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            required
                            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{ 
                            backgroundColor: 'var(--bg-secondary)', 
                            borderColor: 'var(--border-color)', 
                            color: 'var(--text-primary)' 
                          }}
                          >
                            {bugCategories.map((category) => (
                              <option key={category.value} value={category.value}>
                                {category.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Bug Description */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-theme-primary">Bug Description</h3>
                      
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-theme-secondary mb-2">
                          Detailed Description *
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          required
                          rows={4}
                          className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          style={{ 
                            backgroundColor: 'var(--bg-secondary)', 
                            borderColor: 'var(--border-color)', 
                            color: 'var(--text-primary)' 
                          }}
                          placeholder="Describe the bug in detail..."
                        />
                      </div>

                      <div>
                        <label htmlFor="steps" className="block text-sm font-medium text-theme-secondary mb-2">
                          Steps to Reproduce *
                        </label>
                        <textarea
                          id="steps"
                          name="steps"
                          value={formData.steps}
                          onChange={handleInputChange}
                          required
                          rows={4}
                          className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          style={{ 
                            backgroundColor: 'var(--bg-secondary)', 
                            borderColor: 'var(--border-color)', 
                            color: 'var(--text-primary)' 
                          }}
                          placeholder="1. Go to...&#10;2. Click on...&#10;3. Observe..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="expected" className="block text-sm font-medium text-theme-secondary mb-2">
                            Expected Behavior
                          </label>
                          <textarea
                            id="expected"
                            name="expected"
                            value={formData.expected}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          style={{ 
                            backgroundColor: 'var(--bg-secondary)', 
                            borderColor: 'var(--border-color)', 
                            color: 'var(--text-primary)' 
                          }}
                            placeholder="What should happen?"
                          />
                        </div>

                        <div>
                          <label htmlFor="actual" className="block text-sm font-medium text-theme-secondary mb-2">
                            Actual Behavior
                          </label>
                          <textarea
                            id="actual"
                            name="actual"
                            value={formData.actual}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          style={{ 
                            backgroundColor: 'var(--bg-secondary)', 
                            borderColor: 'var(--border-color)', 
                            color: 'var(--text-primary)' 
                          }}
                            placeholder="What actually happens?"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Environment Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-theme-primary">Environment Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="browser" className="block text-sm font-medium text-theme-secondary mb-2">
                            Browser
                          </label>
                          <select
                            id="browser"
                            name="browser"
                            value={formData.browser}
                            onChange={handleInputChange}
                            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{ 
                            backgroundColor: 'var(--bg-secondary)', 
                            borderColor: 'var(--border-color)', 
                            color: 'var(--text-primary)' 
                          }}
                          >
                            <option value="">Select browser</option>
                            {browsers.map((browser) => (
                              <option key={browser} value={browser}>
                                {browser}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="wallet" className="block text-sm font-medium text-theme-secondary mb-2">
                            Wallet
                          </label>
                          <select
                            id="wallet"
                            name="wallet"
                            value={formData.wallet}
                            onChange={handleInputChange}
                            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{ 
                            backgroundColor: 'var(--bg-secondary)', 
                            borderColor: 'var(--border-color)', 
                            color: 'var(--text-primary)' 
                          }}
                          >
                            <option value="">Select wallet</option>
                            {wallets.map((wallet) => (
                              <option key={wallet} value={wallet}>
                                {wallet}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="network" className="block text-sm font-medium text-theme-secondary mb-2">
                            Network
                          </label>
                          <select
                            id="network"
                            name="network"
                            value={formData.network}
                            onChange={handleInputChange}
                            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{ 
                            backgroundColor: 'var(--bg-secondary)', 
                            borderColor: 'var(--border-color)', 
                            color: 'var(--text-primary)' 
                          }}
                          >
                            <option value="">Select network</option>
                            {networks.map((network) => (
                              <option key={network} value={network}>
                                {network}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-theme-primary">Contact Information (Optional)</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-theme-secondary mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{ 
                            backgroundColor: 'var(--bg-secondary)', 
                            borderColor: 'var(--border-color)', 
                            color: 'var(--text-primary)' 
                          }}
                            placeholder="your@email.com"
                          />
                        </div>

                        <div>
                          <label htmlFor="walletAddress" className="block text-sm font-medium text-theme-secondary mb-2">
                            Wallet Address (Optional)
                          </label>
                          <input
                            type="text"
                            id="walletAddress"
                            name="walletAddress"
                            value={formData.walletAddress}
                            onChange={handleInputChange}
                            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{ 
                            backgroundColor: 'var(--bg-secondary)', 
                            borderColor: 'var(--border-color)', 
                            color: 'var(--text-primary)' 
                          }}
                            placeholder="0x..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        'Submit Bug Report'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="mt-12 rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-2xl font-bold text-theme-primary mb-6 text-center">What Happens Next?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl mb-3">📋</div>
                  <h3 className="text-lg font-semibold text-theme-primary mb-2">Review</h3>
                  <p className="text-theme-secondary text-sm">
                    As a solo founder, I'll review your bug report and prioritize it based on severity and impact.
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">🔧</div>
                  <h3 className="text-lg font-semibold text-theme-primary mb-2">Investigation</h3>
                  <p className="text-theme-secondary text-sm">
                    I'll investigate the issue, reproduce it if possible, and work on a solution as quickly as possible.
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">✅</div>
                  <h3 className="text-lg font-semibold text-theme-primary mb-2">Resolution</h3>
                  <p className="text-theme-secondary text-sm">
                    I'll fix the issue and update you on the progress. Critical bugs receive immediate attention.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BugReport; 
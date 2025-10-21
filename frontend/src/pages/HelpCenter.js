import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';

const HelpCenter = () => {
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const helpCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: '🚀',
      articles: [
        {
          id: 'connect-wallet',
          title: 'How to Connect Your Wallet',
          content: 'Learn how to connect MetaMask, WalletConnect, or other supported wallets to boing.finance.',
          tags: ['wallet', 'connection', 'metamask']
        },
        {
          id: 'first-swap',
          title: 'Making Your First Swap',
          content: 'Step-by-step guide to swapping tokens on boing.finance for the first time.',
          tags: ['swap', 'trading', 'first-time']
        },
        {
          id: 'network-switching',
          title: 'Switching Between Networks',
          content: 'How to switch between different blockchain networks like Ethereum, Polygon, and Arbitrum.',
          tags: ['network', 'switching', 'blockchain']
        }
      ]
    },
    {
      id: 'trading',
      title: 'Trading',
      icon: '🔄',
      articles: [
        {
          id: 'swap-tokens',
          title: 'How to Swap Tokens',
          content: 'Complete guide to swapping tokens, understanding slippage, and optimizing your trades.',
          tags: ['swap', 'tokens', 'slippage']
        },
        {
          id: 'liquidity-pools',
          title: 'Adding and Removing Liquidity',
          content: 'Learn how to provide liquidity to pools and earn trading fees.',
          tags: ['liquidity', 'pools', 'fees']
        },
        {
          id: 'price-impact',
          title: 'Understanding Price Impact',
          content: 'What is price impact and how it affects your trades.',
          tags: ['price', 'impact', 'trading']
        }
      ]
    },
    {
      id: 'bridge',
      title: 'Cross-Chain Bridge',
      icon: '🌉',
      articles: [
        {
          id: 'bridge-tokens',
          title: 'How to Bridge Tokens',
          content: 'Step-by-step guide to transferring tokens between different blockchains.',
          tags: ['bridge', 'cross-chain', 'transfer']
        },
        {
          id: 'bridge-fees',
          title: 'Bridge Fees and Timeframes',
          content: 'Understanding bridge fees, processing times, and gas costs.',
          tags: ['fees', 'timeframes', 'gas']
        },
        {
          id: 'bridge-security',
          title: 'Bridge Security',
          content: 'Security measures and best practices for cross-chain transfers.',
          tags: ['security', 'safety', 'best-practices']
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: '🔧',
      articles: [
        {
          id: 'failed-transactions',
          title: 'Failed Transactions',
          content: 'Common reasons for failed transactions and how to resolve them.',
          tags: ['failed', 'transactions', 'errors']
        },
        {
          id: 'high-gas-fees',
          title: 'High Gas Fees',
          content: 'How to reduce gas fees and optimize your transactions.',
          tags: ['gas', 'fees', 'optimization']
        },
        {
          id: 'token-not-found',
          title: 'Token Not Found',
          content: 'What to do when a token is not showing up in the interface.',
          tags: ['token', 'not-found', 'import']
        }
      ]
    },
    {
      id: 'security',
      title: 'Security',
      icon: '🔒',
      articles: [
        {
          id: 'wallet-security',
          title: 'Wallet Security Best Practices',
          content: 'Essential security tips to protect your wallet and funds.',
          tags: ['security', 'wallet', 'protection']
        },
        {
          id: 'avoid-scams',
          title: 'Avoiding Scams and Phishing',
          content: 'How to identify and avoid common DeFi scams and phishing attempts.',
          tags: ['scams', 'phishing', 'safety']
        },
        {
          id: 'private-keys',
          title: 'Protecting Your Private Keys',
          content: 'Best practices for keeping your private keys secure.',
          tags: ['private-keys', 'security', 'backup']
        }
      ]
    }
  ];

  const filteredArticles = helpCategories
    .flatMap(category => 
      category.articles
        .filter(article => 
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .map(article => ({ ...article, category: category.title }))
    );

  const currentCategory = helpCategories.find(cat => cat.id === activeCategory);

  return (
    <>
      <Helmet>
        <title>Help Center - boing.finance</title>
        <meta name="description" content="Get help with boing.finance - Comprehensive guides, FAQs, and support resources for our cross-chain decentralized exchange platform." />
        <meta name="keywords" content="help center, support, FAQ, guides, boing.finance, DEX, troubleshooting" />
        <meta property="og:title" content="Help Center - boing.finance" />
        <meta property="og:description" content="Get help with boing.finance - Comprehensive guides and support resources." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/help" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Help Center - boing.finance" />
        <meta name="twitter:description" content="Get help with boing.finance - Support and guides." />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Help Center
              </h1>
              <p className="text-xl text-gray-300 mb-6">
                Find answers to your questions and get support for boing.finance
              </p>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                <p className="text-blue-200 text-sm">
                  <strong>Note:</strong> boing.finance is currently in early development phase. While our platform is fully functional, we are a solo-founder project seeking funding for expansion and feature development.
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
              <div className="relative max-w-2xl mx-auto">
                <input
                  type="text"
                  placeholder="Search for help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute left-4 top-3 text-gray-400">
                  🔍
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <a
                href="mailto:support@boing.finance"
                className="bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg transition-colors text-center"
              >
                <div className="text-2xl mb-2">📧</div>
                <div className="font-semibold">Email Support</div>
                <div className="text-sm text-gray-300">Primary support channel</div>
              </a>
              <a
                href="/bug-report"
                className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg transition-colors text-center"
              >
                <div className="text-2xl mb-2">🐛</div>
                <div className="font-semibold">Bug Report</div>
                <div className="text-sm text-red-200">Report issues</div>
              </a>
              <a
                href="/contact-us"
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors text-center"
              >
                <div className="text-2xl mb-2">💬</div>
                <div className="font-semibold">Contact Us</div>
                <div className="text-sm text-blue-200">General inquiries</div>
              </a>
            </div>

            {/* Search Results or Category Content */}
            {searchQuery ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Search Results for "{searchQuery}"
                </h2>
                {filteredArticles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredArticles.map((article) => (
                      <div key={article.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                        <div className="text-sm text-blue-400 mb-2">{article.category}</div>
                        <h3 className="text-lg font-semibold text-white mb-2">{article.title}</h3>
                        <p className="text-gray-300 text-sm mb-3">{article.content}</p>
                        <div className="flex flex-wrap gap-1">
                          {article.tags.map((tag) => (
                            <span key={tag} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
                    <p className="text-gray-300 mb-4">Try different keywords or browse our categories below</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Clear Search
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Categories Sidebar */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
                    <div className="space-y-2">
                      {helpCategories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setActiveCategory(category.id)}
                          className={`w-full text-left p-3 rounded-lg transition-colors flex items-center space-x-3 ${
                            activeCategory === category.id
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-300 hover:text-white hover:bg-gray-700'
                          }`}
                        >
                          <span className="text-lg">{category.icon}</span>
                          <span className="font-medium">{category.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Category Content */}
                <div className="lg:col-span-3">
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center space-x-3 mb-6">
                      <span className="text-2xl">{currentCategory.icon}</span>
                      <h2 className="text-2xl font-bold text-white">{currentCategory.title}</h2>
                    </div>
                    
                    <div className="space-y-4">
                      {currentCategory.articles.map((article) => (
                        <div key={article.id} className="border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
                          <h3 className="text-lg font-semibold text-white mb-2">{article.title}</h3>
                          <p className="text-gray-300 text-sm mb-3">{article.content}</p>
                          <div className="flex flex-wrap gap-1">
                            {article.tags.map((tag) => (
                              <span key={tag} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Support */}
            <div className="mt-12 bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4 text-center">Still Need Help?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Direct Support</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    As a solo-founder project, we provide direct email support for all inquiries.
                  </p>
                  <div className="space-y-2">
                    <a
                      href="mailto:support@boing.finance"
                      className="block bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Email Support Team
                    </a>
                    <a
                      href="/contact-us"
                      className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Contact Form
                    </a>
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Bug Reports</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Help us improve the platform by reporting bugs and issues you encounter.
                  </p>
                  <div className="space-y-2">
                    <a
                      href="/bug-report"
                      className="block bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Report a Bug
                    </a>
                    <a
                      href="mailto:bugs@boing.finance"
                      className="block bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Email Bug Report
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HelpCenter; 
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import AIChatModal from '../components/AIChatModal';

const HelpCenter = () => {
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiChatOpen, setAiChatOpen] = useState(false);

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
      id: 'keyboard-shortcuts',
      title: 'Keyboard Shortcuts',
      icon: '⌨️',
      articles: [
        {
          id: 'shortcuts',
          title: 'Keyboard Shortcuts',
          content: 'Press Escape (Esc) to close any open modal, dropdown, or menu. Use Tab to navigate between interactive elements.',
          tags: ['keyboard', 'shortcuts', 'accessibility']
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
      
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Help Center
              </h1>
              <p className="text-xl mb-6" style={{ color: 'var(--text-secondary)' }}>
                Find answers to your questions and get support for boing.finance
              </p>
              <div className="rounded-lg p-4 mb-6 border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <strong>Note:</strong> boing.finance is currently in early development phase. While our platform is fully functional, we are a solo-founder project seeking funding for expansion and feature development.
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="rounded-lg p-6 mb-8 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="relative max-w-2xl mx-auto">
                <label htmlFor="help-center-search" className="sr-only">Search for help articles</label>
                <input
                  id="help-center-search"
                  name="helpSearch"
                  type="text"
                  placeholder="Search for help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
                <div className="absolute left-4 top-3" style={{ color: 'var(--text-tertiary)' }}>
                  🔍
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <button
                onClick={() => setAiChatOpen(true)}
                className="p-4 rounded-lg transition-colors text-center border bg-cyan-600/20 hover:bg-cyan-600/30 border-cyan-500/50"
                style={{ color: 'var(--text-primary)' }}
              >
                <div className="text-2xl mb-2">🤖</div>
                <div className="font-semibold">Ask AI Assistant</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Get help with swaps, liquidity, bridge</div>
              </button>
              <a
                href="mailto:support@boing.finance"
                className="hover:bg-gray-600 p-4 rounded-lg transition-colors text-center border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                <div className="text-2xl mb-2">📧</div>
                <div className="font-semibold">Email Support</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Primary support channel</div>
              </a>
              <a
                href="/bug-report"
                className="bg-red-600 hover:bg-red-700 p-4 rounded-lg transition-colors text-center" style={{ color: 'var(--text-primary)' }}
              >
                <div className="text-2xl mb-2">🐛</div>
                <div className="font-semibold">Bug Report</div>
                <div className="text-sm text-red-200">Report issues</div>
              </a>
              <a
                href="/contact-us"
                className="bg-blue-600 hover:bg-blue-700 p-4 rounded-lg transition-colors text-center" style={{ color: 'var(--text-primary)' }}
              >
                <div className="text-2xl mb-2">💬</div>
                <div className="font-semibold">Contact Us</div>
                <div className="text-sm text-blue-200">General inquiries</div>
              </a>
            </div>

            <AIChatModal
              isOpen={aiChatOpen}
              onClose={() => setAiChatOpen(false)}
              context={{
                page: 'help-center',
                helpCategories: helpCategories.map(c => ({
                  title: c.title,
                  articles: c.articles.map(a => ({ title: a.title, content: a.content, tags: a.tags }))
                }))
              }}
            />

            {/* Search Results or Category Content */}
            {searchQuery ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Search Results for "{searchQuery}"
                </h2>
                {filteredArticles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredArticles.map((article) => (
                      <Link key={article.id} to={`/help-center/article/${article.id}`} className="block">
                        <div className="rounded-lg p-4 border hover:border transition-colors cursor-pointer" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                          <div className="text-sm text-blue-400 mb-2">{article.category}</div>
                          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{article.title}</h3>
                          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{article.content}</p>
                          <div className="flex flex-wrap gap-1">
                            {article.tags.map((tag) => (
                              <span key={tag} className="text-xs px-2 py-1 rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No results found</h3>
                    <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Try different keywords or browse our categories below</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors" style={{ color: 'var(--text-primary)' }}
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
                  <div className="rounded-lg p-4 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Categories</h3>
                    <div className="space-y-2">
                      {helpCategories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setActiveCategory(category.id)}
                          className={`w-full text-left p-3 rounded-lg transition-colors flex items-center space-x-3 ${
                            activeCategory === category.id
                              ? 'bg-blue-600'
                              : ''
                          }`}
                          style={{
                            color: activeCategory === category.id ? 'var(--text-primary)' : 'var(--text-secondary)'
                          }}
                          onMouseEnter={(e) => {
                            if (activeCategory !== category.id) {
                              e.target.style.color = 'var(--text-primary)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (activeCategory !== category.id) {
                              e.target.style.color = 'var(--text-secondary)';
                            }
                          }}
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
                  <div className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center space-x-3 mb-6">
                      <span className="text-2xl">{currentCategory.icon}</span>
                      <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{currentCategory.title}</h2>
                    </div>
                    
                    <div className="space-y-4">
                      {currentCategory.articles.map((article) => (
                        <Link key={article.id} to={`/help-center/article/${article.id}`} className="block">
                          <div className="border rounded-lg p-4 hover:border transition-colors cursor-pointer">
                            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{article.title}</h3>
                            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{article.content}</p>
                            <div className="flex flex-wrap gap-1">
                              {article.tags.map((tag) => (
                                <span key={tag} className="text-xs px-2 py-1 rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Support */}
            <div className="mt-12 rounded-lg p-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: 'var(--text-primary)' }}>Still Need Help?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Direct Support</h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    As a solo-founder project, we provide direct email support for all inquiries.
                  </p>
                  <div className="space-y-2">
                    <a
                      href="mailto:support@boing.finance"
                      className="block hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      Email Support Team
                    </a>
                    <a
                      href="/contact-us"
                      className="block bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors" style={{ color: 'var(--text-primary)' }}
                    >
                      Contact Form
                    </a>
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Bug Reports</h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Help us improve the platform by reporting bugs and issues you encounter.
                  </p>
                  <div className="space-y-2">
                    <a
                      href="/bug-report"
                      className="block bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors" style={{ color: 'var(--text-primary)' }}
                    >
                      Report a Bug
                    </a>
                    <a
                      href="mailto:bugs@boing.finance"
                      className="block hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
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
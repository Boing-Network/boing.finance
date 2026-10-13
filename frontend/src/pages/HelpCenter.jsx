import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import AIChatModal from '../components/AIChatModal';
import EmptyState from '../components/EmptyState';

const HelpCenter = () => {
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiChatOpen, setAiChatOpen] = useState(false);

  const helpCategories = [
    {
      id: 'getting-started',
      title: 'Getting started',
      icon: null,
      articles: [
        {
          id: 'connect-wallet',
          title: 'Connect your wallet',
          content: 'Connect MetaMask, WalletConnect, or another supported wallet to boing.finance.',
          tags: ['wallet', 'connection', 'metamask']
        },
        {
          id: 'first-swap',
          title: 'Make your first swap',
          content: 'Pick two tokens, enter an amount, and confirm in your wallet.',
          tags: ['swap', 'trading', 'first-time']
        },
        {
          id: 'network-switching',
          title: 'Switch networks',
          content: 'Change networks from the header to move between EVM chains and Solana.',
          tags: ['network', 'switching', 'blockchain']
        }
      ]
    },
    {
      id: 'trading',
      title: 'Trading',
      icon: null,
      articles: [
        {
          id: 'swap-tokens',
          title: 'How to swap',
          content: 'Swap tokens, set slippage, and confirm the trade.',
          tags: ['swap', 'tokens', 'slippage']
        },
        {
          id: 'liquidity-pools',
          title: 'Add or remove liquidity',
          content: 'Add tokens to a pool to earn a share of trading fees, or remove them later.',
          tags: ['liquidity', 'pools', 'fees']
        },
        {
          id: 'price-impact',
          title: 'Price impact',
          content: 'Large swaps can move the price. Check impact before you confirm.',
          tags: ['price', 'impact', 'trading']
        }
      ]
    },
    {
      id: 'bridge',
      title: 'Bridge',
      icon: null,
      articles: [
        {
          id: 'bridge-tokens',
          title: 'How to bridge',
          content: 'Move tokens between EVM networks. A small platform fee applies.',
          tags: ['bridge', 'cross-chain', 'transfer']
        },
        {
          id: 'bridge-fees',
          title: 'Fees and timing',
          content: 'Platform fee plus network gas and any bridge route fees. Arrival time depends on the route.',
          tags: ['fees', 'timeframes', 'gas']
        },
        {
          id: 'bridge-security',
          title: 'Bridge safety',
          content: 'You send from your wallet through a third-party route. Boing does not hold bridge funds.',
          tags: ['security', 'safety', 'best-practices']
        }
      ]
    },
    {
      id: 'launch',
      title: 'Launch',
      icon: null,
      articles: [
        {
          id: 'project-pack',
          title: 'Project pack',
          content:
            'Create an NFT collection and a token, then connect them as one project. Start at Project pack. Manage existing pairs under Manage links.',
          tags: ['nft', 'token', 'companions', 'project pack', 'linked', 'boing']
        },
        {
          id: 'linked-project',
          title: 'Manage links',
          content:
            'Connect or disconnect a collection and token you already created. Prefer Project pack to create both together.',
          tags: ['nft', 'token', 'linked', 'companions', 'claim', 'boing']
        },
        {
          id: 'builder-attestation',
          title: "Show you're the builder",
          content:
            'Optional: after linking, mark yourself as the builder from Project pack success or Manage links.',
          tags: ['builder', 'attestation', 'companions', 'project', 'on-chain', 'boing']
        }
      ]
    },
    {
      id: 'keyboard-shortcuts',
      title: 'Keyboard shortcuts',
      icon: null,
      articles: [
        {
          id: 'shortcuts',
          title: 'Keyboard shortcuts',
          content: 'Press Escape to close modals and menus. Use Tab to move between controls.',
          tags: ['keyboard', 'shortcuts', 'accessibility']
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: null,
      articles: [
        {
          id: 'failed-transactions',
          title: 'Failed transactions',
          content: 'Common reasons a transaction fails and what to try next.',
          tags: ['failed', 'transactions', 'errors']
        },
        {
          id: 'high-gas-fees',
          title: 'High gas fees',
          content: 'Ways to lower gas costs when the network is busy.',
          tags: ['gas', 'fees', 'optimization']
        },
        {
          id: 'token-not-found',
          title: 'Token not found',
          content: 'What to do when a token does not show up in the app.',
          tags: ['token', 'not-found', 'import']
        }
      ]
    },
    {
      id: 'security',
      title: 'Security',
      icon: null,
      articles: [
        {
          id: 'wallet-security',
          title: 'Wallet safety tips',
          content: 'Basic steps to keep your wallet and funds safer.',
          tags: ['security', 'wallet', 'protection']
        },
        {
          id: 'avoid-scams',
          title: 'Avoid scams',
          content: 'How to spot common phishing and fake support scams.',
          tags: ['scams', 'phishing', 'safety']
        },
        {
          id: 'private-keys',
          title: 'Protect your keys',
          content: 'Never share seed phrases or private keys. Store backups offline.',
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
        <title>Help Center | boing.finance — Guides, FAQs & Support</title>
        <meta name="description" content="Get help with boing.finance. Guides for swap, liquidity, bridge, linked NFT↔token pairs, deploy token, and wallet. FAQs and support." />
        <meta name="keywords" content="help center, support, FAQ, guides, boing.finance, DEX, linked project, NFT, troubleshooting" />
        <meta property="og:title" content="Help Center | boing.finance" />
        <meta property="og:description" content="Get help with boing.finance - Comprehensive guides and support resources." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/help-center" />
        <link rel="canonical" href="https://boing.finance/help-center" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Help Center - boing.finance" />
        <meta name="twitter:description" content="Get help with boing.finance - Support and guides." />
      </Helmet>
      
      <div className="relative w-full min-w-0" style={{ color: 'var(--text-primary)' }}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Help Center
              </h1>
              <p className="text-xl mb-6" style={{ color: 'var(--text-secondary)' }}>
                Search for answers, or ask the assistant
              </p>
            </div>

            {/* Search Bar */}
            <div className="rounded-lg p-6 mb-6 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="relative max-w-2xl mx-auto">
                <label htmlFor="help-center-search" className="sr-only">Search for help articles</label>
                <input
                  id="help-center-search"
                  name="helpSearch"
                  type="text"
                  autoComplete="off"
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

            <div className="flex flex-wrap justify-center items-center gap-4 mb-8">
              <button
                type="button"
                onClick={() => setAiChatOpen(true)}
                className="px-4 py-2 rounded-lg font-medium bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                Ask AI assistant
              </button>
              <a href="mailto:support@boing.finance" className="text-sm underline" style={{ color: 'var(--finance-primary)' }}>
                Email support
              </a>
              <a href="/bug-report" className="text-sm underline" style={{ color: 'var(--text-secondary)' }}>
                Bug report
              </a>
              <a href="/contact-us" className="text-sm underline" style={{ color: 'var(--text-secondary)' }}>
                Contact
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
                  <EmptyState
                    variant="search"
                    title="No results found"
                    description="Try different keywords or browse our categories below."
                    action={() => setSearchQuery('')}
                    actionLabel="Clear Search"
                  />
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
                      <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{currentCategory.title}</h2>
                    </div>
                    
                    <div className="space-y-4">
                      {currentCategory.articles.map((article) => (
                        <Link key={article.id} to={`/help-center/article/${article.id}`} className="block">
                          <div className="border rounded-lg p-4 hover:border transition-colors cursor-pointer">
                            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{article.title}</h3>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{article.content}</p>
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
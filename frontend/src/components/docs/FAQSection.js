import React, { useState } from 'react';

const FAQSection = () => {
  const [openItems, setOpenItems] = useState(new Set());

  const toggleItem = (id) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const faqCategories = [
    {
      title: 'Getting Started',
      icon: '🚀',
      items: [
        {
          id: 'gs-1',
          question: 'What is boing.finance?',
          answer: 'boing.finance is a decentralized exchange (DEX) that allows users to trade cryptocurrencies across multiple blockchain networks. It features automated market making, liquidity provision, cross-chain bridging, and token deployment capabilities.'
        },
        {
          id: 'gs-2',
          question: 'How do I connect my wallet?',
          answer: 'Click the "Connect Wallet" button in the top right corner. We support MetaMask, WalletConnect, and other popular Web3 wallets. Make sure your wallet is set to a supported network.'
        },
        {
          id: 'gs-3',
          question: 'Which networks are supported?',
          answer: 'We support Ethereum, Polygon, BSC, Arbitrum, Optimism, Base, Avalanche, Fantom, and their respective testnets. More networks are being added regularly.'
        },
        {
          id: 'gs-4',
          question: 'Do I need to create an account?',
          answer: 'No account creation is required. Simply connect your Web3 wallet to start trading. Your wallet address serves as your account identifier.'
        }
      ]
    },
    {
      title: 'Trading',
      icon: '💱',
      items: [
        {
          id: 't-1',
          question: 'How do I swap tokens?',
          answer: 'Navigate to the Swap page, select the tokens you want to trade, enter the amount, review the transaction details including slippage, and confirm the swap. Make sure you have sufficient balance and gas fees.'
        },
        {
          id: 't-2',
          question: 'What is slippage tolerance?',
          answer: 'Slippage tolerance is the maximum price change you\'re willing to accept for your trade. Higher slippage increases the chance of your transaction succeeding but may result in a worse price. We recommend starting with 0.5%.'
        },
        {
          id: 't-3',
          question: 'Why did my transaction fail?',
          answer: 'Common reasons include insufficient gas fees, high slippage, insufficient token balance, or network congestion. Check your wallet for error messages and ensure you have enough funds for both the trade and gas fees.'
        },
        {
          id: 't-4',
          question: 'What are the trading fees?',
          answer: 'Trading fees are 0.3% per swap, with 0.25% going to liquidity providers and 0.05% to the protocol. Bridge fees vary by network and are displayed before confirming cross-chain transfers.'
        }
      ]
    },
    {
      title: 'Liquidity',
      icon: '💧',
      items: [
        {
          id: 'l-1',
          question: 'How do I add liquidity?',
          answer: 'Go to the Liquidity page, select a trading pair, enter the amounts of both tokens you want to provide, and confirm the transaction. You\'ll receive LP tokens representing your share of the pool.'
        },
        {
          id: 'l-2',
          question: 'What are LP tokens?',
          answer: 'LP (Liquidity Provider) tokens represent your share of a liquidity pool. They earn trading fees and can be staked for additional rewards. You need these tokens to remove your liquidity later.'
        },
        {
          id: 'l-3',
          question: 'How do I earn from providing liquidity?',
          answer: 'You earn a portion of the 0.3% trading fees proportional to your share of the pool. The more liquidity you provide and the more trading volume the pair has, the more fees you earn.'
        },
        {
          id: 'l-4',
          question: 'What is impermanent loss?',
          answer: 'Impermanent loss occurs when the price ratio of tokens in a liquidity pool changes. It\'s "impermanent" because it can be recovered if prices return to their original ratio. Consider this risk when providing liquidity.'
        }
      ]
    },
    {
      title: 'Bridge',
      icon: '🌉',
      items: [
        {
          id: 'b-1',
          question: 'How does cross-chain bridging work?',
          answer: 'Our bridge locks your tokens on the source chain and mints equivalent tokens on the destination chain. The process involves multiple confirmations and can take 5-30 minutes depending on the networks involved.'
        },
        {
          id: 'b-2',
          question: 'Which tokens can I bridge?',
          answer: 'Currently, we support bridging of major tokens like ETH, USDC, USDT, and DAI between supported networks. More tokens are being added regularly. Check the Bridge page for the current list.'
        },
        {
          id: 'b-3',
          question: 'How long does bridging take?',
          answer: 'Bridge times vary by network: Ethereum to Polygon takes ~5-10 minutes, while cross-chain bridges to networks like Arbitrum or Optimism may take 10-30 minutes due to different confirmation requirements.'
        },
        {
          id: 'b-4',
          question: 'What if my bridge transaction fails?',
          answer: 'If a bridge transaction fails, your tokens will be returned to your wallet on the source chain. Check the transaction status on the Bridge page and contact support if you need assistance.'
        }
      ]
    },
    {
      title: 'Token Deployment',
      icon: '🪙',
      items: [
        {
          id: 'td-1',
          question: 'How do I deploy my own token?',
          answer: 'Navigate to the Deploy Token page, fill in your token details (name, symbol, supply, etc.), review the deployment cost, and confirm the transaction. Your token will be deployed to the selected network.'
        },
        {
          id: 'td-2',
          question: 'What networks can I deploy tokens on?',
          answer: 'You can deploy tokens on all supported networks. Consider gas costs - Ethereum mainnet is more expensive than Layer 2 networks like Polygon or Arbitrum. Testnets are free for testing.'
        },
        {
          id: 'td-3',
          question: 'How much does token deployment cost?',
          answer: 'Deployment costs vary by network. Ethereum mainnet costs around $50-200 in gas fees, while Layer 2 networks like Polygon cost $1-10. Testnet deployments are free.'
        },
        {
          id: 'td-4',
          question: 'Can I customize my token features?',
          answer: 'Yes! Our AdvancedERC20 token standard includes features like burnable tokens, minting capabilities, pausable functionality, and custom tax mechanisms. Select the features you need during deployment.'
        }
      ]
    },
    {
      title: 'Security',
      icon: '🔒',
      items: [
        {
          id: 's-1',
          question: 'Is boing.finance safe to use?',
          answer: 'Yes, our smart contracts include multiple safety features like reentrancy guards, slippage protection, and emergency pause functionality. All contracts are open source and verifiable.'
        },
        {
          id: 's-2',
          question: 'How do I protect my funds?',
          answer: 'Use hardware wallets for large amounts, never share your private keys, verify contract addresses before transactions, and start with small amounts to test functionality.'
        },
        {
          id: 's-3',
          question: 'What if I encounter a suspicious transaction?',
          answer: 'If you notice anything suspicious, immediately disconnect your wallet, report the issue to security@boing.finance, and check your transaction history for any unauthorized activity.'
        },
        {
          id: 's-4',
          question: 'Are my private keys stored on your servers?',
          answer: 'No, we never have access to your private keys. All transactions are signed locally by your wallet. We only interact with your wallet through standard Web3 protocols.'
        }
      ]
    },
    {
      title: 'Technical',
      icon: '⚙️',
      items: [
        {
          id: 'tech-1',
          question: 'What blockchain technology does boing.finance use?',
          answer: 'boing.finance uses smart contracts built on Ethereum and compatible networks. We use the Automated Market Maker (AMM) model with constant product formula (x * y = k) for price discovery.'
        },
        {
          id: 'tech-2',
          question: 'How do you ensure price accuracy?',
          answer: 'We integrate with Chainlink price feeds for accurate pricing and use multiple validation sources to prevent price manipulation. Our AMM model ensures fair price discovery through supply and demand.'
        },
        {
          id: 'tech-3',
          question: 'What happens during network congestion?',
          answer: 'During high congestion, transactions may take longer or fail due to gas price fluctuations. We recommend setting higher gas limits and monitoring network conditions before making large transactions.'
        },
        {
          id: 'tech-4',
          question: 'Can I use boing.finance on mobile?',
          answer: 'Yes, boing.finance is fully responsive and works on mobile devices. You can connect mobile wallets like MetaMask Mobile, Trust Wallet, or WalletConnect-compatible wallets.'
        }
      ]
    },
    {
      title: 'Support',
      icon: '❓',
      items: [
        {
          id: 'sup-1',
          question: 'How can I get help?',
          answer: 'You can reach our support team through <a href="https://discord.gg/7RDtQtQvBW" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Discord</a>, <a href="https://t.me/boing_finance" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Telegram</a>, email at support@boing.finance, or by submitting a ticket through our help center. We typically respond within 24 hours.'
        },
        {
          id: 'sup-2',
          question: 'Where can I find more information?',
          answer: 'Check our comprehensive documentation, join our community <a href="https://discord.gg/7RDtQtQvBW" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Discord</a>/<a href="https://t.me/boing_finance" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Telegram</a>, follow us on <a href="https://twitter.com/boing_finance" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Twitter</a> for updates, or read our blog for detailed guides and tutorials.'
        },
        {
          id: 'sup-3',
          question: 'How do I report a bug?',
          answer: 'Report bugs through our GitHub issues page, <a href="https://discord.gg/7RDtQtQvBW" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Discord #bug-reports channel</a>, or email bugs@boing.finance. Include detailed steps to reproduce the issue and any error messages.'
        },
        {
          id: 'sup-4',
          question: 'Is there a community forum?',
          answer: 'Yes, we have active communities on <a href="https://discord.gg/7RDtQtQvBW" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Discord</a> and <a href="https://t.me/boing_finance" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Telegram</a> where users can ask questions, share experiences, and get help from both our team and other community members.'
        }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Frequently Asked Questions</h2>
        <p className=" text-lg"
          style={{ color: 'var(--text-secondary)'  }}>
          Find answers to common questions about boing.finance. Can't find what you're looking for? 
          Contact our support team for assistance.
        </p>
      </div>

      {/* Search Bar */}
      <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
        <div className="relative">
          <label htmlFor="faq-search" className="sr-only">Search FAQs</label>
          <input
            id="faq-search"
            name="faqSearch"
            type="text"
            placeholder="Search FAQs..."
            className="w-full bg-gray-700 border  rounded-lg px-4 py-3 style={{ color: 'var(--text-primary)' }} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ borderColor: 'var(--border-color)'  }}
          />
          <div className="absolute right-3 top-3 text-gray-400">
            🔍
          </div>
        </div>
      </div>

      {/* FAQ Categories */}
      <div className="space-y-6">
        {faqCategories.map((category) => (
          <div key={category.title} className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
            <h3 className="text-xl font-semibold  mb-4 flex items-center"
          style={{ color: 'var(--text-primary)'  }}>
              <span className="mr-3">{category.icon}</span>
              {category.title}
            </h3>
            
            <div className="space-y-3">
              {category.items.map((item) => (
                <div key={item.id} className="border  rounded-lg"
          style={{ borderColor: 'var(--border-color)'  }}>
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-700 transition-colors"
                  >
                    <span className=" font-medium"
          style={{ color: 'var(--text-primary)'  }}>{item.question}</span>
                    <span className="text-gray-400 text-xl">
                      {openItems.has(item.id) ? '−' : '+'}
                    </span>
                  </button>
                  
                  {openItems.has(item.id) && (
                    <div className="px-4 pb-3">
                      <p className=" text-sm leading-relaxed"
          style={{ color: 'var(--text-secondary)'  }}>
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Contact Support */}
      <div className=" rounded-lg p-6 border style={{ borderColor: 'var(--border-color)' }}"
          style={{ backgroundColor: 'var(--bg-card)'  }}>
        <div className="text-center">
          <h3 className="text-xl font-semibold  mb-4"
          style={{ color: 'var(--text-primary)'  }}>Still Need Help?</h3>
          <p className=" mb-6"
          style={{ color: 'var(--text-secondary)'  }}>
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="mailto:support@boing.finance"
              className="bg-blue-600 hover:bg-blue-700  px-6 py-3 rounded-lg transition-colors flex items-center justify-center"
          style={{ color: 'var(--text-primary)'  }}
            >
              📧 Email Support
            </a>
            <a
              href="https://discord.gg/7RDtQtQvBW"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-600 hover:bg-purple-700  px-6 py-3 rounded-lg transition-colors flex items-center justify-center"
          style={{ color: 'var(--text-primary)'  }}
            >
              💬 Discord
            </a>
            <a
              href="https://t.me/boing_finance"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-500 hover:bg-blue-600  px-6 py-3 rounded-lg transition-colors flex items-center justify-center"
          style={{ color: 'var(--text-primary)'  }}
            >
              📱 Telegram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQSection; 
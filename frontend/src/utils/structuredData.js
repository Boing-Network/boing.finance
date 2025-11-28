// Structured Data (JSON-LD) Generator
// Generates structured data for SEO

export const generateOrganizationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'boing.finance',
    url: 'https://boing.finance',
    logo: 'https://boing.finance/logo.svg',
    description: 'Deploy tokens, create liquidity pools, and trade across multiple blockchains with boing.finance - the most user-friendly decentralized exchange (DEX) for token deployment and cross-chain trading.',
    sameAs: [
      'https://twitter.com/boingfinance'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      url: 'https://boing.finance/contact-us'
    }
  };
};

export const generateWebSiteSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'boing.finance',
    url: 'https://boing.finance',
    description: 'Deploy tokens, create liquidity pools, and trade across multiple blockchains with boing.finance.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://boing.finance/tokens?search={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };
};

export const generateFinancialProductSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    name: 'boing.finance DeFi Platform',
    description: 'Decentralized exchange for token deployment, liquidity pools, and cross-chain trading.',
    provider: {
      '@type': 'Organization',
      name: 'boing.finance',
      url: 'https://boing.finance'
    },
    category: 'Cryptocurrency Exchange',
    feesAndCommissionsSpecification: {
      '@type': 'UnitPriceSpecification',
      priceCurrency: 'USD',
      price: '0.3',
      unitText: 'percentage'
    }
  };
};

export const generateTokenSchema = (tokenData) => {
  if (!tokenData) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Thing',
    name: tokenData.name,
    description: tokenData.description || `Token: ${tokenData.symbol}`,
    identifier: tokenData.address,
    image: tokenData.logoUrl || `https://boing.finance/logo.svg`,
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Symbol',
        value: tokenData.symbol
      },
      {
        '@type': 'PropertyValue',
        name: 'Network',
        value: tokenData.network || 'Ethereum'
      },
      {
        '@type': 'PropertyValue',
        name: 'Total Supply',
        value: tokenData.totalSupply || '0'
      }
    ]
  };
};


// Token Templates Component
// Pre-configured token templates for quick deployment

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNetworkByChainId, NETWORKS } from '../config/networks';
import OptimizedImage from './OptimizedImage';
import toast from 'react-hot-toast';

const TOKEN_TEMPLATES = [
  {
    id: 'defi-standard',
    name: 'DeFi Standard',
    description: 'Standard DeFi token with basic security features',
    category: 'DeFi',
    icon: '💎',
    features: ['Standard ERC20', 'Basic Security', 'Mintable'],
    securityFeatures: ['renounceMint'],
    recommendedNetworks: [1, 137, 56], // Ethereum, Polygon, BSC
    estimatedCost: '0.01 ETH'
  },
  {
    id: 'nft-utility',
    name: 'NFT Utility Token',
    description: 'Token for NFT projects with utility features',
    category: 'NFT',
    icon: '🖼️',
    features: ['ERC20', 'Utility Features', 'Community Focused'],
    securityFeatures: ['renounceMint', 'maxTxAmount'],
    recommendedNetworks: [1, 137],
    estimatedCost: '0.01 ETH'
  },
  {
    id: 'gaming-token',
    name: 'Gaming Token',
    description: 'Token optimized for gaming ecosystems',
    category: 'Gaming',
    icon: '🎮',
    features: ['Fast Transfers', 'Gaming Optimized', 'Reward System Ready'],
    securityFeatures: ['maxTxAmount', 'cooldown'],
    recommendedNetworks: [137, 56], // Polygon, BSC (lower fees)
    estimatedCost: '0.005 ETH'
  },
  {
    id: 'meme-token',
    name: 'Meme Token',
    description: 'Simple meme token with basic features',
    category: 'Meme',
    icon: '🐸',
    features: ['Simple Setup', 'Community Driven', 'Low Cost'],
    securityFeatures: [],
    recommendedNetworks: [137, 56], // Lower fees for meme tokens
    estimatedCost: '0.003 ETH'
  },
  {
    id: 'enterprise-token',
    name: 'Enterprise Token',
    description: 'Enterprise-grade token with advanced security',
    category: 'Enterprise',
    icon: '🏢',
    features: ['Advanced Security', 'Compliance Ready', 'Multi-Sig Support'],
    securityFeatures: ['renounceMint', 'enableFreezing', 'enableBlacklist', 'maxTxAmount', 'timelock'],
    recommendedNetworks: [1], // Ethereum mainnet for enterprise
    estimatedCost: '0.05 ETH'
  },
  {
    id: 'dao-governance',
    name: 'DAO Governance Token',
    description: 'Token designed for DAO governance',
    category: 'DAO',
    icon: '🗳️',
    features: ['Governance Ready', 'Voting Enabled', 'DAO Integration'],
    securityFeatures: ['renounceMint', 'timelock', 'maxWallet'],
    recommendedNetworks: [1, 137],
    estimatedCost: '0.02 ETH'
  }
];

const TokenTemplates = ({ onSelectTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const navigate = useNavigate();

  const categories = ['all', ...new Set(TOKEN_TEMPLATES.map(t => t.category))];

  const filteredTemplates = selectedCategory === 'all'
    ? TOKEN_TEMPLATES
    : TOKEN_TEMPLATES.filter(t => t.category === selectedCategory);

  const handleUseTemplate = (template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    } else {
      // Navigate to deploy page with template pre-filled
      const templateData = {
        templateId: template.id,
        templateName: template.name,
        securityFeatures: template.securityFeatures || [],
        recommendedNetwork: template.recommendedNetworks[0],
        // Pre-fill form data
      };
      
      // Store template data in sessionStorage
      sessionStorage.setItem('selectedTemplate', JSON.stringify(templateData));
      
      // Navigate to deploy page
      navigate('/deploy-token', { state: { template: templateData } });
      toast.success(`Using ${template.name} template`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Token Templates
        </h2>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          Choose a pre-configured template to deploy your token quickly
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="rounded-lg border p-6 cursor-pointer transition-all hover:shadow-xl"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: selectedTemplate === template.id ? 'var(--color-primary)' : 'var(--border-color)',
              borderWidth: selectedTemplate === template.id ? '2px' : '1px'
            }}
            onClick={() => setSelectedTemplate(template.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-4xl">{template.icon}</div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {template.name}
                  </h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                    {template.category}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              {template.description}
            </p>

            {/* Features */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Features:
              </h4>
              <ul className="space-y-1">
                {template.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <svg className="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Security Features */}
            {template.securityFeatures.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Security Features:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {template.securityFeatures.map((feature, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Networks */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Recommended Networks:
              </h4>
              <div className="flex flex-wrap gap-2">
                {template.recommendedNetworks.map((chainId) => {
                  const network = getNetworkByChainId(chainId);
                  return network ? (
                    <span
                      key={chainId}
                      className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300"
                    >
                      {network.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {/* Cost */}
            <div className="mb-4 pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Estimated Cost:
                </span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {template.estimatedCost}
                </span>
              </div>
            </div>

            {/* Use Template Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUseTemplate(template);
              }}
              className="w-full px-4 py-2 rounded-lg font-semibold transition-colors"
              style={{
                backgroundColor: selectedTemplate === template.id ? 'var(--color-primary)' : 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)'
              }}
            >
              Use This Template
            </button>
          </div>
        ))}
      </div>

      {/* Template Info */}
      {selectedTemplate && (
        <div className="mt-6 p-4 rounded-lg border" style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)'
        }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            <strong>Note:</strong> Templates provide a starting point. You can customize all settings before deployment.
          </p>
        </div>
      )}
    </div>
  );
};

export default TokenTemplates;


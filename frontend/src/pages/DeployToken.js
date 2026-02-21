import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { useAchievements } from '../contexts/AchievementContext';
import { useChainType, useSolanaWallet } from '../contexts/SolanaWalletContext';
import { createSPLToken } from '../services/solanaTokenService';
import { SOLANA_NETWORKS } from '../config/solanaConfig';
import toast from 'react-hot-toast';
import AdvancedERC20Artifact from '../artifacts/AdvancedERC20.json';
import TokenFactoryArtifact from '../artifacts/TokenFactory.json';
import TokenImplementationArtifact from '../artifacts/TokenImplementation.json';
import { Helmet } from 'react-helmet-async';
import { getContractAddress } from '../config/contracts';
import LogoUpload from '../components/LogoUpload';
import { uploadMetadataToIPFS, createTokenMetadata } from '../utils/ipfsUpload';
import EnhancedAnimatedBackground from '../components/EnhancedAnimatedBackground';
import TokenPreview from '../components/TokenPreview';
import DeploymentProgress from '../components/DeploymentProgress';
import DeploymentHistory from '../components/DeploymentHistory';
import LaunchWizard from '../components/LaunchWizard';
import FairLaunchChecklist from '../components/FairLaunchChecklist';
import { deploymentHistory as deploymentHistoryUtil } from '../utils/deploymentHistory';
import { notificationService } from '../utils/notifications';
import ShareCardModal from '../components/ShareCardModal';

// Import ABI and bytecode from the artifacts
const ERC20_ABI = AdvancedERC20Artifact.abi;
const ERC20_BYTECODE = AdvancedERC20Artifact.bytecode;
const TOKEN_FACTORY_ABI = TokenFactoryArtifact.abi;
const _TOKEN_IMPLEMENTATION_ABI = TokenImplementationArtifact.abi;

// MochiAstronaut component

// Toggle Button Component
function ToggleButton({ enabled, onToggle, disabled, size = "md" }) {
  const sizeClasses = {
    sm: "w-11 h-6",
    md: "w-14 h-7",
    lg: "w-16 h-8"
  };
  
  const dotSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6"
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`
        ${sizeClasses[size]} relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
        ${enabled 
          ? 'bg-blue-600 hover:bg-blue-700' 
          : 'bg-gray-600 hover:bg-gray-500'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          ${dotSizeClasses[size]} inline-block transform transition-transform duration-200 ease-in-out bg-white rounded-full shadow-lg
          ${enabled ? 'translate-x-7' : 'translate-x-1'}
        `}
      />
    </button>
  );
}

// Record Solana deployment to backend (non-blocking)
async function recordSolanaDeployment({ mintAddress, creatorAddress, network, type, name, symbol, metadataUri, signature }) {
  try {
    const url = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8787';
    await fetch(`${url}/api/solana/deployments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mintAddress, creatorAddress, network, type, name, symbol, metadataUri, signature }),
    });
  } catch (e) {
    console.warn('Record deployment failed:', e);
  }
}

// Solana SPL Token Deploy (shown when chain type is Solana)
function DeployTokenSolanaContent() {
  const { connection, address, connected, connectWallet, signTransaction, network } = useSolanaWallet();
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimals, setDecimals] = useState(9);
  const [initialSupply, setInitialSupply] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [mintAddress, setMintAddress] = useState('');
  const [signature, setSignature] = useState('');

  const solanaNetwork = SOLANA_NETWORKS[network] || SOLANA_NETWORKS.devnet;

  const handleDeploy = async (e) => {
    e.preventDefault();
    if (!connected || !address || !connection || !signTransaction) {
      toast.error('Please connect your Solana wallet first.');
      return;
    }
    if (!name.trim() || !symbol.trim()) {
      toast.error('Name and symbol are required.');
      return;
    }
    setDeploying(true);
    setMintAddress('');
    setSignature('');
    try {
      const result = await createSPLToken(connection, address, signTransaction, {
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        decimals: Number(decimals) || 9,
        initialSupply: initialSupply || '0',
        logoFile: logoFile || undefined,
      });
      setMintAddress(result.mintAddress);
      setSignature(result.signature);
      toast.success('SPL token deployed successfully!');
      recordSolanaDeployment({
        mintAddress: result.mintAddress,
        creatorAddress: address,
        network,
        type: 'token',
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        metadataUri: result.metadataUri,
        signature: result.signature,
      });
    } catch (err) {
      console.error('SPL deploy error:', err);
      toast.error(err?.message || 'Failed to deploy SPL token');
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <EnhancedAnimatedBackground />
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto">
          <Helmet>
            <title>Deploy SPL Token - Solana | Boing Finance</title>
          </Helmet>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Deploy SPL Token
            </h1>
            <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
              Create an SPL token on Solana {solanaNetwork.name}
            </p>
          </div>

          {!connected ? (
            <div className="rounded-xl border p-8 text-center" style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
            }}>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                Connect your Solana wallet (Phantom, Solflare) to deploy an SPL token.
              </p>
              <button
                onClick={() => connectWallet?.()}
                className="px-6 py-3 rounded-lg font-medium"
                style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
              >
                Connect Solana Wallet
              </button>
            </div>
          ) : (
            <form onSubmit={handleDeploy} className="rounded-xl border p-6 space-y-4" style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
            }}>
              <div>
                <label htmlFor="deploy-solana-logo" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Token Logo (optional)</label>
                <input
                  id="deploy-solana-logo"
                  name="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                />
              </div>
              <div>
                <label htmlFor="deploy-solana-name" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Token Name</label>
                <input
                  id="deploy-solana-name"
                  name="name"
                  type="text"
                  autoComplete="off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Token"
                  maxLength={32}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label htmlFor="deploy-solana-symbol" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Symbol</label>
                <input
                  id="deploy-solana-symbol"
                  name="symbol"
                  type="text"
                  autoComplete="off"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="MTK"
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label htmlFor="deploy-solana-decimals" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Decimals</label>
                <input
                  id="deploy-solana-decimals"
                  name="decimals"
                  type="number"
                  min={0}
                  max={9}
                  value={decimals}
                  onChange={(e) => setDecimals(Number(e.target.value) || 9)}
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>9 is standard for Solana</p>
              </div>
              <div>
                <label htmlFor="deploy-solana-supply" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Initial Supply</label>
                <input
                  id="deploy-solana-supply"
                  name="initialSupply"
                  type="text"
                  value={initialSupply}
                  onChange={(e) => setInitialSupply(e.target.value)}
                  placeholder="1000000"
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <button
                type="submit"
                disabled={deploying}
                className="w-full px-6 py-3 rounded-lg font-medium disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
              >
                {deploying ? 'Deploying…' : 'Deploy SPL Token'}
              </button>
              {mintAddress && signature && (
                <div className="mt-4 pt-4 border-t space-y-2" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Deployed!</p>
                  <p className="text-xs break-all" style={{ color: 'var(--text-secondary)' }}>Mint: {mintAddress}</p>
                  <a
                    href={`${solanaNetwork.explorer}/tx/${signature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    View on Explorer
                  </a>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// Security Features Configuration
const SECURITY_FEATURES = [
  {
    name: "Mint Authority Removal",
    description: "Remove ability to create new tokens after deployment",
    enabled: true,
    risk: "Low",
    icon: "🔒",
    featureKey: "renounceMint"
  },
  {
    name: "Freezing Authority",
    description: "Allow freezing specific addresses (emergency control)",
    enabled: false,
    risk: "Medium",
    icon: "❄️",
    featureKey: "enableFreezing"
  },
  {
    name: "Blacklist Function",
    description: "Block specific addresses from trading",
    enabled: false,
    risk: "Medium",
    icon: "🚫",
    featureKey: "enableBlacklist"
  },
  {
    name: "Transaction Limits",
    description: "Set maximum transaction amounts",
    enabled: false,
    risk: "Low",
    icon: "📊",
    featureKey: "maxTxAmount"
  },
  {
    name: "Ownership Renouncement",
    description: "Transfer ownership to zero address (decentralization)",
    enabled: false,
    risk: "Very Low",
    icon: "🔒🔒🔒🔒",
    featureKey: "renounceOwnership"
  },
  {
    name: "Anti-Bot Protection",
    description: "Prevent automated trading bots and MEV attacks",
    enabled: false,
    risk: "Low",
    icon: "🤖",
    featureKey: "antiBot"
  },
  {
    name: "Cooldown Period",
    description: "Add delay between transactions to prevent rapid trading",
    enabled: false,
    risk: "Low",
    icon: "⏰",
    featureKey: "cooldown"
  },
  {
    name: "Anti-Whale Protection",
    description: "Limit maximum wallet holdings to prevent concentration",
    enabled: false,
    risk: "Low",
    icon: "🐋",
    featureKey: "antiWhale"
  },
  {
    name: "Pause Functionality",
    description: "Emergency pause all trading (owner only)",
    enabled: false,
    risk: "Medium",
    icon: "⏸️",
    featureKey: "pauseFunction"
  },
  {
    name: "Timelock Contract",
    description: "Add delay to administrative functions",
    enabled: false,
    risk: "Very Low",
    icon: "⏳",
    featureKey: "timelock"
  },
  {
    name: "Max Wallet Limit",
    description: "Set maximum tokens per wallet address",
    enabled: false,
    risk: "Low",
    icon: "💼",
    featureKey: "maxWallet"
  }
];

// Social Standards for Web3 Community
const _SOCIAL_STANDARDS = [
  {
    name: "Website",
    description: "Official project website",
    required: true,
    placeholder: "https://yourproject.com",
    icon: "🌐"
  },
  {
    name: "Twitter/X",
    description: "Official social media account",
    required: false,
    placeholder: "https://twitter.com/yourproject",
    icon: "🐦"
  },
  {
    name: "Telegram",
    description: "Community chat group",
    required: false,
    placeholder: "https://t.me/yourproject",
    icon: "📱"
  },
  {
    name: "Discord",
    description: "Community server",
    required: false,
    placeholder: "https://discord.gg/yourproject",
    icon: "🎮"
  },
  {
    name: "GitHub",
    description: "Source code repository",
    required: false,
    placeholder: "https://github.com/yourproject",
    icon: "💻"
  },
  {
    name: "Medium",
    description: "Project blog/updates",
    required: false,
    placeholder: "https://medium.com/@yourproject",
    icon: "📝"
  },
  {
    name: "Reddit",
    description: "Community subreddit",
    required: false,
    placeholder: "https://reddit.com/r/yourproject",
    icon: "🤖"
  }
];

// Service Charge Configuration - Network-aware pricing
const SERVICE_CHARGES = {
  basic: {
    name: "Basic",
    prices: {
      1: { amount: 0.05, currency: 'ETH' }, // Ethereum ~$100-150
      137: { amount: 25, currency: 'MATIC' }, // Polygon ~$20-30
      56: { amount: 0.05, currency: 'BNB' }, // BSC ~$15-25
      42161: { amount: 0.01, currency: 'ETH' }, // Arbitrum ~$20-30
      10: { amount: 0.015, currency: 'ETH' }, // Optimism ~$30-45
      8453: { amount: 0.01, currency: 'ETH' }, // Base ~$20-30
      43114: { amount: 0.5, currency: 'AVAX' }, // Avalanche ~$15-25
      250: { amount: 50, currency: 'FTM' }, // Fantom ~$15-25
      59144: { amount: 0.005, currency: 'ETH' }, // Linea ~$10-20
      324: { amount: 0.005, currency: 'ETH' }, // zkSync Era ~$10-20
      534352: { amount: 0.005, currency: 'ETH' }, // Scroll ~$10-20
      1101: { amount: 0.005, currency: 'ETH' }, // Polygon zkEVM ~$10-20
      5000: { amount: 25, currency: 'MNT' }, // Mantle ~$15-25
      81457: { amount: 0.005, currency: 'ETH' }, // Blast ~$10-20
      204: { amount: 0.002, currency: 'BNB' }, // opBNB ~$1-3
      34443: { amount: 0.002, currency: 'ETH' }, // Mode ~$3-8
      11155111: { amount: 0.001, currency: 'ETH' }, // Sepolia ~$2-3
      80001: { amount: 2, currency: 'MATIC' }, // Mumbai ~$1.60-2.40
      97: { amount: 0.005, currency: 'tBNB' }, // BSC Testnet ~$1.50-2.50
    },
    features: [
      "Standard ERC-20 deployment",
      "Basic security features",
      "Contract verification",
      "Email support"
    ],
    allowedFeatures: [
      "renounceMint"
    ],
    color: "blue"
  },
  professional: {
    name: "Professional",
    prices: {
      1: { amount: 0.15, currency: 'ETH' }, // Ethereum ~$300-450
      137: { amount: 75, currency: 'MATIC' }, // Polygon ~$60-90
      56: { amount: 0.15, currency: 'BNB' }, // BSC ~$45-75
      42161: { amount: 0.03, currency: 'ETH' }, // Arbitrum ~$60-90
      10: { amount: 0.045, currency: 'ETH' }, // Optimism ~$90-135
      8453: { amount: 0.03, currency: 'ETH' }, // Base ~$60-90
      43114: { amount: 1.5, currency: 'AVAX' }, // Avalanche ~$45-75
      250: { amount: 150, currency: 'FTM' }, // Fantom ~$45-75
      59144: { amount: 0.015, currency: 'ETH' }, // Linea ~$30-60
      324: { amount: 0.015, currency: 'ETH' }, // zkSync Era ~$30-60
      534352: { amount: 0.015, currency: 'ETH' }, // Scroll ~$30-60
      1101: { amount: 0.015, currency: 'ETH' }, // Polygon zkEVM ~$30-60
      5000: { amount: 75, currency: 'MNT' }, // Mantle ~$45-75
      81457: { amount: 0.015, currency: 'ETH' }, // Blast ~$30-60
      204: { amount: 0.006, currency: 'BNB' }, // opBNB ~$3-9
      34443: { amount: 0.006, currency: 'ETH' }, // Mode ~$9-24
      11155111: { amount: 0.003, currency: 'ETH' }, // Sepolia ~$6-9
      80001: { amount: 6, currency: 'MATIC' }, // Mumbai ~$4.80-7.20
      97: { amount: 0.015, currency: 'tBNB' }, // BSC Testnet ~$4.50-7.50
    },
    features: [
      "Advanced security features",
      "Freezing authority",
      "Blacklist function",
      "Transaction limits",
      "Anti-bot protection",
      "Cooldown periods",
      "Priority support",
      "Analytics dashboard access"
    ],
    allowedFeatures: [
      "renounceMint",
      "enableFreezing",
      "enableBlacklist",
      "maxTxAmount",
      "antiBot",
      "cooldown"
    ],
    color: "purple"
  },
  enterprise: {
    name: "Enterprise",
    prices: {
      1: { amount: 0.3, currency: 'ETH' }, // Ethereum ~$600-900
      137: { amount: 150, currency: 'MATIC' }, // Polygon ~$120-180
      56: { amount: 0.3, currency: 'BNB' }, // BSC ~$90-150
      42161: { amount: 0.06, currency: 'ETH' }, // Arbitrum ~$120-180
      10: { amount: 0.09, currency: 'ETH' }, // Optimism ~$180-270
      8453: { amount: 0.06, currency: 'ETH' }, // Base ~$120-180
      43114: { amount: 3, currency: 'AVAX' }, // Avalanche ~$90-150
      250: { amount: 300, currency: 'FTM' }, // Fantom ~$90-150
      59144: { amount: 0.03, currency: 'ETH' }, // Linea ~$60-120
      324: { amount: 0.03, currency: 'ETH' }, // zkSync Era ~$60-120
      534352: { amount: 0.03, currency: 'ETH' }, // Scroll ~$60-120
      1101: { amount: 0.03, currency: 'ETH' }, // Polygon zkEVM ~$60-120
      5000: { amount: 150, currency: 'MNT' }, // Mantle ~$90-150
      81457: { amount: 0.03, currency: 'ETH' }, // Blast ~$60-120
      204: { amount: 0.012, currency: 'BNB' }, // opBNB ~$6-18
      34443: { amount: 0.012, currency: 'ETH' }, // Mode ~$18-48
      11155111: { amount: 0.006, currency: 'ETH' }, // Sepolia ~$12-18
      80001: { amount: 12, currency: 'MATIC' }, // Mumbai ~$9.60-14.40
      97: { amount: 0.03, currency: 'tBNB' }, // BSC Testnet ~$9-15
    },
    features: [
      "All Professional features",
      "Anti-whale protection",
      "Pause functionality",
      "Timelock contracts",
      "Max wallet limits",
      "Custom contract features",
      "Multi-chain deployment",
      "Legal compliance tools",
      "Dedicated support",
      "White-label options"
    ],
    allowedFeatures: [
      "renounceMint",
      "enableFreezing",
      "enableBlacklist",
      "maxTxAmount",
      "renounceOwnership",
      "antiBot",
      "cooldown",
      "antiWhale",
      "pauseFunction",
      "timelock",
      "maxWallet"
    ],
    color: "green"
  }
};

// Deployment Tips
const DEPLOYMENT_TIPS = [
  // Basic Token Information
  "Choose a memorable name that reflects your token's purpose",
  "Keep symbol short (3-8 characters) and unique",
  "18 decimals is standard for most tokens",
  "Consider initial supply carefully - it affects tokenomics",
  
  // Pre-deployment Security
  "Test on testnet before mainnet deployment",
  "Verify your contract on block explorers after deployment",
  "Set up social media accounts before deployment",
  "Provide clear project description and website",
  
  // Critical Security Features
  "🔒 Enable mint authority removal for security",
  "🛡️ Consider freezing authority for emergency control",
  "🚫 Enable blacklist function for compliance",
  "📊 Set maximum transaction limits (0.1-10%)",
  
  // Liquidity & Trading Security
  "💧 Lock liquidity for 90+ days minimum",
  "🔐 Use timelock contracts for ownership changes",
  "📈 Consider renouncing ownership for decentralization",
  "⚡ Set reasonable gas limits for transactions",
  
  // Community & Transparency
  "🌐 Provide official website and social links",
  "📝 Maintain clear documentation and roadmap",
  "🔍 Make source code open source and verified",
  "📊 Regular updates and community engagement",
  
  // Post-deployment Actions
  "✅ Verify contract on Etherscan immediately",
  "🔗 Add liquidity to DEX for trading",
  "📢 Announce deployment on social media",
  "📋 Document all security features implemented"
];

// Utility: Manual deployment using Interface encoding (Hardhat-style)
async function _manualDeployWithInterface({ signer, ERC20_ABI, ERC20_BYTECODE, constructorParams, serviceChargeWei }) {
  const iface = new ethers.Interface(ERC20_ABI);
  // Find the constructor fragment
  const constructorFragment = iface.fragments.find(f => f.type === 'constructor');
  if (!constructorFragment) throw new Error('Constructor not found in ABI');
  // Encode constructor params
  const encodedParams = iface.encodeDeploy(constructorParams);
  // Concatenate bytecode and encoded params
  const deploymentData = ERC20_BYTECODE + encodedParams.slice(2);
  // Send transaction
  const tx = await signer.sendTransaction({
    data: deploymentData,
    value: serviceChargeWei
  });
  return tx;
}

export default function DeployToken() {
  const location = useLocation();
  const chainTypeContext = useChainType();
  const isSolana = chainTypeContext?.isSolana ?? false;

  // Check for template data from navigation
  useEffect(() => {
    if (location.state?.template) {
      const template = location.state.template;
      // Apply template settings
      if (template.securityFeatures) {
        // Set security features based on template
        template.securityFeatures.forEach(_feature => {
          // Apply feature settings
        });
      }
      if (template.recommendedNetwork) {
        // Set recommended network
      }
      toast.success(`Template "${template.templateName}" loaded`);
    }
    
    // Also check sessionStorage
    const storedTemplate = sessionStorage.getItem('selectedTemplate');
    if (storedTemplate) {
      try {
        const _template = JSON.parse(storedTemplate);
        // Apply template settings
        sessionStorage.removeItem('selectedTemplate'); // Clear after use
      } catch (error) {
        console.error('Error parsing template data:', error);
      }
    }
  }, [location]);
  const { signer, account, isConnected, getCurrentNetwork } = useWallet();
  const { record: recordAchievement } = useAchievements() || {};
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimals, setDecimals] = useState(18);
  const [initialSupply, setInitialSupply] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [socialLinks, setSocialLinks] = useState({
    twitter: '',
    telegram: '',
    discord: '',
    github: '',
    medium: '',
    reddit: ''
  });
  
  // Security features state
  const [renounceMint, setRenounceMint] = useState(false);
  const [enableFreezing, setEnableFreezing] = useState(false);
  const [freezingAuthority, setFreezingAuthority] = useState('');
  const [enableBlacklist, setEnableBlacklist] = useState(false);
  const [maxTxAmount, setMaxTxAmount] = useState('');
  const [renounceOwnership, setRenounceOwnership] = useState(false);
  const [antiBotEnabled, setAntiBotEnabled] = useState(false);
  const [cooldownPeriod, setCooldownPeriod] = useState('');
  const [antiWhaleEnabled, setAntiWhaleEnabled] = useState(false);
  const [maxWalletEnabled, setMaxWalletEnabled] = useState(false);
  const [maxWalletPercentage, setMaxWalletPercentage] = useState('');
  const [pauseFunctionEnabled, setPauseFunctionEnabled] = useState(false);
  const [timelockEnabled, setTimelockEnabled] = useState(false);
  const [timelockDelay, setTimelockDelay] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [_activeTab, _setActiveTab] = useState('basic');
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [showPricing, setShowPricing] = useState(false);
  const [showRenounceModal, setShowRenounceModal] = useState(false);
  const [pendingRenounceContract, setPendingRenounceContract] = useState(null);
  const [showOwnershipRenounceModal, setShowOwnershipRenounceModal] = useState(false);
  const [ownershipRenounced, setOwnershipRenounced] = useState(false);

  // Logo and metadata state
  const [logoUrl, setLogoUrl] = useState('');
  const [_logoUploadResult, setLogoUploadResult] = useState(null);
  const [metadataUrl, setMetadataUrl] = useState('');
  const [_uploadingMetadata, setUploadingMetadata] = useState(false);

  // Launch Wizard (step-by-step mode) - classic removed, wizard only
  const [useWizardMode] = useState(true);
  const [wizardStep, setWizardStep] = useState(1);

  // Enhanced deployment features
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [deploymentSteps, setDeploymentSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [deploymentError, setDeploymentError] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState(null);

  // Get current network (safe - may be null when wallet not connected)
  const network = (typeof getCurrentNetwork === 'function' ? getCurrentNetwork() : null);

  // Helper function to get current pricing for selected network
  const getCurrentPricing = (planKey) => {
    console.log('getCurrentPricing called with planKey:', planKey);
    const chainId = network?.chainId || 1;
    console.log('getCurrentPricing Debug:', {
      planKey,
      chainId,
      networkChainId: network?.chainId,
      hasPlan: !!SERVICE_CHARGES[planKey],
      hasPrices: !!SERVICE_CHARGES[planKey]?.prices,
      hasChainId: !!SERVICE_CHARGES[planKey]?.prices?.[chainId],
      availableChainIds: Object.keys(SERVICE_CHARGES[planKey]?.prices || {}),
      SERVICE_CHARGES_keys: Object.keys(SERVICE_CHARGES)
    });
    
    const pricing = SERVICE_CHARGES[planKey]?.prices?.[chainId] || SERVICE_CHARGES[planKey]?.prices?.[1];
    
    console.log('Pricing lookup result:', pricing);
    
    if (!pricing) {
      console.error('No pricing found for:', { planKey, chainId });
      // Return a default pricing to prevent NaN
      return { amount: 0.001, currency: 'ETH' };
    }
    
    return pricing;
  };

  // Helper function to get current service charge
  const getCurrentServiceCharge = () => {
    const pricing = getCurrentPricing(selectedPlan);
    console.log('getCurrentServiceCharge Debug:', {
      selectedPlan,
      pricing,
      pricingType: typeof pricing,
      amount: pricing?.amount,
      amountType: typeof pricing?.amount
    });
    return pricing;
  };

  // Helper function to check if a feature is allowed for current plan
  const isFeatureAllowed = (featureKey) => {
    const plan = SERVICE_CHARGES[selectedPlan];
    return plan?.allowedFeatures?.includes(featureKey) ?? false;
  };

  // Helper function to get feature restriction message
  const getFeatureRestrictionMessage = (featureKey) => {
    const requiredPlan = Object.entries(SERVICE_CHARGES).find(([_key, plan]) => 
      plan.allowedFeatures.includes(featureKey)
    )?.[0];
    
    if (requiredPlan && requiredPlan !== selectedPlan) {
      return `Upgrade to ${SERVICE_CHARGES[requiredPlan].name} plan to access this feature`;
    }
    return null;
  };

  // Reset disabled features when plan changes
  useEffect(() => {
    const plan = SERVICE_CHARGES[selectedPlan];
    const allowed = plan?.allowedFeatures ?? [];
    // Reset features that are not allowed in the new plan
    if (!allowed.includes('enableFreezing')) {
      setEnableFreezing(false);
      setFreezingAuthority('');
    }
    if (!allowed.includes('enableBlacklist')) setEnableBlacklist(false);
    if (!allowed.includes('maxTxAmount')) setMaxTxAmount('');
    if (!allowed.includes('renounceOwnership')) setRenounceOwnership(false);
    if (!allowed.includes('antiBot')) setAntiBotEnabled(false);
    if (!allowed.includes('cooldown')) setCooldownPeriod('');
    if (!allowed.includes('antiWhale')) {
      setAntiWhaleEnabled(false);
      setMaxWalletEnabled(false);
      setMaxWalletPercentage('');
    }
    if (!allowed.includes('pauseFunction')) setPauseFunctionEnabled(false);
    if (!allowed.includes('timelock')) {
      setTimelockEnabled(false);
      setTimelockDelay('');
    }
    if (!allowed.includes('maxWallet')) {
      setMaxWalletEnabled(false);
      setMaxWalletPercentage('');
    }
  }, [selectedPlan]);

  // Set default values when features are enabled
  useEffect(() => {
    // Set default max transaction amount when enabled
    if (isFeatureAllowed('maxTxAmount') && maxTxAmount === '') {
      setMaxTxAmount('1'); // Default to 1%
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isFeatureAllowed from selectedPlan
  }, [maxTxAmount, selectedPlan]);

  useEffect(() => {
    // Set default cooldown period when enabled
    if (isFeatureAllowed('cooldown') && cooldownPeriod === '') {
      setCooldownPeriod('30'); // Default to 30 seconds
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isFeatureAllowed from selectedPlan
  }, [cooldownPeriod, selectedPlan]);

  useEffect(() => {
    // Set default max wallet percentage when enabled
    if (isFeatureAllowed('maxWallet') && maxWalletEnabled && maxWalletPercentage === '') {
      setMaxWalletPercentage('2'); // Default to 2%
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isFeatureAllowed from selectedPlan
  }, [maxWalletEnabled, maxWalletPercentage, selectedPlan]);

  // Close Deployment History modal on Escape key
  useEffect(() => {
    if (!showHistory) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') setShowHistory(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showHistory]);

  useEffect(() => {
    // Set default timelock delay when enabled
    if (isFeatureAllowed('timelock') && timelockEnabled && timelockDelay === '') {
      setTimelockDelay('24'); // Default to 24 hours
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isFeatureAllowed from selectedPlan
  }, [timelockEnabled, timelockDelay, selectedPlan]);

  // Update pricing display when network changes
  useEffect(() => {
    // Force re-render of pricing display when network changes
    // This ensures the pricing cards show the correct currency for the current network
  }, [network?.chainId]);

  // Debug logging
  useEffect(() => {
    console.log('DeployToken Debug State:', {
      isConnected,
      deploying,
      network: network?.name,
      chainId: network?.chainId,
      name,
      symbol,
      initialSupply,
      website,
      selectedPlan
    });
  }, [isConnected, deploying, network, name, symbol, initialSupply, website, selectedPlan]);

  const handleSocialLinkChange = (platform, value) => {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  // Map UI field names to state keys (reserved for future use)
  const _getSocialLinkKey = (platformName) => {
    const keyMap = {
      'Twitter': 'twitter',
      'Telegram': 'telegram',
      'Discord': 'discord',
      'GitHub': 'github',
      'Medium': 'medium',
      'Reddit': 'reddit'
    };
    return keyMap[platformName] || platformName.toLowerCase();
  };

  // Logo handling information (reserved for future use)
  const _LogoInfo = () => (
    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-300">Token Logo Information</h3>
          <div className="mt-2 text-sm text-blue-200">
            <p className="mb-2">
              <strong>Decentralized Approach:</strong> For true decentralization, consider these options:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>IPFS:</strong> Upload to IPFS and use the hash (e.g., ipfs://QmXxxx...)</li>
              <li><strong>Arweave:</strong> Permanent decentralized storage</li>
              <li><strong>On-chain:</strong> Store base64 data (expensive but truly decentralized)</li>
            </ul>
            <p className="mt-2 text-xs text-blue-300">
              <strong>Note:</strong> This app does not provide a logo upload feature. If you want your token to have a logo, you must handle it manually after deployment. Most projects use decentralized storage (like IPFS or Arweave) and submit the logo to token lists or explorers. See the docs of your preferred explorer for how to add a logo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Logo upload handlers
  const handleLogoUpload = (uploadResult) => {
    setLogoUploadResult(uploadResult);
    setLogoUrl(uploadResult.url);
  };

  const handleLogoChange = (url) => {
    setLogoUrl(url);
    if (!url) {
      setLogoUploadResult(null);
    }
  };

  const uploadTokenMetadata = async () => {
    if (!logoUrl && !name && !symbol) {
      return null; // No metadata to upload
    }

    setUploadingMetadata(true);
    try {
      const tokenData = {
        name,
        symbol,
        description,
        logoUrl,
        website,
        network: network?.name || 'Unknown',
        decimals,
        initialSupply,
        twitter: socialLinks.twitter,
        telegram: socialLinks.telegram,
        discord: socialLinks.discord,
        github: socialLinks.github,
        medium: socialLinks.medium,
        reddit: socialLinks.reddit,
        renounceMint: isFeatureAllowed('renounceMint') ? renounceMint : false,
        enableBlacklist: isFeatureAllowed('enableBlacklist') ? enableBlacklist : false,
        antiBotEnabled: isFeatureAllowed('antiBot') ? antiBotEnabled : false,
        antiWhaleEnabled: isFeatureAllowed('antiWhale') ? antiWhaleEnabled : false,
        pauseFunctionEnabled: isFeatureAllowed('pauseFunction') ? pauseFunctionEnabled : false,
        timelockEnabled: isFeatureAllowed('timelock') ? timelockEnabled : false
      };

      const metadata = createTokenMetadata(tokenData);
      const uploadResult = await uploadMetadataToIPFS(metadata);
      setMetadataUrl(uploadResult.url);
      return uploadResult.url;
    } catch (error) {
      console.error('Metadata upload error:', error);
      toast.error('Failed to upload metadata to IPFS');
      return null;
    } finally {
      setUploadingMetadata(false);
    }
  };

  const handleDeploy = async (e) => {
    e.preventDefault();
    if (!isConnected || !signer) {
      toast.error('Please connect your wallet');
      return;
    }
    if (!network) {
      toast.error('Please connect to a supported network. Try refreshing the page or reconnecting your wallet.');
      return;
    }
    if (!name || !symbol || !initialSupply || !website) {
      toast.error('Please fill in all required fields');
      return;
    }
    // Check if the network is supported
    const supportedChainIds = [1, 137, 56, 42161, 10, 8453, 11155111, 80001, 97];
    if (!supportedChainIds.includes(network.chainId)) {
      toast.error(`Network ${network.name} (${network.chainId}) is not supported. Please switch to a supported network.`);
      return;
    }
    // Only validate features that are allowed for the current plan
    if (isFeatureAllowed('enableFreezing') && enableFreezing && !freezingAuthority) {
      toast.error('Please specify freezing authority address');
      return;
    }
    if (isFeatureAllowed('maxTxAmount') && maxTxAmount && (maxTxAmount < 0.1 || maxTxAmount > 10)) {
      toast.error('Maximum transaction amount must be between 0.1% and 10%');
      return;
    }
    setDeploying(true);
    setTxHash('');
    setTokenAddress('');
    setDeploymentError(null);
    
    // Initialize deployment steps
    const steps = [
      { title: 'Preparing deployment', description: 'Validating token parameters...', estimatedTime: '5s' },
      { title: 'Uploading metadata', description: 'Storing token metadata on IPFS...', estimatedTime: '10s' },
      { title: 'Deploying contract', description: 'Creating smart contract on blockchain...', estimatedTime: '30s' },
      { title: 'Confirming transaction', description: 'Waiting for blockchain confirmation...', estimatedTime: '15s' },
      { title: 'Finalizing', description: 'Saving deployment details...', estimatedTime: '5s' }
    ];
    setDeploymentSteps(steps);
    setCurrentStepIndex(0);

    // Create deployment record
    const deploymentId = Date.now().toString();
    const deploymentRecord = {
      id: deploymentId,
      name,
      symbol,
      network: network,
      chainId: network?.chainId,
      status: 'deploying',
      deployerAddress: await signer.getAddress(),
      timestamp: Date.now(),
      date: new Date().toISOString()
    };
    deploymentHistoryUtil.add(deploymentRecord);

    try {
      // Step 1: Prepare deployment
      setCurrentStepIndex(0);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Upload logo and metadata to IPFS
      setCurrentStepIndex(1);
      let finalLogoUrl = logoUrl || 'https://placeholder.com/logo.png';
      let metadataUrl = null;
      
      if (logoUrl || name || symbol) {
        toast.loading('Uploading metadata to IPFS...', { id: 'metadata-upload' });
        metadataUrl = await uploadTokenMetadata();
        toast.dismiss('metadata-upload');
        
        if (metadataUrl) {
          toast.success('Metadata uploaded to IPFS successfully!');
        }
      }

      // Get service charge amount for current network
      let currentPricing;
      try {
        if (!selectedPlan || !SERVICE_CHARGES[selectedPlan]) {
          toast.error('Invalid plan selected. Please try again.');
          setDeploying(false);
          return;
        }
        currentPricing = getCurrentServiceCharge();
      } catch (pricingError) {
        toast.error('Error calculating service charge. Please try again.');
        setDeploying(false);
        return;
      }
      if (!currentPricing || typeof currentPricing.amount !== 'number') {
        toast.error('Unable to calculate service charge. Please try again.');
        setDeploying(false);
        return;
      }
      const serviceCharge = currentPricing.amount;
      if (isNaN(serviceCharge)) {
        toast.error('Service charge calculation error. Please try again.');
        setDeploying(false);
        return;
      }
      const serviceChargeWei = ethers.parseEther(serviceCharge.toString());
      // Check user balance
      const balance = await signer.provider.getBalance(await signer.getAddress());
      if (balance < serviceChargeWei) {
        toast.error(`Insufficient balance. You need ${serviceCharge} ${currentPricing.currency} for the service charge.`);
        return;
      }
      // Convert initial supply to correct decimals
      const supply = ethers.parseUnits(initialSupply.toString(), decimals);
      // Calculate max transaction amount (only if feature is allowed)
      let maxTx = 0n;
      if (isFeatureAllowed('maxTxAmount') && maxTxAmount) {
        const percentage = parseFloat(maxTxAmount);
        const basisPoints = Math.floor(percentage * 100);
        maxTx = (supply * ethers.toBigInt(basisPoints)) / 10000n;
      }
      // Calculate max wallet amount (only if feature is allowed)
      let maxWallet = 0n;
      if (isFeatureAllowed('maxWallet') && maxWalletEnabled) {
        const percentage = parseFloat(maxWalletPercentage);
        const basisPoints = Math.floor(percentage * 100);
        maxWallet = (supply * ethers.toBigInt(basisPoints)) / 10000n;
      }
      // Platform wallet address
      const platformWallet = "0xb24c5a62f8da57967a08e11c88fe18904f49920e";
      // Get deployer address for default freezing authority
      const deployerAddress = await signer.getAddress();
      // Prepare constructor parameters for new contract
      const constructorParams = [
        name,
        symbol,
        decimals,
        supply,
        (isFeatureAllowed('enableFreezing') && enableFreezing) ? (freezingAuthority || deployerAddress) : "0x0000000000000000000000000000000000000000",
        finalLogoUrl, // Use actual logo URL instead of placeholder
        website,
        description || 'No description provided',
        socialLinks.twitter || 'https://twitter.com/placeholder',
        socialLinks.telegram || 'https://t.me/placeholder',
        socialLinks.discord || 'https://discord.gg/placeholder',
        socialLinks.github || 'https://github.com/placeholder',
        socialLinks.medium || 'https://medium.com/@placeholder',
        socialLinks.reddit || 'https://reddit.com/r/placeholder',
        isFeatureAllowed('renounceMint') ? renounceMint : false,
        isFeatureAllowed('enableBlacklist') ? enableBlacklist : false,
        maxTx,
        platformWallet,
        serviceChargeWei,
        isFeatureAllowed('antiBot') ? antiBotEnabled : false,
        isFeatureAllowed('cooldown') ? ethers.toBigInt(cooldownPeriod || 0) : 0n,
        isFeatureAllowed('antiWhale') ? antiWhaleEnabled : false,
        maxWallet,
        isFeatureAllowed('pauseFunction') ? pauseFunctionEnabled : false,
        isFeatureAllowed('timelock') ? timelockEnabled : false,
        isFeatureAllowed('timelock') ? ethers.toBigInt((timelockDelay || 0) * 3600) : 0n, // Convert hours to seconds
        network?.chainId || 1 // Add chainId parameter for network-aware service fee validation
      ];
      // Validate parameter count
      if (constructorParams.length !== 27) {
        throw new Error(`Parameter count mismatch: expected 27, got ${constructorParams.length}`);
      }
      // Validate BigInt parameters
      const bigIntParams = [3, 16, 18, 20, 22, 25]; // supply, maxTx, serviceChargeWei, cooldownPeriod, maxWallet, timelockDelay
      bigIntParams.forEach(index => {
        if (typeof constructorParams[index] !== 'bigint') {
          throw new Error(`Parameter ${index} must be BigInt, got ${typeof constructorParams[index]}: ${constructorParams[index]}`);
        }
      });
      // Validate address parameters
      const addressParams = [4, 17]; // freezingAuthority, platformWallet
      addressParams.forEach(index => {
        if (typeof constructorParams[index] !== 'string' || !constructorParams[index].startsWith('0x')) {
          throw new Error(`Parameter ${index} must be valid address, got: ${constructorParams[index]}`);
        }
      });
      // Validate boolean parameters
      const booleanParams = [14, 15, 19, 21, 23, 24]; // renounceMint, enableBlacklist, antiBotEnabled, antiWhaleEnabled, pauseFunctionEnabled, timelockEnabled
      booleanParams.forEach(index => {
        if (typeof constructorParams[index] !== 'boolean') {
          throw new Error(`Parameter ${index} must be boolean, got ${typeof constructorParams[index]}: ${constructorParams[index]}`);
        }
      });
      // Validate number parameters
      if (typeof constructorParams[2] !== 'number') { // decimals
        throw new Error(`Parameter 2 (decimals) must be number, got ${typeof constructorParams[2]}: ${constructorParams[2]}`);
      }
      if (typeof constructorParams[26] !== 'number') { // chainId
        throw new Error(`Parameter 26 (chainId) must be number, got ${typeof constructorParams[26]}: ${constructorParams[26]}`);
      }
      
      // Debug logging
      console.log('Deployment Parameters:', {
        name,
        symbol,
        decimals,
        supply: supply.toString(),
        freezingAuthority: (isFeatureAllowed('enableFreezing') && enableFreezing) ? freezingAuthority : null,
        website,
        description: description || '',
        socialLinks,
        renounceMint: isFeatureAllowed('renounceMint') ? renounceMint : false,
        enableBlacklist: isFeatureAllowed('enableBlacklist') ? enableBlacklist : false,
        maxTx: maxTx.toString(),
        platformWallet,
        serviceChargeWei: serviceChargeWei.toString(),
        antiBotEnabled: isFeatureAllowed('antiBot') ? antiBotEnabled : false,
        cooldownPeriod: isFeatureAllowed('cooldown') ? cooldownPeriod : null,
        antiWhaleEnabled: isFeatureAllowed('antiWhale') ? antiWhaleEnabled : false,
        maxWallet: maxWallet.toString(),
        pauseFunctionEnabled: isFeatureAllowed('pauseFunction') ? pauseFunctionEnabled : false,
        timelockEnabled: isFeatureAllowed('timelock') ? timelockEnabled : false,
        timelockDelay: isFeatureAllowed('timelock') ? timelockDelay : 0,
        selectedPlan,
        serviceCharge,
        deployerAddress
      });
      
      // Check if TokenFactory is available for this network
      const tokenFactoryAddress = getContractAddress(network?.chainId, 'tokenFactory');
      const _tokenImplementationAddress = getContractAddress(network?.chainId, 'tokenImplementation');
      
      if (tokenFactoryAddress && tokenFactoryAddress !== '0x0000000000000000000000000000000000000000') {
        // Use TokenFactory system
        console.log('Using TokenFactory system for deployment');
        
        // Create TokenFactory contract instance
        const tokenFactory = new ethers.Contract(tokenFactoryAddress, TOKEN_FACTORY_ABI, signer);
        
        // Create token metadata struct
        const tokenMetadata = {
          logo: finalLogoUrl, // Use actual logo URL instead of placeholder
          website: website,
          description: description || 'No description provided',
          twitter: socialLinks.twitter || '',
          telegram: socialLinks.telegram || '',
          discord: socialLinks.discord || '',
          github: socialLinks.github || '',
          medium: socialLinks.medium || '',
          reddit: socialLinks.reddit || ''
        };
        
        // Create custom security configuration based on user selections
        const securityConfig = {
          enableBlacklist: isFeatureAllowed('enableBlacklist') ? enableBlacklist : false,
          enableAntiBot: isFeatureAllowed('antiBot') ? antiBotEnabled : false,
          enableAntiWhale: isFeatureAllowed('antiWhale') ? antiWhaleEnabled : false,
          enablePause: isFeatureAllowed('pauseFunction') ? pauseFunctionEnabled : false,
          enableTimelock: isFeatureAllowed('timelock') ? timelockEnabled : false,
          maxTxAmount: isFeatureAllowed('maxTxAmount') && maxTxAmount ? maxTx : 0n,
          maxWalletAmount: isFeatureAllowed('maxWallet') && maxWalletEnabled ? maxWallet : 0n,
          cooldownPeriod: isFeatureAllowed('cooldown') && cooldownPeriod ? ethers.toBigInt(cooldownPeriod) : 0n,
          timelockDelay: isFeatureAllowed('timelock') && timelockDelay ? ethers.toBigInt((timelockDelay || 0) * 3600) : 0n // Convert hours to seconds
        };
        
        console.log('Security Configuration:', {
          enableBlacklist: securityConfig.enableBlacklist,
          enableAntiBot: securityConfig.enableAntiBot,
          enableAntiWhale: securityConfig.enableAntiWhale,
          enablePause: securityConfig.enablePause,
          enableTimelock: securityConfig.enableTimelock,
          maxTxAmount: securityConfig.maxTxAmount.toString(),
          maxWalletAmount: securityConfig.maxWalletAmount.toString(),
          cooldownPeriod: securityConfig.cooldownPeriod.toString(),
          timelockDelay: securityConfig.timelockDelay.toString()
        });
        
        // Step 3: Deploy token through factory
        setCurrentStepIndex(2);
        const tx = await tokenFactory.deployToken(
          name,
          symbol,
          decimals,
          supply,
          tokenMetadata,
          securityConfig,
          isFeatureAllowed('renounceMint') ? renounceMint : false,
          (isFeatureAllowed('enableFreezing') && enableFreezing) ? (freezingAuthority || deployerAddress) : "0x0000000000000000000000000000000000000000", // freezingAuthority
          { value: serviceChargeWei }
        );
        
        setTxHash(tx.hash);
        deploymentHistoryUtil.updateStatus(deploymentId, 'deploying', tx.hash);
        toast.success(`Token deployment transaction sent! Hash: ${tx.hash}`);
        
        // Step 4: Wait for deployment
        setCurrentStepIndex(3);
        const receipt = await tx.wait();
        
        // Find the TokenDeployed event to get the deployed token address
        const tokenDeployedEvent = receipt.logs.find(log => {
          try {
            const parsed = tokenFactory.interface.parseLog(log);
            return parsed.name === 'TokenDeployed';
          } catch {
            return false;
          }
        });
        
        if (tokenDeployedEvent) {
          const parsedEvent = tokenFactory.interface.parseLog(tokenDeployedEvent);
          const deployedAddress = parsedEvent.args.tokenAddress;
          setTokenAddress(deployedAddress);
          
          // Step 5: Finalize
          setCurrentStepIndex(4);
          
          // Update deployment history
          deploymentHistoryUtil.updateStatus(deploymentId, 'completed', tx.hash);
          deploymentHistoryUtil.add({
            ...deploymentRecord,
            contractAddress: deployedAddress,
            txHash: tx.hash,
            status: 'completed',
            metadataUrl
          });
          
          toast.success(`Token deployed successfully! Address: ${deployedAddress}`);
          recordAchievement?.(account, 'token_deploy', 'first_deploy');

          // Show browser notification if enabled
          const deploymentNotificationSettings1 = JSON.parse(localStorage.getItem('boing_notification_settings') || '{"deployments": true}');
          if (deploymentNotificationSettings1.deployments) {
            await notificationService.notifyDeploymentSuccess(name, deployedAddress);
          }
          
          // Store deployment info
          const deploymentInfo = {
            tokenAddress: deployedAddress,
            name,
            symbol,
            decimals,
            initialSupply,
            website,
            description,
            servicePlan: selectedPlan,
            serviceCharge: serviceCharge,
            paymentTxHash: tx.hash,
            deploymentTxHash: tx.hash,
            network: network?.name || 'Unknown',
            chainId: network?.chainId || 0,
            deploymentMethod: 'TokenFactory',
            factoryAddress: tokenFactoryAddress,
            securityFeatures: {
              plan: selectedPlan,
              renounceMint: isFeatureAllowed('renounceMint') ? renounceMint : false,
              enableBlacklist: isFeatureAllowed('enableBlacklist') ? enableBlacklist : false,
              maxTxAmount: isFeatureAllowed('maxTxAmount') ? maxTxAmount : null,
              antiBot: isFeatureAllowed('antiBot') ? antiBotEnabled : false,
              cooldown: isFeatureAllowed('cooldown') ? cooldownPeriod : null,
              antiWhale: isFeatureAllowed('antiWhale') ? {
                enabled: antiWhaleEnabled,
                maxWalletPercentage: maxWalletPercentage
              } : null,
              pauseFunction: isFeatureAllowed('pauseFunction') ? pauseFunctionEnabled : false,
              timelock: isFeatureAllowed('timelock') ? {
                enabled: timelockEnabled,
                delay: timelockDelay
              } : null,
              maxWallet: isFeatureAllowed('maxWallet') ? {
                enabled: maxWalletEnabled,
                percentage: maxWalletPercentage
              } : null
            },
            socialLinks,
            deploymentDate: new Date().toISOString()
          };
          
          // Store in localStorage
          const existingDeployments = JSON.parse(localStorage.getItem('tokenDeployments') || '[]');
          existingDeployments.push(deploymentInfo);
          localStorage.setItem('tokenDeployments', JSON.stringify(existingDeployments));
          
          // Show success message with next steps
          const nextSteps = [
            '✅ Contract deployed successfully via TokenFactory',
            '🔍 Verify your contract on Etherscan',
            '💧 Add liquidity to DEX for trading',
            '📢 Announce deployment on social media',
            '📋 Document security features implemented'
          ];
          
          toast.success(`Next steps: ${nextSteps.join(' | ')}`);
          
        } else {
          throw new Error('TokenDeployed event not found in transaction receipt');
        }
        
      } else {
        // Fallback to direct deployment (legacy method)
        console.log('Using direct deployment (legacy method)');
        
        // Try deployment using the working approach directly
        try {
          // Use the working approach: factory.deploy with value parameter
          const factory = new ethers.ContractFactory(ERC20_ABI, ERC20_BYTECODE, signer);
          
          // Deploy with value parameter (this is the working approach)
          const contract = await factory.deploy(...constructorParams, { value: serviceChargeWei });
          
          setTxHash(contract.deploymentTransaction().hash);
          toast.success(`Token deployment transaction sent! Hash: ${contract.deploymentTransaction().hash}`);
          
          // Wait for deployment
          await contract.waitForDeployment();
          const deployedAddress = contract.target;
          setTokenAddress(deployedAddress);
          
          // Create contract instance
          const deployedContract = new ethers.Contract(deployedAddress, ERC20_ABI, signer);
          
          toast.success(`Token deployed successfully! Address: ${deployedAddress}`);
          recordAchievement?.(account, 'token_deploy', 'first_deploy');
          setShareData({ name, symbol, address: deployedAddress });
          setShareModalOpen(true);

          // Show browser notification if enabled
          const deploymentNotificationSettings2 = JSON.parse(localStorage.getItem('boing_notification_settings') || '{"deployments": true}');
          if (deploymentNotificationSettings2.deployments) {
            await notificationService.notifyDeploymentSuccess(name, deployedAddress);
          }
          
          // Handle post-deployment actions (only for allowed features)
          const postDeploymentActions = [];
          if (isFeatureAllowed('renounceMint') && renounceMint) {
            postDeploymentActions.push('Mint authority removed');
          }
          if (isFeatureAllowed('renounceOwnership') && renounceOwnership) {
            setPendingRenounceContract(deployedContract);
            setShowRenounceModal(true);
            // Return early to wait for user confirmation
            return;
          }
          
          // Store deployment info (only include allowed features)
          const deploymentInfo = {
            tokenAddress: deployedAddress,
            name,
            symbol,
            decimals,
            initialSupply,
            website,
            description,
            servicePlan: selectedPlan,
            serviceCharge: serviceCharge,
            paymentTxHash: contract.deploymentTransaction().hash,
            deploymentTxHash: contract.deploymentTransaction().hash,
            network: network?.name || 'Unknown',
            chainId: network?.chainId || 0,
            deploymentMethod: 'Direct',
            securityFeatures: {
              freezingAuthority: (isFeatureAllowed('enableFreezing') && enableFreezing) ? freezingAuthority : null,
              renounceMint: isFeatureAllowed('renounceMint') ? renounceMint : false,
              renounceOwnership: isFeatureAllowed('renounceOwnership') ? renounceOwnership : false,
              maxTxAmount: isFeatureAllowed('maxTxAmount') ? maxTxAmount : null,
              antiBot: isFeatureAllowed('antiBot') ? antiBotEnabled : false,
              cooldown: isFeatureAllowed('cooldown') ? cooldownPeriod : null,
              antiWhale: isFeatureAllowed('antiWhale') ? {
                enabled: antiWhaleEnabled,
                maxWalletPercentage: maxWalletPercentage
              } : null,
              pauseFunction: isFeatureAllowed('pauseFunction') ? pauseFunctionEnabled : false,
              timelock: isFeatureAllowed('timelock') ? {
                enabled: timelockEnabled,
                delay: timelockDelay
              } : null,
              maxWallet: isFeatureAllowed('maxWallet') ? {
                enabled: maxWalletEnabled,
                percentage: maxWalletPercentage
              } : null
            },
            socialLinks,
            deploymentDate: new Date().toISOString(),
            postDeploymentActions
          };
          
          // Store in localStorage
          const existingDeployments = JSON.parse(localStorage.getItem('tokenDeployments') || '[]');
          existingDeployments.push(deploymentInfo);
          localStorage.setItem('tokenDeployments', JSON.stringify(existingDeployments));
          
          toast.success(`Token deployed successfully! Address: ${deployedAddress}`);
          recordAchievement?.(account, 'token_deploy', 'first_deploy');
          setShareData({ name, symbol, address: deployedAddress });
          setShareModalOpen(true);

          // Show browser notification if enabled
          const deploymentNotificationSettings3 = JSON.parse(localStorage.getItem('boing_notification_settings') || '{"deployments": true}');
          if (deploymentNotificationSettings3.deployments) {
            await notificationService.notifyDeploymentSuccess(name, deployedAddress);
          }
          
          // Show success message with next steps
          const nextSteps = [
            '✅ Contract deployed successfully',
            '🔍 Verify your contract on Etherscan',
            '💧 Add liquidity to DEX for trading',
            '📢 Announce deployment on social media',
            '📋 Document security features implemented'
          ];
          
          if (postDeploymentActions.length > 0) {
            nextSteps.push(`🔒 Security features applied: ${postDeploymentActions.join(', ')}`);
          }
          
          toast.success(`Next steps: ${nextSteps.join(' | ')}`);
          
        } catch (error) {
          console.error('Deployment error:', error);
          toast.error(`Deployment failed: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error('Deployment error:', error);
      setDeploymentError(error.message);
      if (deploymentId) {
        deploymentHistoryUtil.updateStatus(deploymentId, 'failed');
      }
      toast.error(`Deployment failed: ${error.message}`);
    } finally {
      setDeploying(false);
      setCurrentStepIndex(0);
    }
  };

  // Add a function to handle user confirmation
  const handleConfirmRenounce = async () => {
    setShowRenounceModal(false);
    if (pendingRenounceContract) {
      try {
        toast('Sending second transaction to renounce ownership...');
        await pendingRenounceContract.renounceOwnership();
        setOwnershipRenounced(true);
        toast.success('Ownership renounced successfully!');
      } catch (err) {
        toast.error('Failed to renounce ownership: ' + err.message);
      } finally {
        setPendingRenounceContract(null);
      }
    }
  };

  if (isSolana) return <DeployTokenSolanaContent />;

  return (
    <>
      <Helmet>
        <title>Deploy Token | boing.finance — Create ERC20 & SPL Tokens, No Code</title>
        <meta name="description" content="Deploy your own token on EVM or Solana in minutes. No code required. Security features, fair launch, and cross-chain support with boing.finance." />
        <meta name="keywords" content="deploy token, create token, ERC20, SPL, boing finance, token launch, DeFi, no code" />
        <meta property="og:title" content="Deploy Token | boing.finance" />
        <meta property="og:description" content="Create your own token on EVM or Solana. No code. Security built in." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/deploy-token" />
        <meta property="og:site_name" content="boing.finance" />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Deploy Token | boing.finance" />
        <meta name="twitter:description" content="Create your own token on EVM or Solana. No code required." />
        <meta name="twitter:site" content="@boingfinance" />
        <link rel="canonical" href="https://boing.finance/deploy-token" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
        
        {/* Structured Data for DeployToken Page */}
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Deploy Token - Create Your Own Crypto Token",
          "url": "https://boing.finance/deploy-token",
          "description": "Deploy your own token on EVM or Solana in minutes. No code. Security and fair launch with boing.finance.",
          "mainEntity": {
            "@type": "Service",
            "name": "Token Deployment Service",
            "description": "Professional token deployment service with advanced security features and cross-chain support",
            "provider": {
              "@type": "Organization",
              "name": "Boing Finance"
            },
            "offers": {
              "@type": "Offer",
              "price": "0.01",
              "priceCurrency": "ETH",
              "description": "Deploy your own ERC20 token with advanced security features"
            }
          }
        })}
        </script>
      </Helmet>
      <div className="relative min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <EnhancedAnimatedBackground />
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Deploy Your Token
              </h1>
              <p className="text-xl max-w-3xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                Create and deploy your own ERC-20 token with advanced security features, 
                comprehensive documentation, and professional-grade infrastructure.
              </p>
              
              {/* Quick Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  style={{
                    backgroundColor: showPreview ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  style={{
                    backgroundColor: showHistory ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  Deployment History
                </button>
              </div>
            </div>

            {/* Token Preview */}
            {showPreview && (
              <div className="mb-8">
                <TokenPreview
                  name={name}
                  symbol={symbol}
                  logoUrl={logoUrl}
                  description={description}
                  initialSupply={initialSupply}
                  decimals={decimals}
                  network={network}
                  socialLinks={socialLinks}
                  securityFeatures={{
                    renounceMint: isFeatureAllowed('renounceMint') ? renounceMint : false,
                    antiBot: isFeatureAllowed('antiBot') ? antiBotEnabled : false,
                    antiWhale: isFeatureAllowed('antiWhale') ? antiWhaleEnabled : false
                  }}
                />
              </div>
            )}

            {/* Deployment Progress */}
            {deploying && deploymentSteps.length > 0 && (
              <div className="mb-8 rounded-xl border p-6" style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)'
              }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Deployment Progress
                </h3>
                <DeploymentProgress
                  steps={deploymentSteps}
                  currentStep={currentStepIndex}
                  error={deploymentError}
                />
              </div>
            )}

            {/* Deployment History Modal - rendered via portal for viewport-centered display */}
            {showHistory && createPortal(
              <div
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60 p-4"
                onClick={() => setShowHistory(false)}
                role="dialog"
                aria-modal="true"
                aria-label="Deployment history modal"
              >
                <div
                  className="rounded-xl p-6 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <DeploymentHistory
                    onSelectDeployment={(_deployment) => {
                      setShowHistory(false);
                    }}
                    onClose={() => setShowHistory(false)}
                  />
                </div>
              </div>,
              document.body
            )}

            {/* Launch Wizard / Form */}
            <LaunchWizard
              currentStep={useWizardMode ? wizardStep : 4}
              onStepChange={useWizardMode ? setWizardStep : undefined}
            >
            {(!useWizardMode || wizardStep === 2) && (
            <div className="rounded-2xl shadow-xl p-6 mb-8 border" style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)'
            }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold style={{ color: 'var(--text-primary)' }}">Choose Your Service Plan</h2>
                  {network && (
                    <p className="text-sm style={{ color: 'var(--text-tertiary)' }} mt-1">
                      Pricing for <span className="text-blue-400 font-medium">{network.name}</span> network
                    </p>
                  )}
                  {!network && (
                    <p className="text-sm style={{ color: 'var(--text-tertiary)' }} mt-1">
                      Connect wallet to see network-specific pricing
                    </p>
                  )}
                  {/* Deployment Method Indicator */}
                  {network && (
                    <div className="mt-2">
                      {getContractAddress(network?.chainId, 'tokenFactory') && 
                       getContractAddress(network?.chainId, 'tokenFactory') !== '0x0000000000000000000000000000000000000000' ? (
                        <div className="flex items-center text-sm text-green-400">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          TokenFactory System Available
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-yellow-400">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Using Direct Deployment
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <p className="text-xs text-gray-500">
                    💡 Switch networks to see different pricing
                  </p>
                  <button
                    onClick={() => setShowPricing(!showPricing)}
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    {showPricing ? 'Hide Details' : 'View Details'}
                  </button>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                {Object.entries(SERVICE_CHARGES).map(([key, plan]) => (
                  <div
                    key={key}
                    className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedPlan === key
                        ? 'border-blue-500'
                        : 'hover:border-gray-500'
                    }`}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: selectedPlan === key ? 'var(--accent-cyan)' : 'var(--border-color)'
                    }}
                    onClick={() => setSelectedPlan(key)}
                  >
                    {selectedPlan === key && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 style={{ color: 'var(--text-primary)' }}" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <h3 className="text-xl font-bold style={{ color: 'var(--text-primary)' }} mb-2">{plan.name}</h3>
                      <div className="text-3xl font-bold text-blue-400 mb-4">
                        {(plan.prices[network?.chainId] || plan.prices[1])?.amount} {(plan.prices[network?.chainId] || plan.prices[1])?.currency}
                      </div>
                      
                      {showPricing && (
                        <ul className="text-sm style={{ color: 'var(--text-secondary)' }} space-y-2 mb-4">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {/* Wizard step 2 nav */}
              {useWizardMode && wizardStep === 2 && (
                <div className="flex justify-between mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <button type="button" onClick={() => setWizardStep(1)} className="interactive-button px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg">
                    ← Back
                  </button>
                  <button type="button" onClick={() => setWizardStep(3)} className="interactive-button px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">
                    Next: Security & Info →
                  </button>
                </div>
              )}
            </div>
            )}

            {/* Main Form */}
            <div className="rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border" style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)'
            }}>
              <form onSubmit={handleDeploy} className="space-y-6 sm:space-y-8">
                {/* Step 1: Basic Information + Logo */}
                <div style={{ display: !useWizardMode || wizardStep === 1 ? 'block' : 'none' }}>
                  <h3 className="text-xl sm:text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4 sm:mb-6">Basic Token Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label htmlFor="deploy-evm-name" className="block text-sm font-medium style={{ color: 'var(--text-secondary)' }} mb-2">
                        Token Name *
                      </label>
                      <input
                        id="deploy-evm-name"
                        name="name"
                        type="text"
                        autoComplete="off"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        style={{
                          backgroundColor: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                        placeholder="My Awesome Token"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="deploy-evm-symbol" className="block text-sm font-medium style={{ color: 'var(--text-secondary)' }} mb-2">
                        Token Symbol *
                      </label>
                      <input
                        id="deploy-evm-symbol"
                        name="symbol"
                        type="text"
                        autoComplete="off"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        style={{
                          backgroundColor: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                        placeholder="MAT"
                        maxLength={10}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="deploy-evm-decimals" className="block text-sm font-medium style={{ color: 'var(--text-secondary)' }} mb-2">
                        Decimals
                      </label>
                      <select
                        id="deploy-evm-decimals"
                        name="decimals"
                        autoComplete="off"
                        value={decimals}
                        onChange={(e) => setDecimals(parseInt(e.target.value))}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      >
                        <option value={18}>18 (Standard)</option>
                        <option value={6}>6 (USDC style)</option>
                        <option value={8}>8 (Bitcoin style)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="deploy-evm-supply" className="block text-sm font-medium style={{ color: 'var(--text-secondary)' }} mb-2">
                        Initial Supply *
                      </label>
                      <input
                        id="deploy-evm-supply"
                        name="initialSupply"
                        type="number"
                        value={initialSupply}
                        onChange={(e) => setInitialSupply(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        style={{
                          backgroundColor: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                        placeholder="1000000"
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  {/* Logo Information */}
                  <div className="mt-4 sm:mt-6">
                    <h3 className="text-lg sm:text-xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">Token Logo</h3>
                    <LogoUpload
                      onLogoUpload={handleLogoUpload}
                      onLogoChange={handleLogoChange}
                      currentLogo={logoUrl}
                      disabled={deploying}
                    />
                  </div>
                </div>

                {/* Wizard step 1 nav */}
                {useWizardMode && wizardStep === 1 && (
                  <div className="flex justify-end mt-6">
                    <button type="button" onClick={() => setWizardStep(2)} className="interactive-button px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">
                      Next: Network & Plan →
                    </button>
                  </div>
                )}

                {/* Step 3: Project Information + Security + Social */}
                <div style={{ display: !useWizardMode || wizardStep === 3 ? 'block' : 'none' }}>
                {/* Project Information */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4 sm:mb-6">Project Information</h3>
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <label htmlFor="deploy-evm-website" className="block text-sm font-medium style={{ color: 'var(--text-secondary)' }} mb-2">
                        Website URL *
                      </label>
                      <input
                        id="deploy-evm-website"
                        name="website"
                        type="url"
                        autoComplete="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        style={{
                          backgroundColor: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                        placeholder="https://yourproject.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="deploy-evm-description" className="block text-sm font-medium style={{ color: 'var(--text-secondary)' }} mb-2">
                        Project Description
                      </label>
                      <textarea
                        id="deploy-evm-description"
                        name="description"
                        autoComplete="off"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        style={{
                          backgroundColor: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                        rows={4}
                        placeholder="Describe your project, its purpose, and key features..."
                      />
                    </div>
                  </div>
                </div>

                {/* Security Features */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4 sm:mb-6">Security Features</h3>
                  <div className="space-y-3 sm:space-y-4">
                    {SECURITY_FEATURES.map((feature, index) => {
                      const isAllowed = isFeatureAllowed(feature.featureKey);
                      const restrictionMessage = getFeatureRestrictionMessage(feature.featureKey);
                      
                      return (
                        <div key={index} className="p-3 sm:p-4 rounded-lg border" style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-color)'
                        }}>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                            <div className="flex items-start sm:items-center space-x-3">
                              <span className="text-xl sm:text-2xl flex-shrink-0">{feature.icon}</span>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium style={{ color: 'var(--text-primary)' }} text-sm sm:text-base">{feature.name}</h4>
                                <p className="text-xs sm:text-sm style={{ color: 'var(--text-secondary)' }} mt-1">{feature.description}</p>
                                <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-900 text-blue-200 rounded-full mt-1">
                                  {feature.risk} Risk
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                              {!isAllowed && restrictionMessage && (
                                <span className="text-xs sm:text-sm text-red-400">{restrictionMessage}</span>
                              )}
                              
                              {feature.featureKey === "renounceMint" && (
                                <ToggleButton
                                  enabled={renounceMint}
                                  onToggle={() => setRenounceMint(!renounceMint)}
                                  disabled={!isAllowed}
                                />
                              )}
                              
                              {feature.featureKey === "enableFreezing" && (
                                <ToggleButton
                                  enabled={enableFreezing}
                                  onToggle={() => setEnableFreezing(!enableFreezing)}
                                  disabled={!isAllowed}
                                />
                              )}
                              
                              {feature.featureKey === "enableBlacklist" && (
                                <ToggleButton
                                  enabled={enableBlacklist}
                                  onToggle={() => setEnableBlacklist(!enableBlacklist)}
                                  disabled={!isAllowed}
                                />
                              )}
                              
                              {feature.featureKey === "maxTxAmount" && (
                                <ToggleButton
                                  enabled={maxTxAmount !== ''}
                                  onToggle={() => setMaxTxAmount(maxTxAmount === '' ? '1' : '')}
                                  disabled={!isAllowed}
                                />
                              )}
                              
                              {feature.featureKey === "renounceOwnership" && (
                                <ToggleButton
                                  enabled={renounceOwnership}
                                  onToggle={() => {
                                    if (!renounceOwnership) {
                                      setShowOwnershipRenounceModal(true);
                                    } else {
                                      setRenounceOwnership(false);
                                    }
                                  }}
                                  disabled={!isAllowed}
                                />
                              )}
                              
                              {feature.featureKey === "antiBot" && (
                                <ToggleButton
                                  enabled={antiBotEnabled}
                                  onToggle={() => setAntiBotEnabled(!antiBotEnabled)}
                                  disabled={!isAllowed}
                                />
                              )}
                              
                              {feature.featureKey === "cooldown" && (
                                <ToggleButton
                                  enabled={cooldownPeriod !== ''}
                                  onToggle={() => setCooldownPeriod(cooldownPeriod === '' ? '30' : '')}
                                  disabled={!isAllowed}
                                />
                              )}
                              
                              {feature.featureKey === "antiWhale" && (
                                <ToggleButton
                                  enabled={antiWhaleEnabled}
                                  onToggle={() => setAntiWhaleEnabled(!antiWhaleEnabled)}
                                  disabled={!isAllowed}
                                />
                              )}
                              
                              {feature.featureKey === "pauseFunction" && (
                                <ToggleButton
                                  enabled={pauseFunctionEnabled}
                                  onToggle={() => setPauseFunctionEnabled(!pauseFunctionEnabled)}
                                  disabled={!isAllowed}
                                />
                              )}
                              
                              {feature.featureKey === "timelock" && (
                                <ToggleButton
                                  enabled={timelockEnabled}
                                  onToggle={() => setTimelockEnabled(!timelockEnabled)}
                                  disabled={!isAllowed}
                                />
                              )}
                              
                              {feature.featureKey === "maxWallet" && (
                                <ToggleButton
                                  enabled={maxWalletEnabled}
                                  onToggle={() => setMaxWalletEnabled(!maxWalletEnabled)}
                                  disabled={!isAllowed}
                                />
                              )}
                            </div>
                          </div>
                          
                          {/* Conditional inputs */}
                          {feature.featureKey === "enableFreezing" && enableFreezing && isAllowed && (
                            <div className="mt-3 sm:mt-4">
                              <label htmlFor="deploy-freezing-authority" className="sr-only">Freezing authority address</label>
                              <input
                                id="deploy-freezing-authority"
                                name="freezingAuthority"
                                type="text"
                                value={freezingAuthority}
                                onChange={(e) => setFreezingAuthority(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent style={{ color: 'var(--text-primary)' }} placeholder-gray-400 text-sm"
                                placeholder="0x..."
                              />
                            </div>
                          )}
                          
                          {feature.featureKey === "cooldown" && cooldownPeriod !== '' && isAllowed && (
                            <div className="mt-3 sm:mt-4">
                              <label htmlFor="deploy-cooldown-period" className="sr-only">Cooldown period (seconds)</label>
                              <input
                                id="deploy-cooldown-period"
                                name="cooldownPeriod"
                                type="number"
                                value={cooldownPeriod}
                                onChange={(e) => setCooldownPeriod(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent style={{ color: 'var(--text-primary)' }} placeholder-gray-400 text-sm"
                                placeholder="30"
                                min="1"
                                max="3600"
                                step="1"
                              />
                              <p className="text-xs sm:text-sm style={{ color: 'var(--text-tertiary)' }} mt-1">
                                Cooldown period between transactions in seconds (1-3600)
                                {cooldownPeriod === '30' && <span className="text-blue-400 ml-1">• Default: 30 seconds</span>}
                              </p>
                            </div>
                          )}
                          
                          {feature.featureKey === "antiWhale" && antiWhaleEnabled && isAllowed && (
                            <div className="mt-3 sm:mt-4">
                              <div className="flex items-center space-x-2">
                                <label htmlFor="deploy-max-wallet-pct" className="sr-only">Max wallet percentage</label>
                                <input
                                  id="deploy-max-wallet-pct"
                                  name="maxWalletPercentage"
                                  type="range"
                                  min="0.1"
                                  max="5"
                                  step="0.1"
                                  value={maxWalletPercentage}
                                  onChange={(e) => setMaxWalletPercentage(Number(e.target.value))}
                                  className="flex-1"
                                />
                                <span className="text-xs sm:text-sm w-12 sm:w-16 style={{ color: 'var(--text-secondary)' }}">{maxWalletPercentage}%</span>
                              </div>
                              <p className="text-xs sm:text-sm style={{ color: 'var(--text-tertiary)' }} mt-1">
                                Maximum wallet holdings as percentage of total supply (0.1% - 5%)
                                {maxWalletPercentage === '2' && <span className="text-blue-400 ml-1">• Default: 2%</span>}
                              </p>
                            </div>
                          )}
                          
                          {feature.featureKey === "timelock" && timelockEnabled && isAllowed && (
                            <div className="mt-3 sm:mt-4">
                              <div className="flex items-center space-x-2">
                                <label htmlFor="deploy-timelock-delay" className="sr-only">Timelock delay (hours)</label>
                                <input
                                  id="deploy-timelock-delay"
                                  name="timelockDelay"
                                  type="range"
                                  min="1"
                                  max="168"
                                  value={timelockDelay}
                                  onChange={(e) => setTimelockDelay(Number(e.target.value))}
                                  className="flex-1"
                                />
                                <span className="text-xs sm:text-sm w-12 sm:w-20 style={{ color: 'var(--text-secondary)' }}">{timelockDelay}h</span>
                              </div>
                              <p className="text-xs sm:text-sm style={{ color: 'var(--text-tertiary)' }} mt-1">
                                Timelock delay for administrative functions (1-168 hours)
                                {timelockDelay === '24' && <span className="text-blue-400 ml-1">• Default: 24 hours</span>}
                              </p>
                            </div>
                          )}
                          
                          {feature.featureKey === "maxTxAmount" && maxTxAmount !== '' && isAllowed && (
                            <div className="mt-3 sm:mt-4">
                              <label htmlFor="deploy-max-tx-amount" className="sr-only">Max transaction amount (%)</label>
                              <input
                                id="deploy-max-tx-amount"
                                name="maxTxAmount"
                                type="number"
                                value={maxTxAmount}
                                onChange={(e) => setMaxTxAmount(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent style={{ color: 'var(--text-primary)' }} placeholder-gray-400 text-sm"
                                placeholder="1.0"
                                min="0.1"
                                max="10"
                                step="0.1"
                              />
                              <p className="text-xs sm:text-sm style={{ color: 'var(--text-tertiary)' }} mt-1">
                                Maximum transaction amount as percentage of total supply (0.1% - 10%)
                                {maxTxAmount === '1' && <span className="text-blue-400 ml-1">• Default: 1%</span>}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Social Links */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4 sm:mb-6">Social Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {Object.entries(socialLinks).map(([platform, value]) => (
                      <div key={platform}>
                        <label htmlFor={`deploy-social-${platform}`} className="block text-sm font-medium style={{ color: 'var(--text-secondary)' }} mb-2">
                          {platform.charAt(0).toUpperCase() + platform.slice(1)} URL
                        </label>
                        <input
                          id={`deploy-social-${platform}`}
                          name={`social-${platform}`}
                          type="url"
                          value={value}
                          onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        style={{
                          backgroundColor: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                          placeholder={`https://${platform}.com/yourproject`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Wizard step 3 nav */}
                {useWizardMode && wizardStep === 3 && (
                  <div className="flex justify-between mt-6">
                    <button type="button" onClick={() => setWizardStep(2)} className="interactive-button px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg">
                      ← Back
                    </button>
                    <button type="button" onClick={() => setWizardStep(4)} className="interactive-button px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">
                      Next: Review & Deploy →
                    </button>
                  </div>
                )}
                </div>

                {/* Step 4: Deploy Button */}
                <div style={{ display: !useWizardMode || wizardStep === 4 ? 'block' : 'none' }}>
                {/* Deploy Button */}
                <div className="text-center pt-4 sm:pt-6">
                  <button
                    type="submit"
                    disabled={deploying || !isConnected}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 style={{ color: 'var(--text-primary)' }} font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-colors text-base sm:text-lg"
                  >
                    {deploying ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 sm:h-5 w-4 sm:w-5 border-b-2 border-white mr-2"></div>
                        Deploying Token...
                      </div>
                    ) : (
                      `Deploy Token (${(SERVICE_CHARGES[selectedPlan].prices[network?.chainId] || SERVICE_CHARGES[selectedPlan].prices[1])?.amount} ${(SERVICE_CHARGES[selectedPlan].prices[network?.chainId] || SERVICE_CHARGES[selectedPlan].prices[1])?.currency})`
                    )}
                  </button>
                </div>

                {/* Wizard step 4 nav (Back only) */}
                {useWizardMode && wizardStep === 4 && (
                  <div className="flex justify-start mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <button type="button" onClick={() => setWizardStep(3)} className="interactive-button px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg">
                      ← Back
                    </button>
                  </div>
                )}
                </div>
              </form>
            </div>
            </LaunchWizard>

            {/* Deployment Status */}
            {(txHash || tokenAddress) && (
              <div className="rounded-2xl shadow-xl p-4 sm:p-6 mt-6 sm:mt-8 border" style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)'
              }}>
                <h3 className="text-xl sm:text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">Deployment Status</h3>
                
                {txHash && (
                  <div className="mb-4">
                    <p className="text-sm font-medium style={{ color: 'var(--text-secondary)' }} mb-2">Transaction Hash:</p>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <code className="px-3 py-2 rounded text-xs sm:text-sm font-mono break-all" style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)'
                      }}>
                        {txHash}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(txHash)}
                        className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
                
                {tokenAddress && (
                  <div>
                    <p className="text-sm font-medium style={{ color: 'var(--text-secondary)' }} mb-2">Token Address:</p>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <code className="px-3 py-2 rounded text-xs sm:text-sm font-mono break-all" style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)'
                      }}>
                        {tokenAddress}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(tokenAddress)}
                        className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Fair Launch Checklist - shown after deployment */}
            {tokenAddress && (
              <div className="mt-6 sm:mt-8">
                <FairLaunchChecklist
                  tokenAddress={tokenAddress}
                  txHash={txHash}
                  chainId={network?.chainId}
                  onRenounce={() => {
                  if (signer && tokenAddress) {
                    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
                    setPendingRenounceContract(contract);
                    setShowRenounceModal(true);
                  } else {
                    toast.error('Connect wallet to renounce ownership');
                  }
                }}
                  isRenounced={ownershipRenounced}
                />
              </div>
            )}

            {/* Metadata Information */}
            {metadataUrl && (
              <div className="rounded-2xl shadow-xl p-4 sm:p-6 mt-6 sm:mt-8 border" style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)'
              }}>
                <h3 className="text-xl sm:text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">Token Metadata</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium style={{ color: 'var(--text-secondary)' }} mb-2">IPFS Metadata URL:</p>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <code className="px-3 py-2 rounded text-xs sm:text-sm font-mono break-all" style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)'
                      }}>
                        {metadataUrl}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(metadataUrl)}
                        className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  {logoUrl && (
                    <div>
                      <p className="text-sm font-medium style={{ color: 'var(--text-secondary)' }} mb-2">Logo URL:</p>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <code className="px-3 py-2 rounded text-xs sm:text-sm font-mono break-all" style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)'
                      }}>
                          {logoUrl}
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText(logoUrl)}
                          className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-300 mb-2">Metadata Information</h4>
                    <div className="space-y-2 text-xs text-blue-200">
                      <p><strong>Status:</strong> Stored on IPFS (decentralized storage)</p>
                      <p><strong>Content:</strong> Token name, symbol, description, logo, social links, and security features</p>
                      <p><strong>Accessibility:</strong> Available through multiple IPFS gateways</p>
                      <p><strong>Blockchain Integration:</strong> Logo URL and metadata are stored in the smart contract</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Deployment Tips */}
            <div className="rounded-2xl shadow-xl p-4 sm:p-6 mt-6 sm:mt-8 border" style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)'
            }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                <h3 className="text-xl sm:text-2xl font-bold style={{ color: 'var(--text-primary)' }}">Deployment Tips</h3>
                <button
                  onClick={() => setShowGuide(!showGuide)}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors text-sm sm:text-base"
                >
                  {showGuide ? 'Hide Tips' : 'Show Tips'}
                </button>
              </div>
              
              {showGuide && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {DEPLOYMENT_TIPS.map((tip, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <p className="text-sm sm:text-base style={{ color: 'var(--text-secondary)' }}">{tip}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ownership Renouncement Notice Modal */}
            {showOwnershipRenounceModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
                <div className="rounded-xl p-4 sm:p-8 shadow-xl max-w-md w-full" style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div className="flex items-start space-x-3 mb-4">
                    <span className="text-yellow-400 text-2xl">⚠️</span>
                    <h3 className="text-lg sm:text-xl font-bold style={{ color: 'var(--text-primary)' }}">Ownership Renouncement Notice</h3>
                  </div>
                  
                  <div className="space-y-4 text-sm sm:text-base style={{ color: 'var(--text-secondary)' }} mb-6">
                    <p>
                      <strong>Important:</strong> Ownership renouncement is <strong>not automatic</strong> during deployment.
                    </p>
                    <p>
                      After your token is deployed, you must <strong>manually call the renounceOwnership() function</strong> to fully decentralize your token.
                    </p>
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                      <p className="text-yellow-200 font-medium">
                        <strong>⚠️ This action is irreversible!</strong>
                      </p>
                      <p className="text-yellow-200 text-sm mt-1">
                        Once ownership is renounced, you will no longer be able to:
                      </p>
                      <ul className="text-yellow-200 text-sm mt-2 space-y-1">
                        <li>• Modify security settings</li>
                        <li>• Pause/unpause trading</li>
                        <li>• Update contract parameters</li>
                        <li>• Perform administrative functions</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setShowOwnershipRenounceModal(false)}
                      className="px-4 py-2 rounded transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setRenounceOwnership(true);
                        setShowOwnershipRenounceModal(false);
                      }}
                      className="px-4 py-2 bg-blue-600 style={{ color: 'var(--text-primary)' }} rounded hover:bg-blue-700 transition-colors"
                    >
                      Enable Feature
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Renounce Ownership Confirmation Modal */}
            {showRenounceModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
                <div className="rounded-xl p-4 sm:p-8 shadow-xl max-w-md w-full" style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)'
                }}>
                  <h3 className="text-lg sm:text-xl font-bold style={{ color: 'var(--text-primary)' }} mb-4">Renounce Ownership Confirmation</h3>
                  <p className="text-sm sm:text-base style={{ color: 'var(--text-secondary)' }} mb-6">
                    You have selected <span className="font-semibold text-blue-400">Renounce Ownership</span>.<br/>
                    This requires a <span className="font-semibold text-yellow-400">second on-chain transaction</span> after deployment.<br/>
                    Are you sure you want to proceed?
                  </p>
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => { setShowRenounceModal(false); setPendingRenounceContract(null); }}
                      className="px-4 py-2 rounded transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
                    >Cancel</button>
                    <button
                      onClick={handleConfirmRenounce}
                      className="px-4 py-2 bg-blue-600 style={{ color: 'var(--text-primary)' }} rounded hover:bg-blue-700"
                    >Yes, Renounce Ownership</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ShareCardModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        type="deploy"
        data={shareData}
      />
    </>
  );
}

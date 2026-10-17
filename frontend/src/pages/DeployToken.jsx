import { evmLite, loadEthers } from '../utils/evmLite';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useAchievements } from '../contexts/AchievementContext';
import { useChainType, useSolanaWallet } from '../contexts/SolanaWalletContext';
import { SOLANA_NETWORKS } from '../config/solanaConfig';
import toast from 'react-hot-toast';
import AdvancedERC20Artifact from '../artifacts/AdvancedERC20.json';
import TokenFactoryArtifact from '../artifacts/TokenFactory.json';
import TokenImplementationArtifact from '../artifacts/TokenImplementation.json';
import { Helmet } from 'react-helmet-async';
import { getContractAddress, isZeroEvmAddress } from '../config/contracts';
import getFeatureSupport from '../config/featureSupport';
import { apiPath } from '../config';
import LogoUpload from '../components/LogoUpload';
import { uploadMetadataToIPFS, createTokenMetadata } from '../utils/ipfsUpload';
import { publicAssetUri } from '../utils/nftCollectionMetadata';
import { buildTokenLaunchMetadataDocument, publishTokenLaunchMetadata } from '../utils/tokenLaunchMetadata';
import TokenPreview from '../components/TokenPreview';
import DeploymentProgress from '../components/DeploymentProgress';
import DeploymentHistory from '../components/DeploymentHistory';
import LaunchWizard from '../components/LaunchWizard';
import FairLaunchChecklist from '../components/FairLaunchChecklist';
import { deploymentHistory as deploymentHistoryUtil } from '../utils/deploymentHistory';
import { notificationService } from '../utils/notifications';
import ShareCardModal from '../components/ShareCardModal';
import { isBoingTestnetChainId } from 'boing-sdk';
import NativeBoingTokenDeploySection from '../components/NativeBoingTokenDeploySection';
import LinkedNftTokenPanel from '../components/LinkedNftTokenPanel';
import { BOING_NATIVE_L1_CHAIN_ID, getNetworkByChainId } from '../config/networks';
import { getBoingNativeFeeUsd, formatUsdReferenceLabel, isBoingNativeFeeChain } from '../config/boingEconomics';
import { isBoingNativeAccountIdHex } from '../utils/boingWalletDiscovery';
import { tryAccruePoints } from '../utils/tryAccruePoints';
import { brandLogoPngAbsolute } from '../config/brandAssets';
import { showDeployCelebration } from '../utils/deployCelebration';
import { rememberAssetDeployer } from '../utils/linkedNftToken';
import {
  BOING_TOKEN_V2_DECIMALS,
  BOING_TOKEN_V2_SECURITY,
  BOING_TOKEN_V2_UNSUPPORTED_SECURITY,
  parseBoingTokenV2Supply,
} from '../services/boingTokenV2Launch';
import {
  TradeDeployShell,
  TradeDeployHero,
  TradeDeployButton,
} from '../components/PageLayout';

// Import ABI and bytecode from the artifacts
const ERC20_ABI = AdvancedERC20Artifact.abi;
const ERC20_BYTECODE = AdvancedERC20Artifact.bytecode;
const TOKEN_FACTORY_ABI = TokenFactoryArtifact.abi;
const _TOKEN_IMPLEMENTATION_ABI = TokenImplementationArtifact.abi;

/** Boing logo URL (design system) — used as default when token has no custom logo. */
const BOING_LOGO_URL = brandLogoPngAbsolute();

// MochiAstronaut component

function riskClass(risk) {
  const r = String(risk || '').toLowerCase();
  if (r.includes('medium') || r.includes('high')) return 'td-risk--medium';
  if (r.includes('very')) return 'td-risk--low';
  return 'td-risk--low';
}

// Toggle Button Component
function ToggleButton({ enabled, onToggle, disabled, size = "md", ariaLabel, ariaLabelledBy }) {
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
      role="switch"
      aria-checked={enabled}
      aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? 'Toggle')}
      aria-labelledby={ariaLabelledBy}
      onClick={onToggle}
      disabled={disabled}
      className={`td-toggle ${sizeClasses[size]} ${enabled ? 'td-toggle--on' : 'td-toggle--off'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`td-toggle__dot ${dotSizeClasses[size]} ${enabled ? 'translate-x-7' : 'translate-x-1'}`}
      />
    </button>
  );
}

const SOLANA_DEPLOY_FEATURES = [
  {
    key: 'renounceMint',
    name: 'Mint Authority Removal',
    description: 'Revoke mint authority after the initial supply so no more tokens can be created.',
    risk: 'Low',
    available: true,
  },
  {
    key: 'enableFreezing',
    name: 'Freezing Authority',
    description: 'Keep freeze authority so you can freeze token accounts in an emergency.',
    risk: 'Medium',
    available: true,
  },
  {
    key: 'enableBlacklist',
    name: 'Blacklist Function',
    description: 'SPL equivalent of a blacklist: freeze authority can freeze a wallet’s token account.',
    risk: 'Medium',
    available: true,
  },
  {
    key: 'immutableMetadata',
    name: 'Immutable Metadata',
    description: 'Lock name, symbol, and URI on-chain so they cannot be changed later.',
    risk: 'Very Low',
    available: true,
  },
  {
    key: 'renounceOwnership',
    name: 'Ownership Renouncement',
    description: 'Remove mint and freeze authority and lock metadata in one step (fixed, decentralized mint).',
    risk: 'Very Low',
    available: true,
  },
  {
    key: 'maxTxAmount',
    name: 'Transaction Limits',
    description: 'Cap how many tokens can move in one transfer.',
    risk: 'Low',
    available: false,
    unavailableReason: 'Needs a custom transfer-hook program, not standard SPL.',
  },
  {
    key: 'antiBot',
    name: 'Anti-Bot Protection',
    description: 'Throttle bots and MEV around launch.',
    risk: 'Low',
    available: false,
    unavailableReason: 'Needs a custom transfer-hook program, not standard SPL.',
  },
  {
    key: 'cooldown',
    name: 'Cooldown Period',
    description: 'Require a delay between transfers.',
    risk: 'Low',
    available: false,
    unavailableReason: 'Needs a custom transfer-hook program, not standard SPL.',
  },
  {
    key: 'antiWhale',
    name: 'Anti-Whale Protection',
    description: 'Limit how large a single wallet can become.',
    risk: 'Low',
    available: false,
    unavailableReason: 'Needs a custom transfer-hook program, not standard SPL.',
  },
  {
    key: 'pauseFunction',
    name: 'Pause Functionality',
    description: 'Emergency pause of all transfers.',
    risk: 'Medium',
    available: false,
    unavailableReason: 'Needs Token-2022 pausable or a custom program.',
  },
  {
    key: 'timelock',
    name: 'Timelock Contract',
    description: 'Delay administrative changes.',
    risk: 'Very Low',
    available: false,
    unavailableReason: 'Needs a separate timelock program.',
  },
  {
    key: 'maxWallet',
    name: 'Max Wallet Limit',
    description: 'Set a maximum token balance per wallet.',
    risk: 'Low',
    available: false,
    unavailableReason: 'Needs a custom transfer-hook program, not standard SPL.',
  },
];

const DEFAULT_SOLANA_DEPLOY_FEATURES = {
  renounceMint: true,
  enableFreezing: false,
  enableBlacklist: false,
  immutableMetadata: false,
  renounceOwnership: false,
};

function toggleSolanaDeployFeature(prev, key) {
  const next = { ...prev, [key]: !prev[key] };
  if (key === 'enableBlacklist' && next.enableBlacklist) next.enableFreezing = true;
  if (key === 'enableFreezing' && !next.enableFreezing) next.enableBlacklist = false;
  if (key === 'renounceOwnership' && next.renounceOwnership) {
    next.renounceMint = true;
    next.immutableMetadata = true;
    next.enableFreezing = false;
    next.enableBlacklist = false;
  }
  if ((key === 'enableFreezing' || key === 'enableBlacklist') && next.enableFreezing) {
    next.renounceOwnership = false;
  }
  if (key === 'renounceMint' && !next.renounceMint) next.renounceOwnership = false;
  if (key === 'immutableMetadata' && !next.immutableMetadata) next.renounceOwnership = false;
  return next;
}

async function recordSolanaDeployment({ mintAddress, creatorAddress, network, type, name, symbol, metadataUri, signature }) {
  try {
    await fetch(apiPath('solana/deployments'), {
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
  const { connection, address, connected, connectWallet, signTransaction, network, balance, setSolanaNetwork } = useSolanaWallet();
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimals, setDecimals] = useState(9);
  const [initialSupply, setInitialSupply] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [features, setFeatures] = useState(DEFAULT_SOLANA_DEPLOY_FEATURES);
  const [deploying, setDeploying] = useState(false);
  const [mintAddress, setMintAddress] = useState('');
  const [signature, setSignature] = useState('');

  const solanaNetwork = SOLANA_NETWORKS[network] || SOLANA_NETWORKS.devnet;

  const handleDeploy = async (e) => {
    e.preventDefault();
    if (!connected || !address || !signTransaction) {
      toast.error('Please connect your Solana wallet first.');
      return;
    }
    if (!connection) {
      toast.error('Solana RPC is unavailable. Refresh and try again, or switch to Devnet.');
      return;
    }
    if (!name.trim() || !symbol.trim()) {
      toast.error('Name and symbol are required.');
      return;
    }
    if ((features.renounceMint || features.renounceOwnership) && !(Number(initialSupply) > 0)) {
      toast.error('Set an initial supply before removing mint authority, or turn that option off to mint later.');
      return;
    }
    setDeploying(true);
    setMintAddress('');
    setSignature('');
    try {
      // Solana token stack (web3.js, spl-token, metaplex) loads only for a Solana deploy.
      const { createSPLToken } = await import('../services/solanaTokenService');
      const result = await createSPLToken(connection, address, signTransaction, {
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        decimals: Number(decimals) || 9,
        initialSupply: initialSupply || '0',
        logoFile: logoFile || undefined,
        network,
        ...features,
      });
      setMintAddress(result.mintAddress);
      setSignature(result.signature);
      const solCluster = network === 'devnet' ? '?cluster=devnet' : '';
      showDeployCelebration({
        deploymentKind: 'Solana SPL token',
        details: [
          { label: 'Name', value: name.trim() },
          { label: 'Symbol', value: symbol.trim().toUpperCase() },
          { label: 'Decimals', value: String(decimals) },
          { label: 'Mint address', value: result.mintAddress },
          { label: 'Mint authority', value: result.authorities?.mintAuthority ? 'Kept' : 'Revoked' },
          { label: 'Freeze authority', value: result.authorities?.freezeAuthority ? 'Enabled' : 'None' },
          { label: 'Metadata', value: result.authorities?.metadataMutable ? 'Mutable' : 'Immutable' },
        ],
        txHash: result.signature,
        externalTxUrl: `https://explorer.solana.com/tx/${result.signature}${solCluster}`,
        externalAddressUrl: `https://explorer.solana.com/address/${result.mintAddress}${solCluster}`,
      });
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
    <div className="relative w-full min-w-0">
      <TradeDeployShell width="medium">
          <Helmet>
            <title>Deploy SPL Token - Solana | Boing Finance</title>
          </Helmet>
          <TradeDeployHero
            eyebrow="Launch"
            title="Deploy SPL Token"
            subtitle={`Create an SPL token on Solana ${solanaNetwork.name}`}
          >
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {['mainnet', 'devnet'].map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => setSolanaNetwork?.(net)}
                  className={`td-segmented__btn ${network === net ? 'td-segmented__btn--active' : ''}`}
                  style={{
                    border: '1px solid var(--border-color)',
                    backgroundColor: network === net ? undefined : 'var(--bg-card)',
                  }}
                >
                  {net === 'mainnet' ? 'Mainnet' : 'Devnet'}
                </button>
              ))}
            </div>
            {connected && (
              <p className="text-sm mt-3" style={{ color: balance === 0 ? 'var(--accent-error, #f87171)' : 'var(--text-secondary)' }}>
                Wallet: {balance == null ? '…' : `${Number(balance).toFixed(4)} SOL`} on {solanaNetwork.name} · rent ~0.014 SOL
                {balance === 0 ? ` — fund this wallet on ${network === 'mainnet' ? 'Mainnet' : 'Devnet'} or switch cluster.` : ''}
              </p>
            )}
          </TradeDeployHero>

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
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {features.renounceMint || features.renounceOwnership
                    ? 'Required when mint authority is removed (fixed supply).'
                    : 'Leave 0 to mint later while you keep mint authority.'}
                </p>
              </div>
              <div className="pt-2">
                <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Enhanced features</h2>
                <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Same choices as EVM deploy, mapped onto SPL mint / freeze / Metaplex authorities. Transfer limits, anti-bot, and pause need a custom Solana program.
                </p>
                <div className="td-feature-matrix">
                  {SOLANA_DEPLOY_FEATURES.map((feature) => {
                    const enabled = Boolean(features[feature.key]);
                    return (
                      <div
                        key={feature.key}
                        className="td-feature-row"
                        style={{ opacity: feature.available ? 1 : 0.72 }}
                      >
                        <div className="td-feature-row__top">
                          <div className="td-feature-row__meta">
                              <h3 id={`deploy-solana-${feature.key}`} className="td-feature-row__title">
                                {feature.name}
                              </h3>
                              <p className="td-feature-row__desc">{feature.description}</p>
                              {feature.available ? (
                                <span className={`td-risk ${riskClass(feature.risk)}`}>
                                  {feature.risk} risk
                                </span>
                              ) : (
                                <span className="td-risk td-risk--medium">
                                  {feature.unavailableReason}
                                </span>
                              )}
                          </div>
                          <ToggleButton
                            enabled={feature.available && enabled}
                            onToggle={() => setFeatures((prev) => toggleSolanaDeployFeature(prev, feature.key))}
                            disabled={!feature.available || deploying}
                            ariaLabelledBy={`deploy-solana-${feature.key}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {features.renounceOwnership && (
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Ownership renouncement also removes mint and freeze authority and locks metadata. This cannot be undone.
                </p>
              )}
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
                    className="td-btn--link text-sm"
                  >
                    View on Explorer
                  </a>
                </div>
              )}
            </form>
          )}
      </TradeDeployShell>
    </div>
  );
}

// Security Features Configuration
/** Boing token v2: built-in guarantees, and the EVM/Solana options it does not have. */
function BoingTokenV2SecurityNote() {
  const unsupported = SECURITY_FEATURES.filter((f) => BOING_TOKEN_V2_UNSUPPORTED_SECURITY.includes(f.featureKey));
  return (
    <div data-testid="boing-token-v2-security" className="rounded-xl border p-4 text-sm space-y-3" style={{ borderColor: 'rgba(34, 197, 94, 0.35)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong style={{ color: 'var(--text-primary)' }}>Fixed supply.</strong> The whole supply is minted once, to you, right after the deploy. No one can mint more.</li>
        <li><strong style={{ color: 'var(--text-primary)' }}>No owner controls.</strong> After that mint nobody can freeze, block, pause or change the token.</li>
        <li><strong style={{ color: 'var(--text-primary)' }}>Works with Boing swap pools.</strong> Standard transfer, approve and transfer_from; whole units (no decimals).</li>
      </ul>
      <p data-testid="boing-token-v2-unsupported">
        Not available on Boing: {unsupported.map((f) => f.name).join(', ')}. Switch to an EVM or Solana network if you need them.
      </p>
    </div>
  );
}

const SECURITY_FEATURES = [
  {
    name: "Mint Authority Removal",
    description: "Remove ability to create new tokens after deployment",
    enabled: true,
    risk: "Low",
    featureKey: "renounceMint"
  },
  {
    name: "Freezing Authority",
    description: "Allow freezing specific addresses (emergency control)",
    enabled: false,
    risk: "Medium",
    featureKey: "enableFreezing"
  },
  {
    name: "Blacklist Function",
    description: "Block specific addresses from trading",
    enabled: false,
    risk: "Medium",
    featureKey: "enableBlacklist"
  },
  {
    name: "Transaction Limits",
    description: "Set maximum transaction amounts",
    enabled: false,
    risk: "Low",
    featureKey: "maxTxAmount"
  },
  {
    name: "Ownership Renouncement",
    description: "Transfer ownership to zero address (decentralization)",
    enabled: false,
    risk: "Very Low",
    featureKey: "renounceOwnership"
  },
  {
    name: "Anti-Bot Protection",
    description: "Prevent automated trading bots and MEV attacks",
    enabled: false,
    risk: "Low",
    featureKey: "antiBot"
  },
  {
    name: "Cooldown Period",
    description: "Add delay between transactions to prevent rapid trading",
    enabled: false,
    risk: "Low",
    featureKey: "cooldown"
  },
  {
    name: "Anti-Whale Protection",
    description: "Limit maximum wallet holdings to prevent concentration",
    enabled: false,
    risk: "Low",
    featureKey: "antiWhale"
  },
  {
    name: "Pause Functionality",
    description: "Emergency pause all trading (owner only)",
    enabled: false,
    risk: "Medium",
    featureKey: "pauseFunction"
  },
  {
    name: "Timelock Contract",
    description: "Add delay to administrative functions",
    enabled: false,
    risk: "Very Low",
    featureKey: "timelock"
  },
  {
    name: "Max Wallet Limit",
    description: "Set maximum tokens per wallet address",
    enabled: false,
    risk: "Low",
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
  },
  {
    name: "Twitter/X",
    description: "Official social media account",
    required: false,
    placeholder: "https://twitter.com/yourproject",
  },
  {
    name: "Telegram",
    description: "Community chat group",
    required: false,
    placeholder: "https://t.me/yourproject",
  },
  {
    name: "Discord",
    description: "Community server",
    required: false,
    placeholder: "https://discord.gg/yourproject",
  },
  {
    name: "GitHub",
    description: "Source code repository",
    required: false,
    placeholder: "https://github.com/yourproject",
  },
  {
    name: "Medium",
    description: "Project blog/updates",
    required: false,
    placeholder: "https://medium.com/@yourproject",
  },
  {
    name: "Reddit",
    description: "Community subreddit",
    required: false,
    placeholder: "https://reddit.com/r/yourproject",
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
      6913: { amount: 1, currency: 'BOING' }, // Boing L1 testnet (whole BOING display amount; native BOING has 18 decimals)
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
      6913: { amount: 3, currency: 'BOING' },
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
      6913: { amount: 6, currency: 'BOING' },
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

function deployCtaLabel(selectedPlan, network) {
  const row =
    SERVICE_CHARGES[selectedPlan]?.prices?.[network?.chainId] ||
    SERVICE_CHARGES[selectedPlan]?.prices?.[1];
  if (!row) return 'Deploy Token';
  const usd = isBoingNativeFeeChain(network?.chainId) ? getBoingNativeFeeUsd(row.amount) : null;
  const usdStr = usd != null ? ` ${formatUsdReferenceLabel(usd)}` : '';
  return `Deploy Token (${row.amount} ${row.currency}${usdStr})`;
}

// Deployment Tips
const DEPLOYMENT_TIPS = [
  'Choose a memorable name that reflects your token’s purpose',
  'Keep the symbol short (3–8 characters) and unique',
  '18 decimals is standard for most tokens',
  'Set initial supply carefully — it shapes tokenomics',
  'Test on testnet before mainnet deployment',
  'Verify the contract on a block explorer after deployment',
  'Set up social accounts and a clear project description first',
  'Remove mint authority when you want a fixed supply',
  'Keep freeze authority only if you need emergency control',
  'Use blacklist or transfer limits when compliance requires it',
  'Lock liquidity for 90+ days when listing publicly',
  'Use a timelock for ownership changes when you keep admin keys',
  'Renounce ownership only after you no longer need admin controls',
  'Add website and social links so explorers and users can verify you',
  'Keep docs and a short roadmap public',
  'Verify the contract, then add liquidity and announce the deploy',
];

// Utility: Manual deployment using Interface encoding (Hardhat-style)
async function _manualDeployWithInterface({ signer, ERC20_ABI, ERC20_BYTECODE, constructorParams, serviceChargeWei }) {
    const ethers = await loadEthers();
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
  const [searchParams] = useSearchParams();
  const linkCollectionFromQuery =
    searchParams.get('linkCollection') || searchParams.get('collection') || '';
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
  const {
    signer,
    account,
    isConnected,
    getCurrentNetwork,
    chainId,
    walletType,
  } = useWallet();
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
  const [publishedDescriptionHash, setPublishedDescriptionHash] = useState('');
  const [publishedFingerprint, setPublishedFingerprint] = useState('');

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

  const isBoingNativeDeployPath =
    !isSolana &&
    isConnected &&
    Boolean(account && isBoingNativeAccountIdHex(account)) &&
    isBoingTestnetChainId(chainId) &&
    walletType === 'boingExpress';

  const nativeTokenDeployRef = useRef(null);
  const [nativeWizardGate, setNativeWizardGate] = useState({ canSubmit: false, blockedReason: null });
  const onNativeDeployGateChange = useCallback((g) => {
    setNativeWizardGate({
      canSubmit: Boolean(g?.canSubmit),
      blockedReason: g?.blockedReason != null ? g.blockedReason : null,
    });
  }, []);

  /** Committed on native Boing deploy via SDK `description_hash` (Blake3 over canonical JSON) when Advanced hash is empty. */
  const nativeTokenSecurityForBoing = useMemo(
    () => ({
      renounceMint,
      enableFreezing,
      enableBlacklist,
      maxTxAmount,
      renounceOwnership,
      antiBot: antiBotEnabled,
      cooldownPeriod,
      antiWhale: antiWhaleEnabled,
      pauseFunction: pauseFunctionEnabled,
      timelock: timelockEnabled,
      timelockDelay,
      maxWallet: maxWalletEnabled,
      maxWalletPercentage,
    }),
    [
      renounceMint,
      enableFreezing,
      enableBlacklist,
      maxTxAmount,
      renounceOwnership,
      antiBotEnabled,
      cooldownPeriod,
      antiWhaleEnabled,
      pauseFunctionEnabled,
      timelockEnabled,
      timelockDelay,
      maxWalletEnabled,
      maxWalletPercentage,
    ],
  );

  // Helper function to get current pricing for selected network
  const getCurrentPricing = (planKey) => {
    const chainId = network?.chainId || 1;
    if (import.meta.env.DEV) {
      console.log('getCurrentPricing called with planKey:', planKey);
      console.log('getCurrentPricing Debug:', {
        planKey,
        chainId,
        networkChainId: network?.chainId,
        hasPlan: !!SERVICE_CHARGES[planKey],
        hasPrices: !!SERVICE_CHARGES[planKey]?.prices,
        hasChainId: !!SERVICE_CHARGES[planKey]?.prices?.[chainId],
        availableChainIds: Object.keys(SERVICE_CHARGES[planKey]?.prices || {}),
        SERVICE_CHARGES_keys: Object.keys(SERVICE_CHARGES),
      });
    }

    const pricing = SERVICE_CHARGES[planKey]?.prices?.[chainId] || SERVICE_CHARGES[planKey]?.prices?.[1];

    if (import.meta.env.DEV) {
      console.log('Pricing lookup result:', pricing);
    }

    if (!pricing) {
      if (import.meta.env.DEV) {
        console.error('No pricing found for:', { planKey, chainId });
      }
      return { amount: 0.001, currency: network?.nativeCurrency?.symbol ?? 'ETH' };
    }

    return pricing;
  };

  // Helper function to get current service charge
  const getCurrentServiceCharge = () => {
    const pricing = getCurrentPricing(selectedPlan);
    if (import.meta.env.DEV) {
      console.log('getCurrentServiceCharge Debug:', {
        selectedPlan,
        pricing,
        pricingType: typeof pricing,
        amount: pricing?.amount,
        amountType: typeof pricing?.amount,
      });
    }
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
    <div className="td-callout mb-6">
      <h3 className="td-callout__title">Token logo</h3>
      <p className="td-callout__body">
        Prefer IPFS or Arweave URIs for a lasting logo. On-chain base64 works but is expensive.
        After deploy, submit the logo to explorers or token lists if needed.
      </p>
    </div>
  );

  // Logo upload handlers
  const handleLogoUpload = (uploadResult) => {
    setLogoUploadResult(uploadResult);
    const uri = publicAssetUri(uploadResult);
    setLogoUrl(uri);
    setPublishedFingerprint('');
  };

  const handleLogoChange = (url) => {
    setLogoUrl(publicAssetUri(url) || url);
    setPublishedFingerprint('');
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
        logoUrl: publicAssetUri(logoUrl) || logoUrl,
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

  const ensurePublishedTokenMetadata = useCallback(async () => {
    const image = publicAssetUri(logoUrl) || String(logoUrl || '').trim();
    const doc = buildTokenLaunchMetadataDocument({
      name,
      symbol,
      description,
      image,
      website,
      socialLinks,
      decimals: isBoingNativeDeployPath ? BOING_TOKEN_V2_DECIMALS : decimals,
      initialSupply,
      network: network?.name || (isBoingNativeDeployPath ? 'Boing Testnet' : ''),
      security: isBoingNativeDeployPath ? BOING_TOKEN_V2_SECURITY : nativeTokenSecurityForBoing,
    });
    const fingerprint = JSON.stringify(doc);
    if (
      fingerprint === publishedFingerprint &&
      metadataUrl &&
      publishedDescriptionHash
    ) {
      return {
        metadataUri: metadataUrl,
        descriptionHash: publishedDescriptionHash,
        logoUri: image,
      };
    }
    setUploadingMetadata(true);
    try {
      const published = await publishTokenLaunchMetadata(doc);
      setMetadataUrl(published.metadataUri);
      setPublishedDescriptionHash(published.descriptionHash);
      setPublishedFingerprint(fingerprint);
      toast.success('Token metadata uploaded');
      return {
        metadataUri: published.metadataUri,
        descriptionHash: published.descriptionHash,
        logoUri: image,
      };
    } finally {
      setUploadingMetadata(false);
    }
  }, [
    decimals,
    description,
    initialSupply,
    isBoingNativeDeployPath,
    logoUrl,
    metadataUrl,
    name,
    nativeTokenSecurityForBoing,
    network?.name,
    publishedDescriptionHash,
    publishedFingerprint,
    socialLinks,
    symbol,
    website,
  ]);

  const handleDeploy = async (e) => {
    // Before any await: otherwise the browser submits the form natively and reloads the page mid-deploy.
    e.preventDefault();
    const ethers = await loadEthers();
    if (deploying) {
      return;
    }
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (isBoingNativeDeployPath) {
      if (!name?.trim() || !symbol?.trim()) {
        toast.error('Please enter token name and symbol.');
        return;
      }
      try {
        parseBoingTokenV2Supply(initialSupply);
      } catch (supplyErr) {
        toast.error(supplyErr.message);
        return;
      }
      if (!nativeWizardGate.canSubmit) {
        toast.error(
          nativeWizardGate.blockedReason ||
            'Configure fungible template bytecode (build env or Advanced) or acknowledge the QA pool if prompted.'
        );
        return;
      }
      const runNative = nativeTokenDeployRef.current?.runDeploy;
      if (typeof runNative !== 'function') {
        toast.error('Native deploy is not ready. Stay on Review & Deploy with Boing Express on Boing testnet.');
        return;
      }
      setDeploying(true);
      setTxHash('');
      setTokenAddress('');
      setDeploymentError(null);
      const deploymentId = Date.now().toString();
      try {
        const hash = await runNative();
        if (hash) {
          setTxHash(hash);
          deploymentHistoryUtil.add({
            id: deploymentId,
            name,
            symbol,
            network: network || { name: 'Boing Testnet', chainId: BOING_NATIVE_L1_CHAIN_ID },
            chainId: BOING_NATIVE_L1_CHAIN_ID,
            status: 'submitted',
            deployerAddress: account || '',
            timestamp: Date.now(),
            date: new Date().toISOString(),
          });
          recordAchievement?.(account, 'token_deploy', 'first_deploy');
          tryAccruePoints({
            address: account,
            action: 'deploy',
            txHash: hash,
            chainId: BOING_NATIVE_L1_CHAIN_ID,
            metadata: { name, symbol, network: 'Boing Testnet' },
          });
        }
      } finally {
        setDeploying(false);
      }
      return;
    }

    if (!signer) {
      toast.error(
        'Your wallet is connected but signing is not available. Disconnect and reconnect, or pick your wallet again from the wallet menu.'
      );
      return;
    }
    if (!network) {
      toast.error(
        'Could not detect a supported network from your wallet. Switch to a supported chain (e.g. Boing Testnet or Sepolia) or reconnect.'
      );
      return;
    }
    if (!name || !symbol || !initialSupply || !website) {
      toast.error('Please fill in all required fields');
      return;
    }
    // Check if the network is supported
    const supportedChainIds = [1, 137, 56, 42161, 10, 8453, 11155111, 80001, 97, 6913];
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

    const blockExplorerBase =
      network?.chainId != null ? getNetworkByChainId(network.chainId)?.explorer : undefined;
    
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
      let finalLogoUrl = logoUrl || BOING_LOGO_URL;
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
      const nativeDecimals = network?.nativeCurrency?.decimals ?? 18;
      const serviceChargeWei = evmLite.parseUnits(serviceCharge.toString(), nativeDecimals);
      // Check user balance
      const balance = await signer.provider.getBalance(await signer.getAddress());
      if (balance < serviceChargeWei) {
        toast.error(`Insufficient balance. You need ${serviceCharge} ${currentPricing.currency} for the service charge.`);
        return;
      }
      // Convert initial supply to correct decimals
      const supply = evmLite.parseUnits(initialSupply.toString(), decimals);
      // Calculate max transaction amount (only if feature is allowed)
      let maxTx = 0n;
      if (isFeatureAllowed('maxTxAmount') && maxTxAmount) {
        const percentage = parseFloat(maxTxAmount);
        const basisPoints = Math.floor(percentage * 100);
        maxTx = (supply * evmLite.toBigInt(basisPoints)) / 10000n;
      }
      // Calculate max wallet amount (only if feature is allowed)
      let maxWallet = 0n;
      if (isFeatureAllowed('maxWallet') && maxWalletEnabled) {
        const percentage = parseFloat(maxWalletPercentage);
        const basisPoints = Math.floor(percentage * 100);
        maxWallet = (supply * evmLite.toBigInt(basisPoints)) / 10000n;
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
        socialLinks.twitter || '',
        socialLinks.telegram || '',
        socialLinks.discord || '',
        socialLinks.github || '',
        socialLinks.medium || '',
        socialLinks.reddit || '',
        isFeatureAllowed('renounceMint') ? renounceMint : false,
        isFeatureAllowed('enableBlacklist') ? enableBlacklist : false,
        maxTx,
        platformWallet,
        serviceChargeWei,
        isFeatureAllowed('antiBot') ? antiBotEnabled : false,
        isFeatureAllowed('cooldown') ? evmLite.toBigInt(cooldownPeriod || 0) : 0n,
        isFeatureAllowed('antiWhale') ? antiWhaleEnabled : false,
        maxWallet,
        isFeatureAllowed('pauseFunction') ? pauseFunctionEnabled : false,
        isFeatureAllowed('timelock') ? timelockEnabled : false,
        isFeatureAllowed('timelock') ? evmLite.toBigInt((timelockDelay || 0) * 3600) : 0n, // Convert hours to seconds
        network?.chainId || 1 // Add chainId parameter for network-aware service fee validation
      ];
      // Validate parameter count / types (plain errors for the UI)
      if (constructorParams.length !== 27) {
        throw new Error('Token setup is incomplete. Refresh and try again.');
      }
      const bigIntParams = [3, 16, 18, 20, 22, 25]; // supply, maxTx, serviceChargeWei, cooldownPeriod, maxWallet, timelockDelay
      bigIntParams.forEach((index) => {
        if (typeof constructorParams[index] !== 'bigint') {
          throw new Error('One of the amount fields is invalid. Check supply and limits, then try again.');
        }
      });
      const addressParams = [4, 17]; // freezingAuthority, platformWallet
      addressParams.forEach((index) => {
        if (typeof constructorParams[index] !== 'string' || !constructorParams[index].startsWith('0x')) {
          throw new Error('A wallet address is missing or invalid. Check freeze authority and try again.');
        }
      });
      const booleanParams = [14, 15, 19, 21, 23, 24]; // renounceMint, enableBlacklist, antiBotEnabled, antiWhaleEnabled, pauseFunctionEnabled, timelockEnabled
      booleanParams.forEach((index) => {
        if (typeof constructorParams[index] !== 'boolean') {
          throw new Error('A security toggle is in a bad state. Toggle it off and on, then try again.');
        }
      });
      if (typeof constructorParams[2] !== 'number') {
        throw new Error('Decimals must be a number between 0 and 18.');
      }
      if (typeof constructorParams[26] !== 'number') {
        throw new Error('Network could not be read. Switch chain in your wallet and try again.');
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
      
      if (tokenFactoryAddress && !isZeroEvmAddress(tokenFactoryAddress)) {
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
          cooldownPeriod: isFeatureAllowed('cooldown') && cooldownPeriod ? evmLite.toBigInt(cooldownPeriod) : 0n,
          timelockDelay: isFeatureAllowed('timelock') && timelockDelay ? evmLite.toBigInt((timelockDelay || 0) * 3600) : 0n // Convert hours to seconds
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
          if (account) rememberAssetDeployer(deployedAddress, account);
          
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
          
          showDeployCelebration({
            deploymentKind: 'EVM token (TokenFactory)',
            details: [
              { label: 'Name', value: name },
              { label: 'Symbol', value: symbol },
              { label: 'Decimals', value: String(decimals) },
              { label: 'Token address', value: deployedAddress },
              { label: 'Network', value: network?.name || 'Unknown' },
              { label: 'Factory', value: tokenFactoryAddress || '—' },
            ],
            txHash: tx.hash,
            contractAddress: deployedAddress,
            evmExplorerBaseUrl: blockExplorerBase,
          });
          recordAchievement?.(account, 'token_deploy', 'first_deploy');
          tryAccruePoints({
            address: account,
            action: 'deploy',
            txHash: tx.hash,
            chainId: network?.chainId,
            metadata: { name, symbol, tokenAddress: deployedAddress },
          });

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
          
        } else {
          throw new Error('TokenDeployed event not found in transaction receipt');
        }
        
      } else {
        // TokenFactory not live — do not silently fall back to raw bytecode deploy on mainnets.
        const fs = getFeatureSupport(Number(network?.chainId) || 0);
        if (!fs.hasTokenFactory) {
          throw new Error(
            'TokenFactory is not deployed on this network yet. Switch to Ethereum, Polygon, BSC, Arbitrum, Optimism, Base, or Sepolia — or wait for an operator deploy (see docs/contracts.md).'
          );
        }
        // Legacy direct deploy only if config claims a factory but address lookup failed oddly.
        console.log('Using direct deployment (legacy method)');
        
        try {
          const factory = new ethers.ContractFactory(ERC20_ABI, ERC20_BYTECODE, signer);
          
          // Deploy with value parameter (this is the working approach)
          const contract = await factory.deploy(...constructorParams, { value: serviceChargeWei });
          
          setTxHash(contract.deploymentTransaction().hash);
          toast.success(`Token deployment transaction sent! Hash: ${contract.deploymentTransaction().hash}`);
          
          // Wait for deployment
          await contract.waitForDeployment();
          const deployedAddress = contract.target;
          setTokenAddress(deployedAddress);
          if (account) rememberAssetDeployer(deployedAddress, account);
          
          // Create contract instance
          const deployedContract = new ethers.Contract(deployedAddress, ERC20_ABI, signer);

          showDeployCelebration({
            deploymentKind: 'EVM token (direct deploy)',
            details: [
              { label: 'Name', value: name },
              { label: 'Symbol', value: symbol },
              { label: 'Decimals', value: String(decimals) },
              { label: 'Token address', value: deployedAddress },
              { label: 'Network', value: network?.name || 'Unknown' },
            ],
            txHash: contract.deploymentTransaction().hash,
            contractAddress: deployedAddress,
            evmExplorerBaseUrl: blockExplorerBase,
          });
          recordAchievement?.(account, 'token_deploy', 'first_deploy');
          tryAccruePoints({
            address: account,
            action: 'deploy',
            txHash: contract.deploymentTransaction().hash,
            chainId: network?.chainId,
            metadata: { name, symbol, tokenAddress: deployedAddress },
          });
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
      const contractAddr = String(pendingRenounceContract.target);
      try {
        toast('Sending second transaction to renounce ownership...');
        const tx = await pendingRenounceContract.renounceOwnership();
        await tx.wait();
        setOwnershipRenounced(true);
        const renounceExplorer =
          network?.chainId != null ? getNetworkByChainId(network.chainId)?.explorer : undefined;
        showDeployCelebration({
          title: 'Congratulations!',
          deploymentKind: 'Token ownership renounced',
          details: [
            { label: 'Contract', value: contractAddr },
            { label: 'Network', value: network?.name || '—' },
          ],
          txHash: tx.hash,
          evmExplorerBaseUrl: renounceExplorer,
        });
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
              "price": isBoingTestnetChainId(network?.chainId) ? "1" : "0.01",
              "priceCurrency": isBoingTestnetChainId(network?.chainId) ? "BOING" : "ETH",
              "description": isBoingTestnetChainId(network?.chainId)
                ? "Deploy on Boing testnet; service fee in native BOING (reference ~$5/BOING in app UI)"
                : "Deploy your own ERC20 token with advanced security features"
            }
          }
        })}
        </script>
      </Helmet>
      <div className="relative w-full min-w-0">
        <TradeDeployShell width="wide">
            <TradeDeployHero
              eyebrow="Launch"
              title="Deploy token"
              subtitle="Create a token on this network."
            >
              <p className="mt-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Need an NFT too?{' '}
                <Link to="/project-pack" className="underline" style={{ color: 'var(--finance-primary)' }}>
                  Project pack
                </Link>
                {' · '}
                <button
                  type="button"
                  className="underline"
                  style={{ color: 'var(--finance-primary)' }}
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? 'Hide preview' : 'Preview'}
                </button>
                {' · '}
                <button
                  type="button"
                  className="underline"
                  style={{ color: 'var(--finance-primary)' }}
                  onClick={() => setShowHistory(!showHistory)}
                >
                  History
                </button>
              </p>
            </TradeDeployHero>

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
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Choose Your Service Plan</h2>
                  {network && (
                    <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      Pricing for <span className="font-medium" style={{ color: 'var(--finance-primary)' }}>{network.name}</span> network
                    </p>
                  )}
                  {!network && !isConnected && (
                    <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      Connect your EVM wallet to see network-specific pricing
                    </p>
                  )}
                  {!network && isConnected && (
                    <p className="text-sm mt-1 text-amber-400/90">
                      Wallet connected{account ? ` (${account.slice(0, 6)}…${account.slice(-4)})` : ''}, but the chain could not be read. Switch to a supported network in your wallet or reconnect.
                    </p>
                  )}
                  {/* Deployment Method Indicator */}
                  {network && (
                    <div className="mt-2">
                      {Number(network.chainId) === BOING_NATIVE_L1_CHAIN_ID ? null : getFeatureSupport(Number(network.chainId)).hasTokenFactory ? (
                        <div className="flex items-center text-sm text-green-400">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          TokenFactory System Available
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-amber-400">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          TokenFactory not deployed on this network — switch to a TokenFactory chain
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Switch networks to see different pricing
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPricing(!showPricing)}
                    className="td-btn td-btn--link text-sm"
                  >
                    {showPricing ? 'Hide Details' : 'View Details'}
                  </button>
                </div>
              </div>
              
              <fieldset className="border-0 p-0 m-0 min-w-0">
                <legend className="sr-only">Deployment service plan</legend>
                <div className="grid md:grid-cols-3 gap-6">
                {Object.entries(SERVICE_CHARGES).map(([key, plan]) => (
                  <label
                    key={key}
                    htmlFor={`deploy-service-plan-${key}`}
                    className="relative block p-6 rounded-xl border-2 cursor-pointer transition-all"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: selectedPlan === key ? 'var(--finance-primary)' : 'var(--border-color)',
                      boxShadow: selectedPlan === key ? '0 0 0 1px color-mix(in srgb, var(--finance-primary) 35%, transparent)' : undefined,
                    }}
                  >
                    <input
                      type="radio"
                      id={`deploy-service-plan-${key}`}
                      name="deploy-service-plan"
                      value={key}
                      checked={selectedPlan === key}
                      onChange={() => setSelectedPlan(key)}
                      className="sr-only"
                    />
                    {selectedPlan === key && (
                      <div
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center pointer-events-none"
                        style={{ backgroundColor: 'var(--finance-primary)', color: '#041018' }}
                        aria-hidden="true"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{plan.name}</h3>
                      <div className="text-3xl font-bold mb-4" style={{ color: 'var(--finance-primary)' }}>
                        {(() => {
                          const row = plan.prices[network?.chainId] || plan.prices[1];
                          const feeUsd = isBoingNativeFeeChain(network?.chainId) ? getBoingNativeFeeUsd(row?.amount) : null;
                          return (
                            <>
                              {row?.amount} {row?.currency}
                              {feeUsd != null && (
                                <span className="block text-sm font-semibold mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                  {formatUsdReferenceLabel(feeUsd)}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      
                      {showPricing && (
                        <ul className="text-sm space-y-2 mb-4" style={{ color: 'var(--text-secondary)' }}>
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
                  </label>
                ))}
                </div>
              </fieldset>
              {/* Wizard step 2 nav */}
              {useWizardMode && wizardStep === 2 && (
                <div className="flex justify-between mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <button type="button" onClick={() => setWizardStep(1)} className="td-btn td-btn--ghost">
                    Back
                  </button>
                  <button type="button" onClick={() => setWizardStep(3)} className="td-btn td-btn--primary">
                    Next: Security & Info
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
              <form
                onSubmit={handleDeploy}
                noValidate={isBoingNativeDeployPath}
                className="space-y-6 sm:space-y-8"
              >
                {/* Step 1: Basic Information + Logo */}
                <div style={{ display: !useWizardMode || wizardStep === 1 ? 'block' : 'none' }}>
                  <h3 className="td-section-title">Basic Token Information</h3>
                  <p className="td-section-sub">Name, symbol, supply, and logo for your token.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label htmlFor="deploy-evm-name" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Token Name *
                      </label>
                      <input
                        id="deploy-evm-name"
                        name="name"
                        type="text"
                        autoComplete="off"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="td-field__input"
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
                      <label htmlFor="deploy-evm-symbol" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Token Symbol *
                      </label>
                      <input
                        id="deploy-evm-symbol"
                        name="symbol"
                        type="text"
                        autoComplete="off"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                        className="td-field__input"
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
                      <label htmlFor="deploy-evm-decimals" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Decimals
                      </label>
                      {isBoingNativeDeployPath ? (
                        <>
                          <input
                            id="deploy-evm-decimals"
                            name="decimals"
                            type="text"
                            readOnly
                            value={`${BOING_TOKEN_V2_DECIMALS} (whole units)`}
                            data-testid="deploy-boing-decimals"
                            className="td-field__input"
                            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                          />
                          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Boing token v2 counts whole tokens, like BOING itself.</p>
                        </>
                      ) : (
                      <select
                        id="deploy-evm-decimals"
                        name="decimals"
                        autoComplete="off"
                        value={decimals}
                        onChange={(e) => setDecimals(parseInt(e.target.value))}
                        className="td-field__input" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      >
                        <option value={18}>18 (Standard)</option>
                        <option value={6}>6 (USDC style)</option>
                        <option value={8}>8 (Bitcoin style)</option>
                      </select>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="deploy-evm-supply" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Initial Supply *
                      </label>
                      <input
                        id="deploy-evm-supply"
                        name="initialSupply"
                        type="number"
                        value={initialSupply}
                        onChange={(e) => setInitialSupply(e.target.value)}
                        className="td-field__input"
                        style={{
                          backgroundColor: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                        placeholder="1000000"
                        min="1"
                        step={isBoingNativeDeployPath ? '1' : undefined}
                        required
                      />
                      {isBoingNativeDeployPath && (
                        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Whole tokens, minted once to your account.</p>
                      )}
                    </div>
                  </div>

                  {/* Logo Information */}
                  <div className="mt-4 sm:mt-6">
                    <h3 className="text-lg sm:text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Token Logo</h3>
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
                    <button type="button" onClick={() => setWizardStep(2)} className="td-btn td-btn--primary">
                      Next: Network & Plan
                    </button>
                  </div>
                )}

                {/* Step 3: Project Information + Security + Social */}
                <div style={{ display: !useWizardMode || wizardStep === 3 ? 'block' : 'none' }}>
                {/* Project Information */}
                <div>
                  <h3 className="td-section-title">Project Information</h3>
                  <p className="td-section-sub">Website and short description shown with your token.</p>
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <label htmlFor="deploy-evm-website" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Website URL *
                      </label>
                      <input
                        id="deploy-evm-website"
                        name="website"
                        type="url"
                        autoComplete="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="td-field__input"
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
                      <label htmlFor="deploy-evm-description" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Project Description
                      </label>
                      <textarea
                        id="deploy-evm-description"
                        name="description"
                        autoComplete="off"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="td-field__input"
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
                  <h3 className="td-section-title">Security Features</h3>
                  <p className="td-section-sub">
                    {isBoingNativeDeployPath
                      ? 'Boing token v2 has these protections built in. The other options need custom contract code and are not available on Boing.'
                      : 'Toggle protections for this token. Risk labels are plain guidance — not legal advice.'}
                  </p>
                  {isBoingNativeDeployPath ? (
                    <BoingTokenV2SecurityNote />
                  ) : (
                  <div className="td-feature-matrix">
                    {SECURITY_FEATURES.map((feature, index) => {
                      const isAllowed = isFeatureAllowed(feature.featureKey);
                      const restrictionMessage = getFeatureRestrictionMessage(feature.featureKey);
                      
                      return (
                        <div key={index} className="td-feature-row">
                          <div className="td-feature-row__top">
                            <div className="td-feature-row__meta">
                                <h4 id={`deploy-security-${feature.featureKey}`} className="td-feature-row__title">{feature.name}</h4>
                                <p className="td-feature-row__desc">{feature.description}</p>
                                <span className={`td-risk ${riskClass(feature.risk)}`}>
                                  {feature.risk} risk
                                </span>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              {!isAllowed && restrictionMessage && (
                                <span className="text-xs" style={{ color: 'var(--finance-red-light)' }}>{restrictionMessage}</span>
                              )}
                              
                              {feature.featureKey === "renounceMint" && (
                                <ToggleButton
                                  enabled={renounceMint}
                                  onToggle={() => setRenounceMint(!renounceMint)}
                                  disabled={!isAllowed}
                                  ariaLabelledBy={`deploy-security-${feature.featureKey}`}
                                />
                              )}
                              
                              {feature.featureKey === "enableFreezing" && (
                                <ToggleButton
                                  enabled={enableFreezing}
                                  onToggle={() => setEnableFreezing(!enableFreezing)}
                                  disabled={!isAllowed}
                                  ariaLabelledBy={`deploy-security-${feature.featureKey}`}
                                />
                              )}
                              
                              {feature.featureKey === "enableBlacklist" && (
                                <ToggleButton
                                  enabled={enableBlacklist}
                                  onToggle={() => setEnableBlacklist(!enableBlacklist)}
                                  disabled={!isAllowed}
                                  ariaLabelledBy={`deploy-security-${feature.featureKey}`}
                                />
                              )}
                              
                              {feature.featureKey === "maxTxAmount" && (
                                <ToggleButton
                                  enabled={maxTxAmount !== ''}
                                  onToggle={() => setMaxTxAmount(maxTxAmount === '' ? '1' : '')}
                                  disabled={!isAllowed}
                                  ariaLabelledBy={`deploy-security-${feature.featureKey}`}
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
                                  ariaLabelledBy={`deploy-security-${feature.featureKey}`}
                                />
                              )}
                              
                              {feature.featureKey === "antiBot" && (
                                <ToggleButton
                                  enabled={antiBotEnabled}
                                  onToggle={() => setAntiBotEnabled(!antiBotEnabled)}
                                  disabled={!isAllowed}
                                  ariaLabelledBy={`deploy-security-${feature.featureKey}`}
                                />
                              )}
                              
                              {feature.featureKey === "cooldown" && (
                                <ToggleButton
                                  enabled={cooldownPeriod !== ''}
                                  onToggle={() => setCooldownPeriod(cooldownPeriod === '' ? '30' : '')}
                                  disabled={!isAllowed}
                                  ariaLabelledBy={`deploy-security-${feature.featureKey}`}
                                />
                              )}
                              
                              {feature.featureKey === "antiWhale" && (
                                <ToggleButton
                                  enabled={antiWhaleEnabled}
                                  onToggle={() => setAntiWhaleEnabled(!antiWhaleEnabled)}
                                  disabled={!isAllowed}
                                  ariaLabelledBy={`deploy-security-${feature.featureKey}`}
                                />
                              )}
                              
                              {feature.featureKey === "pauseFunction" && (
                                <ToggleButton
                                  enabled={pauseFunctionEnabled}
                                  onToggle={() => setPauseFunctionEnabled(!pauseFunctionEnabled)}
                                  disabled={!isAllowed}
                                  ariaLabelledBy={`deploy-security-${feature.featureKey}`}
                                />
                              )}
                              
                              {feature.featureKey === "timelock" && (
                                <ToggleButton
                                  enabled={timelockEnabled}
                                  onToggle={() => setTimelockEnabled(!timelockEnabled)}
                                  disabled={!isAllowed}
                                  ariaLabelledBy={`deploy-security-${feature.featureKey}`}
                                />
                              )}
                              
                              {feature.featureKey === "maxWallet" && (
                                <ToggleButton
                                  enabled={maxWalletEnabled}
                                  onToggle={() => setMaxWalletEnabled(!maxWalletEnabled)}
                                  disabled={!isAllowed}
                                  ariaLabelledBy={`deploy-security-${feature.featureKey}`}
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
                                className="td-field__input text-sm"
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
                                className="td-field__input text-sm"
                                placeholder="30"
                                min="1"
                                max="3600"
                                step="1"
                              />
                              <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                Cooldown period between transactions in seconds (1-3600)
                                {cooldownPeriod === '30' && (
                                  <span className="ml-1" style={{ color: 'var(--finance-primary)' }}>· Default: 30 seconds</span>
                                )}
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
                                <span className="text-xs sm:text-sm w-12 sm:w-16" style={{ color: 'var(--text-secondary)' }}>{maxWalletPercentage}%</span>
                              </div>
                              <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                Maximum wallet holdings as percentage of total supply (0.1% - 5%)
                                {maxWalletPercentage === '2' && (
                                  <span className="ml-1" style={{ color: 'var(--finance-primary)' }}>· Default: 2%</span>
                                )}
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
                                <span className="text-xs sm:text-sm w-12 sm:w-20" style={{ color: 'var(--text-secondary)' }}>{timelockDelay}h</span>
                              </div>
                              <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                Timelock delay for administrative functions (1-168 hours)
                                {timelockDelay === '24' && <span className="ml-1" style={{ color: 'var(--finance-primary)' }}>• Default: 24 hours</span>}
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
                                className="td-field__input text-sm"
                                placeholder="1.0"
                                min="0.1"
                                max="10"
                                step="0.1"
                              />
                              <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                Maximum transaction amount as percentage of total supply (0.1% - 10%)
                                {maxTxAmount === '1' && <span className="ml-1" style={{ color: 'var(--finance-primary)' }}>• Default: 1%</span>}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>

                {/* Social Links */}
                <div>
                  <h3 className="td-section-title">Social Links</h3>
                  <p className="td-section-sub">Optional. Add project links builders and traders can verify.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {Object.entries(socialLinks).map(([platform, value]) => (
                      <div key={platform}>
                        <label htmlFor={`deploy-social-${platform}`} className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                          {platform.charAt(0).toUpperCase() + platform.slice(1)} URL
                        </label>
                        <input
                          id={`deploy-social-${platform}`}
                          name={`social-${platform}`}
                          type="url"
                          value={value}
                          onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                          className="td-field__input"
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
                    <button type="button" onClick={() => setWizardStep(2)} className="td-btn td-btn--ghost">
                      Back
                    </button>
                    <button type="button" onClick={() => setWizardStep(4)} className="td-btn td-btn--primary">
                      Next: Review & Deploy
                    </button>
                  </div>
                )}
                </div>

                {/* Step 4: Deploy Button */}
                <div style={{ display: !useWizardMode || wizardStep === 4 ? 'block' : 'none' }}>
                {isBoingNativeDeployPath && (
                  <>
                    <p className="text-sm mb-3 rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                      We&apos;ll publish your token with the <strong style={{ color: 'var(--text-primary)' }}>name</strong> and{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>symbol</strong> above. Express will ask you to approve.
                      Open Advanced only if you need overrides.
                    </p>
                    {!nativeWizardGate.canSubmit && (
                      <div
                        role="status"
                        className="text-sm mb-3 rounded-lg border px-3 py-2"
                        style={{
                          borderColor: 'rgba(251, 191, 36, 0.55)',
                          backgroundColor: 'rgba(251, 191, 36, 0.08)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <strong style={{ color: 'var(--text-primary)' }}>Deployment isn&apos;t ready on this build yet.</strong>{' '}
                        Try again later, or open Advanced if an operator asked you to paste a template.
                      </div>
                    )}
                    <NativeBoingTokenDeploySection
                      ref={nativeTokenDeployRef}
                      embedInWizard
                      tokenName={name}
                      tokenSymbol={symbol}
                      initialSupply={initialSupply}
                      metadataUri={metadataUrl}
                      committedDescriptionHash={publishedDescriptionHash}
                      logoUri={publicAssetUri(logoUrl) || logoUrl}
                      onEnsureMetadataPublished={ensurePublishedTokenMetadata}
                      onDeployGateChange={onNativeDeployGateChange}
                      linkCollectionId={linkCollectionFromQuery}
                    />
                  </>
                )}
                {/* Deploy Button */}
                <div className="text-center pt-4 sm:pt-6">
                  <button
                    type="submit"
                    disabled={
                      deploying ||
                      !isConnected ||
                      (isBoingNativeDeployPath ? !nativeWizardGate.canSubmit : !signer)
                    }
                    className="td-btn td-btn--primary w-full sm:w-auto py-3 sm:py-4 px-6 sm:px-8 text-base sm:text-lg disabled:opacity-50"
                  >
                    {deploying ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 sm:h-5 w-4 sm:w-5 border-b-2 border-white mr-2"></div>
                        Deploying Token...
                      </div>
                    ) : isBoingNativeDeployPath ? (
                      // The Boing path charges no service fee (only the network fee for the two transactions).
                      'Deploy Boing token'
                    ) : (
                      deployCtaLabel(selectedPlan, network)
                    )}
                  </button>
                </div>

                {/* Wizard step 4 nav (Back only) */}
                {useWizardMode && wizardStep === 4 && (
                  <div className="flex justify-start mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <button type="button" onClick={() => setWizardStep(3)} className="td-btn td-btn--ghost">
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
                <h3 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Deployment Status</h3>
                
                {txHash && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Transaction Hash:</p>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <code className="px-3 py-2 rounded text-xs sm:text-sm font-mono break-all" style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)'
                      }}>
                        {txHash}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(txHash)}
                        className="td-btn--link text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
                
                {tokenAddress && (
                  <div>
                    <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Token Address:</p>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <code className="px-3 py-2 rounded text-xs sm:text-sm font-mono break-all" style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)'
                      }}>
                        {tokenAddress}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(tokenAddress)}
                        className="td-btn--link text-sm"
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
                  onRenounce={async () => {
    const ethers = await loadEthers();
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

            {tokenAddress && !isBoingNativeDeployPath ? (
              <div className="mt-6 sm:mt-8">
                <LinkedNftTokenPanel
                  seedTokenId={tokenAddress}
                  seedCollectionId={linkCollectionFromQuery}
                  tokenLabel={symbol || name}
                  title="Link an NFT collection"
                />
              </div>
            ) : null}

            {/* Metadata Information */}
            {metadataUrl && (
              <div className="rounded-2xl shadow-xl p-4 sm:p-6 mt-6 sm:mt-8 border" style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)'
              }}>
                <h3 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Token Metadata</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>IPFS Metadata URL:</p>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <code className="px-3 py-2 rounded text-xs sm:text-sm font-mono break-all" style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)'
                      }}>
                        {metadataUrl}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(metadataUrl)}
                        className="td-btn--link text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  {logoUrl && (
                    <div>
                      <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Logo URL:</p>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <code className="px-3 py-2 rounded text-xs sm:text-sm font-mono break-all" style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)'
                      }}>
                          {logoUrl}
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText(logoUrl)}
                          className="td-btn--link text-sm"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="td-callout">
                    <h4 className="td-callout__title">Metadata</h4>
                    <div className="td-callout__body space-y-1.5">
                      <p>Stored on IPFS with name, symbol, description, logo, and social links.</p>
                      <p>Logo URL and metadata URI are written into the contract at deploy.</p>
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0 gap-2">
                <h3 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Deployment Tips</h3>
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className="td-btn--link text-sm sm:text-base self-start sm:self-auto"
                >
                  {showGuide ? 'Hide tips' : 'Show tips'}
                </button>
              </div>
              
              {showGuide && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {DEPLOYMENT_TIPS.map((tip, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div
                        className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2"
                        style={{ backgroundColor: 'var(--finance-primary)' }}
                      />
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{tip}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ownership Renouncement Notice Modal */}
            {showOwnershipRenounceModal && (
              <div className="td-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="ownership-notice-title">
                <div className="td-modal">
                  <h3 id="ownership-notice-title" className="td-modal__title">Renounce ownership</h3>
                  <div className="td-modal__body space-y-3">
                    <p>
                      This is not automatic at deploy. After the token is live, you send a second transaction to renounce ownership.
                    </p>
                    <div className="td-callout td-callout--warn">
                      <p className="td-callout__title">Irreversible</p>
                      <p className="td-callout__body">
                        You will lose admin controls: security settings, pause, and other owner-only actions.
                      </p>
                    </div>
                  </div>
                  <div className="td-modal__actions">
                    <button
                      type="button"
                      onClick={() => setShowOwnershipRenounceModal(false)}
                      className="td-btn td-btn--ghost"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRenounceOwnership(true);
                        setShowOwnershipRenounceModal(false);
                      }}
                      className="td-btn td-btn--primary"
                    >
                      Enable
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Renounce Ownership Confirmation Modal */}
            {showRenounceModal && (
              <div className="td-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="renounce-confirm-title">
                <div className="td-modal">
                  <h3 id="renounce-confirm-title" className="td-modal__title">Confirm renounce</h3>
                  <p className="td-modal__body">
                    Renounce ownership needs a second on-chain transaction after deploy. Continue?
                  </p>
                  <div className="td-modal__actions">
                    <button
                      type="button"
                      onClick={() => { setShowRenounceModal(false); setPendingRenounceContract(null); }}
                      className="td-btn td-btn--ghost"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmRenounce}
                      className="td-btn td-btn--danger"
                    >
                      Renounce ownership
                    </button>
                  </div>
                </div>
              </div>
            )}
        </TradeDeployShell>
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

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import toast from 'react-hot-toast';
import { getNetworkByChainId } from '../config/networks';
import AdvancedERC20Artifact from '../artifacts/AdvancedERC20.json';
import TokenFactoryArtifact from '../artifacts/TokenFactory.json';
import TokenImplementationArtifact from '../artifacts/TokenImplementation.json';
import { useNetwork } from '../hooks/useNetwork';
import { getApiUrl } from '../config';
import axios from 'axios';
import TokenManagementModal from '../components/TokenManagementModal';
import NetworkSelector from '../components/NetworkSelector';
import GasFeeEstimator from '../components/GasFeeEstimator';
import SecurityBadges from '../components/SecurityBadges';
import { InfoTooltip, WarningTooltip, HelpTooltip } from '../components/Tooltip';
import { Helmet } from 'react-helmet-async';
import { getContractAddress } from '../config/contracts';
import LogoUpload from '../components/LogoUpload';
import { uploadMetadataToIPFS, createTokenMetadata } from '../utils/ipfsUpload';

// Import ABI and bytecode from the artifacts
const ERC20_ABI = AdvancedERC20Artifact.abi;
const ERC20_BYTECODE = AdvancedERC20Artifact.bytecode;
const TOKEN_FACTORY_ABI = TokenFactoryArtifact.abi;
const TOKEN_IMPLEMENTATION_ABI = TokenImplementationArtifact.abi;

function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden w-full h-full">
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="xMidYMid slice"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="absolute inset-0 w-full h-full min-w-full min-h-full"
      >
        
        {/* Enhanced Floating Orbs - More variety and positions */}
        <circle cx="20" cy="20" r="4" fill="#00E0FF" opacity="0.12">
          <animate attributeName="cy" values="20;22;20" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle cx="80" cy="30" r="3" fill="#7B61FF" opacity="0.10">
          <animate attributeName="cy" values="30;32;30" dur="7s" repeatCount="indefinite" />
        </circle>
        <circle cx="40" cy="80" r="5" fill="#00FFB2" opacity="0.08">
          <animate attributeName="cy" values="80;82;80" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="35" cy="90" r="2.5" fill="#fff" opacity="0.07">
          <animate attributeName="cy" values="90;92;90" dur="5s" repeatCount="indefinite" />
        </circle>
        
        {/* Additional Top Half Orbs */}
        <circle cx="10" cy="15" r="3.5" fill="#FF6B6B" opacity="0.11">
          <animate attributeName="cy" values="15;17;15" dur="9s" repeatCount="indefinite" />
        </circle>
        <circle cx="90" cy="10" r="2.8" fill="#4ECDC4" opacity="0.09">
          <animate attributeName="cy" values="10;12;10" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="5" r="3.2" fill="#FFD93D" opacity="0.10">
          <animate attributeName="cy" values="5;7;5" dur="7s" repeatCount="indefinite" />
        </circle>
        <circle cx="70" cy="25" r="2.3" fill="#FF8A80" opacity="0.08">
          <animate attributeName="cy" values="25;27;25" dur="10s" repeatCount="indefinite" />
        </circle>
        <circle cx="30" cy="8" r="2.7" fill="#81C784" opacity="0.09">
          <animate attributeName="cy" values="8;10;8" dur="11s" repeatCount="indefinite" />
        </circle>
        
        {/* Additional Large Orbs */}
        <circle cx="15" cy="50" r="3.5" fill="#FF6B6B" opacity="0.09">
          <animate attributeName="cx" values="15;16;15" dur="12s" repeatCount="indefinite" />
          <animate attributeName="cy" values="50;48;50" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="85" cy="60" r="3" fill="#4ECDC4" opacity="0.11">
          <animate attributeName="cx" values="85;84;85" dur="10s" repeatCount="indefinite" />
          <animate attributeName="cy" values="60;62;60" dur="9s" repeatCount="indefinite" />
        </circle>
        <circle cx="55" cy="15" r="2.5" fill="#FFD93D" opacity="0.08">
          <animate attributeName="cx" values="55;56;55" dur="11s" repeatCount="indefinite" />
          <animate attributeName="cy" values="15;17;15" dur="7s" repeatCount="indefinite" />
        </circle>
        
        {/* Medium Floating Elements */}
        <circle cx="60" cy="15" r="2" fill="#FF6B6B" opacity="0.09">
          <animate attributeName="cx" values="60;61;60" dur="9s" repeatCount="indefinite" />
        </circle>
        <circle cx="30" cy="55" r="2.5" fill="#4ECDC4" opacity="0.11">
          <animate attributeName="cy" values="55;53;55" dur="10s" repeatCount="indefinite" />
        </circle>
        <circle cx="80" cy="75" r="1.5" fill="#45B7D1" opacity="0.08">
          <animate attributeName="cx" values="80;79;80" dur="11s" repeatCount="indefinite" />
        </circle>
        
        {/* New Medium Elements */}
        <circle cx="10" cy="35" r="2" fill="#FF8A80" opacity="0.10">
          <animate attributeName="cx" values="10;11;10" dur="13s" repeatCount="indefinite" />
          <animate attributeName="cy" values="35;37;35" dur="11s" repeatCount="indefinite" />
        </circle>
        <circle cx="90" cy="25" r="2.5" fill="#81C784" opacity="0.09">
          <animate attributeName="cx" values="90;89;90" dur="14s" repeatCount="indefinite" />
          <animate attributeName="cy" values="25;23;25" dur="12s" repeatCount="indefinite" />
        </circle>
        <circle cx="45" cy="70" r="1.8" fill="#FFB74D" opacity="0.08">
          <animate attributeName="cx" values="45;46;45" dur="15s" repeatCount="indefinite" />
          <animate attributeName="cy" values="70;72;70" dur="13s" repeatCount="indefinite" />
        </circle>
        
        {/* Enhanced Rotating Geometric Shapes */}
        <rect x="18" y="8" width="3" height="3" fill="#FFD93D" opacity="0.06" rx="0.6">
          <animateTransform attributeName="transform" type="rotate" values="0 19.5 9.5;360 19.5 9.5" dur="15s" repeatCount="indefinite" />
        </rect>
        <polygon points="90,20 91,18 92,20 91,22" fill="#FF8A80" opacity="0.07">
          <animateTransform attributeName="transform" type="rotate" values="0 91 20;360 91 20" dur="12s" repeatCount="indefinite" />
        </polygon>
        <ellipse cx="45" cy="30" rx="2" ry="1.2" fill="#81C784" opacity="0.08">
          <animateTransform attributeName="transform" type="rotate" values="0 45 30;360 45 30" dur="18s" repeatCount="indefinite" />
        </ellipse>
        
        {/* New Geometric Shapes */}
        <polygon points="7,75 8,73 9,75 8,77" fill="#FF6B6B" opacity="0.07">
          <animateTransform attributeName="transform" type="rotate" values="0 8 75;360 8 75" dur="20s" repeatCount="indefinite" />
        </polygon>
        <rect x="93" y="85" width="2.5" height="2.5" fill="#4ECDC4" opacity="0.06" rx="0.5">
          <animateTransform attributeName="transform" type="rotate" values="0 94.25 86.25;360 94.25 86.25" dur="16s" repeatCount="indefinite" />
        </rect>
        <polygon points="3,15 4,13 5,15 4,17" fill="#FFB74D" opacity="0.08">
          <animateTransform attributeName="transform" type="rotate" values="0 4 15;360 4 15" dur="22s" repeatCount="indefinite" />
        </polygon>
        <ellipse cx="80" cy="50" rx="1.5" ry="1" fill="#FF8A80" opacity="0.07">
          <animateTransform attributeName="transform" type="rotate" values="0 80 50;360 80 50" dur="19s" repeatCount="indefinite" />
        </ellipse>
        
        {/* Enhanced Twinkling Stars - More variety */}
        <circle cx="25" cy="12" r="0.12" fill="#fff">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="55" cy="22" r="0.1" fill="#00E0FF">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="85" cy="55" r="0.12" fill="#7B61FF">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="40" cy="18" r="0.11" fill="#FF6B6B">
          <animate attributeName="opacity" values="0.1;0.8;0.1" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="65" cy="45" r="0.08" fill="#4ECDC4">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="75" cy="12" r="0.1" fill="#FFD93D">
          <animate attributeName="opacity" values="0.3;0.9;0.3" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="20" cy="70" r="0.09" fill="#FF8A80">
          <animate attributeName="opacity" values="0.1;0.7;0.1" dur="3.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="70" cy="90" r="0.11" fill="#81C784">
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2.9s" repeatCount="indefinite" />
        </circle>
        
        {/* Additional Top Half Twinkling Stars */}
        <circle cx="5" cy="8" r="0.09" fill="#FFB74D">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2.3s" repeatCount="indefinite" />
        </circle>
        <circle cx="95" cy="12" r="0.11" fill="#00FFB2">
          <animate attributeName="opacity" values="0.1;0.9;0.1" dur="3.7s" repeatCount="indefinite" />
        </circle>
        <circle cx="12" cy="25" r="0.08" fill="#7B61FF">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2.1s" repeatCount="indefinite" />
        </circle>
        <circle cx="88" cy="18" r="0.10" fill="#FF6B6B">
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3.1s" repeatCount="indefinite" />
        </circle>
        <circle cx="45" cy="3" r="0.12" fill="#4ECDC4">
          <animate attributeName="opacity" values="0.1;0.7;0.1" dur="2.9s" repeatCount="indefinite" />
        </circle>
        <circle cx="62" cy="15" r="0.07" fill="#FFD93D">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx="35" cy="6" r="0.09" fill="#FF8A80">
          <animate attributeName="opacity" values="0.2;0.9;0.2" dur="3.3s" repeatCount="indefinite" />
        </circle>
        
        {/* New Twinkling Stars */}
        <circle cx="15" cy="25" r="0.08" fill="#FFB74D">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="2.7s" repeatCount="indefinite" />
        </circle>
        <circle cx="90" cy="35" r="0.12" fill="#00FFB2">
          <animate attributeName="opacity" values="0.1;0.9;0.1" dur="3.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="7" cy="85" r="0.07" fill="#7B61FF">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx="85" cy="20" r="0.1" fill="#FF6B6B">
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3.1s" repeatCount="indefinite" />
        </circle>
        <circle cx="35" cy="35" r="0.11" fill="#4ECDC4">
          <animate attributeName="opacity" values="0.1;0.7;0.1" dur="3.3s" repeatCount="indefinite" />
        </circle>
        <circle cx="65" cy="75" r="0.09" fill="#FFD93D">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2.6s" repeatCount="indefinite" />
        </circle>
        
        {/* Enhanced Floating Particles */}
        <circle cx="35" cy="30" r="0.18" fill="#00E0FF" opacity="0.4">
          <animate attributeName="cy" values="30;28;30" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="60" cy="55" r="0.12" fill="#7B61FF" opacity="0.3">
          <animate attributeName="cx" values="60;61;60" dur="5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.05;0.3" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="45" cy="90" r="0.15" fill="#00FFB2" opacity="0.35">
          <animate attributeName="cy" values="90;88;90" dur="6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0.08;0.35" dur="6s" repeatCount="indefinite" />
        </circle>
        
        {/* Additional Top Half Floating Particles */}
        <circle cx="15" cy="20" r="0.16" fill="#FF6B6B" opacity="0.3">
          <animate attributeName="cx" values="15;16;15" dur="6s" repeatCount="indefinite" />
          <animate attributeName="cy" values="20;18;20" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.05;0.3" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle cx="85" cy="15" r="0.14" fill="#4ECDC4" opacity="0.25">
          <animate attributeName="cx" values="85;84;85" dur="7s" repeatCount="indefinite" />
          <animate attributeName="cy" values="15;17;15" dur="5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.25;0.08;0.25" dur="7s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="8" r="0.19" fill="#FFD93D" opacity="0.4">
          <animate attributeName="cx" values="50;51;50" dur="8s" repeatCount="indefinite" />
          <animate attributeName="cy" values="8;10;8" dur="6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="25" cy="12" r="0.13" fill="#FF8A80" opacity="0.35">
          <animate attributeName="cx" values="25;26;25" dur="9s" repeatCount="indefinite" />
          <animate attributeName="cy" values="12;14;12" dur="7s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0.08;0.35" dur="9s" repeatCount="indefinite" />
        </circle>
        <circle cx="75" cy="22" r="0.17" fill="#81C784" opacity="0.3">
          <animate attributeName="cx" values="75;76;75" dur="5s" repeatCount="indefinite" />
          <animate attributeName="cy" values="22;20;22" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.05;0.3" dur="5s" repeatCount="indefinite" />
        </circle>
        
        {/* New Floating Particles */}
        <circle cx="20" cy="75" r="0.13" fill="#FF6B6B" opacity="0.3">
          <animate attributeName="cx" values="20;21;20" dur="7s" repeatCount="indefinite" />
          <animate attributeName="cy" values="75;73;75" dur="5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.05;0.3" dur="7s" repeatCount="indefinite" />
        </circle>
        <circle cx="80" cy="45" r="0.11" fill="#4ECDC4" opacity="0.25">
          <animate attributeName="cx" values="80;79;80" dur="8s" repeatCount="indefinite" />
          <animate attributeName="cy" values="45;47;45" dur="6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.25;0.08;0.25" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="40" cy="50" r="0.17" fill="#FFD93D" opacity="0.4">
          <animate attributeName="cx" values="40;41;40" dur="9s" repeatCount="indefinite" />
          <animate attributeName="cy" values="50;52;50" dur="7s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="9s" repeatCount="indefinite" />
        </circle>
        <circle cx="65" cy="25" r="0.09" fill="#FF8A80" opacity="0.35">
          <animate attributeName="cx" values="65;66;65" dur="6s" repeatCount="indefinite" />
          <animate attributeName="cy" values="25;27;25" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0.08;0.35" dur="6s" repeatCount="indefinite" />
        </circle>
        
        {/* Enhanced Pulsing Elements */}
        <circle cx="70" cy="45" r="1.1" fill="#FF6B6B" opacity="0.05">
          <animate attributeName="r" values="1.1;1.7;1.1" dur="8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.05;0.15;0.05" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="20" cy="45" r="0.9" fill="#4ECDC4" opacity="0.06">
          <animate attributeName="r" values="0.9;1.4;0.9" dur="10s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.06;0.12;0.06" dur="10s" repeatCount="indefinite" />
        </circle>
        
        {/* New Pulsing Elements */}
        <circle cx="55" cy="60" r="1.2" fill="#FFD93D" opacity="0.04">
          <animate attributeName="r" values="1.2;1.9;1.2" dur="12s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.04;0.18;0.04" dur="12s" repeatCount="indefinite" />
        </circle>
        <circle cx="25" cy="85" r="1" fill="#FF8A80" opacity="0.05">
          <animate attributeName="r" values="1;1.6;1" dur="9s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.05;0.14;0.05" dur="9s" repeatCount="indefinite" />
        </circle>
        <circle cx="85" cy="75" r="1.3" fill="#81C784" opacity="0.03">
          <animate attributeName="r" values="1.3;2.1;1.3" dur="14s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.03;0.16;0.03" dur="14s" repeatCount="indefinite" />
        </circle>
        
        {/* Wave-like Elements */}
        <path d="M0,50 Q20,45 40,50 T80,50 T120,50 T100,50 L100,100 L0,100 Z" fill="#00E0FF" opacity="0.03">
          <animate attributeName="d" 
            values="M0,50 Q20,45 40,50 T80,50 T120,50 T100,50 L100,100 L0,100 Z;
                    M0,50 Q20,55 40,50 T80,50 T120,50 T100,50 L100,100 L0,100 Z;
                    M0,50 Q20,45 40,50 T80,50 T120,50 T100,50 L100,100 L0,100 Z" 
            dur="20s" repeatCount="indefinite" />
        </path>
        
        {/* Floating Lines */}
        <line x1="7" y1="20" x2="13" y2="20" stroke="#7B61FF" strokeWidth="0.06" opacity="0.1">
          <animate attributeName="x1" values="7;8;7" dur="15s" repeatCount="indefinite" />
          <animate attributeName="x2" values="13;14;13" dur="15s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.1;0.3;0.1" dur="15s" repeatCount="indefinite" />
        </line>
        <line x1="80" y1="80" x2="85" y2="80" stroke="#FF6B6B" strokeWidth="0.06" opacity="0.08">
          <animate attributeName="x1" values="80;79;80" dur="18s" repeatCount="indefinite" />
          <animate attributeName="x2" values="85;84;85" dur="18s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.08;0.25;0.08" dur="18s" repeatCount="indefinite" />
        </line>
        
        {/* Diagonal Floating Lines */}
        <line x1="3" y1="90" x2="10" y2="80" stroke="#4ECDC4" strokeWidth="0.06" opacity="0.06">
          <animate attributeName="x1" values="3;4;3" dur="16s" repeatCount="indefinite" />
          <animate attributeName="y1" values="90;88;90" dur="16s" repeatCount="indefinite" />
          <animate attributeName="x2" values="10;11;10" dur="16s" repeatCount="indefinite" />
          <animate attributeName="y2" values="80;78;80" dur="16s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.06;0.2;0.06" dur="16s" repeatCount="indefinite" />
        </line>
        
        {/* Scattered Small Dots */}
        <circle cx="18" cy="90" r="0.06" fill="#fff" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="90" cy="15" r="0.06" fill="#00E0FF" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="7" cy="60" r="0.06" fill="#FF6B6B" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0.9;0.5" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="85" cy="90" r="0.06" fill="#4ECDC4" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="8" r="0.06" fill="#FFD93D" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="4.5s" repeatCount="indefinite" />
        </circle>
        
        {/* Gradient Background Elements */}
        <defs>
          <radialGradient id="grad1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00E0FF" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#00E0FF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="grad2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7B61FF" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#7B61FF" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        <circle cx="25" cy="35" r="12" fill="url(#grad1)">
          <animate attributeName="opacity" values="0.3;0.6;0.3" dur="25s" repeatCount="indefinite" />
        </circle>
        <circle cx="65" cy="60" r="15" fill="url(#grad2)">
          <animate attributeName="opacity" values="0.2;0.5;0.2" dur="30s" repeatCount="indefinite" />
        </circle>
        
      </svg>
    </div>
  );
}

// MochiAstronaut component
function MochiAstronaut({ position = "bottom-right" }) {
  const getPositionClasses = () => {
    switch (position) {
      case "top-right":
        return "absolute right-0 top-0 mt-4 mr-4 z-20";
      case "bottom-right":
        return "absolute right-0 bottom-0 mb-4 mr-4 z-20";
      case "top-left":
        return "absolute left-0 top-0 mt-4 ml-4 z-20";
      case "bottom-left":
        return "absolute left-0 bottom-0 mb-4 ml-4 z-20";
      default:
        return "absolute right-0 bottom-0 mb-4 mr-4 z-20";
    }
  };

  return (
    <svg width="60" height="60" viewBox="0 0 200 200" className={`animate-float ${getPositionClasses()}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <ellipse cx="100" cy="175" rx="28" ry="8" fill="#1e293b" opacity="0.13" />
        <ellipse cx="100" cy="85" rx="48" ry="44" fill="#fff" stroke="#bfc9d9" strokeWidth="3" />
        <ellipse cx="100" cy="85" rx="42" ry="38" fill="#00E0FF" fillOpacity="0.2" stroke="#7dd3fc" strokeWidth="3" />
        <ellipse cx="100" cy="90" rx="32" ry="30" fill="#f8fafc" stroke="#bfc9d9" strokeWidth="2" />
        <ellipse cx="88" cy="95" rx="5" ry="5" fill="#60a5fa" />
        <ellipse cx="112" cy="95" rx="5" ry="5" fill="#60a5fa" />
        <ellipse cx="88" cy="94" rx="1.2" ry="2" fill="#fff" opacity="0.7" />
        <ellipse cx="112" cy="94" rx="1.2" ry="2" fill="#fff" opacity="0.7" />
        <ellipse cx="85" cy="75" rx="12" ry="6" fill="#fff" opacity="0.18" />
        <ellipse cx="100" cy="140" rx="28" ry="24" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
        <ellipse cx="78" cy="135" rx="7" ry="13" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
        <ellipse cx="122" cy="135" rx="7" ry="13" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
        <ellipse cx="72" cy="147" rx="6" ry="6" fill="#f8fafc" stroke="#bfc9d9" strokeWidth="2" />
        <ellipse cx="128" cy="147" rx="6" ry="6" fill="#f8fafc" stroke="#bfc9d9" strokeWidth="2" />
        <ellipse cx="88" cy="165" rx="7" ry="12" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
        <ellipse cx="112" cy="165" rx="7" ry="12" fill="#e0e7ef" stroke="#bfc9d9" strokeWidth="2" />
        <ellipse cx="88" cy="180" rx="8" ry="4" fill="#a5b4fc" />
        <ellipse cx="112" cy="180" rx="8" ry="4" fill="#a5b4fc" />
        <ellipse cx="100" cy="150" rx="10" ry="8" fill="#bae6fd" stroke="#7dd3fc" strokeWidth="1.5" />
      </g>
      <animateTransform attributeName="transform" type="translate" values="0 0; 0 -12; 0 0" dur="4s" repeatCount="indefinite" />
    </svg>
  );
}

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
const SOCIAL_STANDARDS = [
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
async function manualDeployWithInterface({ signer, ERC20_ABI, ERC20_BYTECODE, constructorParams, serviceChargeWei }) {
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
  const { signer, isConnected, getCurrentNetwork } = useWallet();
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
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [showPricing, setShowPricing] = useState(false);
  const [showRenounceModal, setShowRenounceModal] = useState(false);
  const [pendingRenounceContract, setPendingRenounceContract] = useState(null);
  const [showOwnershipRenounceModal, setShowOwnershipRenounceModal] = useState(false);

  // Logo and metadata state
  const [logoUrl, setLogoUrl] = useState('');
  const [logoUploadResult, setLogoUploadResult] = useState(null);
  const [metadataUrl, setMetadataUrl] = useState('');
  const [uploadingMetadata, setUploadingMetadata] = useState(false);

  // Get current network
  const network = getCurrentNetwork();

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
    return SERVICE_CHARGES[selectedPlan].allowedFeatures.includes(featureKey);
  };

  // Helper function to get feature restriction message
  const getFeatureRestrictionMessage = (featureKey) => {
    const requiredPlan = Object.entries(SERVICE_CHARGES).find(([key, plan]) => 
      plan.allowedFeatures.includes(featureKey)
    )?.[0];
    
    if (requiredPlan && requiredPlan !== selectedPlan) {
      return `Upgrade to ${SERVICE_CHARGES[requiredPlan].name} plan to access this feature`;
    }
    return null;
  };

  // Reset disabled features when plan changes
  useEffect(() => {
    // Reset features that are not allowed in the new plan
    if (!SERVICE_CHARGES[selectedPlan].allowedFeatures.includes('enableFreezing')) {
      setEnableFreezing(false);
      setFreezingAuthority('');
    }
    if (!SERVICE_CHARGES[selectedPlan].allowedFeatures.includes('enableBlacklist')) {
      setEnableBlacklist(false);
    }
    if (!SERVICE_CHARGES[selectedPlan].allowedFeatures.includes('maxTxAmount')) {
      setMaxTxAmount('');
    }
    if (!SERVICE_CHARGES[selectedPlan].allowedFeatures.includes('renounceOwnership')) {
      setRenounceOwnership(false);
    }
    if (!SERVICE_CHARGES[selectedPlan].allowedFeatures.includes('antiBot')) {
      setAntiBotEnabled(false);
    }
    if (!SERVICE_CHARGES[selectedPlan].allowedFeatures.includes('cooldown')) {
      setCooldownPeriod('');
    }
    if (!SERVICE_CHARGES[selectedPlan].allowedFeatures.includes('antiWhale')) {
      setAntiWhaleEnabled(false);
      setMaxWalletEnabled(false);
      setMaxWalletPercentage('');
    }
    if (!SERVICE_CHARGES[selectedPlan].allowedFeatures.includes('pauseFunction')) {
      setPauseFunctionEnabled(false);
    }
    if (!SERVICE_CHARGES[selectedPlan].allowedFeatures.includes('timelock')) {
      setTimelockEnabled(false);
      setTimelockDelay('');
    }
    if (!SERVICE_CHARGES[selectedPlan].allowedFeatures.includes('maxWallet')) {
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
  }, [maxTxAmount, selectedPlan]);

  useEffect(() => {
    // Set default cooldown period when enabled
    if (isFeatureAllowed('cooldown') && cooldownPeriod === '') {
      setCooldownPeriod('30'); // Default to 30 seconds
    }
  }, [cooldownPeriod, selectedPlan]);

  useEffect(() => {
    // Set default max wallet percentage when enabled
    if (isFeatureAllowed('maxWallet') && maxWalletEnabled && maxWalletPercentage === '') {
      setMaxWalletPercentage('2'); // Default to 2%
    }
  }, [maxWalletEnabled, maxWalletPercentage, selectedPlan]);

  useEffect(() => {
    // Set default timelock delay when enabled
    if (isFeatureAllowed('timelock') && timelockEnabled && timelockDelay === '') {
      setTimelockDelay('24'); // Default to 24 hours
    }
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

  // Map UI field names to state keys
  const getSocialLinkKey = (platformName) => {
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

  // Logo handling information
  const LogoInfo = () => (
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
    try {
      // Upload logo and metadata to IPFS first
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
      const tokenImplementationAddress = getContractAddress(network?.chainId, 'tokenImplementation');
      
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
        
        // Deploy token through factory with custom security configuration
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
        toast.success(`Token deployment transaction sent! Hash: ${tx.hash}`);
        
        // Wait for deployment
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
          
          toast.success(`Token deployed successfully! Address: ${deployedAddress}`);
          
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
          
          toast.success(`Token deployed successfully! Address: ${deployedAddress}`);
          
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
      toast.error(`Deployment failed: ${error.message}`);
    } finally {
      setDeploying(false);
    }
  };

  // Add a function to handle user confirmation
  const handleConfirmRenounce = async () => {
    setShowRenounceModal(false);
    if (pendingRenounceContract) {
      try {
        toast('Sending second transaction to renounce ownership...');
        await pendingRenounceContract.renounceOwnership();
        toast.success('Ownership renounced successfully!');
      } catch (err) {
        toast.error('Failed to renounce ownership: ' + err.message);
      } finally {
        setPendingRenounceContract(null);
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Deploy Token - Create Your Own Crypto Token | Boing Finance</title>
        <meta name="description" content="Deploy your own cryptocurrency token in minutes with Boing Finance. No coding required - create ERC20 tokens with advanced security features, professional infrastructure, and cross-chain support." />
        <meta name="keywords" content="deploy token, crypto, create token, cryptocurrency, ERC20, token deployment, smart contract, DeFi token, blockchain token, token creation, launch token, crypto token maker" />
        <meta property="og:title" content="Deploy Token - Create Your Own Crypto Token | Boing Finance" />
        <meta property="og:description" content="Deploy your own cryptocurrency token in minutes with Boing Finance. No coding required - create ERC20 tokens with advanced security features and cross-chain support." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/deploy-token" />
        <meta property="og:site_name" content="Boing Finance" />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Deploy Token - Create Your Own Crypto Token" />
        <meta name="twitter:description" content="Deploy your own cryptocurrency token in minutes with Boing Finance. No coding required - create ERC20 tokens with advanced security features." />
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
          "description": "Deploy your own cryptocurrency token in minutes with Boing Finance. No coding required - create ERC20 tokens with advanced security features, professional infrastructure, and cross-chain support.",
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
        <AnimatedBackground />
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
            </div>

            {/* Service Plan Selection */}
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
                      borderColor: selectedPlan === key ? '#3b82f6' : 'var(--border-color)'
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
                        {plan.prices[network?.chainId || 1].amount} {plan.prices[network?.chainId || 1].currency}
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
            </div>

            {/* Main Form */}
            <div className="rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border" style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)'
            }}>
              <form onSubmit={handleDeploy} className="space-y-6 sm:space-y-8">
                {/* Basic Information */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4 sm:mb-6">Basic Token Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium style={{ color: 'var(--text-secondary)' }} mb-2">
                        Token Name *
                      </label>
                      <input
                        type="text"
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
                      <label className="block text-sm font-medium style={{ color: 'var(--text-secondary)' }} mb-2">
                        Token Symbol *
                      </label>
                      <input
                        type="text"
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
                      <label className="block text-sm font-medium style={{ color: 'var(--text-secondary)' }} mb-2">
                        Decimals
                      </label>
                      <select
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
                      <label className="block text-sm font-medium style={{ color: 'var(--text-secondary)' }} mb-2">
                        Initial Supply *
                      </label>
                      <input
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

                {/* Project Information */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold style={{ color: 'var(--text-primary)' }} mb-4 sm:mb-6">Project Information</h3>
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <label className="block text-sm font-medium style={{ color: 'var(--text-secondary)' }} mb-2">
                        Website URL *
                      </label>
                      <input
                        type="url"
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
                      <label className="block text-sm font-medium style={{ color: 'var(--text-secondary)' }} mb-2">
                        Project Description
                      </label>
                      <textarea
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
                              <input
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
                              <input
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
                                <input
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
                                <input
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
                              <input
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
                        <label className="block text-sm font-medium style={{ color: 'var(--text-secondary)' }} mb-2">
                          {platform.charAt(0).toUpperCase() + platform.slice(1)} URL
                        </label>
                        <input
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
                      `Deploy Token (${SERVICE_CHARGES[selectedPlan].prices[network?.chainId || 1].amount} ${SERVICE_CHARGES[selectedPlan].prices[network?.chainId || 1].currency})`
                    )}
                  </button>
                </div>
              </form>
            </div>

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
        <MochiAstronaut position="bottom-right" />
      </div>
    </>
  );
}

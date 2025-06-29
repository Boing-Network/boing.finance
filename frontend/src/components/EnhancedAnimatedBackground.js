import React from 'react';

function EnhancedAnimatedBackground() {
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

export default EnhancedAnimatedBackground; 
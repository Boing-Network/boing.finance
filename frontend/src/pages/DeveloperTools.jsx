// Developer Tools Page
// Wrapper for DeveloperTools component

import React from 'react';
import DeveloperTools from '../components/DeveloperTools';
import EnhancedAnimatedBackground from '../components/EnhancedAnimatedBackground';

export default function DeveloperToolsPage() {
  return (
    <div className="relative min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <EnhancedAnimatedBackground />
      <div className="relative z-10">
        <DeveloperTools />
      </div>
    </div>
  );
}


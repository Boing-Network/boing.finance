// Onboarding Tour Component
// Provides interactive tutorial for first-time users

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const OnboardingTour = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if user has completed onboarding
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('boing_onboarding_completed');
    if (!hasCompletedOnboarding && location.pathname === '/') {
      // Show welcome modal first
      setIsActive(true);
    }
  }, [location.pathname]);

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to boing.finance! 🚀',
      content: 'Your all-in-one DeFi platform for token deployment, trading, and portfolio management.',
      position: 'center',
      action: () => {
        setCurrentStep(1);
      }
    },
    {
      id: 'deploy',
      title: 'Deploy Tokens',
      content: 'Create your own ERC-20 tokens with advanced security features. No coding required!',
      target: '[data-tour="deploy-token"]',
      position: 'bottom',
      action: () => {
        navigate('/deploy-token');
        setTimeout(() => setCurrentStep(2), 500);
      }
    },
    {
      id: 'portfolio',
      title: 'Track Your Portfolio',
      content: 'Monitor your token holdings on EVM and Solana in one place.',
      target: '[data-tour="portfolio"]',
      position: 'bottom',
      action: () => {
        navigate('/portfolio');
        setTimeout(() => setCurrentStep(3), 500);
      }
    },
    {
      id: 'analytics',
      title: 'Market Analytics',
      content: 'Get real-time market data, trending tokens, and price charts.',
      target: '[data-tour="analytics"]',
      position: 'bottom',
      action: () => {
        navigate('/analytics');
        setTimeout(() => setCurrentStep(4), 500);
      }
    },
    {
      id: 'tokens',
      title: 'Explore Tokens',
      content: 'Discover and manage tokens on EVM and Solana.',
      target: '[data-tour="tokens"]',
      position: 'bottom',
      action: () => {
        navigate('/tokens');
        setTimeout(() => setCurrentStep(5), 500);
      }
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const step = steps[currentStep];
      if (step.action) {
        step.action();
      } else {
        setCurrentStep(currentStep + 1);
      }
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('boing_onboarding_completed', 'true');
    setIsActive(false);
    if (onComplete) {
      onComplete();
    }
  };

  if (!isActive) return null;

  const currentStepData = steps[currentStep];

  // Welcome modal style
  if (currentStep === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md mx-4 border border-cyan-500 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
              {currentStepData.title}
            </h2>
            <p className="text-gray-300 mt-4">{currentStepData.content}</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleSkip}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Skip Tour
            </button>
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors font-semibold"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tooltip style for other steps
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      {currentStepData.target && (
        <div
          className="absolute border-2 border-cyan-500 rounded-lg shadow-2xl pointer-events-none"
          style={{
            // Position will be calculated by JavaScript
            // This is a simplified version
          }}
        />
      )}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-xl p-6 max-w-sm mx-4 border border-cyan-500 shadow-2xl pointer-events-auto">
        <h3 className="text-xl font-bold mb-2 text-cyan-400">{currentStepData.title}</h3>
        <p className="text-gray-300 mb-4">{currentStepData.content}</p>
        <div className="flex gap-4">
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors font-semibold text-sm"
          >
            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
        <div className="mt-4 flex justify-center gap-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-cyan-500'
                  : index < currentStep
                  ? 'w-2 bg-gray-600'
                  : 'w-2 bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;


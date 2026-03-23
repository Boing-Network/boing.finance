// Launch Wizard - Step-by-step token deployment UI
// Wraps DeployToken sections in a guided flow

import React from 'react';

const STEPS = [
  { id: 1, label: 'Token Basics', icon: '📝' },
  { id: 2, label: 'Network & Plan', icon: '🌐' },
  { id: 3, label: 'Security & Info', icon: '🔒' },
  { id: 4, label: 'Review & Deploy', icon: '🚀' },
];

export default function LaunchWizard({ currentStep, onStepChange, children }) {
  const stepIndex = Math.min(Math.max(1, currentStep), 4);

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 sm:gap-4 mb-6 flex-wrap" role="navigation" aria-label="Launch wizard steps">
        {STEPS.map((step, idx) => (
          <React.Fragment key={step.id}>
            <button
              type="button"
              onClick={() => onStepChange?.(step.id)}
              disabled={step.id > stepIndex}
              className={`flex flex-col items-center group min-w-[4rem] ${
                step.id <= stepIndex ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              }`}
              aria-current={step.id === stepIndex ? 'step' : undefined}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold transition-all ${
                  step.id === stepIndex
                    ? 'bg-blue-600 text-white ring-4 ring-blue-600/30'
                    : step.id < stepIndex
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-600 text-gray-400'
                }`}
              >
                {step.id < stepIndex ? '✓' : step.icon}
              </div>
              <span
                className={`mt-2 text-xs font-medium text-center ${
                  step.id === stepIndex ? 'text-blue-400' : step.id < stepIndex ? 'text-green-400' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </button>
            {idx < STEPS.length - 1 && (
              <div
                className={`hidden sm:block w-6 h-1 rounded flex-shrink-0 transition-colors ${
                  step.id < stepIndex ? 'bg-green-500' : 'bg-gray-600'
                }`}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {children}
    </div>
  );
}

export { STEPS };

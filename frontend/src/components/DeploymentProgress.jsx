// Deployment Progress Component
// Shows real-time deployment progress

import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const DeploymentProgress = ({ steps, currentStep, error = null }) => {
  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'active';
    return 'pending';
  };

  const getStepIcon = (status, stepIndex) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'active':
        return (
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <LoadingSpinner size="sm" color="text-white" />
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: 'var(--border-color)' }}>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {stepIndex + 1}
            </span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        const isActive = status === 'active';
        const isCompleted = status === 'completed';
        
        return (
          <div key={index} className="flex items-start space-x-4">
            {/* Step Icon */}
            <div className="flex-shrink-0">
              {getStepIcon(status, index)}
            </div>

            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 
                  className={`text-sm font-medium ${
                    isActive ? 'text-blue-400' : isCompleted ? 'text-green-400' : ''
                  }`}
                  style={!isActive && !isCompleted ? { color: 'var(--text-secondary)' } : {}}
                >
                  {step.title}
                </h4>
                {isActive && step.estimatedTime && (
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    ~{step.estimatedTime}
                  </span>
                )}
              </div>
              
              {step.description && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  {step.description}
                </p>
              )}

              {/* Progress Bar for Active Step */}
              {isActive && step.progress !== undefined && (
                <div className="mt-2">
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${step.progress}%` }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    {step.progress}%
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && index === currentStep && (
                <div className="mt-2 p-2 rounded bg-red-500/20 border border-red-500/30">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DeploymentProgress;


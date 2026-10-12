// Launch Wizard - Step-by-step token deployment UI
// Wraps DeployToken sections in a guided flow

import React from 'react';
import { StepRail } from './PageLayout';

const STEPS = [
  { id: 1, label: 'Token Basics' },
  { id: 2, label: 'Network & Plan' },
  { id: 3, label: 'Security & Info' },
  { id: 4, label: 'Review & Deploy' },
];

export default function LaunchWizard({ currentStep, onStepChange, children }) {
  const stepIndex = Math.min(Math.max(1, currentStep), 4);
  const currentId = stepIndex;

  return (
    <div className="space-y-6">
      <StepRail
        steps={STEPS}
        currentId={currentId}
        onStepChange={undefined}
        onStepClick={
          onStepChange
            ? (id) => {
                if (id < stepIndex) onStepChange(id);
              }
            : undefined
        }
      />
      {children}
    </div>
  );
}

export { STEPS };

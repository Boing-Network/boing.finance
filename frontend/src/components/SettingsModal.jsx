import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const DEFAULT_SLIPPAGE = 0.5;
const DEFAULT_DEADLINE = 20;
const DEFAULT_GAS_PRIORITY = 'medium';

export default function SettingsModal({ isOpen, onClose, onSave, initialSettings }) {
  const [slippage, setSlippage] = useState(initialSettings?.slippage ?? DEFAULT_SLIPPAGE);
  const [deadline, setDeadline] = useState(initialSettings?.deadline ?? DEFAULT_DEADLINE);
  const [darkMode, setDarkMode] = useState(initialSettings?.darkMode ?? false);
  const [gasPriority, setGasPriority] = useState(initialSettings?.gasPriority ?? DEFAULT_GAS_PRIORITY);

  useEffect(() => {
    if (!isOpen || !initialSettings) return;
    setSlippage(initialSettings.slippage ?? DEFAULT_SLIPPAGE);
    setDeadline(initialSettings.deadline ?? DEFAULT_DEADLINE);
    setDarkMode(initialSettings.darkMode ?? false);
    setGasPriority(initialSettings.gasPriority ?? DEFAULT_GAS_PRIORITY);
  }, [isOpen, initialSettings]);

  const handleSave = () => {
    onSave({ slippage, deadline, darkMode, gasPriority });
    onClose();
  };

  const gasPriorityOptions = [
    {
      value: 'high',
      label: 'High Priority',
      description: 'Faster execution, higher fees',
      multiplier: 1.5,
    },
    {
      value: 'medium',
      label: 'Medium Priority',
      description: 'Standard speed and fees',
      multiplier: 1.0,
    },
    {
      value: 'low',
      label: 'Low Priority',
      description: 'Slower execution, lower fees',
      multiplier: 0.7,
    },
  ];

  if (!isOpen) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 sm:p-6"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      role="presentation"
    >
      <div
        className="bg-theme-card rounded-xl shadow-xl w-full max-w-md max-h-[min(90vh,720px)] overflow-y-auto relative border border-theme outline-none"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="swap-settings-title"
      >
        <button
          type="button"
          className="absolute top-3 right-3 z-10 text-theme-tertiary hover:text-theme-primary text-2xl leading-none w-9 h-9 flex items-center justify-center rounded-lg hover:bg-theme-secondary/80"
          onClick={onClose}
          aria-label="Close settings"
        >
          &times;
        </button>
        <div className="p-5 sm:p-6 pt-12">
          <h2 id="swap-settings-title" className="text-xl font-bold text-theme-primary mb-4 pr-8">
            Settings
          </h2>

          <div className="mb-6 min-w-0">
            <label className="block text-theme-secondary mb-3 font-medium">Gas fee priority</label>
            <div className="space-y-2">
              {gasPriorityOptions.map((option) => (
                <label
                  key={option.value}
                  htmlFor={`settings-gas-${option.value}`}
                  className="flex flex-wrap sm:flex-nowrap items-start gap-3 p-3 border border-theme rounded-lg cursor-pointer hover:bg-theme-secondary/60 transition-colors min-w-0"
                >
                  <input
                    id={`settings-gas-${option.value}`}
                    type="radio"
                    name="gasPriority"
                    value={option.value}
                    checked={gasPriority === option.value}
                    onChange={(e) => setGasPriority(e.target.value)}
                    className="mt-1 shrink-0 text-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-theme-primary font-medium break-words">{option.label}</div>
                    <div className="text-theme-tertiary text-sm break-words">{option.description}</div>
                  </div>
                  <div className="text-xs text-theme-tertiary shrink-0 tabular-nums self-center">{option.multiplier}x</div>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-4 min-w-0">
            <label htmlFor="settings-slippage" className="block text-theme-secondary mb-1">
              Slippage tolerance (%)
            </label>
            <input
              id="settings-slippage"
              name="slippage"
              type="number"
              autoComplete="off"
              min="0.1"
              max="5"
              step="0.1"
              value={slippage}
              onChange={(e) => setSlippage(Number(e.target.value))}
              className="w-full min-w-0 px-3 py-2 rounded bg-theme-secondary text-theme-primary focus:outline-none border border-theme"
            />
          </div>

          <div className="mb-4 min-w-0">
            <label htmlFor="settings-deadline" className="block text-theme-secondary mb-1">
              Transaction deadline (minutes)
            </label>
            <input
              id="settings-deadline"
              name="deadline"
              type="number"
              autoComplete="off"
              min="1"
              max="60"
              step="1"
              value={deadline}
              onChange={(e) => setDeadline(Number(e.target.value))}
              className="w-full min-w-0 px-3 py-2 rounded bg-theme-secondary text-theme-primary focus:outline-none border border-theme"
            />
          </div>

          <div className="mb-6 flex items-center gap-2">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
              id="darkModeToggle"
              className="shrink-0"
            />
            <label htmlFor="darkModeToggle" className="text-theme-secondary text-sm">
              Enable dark mode
            </label>
          </div>

          <button
            type="button"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-200"
            onClick={handleSave}
          >
            Save settings
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null;
}

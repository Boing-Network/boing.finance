import React, { useState } from 'react';

const DEFAULT_SLIPPAGE = 0.5;
const DEFAULT_DEADLINE = 20;
const DEFAULT_GAS_PRIORITY = 'medium';

export default function SettingsModal({ isOpen, onClose, onSave, initialSettings }) {
  const [slippage, setSlippage] = useState(initialSettings?.slippage ?? DEFAULT_SLIPPAGE);
  const [deadline, setDeadline] = useState(initialSettings?.deadline ?? DEFAULT_DEADLINE);
  const [darkMode, setDarkMode] = useState(initialSettings?.darkMode ?? false);
  const [gasPriority, setGasPriority] = useState(initialSettings?.gasPriority ?? DEFAULT_GAS_PRIORITY);

  const handleSave = () => {
    onSave({ slippage, deadline, darkMode, gasPriority });
    onClose();
  };

  const gasPriorityOptions = [
    {
      value: 'high',
      label: 'High Priority',
      description: 'Faster execution, higher fees',
      multiplier: 1.5
    },
    {
      value: 'medium',
      label: 'Medium Priority',
      description: 'Standard speed and fees',
      multiplier: 1.0
    },
    {
      value: 'low',
      label: 'Low Priority',
      description: 'Slower execution, lower fees',
      multiplier: 0.7
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-theme-card rounded-lg shadow-lg p-6 w-full max-w-md relative border border-theme">
        <button
          className="absolute top-2 right-2 text-theme-tertiary hover:text-theme-primary"
          onClick={onClose}
          aria-label="Close settings"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold text-theme-primary mb-4">Settings</h2>
        
        {/* Gas Fee Priority */}
        <div className="mb-6">
          <label className="block text-theme-secondary mb-3 font-medium">Gas Fee Priority</label>
          <div className="space-y-2">
            {gasPriorityOptions.map((option) => (
              <label key={option.value} htmlFor={`settings-gas-${option.value}`} className="flex items-center p-3 border border-theme rounded-lg cursor-pointer hover:bg-theme-secondary transition-colors">
                <input
                  id={`settings-gas-${option.value}`}
                  type="radio"
                  name="gasPriority"
                  value={option.value}
                  checked={gasPriority === option.value}
                  onChange={(e) => setGasPriority(e.target.value)}
                  className="mr-3 text-blue-500"
                />
                <div className="flex-1">
                  <div className="text-theme-primary font-medium">{option.label}</div>
                  <div className="text-theme-tertiary text-sm">{option.description}</div>
                </div>
                <div className="text-xs text-theme-tertiary">
                  {option.multiplier}x
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Slippage Tolerance */}
        <div className="mb-4">
          <label htmlFor="settings-slippage" className="block text-theme-secondary mb-1">Slippage Tolerance (%)</label>
          <input
            id="settings-slippage"
            name="slippage"
            type="number"
            autoComplete="off"
            min="0.1"
            max="5"
            step="0.1"
            value={slippage}
            onChange={e => setSlippage(Number(e.target.value))}
            className="w-full px-3 py-2 rounded bg-theme-secondary text-theme-primary focus:outline-none border border-theme"
          />
        </div>

        {/* Transaction Deadline */}
        <div className="mb-4">
          <label htmlFor="settings-deadline" className="block text-theme-secondary mb-1">Transaction Deadline (minutes)</label>
          <input
            id="settings-deadline"
            name="deadline"
            type="number"
            autoComplete="off"
            min="1"
            max="60"
            step="1"
            value={deadline}
            onChange={e => setDeadline(Number(e.target.value))}
            className="w-full px-3 py-2 rounded bg-theme-secondary text-theme-primary focus:outline-none border border-theme"
          />
        </div>

        {/* Dark Mode Toggle */}
        <div className="mb-6 flex items-center">
          <input
            type="checkbox"
            checked={darkMode}
            onChange={e => setDarkMode(e.target.checked)}
            id="darkModeToggle"
            className="mr-2"
          />
          <label htmlFor="darkModeToggle" className="text-theme-secondary">Enable Dark Mode</label>
        </div>

        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
          onClick={handleSave}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
} 
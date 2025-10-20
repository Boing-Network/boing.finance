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
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
          onClick={onClose}
          aria-label="Close settings"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold text-white mb-4">Settings</h2>
        
        {/* Gas Fee Priority */}
        <div className="mb-6">
          <label className="block text-gray-300 mb-3 font-medium">Gas Fee Priority</label>
          <div className="space-y-2">
            {gasPriorityOptions.map((option) => (
              <label key={option.value} className="flex items-center p-3 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                <input
                  type="radio"
                  name="gasPriority"
                  value={option.value}
                  checked={gasPriority === option.value}
                  onChange={(e) => setGasPriority(e.target.value)}
                  className="mr-3 text-blue-500"
                />
                <div className="flex-1">
                  <div className="text-white font-medium">{option.label}</div>
                  <div className="text-gray-400 text-sm">{option.description}</div>
                </div>
                <div className="text-xs text-gray-500">
                  {option.multiplier}x
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Slippage Tolerance */}
        <div className="mb-4">
          <label className="block text-gray-300 mb-1">Slippage Tolerance (%)</label>
          <input
            type="number"
            min="0.1"
            max="5"
            step="0.1"
            value={slippage}
            onChange={e => setSlippage(Number(e.target.value))}
            className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none"
          />
        </div>

        {/* Transaction Deadline */}
        <div className="mb-4">
          <label className="block text-gray-300 mb-1">Transaction Deadline (minutes)</label>
          <input
            type="number"
            min="1"
            max="60"
            step="1"
            value={deadline}
            onChange={e => setDeadline(Number(e.target.value))}
            className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none"
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
          <label htmlFor="darkModeToggle" className="text-gray-300">Enable Dark Mode</label>
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
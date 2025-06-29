import React, { useState } from 'react';

const DEFAULT_SLIPPAGE = 0.5;
const DEFAULT_DEADLINE = 20;

export default function SettingsModal({ isOpen, onClose, onSave, initialSettings }) {
  const [slippage, setSlippage] = useState(initialSettings?.slippage ?? DEFAULT_SLIPPAGE);
  const [deadline, setDeadline] = useState(initialSettings?.deadline ?? DEFAULT_DEADLINE);
  const [darkMode, setDarkMode] = useState(initialSettings?.darkMode ?? false);

  const handleSave = () => {
    onSave({ slippage, deadline, darkMode });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
          onClick={onClose}
          aria-label="Close settings"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold text-white mb-4">Settings</h2>
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
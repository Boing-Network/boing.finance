// Onboarding Checklist - Connect wallet, View portfolio, Set price alert
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { getPriceAlerts } from '../utils/priceAlerts';

const STORAGE_KEYS = {
  visitedPortfolio: 'boing_visited_portfolio',
  checklistDismissed: 'boing_checklist_dismissed'
};

const OnboardingChecklist = ({ compact = false }) => {
  const { account, connectWallet } = useWallet();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('boing_checklist_collapsed') ?? 'false'); } catch { return false; }
  });
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEYS.checklistDismissed) === 'true'; } catch { return false; }
  });
  const [visitedPortfolio, setVisitedPortfolio] = useState(false);
  const [hasPriceAlert, setHasPriceAlert] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setVisitedPortfolio(localStorage.getItem(STORAGE_KEYS.visitedPortfolio) === 'true');
    setHasPriceAlert((getPriceAlerts() || []).length > 0);
  }, [location.pathname, account]); // Recheck when route or account changes

  useEffect(() => {
    if (location.pathname === '/portfolio') {
      localStorage.setItem(STORAGE_KEYS.visitedPortfolio, 'true');
      setVisitedPortfolio(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem('boing_checklist_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const step1Done = !!account;
  const step2Done = visitedPortfolio;
  const step3Done = hasPriceAlert;
  const allDone = step1Done && step2Done && step3Done;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEYS.checklistDismissed, 'true');
    setDismissed(true);
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEYS.checklistDismissed);
    setDismissed(false);
  };

  if (dismissed && allDone) return null;

  const steps = [
    { id: 1, label: 'Connect wallet', done: step1Done, action: () => connectWallet && connectWallet() },
    { id: 2, label: 'View portfolio', done: step2Done, action: () => navigate('/portfolio') },
    { id: 3, label: 'Set price alert', done: step3Done, action: () => navigate('/tokens') }
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        {steps.map(s => (
          <span key={s.id} className={s.done ? 'text-green-500' : ''} title={s.label}>
            {s.done ? '✓' : '○'} {s.label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-white font-semibold flex items-center gap-2"
        >
          <span className="text-cyan-400">Getting Started</span>
          <span className="text-gray-500 text-sm">{step1Done + step2Done + step3Done}/3</span>
          <svg className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {allDone && (
          <button onClick={handleDismiss} className="text-xs text-gray-500 hover:text-gray-400">
            Dismiss
          </button>
        )}
      </div>
      {!isCollapsed && (
        <div className="space-y-2 mt-2">
          {steps.map(s => (
            <div key={s.id} className="flex items-center justify-between">
              <button
                onClick={s.action}
                disabled={s.done}
                className={`flex items-center gap-2 text-sm ${s.done ? 'text-green-400 cursor-default' : 'text-gray-300 hover:text-cyan-400'}`}
              >
                <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs">
                  {s.done ? '✓' : s.id}
                </span>
                {s.label}
              </button>
              {s.done && <span className="text-green-500 text-xs">Done</span>}
            </div>
          ))}
          {allDone && (
            <p className="text-xs text-green-400 mt-2">All set! You can dismiss this checklist.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default OnboardingChecklist;

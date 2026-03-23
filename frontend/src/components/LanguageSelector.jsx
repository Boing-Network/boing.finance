// Language Selector Component
// Allows users to change the application language

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' }
];

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md transition-all duration-200 hover:bg-opacity-10 hover:bg-cyan-500"
        style={{ 
          color: 'var(--text-secondary)',
        }}
        onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
        onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
        aria-label="Select language"
        title={`Current: ${currentLanguage.name}`}
      >
        <GlobeAltIcon className="w-5 h-5" />
      </button>
      
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-48 backdrop-blur-sm rounded-xl shadow-xl z-50 animate-in slide-in-from-top-2 duration-200"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 10px 25px -5px var(--shadow), 0 10px 10px -5px var(--shadow)'
          }}
        >
          <div className="py-1.5">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center space-x-3 transition-all duration-200 rounded-lg mx-1 ${
                  i18n.language === lang.code 
                    ? 'bg-cyan-500/10' 
                    : 'hover:bg-cyan-500/10'
                }`}
                style={{
                  color: i18n.language === lang.code 
                    ? 'var(--text-primary)' 
                    : 'var(--text-secondary)'
                }}
                onMouseEnter={(e) => {
                  if (i18n.language !== lang.code) {
                    e.target.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (i18n.language !== lang.code) {
                    e.target.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="flex-1">{lang.name}</span>
                {i18n.language === lang.code && (
                  <span className="text-cyan-400 font-semibold">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;


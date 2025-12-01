// Notification Settings Component
// Allows users to configure notification preferences

import React, { useState, useEffect, useRef } from 'react';
import { notificationService } from '../utils/notifications';
import toast from 'react-hot-toast';

const NotificationSettings = ({ onClose }) => {
  // eslint-disable-next-line no-unused-vars
  const modalRef = useRef(null);
  const [permission, setPermission] = useState('default');
  const [settings, setSettings] = useState({
    deployments: true,
    transactions: true,
    priceAlerts: false,
    portfolioUpdates: false,
    systemAnnouncements: true
  });

  useEffect(() => {
    // Load saved settings
    const savedSettings = localStorage.getItem('boing_notification_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Check notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      setPermission('granted');
      toast.success('Notifications enabled!');
    } else {
      setPermission('denied');
      toast.error('Notification permission denied');
    }
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('boing_notification_settings', JSON.stringify(newSettings));
    toast.success('Settings saved!');
  };

  const handleTestNotification = async () => {
    const success = await notificationService.showNotification('Test Notification', {
      body: 'This is a test notification from boing.finance',
      icon: '/favicon-96x96.png'
    });
    
    if (!success) {
      toast.error('Failed to show notification. Please check your browser settings.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md mx-4 border border-cyan-500 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 id="notification-settings-title" className="text-2xl font-bold text-white">Notification Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close notification settings"
            aria-controls="notification-settings-title"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Permission Status */}
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300">Browser Notifications:</span>
            <span className={`font-semibold ${
              permission === 'granted' ? 'text-green-400' :
              permission === 'denied' ? 'text-red-400' :
              'text-yellow-400'
            }`}>
              {permission === 'granted' ? 'Enabled' :
               permission === 'denied' ? 'Blocked' :
               'Not Set'}
            </span>
          </div>
          {permission !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              className="mt-2 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              {permission === 'denied' ? 'Enable in Browser Settings' : 'Enable Notifications'}
            </button>
          )}
        </div>

        {/* Notification Preferences */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-white">Notification Preferences</h3>
          
          {Object.entries(settings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div>
                <label className="text-white font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <p className="text-xs text-gray-400 mt-1">
                  {key === 'deployments' && 'Get notified when your tokens are deployed'}
                  {key === 'transactions' && 'Get notified when transactions are confirmed'}
                  {key === 'priceAlerts' && 'Get notified when token prices reach your targets'}
                  {key === 'portfolioUpdates' && 'Get periodic updates about your portfolio'}
                  {key === 'systemAnnouncements' && 'Get important system updates and announcements'}
                </p>
              </div>
              <button
                onClick={() => handleSettingChange(key, !value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-blue-600' : 'bg-gray-600'
                }`}
                role="switch"
                aria-checked={value}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Test Button */}
        {permission === 'granted' && (
          <button
            onClick={handleTestNotification}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
          >
            Test Notification
          </button>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default NotificationSettings;


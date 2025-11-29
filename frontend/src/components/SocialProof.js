// Social Proof Component
// Displays deployment counts, user activity, and social proof indicators

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import config from '../config';
import axios from 'axios';

const SocialProof = ({ type = 'deployments' }) => {
  const [stats, setStats] = useState({
    totalDeployments: 0,
    activeUsers: 0,
    totalVolume: 0,
    tokensCreated: 0
  });

  // Fetch stats from backend or localStorage
  useEffect(() => {
    // Try to fetch from backend
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${config.apiUrl}/analytics?range=all`);
        if (response.data?.data) {
          setStats({
            totalDeployments: response.data.data.totalDeployments || 0,
            activeUsers: response.data.data.activeUsers || 0,
            totalVolume: response.data.data.totalVolume || 0,
            tokensCreated: response.data.data.tokensCreated || 0
          });
        }
      } catch (error) {
        // Fallback to localStorage
        const deployments = JSON.parse(localStorage.getItem('tokenDeployments') || '[]');
        setStats({
          totalDeployments: deployments.length,
          activeUsers: 0,
          totalVolume: 0,
          tokensCreated: deployments.length
        });
      }
    };

    fetchStats();
  }, []);

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (type === 'deployments') {
    return (
      <div className="flex items-center space-x-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <span className="text-green-400">✓</span>
        <span>{formatNumber(stats.totalDeployments)} tokens deployed</span>
      </div>
    );
  }

  if (type === 'users') {
    return (
      <div className="flex items-center space-x-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <span className="text-blue-400">👥</span>
        <span>{formatNumber(stats.activeUsers)} active users</span>
      </div>
    );
  }

  if (type === 'volume') {
    return (
      <div className="flex items-center space-x-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <span className="text-purple-400">💰</span>
        <span>${formatNumber(stats.totalVolume)} volume</span>
      </div>
    );
  }

  return null;
};

// Deployment Counter Component
export const DeploymentCounter = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const deployments = JSON.parse(localStorage.getItem('tokenDeployments') || '[]');
    setCount(deployments.length);
  }, []);

  return (
    <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30">
      <span className="text-xs font-semibold text-green-400">
        {count.toLocaleString()} deployments
      </span>
    </div>
  );
};

// Activity Indicator Component
export const ActivityIndicator = ({ activity }) => {
  const getActivityColor = () => {
    if (activity === 'high') return 'text-green-400';
    if (activity === 'medium') return 'text-yellow-400';
    return 'text-gray-400';
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${getActivityColor()} animate-pulse`} />
      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        {activity === 'high' ? 'High activity' : activity === 'medium' ? 'Moderate activity' : 'Low activity'}
      </span>
    </div>
  );
};

export default SocialProof;


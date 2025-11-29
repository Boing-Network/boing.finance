// Enhanced Analytics Component
// Provides more detailed charts and visualizations

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import config from '../config';
import axios from 'axios';
import LoadingSpinner from './LoadingSpinner';

const EnhancedAnalytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [chartType, setChartType] = useState('line');

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      try {
        const response = await axios.get(`${config.apiUrl}/analytics?range=${timeRange}`);
        return response.data?.data || {};
      } catch (error) {
        console.error('Error fetching analytics:', error);
        return {
          totalDeployments: 0,
          activeUsers: 0,
          totalVolume: 0,
          tokensCreated: 0,
          dailyData: []
        };
      }
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Mock data for charts (replace with real data from API)
  const chartData = analyticsData?.dailyData || [
    { date: '2025-01-21', deployments: 12, users: 45, volume: 125000 },
    { date: '2025-01-22', deployments: 18, users: 52, volume: 145000 },
    { date: '2025-01-23', deployments: 15, users: 48, volume: 138000 },
    { date: '2025-01-24', deployments: 22, users: 61, volume: 167000 },
    { date: '2025-01-25', deployments: 19, users: 55, volume: 152000 },
    { date: '2025-01-26', deployments: 25, users: 68, volume: 189000 },
    { date: '2025-01-27', deployments: 28, users: 72, volume: 201000 }
  ];

  const networkDistribution = [
    { name: 'Ethereum', value: 45, color: '#627EEA' },
    { name: 'Polygon', value: 30, color: '#8247E5' },
    { name: 'BSC', value: 15, color: '#F3BA2F' },
    { name: 'Sepolia', value: 10, color: '#8B5CF6' }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Time Range:
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 rounded-lg border bg-gray-800 text-white"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Chart Type:
          </label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="px-4 py-2 rounded-lg border bg-gray-800 text-white"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg p-6 border" style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)'
        }}>
          <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Total Deployments
          </h3>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {analyticsData?.totalDeployments?.toLocaleString() || '0'}
          </p>
        </div>
        <div className="rounded-lg p-6 border" style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)'
        }}>
          <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Active Users
          </h3>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {analyticsData?.activeUsers?.toLocaleString() || '0'}
          </p>
        </div>
        <div className="rounded-lg p-6 border" style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)'
        }}>
          <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Total Volume
          </h3>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            ${analyticsData?.totalVolume?.toLocaleString() || '0'}
          </p>
        </div>
        <div className="rounded-lg p-6 border" style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)'
        }}>
          <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Tokens Created
          </h3>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {analyticsData?.tokensCreated?.toLocaleString() || '0'}
          </p>
        </div>
      </div>

      {/* Main Chart */}
      <div className="rounded-lg p-6 border" style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-color)'
      }}>
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Activity Over Time
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="deployments" stroke="#0088FE" strokeWidth={2} />
              <Line type="monotone" dataKey="users" stroke="#00C49F" strokeWidth={2} />
              <Line type="monotone" dataKey="volume" stroke="#FFBB28" strokeWidth={2} />
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
              <Legend />
              <Bar dataKey="deployments" fill="#0088FE" />
              <Bar dataKey="users" fill="#00C49F" />
              <Bar dataKey="volume" fill="#FFBB28" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Network Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg p-6 border" style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)'
        }}>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Network Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={networkDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {networkDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg p-6 border" style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)'
        }}>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Top Networks
          </h2>
          <div className="space-y-4">
            {networkDistribution.map((network, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: network.color }}
                  />
                  <span style={{ color: 'var(--text-primary)' }}>{network.name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-32 h-2 rounded-full bg-gray-700">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${network.value}%`,
                        backgroundColor: network.color
                      }}
                    />
                  </div>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {network.value}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAnalytics;


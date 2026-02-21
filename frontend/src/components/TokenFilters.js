// Token Filters Component
// Advanced filtering for token explorer

import React from 'react';

const TokenFilters = ({ filters, onFilterChange, onClearFilters }) => {
  return (
    <div className="rounded-lg border p-4" style={{
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--border-color)'
    }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Filters
        </h3>
        <button
          onClick={onClearFilters}
          className="text-sm px-3 py-1 rounded transition-colors"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)'
          }}
        >
          Clear All
        </button>
      </div>

      <div className="space-y-4">
        {/* Search Filter */}
        <div>
          <label htmlFor="token-filters-search" className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            Search
          </label>
          <input
            id="token-filters-search"
            name="search"
            type="text"
            autoComplete="off"
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Search by name, symbol, or address..."
            className="w-full px-3 py-2 rounded border text-sm"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-color)'
            }}
          />
        </div>

        {/* Network Filter */}
        <div>
          <label htmlFor="token-filters-network" className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            Network
          </label>
          <select
            id="token-filters-network"
            name="network"
            value={filters.network || 'all'}
            onChange={(e) => onFilterChange('network', e.target.value)}
            className="w-full px-3 py-2 rounded border text-sm"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-color)'
            }}
          >
            <option value="all">All Networks</option>
            <option value="1">Ethereum</option>
            <option value="137">Polygon</option>
            <option value="56">BSC</option>
            <option value="42161">Arbitrum</option>
            <option value="10">Optimism</option>
            <option value="8453">Base</option>
            <option value="11155111">Sepolia</option>
          </select>
        </div>

        {/* Sort Filter */}
        <div>
          <label htmlFor="token-filters-sort" className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            Sort By
          </label>
          <select
            id="token-filters-sort"
            name="sortBy"
            value={filters.sortBy || 'trending'}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 rounded border text-sm"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-color)'
            }}
          >
            <option value="trending">Trending Score</option>
            <option value="name">Name (A-Z)</option>
            <option value="supply">Total Supply</option>
            <option value="recent">Most Recent</option>
          </select>
        </div>

        {/* Favorites Only */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="favoritesOnly"
            checked={filters.favoritesOnly || false}
            onChange={(e) => onFilterChange('favoritesOnly', e.target.checked)}
            className="w-4 h-4 rounded"
            style={{ accentColor: 'var(--accent-cyan)' }}
          />
          <label htmlFor="favoritesOnly" className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Show favorites only
          </label>
        </div>
      </div>
    </div>
  );
};

export default TokenFilters;


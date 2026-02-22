/**
 * Deep Trade design system — resolved hex/rgba values for charts, canvas, and SVG.
 * CSS variables are used elsewhere; this file is for contexts that need computed colors
 * (Recharts, canvas 2d, export). Values match frontend/src/styles/deep-trade-tokens.css
 */

export const CHART_COLORS = [
  '#00e5ff', // finance-primary / chart-1
  '#00ff88', // finance-green / chart-2
  '#f59e0b', // finance-gold / chart-3
  '#8b5cf6', // finance-purple / chart-4
  '#ec4899', // chart-5 (pink)
  '#10b981', // finance-green-mid
];

export const TREASURY_ALLOCATION_COLORS = {
  Liquidity: '#00e5ff',
  Grants: '#8b5cf6',
  Development: '#00ff88',
  Marketing: '#f59e0b',
  Reserve: '#10b981',
  Other: '#00e5ff',
};

/** Default allocation list for treasury charts; color key matches TREASURY_ALLOCATION_COLORS */
export const TREASURY_DEFAULT_ALLOCATIONS = [
  { name: 'Liquidity', value: 0, color: TREASURY_ALLOCATION_COLORS.Liquidity },
  { name: 'Grants', value: 0, color: TREASURY_ALLOCATION_COLORS.Grants },
  { name: 'Development', value: 0, color: TREASURY_ALLOCATION_COLORS.Development },
  { name: 'Marketing', value: 0, color: TREASURY_ALLOCATION_COLORS.Marketing },
  { name: 'Reserve', value: 0, color: TREASURY_ALLOCATION_COLORS.Reserve },
];

/** Confetti / canvas-friendly palette (Deep Trade) */
export const CONFETTI_COLORS = [
  '#00e5ff',
  '#00ff88',
  '#94a3b8',
  '#475569',
  'rgba(0, 229, 255, 0.4)',
  'rgba(0, 255, 136, 0.35)',
];

const designTokens = {
  CHART_COLORS,
  TREASURY_ALLOCATION_COLORS,
  TREASURY_DEFAULT_ALLOCATIONS,
  CONFETTI_COLORS,
};

export default designTokens;

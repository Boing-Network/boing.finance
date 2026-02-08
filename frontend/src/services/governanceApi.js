/**
 * Governance API service - proposals, votes, treasury, contract registry.
 * Uses backend /api/governance endpoints. Replace mock data when contracts deployed.
 */

import { getApiUrl } from '../config.js';

const base = () => `${getApiUrl().replace(/\/api$/, '')}/api/governance`;

export async function getProposals({ chainId, status, limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (chainId != null) params.set('chainId', chainId);
  if (status) params.set('status', status);
  params.set('limit', limit);
  params.set('offset', offset);
  const res = await fetch(`${base()}/proposals?${params}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch proposals');
  return json.data;
}

export async function getProposalById(id) {
  const res = await fetch(`${base()}/proposals/${id}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch proposal');
  return json.data;
}

export async function createProposal({ chainId, title, description, createdBy, status, endDate, startBlock, endBlock }) {
  const res = await fetch(`${base()}/proposals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chainId, title, description, createdBy, status, endDate, startBlock, endBlock }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to create proposal');
  return json.data;
}

export async function voteOnProposal(proposalId, { voter, support, weight, txHash }) {
  const res = await fetch(`${base()}/proposals/${proposalId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voter, support, weight, txHash }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to cast vote');
  return json.data;
}

export async function getTreasury(chainId = 1) {
  const res = await fetch(`${base()}/treasury?chainId=${chainId}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch treasury');
  return json.data;
}

export async function getContracts(chainId = null) {
  const q = chainId != null ? `?chainId=${chainId}` : '';
  const res = await fetch(`${base()}/contracts${q}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch contracts');
  return json.data;
}

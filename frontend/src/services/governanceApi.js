/**
 * Governance API service - proposals, votes, treasury, contract registry.
 * Uses backend /api/governance endpoints. Replace mock data when contracts deployed.
 */

import { apiFetch } from '../utils/apiFetch.js';

export async function getProposals({ chainId, status, limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (chainId != null) params.set('chainId', chainId);
  if (status) params.set('status', status);
  params.set('limit', limit);
  params.set('offset', offset);
  const json = await apiFetch(`governance/proposals?${params}`);
  return json.data;
}

export async function getProposalById(id) {
  const json = await apiFetch(`governance/proposals/${id}`);
  return json.data;
}

export async function createProposal({ chainId, title, description, createdBy, status, endDate, startBlock, endBlock }) {
  const json = await apiFetch('governance/proposals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chainId, title, description, createdBy, status, endDate, startBlock, endBlock }),
  });
  return json.data;
}

export async function voteOnProposal(proposalId, { voter, support, weight, txHash }) {
  const json = await apiFetch(`governance/proposals/${proposalId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voter, support, weight, txHash }),
  });
  return json.data;
}

export async function getTreasury(chainId = 1) {
  const json = await apiFetch(`governance/treasury?chainId=${chainId}`);
  return json.data;
}

export async function getContracts(chainId = null) {
  const q = chainId != null ? `?chainId=${chainId}` : '';
  const json = await apiFetch(`governance/contracts${q}`);
  return json.data;
}

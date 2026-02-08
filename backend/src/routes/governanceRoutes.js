import { Hono } from 'hono';
import { GovernanceRepository } from '../database/repositories/governanceRepository.js';

function isEthAddress(addr) {
  return typeof addr === 'string' && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export const createGovernanceRoutes = () => {
  const app = new Hono();

  app.get('/proposals', async (c) => {
    const db = c.get('db');
    const chainId = c.req.query('chainId') ? parseInt(c.req.query('chainId'), 10) : null;
    const status = c.req.query('status') || null;
    const limit = Math.min(parseInt(c.req.query('limit'), 10) || 50, 100);
    const offset = Math.max(0, parseInt(c.req.query('offset'), 10) || 0);
    const repo = new GovernanceRepository(db);
    const list = await repo.listProposals(chainId, status, limit, offset);
    return c.json({ success: true, data: list });
  });

  app.get('/proposals/:id', async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'), 10);
    if (Number.isNaN(id)) return c.json({ success: false, error: 'Invalid proposal id' }, 400);
    const repo = new GovernanceRepository(db);
    const proposal = await repo.getProposalById(id);
    if (!proposal) return c.json({ success: false, error: 'Proposal not found' }, 404);
    const votes = await repo.getVotesByProposal(id);
    return c.json({ success: true, data: { ...proposal, votes } });
  });

  app.post('/proposals', async (c) => {
    const db = c.get('db');
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ success: false, error: 'Invalid JSON body' }, 400);
    }
    const { chainId, title, description, createdBy, contractProposalId, status, endDate, startBlock, endBlock } = body;
    if (!title || !description || !createdBy) {
      return c.json({ success: false, error: 'Missing title, description, or createdBy' }, 400);
    }
    if (!isEthAddress(createdBy)) return c.json({ success: false, error: 'Invalid createdBy address' }, 400);
    const repo = new GovernanceRepository(db);
    const row = await repo.createProposal({
      chainId: chainId != null ? parseInt(chainId, 10) : 1,
      contractProposalId: contractProposalId || null,
      title,
      description,
      createdBy,
      status: status || 'pending',
      endDate: endDate || null,
      startBlock: startBlock != null ? parseInt(startBlock, 10) : null,
      endBlock: endBlock != null ? parseInt(endBlock, 10) : null
    });
    return c.json({ success: true, data: row });
  });

  app.post('/proposals/:id/vote', async (c) => {
    const db = c.get('db');
    const id = parseInt(c.req.param('id'), 10);
    if (Number.isNaN(id)) return c.json({ success: false, error: 'Invalid proposal id' }, 400);
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ success: false, error: 'Invalid JSON body' }, 400);
    }
    const { voter, support, weight, txHash } = body;
    if (!voter || support === undefined) return c.json({ success: false, error: 'Missing voter or support' }, 400);
    if (!isEthAddress(voter)) return c.json({ success: false, error: 'Invalid voter address' }, 400);
    const supportInt = support === true || support === 1 ? 1 : 0;
    const repo = new GovernanceRepository(db);
    const proposal = await repo.getProposalById(id);
    if (!proposal) return c.json({ success: false, error: 'Proposal not found' }, 404);
    const existing = await repo.getVoteByProposalAndVoter(id, voter);
    if (existing) return c.json({ success: false, error: 'Already voted' }, 409);
    const voteWeight = weight != null ? String(weight) : '1';
    const vote = await repo.recordVote({ proposalId: id, voter, support: supportInt, weight: voteWeight, txHash: txHash || null });
    const vFor = BigInt(proposal.votesFor || '0') + (supportInt === 1 ? BigInt(voteWeight) : 0n);
    const vAgainst = BigInt(proposal.votesAgainst || '0') + (supportInt === 0 ? BigInt(voteWeight) : 0n);
    await repo.updateProposalVotes(id, vFor.toString(), vAgainst.toString());
    return c.json({ success: true, data: vote });
  });

  app.get('/treasury', async (c) => {
    const db = c.get('db');
    const chainId = c.req.query('chainId') ? parseInt(c.req.query('chainId'), 10) : 1;
    const repo = new GovernanceRepository(db);
    const snapshot = await repo.getLatestTreasurySnapshot(chainId);
    if (!snapshot) {
      return c.json({ success: true, data: { chainId, totalUsd: '0', allocations: [], multisigSigners: null } });
    }
    const data = {
      ...snapshot,
      allocations: typeof snapshot.allocations === 'string' ? (snapshot.allocations ? JSON.parse(snapshot.allocations) : []) : snapshot.allocations
    };
    return c.json({ success: true, data });
  });

  app.post('/treasury', async (c) => {
    const db = c.get('db');
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ success: false, error: 'Invalid JSON body' }, 400);
    }
    const { chainId, totalUsd, allocations, multisigSigners } = body;
    if (totalUsd === undefined) return c.json({ success: false, error: 'Missing totalUsd' }, 400);
    const repo = new GovernanceRepository(db);
    const row = await repo.saveTreasurySnapshot({
      chainId: chainId != null ? parseInt(chainId, 10) : 1,
      totalUsd: String(totalUsd),
      allocations: allocations || null,
      multisigSigners: multisigSigners || null
    });
    return c.json({ success: true, data: row });
  });

  app.get('/contracts', async (c) => {
    const db = c.get('db');
    const chainId = c.req.query('chainId') ? parseInt(c.req.query('chainId'), 10) : null;
    const repo = new GovernanceRepository(db);
    const list = chainId != null ? await repo.getContractsByChain(chainId) : await repo.getAllContracts();
    const byChain = {};
    for (const row of list) {
      if (!byChain[row.chainId]) byChain[row.chainId] = {};
      byChain[row.chainId][row.contractName] = row.address;
    }
    return c.json({ success: true, data: chainId != null ? byChain[chainId] || {} : byChain });
  });

  app.put('/contracts', async (c) => {
    const db = c.get('db');
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ success: false, error: 'Invalid JSON body' }, 400);
    }
    const { chainId, contractName, address } = body;
    if (chainId == null || !contractName || !address) {
      return c.json({ success: false, error: 'Missing chainId, contractName, or address' }, 400);
    }
    if (!isEthAddress(address)) return c.json({ success: false, error: 'Invalid address' }, 400);
    const repo = new GovernanceRepository(db);
    const row = await repo.upsertContract(parseInt(chainId, 10), contractName, address);
    return c.json({ success: true, data: row });
  });

  return app;
};

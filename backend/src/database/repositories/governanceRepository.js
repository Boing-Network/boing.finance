import { eq, and, desc, asc, sql } from 'drizzle-orm';
import {
  governanceProposals,
  governanceVotes,
  treasurySnapshots,
  contractRegistry
} from '../schema.js';

export class GovernanceRepository {
  constructor(db) {
    this.db = db;
  }

  async listProposals(chainId = null, status = null, limit = 50, offset = 0) {
    let query = this.db.select().from(governanceProposals);
    const conditions = [];
    if (chainId != null) conditions.push(eq(governanceProposals.chainId, chainId));
    if (status) conditions.push(eq(governanceProposals.status, status));
    if (conditions.length) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }
    return await query.orderBy(desc(governanceProposals.createdAt)).limit(limit).offset(offset);
  }

  async getProposalById(id) {
    const [row] = await this.db.select().from(governanceProposals).where(eq(governanceProposals.id, id));
    return row ?? null;
  }

  async createProposal(data) {
    const [row] = await this.db.insert(governanceProposals).values({
      chainId: data.chainId,
      contractProposalId: data.contractProposalId ?? null,
      title: data.title,
      description: data.description,
      status: data.status ?? 'pending',
      createdBy: data.createdBy,
      votesFor: data.votesFor ?? '0',
      votesAgainst: data.votesAgainst ?? '0',
      startBlock: data.startBlock ?? null,
      endBlock: data.endBlock ?? null,
      endDate: data.endDate ?? null
    }).returning();
    return row;
  }

  async updateProposal(id, data) {
    const update = { ...data, updatedAt: sql`CURRENT_TIMESTAMP` };
    const [row] = await this.db.update(governanceProposals).set(update).where(eq(governanceProposals.id, id)).returning();
    return row ?? null;
  }

  async updateProposalVotes(id, votesFor, votesAgainst) {
    return this.updateProposal(id, { votesFor: String(votesFor), votesAgainst: String(votesAgainst) });
  }

  async recordVote(data) {
    const [row] = await this.db.insert(governanceVotes).values({
      proposalId: data.proposalId,
      voter: data.voter,
      support: data.support,
      weight: data.weight,
      txHash: data.txHash ?? null
    }).returning();
    return row;
  }

  async getVotesByProposal(proposalId, limit = 200) {
    return await this.db.select().from(governanceVotes)
      .where(eq(governanceVotes.proposalId, proposalId))
      .orderBy(desc(governanceVotes.createdAt))
      .limit(limit);
  }

  async getVoteByProposalAndVoter(proposalId, voter) {
    const [row] = await this.db.select().from(governanceVotes)
      .where(and(eq(governanceVotes.proposalId, proposalId), eq(governanceVotes.voter, voter)));
    return row ?? null;
  }

  async getLatestTreasurySnapshot(chainId) {
    const [row] = await this.db.select().from(treasurySnapshots)
      .where(eq(treasurySnapshots.chainId, chainId))
      .orderBy(desc(treasurySnapshots.timestamp))
      .limit(1);
    return row ?? null;
  }

  async saveTreasurySnapshot(data) {
    const [row] = await this.db.insert(treasurySnapshots).values({
      chainId: data.chainId,
      totalUsd: data.totalUsd,
      allocations: typeof data.allocations === 'object' ? JSON.stringify(data.allocations) : data.allocations,
      multisigSigners: data.multisigSigners ?? null
    }).returning();
    return row;
  }

  async getContractsByChain(chainId) {
    return await this.db.select().from(contractRegistry).where(eq(contractRegistry.chainId, chainId));
  }

  async getAllContracts() {
    return await this.db.select().from(contractRegistry).orderBy(asc(contractRegistry.chainId), asc(contractRegistry.contractName));
  }

  async upsertContract(chainId, contractName, address) {
    const existing = await this.db.select().from(contractRegistry)
      .where(and(eq(contractRegistry.chainId, chainId), eq(contractRegistry.contractName, contractName)));
    if (existing.length) {
      const [row] = await this.db.update(contractRegistry)
        .set({ address, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(and(eq(contractRegistry.chainId, chainId), eq(contractRegistry.contractName, contractName)))
        .returning();
      return row;
    }
    const [row] = await this.db.insert(contractRegistry).values({ chainId, contractName, address }).returning();
    return row;
  }
}

/**
 * Solana routes - deployment records and API
 * Records token/NFT deployments for indexing and history
 */
import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../database/schema.js';

export const createSolanaRoutes = () => {
  const solana = new Hono();

  // Record a Solana deployment (token or NFT)
  solana.post('/deployments', async (c) => {
    try {
      const db = c.get('db');
      const body = await c.req.json();
      const { mintAddress, creatorAddress, network, type, name, symbol, metadataUri, signature } = body;

      if (!mintAddress || !creatorAddress || !network || !type || !name || !symbol || !signature) {
        return c.json({ success: false, error: 'Missing required fields' }, 400);
      }
      if (!['mainnet', 'devnet'].includes(network)) {
        return c.json({ success: false, error: 'Invalid network' }, 400);
      }
      if (!['token', 'nft'].includes(type)) {
        return c.json({ success: false, error: 'Invalid type' }, 400);
      }

      await db.insert(schema.solanaDeployments).values({
        mintAddress,
        creatorAddress,
        network,
        type,
        name,
        symbol,
        metadataUri: metadataUri || null,
        signature,
      });

      return c.json({ success: true });
    } catch (err) {
      console.error('Solana deployment record error:', err);
      return c.json({ success: false, error: err.message }, 500);
    }
  });

  // Get deployments by creator
  solana.get('/deployments/:address', async (c) => {
    try {
      const db = c.get('db');
      const address = c.req.param('address');
      const network = c.req.query('network');
      const type = c.req.query('type');

      const rows = await db.select().from(schema.solanaDeployments).where(eq(schema.solanaDeployments.creatorAddress, address)).orderBy(desc(schema.solanaDeployments.createdAt)).limit(100);

      let filtered = rows;
      if (network) filtered = filtered.filter((r) => r.network === network);
      if (type) filtered = filtered.filter((r) => r.type === type);

      return c.json({ success: true, data: filtered });
    } catch (err) {
      console.error('Solana deployments fetch error:', err);
      return c.json({ success: false, error: err.message }, 500);
    }
  });

  return solana;
};

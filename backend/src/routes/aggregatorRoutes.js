import { Hono } from 'hono';
import {
  fetchJupiterQuote,
  fetchJupiterSwapTx,
  fetchLifiQuote,
  summarizeLifiQuote,
} from '../services/aggregatorProxy.js';

const EVM_ADDR = /^0x[0-9a-fA-F]{40}$/;
const AMOUNT = /^[0-9]+$/;

export function createAggregatorRoutes() {
  const router = new Hono();

  router.get('/quote', async (c) => {
    c.header('Cache-Control', 'no-store');
    const chain = (c.req.query('chain') || '').toLowerCase();
    const fromToken = c.req.query('fromToken') || '';
    const toToken = c.req.query('toToken') || '';
    const fromAmount = c.req.query('fromAmount') || '';
    const fromAddress = c.req.query('fromAddress') || '';
    const toDecimals = c.req.query('toDecimals');
    const slippage = c.req.query('slippage');

    if (!AMOUNT.test(fromAmount)) {
      return c.json({ success: false, error: 'fromAmount must be an integer in smallest units' }, 400);
    }

    try {
      if (chain === 'solana') {
        const slippageBps = slippage != null ? Math.round(Number(slippage) * 10000) : 50;
        const quote = await fetchJupiterQuote({
          inputMint: fromToken,
          outputMint: toToken,
          amount: fromAmount,
          slippageBps: Number.isFinite(slippageBps) ? slippageBps : 50,
          env: c.env,
        });
        const routePlan = quote.routePlan || [];
        const venue = routePlan[0]?.swapInfo?.label || 'Jupiter';
        return c.json({
          success: true,
          data: {
            provider: 'jupiter',
            venue,
            amountOutRaw: quote.outAmount,
            otherAmountThreshold: quote.otherAmountThreshold,
            quoteResponse: quote,
          },
        });
      }

      const chainId = Number(chain);
      if (!Number.isInteger(chainId) || chainId <= 0) {
        return c.json({ success: false, error: 'Invalid chain' }, 400);
      }
      if (!EVM_ADDR.test(fromToken) || !EVM_ADDR.test(toToken) || !EVM_ADDR.test(fromAddress)) {
        return c.json({ success: false, error: 'fromToken, toToken, and fromAddress must be 0x addresses' }, 400);
      }
      if (fromToken.toLowerCase() === toToken.toLowerCase()) {
        return c.json({ success: false, error: 'from and to tokens must differ' }, 400);
      }

      const raw = await fetchLifiQuote({
        chainId,
        fromToken,
        toToken,
        fromAmount,
        fromAddress,
        slippage: slippage != null ? Number(slippage) : 0.005,
        env: c.env,
      });
      return c.json({
        success: true,
        data: summarizeLifiQuote(raw, toDecimals),
      });
    } catch (error) {
      return c.json({ success: false, error: error.message || 'Quote failed' }, 502);
    }
  });

  router.post('/jupiter-swap', async (c) => {
    c.header('Cache-Control', 'no-store');
    const body = await c.req.json().catch(() => ({}));
    const { quoteResponse, userPublicKey } = body;
    if (!quoteResponse || !userPublicKey) {
      return c.json({ success: false, error: 'quoteResponse and userPublicKey are required' }, 400);
    }
    try {
      const built = await fetchJupiterSwapTx({ quoteResponse, userPublicKey, env: c.env });
      return c.json({ success: true, data: built });
    } catch (error) {
      return c.json({ success: false, error: error.message || 'Swap build failed' }, 502);
    }
  });

  return router;
}

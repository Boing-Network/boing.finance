// AI DeFi Assistant Routes
// Uses Cloudflare Workers AI (or OpenAI fallback when OPENAI_API_KEY is set)

import { Hono } from 'hono';

const DEFI_SYSTEM_PROMPT = `You are a helpful DeFi assistant for boing.finance, a decentralized exchange (DEX) platform. You help users understand:
- How to swap tokens, add/remove liquidity, and use liquidity pools
- Price impact, slippage, and trading concepts
- Cross-chain bridging between Ethereum, Polygon, Arbitrum, Base, BSC, Optimism
- Token security (ownership renounced, mint functions, blacklists, etc.)
- How to deploy tokens and create pools on boing.finance

Keep responses concise (2-4 paragraphs max), clear, and practical. Do not give financial advice or price predictions. If asked about a specific token's safety, encourage users to run the Security Scanner and verify on block explorers.`;

export function createAIRoutes() {
  const router = new Hono();

  router.post('/chat', async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const { message, context } = body;

      if (!message || typeof message !== 'string') {
        return c.json({ success: false, error: 'Message is required' }, 400);
      }

      const trimmedMessage = message.trim().slice(0, 500);
      if (!trimmedMessage) {
        return c.json({ success: false, error: 'Message cannot be empty' }, 400);
      }

      const ai = c.env.AI;
      const openaiKey = c.env.OPENAI_API_KEY;

      let reply = null;

      // Prefer Cloudflare Workers AI
      if (ai) {
        try {
          const systemPrompt = DEFI_SYSTEM_PROMPT + (context ? `\n\nContext from user: ${JSON.stringify(context)}` : '');
          const fullPrompt = `${systemPrompt}\n\nUser question: ${trimmedMessage}\n\nAssistant:`;

          const result = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
            prompt: fullPrompt,
            max_tokens: 512
          });

          reply = result?.response ?? (typeof result === 'string' ? result : null);
          if (result?.result?.response) reply = result.result.response;
        } catch (aiError) {
          console.warn('Workers AI failed:', aiError.message);
        }
      }

      // Fallback to OpenAI if Workers AI unavailable or failed
      if (!reply && openaiKey) {
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: DEFI_SYSTEM_PROMPT },
                ...(context ? [{ role: 'system', content: `Context: ${JSON.stringify(context)}` }] : []),
                { role: 'user', content: trimmedMessage }
              ],
              max_tokens: 512,
              temperature: 0.7
            })
          });

          if (response.ok) {
            const data = await response.json();
            reply = data?.choices?.[0]?.message?.content?.trim() || null;
          }
        } catch (openaiError) {
          console.warn('OpenAI fallback failed:', openaiError.message);
        }
      }

      if (!reply) {
        return c.json({
          success: false,
          error: 'AI assistant is not available. Workers AI or OpenAI API key may need to be configured.',
          hint: 'Add [ai] binding in wrangler.toml for Cloudflare Workers AI, or set OPENAI_API_KEY secret.'
        }, 503);
      }

      return c.json({
        success: true,
        reply,
        source: ai ? 'workers-ai' : 'openai'
      });
    } catch (error) {
      console.error('AI chat error:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to get AI response'
      }, 500);
    }
  });

  router.post('/security-summary', async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const { results, score, recommendations, tokenSymbol } = body;

      if (!results || !Array.isArray(results)) {
        return c.json({ success: false, error: 'Scan results are required' }, 400);
      }

      const ai = c.env.AI;
      const openaiKey = c.env.OPENAI_API_KEY;

      const passedChecks = results.filter(r => r.passed).map(r => r.name);
      const failedChecks = results.filter(r => !r.passed && r.status !== 'unknown').map(r => ({ name: r.name, details: r.details }));
      const unknownChecks = results.filter(r => r.status === 'unknown').map(r => r.name);

      const prompt = `You are a DeFi security expert. Summarize this token security scan in 2-4 short paragraphs of plain English. Be concise and practical.

Token: ${tokenSymbol || 'Unknown'}
Security Score: ${score ?? 'N/A'}%

PASSED: ${passedChecks.length ? passedChecks.join(', ') : 'None'}
${failedChecks.length ? `ISSUES: ${failedChecks.map(f => `${f.name}: ${f.details}`).join('; ')}` : ''}
${unknownChecks.length ? `Could not verify: ${unknownChecks.join(', ')}` : ''}
${recommendations?.length ? `Recommendations: ${recommendations.join('; ')}` : ''}

Write a clear summary for a non-technical user. Do NOT give investment advice. Focus on what the findings mean for safety.`;

      let reply = null;

      if (ai) {
        try {
          const result = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
            prompt,
            max_tokens: 400
          });
          reply = result?.response ?? result?.result?.response ?? (typeof result === 'string' ? result : null);
        } catch (e) {
          console.warn('Workers AI security summary failed:', e.message);
        }
      }

      if (!reply && openaiKey) {
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: prompt }],
              max_tokens: 400,
              temperature: 0.5
            })
          });
          if (response.ok) {
            const data = await response.json();
            reply = data?.choices?.[0]?.message?.content?.trim() || null;
          }
        } catch (e) {
          console.warn('OpenAI security summary failed:', e.message);
        }
      }

      if (!reply) {
        return c.json({
          success: false,
          error: 'AI summary not available. Configure Workers AI or OPENAI_API_KEY.'
        }, 503);
      }

      return c.json({ success: true, summary: reply });
    } catch (error) {
      console.error('Security summary error:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  return router;
}

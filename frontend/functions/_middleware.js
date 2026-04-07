/**
 * Cloudflare Pages: apply security headers on every response so CSP matches the built app.
 * `font-src` includes `data:` because Vite may inline small woff2/ttf as data URLs and Google Fonts
 * stylesheets can reference `data:font/woff2` subsets. Without `data:`, the browser blocks those fonts.
 *
 * CSP is set here (not only in `public/_headers`) because some deployments/dashboard rules were
 * serving a policy without `data:`; this middleware overwrites `Content-Security-Policy` consistently.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com https://static.cloudflareinsights.com https://*.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https://*.workers.dev https://*.etherscan.io https://*.infura.io https://*.alchemyapi.io https://*.pinata.cloud https://*.web3.storage https://*.nft.storage https://*.storacha.network https://static.cloudflareinsights.com https://*.cloudflareinsights.com https://api.coingecko.com https://www.walletlink.org https://api.thegraph.com https://gateway-arbitrum.network.thegraph.com https://gateway.network.thegraph.com https://*.network.thegraph.com https://chain-proxy.wallet.coinbase.com https://api.dfuse.io https://testnet-rpc.boing.network https://*.boing.network wss://*.infura.io wss://*.alchemyapi.io wss://www.walletlink.org",
  "frame-src 'self' https://*.etherscan.io",
].join('; ');

export async function onRequest(context) {
  const response = await context.next();
  const headers = new Headers(response.headers);
  headers.set('Content-Security-Policy', CONTENT_SECURITY_POLICY);
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Cloudflare Pages Function: same-origin proxy to Boing testnet JSON-RPC.
 * Avoids browser CORS when the public node does not list boing.finance in Allow-Origin.
 *
 * Optional env (Pages / wrangler): BOING_TESTNET_RPC_URL — override upstream base (no trailing slash).
 */
export async function onRequestPost({ request, env }) {
  const upstreamBase = (
    env.BOING_TESTNET_RPC_URL || "https://testnet-rpc.boing.network"
  ).replace(/\/$/, "");
  const upstreamUrl = `${upstreamBase}/`;
  const body = await request.text();
  const res = await fetch(upstreamUrl, {
    method: "POST",
    headers: {
      "Content-Type": request.headers.get("Content-Type") || "application/json",
      Accept: "application/json",
    },
    body,
  });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "application/json",
      "Cache-Control": "no-store",
    },
  });
}

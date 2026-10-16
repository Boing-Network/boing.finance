/**
 * Cloudflare Pages Function: same-origin proxy to boing.observer's contract analysis
 * (`/api/contract/interface`), which has no CORS headers. GET only, testnet only, id must be 32-byte hex.
 */
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const id = (url.searchParams.get("id") || "").trim();
  if (!/^(0x)?[0-9a-fA-F]{64}$/.test(id)) {
    return new Response(JSON.stringify({ error: "Invalid id (expect 32-byte hex)" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const upstream = `https://boing.observer/api/contract/interface?network=testnet&id=${id.startsWith("0x") ? id : `0x${id}`}`;
  const res = await fetch(upstream, { headers: { Accept: "application/json" } });
  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
  });
}
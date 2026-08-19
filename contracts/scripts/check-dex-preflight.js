/**
 * No-key check: RPC + wrapped-native bytecode for DEX rollout chains.
 * Does not deploy and does not seed liquidity.
 *
 *   cd contracts
 *   node scripts/check-dex-preflight.js
 */

const {
  getDexRolloutChainIds,
  getWrappedNative,
  getRpcUrls,
  getNetworkLabel,
  getSkipReason,
  getHardhatNetworkName,
  SKIP,
} = require("../config/dexTargets");

async function rpc(url, method, params) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(body.error.message || JSON.stringify(body.error));
  return body.result;
}

async function firstWorkingRpc(urls, chainId) {
  let lastErr;
  for (const url of urls) {
    try {
      const idHex = await rpc(url, "eth_chainId", []);
      const got = Number.parseInt(idHex, 16);
      if (got !== Number(chainId)) {
        lastErr = new Error(`chainId mismatch ${got} != ${chainId}`);
        continue;
      }
      return url;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("no RPC");
}

async function checkChain(chainId) {
  const label = getNetworkLabel(chainId);
  const weth = getWrappedNative(chainId);
  const urls = getRpcUrls(chainId);
  const row = {
    chainId,
    label,
    hardhat: getHardhatNetworkName(chainId),
    weth,
    rpc: null,
    wethHasCode: false,
    ready: false,
    error: null,
  };
  if (!weth) {
    row.error = "missing wrapped native";
    return row;
  }
  try {
    const url = await firstWorkingRpc(urls, chainId);
    row.rpc = url;
    const code = await rpc(url, "eth_getCode", [weth, "latest"]);
    row.wethHasCode = typeof code === "string" && code !== "0x" && code.length > 2;
    row.ready = row.wethHasCode;
    if (!row.wethHasCode) row.error = "no bytecode at wrapped native";
  } catch (e) {
    row.error = e.message || String(e);
  }
  return row;
}

async function main() {
  const ids = getDexRolloutChainIds();
  const rows = [];
  for (const id of ids) {
    process.stdout.write(`Checking ${getNetworkLabel(id)} (${id})… `);
    const row = await checkChain(id);
    rows.push(row);
    console.log(row.ready ? "OK" : `FAIL ${row.error || ""}`);
  }

  console.log("\nSkipped (not in this rollout):");
  for (const [id, reason] of Object.entries(SKIP)) {
    console.log(`  ${id}: ${reason}`);
  }

  const ready = rows.filter((r) => r.ready);
  const blocked = rows.filter((r) => !r.ready);
  console.log(`\nReady for protocol deploy (pre-funding): ${ready.length}/${rows.length}`);
  if (blocked.length) {
    console.log("Blocked:");
    for (const r of blocked) {
      console.log(`  ${r.label} (${r.chainId}): ${r.error}`);
    }
    process.exitCode = 1;
  } else {
    console.log("Next: set DEPLOYER_PRIVATE_KEY, fund the deployer with gas, then:");
    console.log("  npx hardhat run scripts/deploy-dex.js --network <name>");
    console.log("  node scripts/deploy-dex-multi-network.js");
    console.log("Then paste addresses into frontend/src/config/contracts.js. Do not seed LP until the funding stage.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

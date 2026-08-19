/**
 * Sequential DEX protocol deploy across rollout chains (excludes Ethereum).
 * Does not seed liquidity.
 *
 *   cd contracts
 *   node scripts/deploy-dex-multi-network.js
 *   node scripts/deploy-dex-multi-network.js --only polygon,base
 *
 * Requires DEPLOYER_PRIVATE_KEY and native gas on each chain.
 */

const { spawnSync } = require("child_process");
const path = require("path");
const {
  getDexRolloutChainIds,
  getHardhatNetworkName,
  getNetworkLabel,
} = require("../config/dexTargets");

function parseOnly() {
  const idx = process.argv.indexOf("--only");
  if (idx === -1 || !process.argv[idx + 1]) return null;
  return process.argv[idx + 1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function main() {
  const only = parseOnly();
  let chainIds = getDexRolloutChainIds().filter((id) => id !== 11155111);
  if (only) {
    chainIds = chainIds.filter((id) => {
      const name = getHardhatNetworkName(id);
      return only.includes(String(id)) || (name && only.includes(name));
    });
    if (chainIds.length === 0) {
      console.error("No matching rollout chains for --only", only.join(","));
      process.exit(1);
    }
  }

  const contractsDir = path.join(__dirname, "..");
  const failures = [];

  for (const chainId of chainIds) {
    const network = getHardhatNetworkName(chainId);
    console.log("\n========", getNetworkLabel(chainId), `(${chainId} / ${network})`, "========");
    const result = spawnSync(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["hardhat", "run", "scripts/deploy-dex.js", "--network", network],
      { cwd: contractsDir, stdio: "inherit", shell: process.platform === "win32" }
    );
    if (result.status !== 0) {
      failures.push({ chainId, network, status: result.status });
    }
  }

  if (failures.length) {
    console.error("\nFailed networks:", failures);
    process.exit(1);
  }
  console.log("\nAll requested DEX deploys finished. Wire addresses in frontend/src/config/contracts.js, then fund via Create Pool.");
}

main();

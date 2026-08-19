/**
 * Deploy DEXFactoryV2 + LiquidityLocker + DEXRouter on the current Hardhat network.
 * Does not seed liquidity (funding is a later step).
 *
 *   cd contracts
 *   npx hardhat run scripts/deploy-dex.js --network polygon
 *
 * Skip if deployments/dex-<chainId>.json already has addresses (unless FORCE_DEX_REDEPLOY=1).
 */

const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const {
  getWrappedNative,
  getSkipReason,
  getNetworkLabel,
  isZeroAddress,
} = require("../config/dexTargets");

function deploymentPath(chainId) {
  return path.join(__dirname, "..", "deployments", `dex-${chainId}.json`);
}

function loadExisting(chainId) {
  const p = deploymentPath(chainId);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  const net = await hre.ethers.provider.getNetwork();
  const chainId = Number(net.chainId);
  const skip = getSkipReason(chainId);
  if (skip) {
    console.log(`Skip ${getNetworkLabel(chainId)} (${chainId}): ${skip}`);
    return;
  }

  const weth = process.env.DEX_WETH || getWrappedNative(chainId);
  if (!weth || isZeroAddress(weth)) {
    throw new Error(`No wrapped-native address for chain ${chainId}. Set DEX_WETH=0x…`);
  }

  const existing = loadExisting(chainId);
  if (existing?.dexFactory && !process.env.FORCE_DEX_REDEPLOY) {
    console.log(`Already recorded for ${getNetworkLabel(chainId)} (${chainId}):`);
    console.log(JSON.stringify(existing, null, 2));
    console.log("Set FORCE_DEX_REDEPLOY=1 to deploy again.");
    return;
  }

  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    throw new Error("No signer. Set DEPLOYER_PRIVATE_KEY in contracts/.env");
  }

  const wethCode = await hre.ethers.provider.getCode(weth);
  if (!wethCode || wethCode === "0x") {
    throw new Error(`No contract code at wrapped native ${weth} on chain ${chainId}`);
  }

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(
    `Deploying DEX stack on ${getNetworkLabel(chainId)} (${chainId})\n  deployer: ${deployer.address}\n  WETH: ${weth}\n  balance: ${hre.ethers.formatEther(balance)}`
  );

  const Locker = await hre.ethers.getContractFactory("LiquidityLocker");
  const locker = await Locker.deploy(deployer.address);
  await locker.waitForDeployment();
  const lockerAddress = await locker.getAddress();
  console.log("LiquidityLocker (temp factory = deployer):", lockerAddress);

  const Factory = await hre.ethers.getContractFactory("DEXFactoryV2");
  const factory = await Factory.deploy(lockerAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("DEXFactoryV2:", factoryAddress);

  const setFactoryTx = await locker.setFactory(factoryAddress);
  await setFactoryTx.wait();
  console.log("LiquidityLocker.setFactory → factory");

  const Router = await hre.ethers.getContractFactory("DEXRouter");
  const router = await Router.deploy(factoryAddress, weth);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("DEXRouter:", routerAddress);

  const record = {
    chainId,
    network: hre.network.name,
    label: getNetworkLabel(chainId),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    weth,
    liquidityLocker: lockerAddress,
    dexFactory: factoryAddress,
    dexRouter: routerAddress,
    funded: false,
    note: "Protocol only. Create Pool / add liquidity is the funding stage.",
  };

  const dir = path.dirname(deploymentPath(chainId));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(deploymentPath(chainId), `${JSON.stringify(record, null, 2)}\n`);

  console.log("\nWrote", deploymentPath(chainId));
  console.log("Paste into frontend/src/config/contracts.js for this chainId:");
  console.log(`    dexFactory: '${factoryAddress}',`);
  console.log(`    dexRouter: '${routerAddress}',`);
  console.log(`    weth: '${weth}',`);
  console.log(`    liquidityLocker: '${lockerAddress}',`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy DEX Factory
  console.log("\nDeploying DEX Factory...");
  const DEXFactory = await ethers.getContractFactory("DEXFactory");
  const dexFactory = await DEXFactory.deploy();
  await dexFactory.deployed();
  console.log("DEX Factory deployed to:", dexFactory.address);

  // Deploy Mock Tokens for testing (only on testnets/local)
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 1) { // Not mainnet
    console.log("\nDeploying Mock Tokens...");
    
    const MockToken = await ethers.getContractFactory("MockToken");
    const mockToken1 = await MockToken.deploy("Mock Token 1", "MTK1");
    await mockToken1.deployed();
    console.log("Mock Token 1 deployed to:", mockToken1.address);

    const mockToken2 = await MockToken.deploy("Mock Token 2", "MTK2");
    await mockToken2.deployed();
    console.log("Mock Token 2 deployed to:", mockToken2.address);

    // Create a trading pair
    console.log("\nCreating trading pair...");
    const tx = await dexFactory.createPair(mockToken1.address, mockToken2.address);
    await tx.wait();
    console.log("Trading pair created!");

    // Get pair address
    const pairAddress = await dexFactory.getPair(mockToken1.address, mockToken2.address);
    console.log("Pair address:", pairAddress);
  }

  // Deploy Cross-Chain Bridge (simplified version)
  console.log("\nDeploying Cross-Chain Bridge...");
  const CrossChainBridge = await ethers.getContractFactory("CrossChainBridge");
  const crossChainBridge = await CrossChainBridge.deploy();
  await crossChainBridge.deployed();
  console.log("Cross-Chain Bridge deployed to:", crossChainBridge.address);

  // Set bridge address in factory
  await dexFactory.setBridgeAddress(network.chainId, crossChainBridge.address);
  console.log("Bridge address set in factory for chain ID:", network.chainId);

  // Deploy Price Oracle
  console.log("\nDeploying Price Oracle...");
  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  const priceOracle = await PriceOracle.deploy();
  await priceOracle.deployed();
  console.log("Price Oracle deployed to:", priceOracle.address);

  console.log("\n=== Deployment Summary ===");
  console.log("Network Chain ID:", network.chainId);
  console.log("DEX Factory:", dexFactory.address);
  console.log("Cross-Chain Bridge:", crossChainBridge.address);
  console.log("Price Oracle:", priceOracle.address);
  
  if (network.chainId !== 1) {
    console.log("Mock Token 1:", mockToken1.address);
    console.log("Mock Token 2:", mockToken2.address);
    console.log("Trading Pair:", pairAddress);
  }

  console.log("\nDeployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
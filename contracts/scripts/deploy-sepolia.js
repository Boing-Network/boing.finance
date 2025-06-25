const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts to Sepolia with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Verify we're on Sepolia
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 11155111) {
    throw new Error("Not connected to Sepolia testnet!");
  }

  console.log("\n=== Deploying to Sepolia Testnet ===");

  // Deploy DEX Factory
  console.log("\n1. Deploying DEX Factory...");
  const DEXFactory = await ethers.getContractFactory("DEXFactory");
  const dexFactory = await DEXFactory.deploy();
  await dexFactory.deployed();
  console.log("✅ DEX Factory deployed to:", dexFactory.address);

  // Deploy Cross-Chain Bridge
  console.log("\n2. Deploying Cross-Chain Bridge...");
  const CrossChainBridge = await ethers.getContractFactory("CrossChainBridge");
  const crossChainBridge = await CrossChainBridge.deploy();
  await crossChainBridge.deployed();
  console.log("✅ Cross-Chain Bridge deployed to:", crossChainBridge.address);

  // Deploy Price Oracle
  console.log("\n3. Deploying Price Oracle...");
  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  const priceOracle = await PriceOracle.deploy();
  await priceOracle.deployed();
  console.log("✅ Price Oracle deployed to:", priceOracle.address);

  // Deploy Mock Tokens for testing
  console.log("\n4. Deploying Mock Tokens...");
  const MockToken = await ethers.getContractFactory("MockToken");
  
  const mockToken1 = await MockToken.deploy("Mock USDC", "mUSDC");
  await mockToken1.deployed();
  console.log("✅ Mock USDC deployed to:", mockToken1.address);

  const mockToken2 = await MockToken.deploy("Mock ETH", "mETH");
  await mockToken2.deployed();
  console.log("✅ Mock ETH deployed to:", mockToken2.address);

  const mockToken3 = await MockToken.deploy("Mock DAI", "mDAI");
  await mockToken3.deployed();
  console.log("✅ Mock DAI deployed to:", mockToken3.address);

  // Set bridge address in factory
  console.log("\n5. Configuring Factory...");
  await dexFactory.setBridgeAddress(network.chainId, crossChainBridge.address);
  console.log("✅ Bridge address set in factory");

  // Create initial trading pairs
  console.log("\n6. Creating Trading Pairs...");
  
  const tx1 = await dexFactory.createPair(mockToken1.address, mockToken2.address);
  await tx1.wait();
  const pair1Address = await dexFactory.getPair(mockToken1.address, mockToken2.address);
  console.log("✅ USDC/ETH pair created:", pair1Address);

  const tx2 = await dexFactory.createPair(mockToken1.address, mockToken3.address);
  await tx2.wait();
  const pair2Address = await dexFactory.getPair(mockToken1.address, mockToken3.address);
  console.log("✅ USDC/DAI pair created:", pair2Address);

  // Configure bridge for supported tokens
  console.log("\n7. Configuring Bridge...");
  await crossChainBridge.addSupportedToken(mockToken1.address);
  await crossChainBridge.addSupportedToken(mockToken2.address);
  await crossChainBridge.addSupportedToken(mockToken3.address);
  await crossChainBridge.addSupportedChain(1); // Ethereum mainnet
  await crossChainBridge.addSupportedChain(137); // Polygon
  console.log("✅ Bridge configured with supported tokens and chains");

  // Set up price feeds (using fallback prices for testnet)
  console.log("\n8. Setting up Price Feeds...");
  await priceOracle.setFallbackPrice(mockToken1.address, ethers.utils.parseUnits("1", 6)); // USDC = $1
  await priceOracle.setFallbackPrice(mockToken2.address, ethers.utils.parseUnits("2000", 18)); // ETH = $2000
  await priceOracle.setFallbackPrice(mockToken3.address, ethers.utils.parseUnits("1", 18)); // DAI = $1
  console.log("✅ Price feeds configured");

  // Save deployment addresses
  const deploymentInfo = {
    network: "sepolia",
    chainId: network.chainId,
    deployer: deployer.address,
    contracts: {
      dexFactory: dexFactory.address,
      crossChainBridge: crossChainBridge.address,
      priceOracle: priceOracle.address,
      tokens: {
        mockUSDC: mockToken1.address,
        mockETH: mockToken2.address,
        mockDAI: mockToken3.address,
      },
      pairs: {
        usdcEth: pair1Address,
        usdcDai: pair2Address,
      }
    },
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  // Save to file
  const deploymentPath = path.join(__dirname, "../deployments/sepolia-deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n📄 Deployment info saved to:", deploymentPath);

  // Print summary
  console.log("\n=== Deployment Summary ===");
  console.log("Network: Sepolia Testnet");
  console.log("Chain ID:", network.chainId);
  console.log("Deployer:", deployer.address);
  console.log("\nContract Addresses:");
  console.log("DEX Factory:", dexFactory.address);
  console.log("Cross-Chain Bridge:", crossChainBridge.address);
  console.log("Price Oracle:", priceOracle.address);
  console.log("\nMock Tokens:");
  console.log("Mock USDC:", mockToken1.address);
  console.log("Mock ETH:", mockToken2.address);
  console.log("Mock DAI:", mockToken3.address);
  console.log("\nTrading Pairs:");
  console.log("USDC/ETH:", pair1Address);
  console.log("USDC/DAI:", pair2Address);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\nNext steps:");
  console.log("1. Verify contracts on Etherscan");
  console.log("2. Update frontend configuration");
  console.log("3. Test the DEX functionality");
  console.log("4. Add liquidity to the pools");

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  }); 
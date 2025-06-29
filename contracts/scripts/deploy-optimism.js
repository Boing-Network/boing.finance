const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying TokenFactory and TokenImplementation to Optimism Mainnet");
  console.log("=" .repeat(60));

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer Balance:", ethers.formatEther(balance), "ETH");

  // Get current network
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "(Chain ID:", network.chainId, ")");

  if (Number(network.chainId) !== 10) {
    console.error("❌ ERROR: This script is designed for Optimism mainnet (Chain ID: 10)");
    console.error("Current network:", network.name, "(Chain ID:", network.chainId, ")");
    process.exit(1);
  }

  // Get the platform wallet from env
  const platformWallet = process.env.PLATFORM_WALLET;
  if (!platformWallet || platformWallet === 'your_platform_wallet_address') {
    throw new Error('PLATFORM_WALLET environment variable is not set or invalid.');
  }

  try {
    // Step 1: Deploy TokenImplementation
    console.log("\n📦 Step 1: Deploying TokenImplementation...");
    const TokenImplementation = await ethers.getContractFactory("TokenImplementation");
    const tokenImplementation = await TokenImplementation.deploy();
    await tokenImplementation.waitForDeployment();
    
    const tokenImplementationAddress = await tokenImplementation.getAddress();
    console.log("✅ TokenImplementation deployed to:", tokenImplementationAddress);

    // Step 2: Deploy TokenFactory with Platform Wallet and TokenImplementation address
    console.log("\n🏭 Step 2: Deploying TokenFactory...");
    const TokenFactory = await ethers.getContractFactory("TokenFactory");
    const tokenFactory = await TokenFactory.deploy(platformWallet, tokenImplementationAddress);
    await tokenFactory.waitForDeployment();
    
    const tokenFactoryAddress = await tokenFactory.getAddress();
    console.log("✅ TokenFactory deployed to:", tokenFactoryAddress);

    // Step 3: Verify the deployment
    console.log("\n🔍 Step 3: Verifying deployment...");
    
    // Verify TokenFactory has correct TokenImplementation address
    const factoryImplementation = await tokenFactory.implementation;
    console.log("   TokenImplementation in factory:", factoryImplementation);
    
    if (factoryImplementation === tokenImplementationAddress) {
      console.log("   ✅ TokenFactory correctly references TokenImplementation");
    } else {
      console.log("   ❌ ERROR: TokenFactory has incorrect TokenImplementation address");
    }

    // Verify deployer is owner of TokenFactory
    let factoryOwner;
    try {
      factoryOwner = await tokenFactory.owner();
    } catch {
      factoryOwner = await tokenFactory.owner;
    }
    console.log("   TokenFactory owner:", factoryOwner);
    
    if (factoryOwner === deployer.address) {
      console.log("   ✅ Deployer is owner of TokenFactory");
    } else {
      console.log("   ❌ ERROR: Deployer is not owner of TokenFactory");
    }

    // Step 4: Save deployment info
    console.log("\n📋 Step 4: Deployment Summary");
    console.log("=" .repeat(40));
    console.log("Network: Optimism Mainnet");
    console.log("Deployer:", deployer.address);
    console.log("TokenImplementation:", tokenImplementationAddress);
    console.log("TokenFactory:", tokenFactoryAddress);
    console.log("Deployment Hash:", tokenFactory.deploymentTransaction()?.hash || "N/A");

    // Step 5: Save to deployment registry
    const deploymentInfo = {
      network: "optimism",
      chainId: 10,
      deployer: deployer.address,
      tokenImplementation: tokenImplementationAddress,
      tokenFactory: tokenFactoryAddress,
      deploymentHash: tokenFactory.deploymentTransaction()?.hash || "N/A",
      deployedAt: new Date().toISOString(),
      contracts: {
        TokenImplementation: {
          address: tokenImplementationAddress,
          constructorArgs: []
        },
        TokenFactory: {
          address: tokenFactoryAddress,
          constructorArgs: [platformWallet, tokenImplementationAddress]
        }
      }
    };

    // Save to file
    const fs = require('fs');
    const path = require('path');
    const deploymentFile = path.join(__dirname, 'deployment-registry-optimism.json');
    
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("\n💾 Deployment info saved to:", deploymentFile);

    console.log("\n🎉 Deployment completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("1. Update frontend configuration with new contract addresses");
    console.log("2. Test token deployment through the factory");
    console.log("3. Verify contracts on Optimism block explorer");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
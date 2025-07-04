const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Testing Sepolia Deployment...\n");

  // Contract addresses from deployment registry
  const TOKEN_FACTORY_ADDRESS = "0xF6837c7142A97bE35ef04148522748EA288b494b";
  const TOKEN_IMPLEMENTATION_ADDRESS = "0x8e576F4F8e841B9B688f71b4A92C7cED26267e68";
  
  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  try {
    // Load contract artifacts
    const TokenFactory = await ethers.getContractFactory("TokenFactory");
    const TokenImplementation = await ethers.getContractFactory("TokenImplementation");
    
    // Connect to deployed contracts
    const tokenFactory = TokenFactory.attach(TOKEN_FACTORY_ADDRESS);
    const tokenImplementation = TokenImplementation.attach(TOKEN_IMPLEMENTATION_ADDRESS);
    
    console.log("📋 Contract Information:");
    console.log("TokenFactory Address:", TOKEN_FACTORY_ADDRESS);
    console.log("TokenImplementation Address:", TOKEN_IMPLEMENTATION_ADDRESS);
    
    // Check if contracts are deployed
    const factoryCode = await deployer.provider.getCode(TOKEN_FACTORY_ADDRESS);
    const implementationCode = await deployer.provider.getCode(TOKEN_IMPLEMENTATION_ADDRESS);
    
    if (factoryCode === "0x") {
      console.log("❌ TokenFactory not deployed at", TOKEN_FACTORY_ADDRESS);
      return;
    }
    
    if (implementationCode === "0x") {
      console.log("❌ TokenImplementation not deployed at", TOKEN_IMPLEMENTATION_ADDRESS);
      return;
    }
    
    console.log("✅ Both contracts are deployed!\n");
    
    // Get contract details
    console.log("🔍 Contract Details:");
    
    // TokenFactory details
    try {
      const platformWallet = await tokenFactory.platformWallet();
      const implementation = await tokenFactory.implementation();
      const totalTokensDeployed = await tokenFactory.totalTokensDeployed();
      
      console.log("TokenFactory:");
      console.log("  Platform Wallet:", platformWallet);
      console.log("  Implementation:", implementation);
      console.log("  Total Tokens Deployed:", totalTokensDeployed.toString());
    } catch (error) {
      console.log("❌ Error reading TokenFactory details:", error.message);
    }
    
    // TokenImplementation details
    try {
      const name = await tokenImplementation.name();
      const symbol = await tokenImplementation.symbol();
      const decimals = await tokenImplementation.decimals();
      const totalSupply = await tokenImplementation.totalSupply();
      const owner = await tokenImplementation.owner();
      
      console.log("\nTokenImplementation:");
      console.log("  Name:", name);
      console.log("  Symbol:", symbol);
      console.log("  Decimals:", decimals);
      console.log("  Total Supply:", ethers.formatUnits(totalSupply, decimals));
      console.log("  Owner:", owner);
    } catch (error) {
      console.log("❌ Error reading TokenImplementation details:", error.message);
    }
    
    console.log("\n🎉 Sepolia deployment test completed successfully!");
    console.log("\n📝 Next Steps:");
    console.log("1. Start the frontend: cd frontend && npm start");
    console.log("2. Connect your wallet to Sepolia testnet");
    console.log("3. Navigate to the Deploy Token page");
    console.log("4. Test the enhanced token creation with IPFS logo upload");
    console.log("5. Deploy a test token with various security features");
    
  } catch (error) {
    console.error("❌ Error during testing:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
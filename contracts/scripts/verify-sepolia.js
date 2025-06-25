const { run } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Verifying contracts on Sepolia Etherscan...");

  // Load deployment info
  const deploymentPath = path.join(__dirname, "../deployments/sepolia-deployment.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("Deployment file not found. Please deploy contracts first.");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("Loaded deployment info for:", deployment.network);

  try {
    // Verify DEX Factory
    console.log("\n1. Verifying DEX Factory...");
    await run("verify:verify", {
      address: deployment.contracts.dexFactory,
      constructorArguments: [],
    });
    console.log("✅ DEX Factory verified");

    // Verify Cross-Chain Bridge
    console.log("\n2. Verifying Cross-Chain Bridge...");
    await run("verify:verify", {
      address: deployment.contracts.crossChainBridge,
      constructorArguments: [],
    });
    console.log("✅ Cross-Chain Bridge verified");

    // Verify Price Oracle
    console.log("\n3. Verifying Price Oracle...");
    await run("verify:verify", {
      address: deployment.contracts.priceOracle,
      constructorArguments: [],
    });
    console.log("✅ Price Oracle verified");

    // Verify Mock Tokens
    console.log("\n4. Verifying Mock Tokens...");
    
    await run("verify:verify", {
      address: deployment.contracts.tokens.mockUSDC,
      constructorArguments: ["Mock USDC", "mUSDC"],
    });
    console.log("✅ Mock USDC verified");

    await run("verify:verify", {
      address: deployment.contracts.tokens.mockETH,
      constructorArguments: ["Mock ETH", "mETH"],
    });
    console.log("✅ Mock ETH verified");

    await run("verify:verify", {
      address: deployment.contracts.tokens.mockDAI,
      constructorArguments: ["Mock DAI", "mDAI"],
    });
    console.log("✅ Mock DAI verified");

    console.log("\n🎉 All contracts verified successfully!");
    console.log("\nContract Links:");
    console.log("DEX Factory:", `https://sepolia.etherscan.io/address/${deployment.contracts.dexFactory}`);
    console.log("Cross-Chain Bridge:", `https://sepolia.etherscan.io/address/${deployment.contracts.crossChainBridge}`);
    console.log("Price Oracle:", `https://sepolia.etherscan.io/address/${deployment.contracts.priceOracle}`);
    console.log("Mock USDC:", `https://sepolia.etherscan.io/address/${deployment.contracts.tokens.mockUSDC}`);
    console.log("Mock ETH:", `https://sepolia.etherscan.io/address/${deployment.contracts.tokens.mockETH}`);
    console.log("Mock DAI:", `https://sepolia.etherscan.io/address/${deployment.contracts.tokens.mockDAI}`);

  } catch (error) {
    console.error("Verification failed:", error.message);
    if (error.message.includes("Already Verified")) {
      console.log("Contract is already verified on Etherscan");
    } else {
      throw error;
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Verification failed:", error);
    process.exit(1);
  }); 
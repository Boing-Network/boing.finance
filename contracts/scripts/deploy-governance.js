/**
 * Deploy governance contracts: BoingToken, Treasury, BoingGovernorSimple (or BoingGovernor + Timelock).
 * Run: npx hardhat run scripts/deploy-governance.js --network sepolia
 *
 * Prerequisites:
 * - BoingToken, Treasury, BoingGovernorSimple, BoingGovernor, TimelockController must compile
 * - Set DEPLOYER_PRIVATE_KEY in .env
 *
 * After deployment, register addresses in backend contract_registry via:
 * PUT /api/governance/contracts { chainId, contractName, address }
 */

const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;
  console.log('Deploying governance contracts with account:', deployer.address, 'on chain', chainId.toString());

  // 1. Deploy BoingToken
  const BoingToken = await hre.ethers.getContractFactory('BoingToken');
  const token = await BoingToken.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log('BoingToken deployed to:', tokenAddress);

  // 2. Deploy Treasury
  const Treasury = await hre.ethers.getContractFactory('Treasury');
  const treasury = await Treasury.deploy(deployer.address);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log('Treasury deployed to:', treasuryAddress);

  // 3. Deploy BoingGovernorSimple (no timelock)
  const Governor = await hre.ethers.getContractFactory('BoingGovernorSimple');
  const governor = await Governor.deploy(tokenAddress);
  await governor.waitForDeployment();
  const governorAddress = await governor.getAddress();
  console.log('BoingGovernorSimple deployed to:', governorAddress);

  console.log('\n--- Summary ---');
  console.log(JSON.stringify({
    network: hre.network.name,
    chainId: chainId.toString(),
    deployer: deployer.address,
    contracts: {
      boingToken: tokenAddress,
      treasury: treasuryAddress,
      governor: governorAddress,
    },
  }, null, 2));

  console.log('\nRegister in backend:');
  console.log(`PUT /api/governance/contracts { chainId: ${chainId}, contractName: "boingToken", address: "${tokenAddress}" }`);
  console.log(`PUT /api/governance/contracts { chainId: ${chainId}, contractName: "treasury", address: "${treasuryAddress}" }`);
  console.log(`PUT /api/governance/contracts { chainId: ${chainId}, contractName: "governor", address: "${governorAddress}" }`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

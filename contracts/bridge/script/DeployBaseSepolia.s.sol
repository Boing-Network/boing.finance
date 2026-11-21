// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {BridgedBoing} from "../src/BridgedBoing.sol";
import {BoingBridgeVault} from "../src/BoingBridgeVault.sol";

/// @notice Deploy BridgedBoing + BoingBridgeVault on Base Sepolia and optionally seed validators.
/// @dev
///   export PRIVATE_KEY=0x...
///   export FEE_RECIPIENT=0x...
///   export BOING_CHAIN_ID=6913
///   # optional comma-free env; set validators after deploy via cast
///   forge script script/DeployBaseSepolia.s.sol:DeployBaseSepolia --rpc-url $BASE_SEPOLIA_RPC --broadcast
contract DeployBaseSepolia is Script {
    uint64 constant BASE_SEPOLIA = 84532;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address feeRecipient = vm.envAddress("FEE_RECIPIENT");
        uint64 boingChainId = uint64(vm.envOr("BOING_CHAIN_ID", uint256(6913)));
        uint16 feeBps = uint16(vm.envOr("BRIDGE_FEE_BPS", uint256(50)));

        vm.startBroadcast(pk);

        BridgedBoing token = new BridgedBoing();
        BoingBridgeVault vault =
            new BoingBridgeVault(token, feeRecipient, boingChainId, BASE_SEPOLIA, feeBps);
        token.setVault(address(vault));

        // Optional: VALIDATOR_SIGNERS / VALIDATOR_STAKES as equal-length lists are set by ops
        // after deploy (see scripts/bridge/deploy-base-sepolia.sh).

        vm.stopBroadcast();

        console2.log("BridgedBoing", address(token));
        console2.log("BoingBridgeVault", address(vault));
        console2.log("feeRecipient", feeRecipient);
        console2.log("feeBps", feeBps);
        console2.log("boingChainId", boingChainId);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {BridgedBoing} from "../src/BridgedBoing.sol";
import {BoingBridgeVault} from "../src/BoingBridgeVault.sol";

contract BoingBridgeVaultTest is Test {
    BridgedBoing internal token;
    BoingBridgeVault internal vault;

    address internal fee = address(0xFEE);
    address internal alice = address(0xA11CE);

    uint64 internal constant BOING_TESTNET = 6913;
    uint64 internal constant BASE_SEPOLIA = 84532;

    uint256 internal v1Sk = 0xA11;
    uint256 internal v2Sk = 0xB22;
    uint256 internal v3Sk = 0xC33;
    address internal v1;
    address internal v2;
    address internal v3;

    function setUp() public {
        v1 = vm.addr(v1Sk);
        v2 = vm.addr(v2Sk);
        v3 = vm.addr(v3Sk);

        token = new BridgedBoing();
        vault = new BoingBridgeVault(token, fee, BOING_TESTNET, BASE_SEPOLIA, 50);
        token.setVault(address(vault));

        address[] memory signers = new address[](3);
        signers[0] = v1;
        signers[1] = v2;
        signers[2] = v3;
        uint128[] memory stakes = new uint128[](3);
        stakes[0] = 100;
        stakes[1] = 100;
        stakes[2] = 100;
        vault.replaceValidatorSet(signers, stakes);
    }

    function _signMint(
        uint256 sk,
        bytes32 sourceTxHash,
        uint64 lockNonce,
        address recipient,
        uint256 amount
    ) internal view returns (bytes memory) {
        bytes32 digest =
            vault.mintDigest(BOING_TESTNET, sourceTxHash, lockNonce, recipient, amount, BASE_SEPOLIA);
        bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", digest));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sk, ethHash);
        return abi.encodePacked(r, s, v);
    }

    function test_mint_with_two_of_three_stake() public {
        bytes32 src = bytes32(uint256(0x1234));
        uint256 amount = 1_000 ether;
        bytes memory s1 = _signMint(v1Sk, src, 1, alice, amount);
        bytes memory s2 = _signMint(v2Sk, src, 1, alice, amount);
        bytes memory sigs = bytes.concat(s1, s2);

        vault.mintWithAttestation(BOING_TESTNET, src, 1, alice, amount, sigs);

        uint256 feeAmt = (amount * 50) / 10_000;
        assertEq(token.balanceOf(alice), amount - feeAmt);
        assertEq(token.balanceOf(fee), feeAmt);
    }

    function test_mint_rejects_one_of_three() public {
        bytes32 src = bytes32(uint256(0x99));
        bytes memory s1 = _signMint(v1Sk, src, 2, alice, 100 ether);
        vm.expectRevert(BoingBridgeVault.QuorumNotMet.selector);
        vault.mintWithAttestation(BOING_TESTNET, src, 2, alice, 100 ether, s1);
    }

    function test_mint_replay_rejected() public {
        bytes32 src = bytes32(uint256(0x55));
        uint256 amount = 10 ether;
        bytes memory sigs = bytes.concat(
            _signMint(v1Sk, src, 3, alice, amount), _signMint(v2Sk, src, 3, alice, amount)
        );
        vault.mintWithAttestation(BOING_TESTNET, src, 3, alice, amount, sigs);
        vm.expectRevert(BoingBridgeVault.AlreadyConsumed.selector);
        vault.mintWithAttestation(BOING_TESTNET, src, 3, alice, amount, sigs);
    }

    function test_burn_to_boing_emits_and_fees() public {
        // Seed alice with bBOING via mint
        bytes32 src = bytes32(uint256(0x77));
        uint256 amount = 200 ether;
        bytes memory sigs = bytes.concat(
            _signMint(v1Sk, src, 4, alice, amount), _signMint(v3Sk, src, 4, alice, amount)
        );
        vault.mintWithAttestation(BOING_TESTNET, src, 4, alice, amount, sigs);

        uint256 aliceBal = token.balanceOf(alice);
        bytes32 boingRecipient = bytes32(uint256(0xABCD));
        vm.prank(alice);
        vault.burnToBoing(aliceBal, boingRecipient);

        assertEq(token.balanceOf(alice), 0);
        // fee from burn re-minted to fee recipient (plus earlier mint fee)
        assertGt(token.balanceOf(fee), 0);
    }

    function test_fee_bps_default_half_percent() public {
        assertEq(vault.feeBps(), 50);
    }
}

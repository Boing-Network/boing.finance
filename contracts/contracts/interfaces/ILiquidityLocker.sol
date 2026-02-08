// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILiquidityLocker {
    function lockLiquidity(
        address pair,
        address user,
        uint256 amount,
        uint256 lockDuration,
        string calldata description,
        uint256 lockFee
    ) external;

    function unlockLiquidity(address pair, uint256 lockIndex, address user) external;
}

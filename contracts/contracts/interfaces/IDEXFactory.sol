// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDEXFactory {
    event PairCreated(address indexed token0, address indexed token1, address pair, uint256 allPairsLength);
    event FeeUpdated(uint256 newFeeRate);
    event BridgeAddressUpdated(uint256 chainId, address bridgeAddress);

    function feeRate() external view returns (uint256);
    function feeDenominator() external view returns (uint256);
    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function allPairs(uint256) external view returns (address pair);
    function allPairsLength() external view returns (uint256);
    function bridgeAddresses(uint256 chainId) external view returns (address);

    function createPair(address tokenA, address tokenB) external returns (address pair);
    function setFeeRate(uint256 _feeRate) external;
    function setBridgeAddress(uint256 chainId, address bridgeAddress) external;
    function pause() external;
    function unpause() external;
    function getPairAddress(address tokenA, address tokenB) external view returns (address);
    function pairExists(address tokenA, address tokenB) external view returns (bool);
} 
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Treasury
 * @dev Holds ETH and ERC20 tokens. Only owner (Timelock or multisig) can withdraw.
 * Register as "treasury" in contract_registry.
 */
contract Treasury is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    event Received(address indexed from, uint256 amount);
    event WithdrawnETH(address indexed to, uint256 amount);
    event WithdrawnToken(address indexed token, address indexed to, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function withdrawETH(address payable to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "Treasury: zero address");
        require(address(this).balance >= amount, "Treasury: insufficient balance");
        (bool ok,) = to.call{value: amount}("");
        require(ok, "Treasury: ETH transfer failed");
        emit WithdrawnETH(to, amount);
    }

    function withdrawToken(address token, address to, uint256 amount) external onlyOwner nonReentrant {
        require(token != address(0) && to != address(0), "Treasury: zero address");
        IERC20(token).safeTransfer(to, amount);
        emit WithdrawnToken(token, to, amount);
    }

    function balanceETH() external view returns (uint256) {
        return address(this).balance;
    }

    function balanceToken(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}

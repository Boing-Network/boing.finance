// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WETH
 * @dev Wrapped ETH token for DEX trading
 * Allows users to wrap ETH to WETH and unwrap WETH back to ETH
 */
contract WETH is ERC20, Ownable {
    // Events
    event Deposit(address indexed dst, uint256 wad);
    event Withdrawal(address indexed src, uint256 wad);

    constructor() ERC20("Wrapped Ether", "WETH") Ownable(msg.sender) {}

    /**
     * @dev Deposit ETH and mint WETH
     */
    function deposit() external payable {
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @dev Withdraw ETH by burning WETH
     */
    function withdraw(uint256 wad) external {
        require(balanceOf(msg.sender) >= wad, "WETH: INSUFFICIENT_BALANCE");
        _burn(msg.sender, wad);
        
        (bool success,) = msg.sender.call{value: wad}("");
        require(success, "WETH: ETH_TRANSFER_FAILED");
        
        emit Withdrawal(msg.sender, wad);
    }

    /**
     * @dev Get ETH balance of this contract
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Emergency function to recover stuck tokens (owner only)
     */
    function emergencyWithdraw(address token, address to, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            // Withdraw ETH
            (bool success,) = to.call{value: amount}("");
            require(success, "WETH: ETH_TRANSFER_FAILED");
        } else {
            // Withdraw ERC20 tokens
            IERC20(token).transfer(to, amount);
        }
    }
} 
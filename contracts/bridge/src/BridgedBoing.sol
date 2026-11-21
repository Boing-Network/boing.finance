// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title BridgedBoing — Base-side representation of native BOING (lock/mint, burn/release).
/// @notice Only the vault may mint or burn. No admin mint after vault is set.
contract BridgedBoing {
    string public constant name = "Bridged BOING";
    string public constant symbol = "bBOING";
    uint8 public constant decimals = 18;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public vault;
    address public immutable deployer;

    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);
    event VaultSet(address indexed vault);

    error OnlyVault();
    error OnlyDeployer();
    error VaultAlreadySet();
    error ZeroAddress();
    error InsufficientBalance();
    error InsufficientAllowance();

    constructor() {
        deployer = msg.sender;
    }

    function setVault(address vault_) external {
        if (msg.sender != deployer) revert OnlyDeployer();
        if (vault != address(0)) revert VaultAlreadySet();
        if (vault_ == address(0)) revert ZeroAddress();
        vault = vault_;
        emit VaultSet(vault_);
    }

    function mint(address to, uint256 amount) external {
        if (msg.sender != vault) revert OnlyVault();
        if (to == address(0)) revert ZeroAddress();
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function burn(address from, uint256 amount) external {
        if (msg.sender != vault) revert OnlyVault();
        uint256 bal = balanceOf[from];
        if (bal < amount) revert InsufficientBalance();
        unchecked {
            balanceOf[from] = bal - amount;
            totalSupply -= amount;
        }
        emit Transfer(from, address(0), amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            if (allowed < amount) revert InsufficientAllowance();
            unchecked {
                allowance[from][msg.sender] = allowed - amount;
            }
        }
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        if (to == address(0)) revert ZeroAddress();
        uint256 bal = balanceOf[from];
        if (bal < amount) revert InsufficientBalance();
        unchecked {
            balanceOf[from] = bal - amount;
            balanceOf[to] += amount;
        }
        emit Transfer(from, to, amount);
    }
}

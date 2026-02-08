// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IDEXPair.sol";
import "./interfaces/IDEXFactory.sol";

/**
 * @title DEXPair
 * @dev Pair contract for trading two tokens using AMM model
 * Implements constant product formula: x * y = k
 * Supports per-pool security features
 */
contract DEXPair is IDEXPair, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    error Forbidden();
    error AlreadyInitialized();
    error Overflow();
    error InsufficientInputAmount();
    error InsufficientReserves();
    error InsufficientLiquidityMinted();
    error LiquidityTooLarge();
    error InsufficientLiquidityBurned();
    error InsufficientOutputAmount();
    error InsufficientLiquidity();
    error InvalidTo();
    error K();
    error Expired();
    error InvalidSignature();
    
    // Token addresses
    address public override token0;
    address public override token1;
    
    // Reserves
    uint112 private reserve0;
    uint112 private reserve1;
    uint32 private blockTimestampLast;
    
    // Factory reference
    address public override factory;
    
    // Price oracle
    uint256 public override price0CumulativeLast;
    uint256 public override price1CumulativeLast;
    
    // Liquidity tracking
    mapping(address => uint256) public override balanceOf;
    uint256 public override totalSupply;
    
    // Security configuration
    IDEXFactory.PoolSecurityConfig public securityConfig;
    
    // Timelock variables
    mapping(bytes32 => uint256) public timelockProposals;
    mapping(bytes32 => bool) public executedProposals;
    
    // Events
    event SecurityConfigUpdated(IDEXFactory.PoolSecurityConfig config);
    event TimelockProposalCreated(bytes32 indexed proposalId, address indexed proposer, uint256 executionTime);
    event TimelockProposalExecuted(bytes32 indexed proposalId);
    
    modifier onlyFactory() {
        if (msg.sender != factory) revert Forbidden();
        _;
    }

    function pause() external onlyFactory {
        _pause();
    }

    function unpause() external onlyFactory {
        _unpause();
    }
    
    modifier notEmergencyStopped() {
        // Emergency stop is handled at factory level
        _;
    }
    
    constructor() {
        factory = msg.sender;
    }
    
    // Private initializer
    function _initialize(address _token0, address _token1, IDEXFactory.PoolSecurityConfig memory _securityConfig) private {
        if (token0 != address(0)) revert AlreadyInitialized();
        token0 = _token0;
        token1 = _token1;
        securityConfig = _securityConfig;
        emit SecurityConfigUpdated(_securityConfig);
    }

    function initialize(address _token0, address _token1) external override {
        IDEXFactory.PoolSecurityConfig memory defaultConfig = IDEXFactory.PoolSecurityConfig({
            emergencyStop: true
        });
        _initialize(_token0, _token1, defaultConfig);
    }

    function initialize(address _token0, address _token1, IDEXFactory.PoolSecurityConfig calldata _securityConfig) external override onlyFactory {
        _initialize(_token0, _token1, _securityConfig);
    }
    
    /**
     * @dev Get current reserves (internal version)
     */
    function _getReserves() 
        internal 
        view 
        returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast) 
    {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        _blockTimestampLast = blockTimestampLast;
    }

    /**
     * @dev Get current reserves (external version)
     */
    function getReserves() 
        external 
        view 
        override 
        returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast) 
    {
        return _getReserves();
    }
    
    /**
     * @dev Update reserves and price oracle
     */
    function _update(uint256 balance0, uint256 balance1, uint112 _reserve0, uint112 _reserve1) private {
        if (balance0 > type(uint112).max || balance1 > type(uint112).max) revert Overflow();
        uint32 blockTimestamp = uint32(block.timestamp % 2**32);
        uint32 timeElapsed = blockTimestamp - blockTimestampLast;
        if (timeElapsed > 0 && _reserve0 != 0 && _reserve1 != 0) {
            price0CumulativeLast += uint256(UQ112x112.uqdiv(UQ112x112.encode(_reserve1), _reserve0)) * timeElapsed;
            price1CumulativeLast += uint256(UQ112x112.uqdiv(UQ112x112.encode(_reserve0), _reserve1)) * timeElapsed;
        }
        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        blockTimestampLast = blockTimestamp;
        emit Sync(reserve0, reserve1);
    }
    
    /**
     * @dev Add liquidity to the pool
     */
    function mint(address to) 
        external 
        override 
        nonReentrant 
        whenNotPaused 
        notEmergencyStopped
        returns (uint256 liquidity) 
    {
        (uint112 _reserve0, uint112 _reserve1,) = _getReserves();
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        uint256 amount0 = balance0 - _reserve0;
        uint256 amount1 = balance1 - _reserve1;
        
        if (amount0 == 0 || amount1 == 0) revert InsufficientInputAmount();

        uint256 _totalSupply = totalSupply;
        if (_totalSupply == 0) {
            liquidity = sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
            _mint(address(0), MINIMUM_LIQUIDITY);
        } else {
            if (_reserve0 == 0 || _reserve1 == 0) revert InsufficientReserves();
            liquidity = min((amount0 * _totalSupply) / _reserve0, (amount1 * _totalSupply) / _reserve1);
        }
        if (liquidity == 0) revert InsufficientLiquidityMinted();
        if (liquidity > type(uint256).max - totalSupply) revert LiquidityTooLarge();
        
        _mint(to, liquidity);
        _update(balance0, balance1, _reserve0, _reserve1);
    }
    
    /**
     * @dev Remove liquidity from the pool
     */
    function burn(address to) 
        external 
        override 
        nonReentrant 
        whenNotPaused 
        notEmergencyStopped
        returns (uint256 amount0, uint256 amount1) 
    {
        (uint112 _reserve0, uint112 _reserve1,) = _getReserves();
        address _token0 = token0;
        address _token1 = token1;
        uint256 balance0 = IERC20(_token0).balanceOf(address(this));
        uint256 balance1 = IERC20(_token1).balanceOf(address(this));
        uint256 liquidity = balanceOf[address(this)];
        
        uint256 _totalSupply = totalSupply;
        amount0 = (liquidity * balance0) / _totalSupply;
        amount1 = (liquidity * balance1) / _totalSupply;
        if (amount0 == 0 || amount1 == 0) revert InsufficientLiquidityBurned();
        
        _burn(address(this), liquidity);
        IERC20(_token0).safeTransfer(to, amount0);
        IERC20(_token1).safeTransfer(to, amount1);
        balance0 = IERC20(_token0).balanceOf(address(this));
        balance1 = IERC20(_token1).balanceOf(address(this));
        
        _update(balance0, balance1, _reserve0, _reserve1);
    }
    
    /**
     * @dev Swap tokens
     */
    function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data) 
        external 
        override 
        nonReentrant 
        whenNotPaused 
        notEmergencyStopped
    {
        if (amount0Out == 0 && amount1Out == 0) revert InsufficientOutputAmount();
        (uint112 _reserve0, uint112 _reserve1,) = _getReserves();
        if (amount0Out >= _reserve0 || amount1Out >= _reserve1) revert InsufficientLiquidity();
        
        uint256 balance0;
        uint256 balance1;
        {
            address _token0 = token0;
            address _token1 = token1;
            if (to == _token0 || to == _token1) revert InvalidTo();
            if (amount0Out > 0) IERC20(_token0).safeTransfer(to, amount0Out);
            if (amount1Out > 0) IERC20(_token1).safeTransfer(to, amount1Out);
            if (data.length > 0) IDEXCallee(to).dexCall(msg.sender, amount0Out, amount1Out, data);
            balance0 = IERC20(_token0).balanceOf(address(this));
            balance1 = IERC20(_token1).balanceOf(address(this));
        }
        
        uint256 amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
        uint256 amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;
        if (amount0In == 0 && amount1In == 0) revert InsufficientInputAmount();
        {
            uint256 balance0Adjusted = balance0 * 1000 - amount0In * 3;
            uint256 balance1Adjusted = balance1 * 1000 - amount1In * 3;
            if (balance0Adjusted * balance1Adjusted < uint256(_reserve0) * uint256(_reserve1) * (1000**2)) revert K();
        }
        
        _update(balance0, balance1, _reserve0, _reserve1);
    }
    
    /**
     * @dev Force reserves to match balances
     */
    function sync() external override nonReentrant {
        _update(IERC20(token0).balanceOf(address(this)), IERC20(token1).balanceOf(address(this)), reserve0, reserve1);
    }
    
    // ERC20 functions
    function _mint(address to, uint256 value) internal {
        if (totalSupply + value < totalSupply || balanceOf[to] + value < balanceOf[to]) revert Overflow();
        totalSupply += value;
        balanceOf[to] += value;
    }
    
    function _burn(address from, uint256 value) internal {
        balanceOf[from] -= value;
        totalSupply -= value;
    }
    
    // Utility functions
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
    
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
    
    // Constants
    uint256 public constant override MINIMUM_LIQUIDITY = 10**3;
    
    // ERC20 state variables
    mapping(address => mapping(address => uint256)) public override allowance;
    
    // ERC20 functions
    function approve(address spender, uint256 value) external override returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    
    function transfer(address to, uint256 value) external override returns (bool) {
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 value) external override returns (bool) {
        if (allowance[from][msg.sender] != type(uint256).max) {
            allowance[from][msg.sender] -= value;
        }
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }

    // Missing ERC20 functions
    function name() external pure override returns (string memory) {
        return "DEX LP Token";
    }
    
    function symbol() external pure override returns (string memory) {
        return "LP";
    }
    
    function decimals() external pure override returns (uint8) {
        return 18;
    }

    // EIP-2612 permit functions
    bytes32 public constant override PERMIT_TYPEHASH = keccak256(
        "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
    );
    
    mapping(address => uint256) public override nonces;
    
    /**
     * @dev Get domain separator (internal version)
     */
    function _DOMAIN_SEPARATOR() internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("DEX LP Token")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    /**
     * @dev Get domain separator (external version)
     */
    function DOMAIN_SEPARATOR() external view override returns (bytes32) {
        return _DOMAIN_SEPARATOR();
    }
    
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override {
        if (deadline < block.timestamp) revert Expired();
        bytes32 structHash = keccak256(
            abi.encode(PERMIT_TYPEHASH, owner, spender, value, nonces[owner]++, deadline)
        );
        bytes32 hash = keccak256(
            abi.encodePacked("\x19\x01", _DOMAIN_SEPARATOR(), structHash)
        );
        address signer = ecrecover(hash, v, r, s);
        if (signer != owner) revert InvalidSignature();
        allowance[owner][spender] = value;
        emit Approval(owner, spender, value);
    }

    // Additional required functions
    function skim(address to) external override {
        address _token0 = token0;
        address _token1 = token1;
        IERC20(_token0).safeTransfer(to, IERC20(_token0).balanceOf(address(this)) - reserve0);
        IERC20(_token1).safeTransfer(to, IERC20(_token1).balanceOf(address(this)) - reserve1);
    }

    function kLast() external view override returns (uint256) {
        return uint256(reserve0) * uint256(reserve1);
    }
}

// Library for fixed-point arithmetic
library UQ112x112 {
    uint224 constant Q112 = 2**112;
    
    function encode(uint112 y) internal pure returns (uint224 z) {
        z = uint224(y) * Q112;
    }
    
    function uqdiv(uint224 x, uint112 y) internal pure returns (uint224 z) {
        z = x / uint224(y);
    }
} 
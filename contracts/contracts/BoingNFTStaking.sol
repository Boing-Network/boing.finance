// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BoingNFTStaking
 * @dev Stake ERC721 NFTs to earn BOING rewards. Rewards accrue per second per staked NFT.
 * Register as "nftStaking" in contract_registry.
 */
contract BoingNFTStaking is ERC721Holder, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC721 public immutable nftToken;
    IERC20 public immutable rewardToken;

    uint256 public rewardRatePerToken; // reward per second per staked NFT (18 decimals)
    uint256 public rewardPerTokenStored;
    uint256 public lastUpdateTime;
    uint256 public totalStaked;

    mapping(address => uint256) public stakedBalance;
    mapping(uint256 => address) public stakerOfTokenId;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    event Staked(address indexed user, uint256[] tokenIds);
    event Unstaked(address indexed user, uint256[] tokenIds);
    event RewardClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    event RewardTokensDeposited(uint256 amount);

    constructor(
        address _nftToken,
        address _rewardToken,
        address initialOwner
    ) Ownable(initialOwner) {
        nftToken = IERC721(_nftToken);
        rewardToken = IERC20(_rewardToken);
    }

    function stake(uint256[] calldata tokenIds) external nonReentrant {
        _updateReward(msg.sender);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(stakerOfTokenId[tokenIds[i]] == address(0), "BoingNFTStaking: already staked");
            nftToken.safeTransferFrom(msg.sender, address(this), tokenIds[i]);
            stakerOfTokenId[tokenIds[i]] = msg.sender;
        }
        stakedBalance[msg.sender] += tokenIds.length;
        totalStaked += tokenIds.length;
        emit Staked(msg.sender, tokenIds);
    }

    function unstake(uint256[] calldata tokenIds) external nonReentrant {
        _updateReward(msg.sender);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(stakerOfTokenId[tokenIds[i]] == msg.sender, "BoingNFTStaking: not your NFT");
            delete stakerOfTokenId[tokenIds[i]];
            nftToken.transferFrom(address(this), msg.sender, tokenIds[i]);
        }
        stakedBalance[msg.sender] -= tokenIds.length;
        totalStaked -= tokenIds.length;
        emit Unstaked(msg.sender, tokenIds);
    }

    function claimReward() external nonReentrant {
        _updateReward(msg.sender);
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.safeTransfer(msg.sender, reward);
            emit RewardClaimed(msg.sender, reward);
        }
    }

    function _updateReward(address account) internal {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        if (account != address(0)) {
            rewards[account] = _earned(account, rewardPerTokenStored);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) return rewardPerTokenStored;
        return rewardPerTokenStored + ((block.timestamp - lastUpdateTime) * rewardRatePerToken * 1e18) / totalStaked;
    }

    function _earned(address account, uint256 currentRewardPerToken) internal view returns (uint256) {
        return (stakedBalance[account] * (currentRewardPerToken - userRewardPerTokenPaid[account])) / 1e18 + rewards[account];
    }

    function earned(address account) public view returns (uint256) {
        return _earned(account, rewardPerToken());
    }

    function setRewardRate(uint256 _ratePerToken) external onlyOwner {
        _updateReward(address(0));
        uint256 old = rewardRatePerToken;
        rewardRatePerToken = _ratePerToken;
        emit RewardRateUpdated(old, _ratePerToken);
    }

    function depositRewardTokens(uint256 amount) external onlyOwner {
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
        emit RewardTokensDeposited(amount);
    }

    function pendingReward(address account) external view returns (uint256) {
        return earned(account);
    }
}

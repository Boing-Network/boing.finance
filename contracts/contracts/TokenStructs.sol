// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library TokenStructs {
    struct TokenMetadata {
        string logo;
        string website;
        string description;
        string twitter;
        string telegram;
        string discord;
        string github;
        string medium;
        string reddit;
    }

    struct TokenConfig {
        bool enableBlacklist;
        bool enableAntiBot;
        bool enableAntiWhale;
        bool enablePause;
        bool enableTimelock;
        uint256 maxTxAmount;
        uint256 maxWalletAmount;
        uint256 cooldownPeriod;
        uint256 timelockDelay;
    }
} 
# Token Deployment Optimization Notes

> **IMPORTANT:** This document describes optimizations and enhancements for **future deployments only**. The TokenFactory and TokenImplementation contracts are **already deployed on mainnet** (Ethereum, Base, Polygon, BSC, Arbitrum, Optimism). **Do not modify** the source code of these contracts in this repository, as that would not affect existing deployments and could cause inconsistency between source and on-chain bytecode.

## Overview

The token-deployment feature (TokenFactory + TokenImplementation + TokenStructs) uses EIP-1167 minimal proxy clones. Mainnet addresses are configured in `frontend/src/config/contracts.js`. This document captures potential optimizations for **future** instances or fork deployments.

---

## TokenFactory Optimizations

### 1. Custom Errors (Gas Savings)

Replace string-based `require` statements with custom errors for smaller bytecode and cheaper reverts:

- `Invalid platform wallet` → `error InvalidPlatformWallet();`
- `Invalid implementation address` → `error InvalidImplementation();`
- `Name cannot be empty` → `error EmptyName();`
- `Symbol cannot be empty` → `error EmptySymbol();`
- `Decimals cannot exceed 18` → `error DecimalsTooHigh();`
- `Initial supply must be greater than 0` → `error ZeroInitialSupply();`
- `Max transaction amount cannot exceed total supply` → `error MaxTxExceedsSupply();`
- `Max wallet amount cannot exceed total supply` → `error MaxWalletExceedsSupply();`
- `Cooldown period cannot exceed 1 hour` → `error CooldownTooLong();`
- `Timelock delay cannot exceed 7 days` → `error TimelockTooLong();`
- `Service fee must be exact amount` → `error WrongServiceFee();`
- `Failed to forward service fee` → `error FeeForwardFailed();`
- Similar for other validation and access-control errors

**Impact:** Significant gas savings on reverts; smaller deployment size.

### 2. SafeERC20 for Transfers

All external token transfers (including `emergencyRecover`) should use `SafeERC20.safeTransfer` and `safeTransferFrom`. The current codebase has been audited for this; ensure any new transfer paths follow the same pattern.

### 3. ETH Forwarding

Instead of low-level `call` for fee forwarding:

```solidity
(bool success, ) = platformWallet.call{value: msg.value}("");
require(success, "...");
```

Consider using OpenZeppelin’s `Address.sendValue` for clearer semantics and consistent revert behavior.

### 4. Clone Initialization

The factory uses `clone.call(abi.encodeWithSelector(...))` for initialization. This is acceptable; ensure the implementation’s `initialize` is non-reentrant and properly validated to avoid edge cases.

### 5. Storage Layout

Avoid changing storage layout in TokenFactory; it is tightly coupled with deployment addresses and integrations.

---

## TokenImplementation Optimizations

### 1. Custom Errors

Replace `require` strings with custom errors across:

- Validation (name, symbol, decimals, supply, config)
- Access control (onlyOwner, authority checks)
- Feature checks (anti-bot, anti-whale, max wallet, timelock)
- Reentrancy and pause guards

### 2. Storage Packing

Review storage variables for packing opportunities (e.g., multiple booleans or small integers in a single slot) to reduce storage costs.

### 3. Redundant Logic

- `determinePlan` and plan-based feature flags may have overlap with `TokenFactory.determinePlan`. Consider a single source of truth or clearer separation.
- Service fee constants are duplicated in both TokenFactory and TokenImplementation; consider a shared config or factory-driven values.

### 4. Initialization Safety

Ensure `initialize` cannot be called twice and that all proxy clones receive correct initialization data. Use an `isInitialized` flag (already present) and enforce it strictly.

### 5. Timelock Implementation

Timelock logic (`_pendingActions`, execute time checks) can be refactored into an internal helper to reduce duplication and simplify audits.

---

## TokenStructs

- TokenStructs is used by both TokenFactory and TokenImplementation. **Do not change** struct layouts or field order; that would break existing integrations and proxy storage.

---

## Deployment Considerations

| Network | TokenFactory | TokenImplementation |
|---------|--------------|---------------------|
| Ethereum | 0x3c656B835dF7A16574d4612C488bE03aAd2193Fc | 0x75c2709245fbe56B6133515C49cD35F31533d5Dc |
| Base | (see frontend config) | (see frontend config) |
| Polygon | (see frontend config) | (see frontend config) |
| BSC | (see frontend config) | (see frontend config) |
| Arbitrum | (see frontend config) | (see frontend config) |
| Optimism | (see frontend config) | (see frontend config) |

For any **new** chain deployment, the optimizations above can be applied before deployment. Existing mainnet instances are immutable and cannot be upgraded.

---

## Summary

- **Custom errors:** Major gas and size improvement; apply in future deployments.
- **SafeERC20:** Already addressed in audit; maintain for any new code paths.
- **Storage layout:** Do not change for TokenFactory, TokenImplementation, or TokenStructs in existing deployments.
- **Logic refactors:** Plan upgrades for new deployments only; document changes clearly.

# BOING token economics

> 👋 **Everyday users:** BOING is the native token of **Boing Network** (the Layer 1). Boing Finance is an app that uses it; it does not issue it. Nothing here is financial advice or a promise of returns.
> 🛠️ **Developers:** the economics live in the protocol and its code, not in this repo. Start with the links below.
> 🛰️ **Operators:** do not treat any ERC-20 named "BOING" or "boing.finance" as the Boing Network L1 token.

> **Status:** public testnet. Mainnet is not live. Independent audits are not complete.

## What this page used to say

An earlier version of this page described a "boing.finance" token on Ethereum mainnet, a public sale with a raise target, vesting tables and a roadmap with completed items. None of that is verified, so it has been removed. Nothing on this page should be read as a token sale, an allocation, or a deployment announcement.

## Where BOING economics are documented

**BOING** is the native token of Boing Network L1. Supply, emission, fees and incentives are defined by the protocol and documented in the [boing.network](https://github.com/Boing-Network/boing.network) repo:

- [BOING Tokenomics: Sustainable Value Design](https://github.com/Boing-Network/boing.network/blob/main/docs/BOING-BLOCKCHAIN-DESIGN-PLAN.md#boing-tokenomics--sustainable-value-design): the design narrative (supply, emission schedule, fee economics). It is a design document, so check the code and the other docs below for what is implemented.
- [`crates/boing-tokenomics`](https://github.com/Boing-Network/boing.network/tree/main/crates/boing-tokenomics): the protocol constants (maximum supply, block time, emission, fee policy).
- [NATIVE-DENOMINATION.md](https://github.com/Boing-Network/boing.network/blob/main/docs/NATIVE-DENOMINATION.md): 18-decimal base units, fees and emission.

## What Boing Finance is

Boing Finance is a cross-chain interface that can show and route BOING on Boing L1 through [Boing Express](https://boing.express). It does not create, sell or govern the L1 token. See [native-dex.md](./native-dex.md) for what the app does on Boing L1.

## EVM tokens named "BOING"

[contract-registry.md](./contract-registry.md) lists tokens deployed through this app's EVM `TokenFactory`. Anyone can deploy a token with any name or symbol, so an ERC-20 called "BOING" is not the Boing Network L1 token. The app's own governance and staking contracts are **not deployed** (see [contracts.md](./contracts.md)).

#!/usr/bin/env bash
# Deploy BridgedBoing + BoingBridgeVault to Base Sepolia (84532).
# Requires: forge, funded PRIVATE_KEY, BASE_SEPOLIA_RPC, FEE_RECIPIENT.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../contracts/bridge" && pwd)"
cd "$ROOT"

: "${PRIVATE_KEY:?set PRIVATE_KEY}"
: "${FEE_RECIPIENT:?set FEE_RECIPIENT (EVM fee wallet)}"
: "${BASE_SEPOLIA_RPC:?set BASE_SEPOLIA_RPC}"

export BOING_CHAIN_ID="${BOING_CHAIN_ID:-6913}"
export BRIDGE_FEE_BPS="${BRIDGE_FEE_BPS:-50}"

echo "Deploying to Base Sepolia via $BASE_SEPOLIA_RPC …"
forge script script/DeployBaseSepolia.s.sol:DeployBaseSepolia \
  --rpc-url "$BASE_SEPOLIA_RPC" \
  --broadcast \
  -vv

echo
echo "Next:"
echo "  1) Record BridgedBoing + BoingBridgeVault addresses from the forge log."
echo "  2) cast send <VAULT> 'replaceValidatorSet(address[],uint128[])' … with attestor secp256k1 keys + stake."
echo "  3) Set Finance env REACT_APP_BOING_BASE_BRIDGE_VAULT / REACT_APP_BRIDGED_BOING_TOKEN (testnet)."
echo "  4) On Boing nodes: BOING_BRIDGE_ACTIVATION_HEIGHT=<H> (all nodes agree) and restart."
echo "  5) Run scripts/bridge/attest-relayer.mjs with validator keys."

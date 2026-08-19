#!/usr/bin/env bash
# Build the SBF .so inside Docker (host does not need Solana CLI).
# backpackapp/build:v0.31.0 = cargo-build-sbf rustc 1.79. Cargo.lock pins
# crates so cargo 1.79 never has to parse edition2024 manifests.
set -euo pipefail
# Git Bash on Windows rewrites /workspace → a Windows path unless this is set.
export MSYS_NO_PATHCONV=1
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IMAGE="${ANCHOR_BUILD_IMAGE:-backpackapp/build:v0.31.0}"
mkdir -p "${ROOT}/target/deploy"
cp "${ROOT}/keys/boing_token_hook-keypair.json" "${ROOT}/target/deploy/boing_token_hook-keypair.json"
docker run --rm \
  -v "${ROOT}:/workspace" \
  -w /workspace \
  "${IMAGE}" \
  bash -lc 'cargo-build-sbf --sbf-out-dir /workspace/target/deploy -- --locked'
node "${ROOT}/scripts/estimate-deploy-cost.mjs"

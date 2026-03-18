#!/usr/bin/env bash
set -euo pipefail

# MeroPasal Desktop Build Script
# Prerequisites: Rust toolchain, Node.js, bun, system dependencies for Tauri
# See: https://v2.tauri.app/start/prerequisites/

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "==> Building MeroPasal web app..."
cd "$ROOT_DIR"
bun run --filter @meropasal/web build

echo "==> Building Tauri desktop app..."
cd "$SCRIPT_DIR"

# Install JS dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "==> Installing dependencies..."
  bun install
fi

# Build for current platform
bunx tauri build

echo "==> Build complete!"
echo "Binaries available in: src-tauri/target/release/bundle/"

# Cross-compilation notes:
# - Windows: requires MSVC build tools or cross-compilation setup
# - macOS: build natively on macOS (universal binary with --target universal-apple-darwin)
# - Linux: build natively or use Docker (AppImage, deb, rpm)
#
# For CI/CD cross-platform builds, see .github/workflows/build-apps.yml

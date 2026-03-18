#!/usr/bin/env bash
set -euo pipefail

# MeroPasal Desktop Build Script
# Prerequisites: Rust toolchain, Node.js, system dependencies for Tauri
# See: https://v2.tauri.app/start/prerequisites/

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "==> Building MeroPasal web app..."
cd "$ROOT_DIR/apps/web"
npm run build 2>/dev/null || pnpm build 2>/dev/null || echo "Web build skipped (run from monorepo root with 'turbo build')"

echo "==> Building Tauri desktop app..."
cd "$SCRIPT_DIR"

# Install JS dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "==> Installing dependencies..."
  npm install 2>/dev/null || pnpm install
fi

# Build for current platform
npx tauri build

echo "==> Build complete!"
echo "Binaries available in: src-tauri/target/release/bundle/"

# Cross-compilation notes:
# - Windows: requires MSVC build tools or cross-compilation setup
# - macOS: build natively on macOS (universal binary with --target universal-apple-darwin)
# - Linux: build natively or use Docker (AppImage, deb, rpm)
#
# For CI/CD cross-platform builds, see .github/workflows/build-apps.yml

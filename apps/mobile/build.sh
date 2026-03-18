#!/usr/bin/env bash
set -euo pipefail

# MeroPasal Mobile Build Script
# Prerequisites: Node.js, bun, Android SDK, Java 17+
# See: https://capacitorjs.com/docs/getting-started/environment-setup

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "==> Building MeroPasal web app..."
cd "$ROOT_DIR"
bun run --filter @meropasal/web build

echo "==> Preparing mobile app..."
cd "$SCRIPT_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "==> Installing dependencies..."
  bun install
fi

# Add Android platform if not present
if [ ! -d "android" ]; then
  echo "==> Adding Android platform..."
  bunx cap add android
fi

# Sync web assets to native project
echo "==> Syncing web assets..."
bunx cap sync android

# Build debug APK
echo "==> Building Android APK..."
cd android
./gradlew assembleDebug

APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
  echo "==> Build complete!"
  echo "APK available at: android/$APK_PATH"
else
  echo "==> Build may have failed. Check gradle output above."
fi

# For release builds:
# ./gradlew assembleRelease
# (requires signing config in android/app/build.gradle)

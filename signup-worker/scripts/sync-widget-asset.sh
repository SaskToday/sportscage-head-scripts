#!/usr/bin/env bash
# Copy the repo-root inject script into Worker static assets for CDN hosting.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEST="$(cd "$(dirname "$0")/.." && pwd)/public"
mkdir -p "$DEST"
cp "$ROOT/sasktoday-newsletter-inject.js" "$DEST/sasktoday-newsletter-inject.js"
echo "Synced widget → signup-worker/public/sasktoday-newsletter-inject.js"

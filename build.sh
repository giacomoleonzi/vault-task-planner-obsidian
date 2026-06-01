#!/bin/bash
set -e

PLUGIN_DIR="$(cd "$(dirname "$0")" && pwd)"
IMAGE="vault-task-planner-builder"

echo "→ Building Docker image..."
docker build -t "$IMAGE" "$PLUGIN_DIR"

echo "→ Extracting build artifacts..."
# Copy main.js out of the container
CONTAINER=$(docker create "$IMAGE")
docker cp "$CONTAINER:/app/main.js" "$PLUGIN_DIR/main.js"
docker rm "$CONTAINER"

echo "✓ Build complete: main.js"
echo ""
echo "To install the plugin, copy these files into your vault's .obsidian/plugins/vault-task-planner/ folder:"
echo "  main.js"
echo "  manifest.json"
echo "  styles.css"

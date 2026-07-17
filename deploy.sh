#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ST_EXT_DIR="/home/eric/SillyTavern-Launcher/SillyTavern/public/scripts/extensions/third-party/relational-lens"

echo "=== Building Relational Lens ==="
cd "$SCRIPT_DIR"
npm run build

echo ""
echo "=== Deploying to $ST_EXT_DIR ==="
mkdir -p "$ST_EXT_DIR/dist"

# Remove old source files from deployment (keep deployment clean)
rm -rf "$ST_EXT_DIR/src" "$ST_EXT_DIR/tests" "$ST_EXT_DIR/templates" "$ST_EXT_DIR/node_modules"
rm -f "$ST_EXT_DIR/.editorconfig" "$ST_EXT_DIR/.gitignore" "$ST_EXT_DIR/.prettierrc.json"
rm -f "$ST_EXT_DIR/jest.config.cjs" "$ST_EXT_DIR/tsconfig.json" "$ST_EXT_DIR/webpack.config.cjs"
rm -f "$ST_EXT_DIR/package.json" "$ST_EXT_DIR/package-lock.json"
rm -f "$ST_EXT_DIR/README.md" "$ST_EXT_DIR/LICENSE"
rm -f "$ST_EXT_DIR/Relational_Lens_Design_Document.md" "$ST_EXT_DIR/Relational_Lens_Design_Document.docx"

# Copy build output
cp -v dist/index.js      "$ST_EXT_DIR/dist/index.js"
cp -v dist/index.js.map  "$ST_EXT_DIR/dist/index.js.map" 2>/dev/null || true
cp -v dist/style.css     "$ST_EXT_DIR/dist/style.css"
cp -v dist/settings.html "$ST_EXT_DIR/dist/settings.html"
cp -v dist/debug-inspector.html "$ST_EXT_DIR/dist/debug-inspector.html"

# Copy manifest and type declarations
cp -v manifest.json "$ST_EXT_DIR/manifest.json"
cp -v globals.d.ts  "$ST_EXT_DIR/globals.d.ts"

echo ""
echo "=== Deployed files ==="
ls -la "$ST_EXT_DIR"
echo ""
echo "=== dist/ ==="
ls -la "$ST_EXT_DIR/dist"
echo ""
echo "Reload SillyTavern to pick up changes."

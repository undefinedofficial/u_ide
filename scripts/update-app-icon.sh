#!/bin/bash

# Script to update the A-Coder app icon using a-coder-transparent-512.png
# This ensures the app icon matches the README logo

set -e

SOURCE_IMAGE="void_icons/a-coder.png"
ICONSET_DIR="a-coder.iconset"
ICNS_FILE="a-coder.icns"
AC_ICNS_FILE="A-Coder.icns"
DARWIN_TARGET="resources/darwin/code.icns"
LINUX_TARGET="resources/linux/code.png"
WIN32_ICO_TARGET="resources/win32/code.ico"
WIN32_PNG_150="resources/win32/code_150x150.png"
WIN32_PNG_70="resources/win32/code_70x70.png"
WIN32_LOGO_CUBE="resources/win32/logo_cube_noshadow.png"
WIN32_INNO_BMP="resources/win32/inno-void.bmp"
VOID_CUBE_NOSHADOW="src/vs/workbench/browser/parts/editor/media/void_cube_noshadow.png"
VOID_ICON_SM="src/vs/workbench/browser/media/void-icon-sm.png"

echo "🎨 Updating A-Coder app icons for all platforms..."

# Check if source image exists
if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "❌ Error: $SOURCE_IMAGE not found"
    exit 1
fi

# 1. Update macOS (.icns)
echo "🍎 Generating macOS icons..."
if [ -d "$ICONSET_DIR" ]; then
    rm -rf "$ICONSET_DIR"
fi
mkdir "$ICONSET_DIR"

sips -z 16 16     "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_16x16.png" > /dev/null 2>&1
sips -z 32 32     "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_16x16@2x.png" > /dev/null 2>&1
sips -z 32 32     "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_32x32.png" > /dev/null 2>&1
sips -z 64 64     "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_32x32@2x.png" > /dev/null 2>&1
sips -z 128 128   "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_128x128.png" > /dev/null 2>&1
sips -z 256 256   "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_128x128@2x.png" > /dev/null 2>&1
sips -z 256 256   "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_256x256.png" > /dev/null 2>&1
sips -z 512 512   "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_256x256@2x.png" > /dev/null 2>&1
sips -z 512 512   "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_512x512.png" > /dev/null 2>&1
sips -z 1024 1024 "$SOURCE_IMAGE" --out "$ICONSET_DIR/icon_512x512@2x.png" > /dev/null 2>&1

iconutil -c icns "$ICONSET_DIR" -o "$ICNS_FILE"
cp -f "$ICNS_FILE" "$DARWIN_TARGET"
# On some systems these might be the same file, use -f and ignore errors if they are identical
cp -f "$ICNS_FILE" "$AC_ICNS_FILE" 2>/dev/null || true

# Update the icon in the development Electron app if it exists
PRODUCT_NAME_LONG=$(node -p "require('./product.json').nameLong")
DEV_APP_ICON=".build/electron/$PRODUCT_NAME_LONG.app/Contents/Resources/$PRODUCT_NAME_LONG.icns"
if [ -f "$DEV_APP_ICON" ]; then
    echo "🍎 Updating icon in development app: $DEV_APP_ICON"
    cp -f "$ICNS_FILE" "$DEV_APP_ICON"
    touch ".build/electron/$PRODUCT_NAME_LONG.app"
fi

rm -rf "$ICONSET_DIR"

# 2. Update Linux (.png)
echo "🐧 Generating Linux icon..."
sips -z 512 512 "$SOURCE_IMAGE" --out "$LINUX_TARGET" > /dev/null 2>&1

# 3. Update Windows (.ico and .png tiles)
echo "🪟 Generating Windows icons..."
# Generate .ico using ImageMagick if available
if command -v convert >/dev/null 2>&1; then
    convert "$SOURCE_IMAGE" -define icon:auto-resize=256,128,64,48,32,16 "$WIN32_ICO_TARGET"
    # Update inno-void.bmp
    convert "$SOURCE_IMAGE" -resize 1200x1200 "$WIN32_INNO_BMP"
else
    echo "⚠️  Warning: ImageMagick (convert) not found. Skipping .ico and .bmp generation."
fi

sips -z 150 150 "$SOURCE_IMAGE" --out "$WIN32_PNG_150" > /dev/null 2>&1
sips -z 70 70   "$SOURCE_IMAGE" --out "$WIN32_PNG_70" > /dev/null 2>&1
sips -z 1024 1024 "$SOURCE_IMAGE" --out "$WIN32_LOGO_CUBE" > /dev/null 2>&1

# 4. Update internal UI icons
echo "🏢 Updating internal UI icons..."
sips -z 1024 1024 "$SOURCE_IMAGE" --out "$VOID_CUBE_NOSHADOW" > /dev/null 2>&1
sips -z 32 32     "$SOURCE_IMAGE" --out "$VOID_ICON_SM" > /dev/null 2>&1

# Update all occurrences in output directories to avoid stale cache
echo "🧹 Refreshing icons in build output directories..."
find out out-build out-vscode -name "void_cube_noshadow.png" -exec cp -f "$VOID_CUBE_NOSHADOW" {} \; 2>/dev/null || true
find out out-build out-vscode -name "void-icon-sm.png" -exec cp -f "$VOID_ICON_SM" {} \; 2>/dev/null || true

# 5. Update base images in resources/
echo "🖼️  Updating base images in resources..."
sips -z 1024 1024 "$SOURCE_IMAGE" --out "resources/a-coder-1024.png" > /dev/null 2>&1
sips -z 512 512   "$SOURCE_IMAGE" --out "resources/a-coder-transparent-512.png" > /dev/null 2>&1
sips -z 256 256   "$SOURCE_IMAGE" --out "resources/a-coder-256.png" > /dev/null 2>&1

if command -v convert >/dev/null 2>&1; then
    convert "$SOURCE_IMAGE" "a-coder.jpg"
else
    cp "$SOURCE_IMAGE" "a-coder.jpg"
fi

echo "✅ All app icons updated successfully!"
echo ""
echo "Next steps:"
echo "1. Rebuild the app: npm run gulp -- vscode-darwin-arm64"
echo "2. Create DMG: hdiutil create -volname \"A-Coder\" -srcfolder ../VSCode-darwin-arm64/A-Coder.app -ov -format UDZO A-Coder.dmg"

# Building Fee Challan Management System Installer

## Prerequisites

- **Node.js** 18+ installed
- **npm** or **yarn**
- For Windows builds: Windows OS or Wine on macOS/Linux
- For macOS builds: macOS with Xcode command line tools

## Quick Start (Development)

```bash
# Install dependencies
npm install

# Run in Electron (development mode)
npm run electron:dev
```

## Building Installers

### Windows Installer (.exe)

**On Windows:**
```bash
npm run electron:build:win
```

**On macOS (cross-compile):**
You need Wine installed:
```bash
brew install --cask wine-stable
npm run electron:build:win
```

The installer will be created at: `dist-electron/Fee-Challan-Setup-1.0.0.exe`

### macOS Installer (.dmg)

```bash
npm run electron:build:mac
```

Output: `dist-electron/Fee-Challan-1.0.0.dmg`

### Linux Installer (.AppImage / .deb)

```bash
npm run electron:build:linux
```

Output: `dist-electron/Fee-Challan-1.0.0.AppImage`

## App Icons

Before building for production, provide proper icons:

1. **Source SVG**: `electron/resources/icon.svg`
2. **PNG** (512x512): Save as `electron/resources/icon.png`
3. **ICO** (Windows): Convert PNG to ICO, save as `electron/resources/icon.ico`
4. **ICNS** (macOS): Convert PNG to ICNS, save as `electron/resources/icon.icns`

Online converters:
- PNG to ICO: https://www.icoconverter.com/
- SVG to ICO: https://cloudconvert.com/svg-to-ico

## Build Output

All installers are created in the `dist-electron/` directory:

| Platform | File | Type |
|----------|------|------|
| Windows  | `Fee-Challan-Setup-1.0.0.exe` | NSIS Installer |
| macOS    | `Fee-Challan-1.0.0.dmg` | DMG |
| Linux    | `Fee-Challan-1.0.0.AppImage` | AppImage |
| Linux    | `Fee-Challan-1.0.0.deb` | Debian Package |

## Installer Features (Windows)

- Custom install directory selection
- Desktop shortcut creation
- Start menu shortcut
- Uninstaller included
- Auto-starts Next.js server internally (no separate setup needed)

## Troubleshooting

### `better-sqlite3` build errors
The app uses native SQLite bindings. If you get build errors:
```bash
npm rebuild better-sqlite3
```

### Port already in use
The app uses port 3099 by default. If that port is occupied, it automatically finds the next available port.

### Windows Defender / SmartScreen warning
Since the app is not code-signed, Windows may show a SmartScreen warning. Users need to click "More info" > "Run anyway".

For production, consider purchasing a code signing certificate.

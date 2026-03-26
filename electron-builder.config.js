/**
 * @type {import('electron-builder').Configuration}
 */
module.exports = {
  appId: 'com.feechallan.system',
  productName: 'Fee Challan Management System',
  copyright: 'Copyright © 2026 Fee Challan Management System',

  directories: {
    output: 'dist-electron',
    buildResources: 'electron/resources',
  },

  files: [
    'electron/**/*',
    '.next/**/*',
    'src/**/*',
    'public/**/*',
    'node_modules/**/*',
    'package.json',
    'next.config.ts',
    'tsconfig.json',
    'postcss.config.mjs',
  ],

  extraResources: [
    {
      from: '.next',
      to: '.next',
      filter: ['**/*'],
    },
  ],

  // Windows configuration
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64'],
      },
    ],
    icon: 'electron/resources/icon.ico',
    artifactName: 'Fee-Challan-Setup-${version}.${ext}',
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    allowElevation: true,
    installerIcon: 'electron/resources/icon.ico',
    uninstallerIcon: 'electron/resources/icon.ico',
    installerHeaderIcon: 'electron/resources/icon.ico',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Fee Challan System',
    menuCategory: 'Fee Challan Management',
    license: undefined,
    installerSidebar: undefined,
    uninstallerSidebar: undefined,
  },

  // Mac configuration
  mac: {
    target: ['dmg'],
    icon: 'electron/resources/icon.icns',
    artifactName: 'Fee-Challan-${version}.${ext}',
    category: 'public.app-category.business',
  },

  // Linux configuration
  linux: {
    target: ['AppImage', 'deb'],
    icon: 'electron/resources',
    artifactName: 'Fee-Challan-${version}.${ext}',
    category: 'Office',
  },

  // Rebuild native modules for Electron
  npmRebuild: true,
  nodeGypRebuild: false,

  // Use asar for packaging
  asar: true,
  asarUnpack: [
    'node_modules/better-sqlite3/**/*',
    '.next/**/*',
  ],
};

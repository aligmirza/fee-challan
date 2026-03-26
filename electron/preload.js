const { contextBridge } = require('electron');

// Expose minimal safe APIs to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  version: process.env.npm_package_version || '1.0.0',
});

const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');

let mainWindow;
let nextProcess;
const isDev = !app.isPackaged;
const PORT = 3099;

function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => resolve(findAvailablePort(startPort + 1)));
  });
}

function waitForServer(port, timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = require('http').get(`http://localhost:${port}`, (res) => {
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error('Server start timeout'));
        } else {
          setTimeout(check, 500);
        }
      });
    };
    check();
  });
}

async function startNextServer(port) {
  const nextBin = isDev
    ? path.join(__dirname, '..', 'node_modules', '.bin', 'next')
    : path.join(process.resourcesPath, 'node_modules', '.bin', 'next');

  const projectDir = isDev
    ? path.join(__dirname, '..')
    : process.resourcesPath;

  const env = {
    ...process.env,
    PORT: String(port),
    NODE_ENV: isDev ? 'development' : 'production',
  };

  if (isDev) {
    nextProcess = spawn(nextBin, ['dev', '-p', String(port)], {
      cwd: projectDir,
      env,
      stdio: 'pipe',
      shell: true,
    });
  } else {
    nextProcess = spawn(nextBin, ['start', '-p', String(port)], {
      cwd: projectDir,
      env,
      stdio: 'pipe',
      shell: true,
    });
  }

  nextProcess.stdout?.on('data', (data) => {
    console.log(`[Next.js] ${data}`);
  });

  nextProcess.stderr?.on('data', (data) => {
    console.error(`[Next.js] ${data}`);
  });

  nextProcess.on('error', (err) => {
    console.error('Failed to start Next.js:', err);
  });

  await waitForServer(port);
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Fee Challan Management System',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
    backgroundColor: '#f8fafc',
  });

  // Build the menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Print',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow.webContents.print(),
        },
        { type: 'separator' },
        { role: 'quit', label: 'Exit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(isDev ? [{ type: 'separator' }, { role: 'toggleDevTools' }] : []),
      ],
    },
    {
      label: 'Navigate',
      submenu: [
        { label: 'Dashboard', click: () => mainWindow.loadURL(`http://localhost:${port}/`) },
        { label: 'Challan Generation', click: () => mainWindow.loadURL(`http://localhost:${port}/challan`) },
        { label: 'Family Voucher', click: () => mainWindow.loadURL(`http://localhost:${port}/family-voucher`) },
        { label: 'Fee Management', click: () => mainWindow.loadURL(`http://localhost:${port}/fee-management`) },
        { label: 'Students', click: () => mainWindow.loadURL(`http://localhost:${port}/students`) },
        { label: 'Settings', click: () => mainWindow.loadURL(`http://localhost:${port}/settings`) },
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Help Center', click: () => mainWindow.loadURL(`http://localhost:${port}/help`) },
        { label: 'API Documentation', click: () => mainWindow.loadURL(`http://localhost:${port}/api-docs`) },
        { type: 'separator' },
        {
          label: 'About',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Fee Challan Management System',
              message: 'Fee Challan Management System',
              detail: `Version: ${app.getVersion()}\nBuilt with Next.js & Electron\n\nFee Challan & Voucher Management`,
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.loadURL(`http://localhost:${port}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http') && !url.includes('localhost')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Splash screen while loading
function createSplashWindow() {
  const splash = new BrowserWindow({
    width: 400,
    height: 300,
    transparent: false,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    backgroundColor: '#1a365d',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          -webkit-app-region: drag;
        }
        .icon {
          width: 64px; height: 64px;
          background: rgba(255,255,255,0.15);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          font-size: 32px; margin-bottom: 20px;
        }
        h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
        p { font-size: 13px; opacity: 0.7; margin-bottom: 30px; }
        .loader {
          width: 200px; height: 3px;
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
          overflow: hidden;
        }
        .loader-bar {
          height: 100%; width: 40%;
          background: white;
          border-radius: 3px;
          animation: loading 1.5s ease-in-out infinite;
        }
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        .version { position: absolute; bottom: 16px; font-size: 11px; opacity: 0.4; }
      </style>
    </head>
    <body>
      <div class="icon">&#9733;</div>
      <h1>Fee Challan Management System</h1>
      <p>Starting application...</p>
      <div class="loader"><div class="loader-bar"></div></div>
      <div class="version">v1.0.0</div>
    </body>
    </html>
  `)}`);

  return splash;
}

app.whenReady().then(async () => {
  const splash = createSplashWindow();

  try {
    const port = await findAvailablePort(PORT);
    await startNextServer(port);
    createWindow(port);

    splash.close();
  } catch (err) {
    console.error('Failed to start:', err);
    splash.close();
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (nextProcess) {
    nextProcess.kill();
  }
  app.quit();
});

app.on('before-quit', () => {
  if (nextProcess) {
    nextProcess.kill();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    findAvailablePort(PORT).then((port) => createWindow(port));
  }
});

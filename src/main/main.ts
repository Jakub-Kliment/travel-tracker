import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { migrateLegacyData } from '../shared/migration';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: 'Travel Tracker',
    backgroundColor: '#1a1a2e',
    icon: path.join(__dirname, '../../build/icon.png'),
    show: false,  // Don't show until ready
  });

  // Show window when ready to prevent white screen
  mainWindow.once('ready-to-show', () => {
    mainWindow?.maximize();
    mainWindow?.show();
  });

  // In development, load from webpack dev server
  // In production, load from file
  // Check for NODE_ENV or if webpack-dev-server is running
  const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_START_URL;

  if (isDev) {
    // Dev server is already ready (wait-on ensures this)
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers for file operations

// Save data to file
ipcMain.handle('save-data', async (_event, data) => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Save Travel Data',
      defaultPath: path.join(app.getPath('documents'), 'travel-data.json'),
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
    });

    if (filePath) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return { success: true, filePath };
    }
    return { success: false, error: 'No file selected' };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Load data from file
ipcMain.handle('load-data', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog({
      title: 'Load Travel Data',
      defaultPath: app.getPath('documents'),
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile'],
    });

    if (filePaths && filePaths.length > 0) {
      const fileContent = fs.readFileSync(filePaths[0], 'utf-8');
      const rawData = JSON.parse(fileContent);

      // Migrate legacy data if needed
      const data = migrateLegacyData(rawData);

      return { success: true, data };
    }
    return { success: false, error: 'No file selected' };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Auto-save data to a default location
ipcMain.handle('auto-save-data', async (_event, data) => {
  try {
    const autoSavePath = path.join(app.getPath('userData'), 'travel-data.json');
    fs.writeFileSync(autoSavePath, JSON.stringify(data, null, 2));
    return { success: true, filePath: autoSavePath };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Auto-load data from default location
ipcMain.handle('auto-load-data', async () => {
  try {
    const autoSavePath = path.join(app.getPath('userData'), 'travel-data.json');
    if (fs.existsSync(autoSavePath)) {
      const fileContent = fs.readFileSync(autoSavePath, 'utf-8');
      const rawData = JSON.parse(fileContent);

      // Migrate legacy data if needed
      const data = migrateLegacyData(rawData);

      return { success: true, data };
    }
    return { success: false, error: 'No auto-save file found' };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

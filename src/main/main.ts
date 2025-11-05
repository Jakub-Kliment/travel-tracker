import { app, BrowserWindow, ipcMain, dialog, protocol } from 'electron';
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

  // Don't show immediately - wait for map-ready signal from renderer
  mainWindow.once('ready-to-show', () => {
    mainWindow?.maximize();
    // Window will be shown when renderer sends 'map-ready' signal
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

app.on('ready', () => {
  // Register atom:// protocol to serve local files
  protocol.registerFileProtocol('atom', (request, callback) => {
    const url = request.url.substring(7); // Remove 'atom://' prefix
    const filePath = path.join(app.getPath('userData'), url);
    callback({ path: filePath });
  });

  createWindow();
});

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

// Show window when map is ready
ipcMain.on('map-ready', () => {
  if (mainWindow) {
    mainWindow.show();
  }
});

// Select and copy photos for a visit
ipcMain.handle('select-photos', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog({
      title: 'Select Photos',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
      ]
    });

    if (filePaths && filePaths.length > 0) {
      // Create photos directory in userData if it doesn't exist
      const photosDir = path.join(app.getPath('userData'), 'photos');
      if (!fs.existsSync(photosDir)) {
        fs.mkdirSync(photosDir, { recursive: true });
      }

      // Copy photos and return relative paths
      const savedPhotos: string[] = [];
      for (const filePath of filePaths) {
        const fileName = `${Date.now()}_${path.basename(filePath)}`;
        const destPath = path.join(photosDir, fileName);
        fs.copyFileSync(filePath, destPath);
        savedPhotos.push(`photos/${fileName}`);
      }

      return { success: true, photos: savedPhotos };
    }
    return { success: false, error: 'No files selected' };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Get full path to a photo
ipcMain.handle('get-photo-path', async (_event, relativePath: string) => {
  try {
    const fullPath = path.join(app.getPath('userData'), relativePath);
    if (fs.existsSync(fullPath)) {
      return { success: true, path: fullPath };
    }
    return { success: false, error: 'Photo not found' };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Delete a photo
ipcMain.handle('delete-photo', async (_event, relativePath: string) => {
  try {
    const fullPath = path.join(app.getPath('userData'), relativePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return { success: true };
    }
    return { success: false, error: 'Photo not found' };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Capture screenshot of the current page
ipcMain.handle('capture-screenshot', async () => {
  try {
    if (!mainWindow) {
      return { success: false, error: 'No window available' };
    }

    // Hide navbar before capturing
    await mainWindow.webContents.executeJavaScript(`
      (function() {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
          navbar.style.display = 'none';
        }
      })();
    `);

    // Wait a moment for the UI to update
    await new Promise(resolve => setTimeout(resolve, 100));

    const image = await mainWindow.webContents.capturePage();

    // Show navbar again
    await mainWindow.webContents.executeJavaScript(`
      (function() {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
          navbar.style.display = '';
        }
      })();
    `);

    // Show save dialog
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Screenshot',
      defaultPath: path.join(app.getPath('pictures'), `travel-tracker-${Date.now()}.png`),
      filters: [{ name: 'PNG Images', extensions: ['png'] }],
    });

    if (filePath) {
      fs.writeFileSync(filePath, image.toPNG());
      return { success: true, filePath };
    }
    return { success: false, error: 'No file selected' };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Generate PDF report
ipcMain.handle('generate-pdf-report', async (_event, reportData: any) => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Save PDF Report',
      defaultPath: path.join(app.getPath('documents'), `travel-report-${Date.now()}.pdf`),
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });

    if (!filePath) {
      return { success: false, error: 'No file selected' };
    }

    // Create a simple text-based report
    const lines = [
      'TRAVEL TRACKER REPORT',
      '=' .repeat(50),
      '',
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      'OVERVIEW',
      '-'.repeat(50),
      `Countries Visited: ${reportData.visitedCount} / ${reportData.totalCountries}`,
      `Percentage: ${reportData.visitedPercentage}%`,
      `Total Days Traveled: ${reportData.totalDaysTraveled}`,
      `Average Trip Length: ${reportData.averageTripLength} days`,
      `Total Trips: ${reportData.totalTrips}`,
      '',
      'BY CONTINENT',
      '-'.repeat(50),
    ];

    reportData.continentStats.forEach((cs: any) => {
      lines.push(`${cs.continent}: ${cs.visited} / ${cs.total} (${cs.percentage}%)`);
    });

    lines.push('');
    lines.push('VISITED COUNTRIES');
    lines.push('-'.repeat(50));

    reportData.visitedCountries.forEach((country: any, index: number) => {
      lines.push(`${index + 1}. ${country.name} (${country.visitCount} visit${country.visitCount > 1 ? 's' : ''})`);
    });

    const reportContent = lines.join('\n');
    fs.writeFileSync(filePath, reportContent, 'utf-8');

    return { success: true, filePath };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

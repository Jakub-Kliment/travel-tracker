import { app, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { pathToFileURL } from 'url';
import { jsPDF } from 'jspdf';
import { migrateLegacyData } from '../shared/migration';
import { resolveWithinDir } from '../shared/paths';
import { ReportData } from '../shared/types';

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
    title: 'Cestovateľský denník',
    backgroundColor: '#f2ebdd',
    icon: path.join(__dirname, '../../build/icon.png'),
    show: false,  // Don't show until ready
  });

  // The window is normally revealed by the renderer's 'map-ready' signal, so
  // the first paint already has the map in it. If the renderer never gets that
  // far the window must still appear — otherwise the app runs with no visible
  // window at all, which on macOS leaves only a Dock icon and no way back.
  mainWindow.once('ready-to-show', () => {
    mainWindow?.maximize();
    setTimeout(() => {
      if (mainWindow && !mainWindow.isVisible()) {
        mainWindow.show();
      }
    }, 4000);
  });

  // A failed load would otherwise leave the window hidden forever.
  mainWindow.webContents.on('did-fail-load', (_e, code, description) => {
    console.error(`Renderer failed to load: ${description} (${code})`);
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

app.on('ready', () => {
  // Serve photos from userData over atom://
  protocol.handle('atom', (request) => {
    const { host, pathname } = new URL(request.url);
    const requested = decodeURIComponent(host + pathname);
    const filePath = resolveWithinDir(app.getPath('userData'), requested);

    if (!filePath) {
      return new Response('Forbidden', { status: 403 });
    }
    return net.fetch(pathToFileURL(filePath).toString());
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
      title: 'Uložiť údaje',
      defaultPath: path.join(app.getPath('documents'), 'travel-data.json'),
      filters: [{ name: 'Súbory JSON', extensions: ['json'] }],
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
      title: 'Načítať údaje',
      defaultPath: app.getPath('documents'),
      filters: [{ name: 'Súbory JSON', extensions: ['json'] }],
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
      title: 'Vybrať fotografie',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Obrázky', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
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
    const fullPath = resolveWithinDir(app.getPath('userData'), relativePath);
    if (!fullPath) {
      return { success: false, error: 'Invalid photo path' };
    }
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
    // Deletions are confined to the photos folder specifically, so a stray
    // path can never remove the data file itself.
    const photosDir = path.join(app.getPath('userData'), 'photos');
    const fullPath = resolveWithinDir(photosDir, path.relative('photos', relativePath));
    if (!fullPath) {
      return { success: false, error: 'Invalid photo path' };
    }
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return { success: true };
    }
    return { success: false, error: 'Photo not found' };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

/*
 * jsPDF's built-in fonts are WinAnsi-encoded and contain none of the Slovak
 * letters (č, ď, ĺ, ľ, ň, ŕ, š, ť, ž all sit beyond Latin-1), so a report
 * using them came out mangled. These are subsets of the same Inter the UI
 * uses, carrying exactly the characters the report can print.
 */
const REPORT_FONT = 'Inter';

const REPORT_FONT_FILES = [
  { file: 'Inter-Regular.ttf', style: 'normal' },
  { file: 'Inter-SemiBold.ttf', style: 'bold' },
];

let reportFontCache: { name: string; style: string; data: string }[] | null = null;

function registerReportFont(doc: jsPDF): void {
  if (!reportFontCache) {
    reportFontCache = REPORT_FONT_FILES.map(({ file, style }) => ({
      name: file,
      style,
      data: fs.readFileSync(path.join(__dirname, 'fonts', file)).toString('base64'),
    }));
  }

  for (const { name, style, data } of reportFontCache) {
    doc.addFileToVFS(name, data);
    doc.addFont(name, REPORT_FONT, style);
  }
}

/** Toggles the navbar so it stays out of an exported image. */
const setNavbarHidden = (window: BrowserWindow, hidden: boolean) =>
  window.webContents.executeJavaScript(`
    (function() {
      const navbar = document.querySelector('.navbar');
      if (navbar) {
        navbar.style.display = ${hidden ? "'none'" : "''"};
      }
    })();
  `);

// Capture screenshot of the current page
ipcMain.handle('capture-screenshot', async () => {
  const window = mainWindow;
  if (!window) {
    return { success: false, error: 'No window available' };
  }

  try {
    await setNavbarHidden(window, true);
    // Give the compositor a frame to repaint before grabbing the pixels.
    await new Promise((resolve) => setTimeout(resolve, 100));
    const image = await window.webContents.capturePage();

    // Restore the navbar before the dialog opens, so the app never sits
    // there with a missing header while the user picks a location.
    await setNavbarHidden(window, false);

    const { filePath } = await dialog.showSaveDialog(window, {
      title: 'Uložiť obrázok',
      defaultPath: path.join(app.getPath('pictures'), `travel-tracker-${Date.now()}.png`),
      filters: [{ name: 'Obrázky PNG', extensions: ['png'] }],
    });

    if (filePath) {
      fs.writeFileSync(filePath, image.toPNG());
      return { success: true, filePath };
    }
    return { success: false, error: 'No file selected' };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  } finally {
    // If anything above threw, the navbar must not stay hidden.
    await setNavbarHidden(window, false).catch(() => undefined);
  }
});

// Generate PDF report
ipcMain.handle('generate-pdf-report', async (_event, reportData: ReportData) => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Uložiť správu PDF',
      defaultPath: path.join(app.getPath('documents'), `travel-report-${Date.now()}.pdf`),
      filters: [{ name: 'Súbory PDF', extensions: ['pdf'] }],
    });

    if (!filePath) {
      return { success: false, error: 'No file selected' };
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    registerReportFont(doc);
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 56;
    const bottomLimit = pageHeight - 56;
    let y = 64;

    // Starts a new page once the cursor reaches the bottom margin.
    const ensureSpace = (needed = 16) => {
      if (y + needed > bottomLimit) {
        doc.addPage();
        y = 64;
      }
    };

    const heading = (text: string) => {
      ensureSpace(34);
      y += 12;
      doc.setFont(REPORT_FONT, 'bold').setFontSize(13).setTextColor(40);
      doc.text(text, marginX, y);
      y += 8;
      doc.setDrawColor(200).line(marginX, y, doc.internal.pageSize.getWidth() - marginX, y);
      y += 16;
    };

    const line = (text: string) => {
      ensureSpace();
      doc.setFont(REPORT_FONT, 'normal').setFontSize(11).setTextColor(60);
      doc.text(text, marginX, y);
      y += 16;
    };

    doc.setFont(REPORT_FONT, 'bold').setFontSize(22).setTextColor(30);
    doc.text('Cestovateľský denník', marginX, y);
    y += 22;
    doc.setFont(REPORT_FONT, 'normal').setFontSize(10).setTextColor(130);
    doc.text(`Vytvorené ${new Date().toLocaleDateString('sk-SK')}`, marginX, y);
    y += 10;

    heading('Prehľad');
    line(`Navštívené krajiny: ${reportData.visitedCount} z ${reportData.totalCountries}`);
    line(`Podiel sveta: ${reportData.visitedPercentage} %`);
    line(`Dni na cestách: ${reportData.totalDaysTraveled}`);
    line(`Priemerná dĺžka cesty: ${reportData.averageTripLength} dní`);
    line(`Počet ciest: ${reportData.totalTrips}`);

    heading('Podľa kontinentov');
    reportData.continentStats.forEach((cs) => {
      line(`${cs.continent}: ${cs.visited} / ${cs.total} (${cs.percentage} %)`);
    });

    heading(`Navštívené krajiny (${reportData.visitedCountries.length})`);
    if (reportData.visitedCountries.length === 0) {
      line('Zatiaľ žiadne záznamy.');
    } else {
      reportData.visitedCountries.forEach((country, index) => {
        const suffix = country.visitCount > 1 ? ` (${country.visitCount}×)` : '';
        line(`${index + 1}. ${country.name}${suffix}`);
      });
    }

    fs.writeFileSync(filePath, Buffer.from(doc.output('arraybuffer')));

    return { success: true, filePath };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

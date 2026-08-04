import { contextBridge, ipcRenderer } from 'electron';
import { ReportData, TravelData } from '../shared/types';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  saveData: (data: TravelData) => ipcRenderer.invoke('save-data', data),
  loadData: () => ipcRenderer.invoke('load-data'),
  autoSaveData: (data: TravelData) => ipcRenderer.invoke('auto-save-data', data),
  autoLoadData: () => ipcRenderer.invoke('auto-load-data'),
  mapReady: () => ipcRenderer.send('map-ready'),
  selectPhotos: () => ipcRenderer.invoke('select-photos'),
  getPhotoPath: (relativePath: string) => ipcRenderer.invoke('get-photo-path', relativePath),
  deletePhoto: (relativePath: string) => ipcRenderer.invoke('delete-photo', relativePath),
  captureScreenshot: () => ipcRenderer.invoke('capture-screenshot'),
  generatePDFReport: (reportData: ReportData) => ipcRenderer.invoke('generate-pdf-report', reportData),
});

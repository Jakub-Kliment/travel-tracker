export interface Visit {
  startDate: string;      // ISO date string
  endDate?: string;       // ISO date string (optional for single-day visits)
  visitType?: 'business' | 'leisure' | 'transit';
  notes?: string;
  rating?: number;        // 1-5 stars
  photos?: string[];      // Relative file paths in userData folder
}

export interface Country {
  code: string;
  name: string;
  visits: Visit[];        // Array of visits (empty = not visited)
  continent: string;
  isTerritory?: boolean;  // For disputed territories/dependencies
}

export interface TravelData {
  version: number;        // Data format version for migrations
  countries: Country[];
  lastUpdated: string;
}

// Legacy format for migration from v1
export interface LegacyCountry {
  code: string;
  name: string;
  visited: boolean;
  visitDate?: string;
  continent: string;
  isTerritory?: boolean;
}

export interface LegacyTravelData {
  countries: LegacyCountry[];
  lastUpdated: string;
}

export interface Statistics {
  totalCountries: number;
  visitedCount: number;
  visitedPercentage: number;
  continentStats: ContinentStats[];
  timeline: TimelineEntry[];
  totalDaysTraveled: number;
  averageTripLength: number;
  totalTrips: number;
}

export interface ContinentStats {
  continent: string;
  total: number;
  visited: number;
  percentage: number;
}

export interface TimelineEntry {
  date: string;
  countries: string[];
  countryCodes?: string[]; // Optional for backward compatibility
}

// Electron API types for TypeScript
export interface ElectronAPI {
  saveData: (data: TravelData) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  loadData: () => Promise<{ success: boolean; data?: TravelData; error?: string }>;
  autoSaveData: (data: TravelData) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  autoLoadData: () => Promise<{ success: boolean; data?: TravelData; error?: string }>;
  mapReady: () => void;
  selectPhotos: () => Promise<{ success: boolean; photos?: string[]; error?: string }>;
  getPhotoPath: (relativePath: string) => Promise<{ success: boolean; path?: string; error?: string }>;
  deletePhoto: (relativePath: string) => Promise<{ success: boolean; error?: string }>;
  captureScreenshot: () => Promise<{ success: boolean; filePath?: string; error?: string }>;
  generatePDFReport: (reportData: any) => Promise<{ success: boolean; filePath?: string; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

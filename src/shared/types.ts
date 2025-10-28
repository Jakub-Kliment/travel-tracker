export interface Country {
  code: string;
  name: string;
  visited: boolean;
  visitDate?: string;
  continent: string;
  isTerritory?: boolean; // For disputed territories/dependencies
}

export interface TravelData {
  countries: Country[];
  lastUpdated: string;
}

export interface Statistics {
  totalCountries: number;
  visitedCount: number;
  visitedPercentage: number;
  continentStats: ContinentStats[];
  timeline: TimelineEntry[];
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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

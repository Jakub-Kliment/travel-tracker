import { TravelData, LegacyTravelData, Country, Visit } from './types';

const CURRENT_VERSION = 2;

/**
 * Migrates legacy data format (v1) to new format (v2)
 * Converts visited/visitDate to visits array
 */
export function migrateLegacyData(data: any): TravelData {
  // Check if data needs migration
  if (data.version === CURRENT_VERSION) {
    return data as TravelData;
  }

  // If no version field, it's legacy v1 data
  if (!data.version) {
    const legacyData = data as LegacyTravelData;

    const migratedCountries: Country[] = legacyData.countries.map((country) => {
      const visits: Visit[] = [];

      // Convert old visited/visitDate to new visits array
      if (country.visited && country.visitDate) {
        visits.push({
          startDate: country.visitDate,
          // Single-day visit, no end date
          // No type, notes, rating, or photos in legacy data
        });
      }

      return {
        code: country.code,
        name: country.name,
        visits: visits,
        continent: country.continent,
        isTerritory: country.isTerritory,
      };
    });

    return {
      version: CURRENT_VERSION,
      countries: migratedCountries,
      lastUpdated: legacyData.lastUpdated,
    };
  }

  // Unknown version, return as-is (will likely cause errors, but safe fallback)
  console.warn(`Unknown data version: ${data.version}`);
  return data;
}

/**
 * Helper function to check if a country is visited
 */
export function isCountryVisited(country: Country): boolean {
  return country.visits.length > 0;
}

/**
 * Helper function to get the most recent visit date for a country
 * Returns undefined if never visited
 */
export function getMostRecentVisitDate(country: Country): string | undefined {
  if (country.visits.length === 0) {
    return undefined;
  }

  // Sort by start date descending and return the most recent
  const sortedVisits = [...country.visits].sort((a, b) => {
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  return sortedVisits[0].startDate;
}

/**
 * Helper function to get the first visit date for a country
 * Returns undefined if never visited
 */
export function getFirstVisitDate(country: Country): string | undefined {
  if (country.visits.length === 0) {
    return undefined;
  }

  // Sort by start date ascending and return the earliest
  const sortedVisits = [...country.visits].sort((a, b) => {
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  return sortedVisits[0].startDate;
}

/**
 * Helper function to calculate total days spent in a country
 */
export function getTotalDaysInCountry(country: Country): number {
  if (country.visits.length === 0) {
    return 0;
  }

  return country.visits.reduce((total, visit) => {
    const start = new Date(visit.startDate);
    const end = visit.endDate ? new Date(visit.endDate) : start;
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return total + days;
  }, 0);
}

/**
 * Helper function to get all photos for a country
 */
export function getAllPhotosForCountry(country: Country): string[] {
  const photos: string[] = [];
  country.visits.forEach((visit) => {
    if (visit.photos) {
      photos.push(...visit.photos);
    }
  });
  return photos;
}

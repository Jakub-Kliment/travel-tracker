import { TravelData, LegacyTravelData, Country, Visit } from './types';

const CURRENT_VERSION = 2;

/**
 * Migrates legacy data format (v1) to new format (v2)
 * Converts visited/visitDate to visits array
 */
export function migrateLegacyData(data: unknown): TravelData {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Travel data file is not a valid object');
  }

  const candidate = data as Partial<TravelData> & Partial<LegacyTravelData>;

  if (!Array.isArray(candidate.countries)) {
    throw new Error('Travel data file has no countries list');
  }

  // Check if data needs migration
  if (candidate.version === CURRENT_VERSION) {
    return candidate as TravelData;
  }

  // If no version field, it's legacy v1 data
  if (!candidate.version) {
    const legacyData = candidate as LegacyTravelData;

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
  console.warn(`Unknown data version: ${candidate.version}`);
  return candidate as TravelData;
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
 * Returns the visit with the most recent start date.
 * Visits are stored in insertion order, so this is not simply the last entry.
 */
export function getMostRecentVisit(country: Country): Visit | undefined {
  return country.visits.reduce<Visit | undefined>((latest, visit) => {
    if (!latest) return visit;
    return new Date(visit.startDate).getTime() > new Date(latest.startDate).getTime()
      ? visit
      : latest;
  }, undefined);
}

/**
 * Returns the highest rating given across all visits to a country,
 * or undefined if no visit was rated.
 */
export function getBestRating(country: Country): number | undefined {
  const ratings = country.visits
    .map((visit) => visit.rating)
    .filter((rating): rating is number => typeof rating === 'number');
  return ratings.length > 0 ? Math.max(...ratings) : undefined;
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

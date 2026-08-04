import { Country, Statistics, ContinentStats, TimelineEntry } from '../../shared/types';
import { isCountryVisited, getMostRecentVisitDate } from '../../shared/migration';
import { format, parseISO, differenceInDays } from 'date-fns';

// Continents are listed explicitly so the order stays stable in charts;
// anything else found in the data is appended rather than silently dropped.
const CONTINENT_ORDER = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'];

export const calculateStatistics = (countries: Country[]): Statistics => {
  // Territories and disputed areas are tracked but excluded from headline
  // counts, so these totals match the ones shown on the map page.
  const sovereignCountries = countries.filter((c) => !c.isTerritory);
  const territories = countries.filter((c) => c.isTerritory);

  const totalCountries = sovereignCountries.length;
  const visitedCountries = sovereignCountries.filter((c) => isCountryVisited(c));
  const visitedCount = visitedCountries.length;
  const visitedPercentage = totalCountries > 0 ? (visitedCount / totalCountries) * 100 : 0;

  const totalTerritories = territories.length;
  const visitedTerritoryCount = territories.filter((c) => isCountryVisited(c)).length;

  // Calculate continent statistics
  const knownContinents = new Set(sovereignCountries.map((c) => c.continent));
  const continents = [
    ...CONTINENT_ORDER.filter((c) => knownContinents.has(c)),
    ...[...knownContinents].filter((c) => !CONTINENT_ORDER.includes(c)).sort(),
  ];
  const continentStats: ContinentStats[] = continents.map((continent) => {
    const continentCountries = sovereignCountries.filter((c) => c.continent === continent);
    const continentVisited = continentCountries.filter((c) => isCountryVisited(c));
    const total = continentCountries.length;
    const visited = continentVisited.length;
    const percentage = total > 0 ? (visited / total) * 100 : 0;

    return {
      continent,
      total,
      visited,
      percentage,
    };
  });

  // Timeline and trip totals cover territories too: a trip to Greenland is
  // still a trip, even though it does not count toward the country total.
  const allVisited = countries.filter((c) => isCountryVisited(c));

  // Create timeline using most recent visit dates
  const timeline: TimelineEntry[] = [];
  const dateMap = new Map<string, { names: string[]; codes: string[] }>();

  allVisited.forEach((country) => {
    const visitDate = getMostRecentVisitDate(country);
    if (visitDate) {
      try {
        const date = format(parseISO(visitDate), 'yyyy-MM-dd');
        if (!dateMap.has(date)) {
          dateMap.set(date, { names: [], codes: [] });
        }
        const entry = dateMap.get(date)!;
        entry.names.push(country.name);
        entry.codes.push(country.code);
      } catch (error) {
        console.error('Invalid date format:', visitDate);
      }
    }
  });

  // Convert to timeline entries and sort by date (most recent first)
  dateMap.forEach((data, date) => {
    timeline.push({ date, countries: data.names, countryCodes: data.codes });
  });
  timeline.sort((a, b) => b.date.localeCompare(a.date));

  // Calculate duration statistics
  let totalDaysTraveled = 0;
  let totalTrips = 0;

  allVisited.forEach((country) => {
    country.visits.forEach((visit) => {
      totalTrips++;
      try {
        const startDate = parseISO(visit.startDate);
        const endDate = visit.endDate ? parseISO(visit.endDate) : startDate;
        const days = differenceInDays(endDate, startDate) + 1; // Include both start and end day
        totalDaysTraveled += days;
      } catch (error) {
        // If dates are invalid, count as 1 day
        totalDaysTraveled += 1;
      }
    });
  });

  const averageTripLength = totalTrips > 0 ? totalDaysTraveled / totalTrips : 0;

  return {
    totalCountries,
    visitedCount,
    visitedPercentage,
    totalTerritories,
    visitedTerritoryCount,
    continentStats,
    timeline,
    totalDaysTraveled,
    averageTripLength,
    totalTrips,
  };
};

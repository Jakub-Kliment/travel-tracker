import { Country, Statistics, ContinentStats, TimelineEntry } from '../../shared/types';
import { isCountryVisited, getMostRecentVisitDate } from '../../shared/migration';
import { format, parseISO } from 'date-fns';

export const calculateStatistics = (countries: Country[]): Statistics => {
  const totalCountries = countries.length;
  const visitedCountries = countries.filter((c) => isCountryVisited(c));
  const visitedCount = visitedCountries.length;
  const visitedPercentage = totalCountries > 0 ? (visitedCount / totalCountries) * 100 : 0;

  // Calculate continent statistics
  const continents = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'];
  const continentStats: ContinentStats[] = continents.map((continent) => {
    const continentCountries = countries.filter((c) => c.continent === continent);
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

  // Create timeline using most recent visit dates
  const timeline: TimelineEntry[] = [];
  const dateMap = new Map<string, { names: string[]; codes: string[] }>();

  visitedCountries.forEach((country) => {
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

  return {
    totalCountries,
    visitedCount,
    visitedPercentage,
    continentStats,
    timeline,
  };
};

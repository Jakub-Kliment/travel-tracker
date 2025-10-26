import { Country, Statistics, ContinentStats, TimelineEntry } from '../../shared/types';
import { format, parseISO } from 'date-fns';

export const calculateStatistics = (countries: Country[]): Statistics => {
  const totalCountries = countries.length;
  const visitedCountries = countries.filter((c) => c.visited);
  const visitedCount = visitedCountries.length;
  const visitedPercentage = totalCountries > 0 ? (visitedCount / totalCountries) * 100 : 0;

  // Calculate continent statistics
  const continents = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'];
  const continentStats: ContinentStats[] = continents.map((continent) => {
    const continentCountries = countries.filter((c) => c.continent === continent);
    const continentVisited = continentCountries.filter((c) => c.visited);
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

  // Create timeline
  const timeline: TimelineEntry[] = [];
  const visitedWithDates = visitedCountries.filter((c) => c.visitDate);

  // Group by date
  const dateMap = new Map<string, string[]>();
  visitedWithDates.forEach((country) => {
    if (country.visitDate) {
      try {
        const date = format(parseISO(country.visitDate), 'yyyy-MM-dd');
        if (!dateMap.has(date)) {
          dateMap.set(date, []);
        }
        dateMap.get(date)!.push(country.name);
      } catch (error) {
        console.error('Invalid date format:', country.visitDate);
      }
    }
  });

  // Convert to timeline entries and sort by date (most recent first)
  dateMap.forEach((countryNames, date) => {
    timeline.push({ date, countries: countryNames });
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

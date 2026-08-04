import { describe, it, expect } from 'vitest';
import { calculateStatistics } from './statistics';
import { getAllCountries } from './countries';
import { Country } from '../../shared/types';

const make = (
  code: string,
  continent: string,
  visits: Country['visits'],
  isTerritory = false
): Country => ({ code, name: code, continent, visits, isTerritory });

describe('calculateStatistics', () => {
  it('excludes territories from the country totals', () => {
    const stats = calculateStatistics([
      make('JPN', 'Asia', [{ startDate: '2023-01-01' }]),
      make('FRA', 'Europe', []),
      make('GRL', 'North America', [{ startDate: '2023-02-01' }], true),
    ]);

    expect(stats.totalCountries).toBe(2);
    expect(stats.visitedCount).toBe(1);
    expect(stats.totalTerritories).toBe(1);
    expect(stats.visitedTerritoryCount).toBe(1);
  });

  it('keeps continent totals consistent with the country total', () => {
    const stats = calculateStatistics(getAllCountries());
    const summed = stats.continentStats.reduce((total, cs) => total + cs.total, 0);

    expect(summed).toBe(stats.totalCountries);
  });

  it('lists a continent that is not one of the usual six rather than dropping it', () => {
    const stats = calculateStatistics([
      make('JPN', 'Asia', []),
      make('ATL', 'Atlantis', [{ startDate: '2023-01-01' }]),
    ]);

    const atlantis = stats.continentStats.find((cs) => cs.continent === 'Atlantis');
    expect(atlantis).toEqual({ continent: 'Atlantis', total: 1, visited: 1, percentage: 100 });
  });

  it('orders the familiar continents ahead of any others', () => {
    const stats = calculateStatistics([
      make('ATL', 'Atlantis', []),
      make('JPN', 'Asia', []),
      make('FRA', 'Europe', []),
    ]);

    expect(stats.continentStats.map((cs) => cs.continent)).toEqual(['Asia', 'Europe', 'Atlantis']);
  });

  it('counts territory trips toward totals and the timeline', () => {
    const stats = calculateStatistics([
      make('JPN', 'Asia', [{ startDate: '2023-01-01', endDate: '2023-01-05' }]),
      make('GRL', 'North America', [{ startDate: '2023-02-01', endDate: '2023-02-03' }], true),
    ]);

    expect(stats.totalTrips).toBe(2);
    expect(stats.totalDaysTraveled).toBe(8); // 5 + 3, both inclusive
    expect(stats.timeline).toHaveLength(2);
    expect(stats.timeline.flatMap((entry) => entry.countries)).toContain('GRL');
  });

  it('sorts the timeline most recent first and groups same-day visits', () => {
    const stats = calculateStatistics([
      make('JPN', 'Asia', [{ startDate: '2021-05-01' }]),
      make('FRA', 'Europe', [{ startDate: '2023-05-01' }]),
      make('ITA', 'Europe', [{ startDate: '2023-05-01' }]),
    ]);

    expect(stats.timeline.map((entry) => entry.date)).toEqual(['2023-05-01', '2021-05-01']);
    expect(stats.timeline[0].countries).toHaveLength(2);
  });

  it('uses the most recent visit to place a country on the timeline', () => {
    const stats = calculateStatistics([
      make('JPN', 'Asia', [{ startDate: '2019-01-01' }, { startDate: '2023-06-01' }]),
    ]);

    expect(stats.timeline).toHaveLength(1);
    expect(stats.timeline[0].date).toBe('2023-06-01');
  });

  it('averages trip length across every visit', () => {
    const stats = calculateStatistics([
      make('JPN', 'Asia', [
        { startDate: '2023-01-01', endDate: '2023-01-04' }, // 4 days
        { startDate: '2023-03-01', endDate: '2023-03-02' }, // 2 days
      ]),
    ]);

    expect(stats.totalTrips).toBe(2);
    expect(stats.totalDaysTraveled).toBe(6);
    expect(stats.averageTripLength).toBe(3);
  });

  it('reports zeroes rather than dividing by zero when nothing is recorded', () => {
    const stats = calculateStatistics([make('JPN', 'Asia', [])]);

    expect(stats.visitedPercentage).toBe(0);
    expect(stats.averageTripLength).toBe(0);
    expect(stats.timeline).toEqual([]);
  });

  it('handles an empty country list', () => {
    const stats = calculateStatistics([]);

    expect(stats.totalCountries).toBe(0);
    expect(stats.visitedPercentage).toBe(0);
    expect(stats.continentStats).toEqual([]);
  });
});

describe('country list', () => {
  it('has no duplicate codes', () => {
    const codes = getAllCountries().map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('matches the count the map page reports', () => {
    const sovereign = getAllCountries().filter((c) => !c.isTerritory);
    expect(sovereign).toHaveLength(197);
  });
});

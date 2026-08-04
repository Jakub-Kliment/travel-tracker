import { describe, it, expect } from 'vitest';
import {
  migrateLegacyData,
  isCountryVisited,
  getMostRecentVisitDate,
  getFirstVisitDate,
  getMostRecentVisit,
  getBestRating,
  getTotalDaysInCountry,
  getAllPhotosForCountry,
} from './migration';
import { Country } from './types';

const country = (visits: Country['visits']): Country => ({
  code: 'JPN',
  name: 'Japan',
  continent: 'Asia',
  visits,
});

describe('migrateLegacyData', () => {
  it('converts v1 visited/visitDate into a visits array', () => {
    const result = migrateLegacyData({
      countries: [
        { code: 'JPN', name: 'Japan', continent: 'Asia', visited: true, visitDate: '2023-05-01' },
        { code: 'FRA', name: 'France', continent: 'Europe', visited: false },
      ],
      lastUpdated: '2023-05-02',
    });

    expect(result.version).toBe(2);
    expect(result.countries[0].visits).toEqual([{ startDate: '2023-05-01' }]);
    expect(result.countries[1].visits).toEqual([]);
  });

  it('drops a v1 visited flag that has no date, since there is nothing to record', () => {
    const result = migrateLegacyData({
      countries: [{ code: 'JPN', name: 'Japan', continent: 'Asia', visited: true }],
      lastUpdated: '2023-05-02',
    });

    expect(result.countries[0].visits).toEqual([]);
  });

  it('passes through data already at the current version', () => {
    const data = {
      version: 2,
      countries: [country([{ startDate: '2023-01-01' }])],
      lastUpdated: '2023-01-02',
    };

    expect(migrateLegacyData(data)).toBe(data);
  });

  it('rejects malformed files instead of throwing further down the line', () => {
    expect(() => migrateLegacyData(null)).toThrow(/valid object/);
    expect(() => migrateLegacyData('nonsense')).toThrow(/valid object/);
    expect(() => migrateLegacyData({ lastUpdated: 'x' })).toThrow(/countries list/);
  });
});

describe('visit helpers', () => {
  it('treats a country with no visits as unvisited', () => {
    expect(isCountryVisited(country([]))).toBe(false);
    expect(isCountryVisited(country([{ startDate: '2020-01-01' }]))).toBe(true);
  });

  // Visits are appended in entry order, so these must not depend on position.
  const outOfOrder = country([
    { startDate: '2019-01-01', rating: 5, visitType: 'holiday' },
    { startDate: '2023-06-01', rating: 2, visitType: 'work' },
    { startDate: '2021-03-01', rating: 4, visitType: 'transit' },
  ]);

  it('finds the earliest and latest visit regardless of insertion order', () => {
    expect(getFirstVisitDate(outOfOrder)).toBe('2019-01-01');
    expect(getMostRecentVisitDate(outOfOrder)).toBe('2023-06-01');
  });

  it('returns the most recent visit, not the first entered', () => {
    expect(getMostRecentVisit(outOfOrder)?.visitType).toBe('work');
  });

  it('returns the best rating across all visits, not the first', () => {
    expect(getBestRating(outOfOrder)).toBe(5);
  });

  it('ignores unrated visits when picking the best rating', () => {
    expect(getBestRating(country([{ startDate: '2020-01-01' }]))).toBeUndefined();
    expect(
      getBestRating(country([{ startDate: '2020-01-01' }, { startDate: '2021-01-01', rating: 3 }]))
    ).toBe(3);
  });

  it('reports nothing for a country that was never visited', () => {
    expect(getMostRecentVisit(country([]))).toBeUndefined();
    expect(getMostRecentVisitDate(country([]))).toBeUndefined();
    expect(getBestRating(country([]))).toBeUndefined();
  });

  it('counts a single-day visit as one day and spans inclusively', () => {
    expect(getTotalDaysInCountry(country([{ startDate: '2023-01-01' }]))).toBe(1);
    expect(
      getTotalDaysInCountry(country([{ startDate: '2023-01-01', endDate: '2023-01-05' }]))
    ).toBe(5);
  });

  it('sums days across every visit', () => {
    expect(
      getTotalDaysInCountry(
        country([
          { startDate: '2023-01-01', endDate: '2023-01-05' },
          { startDate: '2023-03-01' },
        ])
      )
    ).toBe(6);
  });

  it('collects photos from every visit', () => {
    expect(
      getAllPhotosForCountry(
        country([
          { startDate: '2023-01-01', photos: ['photos/a.jpg'] },
          { startDate: '2023-02-01' },
          { startDate: '2023-03-01', photos: ['photos/b.jpg', 'photos/c.jpg'] },
        ])
      )
    ).toEqual(['photos/a.jpg', 'photos/b.jpg', 'photos/c.jpg']);
  });
});

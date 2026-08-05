import { describe, it, expect } from 'vitest';
import { findAnniversaries } from './anniversaries';
import { Country } from '../../shared/types';

const country = (code: string, dates: string[]): Country => ({
  code,
  name: code,
  continent: 'Europe',
  visits: dates.map((startDate) => ({ startDate })),
});

describe('findAnniversaries', () => {
  const today = new Date(2026, 7, 5); // 5 August 2026

  it('finds a trip that started on this day in an earlier year', () => {
    const found = findAnniversaries([country('HRV', ['2014-08-05'])], today);

    expect(found).toHaveLength(1);
    expect(found[0].country.code).toBe('HRV');
    expect(found[0].yearsAgo).toBe(12);
  });

  it('ignores trips on any other day', () => {
    const found = findAnniversaries(
      [country('FRA', ['2014-08-04', '2014-08-06', '2014-09-05'])],
      today
    );

    expect(found).toEqual([]);
  });

  // An anniversary is the day you left, not every day you were away.
  it('does not match a trip that merely spans today', () => {
    const spanning: Country = {
      code: 'ITA',
      name: 'ITA',
      continent: 'Europe',
      visits: [{ startDate: '2014-08-01', endDate: '2014-08-20' }],
    };

    expect(findAnniversaries([spanning], today)).toEqual([]);
  });

  it('ignores a trip that starts today, which is not yet a memory', () => {
    expect(findAnniversaries([country('ESP', ['2026-08-05'])], today)).toEqual([]);
  });

  it('ignores dates in the future', () => {
    expect(findAnniversaries([country('JPN', ['2030-08-05'])], today)).toEqual([]);
  });

  it('orders the most recent anniversary first', () => {
    const found = findAnniversaries(
      [country('AUT', ['2020-08-05']), country('POL', ['2001-08-05']), country('CZE', ['2015-08-05'])],
      today
    );

    expect(found.map((a) => a.country.code)).toEqual(['AUT', 'CZE', 'POL']);
    expect(found.map((a) => a.yearsAgo)).toEqual([6, 11, 25]);
  });

  it('reports each visit separately when a country was visited on the same day twice', () => {
    const found = findAnniversaries([country('DEU', ['2010-08-05', '2018-08-05'])], today);

    expect(found.map((a) => a.yearsAgo)).toEqual([8, 16]);
  });

  it('skips malformed dates rather than throwing', () => {
    const found = findAnniversaries([country('XXX', ['', 'not-a-date', '2014-08-05'])], today);

    expect(found.map((a) => a.yearsAgo)).toEqual([12]);
  });

  // `new Date(2023, 1, 30)` silently becomes 2 March, which would make a
  // nonexistent date match the wrong day.
  it('rejects a date the calendar does not have', () => {
    const march2 = new Date(2026, 2, 2);

    expect(findAnniversaries([country('XXX', ['2023-02-30'])], march2)).toEqual([]);
  });

  it('matches a leap day only on another leap day', () => {
    const leapVisit = [country('IRL', ['2016-02-29'])];

    expect(findAnniversaries(leapVisit, new Date(2024, 1, 29))).toHaveLength(1);
    expect(findAnniversaries(leapVisit, new Date(2025, 1, 28))).toEqual([]);
    expect(findAnniversaries(leapVisit, new Date(2025, 2, 1))).toEqual([]);
  });

  it('includes territories, since a trip there is still a trip', () => {
    const greenland: Country = {
      code: 'GRL',
      name: 'GRL',
      continent: 'North America',
      isTerritory: true,
      visits: [{ startDate: '2019-08-05' }],
    };

    expect(findAnniversaries([greenland], today)).toHaveLength(1);
  });

  it('returns nothing when there are no visits at all', () => {
    expect(findAnniversaries([country('SVK', [])], today)).toEqual([]);
  });
});

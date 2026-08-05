import { describe, it, expect } from 'vitest';
import { collectRecentPhotos, countPhotosBeyond } from './recentPhotos';
import { Country, Visit } from '../../shared/types';

const country = (code: string, visits: Visit[]): Country => ({
  code,
  name: code,
  continent: 'Europe',
  visits,
});

describe('collectRecentPhotos', () => {
  it('returns photos from the most recent trip first', () => {
    const photos = collectRecentPhotos(
      [
        country('HRV', [{ startDate: '2014-06-01', photos: ['old.jpg'] }]),
        country('JPN', [{ startDate: '2024-03-10', photos: ['new.jpg'] }]),
      ],
      10
    );

    expect(photos.map((p) => p.path)).toEqual(['new.jpg', 'old.jpg']);
    expect(photos[0].country.code).toBe('JPN');
  });

  it('keeps the stored order within a single trip', () => {
    const photos = collectRecentPhotos(
      [country('ITA', [{ startDate: '2020-01-01', photos: ['a.jpg', 'b.jpg', 'c.jpg'] }])],
      10
    );

    expect(photos.map((p) => p.path)).toEqual(['a.jpg', 'b.jpg', 'c.jpg']);
  });

  it('stops at the limit, even part-way through a trip', () => {
    const photos = collectRecentPhotos(
      [country('ESP', [{ startDate: '2021-01-01', photos: ['a.jpg', 'b.jpg', 'c.jpg'] }])],
      2
    );

    expect(photos.map((p) => p.path)).toEqual(['a.jpg', 'b.jpg']);
  });

  it('ignores visits with no photos', () => {
    const photos = collectRecentPhotos(
      [
        country('FRA', [
          { startDate: '2023-01-01' },
          { startDate: '2022-01-01', photos: [] },
          { startDate: '2021-01-01', photos: ['only.jpg'] },
        ]),
      ],
      10
    );

    expect(photos.map((p) => p.path)).toEqual(['only.jpg']);
  });

  it('carries the visit so the photo can be opened in context', () => {
    const visit: Visit = { startDate: '2022-05-05', photos: ['x.jpg'], notes: 'a note' };
    const photos = collectRecentPhotos([country('AUT', [visit])], 10);

    expect(photos[0].visit).toBe(visit);
  });

  it('returns nothing for a zero or negative limit', () => {
    const data = [country('DEU', [{ startDate: '2020-01-01', photos: ['a.jpg'] }])];

    expect(collectRecentPhotos(data, 0)).toEqual([]);
    expect(collectRecentPhotos(data, -3)).toEqual([]);
  });

  it('returns nothing when no photo has ever been attached', () => {
    expect(collectRecentPhotos([country('SVK', [{ startDate: '2020-01-01' }])], 10)).toEqual([]);
  });
});

describe('countPhotosBeyond', () => {
  it('counts the photos not shown in the strip', () => {
    const data = [
      country('HRV', [{ startDate: '2014-06-01', photos: ['a.jpg', 'b.jpg'] }]),
      country('JPN', [{ startDate: '2024-03-10', photos: ['c.jpg'] }]),
    ];

    expect(countPhotosBeyond(data, 2)).toBe(1);
    expect(countPhotosBeyond(data, 3)).toBe(0);
  });

  it('never reports a negative remainder', () => {
    const data = [country('HRV', [{ startDate: '2014-06-01', photos: ['a.jpg'] }])];

    expect(countPhotosBeyond(data, 8)).toBe(0);
  });
});

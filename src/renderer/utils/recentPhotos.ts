import { Country, Visit } from '../../shared/types';

/** A photo together with the trip it belongs to, so it can be clicked through. */
export interface RecentPhoto {
  /** Path relative to the userData folder, as stored on the visit. */
  path: string;
  country: Country;
  visit: Visit;
}

/**
 * The most recently photographed trips, newest first.
 *
 * The map page shows a short strip of these so that photos are visible without
 * having to remember which country they were filed under. Photos are ordered
 * by the trip's start date rather than by when the file was added, because the
 * strip is a view of the travelling, not of the data entry.
 *
 * Within a single trip the stored order is kept: that is the order the user
 * chose when attaching them.
 */
export function collectRecentPhotos(countries: Country[], limit: number): RecentPhoto[] {
  if (limit <= 0) return [];

  const withPhotos: { country: Country; visit: Visit }[] = [];

  for (const country of countries) {
    for (const visit of country.visits) {
      if (visit.photos && visit.photos.length > 0) {
        withPhotos.push({ country, visit });
      }
    }
  }

  withPhotos.sort((a, b) => b.visit.startDate.localeCompare(a.visit.startDate));

  const photos: RecentPhoto[] = [];
  for (const { country, visit } of withPhotos) {
    for (const path of visit.photos ?? []) {
      photos.push({ path, country, visit });
      if (photos.length === limit) return photos;
    }
  }

  return photos;
}

/** How many photographed trips exist beyond the ones shown in the strip. */
export function countPhotosBeyond(countries: Country[], shown: number): number {
  const total = countries.reduce(
    (sum, country) =>
      sum + country.visits.reduce((visitSum, visit) => visitSum + (visit.photos?.length ?? 0), 0),
    0
  );

  return Math.max(0, total - shown);
}

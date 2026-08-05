import { Country, Visit } from '../../shared/types';

/** A trip that started on this day in an earlier year. */
export interface Anniversary {
  country: Country;
  visit: Visit;
  /** Whole years between the visit and today; always 1 or more. */
  yearsAgo: number;
}

/** Local calendar parts of an ISO date, ignoring any time zone in the string. */
const parseIsoDate = (iso: string): { year: number; month: number; day: number } | undefined => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return undefined;

  const [, year, month, day] = match;
  const parsed = { year: Number(year), month: Number(month), day: Number(day) };

  // Reject dates the calendar does not have, such as 2023-02-30, which
  // `new Date` would silently roll forward into March.
  const asDate = new Date(parsed.year, parsed.month - 1, parsed.day);
  if (
    asDate.getFullYear() !== parsed.year ||
    asDate.getMonth() !== parsed.month - 1 ||
    asDate.getDate() !== parsed.day
  ) {
    return undefined;
  }

  return parsed;
};

/**
 * Trips that started on today's date in an earlier year, most recent first.
 *
 * This exists to give the app a reason to be opened on a day when nothing is
 * being recorded: it surfaces a trip the user may not have thought about in
 * years. Only the start date counts — an anniversary is the day you left, not
 * any day you happened to be away.
 *
 * A visit dated 29 February is only ever an anniversary on another 29
 * February, which is the honest reading: the date simply does not occur in
 * most years.
 */
export function findAnniversaries(countries: Country[], today: Date = new Date()): Anniversary[] {
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const year = today.getFullYear();

  const found: Anniversary[] = [];

  for (const country of countries) {
    for (const visit of country.visits) {
      const start = parseIsoDate(visit.startDate);
      if (!start) continue;
      if (start.month !== month || start.day !== day) continue;

      const yearsAgo = year - start.year;
      // A trip starting today, or one dated in the future, is not a memory.
      if (yearsAgo < 1) continue;

      found.push({ country, visit, yearsAgo });
    }
  }

  return found.sort((a, b) => a.yearsAgo - b.yearsAgo);
}

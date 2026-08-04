import { isoThreeToTwo } from './utils/isoCodes';

/**
 * Slovak UI strings, kept in one place so the wording can be read and revised
 * without hunting through JSX.
 */
export const t = {
  appTitle: 'Cestovateľský denník',
  appSubtitle: 'Mapa sveta',

  nav: {
    map: 'Mapa',
    statistics: 'Štatistiky',
    exportImage: 'Obrázok',
    exportPdf: 'Správa PDF',
  },

  map: {
    countriesVisited: (visited: number, total: number) => `${visited} zo ${total} krajín`,
    percentExplored: (pct: string) => `${pct} % sveta preskúmaných`,
    territoriesExtra: (count: number) => `+ ${count} ${plural(count, 'územie', 'územia', 'území')}`,
    legendVisited: 'Navštívené',
    legendNotVisited: 'Nenavštívené',
    legendHoliday: 'Dovolenka',
    legendWork: 'Pracovne',
    legendTransit: 'Prejazd',
    legendOther: 'Iné',
    projection: 'Zobrazenie mapy',
    projectionNatural: 'Natural Earth',
    projectionMercator: 'Mercator',
    projectionEqual: 'Equal Earth',
    colourScheme: 'Farebná schéma',
    colourGreen: 'Zelená',
    colourBlue: 'Modrá',
    colourPurple: 'Fialová',
    colourAmber: 'Jantárová',
    colourByType: 'Rozlíšiť podľa typu cesty',
    zoomIn: 'Priblížiť',
    zoomOut: 'Oddialiť',
    resetView: 'Pôvodné zobrazenie',
    countryList: 'Zoznam krajín',
    fullscreen: 'Na celú obrazovku',
    exitFullscreen: 'Ukončiť celú obrazovku (ESC)',
    allCountries: (count: number) => `Všetky krajiny (${count})`,
    searchPlaceholder: 'Hľadať krajinu…',
    showTerritories: (count: number) => `Zobraziť územia a sporné oblasti (${count})`,
    close: 'Zavrieť',
  },

  visit: {
    noneYet: 'Zatiaľ žiadne návštevy. Pridajte prvú tlačidlom nižšie.',
    add: 'Pridať návštevu',
    addTitle: 'Nová návšteva',
    editTitle: 'Upraviť návštevu',
    edit: 'Upraviť',
    delete: 'Vymazať',
    removeAll: 'Odstrániť všetky návštevy',
    startDate: 'Od',
    endDate: 'Do',
    endDateOptional: 'Do (nepovinné)',
    type: 'Typ cesty',
    typeUnset: 'Neuvedené',
    typeHoliday: 'Dovolenka',
    typeWork: 'Pracovne',
    typeTransit: 'Prejazd',
    typeOther: 'Iné',
    rating: 'Hodnotenie',
    clearRating: 'Zrušiť hodnotenie',
    notes: 'Poznámky a spomienky',
    notesPlaceholder: 'Zážitky, ľudia, jedlo, čokoľvek stojí za zapamätanie…',
    photos: 'Fotografie',
    addPhotos: 'Pridať fotografie',
    removePhoto: 'Odstrániť fotografiu',
    save: 'Uložiť',
    cancel: 'Zrušiť',
    confirmDelete: 'Naozaj chcete vymazať túto návštevu?',
    confirmRemoveAll: 'Naozaj chcete odstrániť všetky návštevy tejto krajiny?',
    endBeforeStart: 'Dátum návratu nemôže byť skôr ako dátum odchodu.',
    visitNumber: (n: number) => `${n}. návšteva`,
    dates: 'Dátumy',
    duration: 'Dĺžka',
    days: (n: number) => `${n} ${plural(n, 'deň', 'dni', 'dní')}`,
  },

  stats: {
    worldProgress: 'Prehľad',
    countriesVisitedOf: (total: number) => `zo ${total} krajín navštívených`,
    percentComplete: (pct: string) => `${pct} % sveta`,
    territoriesLine: (visited: number, total: number) =>
      `+ ${visited} z ${total} ${plural(total, 'územia', 'území', 'území')}`,
    totalDays: 'Dni na cestách',
    daysOnRoad: 'spolu strávených mimo domova',
    averageTrip: 'Priemerná dĺžka cesty',
    daysPerTrip: 'dní na jednu cestu',
    totalTrips: (n: number) => `${n} ${plural(n, 'cesta', 'cesty', 'ciest')} celkom`,
    distribution: 'Pomer',
    visited: 'Navštívené',
    notVisited: 'Nenavštívené',
    visitedCountries: (n: number) => `Navštívené krajiny (${n})`,
    byContinent: 'Podľa kontinentov',
    continentBreakdown: 'Rozpis kontinentov',
    bucketList: (n: number) => `Ešte len čakajú (${n})`,
    territories: (n: number) => `Územia a sporné oblasti (${n})`,
    timeline: 'Časová os ciest',
    topRated: 'Najlepšie hodnotené',
    close: 'Zavrieť',
  },

  continents: {
    Africa: 'Afrika',
    Asia: 'Ázia',
    Europe: 'Európa',
    'North America': 'Severná Amerika',
    'South America': 'Južná Amerika',
    Oceania: 'Oceánia',
    Antarctica: 'Antarktída',
  } as Record<string, string>,

  export: {
    imageSaved: (path: string) => `Obrázok uložený:\n${path}`,
    imageFailed: (error: string) => `Obrázok sa nepodarilo uložiť: ${error}`,
    pdfSaved: (path: string) => `Správa uložená:\n${path}`,
    pdfFailed: (error: string) => `Správu sa nepodarilo vytvoriť: ${error}`,
    photosFailed: 'Fotografie sa nepodarilo pridať.',
  },
};

/**
 * Slovak has three plural forms: one (1), few (2-4) and many (0, 5+).
 * Used for day and trip counts.
 */
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}

/** Translates a continent name for display, falling back to the raw value. */
export const continentName = (continent: string): string =>
  t.continents[continent] ?? continent;

/**
 * Slovak country names come from the runtime's CLDR data rather than a table
 * kept in this repo, so they stay correct without maintenance. The two codes
 * below are our own invention (neither entity has an ISO assignment), so the
 * runtime cannot know them.
 */
const regionNames = new Intl.DisplayNames(['sk'], { type: 'region' });

const localCountryNames: Record<string, string> = {
  SOL: 'Somaliland',
  NCY: 'Severný Cyprus',
};

/**
 * The Slovak name for a country, falling back to the English name stored in
 * the data when the runtime has no entry for it.
 */
export function countryName(country: { code: string; name: string }): string {
  const local = localCountryNames[country.code];
  if (local) return local;

  const two = isoThreeToTwo[country.code];
  if (!two) return country.name;

  try {
    const name = regionNames.of(two.toUpperCase());
    return name && name.toUpperCase() !== two.toUpperCase() ? name : country.name;
  } catch {
    return country.name;
  }
}

/** Human label for a stored visit type. */
export const visitTypeLabel = (type: string): string =>
  ({
    holiday: t.visit.typeHoliday,
    work: t.visit.typeWork,
    transit: t.visit.typeTransit,
    other: t.visit.typeOther,
  })[type] ?? type;

const LOCALE = 'sk-SK';

/** "14. marca 2023" */
export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(LOCALE, { year: 'numeric', month: 'long', day: 'numeric' });

/** "marec 2023" — used where space is tight. */
export const formatMonthYear = (iso: string): string =>
  new Date(iso).toLocaleDateString(LOCALE, { year: 'numeric', month: 'long' });

/** A date, or a range when the visit spans more than one day. */
export const formatDateRange = (start: string, end?: string): string =>
  end ? `${formatDate(start)} – ${formatDate(end)}` : formatDate(start);

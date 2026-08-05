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
    // "z" governs the genitive plural; "zo" is only used before s-/z- clusters,
    // and a numeral read as "stodeväťdesiatich" does not start with one.
    countriesVisited: (visited: number, total: number) => `${visited} z ${total} krajín`,
    // The participle agrees with "sveta" (masculine singular genitive), not
    // with the percentage in front of it.
    percentExplored: (pct: string) => `${pct} % sveta preskúmaného`,
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
    // "pred" takes the instrumental: 1 → rokom, otherwise rokmi. Unlike the
    // nominative there is no separate 2-4 form, so few and many coincide.
    yearsAgo: (n: number) => `Pred ${n} ${plural(n, 'rokom', 'rokmi', 'rokmi')}`,
    anniversaryMore: (n: number) => `+ ${n} ${plural(n, 'ďalšia', 'ďalšie', 'ďalších')}`,
    allCountries: (count: number) => `Všetky krajiny (${count})`,
    searchPlaceholder: 'Hľadať krajinu…',
    showTerritories: (count: number) => `Zobraziť územia a sporné oblasti (${count})`,
    close: 'Zavrieť',
    recentPhotos: 'Nedávne fotografie',
    morePhotos: (n: number) => `+ ${n}`,
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
    // "čokoľvek" needs the relative pronoun "čo" before the verb.
    notesPlaceholder: 'Zážitky, ľudia, jedlo, čokoľvek, čo stojí za zapamätanie…',
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
    // — Prehľad (the headline card)
    worldProgress: 'Navštívené krajiny',
    countriesVisitedOf: (total: number) => `z ${total} krajín sveta`,
    percentComplete: (pct: string) => `${pct} % sveta`,
    // "z" always takes the genitive plural, so the noun does not vary here.
    territoriesLine: (visited: number, total: number) =>
      `a k tomu ${visited} z ${total} území`,

    // — Cesty (trip totals)
    totalDays: 'Dni na cestách',
    // Both the noun and the participle agree with the count: "deň strávený",
    // "dni strávené", "dní strávených".
    daysOnRoad: (n: number) =>
      `${plural(n, 'deň', 'dni', 'dní')} ${plural(n, 'strávený', 'strávené', 'strávených')} mimo domova`,
    averageTrip: 'Priemerná dĺžka cesty',
    daysPerTrip: 'dní na jednu cestu',
    totalTrips: (n: number) => `spolu ${n} ${plural(n, 'cesta', 'cesty', 'ciest')}`,

    // — Rozpis (breakdowns)
    tripTypes: 'Typy ciest',
    noTripTypes: 'Pri žiadnej ceste nie je uvedený typ.',
    visited: 'Navštívené',
    notVisited: 'Nenavštívené',
    byContinent: 'Kontinenty v číslach',
    continentBreakdown: 'Podiel kontinentov',

    // — Zoznamy (lists)
    visitedCountries: (n: number) => `Navštívené krajiny (${n})`,
    // The rest of the UI addresses the reader formally rather than speaking in
    // the first person, so this heading stays impersonal too.
    bucketList: (n: number) => `Kam sa ešte dá vycestovať (${n})`,
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
  // CLDR gives these as "Hongkong – OAO Číny" and "Macao – OAO Číny". The
  // administrative-region suffix is correct but reads like a form, so the
  // plain city name is used instead.
  HKG: 'Hongkong',
  MAC: 'Macao',
  // CLDR disambiguates the two halves of Saint Martin with "(fr.)" and
  // "(hol.)", which is unhelpfully terse; spell the distinction out.
  MAF: 'Svätý Martin (Francúzsko)',
  SXM: 'Svätý Martin (Holandsko)',
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

/**
 * Slovak writes the decimal separator as a comma. `toFixed` always produces a
 * point, so every number shown to the user goes through here instead.
 */
export const formatDecimal = (value: number, digits = 1): string =>
  value.toLocaleString(LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

/** "14. marca 2023" */
export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(LOCALE, { year: 'numeric', month: 'long', day: 'numeric' });

/** "marec 2023" — used where space is tight. */
export const formatMonthYear = (iso: string): string =>
  new Date(iso).toLocaleDateString(LOCALE, { year: 'numeric', month: 'long' });

/** A date, or a range when the visit spans more than one day. */
export const formatDateRange = (start: string, end?: string): string =>
  end ? `${formatDate(start)} – ${formatDate(end)}` : formatDate(start);

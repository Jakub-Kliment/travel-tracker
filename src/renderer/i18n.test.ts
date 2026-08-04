import { describe, it, expect } from 'vitest';
import { plural, countryName, continentName, visitTypeLabel } from './i18n';
import { getAllCountries } from './utils/countries';
import { isoThreeToTwo } from './utils/isoCodes';

describe('plural', () => {
  it('uses the three Slovak forms', () => {
    expect(plural(1, 'deň', 'dni', 'dní')).toBe('deň');
    expect(plural(2, 'deň', 'dni', 'dní')).toBe('dni');
    expect(plural(4, 'deň', 'dni', 'dní')).toBe('dni');
    expect(plural(5, 'deň', 'dni', 'dní')).toBe('dní');
    expect(plural(0, 'deň', 'dni', 'dní')).toBe('dní');
  });
});

describe('countryName', () => {
  it('returns the Slovak name for ISO countries', () => {
    expect(countryName({ code: 'DEU', name: 'Germany' })).toBe('Nemecko');
    expect(countryName({ code: 'JPN', name: 'Japan' })).toBe('Japonsko');
    expect(countryName({ code: 'GRL', name: 'Greenland' })).toBe('Grónsko');
  });

  it('uses our own names for the two entities with no ISO code', () => {
    expect(countryName({ code: 'SOL', name: 'Somaliland' })).toBe('Somaliland');
    expect(countryName({ code: 'NCY', name: 'Northern Cyprus' })).toBe('Severný Cyprus');
  });

  it('falls back to the stored name for an unknown code', () => {
    expect(countryName({ code: 'ZZZ', name: 'Atlantis' })).toBe('Atlantis');
  });

  it('never returns a bare country code for anything in the country list', () => {
    const bare = getAllCountries().filter((c) => {
      const name = countryName(c);
      return name === c.code || name === isoThreeToTwo[c.code]?.toUpperCase();
    });
    expect(bare).toEqual([]);
  });

  it('gives every country a non-empty name', () => {
    const empty = getAllCountries().filter((c) => !countryName(c).trim());
    expect(empty).toEqual([]);
  });
});

describe('continentName', () => {
  it('translates the continents used by the data', () => {
    expect(continentName('Europe')).toBe('Európa');
    expect(continentName('North America')).toBe('Severná Amerika');
    expect(continentName('Antarctica')).toBe('Antarktída');
  });

  it('passes through anything unrecognised', () => {
    expect(continentName('Atlantis')).toBe('Atlantis');
  });

  it('covers every continent present in the country list', () => {
    const continents = new Set(getAllCountries().map((c) => c.continent));
    for (const continent of continents) {
      expect(continentName(continent)).not.toBe(continent);
    }
  });
});

describe('visitTypeLabel', () => {
  it('translates each stored visit type', () => {
    expect(visitTypeLabel('holiday')).toBe('Dovolenka');
    expect(visitTypeLabel('work')).toBe('Pracovne');
    expect(visitTypeLabel('transit')).toBe('Prejazd');
    expect(visitTypeLabel('other')).toBe('Iné');
  });
});

import { describe, it, expect } from 'vitest';
import worldAtlas from 'world-atlas/countries-50m.json';
import { getAllCountries } from './countries';
import { isoThreeToTwo } from './isoCodes';
import { countryIdToIso, territoryNameToIso } from '../pages/mapCodes';

/**
 * The map and the country list are two independent descriptions of the same
 * world, and nothing at runtime forces them to agree. When they drift, the
 * failure is silent and visual: a landmass renders in the "not one of ours"
 * fill, ignores clicks, and never appears in a list or a total.
 *
 * These tests pin the two together.
 */

interface AtlasGeometry {
  id?: string;
  properties?: { name?: string };
}

const geometries = (worldAtlas as unknown as {
  objects: { countries: { geometries: AtlasGeometry[] } };
}).objects.countries.geometries;

/** The same resolution the map itself performs, kept in step via mapCodes. */
const resolve = (geo: AtlasGeometry): string | undefined => {
  const byId = geo.id ? countryIdToIso[geo.id] : undefined;
  if (byId) return byId;

  const name = geo.properties?.name?.toLowerCase();
  if (!name) return undefined;
  return territoryNameToIso.find(([test]) => test(name))?.[1];
};

describe('map and country list alignment', () => {
  const countries = getAllCountries();
  const codes = new Set(countries.map((c) => c.code));

  it('has an entry for every landmass the atlas draws', () => {
    const unmatched = geometries
      .map((geo) => ({ iso: resolve(geo), name: geo.properties?.name }))
      .filter((entry) => entry.iso && !codes.has(entry.iso));

    // Anything listed here renders as inert land the user cannot click.
    expect(unmatched).toEqual([]);
  });

  it('leaves only the two unnamed atlas features unresolved', () => {
    const unresolved = geometries
      .filter((geo) => !resolve(geo))
      .map((geo) => geo.properties?.name);

    // These two carry no ISO id and are not places anyone visits: one is a
    // disputed glacier, the other an Australian island group already covered.
    expect(unresolved.sort()).toEqual(['Indian Ocean Ter.', 'Siachen Glacier']);
  });

  it('gives every country a two-letter code, so flags and names resolve', () => {
    // SOL and NCY are our own invention and are named in i18n instead.
    const missing = countries
      .filter((c) => !isoThreeToTwo[c.code])
      .map((c) => c.code);

    expect(missing.sort()).toEqual(['NCY', 'SOL']);
  });

  it('maps no two countries onto the same two-letter code', () => {
    const seen = new Map<string, string>();
    const collisions: string[] = [];

    for (const country of countries) {
      const two = isoThreeToTwo[country.code];
      if (!two) continue;
      const previous = seen.get(two);
      if (previous) collisions.push(`${previous}/${country.code} both use ${two}`);
      seen.set(two, country.code);
    }

    expect(collisions).toEqual([]);
  });
});

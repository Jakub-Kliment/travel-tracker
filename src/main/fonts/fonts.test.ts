import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * The PDF report embeds these subsets because jsPDF's built-in fonts are
 * WinAnsi-encoded and contain none of the Slovak letters. If a glyph goes
 * missing the report silently prints the wrong character, so the coverage is
 * asserted here rather than being noticed in an exported file.
 */
const FONT_DIR = __dirname;
const FONTS = ['Inter-Regular.ttf', 'Inter-SemiBold.ttf'];

// Every character the report can print.
const REQUIRED =
  Array.from({ length: 0x7f - 0x20 }, (_, i) => String.fromCharCode(0x20 + i)).join('') +
  'áäčďéíĺľňóôŕšťúýžÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ' +
  '×·–—„“”’€' +
  // Not Slovak letters, but they occur in territory names the report lists:
  // Curaçao, Åland, Saint-Barthélemy.
  'çÇåÅ';

/** Reads the set of code points a TrueType font's cmap covers. */
function codePoints(file: string): Set<number> {
  const buf = fs.readFileSync(file);
  const numTables = buf.readUInt16BE(4);

  let cmapOffset = 0;
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    if (buf.toString('ascii', rec, rec + 4) === 'cmap') {
      cmapOffset = buf.readUInt32BE(rec + 8);
      break;
    }
  }
  if (!cmapOffset) throw new Error(`no cmap table in ${file}`);

  const covered = new Set<number>();
  const numSubtables = buf.readUInt16BE(cmapOffset + 2);

  for (let i = 0; i < numSubtables; i++) {
    const enc = cmapOffset + 4 + i * 8;
    const subtable = cmapOffset + buf.readUInt32BE(enc + 4);
    const format = buf.readUInt16BE(subtable);

    // Format 4 is the standard BMP mapping and is all these subsets use.
    if (format !== 4) continue;

    const segCountX2 = buf.readUInt16BE(subtable + 6);
    const segCount = segCountX2 / 2;
    const endBase = subtable + 14;
    const startBase = endBase + segCountX2 + 2;

    for (let s = 0; s < segCount; s++) {
      const end = buf.readUInt16BE(endBase + s * 2);
      const start = buf.readUInt16BE(startBase + s * 2);
      if (start === 0xffff) continue;
      for (let cp = start; cp <= end && cp !== 0xffff; cp++) covered.add(cp);
    }
  }

  return covered;
}

describe('PDF report fonts', () => {
  for (const name of FONTS) {
    const file = path.join(FONT_DIR, name);

    it(`${name} is present and is a TrueType file`, () => {
      expect(fs.existsSync(file)).toBe(true);
      const magic = fs.readFileSync(file).readUInt32BE(0);
      // 0x00010000 is the TrueType version tag; jsPDF cannot embed woff/woff2.
      expect(magic).toBe(0x00010000);
    });

    it(`${name} covers every character the report can print`, () => {
      const covered = codePoints(file);
      const missing = [...REQUIRED].filter((ch) => !covered.has(ch.codePointAt(0)!));
      expect(missing.join('')).toBe('');
    });

    it(`${name} includes the Slovak letters absent from Latin-1`, () => {
      const covered = codePoints(file);
      const slovak = 'čďĺľňŕšťžČĎĹĽŇŔŠŤŽ';
      const missing = [...slovak].filter((ch) => !covered.has(ch.codePointAt(0)!));
      expect(missing.join('')).toBe('');
    });
  }
});

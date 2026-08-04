import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { resolveWithinDir } from './paths';

const base = path.resolve('/home/user/.config/travel-tracker');

describe('resolveWithinDir', () => {
  it('resolves ordinary photo paths', () => {
    expect(resolveWithinDir(base, 'photos/a.jpg')).toBe(path.join(base, 'photos/a.jpg'));
    expect(resolveWithinDir(base, 'photos/sub/b.png')).toBe(path.join(base, 'photos/sub/b.png'));
  });

  it('rejects paths that climb out of the base directory', () => {
    expect(resolveWithinDir(base, '../../../../etc/passwd')).toBeUndefined();
    expect(resolveWithinDir(base, 'photos/../../../etc/shadow')).toBeUndefined();
  });

  it('rejects absolute paths', () => {
    expect(resolveWithinDir(base, '/etc/passwd')).toBeUndefined();
  });

  it('rejects a sibling directory that shares the base as a string prefix', () => {
    expect(resolveWithinDir(base, '../travel-tracker-evil/x.jpg')).toBeUndefined();
  });

  it('allows a path that normalises back to the base itself', () => {
    expect(resolveWithinDir(base, 'photos/..')).toBe(base);
  });

  it('confines deletions to the photos folder', () => {
    const photos = path.join(base, 'photos');
    const confine = (p: string) => resolveWithinDir(photos, path.relative('photos', p));

    expect(confine('photos/a.jpg')).toBe(path.join(photos, 'a.jpg'));
    expect(confine('photos/../travel-data.json')).toBeUndefined();
    expect(confine('../travel-data.json')).toBeUndefined();
  });
});

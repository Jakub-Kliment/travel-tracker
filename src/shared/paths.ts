import * as path from 'path';

/**
 * Resolves a user-supplied relative path against a base directory, returning
 * undefined if the result would escape that directory.
 *
 * Photo paths are read from the data file, which may have been imported from
 * elsewhere, so they are not trusted to stay inside the app's own folders.
 */
export function resolveWithinDir(baseDir: string, relativePath: string): string | undefined {
  const resolvedBase = path.resolve(baseDir);
  const target = path.resolve(resolvedBase, relativePath);

  // A sibling directory can share the base as a string prefix
  // (userData vs userData-evil), so the separator check matters.
  if (target !== resolvedBase && !target.startsWith(resolvedBase + path.sep)) {
    return undefined;
  }
  return target;
}

/*
 * Lets plain Node run the app's TypeScript data modules: resolves the `@/` alias and
 * extensionless imports, and turns `.json` imports into modules (the source files import
 * JSON without an `with { type: "json" }` attribute, which Node otherwise rejects).
 *
 * Used only by scripts/export-seed.mjs. Nothing in the app depends on it.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
const EXTENSIONS = ['', '.ts', '.tsx', '.json', '/index.ts', '/index.tsx'];

// Node infers the format from the extension (and strips types for .ts); forcing it here
// would hand raw TypeScript to the JavaScript parser.

function firstThatExists(base) {
  for (const ext of EXTENSIONS) {
    const candidate = base + ext;
    try {
      readFileSync(candidate);
      return candidate;
    } catch {
      // keep looking
    }
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const found = firstThatExists(path.join(SRC, specifier.slice(2)));
    if (found) return { url: pathToFileURL(found).href, shortCircuit: true };
  }

  if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
    const base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
    const found = firstThatExists(base);
    if (found) return { url: pathToFileURL(found).href, shortCircuit: true };
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.json')) {
    const json = readFileSync(fileURLToPath(url), 'utf8');
    return { format: 'module', source: `export default ${json};`, shortCircuit: true };
  }
  return nextLoad(url, context);
}

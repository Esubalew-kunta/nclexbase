/*
 * Dumps the frontend's seed content to JSON so the Laravel importer and the API parity
 * test have one authoritative snapshot of "what the static app shipped with".
 *
 *   node --experimental-strip-types --import ./scripts/register-hook.mjs scripts/export-seed.mjs [outfile]
 *
 * The seed is computed in TypeScript (src/lib/admin/seed.ts), not stored, so it has to be
 * run rather than read. Re-run this whenever src/data changes.
 */

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const { SEED } = await import('../src/lib/admin/seed.ts');
const { DEFAULT_CONFIG } = await import('../src/lib/admin/config.ts');
const { COPY } = await import('../src/lib/admin/copy.ts');
const { READINESS_CASES } = await import('../src/data/readiness.ts');

const collections = {};
for (const [name, factory] of Object.entries(SEED)) {
  collections[name] = factory();
}

const payload = {
  exportedAt: new Date().toISOString(),
  source: 'web/src/lib/admin/seed.ts',
  counts: Object.fromEntries(Object.entries(collections).map(([k, v]) => [k, v.length])),
  collections,
  config: DEFAULT_CONFIG,
  /*
   * The CAT readiness exams group their items into case studies, and that grouping lives in
   * src/data/readiness.ts rather than in SEED, so it is exported separately. Without it the
   * API can serve the 85 readiness questions but not the intro and tab panels that wrap them.
   * Items stay out of here: they are already in `collections.questions` as source.kind
   * "readiness", in exam order, and `itemIds` points at them.
   */
  readinessCases: READINESS_CASES.map((c) => ({
    id: c.id,
    title: c.title,
    subject: c.subject,
    intro: c.intro,
    exhibit: Boolean(c.exhibit),
    tabs: c.tabs,
    itemIds: c.items.map((i) => i.id),
  })),
  copy: COPY.map(({ key, page, label, default: value, long }) => ({ key, page, label, value, long: Boolean(long) })),
};

const out = path.resolve(process.argv[2] ?? '../api/database/seed/seed-export.json');
const json = JSON.stringify(payload, null, 2);
writeFileSync(out, json);

console.log('wrote', out);
console.log('sha256', createHash('sha256').update(json).digest('hex').slice(0, 16));
console.table(payload.counts);
console.log('copy keys:', payload.copy.length, '| config sections:', Object.keys(payload.config).length);
console.log('readiness cases:', payload.readinessCases.length, '| their items:', payload.readinessCases.reduce((n, c) => n + c.itemIds.length, 0));

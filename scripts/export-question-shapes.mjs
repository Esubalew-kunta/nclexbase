/*
 * Writes the per-type field rules to JSON so the API can validate an imported question batch
 * against the same definition the admin import screen uses.
 *
 *   node --experimental-strip-types --import ./scripts/register-hook.mjs scripts/export-question-shapes.mjs
 *
 * Without this the rules would exist twice -- once in TypeScript for the browser, once in PHP
 * for the importer -- and a thirteenth item type would be added to one of them only. Re-run it
 * whenever SHAPES in src/lib/admin/questionImport.ts changes.
 */

import { writeFileSync } from 'node:fs';
import path from 'node:path';

const { SHAPES } = await import('../src/lib/admin/questionImport.ts');

const payload = {
  generatedAt: new Date().toISOString(),
  source: 'web/src/lib/admin/questionImport.ts (SHAPES)',
  // kind names are the vocabulary the PHP validator understands; see QuestionShapes.
  types: SHAPES,
};

const out = path.resolve(process.argv[2] ?? '../api/database/seed/question-shapes.json');
writeFileSync(out, JSON.stringify(payload, null, 2));

console.log('wrote', out);
console.log('types:', Object.keys(SHAPES).length);
for (const [type, fields] of Object.entries(SHAPES)) {
  const required = Object.entries(fields).filter(([, f]) => !f.optional).map(([k]) => k);
  console.log(`  ${type.padEnd(14)} required: ${required.join(', ') || '(none)'}`);
}

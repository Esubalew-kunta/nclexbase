import { CASES } from "@/data/cases";
import { STANDALONE } from "@/data/standalone";
import { READINESS_CASES, READINESS_ITEMS } from "@/data/readiness";
import type { CaseStudy, Item, SessionEntry, SubjectId } from "./types";

const itemIndex = new Map<string, { item: Item; caseStudy?: CaseStudy }>();
for (const c of CASES) for (const item of c.items) itemIndex.set(item.id, { item, caseStudy: c });
for (const item of STANDALONE) itemIndex.set(item.id, { item });

// CAT readiness exam items are looked up by id but kept out of the study bank (Create Test, counts).
const readinessIndex = new Map<string, { item: Item; caseStudy?: CaseStudy }>();
for (const item of READINESS_ITEMS) readinessIndex.set(item.id, { item });
for (const c of READINESS_CASES) for (const item of c.items) readinessIndex.set(item.id, { item, caseStudy: c });

export const ALL_ITEMS: Item[] = [...itemIndex.values()].map((v) => v.item);

export function itemById(id: string): Item {
  const hit = itemIndex.get(id) ?? readinessIndex.get(id);
  if (!hit) throw new Error(`Unknown item ${id}`);
  return hit.item;
}

export function caseForItem(id: string): CaseStudy | undefined {
  return (itemIndex.get(id) ?? readinessIndex.get(id))?.caseStudy;
}

export function itemsForSubject(subject: SubjectId): Item[] {
  return ALL_ITEMS.filter((i) => i.subject === subject);
}

export function entriesForCase(c: CaseStudy): SessionEntry[] {
  return c.items.map((i) => ({ itemId: i.id, caseId: c.id }));
}

/**
 * Build test entries from the bank. Case items stay grouped and in order,
 * as they are on the real exam; standalone items are shuffled.
 */
export function buildEntries(opts: {
  subjects: SubjectId[] | "all";
  exclude: Set<string>;
  include?: Set<string>;
  count: number;
  seed?: number;
}): SessionEntry[] {
  const allowed = (i: Item) =>
    (opts.subjects === "all" || opts.subjects.includes(i.subject)) &&
    !opts.exclude.has(i.id) &&
    (!opts.include || opts.include.has(i.id));

  const rand = mulberry32(opts.seed ?? Date.now());
  const groups: SessionEntry[][] = [];
  for (const c of CASES) {
    const items = c.items.filter(allowed);
    if (items.length) groups.push(items.map((i) => ({ itemId: i.id, caseId: c.id })));
  }
  for (const i of STANDALONE) if (allowed(i)) groups.push([{ itemId: i.id }]);

  shuffle(groups, rand);
  const out: SessionEntry[] = [];
  for (const g of groups) {
    if (out.length >= opts.count) break;
    out.push(...g.slice(0, opts.count - out.length));
  }
  return out;
}

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

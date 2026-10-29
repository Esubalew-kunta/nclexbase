import { READINESS_CASES, READINESS_ITEMS } from "@/data/readiness";
import { apiMode } from "@/lib/api/client";
import { getBank } from "@/lib/content";
import type { CaseStudy, Item, SessionEntry, SubjectId } from "./types";

/*
 * Question bank lookups. Content comes from the repository (seed + admin edits), so
 * edits made in /admin show up in new tests. Lookups by id also find archived and
 * readiness items, so saved test sessions keep working after content changes.
 */

/*
 * Readiness items used to live only in src/data, so lookups fall back to them. In API mode
 * the bank already holds every readiness question and its case, and the bundled copy may be
 * out of date with what the admin has since edited -- so the fallback is skipped there and a
 * missing id is reported as missing rather than answered from the bundle.
 */
const readinessFallback = new Map<string, Item>(READINESS_ITEMS.map((i) => [i.id, i]));
const readinessCaseFallback = new Map<string, CaseStudy>();
for (const c of READINESS_CASES) for (const i of c.items) readinessCaseFallback.set(i.id, c);

const fallbackItem = (id: string) => (apiMode() ? undefined : readinessFallback.get(id));
const fallbackCase = (id: string) => (apiMode() ? undefined : readinessCaseFallback.get(id));

/** Published items students can study (standalone + published case studies). */
export function studyItems(): Item[] {
  const bank = getBank();
  return [...bank.cases.flatMap((c) => c.items), ...bank.standalone];
}

/**
 * The item with this id, or undefined.
 *
 * Use this when walking saved history: an attempt can name a question the bank does not hold
 * -- the admin deleted it, or in API mode the bank has not arrived yet -- and a whole page of
 * statistics should not disappear because one old answer points at nothing.
 */
export function findItem(id: string): Item | undefined {
  return getBank().byId.get(id) ?? fallbackItem(id);
}

/**
 * The item with this id, or an error.
 *
 * Use this where the item must exist for the screen to mean anything, such as the question
 * currently on display in the exam.
 */
export function itemById(id: string): Item {
  const hit = findItem(id);
  if (!hit) throw new Error(`Unknown item ${id}`);
  return hit;
}

export function caseForItem(id: string): CaseStudy | undefined {
  return getBank().caseOf.get(id) ?? fallbackCase(id);
}

export function itemsForSubject(subject: SubjectId): Item[] {
  return studyItems().filter((i) => i.subject === subject);
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
  const bank = getBank();
  for (const c of bank.cases) {
    const items = c.items.filter(allowed);
    if (items.length) groups.push(items.map((i) => ({ itemId: i.id, caseId: c.id })));
  }
  for (const i of bank.standalone) if (allowed(i)) groups.push([{ itemId: i.id }]);

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

/**
 * Entries for a CAT readiness exam from the readiness pool (Admin > Readiness Exams).
 * Case items stay together and in order; `shuffle` reorders whole groups with a seed so
 * each exam presents the same pool differently.
 */
export function readinessEntriesFor(exam: { shuffle: boolean; number: number; questionIds?: string[] }): SessionEntry[] {
  const bank = getBank();
  const pool = [...bank.byId.values()].filter((q) => q.source.kind === "readiness" && q.status === "published").sort((a, b) => a.order - b.order);
  const groups: SessionEntry[][] = [];
  for (const q of pool) {
    const caseId = bank.caseOf.get(q.id)?.id;
    const last = groups[groups.length - 1];
    if (caseId && last && last[0].caseId === caseId) last.push({ itemId: q.id, caseId });
    else groups.push([{ itemId: q.id, caseId }]);
  }
  const picked = exam.questionIds?.length ? new Set(exam.questionIds) : null;
  const chosen = picked ? groups.filter((g) => g.some((e) => picked.has(e.itemId))) : groups;
  if (exam.shuffle) shuffle(chosen, mulberry32(exam.number * 7919));
  return chosen.flat();
}

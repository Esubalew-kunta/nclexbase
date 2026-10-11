"use client";

import { useMemo } from "react";
import { READINESS_CASES } from "@/data/readiness";
import { useAdminStore, type CollectionPatch } from "@/lib/admin/store";
import { DEFAULT_CONFIG, mergeDeep, type ConfigPatch, type SiteConfig } from "@/lib/admin/config";
import { SEED } from "@/lib/admin/seed";
import type { CaseRec, CollectionName, Collections, FaqPlacement, QuestionRec, SubjectRec } from "@/lib/admin/types";
import type { Lesson } from "@/data/catalog";
import type { CaseStudy, Item, SubjectId } from "@/lib/types";

/*
 * Content repository: the one place both the student app and the admin read content from.
 * Each collection = seed records (src/data) merged with the admin's edits (lib/admin/store).
 * Results are memoised on the store slice, so reads are cheap and stable between renders.
 * When the backend arrives, these functions fetch from the API instead; callers stay the same.
 */

/* ------------------------------------------------------------------ */
/* Generic merge                                                       */
/* ------------------------------------------------------------------ */

const seedCache: { [K in CollectionName]?: Collections[K][] } = {};
function seedOf<K extends CollectionName>(col: K): Collections[K][] {
  return (seedCache[col] ??= SEED[col]() as never) as Collections[K][];
}

const mergeCache = new Map<CollectionName, { patch: unknown; out: unknown[] }>();

/** All records of a collection (any status), seed order first, then records the admin created. */
export function mergeCollection<K extends CollectionName>(col: K, patch: CollectionPatch<Collections[K]> | undefined): Collections[K][] {
  const hit = mergeCache.get(col);
  if (hit && hit.patch === patch) return hit.out as Collections[K][];
  const base = seedOf(col);
  let out: Collections[K][];
  if (!patch) out = base;
  else {
    const seen = new Set<string>();
    out = [];
    for (const r of base) {
      const id = (r as { id: string }).id;
      seen.add(id);
      if (patch.removed[id]) continue;
      out.push(patch.records[id] ?? r);
    }
    for (const [id, r] of Object.entries(patch.records)) if (!seen.has(id) && !patch.removed[id]) out.push(r);
  }
  mergeCache.set(col, { patch, out });
  return out;
}

/** Non-hook read (event handlers, lib code). */
export function getAll<K extends CollectionName>(col: K): Collections[K][] {
  return mergeCollection(col, useAdminStore.getState().data[col] as CollectionPatch<Collections[K]> | undefined);
}

/** Hook read; re-renders when the admin changes this collection. */
export function useAll<K extends CollectionName>(col: K): Collections[K][] {
  const patch = useAdminStore((s) => s.data[col]) as CollectionPatch<Collections[K]> | undefined;
  return useMemo(() => mergeCollection(col, patch), [col, patch]);
}

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;
const published = <T extends { status?: string }>(r: T) => r.status === undefined || r.status === "published";

/** Published records sorted by their admin order. */
export function usePublished<K extends CollectionName>(col: K): Collections[K][] {
  const all = useAll(col);
  return useMemo(() => (all as unknown as { status?: string; order: number }[]).filter(published).sort(byOrder) as unknown as Collections[K][], [all]);
}

/* ------------------------------------------------------------------ */
/* Site config                                                         */
/* ------------------------------------------------------------------ */

let configCache: { patch: ConfigPatch; out: SiteConfig } | null = null;
export function resolveConfig(patch: ConfigPatch): SiteConfig {
  if (configCache?.patch === patch) return configCache.out;
  const out = mergeDeep(DEFAULT_CONFIG, patch);
  configCache = { patch, out };
  return out;
}
export const getConfig = () => resolveConfig(useAdminStore.getState().config);
export function useConfig(): SiteConfig {
  const patch = useAdminStore((s) => s.config);
  return resolveConfig(patch);
}

/* ------------------------------------------------------------------ */
/* Taxonomy                                                            */
/* ------------------------------------------------------------------ */

/** Subjects in admin order. Hidden subjects are left out unless `includeHidden`. */
export function useSubjects(includeHidden = false): SubjectRec[] {
  const all = useAll("subjects");
  return useMemo(() => all.filter((s) => includeHidden || s.visible).sort(byOrder), [all, includeHidden]);
}

export function useSubjectRec(id: SubjectId): SubjectRec | undefined {
  return useAll("subjects").find((s) => s.id === id);
}

/** Display name of a subject (admin can rename). */
export function subjectName(id: SubjectId | string): string {
  return getAll("subjects").find((s) => s.id === id)?.name ?? id;
}

/** Display label of a system key inside a subject (admin can rename). */
export function systemLabel(subject: SubjectId | string, key: string): string {
  return getAll("subjects").find((s) => s.id === subject)?.systems.find((x) => x.key === key)?.label ?? key;
}

/* ------------------------------------------------------------------ */
/* Simple collections for the student side                             */
/* ------------------------------------------------------------------ */

export function useMemoryTricks(subject?: SubjectId) {
  const list = usePublished("memoryTricks");
  return useMemo(() => (subject ? list.filter((t) => t.subject === subject) : list), [list, subject]);
}

export const useCheatSheets = () => usePublished("cheatSheets");

export function useCourses(kind: "subject" | "ngn") {
  const list = usePublished("courses");
  return useMemo(() => list.filter((c) => c.kind === kind), [list, kind]);
}

/** Admin lesson record → the shape the course list and player render. */
export const asLesson = (l: { type: "video" | "bites"; title: string; duration?: string; count?: number; access: string }): Lesson => ({
  type: l.type,
  title: l.title,
  duration: l.duration,
  count: l.count,
  locked: l.access === "premium",
});

export function useLessons(course: string) {
  const list = usePublished("lessons");
  return useMemo(() => list.filter((l) => l.course === course), [list, course]);
}

/** FAQ pairs for one page, in admin order (FaqList takes [question, answerHtml]). */
export function useFaqs(placement: FaqPlacement): (readonly [string, string])[] {
  const list = usePublished("faqs");
  return useMemo(() => list.filter((f) => f.placements.includes(placement)).map((f) => [f.question, f.answer] as const), [list, placement]);
}

export const usePlans = () => usePublished("plans");
export const useReadinessExams = () => usePublished("readiness");

/** Case study rows for list pages (published only). */
export function useCaseRows(subject?: SubjectId | string): CaseRec[] {
  const list = usePublished("cases");
  return useMemo(() => (subject ? list.filter((c) => c.subject === subject) : list), [list, subject]);
}
export const getCaseRows = () => getAll("cases").filter(published).sort(byOrder);

/* ------------------------------------------------------------------ */
/* Question bank (used by lib/bank.ts)                                 */
/* ------------------------------------------------------------------ */

export interface Bank {
  /** Every question, any status, so old test sessions always resolve. */
  byId: Map<string, QuestionRec>;
  caseOf: Map<string, CaseStudy>;
  /** Published standalone questions. */
  standalone: Item[];
  /** Published case studies that have authored content (their items in order). */
  cases: CaseStudy[];
}

let bankCache: { q: unknown; c: unknown; bank: Bank } | null = null;

export function getBank(): Bank {
  const s = useAdminStore.getState();
  if (bankCache && bankCache.q === s.data.questions && bankCache.c === s.data.cases) return bankCache.bank;
  const questions = mergeCollection("questions", s.data.questions as CollectionPatch<QuestionRec> | undefined);
  const caseRecs = mergeCollection("cases", s.data.cases as CollectionPatch<CaseRec> | undefined);
  const byId = new Map(questions.map((q) => [q.id, q]));
  const caseOf = new Map<string, CaseStudy>();

  const toCase = (rec: CaseRec): CaseStudy | null => {
    if (!rec.content) return null;
    const items = rec.content.itemIds.map((id) => byId.get(id)).filter(Boolean) as Item[];
    return { id: rec.id, title: rec.title, subject: rec.subject, intro: rec.content.intro, exhibit: rec.content.exhibit, tabs: rec.content.tabs, items };
  };
  const all = caseRecs.map(toCase).filter(Boolean) as CaseStudy[];
  for (const c of all) for (const it of c.items) caseOf.set(it.id, c);
  // Readiness cases keep their structure; their items pick up admin edits.
  for (const rc of READINESS_CASES) {
    const c = { ...rc, items: rc.items.map((it) => byId.get(it.id) ?? it) };
    for (const it of c.items) caseOf.set(it.id, c);
  }

  const live = new Set(caseRecs.filter(published).map((c) => c.id));
  const bank: Bank = {
    byId,
    caseOf,
    standalone: questions.filter((q) => q.source.kind === "standalone" && published(q)).sort(byOrder),
    cases: all.filter((c) => live.has(c.id) && c.items.length > 0),
  };
  bankCache = { q: s.data.questions, c: s.data.cases, bank };
  return bank;
}

/** Hook form of getBank: re-renders when questions or cases change. The returned object is a stable dependency. */
export function useBank(): Bank {
  useAdminStore((s) => s.data.questions);
  useAdminStore((s) => s.data.cases);
  return getBank();
}

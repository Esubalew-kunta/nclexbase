"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { getBank, useBank } from "@/lib/content";
import { findItem, entriesForCase } from "./bank";
import { scoreItem } from "./scoring";
import { latestAttempts, usedItemIds, useStore } from "./store";
import type { CaseStudy, MasteryTag, SubjectId } from "./types";

export interface TagCounts {
  used: number;
  mastered: number;
  reviewing: number;
  learning: number;
}

const emptyCounts = (): TagCounts => ({ used: 0, mastered: 0, reviewing: 0, learning: 0 });

/** Aggregated usage, tags, and scores per subject/system from all submitted attempts. */
export function useProgress() {
  const sessions = useStore((s) => s.sessions);
  const tags = useStore((s) => s.tags);
  const bank = useBank();
  return useMemo(() => {
    const CASES = bank.cases;
    const STANDALONE = bank.standalone;
    const used = usedItemIds(sessions);
    const attempts = latestAttempts(sessions);
    const bySubject = new Map<SubjectId, { used: number; earned: number; max: number; time: number; answered: number }>();
    const bySystem = new Map<string, { earned: number; max: number; used: number }>();
    let earned = 0;
    let max = 0;
    for (const [itemId, { answer, session }] of attempts) {
      // History can outlive a question: skip rather than lose the whole page of statistics.
      const item = findItem(itemId);
      if (!item) continue;
      const sc = scoreItem(item, answer);
      earned += sc.earned;
      max += sc.max;
      const row = bySubject.get(item.subject) ?? { used: 0, earned: 0, max: 0, time: 0, answered: 0 };
      row.used += 1;
      row.earned += sc.earned;
      row.max += sc.max;
      row.time += session.timeSpent[itemId] ?? 0;
      row.answered += 1;
      bySubject.set(item.subject, row);
      const sysKey = `${item.subject}::${item.system}`;
      const sys = bySystem.get(sysKey) ?? { earned: 0, max: 0, used: 0 };
      sys.earned += sc.earned;
      sys.max += sc.max;
      sys.used += 1;
      bySystem.set(sysKey, sys);
    }

    const countIds = (ids: string[]): TagCounts => {
      const c = emptyCounts();
      for (const id of ids) {
        if (!used.has(id)) continue;
        c.used++;
        const t = tags[id] as MasteryTag | undefined;
        if (t) c[t]++;
      }
      return c;
    };

    const subjectCounts = (subject: SubjectId) => {
      const ids = [...CASES.flatMap((c) => c.items), ...STANDALONE].filter((i) => i.subject === subject).map((i) => i.id);
      return countIds(ids);
    };
    const caseCounts = (caseId: string) => countIds(CASES.find((c) => c.id === caseId)?.items.map((i) => i.id) ?? []);
    const caseUsed = (caseId: string) => caseCounts(caseId).used;
    const casesTotal = countIds(CASES.flatMap((c) => c.items.map((i) => i.id)));
    const standaloneTotal = countIds(STANDALONE.map((i) => i.id));
    const standaloneFor = (subject: SubjectId) => countIds(STANDALONE.filter((i) => i.subject === subject).map((i) => i.id));

    return { used, bySubject, bySystem, earned, max, caseUsed, caseCounts, subjectCounts, casesTotal, standaloneTotal, standaloneFor };
  }, [sessions, tags, bank]);
}

/**
 * The prototype authors one case per subject. Catalog rows without authored
 * content replay the closest authored case so every "Start" button works.
 */
/**
 * The case to show for a row: the authored case itself, else the subject's sample, else any.
 *
 * Returns undefined when the bank holds no authored case at all. That cannot happen with the
 * bundled seed, but it does in API mode before the question bank has loaded (or for a visitor
 * who may not have it), and the old `cases[0]` quietly returned undefined while the inferred
 * type claimed otherwise -- so callers dereferenced it and the page crashed.
 */
export function resolveCase(caseId: string, subject?: string): CaseStudy | undefined {
  const { cases } = getBank();
  return cases.find((c) => c.id === caseId) ?? cases.find((c) => c.subject === subject) ?? cases[0];
}

/** Start a case study as a new session and open the exam screen. */
export function useStartCase() {
  const router = useRouter();
  const createSession = useStore((s) => s.createSession);
  return (caseId: string, opts: { subject?: string; title?: string; replace?: boolean } = {}) => {
    const existing = useStore.getState().sessions.find((s) => s.kind === "case" && s.sourceId === caseId);
    if (existing?.status === "ended")
      useStore.setState((st) => ({ sessions: st.sessions.map((x) => (x.id === existing.id ? { ...x, status: "active" } : x)) }));
    const url0 = existing && `/nclex/custom-test?id=${existing.id}`;
    if (url0) return opts.replace ? router.replace(url0) : router.push(url0);
    const c = resolveCase(caseId, opts.subject);
    // No authored case means there is nothing to start; leaving the click inert beats
    // creating a session with no items in it.
    if (!c) return;
    const id = createSession({ kind: "case", title: opts.title ?? c.title, entries: entriesForCase(c), tutor: true, timed: false, pool: "unused", sourceId: caseId });
    const url = `/nclex/custom-test?id=${id}`;
    if (opts.replace) router.replace(url);
    else router.push(url);
  };
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

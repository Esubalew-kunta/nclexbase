"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { CASES } from "@/data/cases";
import { itemById, entriesForCase } from "./bank";
import { scoreItem } from "./scoring";
import { latestAttempts, usedItemIds, useStore } from "./store";
import type { SubjectId } from "./types";

/** Aggregated usage and score per subject, from all submitted attempts. */
export function useProgress() {
  const sessions = useStore((s) => s.sessions);
  return useMemo(() => {
    const used = usedItemIds(sessions);
    const attempts = latestAttempts(sessions);
    const bySubject = new Map<SubjectId, { used: number; earned: number; max: number; time: number; answered: number }>();
    const bySystem = new Map<string, { earned: number; max: number }>();
    let earned = 0;
    let max = 0;
    for (const [itemId, { answer, session }] of attempts) {
      const item = itemById(itemId);
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
      const sys = bySystem.get(sysKey) ?? { earned: 0, max: 0 };
      sys.earned += sc.earned;
      sys.max += sc.max;
      bySystem.set(sysKey, sys);
    }
    const caseUsed = (caseId: string) => CASES.find((c) => c.id === caseId)?.items.filter((i) => used.has(i.id)).length ?? 0;
    return { used, bySubject, bySystem, earned, max, caseUsed };
  }, [sessions]);
}

/**
 * The prototype authors one case per subject. Catalog rows without authored
 * content replay the closest authored case so every "Start" button works.
 */
export function resolveCase(caseId: string, subject?: string) {
  return CASES.find((c) => c.id === caseId) ?? CASES.find((c) => c.subject === subject) ?? CASES[0];
}

/** Start a case study as a new session and open the exam screen. */
export function useStartCase() {
  const router = useRouter();
  const createSession = useStore((s) => s.createSession);
  return (caseId: string, opts: { subject?: string; title?: string; replace?: boolean } = {}) => {
    const c = resolveCase(caseId, opts.subject);
    const id = createSession({ kind: "case", title: opts.title ?? c.title, entries: entriesForCase(c), tutor: false, timed: false, pool: "unused" });
    const url = `/nclex/custom-test?id=${id}`;
    if (opts.replace) router.replace(url);
    else router.push(url);
  };
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Good morning!";
  if (h < 18) return "Good afternoon!";
  return "Good evening!";
}

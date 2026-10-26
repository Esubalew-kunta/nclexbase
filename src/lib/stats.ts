"use client";

import { getBank, useBank, type Bank } from "@/lib/content";
import { scoreItem } from "./scoring";
import { useStore } from "./store";
import type { Item, TestSession } from "./types";

/*
 * Question counts and averages are facts, not settings: they are counted from the published
 * bank and from recorded attempts, so neither the admin nor the seed can type them.
 * In the static build the only attempts are the ones saved in this browser; the backend
 * will aggregate every student's attempts behind the same functions.
 */

export interface Stats {
  /** Published standalone questions ("0 of N questions used", Create Test). */
  standalone: number;
  /** Standalone + questions in published case studies (Home). */
  studyable: number;
  /** Studyable + published readiness exam questions (Performance). */
  perfTotal: number;
  /** Average score over every recorded attempt, %. Null until someone answers. */
  avg: number | null;
  /** Average seconds per answered question. Null until someone answers. */
  avgTimeSec: number | null;
  /** Answers recorded. */
  attempts: number;
}

export interface SubjectStats extends Stats {
  systems: Map<string, Stats>;
}

export interface StatsIndex {
  subject: (id: string) => SubjectStats;
  system: (subject: string, key: string) => Stats;
}

interface Acc {
  standalone: number;
  studyable: number;
  perfTotal: number;
  earned: number;
  max: number;
  time: number;
  attempts: number;
}

const acc = (): Acc => ({ standalone: 0, studyable: 0, perfTotal: 0, earned: 0, max: 0, time: 0, attempts: 0 });

const finish = (a: Acc): Stats => ({
  standalone: a.standalone,
  studyable: a.studyable,
  perfTotal: a.perfTotal,
  avg: a.max ? Math.round((a.earned / a.max) * 100) : null,
  avgTimeSec: a.attempts ? a.time / a.attempts : null,
  attempts: a.attempts,
});

const EMPTY: SubjectStats = { ...finish(acc()), systems: new Map() };

function compute(bank: Bank, sessions: TestSession[]): StatsIndex {
  const subjects = new Map<string, { all: Acc; systems: Map<string, Acc> }>();
  const each = (item: Item, fn: (a: Acc) => void) => {
    let s = subjects.get(item.subject);
    if (!s) subjects.set(item.subject, (s = { all: acc(), systems: new Map() }));
    let sys = s.systems.get(item.system);
    if (!sys) s.systems.set(item.system, (sys = acc()));
    fn(s.all);
    fn(sys);
  };

  for (const q of bank.standalone)
    each(q, (a) => {
      a.standalone++;
      a.studyable++;
      a.perfTotal++;
    });
  for (const c of bank.cases)
    for (const q of c.items)
      each(q, (a) => {
        a.studyable++;
        a.perfTotal++;
      });
  for (const q of bank.byId.values()) if (q.source.kind === "readiness" && q.status === "published") each(q, (a) => a.perfTotal++);

  for (const s of sessions)
    for (const e of s.entries) {
      const item = bank.byId.get(e.itemId);
      const answer = s.answers[e.itemId];
      if (!item || !s.submitted[e.itemId] || !answer) continue;
      const sc = scoreItem(item, answer);
      each(item, (a) => {
        a.earned += sc.earned;
        a.max += sc.max;
        a.time += s.timeSpent[e.itemId] ?? 0;
        a.attempts++;
      });
    }

  const out = new Map<string, SubjectStats>();
  for (const [id, s] of subjects) out.set(id, { ...finish(s.all), systems: new Map([...s.systems].map(([k, v]) => [k, finish(v)])) });
  return {
    subject: (id) => out.get(id) ?? EMPTY,
    system: (subject, key) => out.get(subject)?.systems.get(key) ?? EMPTY,
  };
}

let cache: { bank: Bank; sessions: TestSession[]; out: StatsIndex } | null = null;
function statsFor(bank: Bank, sessions: TestSession[]): StatsIndex {
  if (cache?.bank !== bank || cache.sessions !== sessions) cache = { bank, sessions, out: compute(bank, sessions) };
  return cache.out;
}

/** Non-hook read (lib code, builders). */
export const getStats = () => statsFor(getBank(), useStore.getState().sessions);

/** Hook read; re-renders when the bank or recorded attempts change. */
export function useStats(): StatsIndex {
  const bank = useBank();
  const sessions = useStore((s) => s.sessions);
  return statsFor(bank, sessions);
}

/** "62 %" or "—" when nobody has answered yet. */
export const formatAvg = (avg: number | null) => (avg == null ? "—" : `${avg} %`);

import { CASE_ROWS } from "@/data/cases";
import type { Schedule } from "./store";

/* ------------------------------------------------------------------ */
/* Date helpers                                                        */
/* ------------------------------------------------------------------ */

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function parseDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 864e5);

/** "September 29th, 2026" (score report chip). */
export function formatFull(d: Date) {
  return formatLong(d).replace(/^\w{3}/, d.toLocaleString("en-US", { month: "long" }));
}

export function formatLong(d: Date) {
  const day = d.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  return `${d.toLocaleString("en-US", { month: "short" })} ${day}${suffix}, ${d.getFullYear()}`;
}

/** 75 -> "1h 15m", 60 -> "1h", 8 -> "8m". */
export function formatMinutes(min: number) {
  const m = Math.round(min);
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h && r ? `${h}h ${r}m` : h ? `${h}h` : `${r}m`;
}

/* ------------------------------------------------------------------ */
/* Assignments                                                         */
/* ------------------------------------------------------------------ */

export type SpeedKey = "noRush" | "relaxed" | "default" | "faster" | "fastest";

export const SPEEDS: { key: SpeedKey; label: string; factor: number; blurb: string }[] = [
  { key: "noRush", label: "No Rush", factor: 1.5, blurb: "Gives you 50% more time to complete assignments." },
  { key: "relaxed", label: "Relaxed", factor: 1.25, blurb: "Gives you 25% more time to complete assignments." },
  { key: "default", label: "Default", factor: 1, blurb: "Gives you the default time to complete assignments." },
  { key: "faster", label: "Faster", factor: 0.75, blurb: "Gives you 25% less time to complete assignments." },
  { key: "fastest", label: "Fastest", factor: 0.5, blurb: "Gives you 50% less time to complete assignments." },
];

export const speedFactor = (k: SpeedKey | undefined) => SPEEDS.find((s) => s.key === (k ?? "default"))!.factor;

export type Tone = "lav" | "green" | "red" | "gray" | "blue" | "amber" | "pink";

export interface Assignment {
  id: string;
  title: string;
  /** Minutes at the default study speed. */
  minutes: number;
  href: string | null;
  tone: Tone;
  /** ISO date this assignment is scheduled on. */
  date: string;
  custom?: boolean;
}

/** Hand-made assignment kept in the store. */
export interface CustomAssignment {
  id: string;
  title: string;
  minutes: number;
  tone: Tone;
  date: string;
}

/** User edits on top of the generated plan. */
export interface ScheduleEdits {
  done: Record<string, boolean>;
  /** Per-assignment overrides (moved date, color, minutes). */
  overrides: Record<string, { date?: string; tone?: Tone; minutes?: number }>;
  deleted: Record<string, boolean>;
  custom: CustomAssignment[];
}

export const EMPTY_EDITS: ScheduleEdits = { done: {}, overrides: {}, deleted: {}, custom: [] };

type Draft = Omit<Assignment, "date">;

const STANDALONE_BLOCKS: { title: string; minutes: number }[] = [
  { title: "35 Adult Health Standalone Questions", minutes: 75 },
  { title: "20 Child Health, 10 Pharmacology Standalone Questions", minutes: 60 },
  { title: "30 Mental Health Standalone Questions", minutes: 60 },
  { title: "20 Fundamentals Standalone Questions", minutes: 90 },
  { title: "35 Adult Health Standalone Questions", minutes: 75 },
  { title: "30 Maternal & Newborn Health Standalone Questions", minutes: 60 },
  { title: "30 Management of Care Standalone Questions", minutes: 60 },
  { title: "30 Pharmacology Standalone Questions", minutes: 60 },
];

/** Dates the student studies on (not a weekly day off, not a picked day off). */
export function studyDates(s: Schedule): Date[] {
  const start = parseDate(s.start);
  const end = s.exam ? parseDate(s.exam) : addDays(start, 56);
  const out: Date[] = [];
  for (let d = start; d < end; d = addDays(d, 1)) {
    if (s.daysOff.includes(d.getDay()) || s.offDates?.includes(toISODate(d))) continue;
    out.push(d);
  }
  return out;
}

/** Interleave several queues in proportion to their lengths. */
function interleave<T>(queues: T[][]): T[] {
  return queues
    .flatMap((q) => q.map((item, i) => ({ item, at: (i + 0.5) / q.length })))
    .sort((a, b) => a.at - b.at)
    .map((x) => x.item);
}

/** Spread an ordered list over days so each day gets close to the same number of minutes. */
function distribute(items: Draft[], days: Date[]): Assignment[] {
  if (!days.length) return [];
  const total = items.reduce((a, x) => a + x.minutes, 0);
  const target = total / days.length;
  const out: Assignment[] = [];
  let day = 0;
  let load = 0;
  items.forEach((it, i) => {
    // Move on when today already meets the target and enough days remain for the rest.
    const daysLeft = days.length - day - 1;
    const itemsLeft = items.length - i;
    if (load > 0 && day < days.length - 1 && (load >= target * 0.9 || load + it.minutes / 2 > target * 1.15 || itemsLeft <= daysLeft)) {
      day++;
      load = 0;
    }
    out.push({ ...it, date: toISODate(days[day]) });
    load += it.minutes;
  });
  return out;
}

/** The proven plan: onboarding day, cases and standalone blocks interleaved, weekly reviews, and four CAT readiness exams. */
export function generatePlan(s: Schedule): Assignment[] {
  const days = studyDates(s);
  if (!days.length) return [];

  const intro: Draft[] = [
    { id: "intro-test", title: "Create Your First Test", minutes: 15, href: "/nclex", tone: "lav" },
    { id: "intro-qotd", title: "Get the NCLEX Question of the Day", minutes: 15, href: "/nclex/question-of-the-day", tone: "lav" },
    { id: "intro-guide", title: "Read “Dr. Emily’s NCLEX Study Guide”", minutes: 15, href: "/nclex/study-guide", tone: "lav" },
  ];
  const ngn: Draft = { id: "ngn", title: "(Optional) Next Gen NCLEX Overview", minutes: 30, href: "/nclex/next-gen-strategy-course/videos", tone: "green" };

  const cases = interleave(
    ["adult-health", "child-health", "mental-health", "maternal-and-newborn-health"].map((sub) =>
      CASE_ROWS.filter((r) => r.subject === sub).map<Draft>((r) => ({ id: `case-${r.number}`, title: r.title, minutes: 30, href: `/nclex/next-gen-cases/qbanks/${r.id}`, tone: "lav" })),
    ),
  );
  const blockCount = Math.max(6, Math.round(days.length * 0.45));
  const blocks = Array.from({ length: blockCount }, (_, i): Draft => ({ id: `std-${i + 1}`, ...STANDALONE_BLOCKS[i % STANDALONE_BLOCKS.length], href: "/nclex/next-gen-standalone", tone: "lav" }));

  // Weekly review pair after every ~6 content assignments.
  const content = interleave([cases, blocks]);
  const stream: Draft[] = [ngn];
  let week = 0;
  content.forEach((c, i) => {
    stream.push(c);
    if ((i + 1) % 6 === 0) {
      week++;
      stream.push(
        { id: `tag-${week}`, title: "30 Learning and Reviewing Tagged Questions", minutes: 60, href: "/nclex/previous-tests", tone: "lav" },
        { id: `crash-${week}`, title: "Review Crash Course Videos and Cheat Sheets", minutes: 60, href: "/nclex/crash-courses", tone: "green" },
      );
    }
  });

  // Day 1 is onboarding; readiness exams (and the day after, to review them) get their own days.
  const fixed = new Map<number, Draft[]>();
  fixed.set(0, intro);
  if (days.length >= 14) {
    [0.12, 0.38, 0.62, 0.85].forEach((p, n) => {
      const at = Math.min(days.length - 2, Math.max(2, Math.floor(days.length * p)));
      fixed.set(at, [{ id: `cat-${n + 1}`, title: `CAT Readiness Exam ${n + 1}`, minutes: 180, href: `/nclex/next-gen-readiness-exams/qbanks/readiness-exam-${n + 1}`, tone: "red" }]);
      fixed.set(at + 1, [{ id: `catrev-${n + 1}`, title: `Review CAT Readiness Exam ${n + 1}`, minutes: 60, href: "/nclex/previous-tests", tone: "red" }]);
    });
  }

  const free = days.filter((_, i) => !fixed.has(i));
  const flexible = distribute(stream, free);
  const fixedOut = [...fixed.entries()].flatMap(([i, list]) => list.map<Assignment>((d) => ({ ...d, date: toISODate(days[i]) })));
  return [...fixedOut, ...flexible].sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? -1 : 1));
}

/** Generated plan + the student's edits, in display order. */
export function resolveAssignments(s: Schedule, edits: ScheduleEdits): Assignment[] {
  const base = generatePlan(s)
    .filter((a) => !edits.deleted[a.id])
    .map((a) => {
      const o = edits.overrides[a.id];
      return o ? { ...a, date: o.date ?? a.date, tone: o.tone ?? a.tone, minutes: o.minutes ?? a.minutes } : a;
    });
  const custom = edits.custom.filter((c) => !edits.deleted[c.id]).map<Assignment>((c) => ({ ...c, href: null, custom: true }));
  return [...base, ...custom];
}

/** Minutes shown for an assignment: custom ones ignore study speed. */
export const displayMinutes = (a: Assignment, s: Schedule) => (a.custom ? a.minutes : Math.round(a.minutes * speedFactor(s.speed)));

/**
 * Rebalance: spread every assignment that is not done over the remaining study days
 * (from `from` to the exam date), keeping order. Returns date overrides per assignment id.
 */
export function rebalanceDates(s: Schedule, edits: ScheduleEdits, from: string): Record<string, string> {
  const days = studyDates({ ...s, start: from });
  const open = generatePlan(s).filter((a) => !edits.deleted[a.id] && !edits.done[a.id]);
  const moved = distribute(
    open.map((a) => ({ id: a.id, title: a.title, minutes: a.minutes, href: a.href, tone: a.tone })),
    days,
  );
  return Object.fromEntries(moved.map((a) => [a.id, a.date]));
}

/** Average study hours per day for a schedule, as shown in the create / rebalance modal. */
export function dailyHours(s: Schedule, edits: ScheduleEdits = EMPTY_EDITS, from?: string): number {
  const days = studyDates(from ? { ...s, start: from } : s).length;
  if (!days) return 0;
  const open = generatePlan(s).filter((a) => !edits.deleted[a.id] && !edits.done[a.id]);
  const minutes = open.reduce((a, x) => a + x.minutes, 0) * speedFactor(s.speed);
  return minutes / 60 / days;
}

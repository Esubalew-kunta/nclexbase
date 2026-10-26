import { getAll, getConfig } from "@/lib/content";
import type { SiteConfig } from "@/lib/admin/config";
import type { QuestionRec } from "@/lib/admin/types";
import { itemById } from "./bank";
import type { McqItem } from "./types";

/*
 * Question of the Day. Each date shows the question the admin set for it, by hand or with
 * "Auto-select" for a month (Admin > Question of the Day). Nothing is assigned automatically:
 * a date without a question shows an empty state.
 */

let poolCache: { questions: QuestionRec[]; pool: McqItem[] } | null = null;

/** Questions eligible for the Question of the Day / Daily Warmup email: published single-answer multiple choice. */
export function qotdPool(): McqItem[] {
  const questions = getAll("questions");
  if (poolCache?.questions !== questions) poolCache = { questions, pool: questions.filter((q) => q.type === "mcq" && q.status === "published") as unknown as McqItem[] };
  return poolCache.pool;
}

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const isISO = (s: string | null | undefined): s is string => Boolean(s && /^\d{4}-\d{2}-\d{2}$/.test(s));

type Period = "week" | "month";

/* ------------------------------------------------------------------ */
/* Calendar maths on YYYY-MM-DD strings (UTC, so DST never shifts a day) */
/* ------------------------------------------------------------------ */

const DAY = 864e5;
const toMs = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const fromMs = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (iso: string, n: number) => fromMs(toMs(iso) + n * DAY);
export const daysBetween = (a: string, b: string) => Math.round((toMs(b) - toMs(a)) / DAY);

/** First day of the week (Monday) or month that contains `iso`. */
export function periodStart(iso: string, period: Period): string {
  if (period === "month") return `${iso.slice(0, 7)}-01`;
  const dow = new Date(toMs(iso)).getUTCDay(); // 0 = Sunday
  return addDays(iso, -((dow + 6) % 7));
}

/** Last day of the period that starts on `start`. */
export function periodEnd(start: string, period: Period): string {
  if (period === "week") return addDays(start, 6);
  const [y, m] = start.split("-").map(Number);
  return fromMs(Date.UTC(y, m, 0));
}

export const nextPeriod = (start: string, period: Period) => addDays(periodEnd(start, period), 1);

export function periodDays(start: string, period: Period): string[] {
  const n = daysBetween(start, periodEnd(start, period)) + 1;
  return Array.from({ length: n }, (_, i) => addDays(start, i));
}

export function periodLabel(start: string, period: Period): string {
  const f = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(toMs(iso)).toLocaleDateString("en-US", { timeZone: "UTC", ...o });
  if (period === "month") return f(start, { month: "long", year: "numeric" });
  return `Week of ${f(start, { month: "short", day: "numeric" })} – ${f(periodEnd(start, period), { month: "short", day: "numeric", year: "numeric" })}`;
}

/* ------------------------------------------------------------------ */
/* Assignments                                                         */
/* ------------------------------------------------------------------ */

/** A scheduled question that can still be shown (it may have been deleted or changed type). */
function scheduledItem(id: string | undefined): McqItem | undefined {
  if (!id) return undefined;
  try {
    const item = itemById(id);
    return item.type === "mcq" ? item : undefined;
  } catch {
    return undefined;
  }
}

export type QotdSource = "manual" | "auto" | "none";

/** What a date shows, and how it was set. */
export function pickForDate(date: string, cfg: SiteConfig["qotd"] = getConfig().qotd): { item: McqItem | undefined; source: QotdSource } {
  const item = scheduledItem(cfg.schedule[date]);
  if (!item) return { item: undefined, source: "none" };
  return { item, source: cfg.autoDays?.[date] ? "auto" : "manual" };
}

/** The question for a date (today when the date is missing or malformed); `item` is undefined when none is set. */
export function questionForDate(iso: string | null | undefined): { date: string; item: McqItem | undefined } {
  const date = isISO(iso) ? iso : todayISO();
  return { date, item: pickForDate(date).item };
}

export const subjectMatches = (q: McqItem, picks: { id: string; systems: string[] | null }[]) => picks.some((p) => p.id === q.subject && (!p.systems || p.systems.includes(q.system)));

/**
 * Auto-select: give every chosen day of a month a question from the chosen subjects, taking
 * them in turn so each subject gets a fair share. Avoids questions already used within 90 days
 * (and repeats inside the month) while there are enough to choose from.
 */
export function autoFill(opts: { days: string[]; picks: { id: string; systems: string[] | null }[]; pool: McqItem[]; schedule: Record<string, string> }): { assign: Record<string, string>; reused: number } {
  const { days, picks, pool, schedule } = opts;
  const recent = (date: string) => new Set(Object.entries(schedule).filter(([d]) => !days.includes(d) && Math.abs(daysBetween(d, date)) <= 90).map(([, id]) => id));
  const shuffle = <T,>(a: T[]) => {
    const out = [...a];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  // One shuffled queue per subject; days take from the subjects in turn.
  const queues = picks.map((p) => shuffle(pool.filter((q) => subjectMatches(q, [p])))).filter((q) => q.length);
  const used = new Set<string>();
  const assign: Record<string, string> = {};
  let reused = 0;
  let turn = Math.floor(Math.random() * Math.max(1, queues.length));
  for (const date of shuffle(days)) {
    if (!queues.length) break;
    const avoid = recent(date);
    let pick: McqItem | undefined;
    for (let k = 0; k < queues.length && !pick; k++) {
      const queue = queues[(turn + k) % queues.length];
      pick = queue.find((q) => !used.has(q.id) && !avoid.has(q.id));
    }
    if (!pick) {
      // Not enough fresh questions: allow ones used before, still preferring this month's unused.
      const all = queues.flat();
      pick = all.find((q) => !used.has(q.id)) ?? all[Math.floor(Math.random() * all.length)];
      reused++;
    }
    used.add(pick.id);
    assign[date] = pick.id;
    turn = (turn + 1) % queues.length;
  }
  return { assign, reused };
}

/* ------------------------------------------------------------------ */
/* Reminder: fill the next period before the current one ends            */
/* ------------------------------------------------------------------ */

export interface PlanReminder {
  period: Period;
  /** First day of the period that still has empty days. */
  start: string;
  daysLeft: number;
  /** Days in that period without a question. */
  empty: number;
}

/** Due when the current week/month ends within `remind.days` days and the next one has days without a question. */
export function planReminder(cfg: SiteConfig["qotd"] = getConfig().qotd, today = todayISO()): PlanReminder | null {
  const r = cfg.remind ?? { period: "week", days: 5 };
  if (r.period === "off") return null;
  const end = periodEnd(periodStart(today, r.period), r.period);
  const daysLeft = daysBetween(today, end);
  if (daysLeft > r.days) return null;
  const start = addDays(end, 1);
  const empty = periodDays(start, r.period).filter((d) => !scheduledItem(cfg.schedule[d])).length;
  return empty ? { period: r.period, start, daysLeft, empty } : null;
}

/** "10/04/26", as in the email header. */
export function emailDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y.slice(2)}`;
}

export const LETTERS = ["A", "B", "C", "D", "E", "F"];

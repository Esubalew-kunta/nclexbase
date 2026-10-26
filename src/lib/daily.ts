import { getAll, getConfig } from "@/lib/content";
import type { QotdPlan, QotdQuota, SiteConfig } from "@/lib/admin/config";
import type { QuestionRec } from "@/lib/admin/types";
import { itemById } from "./bank";
import type { McqItem } from "./types";

/*
 * Question of the Day. For any date: an admin-pinned question wins; otherwise the
 * week or month plan (Admin > Question of the Day) picks one; otherwise the rotation.
 * Every step is deterministic, so the emailed link and the page always agree.
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

/* ------------------------------------------------------------------ */
/* Calendar maths on YYYY-MM-DD strings (UTC, so DST never shifts a day) */
/* ------------------------------------------------------------------ */

const DAY = 864e5;
const toMs = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const fromMs = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (iso: string, n: number) => fromMs(toMs(iso) + n * DAY);
export const daysBetween = (a: string, b: string) => Math.round((toMs(b) - toMs(a)) / DAY);

/** First day of the week (Monday) or month that contains `iso`. */
export function periodStart(iso: string, period: QotdPlan["period"]): string {
  if (period === "month") return `${iso.slice(0, 7)}-01`;
  const dow = new Date(toMs(iso)).getUTCDay(); // 0 = Sunday
  return addDays(iso, -((dow + 6) % 7));
}

/** Last day of the period that starts on `start`. */
export function periodEnd(start: string, period: QotdPlan["period"]): string {
  if (period === "week") return addDays(start, 6);
  const [y, m] = start.split("-").map(Number);
  return fromMs(Date.UTC(y, m, 0));
}

export const nextPeriod = (start: string, period: QotdPlan["period"]) => addDays(periodEnd(start, period), 1);

export function periodDays(start: string, period: QotdPlan["period"]): string[] {
  const n = daysBetween(start, periodEnd(start, period)) + 1;
  return Array.from({ length: n }, (_, i) => addDays(start, i));
}

export function periodLabel(start: string, period: QotdPlan["period"]): string {
  const f = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(toMs(iso)).toLocaleDateString("en-US", { timeZone: "UTC", ...o });
  if (period === "month") return f(start, { month: "long", year: "numeric" });
  return `Week of ${f(start, { month: "short", day: "numeric" })} – ${f(periodEnd(start, period), { month: "short", day: "numeric", year: "numeric" })}`;
}

/* ------------------------------------------------------------------ */
/* Plans                                                               */
/* ------------------------------------------------------------------ */

/** The plan covering a date. A week plan wins over a month plan. */
export function planFor(date: string, plans: QotdPlan[]): QotdPlan | undefined {
  return plans.find((p) => p.period === "week" && p.start === periodStart(date, "week")) ?? plans.find((p) => p.period === "month" && p.start === periodStart(date, "month"));
}

export const quotaMatches = (q: McqItem, quota: Pick<QotdQuota, "subject" | "system">) => (!quota.subject || q.subject === quota.subject) && (!quota.system || q.system === quota.system);

export interface PlanResult {
  /** Date → question and the quota that chose it (null = filled from every subject). */
  days: Map<string, { item: McqItem; quota: QotdQuota | null }>;
  /** Quotas that couldn't get all their questions. */
  short: { quota: QotdQuota; wanted: number; got: number }[];
  /** Questions the quotas ask for beyond the free (unpinned) days. */
  over: number;
  freeDays: number;
}

/** Small seeded random generator, so a plan always gives the same days. */
function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
function shuffle<T>(list: T[], rand: () => number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const planCache = new WeakMap<QotdPlan, { pool: McqItem[]; schedule: Record<string, string>; out: PlanResult }>();

/** Assign a question to every unpinned day of the plan: quotas first, then any subject. No repeats inside the period. */
export function resolvePlan(plan: QotdPlan, pool: McqItem[], schedule: Record<string, string>): PlanResult {
  const hit = planCache.get(plan);
  if (hit && hit.pool === pool && hit.schedule === schedule) return hit.out;
  const rand = rng(`${plan.id}:${plan.start}`);
  const all = periodDays(plan.start, plan.period);
  const pinned = new Set(all.map((d) => schedule[d]).filter(Boolean));
  const free = all.filter((d) => !pinnedItem(schedule[d]));
  const used = new Set(pinned);
  const picks: { item: McqItem; quota: QotdQuota | null }[] = [];
  const short: PlanResult["short"] = [];
  let wanted = 0;
  for (const quota of plan.quotas) {
    wanted += quota.count;
    const room = Math.max(0, free.length - picks.length);
    const take = shuffle(pool.filter((q) => !used.has(q.id) && quotaMatches(q, quota)), rand).slice(0, Math.min(quota.count, room));
    take.forEach((item) => (used.add(item.id), picks.push({ item, quota })));
    if (take.length < Math.min(quota.count, room)) short.push({ quota, wanted: quota.count, got: take.length });
  }
  // Remaining days: any subject, still without repeats while the pool lasts.
  const rest = shuffle(pool.filter((q) => !used.has(q.id)), rand);
  while (picks.length < free.length && rest.length) picks.push({ item: rest.shift()!, quota: null });
  while (picks.length < free.length && pool.length) picks.push({ item: pool[Math.floor(rand() * pool.length)], quota: null });
  // Spread quota questions across the period instead of bunching them at the start.
  const order = shuffle(picks, rand);
  const days = new Map(free.map((d, i) => [d, order[i]] as const).filter(([, v]) => Boolean(v)));
  const out: PlanResult = { days, short, over: Math.max(0, wanted - free.length), freeDays: free.length };
  planCache.set(plan, { pool, schedule, out });
  return out;
}

/** Rotation pick for a date (used when no pin and no plan covers that day). */
export function rotationFor(date: string): McqItem {
  const pool = qotdPool();
  const days = Math.floor(toMs(date) / DAY);
  return pool[((days % pool.length) + pool.length) % pool.length];
}

/** A pinned question that can still be shown (it may have been deleted or changed type). */
function pinnedItem(id: string | undefined): McqItem | undefined {
  if (!id) return undefined;
  try {
    const item = itemById(id);
    return item.type === "mcq" ? item : undefined;
  } catch {
    return undefined;
  }
}

export type QotdSource = { kind: "pinned" } | { kind: "plan"; plan: QotdPlan; quota: QotdQuota | null } | { kind: "rotation" };

/** What a date shows, and why. */
export function pickForDate(date: string, cfg: SiteConfig["qotd"] = getConfig().qotd): { item: McqItem | undefined; source: QotdSource } {
  const pool = qotdPool();
  const pinned = pinnedItem(cfg.schedule[date]);
  if (pinned) return { item: pinned, source: { kind: "pinned" } };
  if (!pool.length) return { item: undefined, source: { kind: "rotation" } };
  const plan = planFor(date, cfg.plans ?? []);
  const fromPlan = plan && resolvePlan(plan, pool, cfg.schedule).days.get(date);
  if (plan && fromPlan) return { item: fromPlan.item, source: { kind: "plan", plan, quota: fromPlan.quota } };
  return { item: rotationFor(date), source: { kind: "rotation" } };
}

/** The same date always gives the same question, so the emailed link and the page agree. */
export function questionForDate(iso: string | null | undefined): { date: string; item: McqItem; scheduled: boolean } {
  const date = isISO(iso) ? iso : todayISO();
  const { item, source } = pickForDate(date);
  return { date, item: item!, scheduled: source.kind === "pinned" };
}

/* ------------------------------------------------------------------ */
/* Reminder: plan the next period before the current one ends          */
/* ------------------------------------------------------------------ */

export interface PlanReminder {
  period: QotdPlan["period"];
  /** First day of the period that still needs a plan. */
  start: string;
  daysLeft: number;
}

/** Due when the current week/month ends within `remind.days` days and the next one has no plan. */
export function planReminder(cfg: SiteConfig["qotd"] = getConfig().qotd, today = todayISO()): PlanReminder | null {
  const r = cfg.remind ?? { period: "week", days: 5 };
  if (r.period === "off") return null;
  const end = periodEnd(periodStart(today, r.period), r.period);
  const daysLeft = daysBetween(today, end);
  if (daysLeft > r.days) return null;
  const start = addDays(end, 1);
  // A month plan covers next week too (and vice versa for months only when a month plan exists).
  const covered = r.period === "week" ? periodDays(start, "week").every((d) => planFor(d, cfg.plans ?? [])) : (cfg.plans ?? []).some((p) => p.period === "month" && p.start === start);
  return covered ? null : { period: r.period, start, daysLeft };
}

/** "10/04/26", as in the email header. */
export function emailDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y.slice(2)}`;
}

export const LETTERS = ["A", "B", "C", "D", "E", "F"];

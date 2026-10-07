import { READINESS_ITEMS } from "@/data/readiness";
import { ALL_ITEMS } from "./bank";
import type { McqItem } from "./types";

/** Questions eligible for the Question of the Day / Daily Warmup email: single-answer multiple choice. */
const POOL = [...READINESS_ITEMS, ...ALL_ITEMS].filter((i): i is McqItem => i.type === "mcq");

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const isISO = (s: string | null | undefined): s is string => Boolean(s && /^\d{4}-\d{2}-\d{2}$/.test(s));

/** The same date always gives the same question, so the emailed link and the page agree. */
export function questionForDate(iso: string | null | undefined): { date: string; item: McqItem } {
  const date = isISO(iso) ? iso : todayISO();
  const days = Math.floor(Date.parse(`${date}T00:00:00Z`) / 864e5);
  return { date, item: POOL[((days % POOL.length) + POOL.length) % POOL.length] };
}

/** "10/04/26", as in the email header. */
export function emailDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y.slice(2)}`;
}

export const LETTERS = ["A", "B", "C", "D", "E", "F"];

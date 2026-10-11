import { getAll, getConfig } from "@/lib/content";
import { itemById } from "./bank";
import type { McqItem } from "./types";

/** Questions eligible for the Question of the Day / Daily Warmup email: published single-answer multiple choice. */
export function qotdPool(): McqItem[] {
  return getAll("questions").filter((q) => q.type === "mcq" && q.status === "published") as unknown as McqItem[];
}

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const isISO = (s: string | null | undefined): s is string => Boolean(s && /^\d{4}-\d{2}-\d{2}$/.test(s));

/** Rotation pick for a date (used when the admin hasn't scheduled a question for that day). */
export function rotationFor(date: string): McqItem {
  const pool = qotdPool();
  const days = Math.floor(Date.parse(`${date}T00:00:00Z`) / 864e5);
  return pool[((days % pool.length) + pool.length) % pool.length];
}

/**
 * The same date always gives the same question, so the emailed link and the page agree.
 * An admin-scheduled question (Admin > Question of the Day) wins over the rotation.
 */
export function questionForDate(iso: string | null | undefined): { date: string; item: McqItem; scheduled: boolean } {
  const date = isISO(iso) ? iso : todayISO();
  const pinned = getConfig().qotd.schedule[date];
  if (pinned) {
    try {
      const item = itemById(pinned);
      if (item.type === "mcq") return { date, item, scheduled: true };
    } catch {
      // Scheduled question was deleted; fall back to the rotation.
    }
  }
  return { date, item: rotationFor(date), scheduled: false };
}

/** "10/04/26", as in the email header. */
export function emailDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y.slice(2)}`;
}

export const LETTERS = ["A", "B", "C", "D", "E", "F"];

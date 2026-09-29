import { SUBJECTS } from "@/data/catalog";
import type { Schedule } from "./store";

export interface PlanTask {
  kind: "video" | "questions" | "readiness" | "review";
  label: string;
  href: string;
}

export interface PlanDay {
  date: Date;
  off: boolean;
  tasks: PlanTask[];
}

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function parseDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatLong(d: Date) {
  const day = d.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  return `${d.toLocaleString("en-US", { month: "short" })} ${day}${suffix}, ${d.getFullYear()}`;
}

/**
 * Mirrors the "proven plan" shape: subject blocks of videos + questions,
 * readiness exams spread over the final stretch, and a review day before the exam.
 */
export function buildPlan(s: Schedule): PlanDay[] {
  const start = parseDate(s.start);
  const end = s.exam ? parseDate(s.exam) : new Date(start.getTime() + 56 * 864e5);
  const days: PlanDay[] = [];
  for (let d = new Date(start); d < end; d = new Date(d.getTime() + 864e5)) {
    days.push({ date: d, off: s.daysOff.includes(d.getDay()), tasks: [] });
  }
  const study = days.filter((d) => !d.off);
  if (!study.length) return days;

  const readinessSlots = [0.55, 0.7, 0.82, 0.92].map((p) => Math.min(study.length - 1, Math.floor(study.length * p)));
  study.forEach((day, i) => {
    const subject = SUBJECTS[Math.floor((i / study.length) * SUBJECTS.length * 1.6) % SUBJECTS.length];
    const r = readinessSlots.indexOf(i);
    if (i === study.length - 1) {
      day.tasks.push({ kind: "review", label: "Light review and rest before exam day", href: "/nclex/cheat-sheets" });
    } else if (r >= 0) {
      day.tasks.push({ kind: "readiness", label: `Readiness Exam ${r + 1}`, href: `/nclex/next-gen-readiness-exams/qbanks/readiness-exam-${r + 1}` });
    } else {
      day.tasks.push(
        { kind: "video", label: `${subject.name}: 3 crash course lessons`, href: `/nclex/${subject.id}/crash-courses` },
        { kind: "questions", label: `${subject.name}: 40 questions`, href: `/nclex/${subject.id}` },
      );
    }
  });
  return days;
}

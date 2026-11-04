import type { SubjectId } from "@/lib/types";
import systemsJson from "./live/systems.json";
import videosJson from "./live/videos.json";
import sheetsJson from "./live/sheets.json";
import faqsJson from "./live/faqs.json";

/*
 * Catalog data captured from app.bootcamp.com/nclex (free account, 2026-09-30).
 * Raw captures live in research/; JSON copies are in ./live.
 */

export interface Subject {
  id: SubjectId;
  name: string;
  lessonCount: number;
  videoRuntime: string;
  /**
   * Standalone systems in live order. `count` is bootcamp's question count for the system and
   * is only ever a sort key (HomeV1 lists each subject's largest systems first). It is never
   * shown: every count the app prints is counted from the questions we actually have.
   */
  systems: { name: string; count: number }[];
}

const S = systemsJson as Record<string, { standaloneSystems: { name: string; total: number }[] }>;
const V = videosJson as Record<string, { lessons: number; runtime: string; items: Lesson[] }>;

const base: { id: SubjectId; name: string }[] = [
  { id: "adult-health", name: "Adult Health" },
  { id: "child-health", name: "Child Health" },
  { id: "fundamentals", name: "Fundamentals" },
  { id: "maternal-and-newborn-health", name: "Maternal & Newborn Health" },
  { id: "mental-health", name: "Mental Health" },
  { id: "pharmacology", name: "Pharmacology" },
  { id: "management-of-care", name: "Management of Care" },
];

export const SUBJECTS: Subject[] = base.map((b) => ({
  ...b,
  lessonCount: V[b.id].lessons,
  videoRuntime: V[b.id].runtime,
  systems: S[b.id].standaloneSystems.map((s) => ({ name: s.name, count: s.total })),
}));

export const subjectById = (id: SubjectId) => SUBJECTS.find((s) => s.id === id)!;

/* ------------------------------------------------------------------ */
/* Crash course lessons                                                */
/* ------------------------------------------------------------------ */

export interface Lesson {
  type: "video" | "bites";
  title: string;
  duration?: string;
  count?: number;
  locked: boolean;
}

export const LESSONS: Record<SubjectId, Lesson[]> = Object.fromEntries(base.map((b) => [b.id, V[b.id].items])) as Record<SubjectId, Lesson[]>;

/* ------------------------------------------------------------------ */
/* Readiness exams + Next Gen course                                   */
/* ------------------------------------------------------------------ */

/*
 * One exam. Exams 2 to 4 used to be listed here, but they were the same 85 questions of exam 1
 * in another order, with nothing of their own behind them. A new exam is added here only when
 * its questions have been captured.
 */
export const READINESS_EXAMS = [1].map((n) => ({
  id: `readiness-exam-${n}`,
  number: n,
  title: `CAT Readiness Exam ${n}`,
  /** Adaptive: at least 85 questions, at most 150, 5 hours. */
  questions: 150,
  minQuestions: 85,
  minutes: 300,
  free: n === 1,
}));

export const NGN_COURSE = [
  { title: "Next Gen NCLEX: The Basics", runtime: "34m", lessons: ["What Changed on the Next Gen NCLEX", "The Clinical Judgment Measurement Model", "How Next Gen Items Are Scored"] },
  { title: "How to Approach a Case", runtime: "35m", lessons: ["Reading the Case Tabs", "Recognize and Analyze Cues", "Prioritize Hypotheses", "Take Action and Evaluate Outcomes"] },
  { title: "Full Case and Question Walkthrough", runtime: "45m", lessons: ["Full Case Walkthrough, Part 1", "Full Case Walkthrough, Part 2"] },
];

/* ------------------------------------------------------------------ */
/* Cheat sheets                                                        */
/* ------------------------------------------------------------------ */

export interface CheatSheet {
  title: string;
  subject: SubjectId;
  free: boolean;
  /** Tags used by the all-subjects system filter. */
  systems: string[];
  /** Tags used by the per-subject filter chips. */
  subjectSystems: string[];
}

export const CHEAT_SHEETS = sheetsJson as CheatSheet[];

export const CHEAT_SHEET_SUBJECT_ORDER: SubjectId[] = [
  "adult-health",
  "child-health",
  "fundamentals",
  "management-of-care",
  "maternal-and-newborn-health",
  "mental-health",
  "pharmacology",
];

/* ------------------------------------------------------------------ */
/* FAQs (answers are HTML from the live site)                          */
/* ------------------------------------------------------------------ */

type Faq = readonly [string, string];
const F = faqsJson as unknown as Record<string, Faq[]>;
export const HOME_FAQS = F.faqs;
export const PERFORMANCE_FAQS = F.performance;
export const READINESS_FAQS = F.readiness;
export const SCHEDULE_FAQS = F.schedule;
export const REVIEW_FAQS = F.review;

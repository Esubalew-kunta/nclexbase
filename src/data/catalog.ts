import type { SubjectId } from "@/lib/types";
import systemsJson from "./live/systems.json";
import videosJson from "./live/videos.json";
import sheetsJson from "./live/sheets.json";
import faqsJson from "./live/faqs.json";

/*
 * Catalog data captured from app.bootcamp.com/nclex (free account, 2026-09-30).
 * Raw captures live in research/; JSON copies are in ./live.
 */

export interface Expert {
  id: string;
  name: string;
  short: string;
  credentials: string;
  photo: string;
}

export const EXPERTS: Record<string, Expert> = {
  emily: { id: "emily", name: "Dr. Emily Wilson", short: "Dr. Emily", credentials: "DNP", photo: "/assets/experts/emily.jpeg" },
  amber: { id: "amber", name: "Dr. Amber Adams", short: "Dr. Amber", credentials: "DNP", photo: "/assets/experts/amber.png" },
  cortney: { id: "cortney", name: "Dr. Cortney Olejniczak", short: "Dr. Cortney", credentials: "DNP", photo: "/assets/experts/cortney.png" },
  crysta: { id: "crysta", name: "Crysta Bliss", short: "Nurse Crysta", credentials: "MSN", photo: "/assets/experts/crysta.png" },
  miriam: { id: "miriam", name: "Miriam Wahrman", short: "Nurse Miriam", credentials: "MSN", photo: "/assets/experts/miriam.png" },
};

export interface SystemStat {
  name: string;
  /** Average score across all users (Performance page). */
  avg: number;
  /** Questions in this system, including case and readiness items. */
  total: number;
}

export interface Subject {
  id: SubjectId;
  name: string;
  /** Short label used in the sidebar (truncated there with an ellipsis). */
  experts: string[];
  /** "0 of N questions used" on Home. */
  questionCount: number;
  lessonCount: number;
  videoRuntime: string;
  /** Standalone questions (Standalone tab + Create Test). */
  standaloneCount: number;
  caseCount: number;
  /** Questions counted on the Performance page. */
  perfTotal: number;
  avgScore: number;
  avgTimeSec: number;
  /** Standalone systems in live order with question counts. */
  systems: { name: string; count: number }[];
  /** Performance systems (alphabetical on the live page) with averages. */
  perfSystems: SystemStat[];
}

const S = systemsJson as Record<string, { avg: number; perfTotal: number; perfSystems: SystemStat[]; standaloneTotal: number; standaloneSystems: { name: string; total: number }[] }>;
const V = videosJson as Record<string, { lessons: number; runtime: string; items: Lesson[] }>;

const base: { id: SubjectId; name: string; experts: string[]; questionCount: number; caseCount: number; avgTimeSec: number }[] = [
  { id: "adult-health", name: "Adult Health", experts: ["emily", "amber"], questionCount: 569, caseCount: 27, avgTimeSec: 70 },
  { id: "child-health", name: "Child Health", experts: ["crysta", "miriam"], questionCount: 199, caseCount: 9, avgTimeSec: 68 },
  { id: "fundamentals", name: "Fundamentals", experts: ["emily", "crysta"], questionCount: 155, caseCount: 0, avgTimeSec: 75 },
  { id: "maternal-and-newborn-health", name: "Maternal & Newborn Health", experts: ["miriam", "crysta"], questionCount: 213, caseCount: 12, avgTimeSec: 82 },
  { id: "mental-health", name: "Mental Health", experts: ["cortney", "emily"], questionCount: 116, caseCount: 2, avgTimeSec: 76 },
  { id: "pharmacology", name: "Pharmacology", experts: ["cortney", "emily"], questionCount: 183, caseCount: 0, avgTimeSec: 62 },
  { id: "management-of-care", name: "Management of Care", experts: ["amber", "emily"], questionCount: 145, caseCount: 0, avgTimeSec: 73 },
];

export const SUBJECTS: Subject[] = base.map((b) => ({
  ...b,
  lessonCount: V[b.id].lessons,
  videoRuntime: V[b.id].runtime,
  standaloneCount: S[b.id].standaloneTotal,
  perfTotal: S[b.id].perfTotal,
  avgScore: S[b.id].avg,
  systems: S[b.id].standaloneSystems.map((s) => ({ name: s.name, count: s.total })),
  perfSystems: S[b.id].perfSystems,
}));

export const subjectById = (id: SubjectId) => SUBJECTS.find((s) => s.id === id)!;

export const TOTALS = {
  cases: 300,
  standalone: 1280,
  readiness: 600,
  lessons: 0,
  freeQuestions: 36,
  performanceQuestions: 1580,
};

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

export const READINESS_EXAMS = [1, 2, 3, 4].map((n) => ({
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

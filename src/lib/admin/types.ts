import type { SubjectTab } from "@/lib/subjectTabs";
import type { CaseTab, Item, SubjectId } from "@/lib/types";

/*
 * Admin content model. Every collection here is a draft of a future database table:
 * the static build keeps the seed in src/data and the admin's edits in localStorage
 * (lib/admin/store.ts); the backend will store the merged records instead.
 */

export type Status = "draft" | "published" | "archived";
export type Access = "free" | "premium";

/** A PDF or image. `url` is a public path for seed files or `idb:<key>` for uploads kept in IndexedDB. */
export interface FileRef {
  url: string;
  name: string;
  pages: number;
  sizeKb: number;
}

export interface SystemRec {
  /** Stable key that content records point to. Never changes, even when the label is renamed. */
  key: string;
  label: string;
  visible: boolean;
}

export interface SubjectRec {
  id: SubjectId;
  name: string;
  order: number;
  visible: boolean;
  /** Subject page tabs, in display order. Missing tabs are hidden. */
  tabs: SubjectTab[];
  systems: SystemRec[];
  /** Uploaded icon image; seeded subjects fall back to their built-in icon. */
  icon: FileRef | null;
  updatedAt: string;
}

export interface MemoryTrickRec {
  id: string;
  title: string;
  subject: SubjectId;
  system: string | null;
  description: string;
  access: Access;
  status: Status;
  order: number;
  file: FileRef | null;
  updatedAt: string;
}

export interface CheatSheetRec {
  id: string;
  title: string;
  subject: SubjectId;
  /** Chips on the all-subjects Cheat Sheets page. */
  systems: string[];
  /** Chips on the subject's Cheat Sheets tab. */
  subjectSystems: string[];
  access: Access;
  status: Status;
  order: number;
  file: FileRef | null;
  updatedAt: string;
}

export type QuestionSource = { kind: "standalone" } | { kind: "case"; caseId: string } | { kind: "readiness" };

export type QuestionRec = Item & {
  source: QuestionSource;
  access: Access;
  status: Status;
  order: number;
  updatedAt: string;
};

export interface CaseContent {
  intro: string;
  exhibit?: boolean;
  tabs: CaseTab[];
  /** Question ids (records in the questions collection), in exam order. */
  itemIds: string[];
}

export interface CaseRec {
  id: string;
  /** Number shown on the all-cases list. */
  number: number;
  title: string;
  subject: SubjectId;
  access: Access;
  status: Status;
  order: number;
  /** `null` = no authored content yet; students then get the subject's sample case. */
  content: CaseContent | null;
  updatedAt: string;
}

export interface ReadinessRec {
  id: string;
  number: number;
  title: string;
  minQuestions: number;
  maxQuestions: number;
  minutes: number;
  /** Present the shared pool in a fixed order (exam 1) or a shuffled one (other exams). */
  shuffle: boolean;
  /** Pool questions this exam uses (a case's items always come together). Empty or missing = the whole pool. */
  questionIds?: string[];
  access: Access;
  status: Status;
  order: number;
  updatedAt: string;
}

export interface CourseRec {
  id: string;
  /** Subject crash course or a Next Gen Strategy Course module. */
  kind: "subject" | "ngn";
  title: string;
  runtime: string;
  status: Status;
  order: number;
  updatedAt: string;
}

export interface LessonRec {
  id: string;
  course: string;
  type: "video" | "bites";
  title: string;
  /** "12:34" for videos. */
  duration?: string;
  /** Question count for Bites. */
  count?: number;
  videoUrl?: string;
  access: Access;
  status: Status;
  order: number;
  updatedAt: string;
}

export type FaqPlacement = "home" | "performance" | "readiness" | "schedule" | "review";

export interface FaqRec {
  id: string;
  question: string;
  /** Trusted HTML written by admins. */
  answer: string;
  placements: FaqPlacement[];
  status: Status;
  order: number;
  updatedAt: string;
}

export interface PlanRec {
  id: string;
  months: number;
  price: number;
  was: number;
  blurb: string;
  guarantee: boolean;
  featured: boolean;
  status: Status;
  order: number;
  updatedAt: string;
}

export interface UserRec {
  id: string;
  name: string;
  email: string;
  plan: Access;
  status: "active" | "disabled";
  institution: string;
  createdAt: string;
  lastActive: string;
  answered: number;
  scorePct: number;
  /** The student signed in on this browser (their plan and progress are the real local ones). */
  local?: boolean;
  updatedAt: string;
}

export interface CodeRec {
  id: string;
  code: string;
  institution: string;
  seats: number;
  used: number;
  expiresAt: string;
  status: "active" | "disabled";
  updatedAt: string;
}

export interface MessageRec {
  id: string;
  name: string;
  email: string;
  body: string;
  createdAt: string;
  status: "open" | "pending" | "closed";
  replies: { by: string; body: string; at: string }[];
  updatedAt: string;
}

export interface AnnouncementRec {
  id: string;
  message: string;
  linkLabel: string;
  linkHref: string;
  audience: "all" | "free" | "premium";
  tone: "info" | "premium";
  /** ISO dates (inclusive). Empty = no limit. */
  start: string;
  end: string;
  status: Status;
  order: number;
  updatedAt: string;
}

export interface Collections {
  subjects: SubjectRec;
  memoryTricks: MemoryTrickRec;
  cheatSheets: CheatSheetRec;
  questions: QuestionRec;
  cases: CaseRec;
  readiness: ReadinessRec;
  courses: CourseRec;
  lessons: LessonRec;
  faqs: FaqRec;
  plans: PlanRec;
  users: UserRec;
  codes: CodeRec;
  messages: MessageRec;
  announcements: AnnouncementRec;
}

export type CollectionName = keyof Collections;

export const COLLECTION_LABELS: Record<CollectionName, string> = {
  subjects: "Subject",
  memoryTricks: "Memory trick",
  cheatSheets: "Cheat sheet",
  questions: "Question",
  cases: "Case study",
  readiness: "Readiness exam",
  courses: "Course",
  lessons: "Lesson",
  faqs: "FAQ",
  plans: "Plan",
  users: "User",
  codes: "Institution code",
  messages: "Message",
  announcements: "Announcement",
};

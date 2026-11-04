/** Subject slug. Seeded ones are the 7 NCLEX subjects; the admin can add more (Admin > Subjects & Systems). */
export type SubjectId = string;

/* ------------------------------------------------------------------ */
/* Question items (Next Gen NCLEX item types)                          */
/* ------------------------------------------------------------------ */

export type ScoringRule = "0/1" | "+/-" | "rationale";

export interface Rationale {
  /** Explanation is the complete live write-up (incorrect options and takeaways included). */
  raw?: boolean;
  /** HTML (trusted local mock data). */
  explanation: string;
  incorrect?: { label: string; text: string }[];
  takeaway: string[];
}

/**
 * Video explanation set in the admin: an uploaded file, or a link.
 *
 * A file: `url` is a public path (`/assets/media/<name>`), or `idb:<key>` for a browser-only upload
 * in the no-API prototype. A link: `kind` is "link", `url` is the address the admin pasted, and the
 * player is worked out from it (lib/videoLink.ts), never taken on trust from `embedUrl`.
 */
export interface ExplanationVideo {
  url: string;
  name: string;
  sizeKb: number;
  /** The admin can hide a video without deleting it. */
  visible: boolean;
  kind?: "link";
  /** Links only: which player. */
  provider?: "youtube" | "vimeo" | "file";
  /** Links only: where the player points, as last worked out. */
  embedUrl?: string;
}

interface ItemBase {
  id: string;
  /** Context line above the stem, e.g. "The nurse reviews the client's Laboratory Results from 1200." */
  lead?: string;
  /** Case studies reveal tabs progressively: how many scenario tabs this item shows. */
  tabs?: number;
  /**
   * The scenario tabs exactly as they stand at this item, replacing the case's own tabs.
   *
   * Live case studies change tab *content* as they advance (a new nurses' note, another
   * vital-signs column), not only how many tabs are visible. Without this an early item shows
   * the whole case, including the notes that give later answers away.
   */
  caseTabs?: CaseTab[];
  subject: SubjectId;
  system: string;
  topic: string;
  /** HTML stem shown next to the blue arrow. */
  stem: string;
  rationale: Rationale;
  /** Average percent correct across all users (mock). */
  avgPercent: number;
  linkedVideo?: string;
  linkedSheet?: string;
  /** Shown above the written explanation only when uploaded and visible. */
  video?: ExplanationVideo;
}

export interface McqItem extends ItemBase {
  type: "mcq";
  options: string[];
  answer: number;
}

export interface SataItem extends ItemBase {
  type: "sata";
  options: string[];
  answers: number[];
}

export interface SelectNItem extends ItemBase {
  type: "selectN";
  n: number;
  options: string[];
  answers: number[];
}

export interface MatrixItem extends ItemBase {
  type: "matrix";
  rowHeader: string;
  columns: string[];
  rows: string[];
  /** Column index per row. */
  answers: number[];
}

export interface DragClozeItem extends ItemBase {
  type: "dragCloze";
  /** Sentence with `{0}`, `{1}` placeholders. */
  template: string;
  choices: string[];
  /** Choice index per blank. */
  answers: number[];
}

export interface DropdownClozeItem extends ItemBase {
  type: "dropdown";
  template: string;
  blanks: { options: string[]; answer: number }[];
}

export interface HighlightItem extends ItemBase {
  type: "highlight";
  headers: [string, string];
  rows: { label: string; segments: string[] }[];
  /** Keys `row-segment`. */
  answers: string[];
}

export interface BowtieItem extends ItemBase {
  type: "bowtie";
  conditions: string[];
  actions: string[];
  parameters: string[];
  answer: { condition: number; actions: [number, number]; parameters: [number, number] };
}

/** "Drag the top N findings ... to the box on the right." */
export interface DragTopNItem extends ItemBase {
  type: "dragTopN";
  n: number;
  sourceLabel: string;
  targetLabel: string;
  options: string[];
  answers: number[];
}

/** Matrix multiple response: checkboxes, several per row allowed. */
export interface MatrixMultiItem extends ItemBase {
  type: "matrixMulti";
  rowHeader: string;
  columns: string[];
  rows: string[];
  /** Correct column indexes for each row. */
  answers: number[][];
}

/** Fill in the blank: a single numeric answer (dosage calculations). */
export interface FitbItem extends ItemBase {
  type: "fitb";
  /** Correct answer, compared as a number. */
  answer: string;
}

/** Click-to-highlight inside a passage (HTML with `<span class="hl" data-h="n">` segments). */
export interface HighlightTextItem extends ItemBase {
  type: "highlightText";
  /** Passage HTML (including the instruction line). */
  html: string;
  /** Keys (data-h values) of the segments that should be highlighted. */
  answers: string[];
}

export type Item =
  | FitbItem
  | HighlightTextItem
  | McqItem
  | DragTopNItem
  | MatrixMultiItem
  | SataItem
  | SelectNItem
  | MatrixItem
  | DragClozeItem
  | DropdownClozeItem
  | HighlightItem
  | BowtieItem;

export type ItemType = Item["type"];

/* Answers are stored per item in a shape matching the item type. */
export type Answer =
  | { type: "mcq"; choice: number | null }
  | { type: "sata" | "selectN"; choices: number[] }
  | { type: "matrix"; cells: (number | null)[] }
  | { type: "matrixMulti"; cells: number[][] }
  | { type: "dragTopN"; chosen: number[] }
  | { type: "dragCloze" | "dropdown"; blanks: (number | null)[] }
  | { type: "highlight" | "highlightText"; keys: string[] }
  | { type: "fitb"; value: string }
  | { type: "bowtie"; condition: number | null; actions: number[]; parameters: number[] };

/* ------------------------------------------------------------------ */
/* Case studies                                                        */
/* ------------------------------------------------------------------ */

export type TabContent =
  | { kind: "text"; html: string }
  | { kind: "notes"; heading?: string; entries: { time: string; html: string }[] }
  | { kind: "table"; headers?: string[]; rows: string[][] };

export interface CaseTab {
  label: string;
  content: TabContent;
}

export interface CaseStudy {
  id: string;
  title: string;
  subject: SubjectId;
  intro: string;
  /** A single question with an exhibit tab (no "Item x of y" header). */
  exhibit?: boolean;
  tabs: CaseTab[];
  items: Item[];
}

/* ------------------------------------------------------------------ */
/* Test sessions                                                       */
/* ------------------------------------------------------------------ */

export type Pool = "unused" | "learning" | "reviewing" | "mastered" | "bookmarked";
export type MasteryTag = "learning" | "reviewing" | "mastered";

/**
 * One submitted answer, kept for good.
 *
 * A test session is the student's current run at something and can be reset or deleted. An
 * attempt is the permanent record that the answer was given, so Performance can keep every
 * answer (a retake adds to the totals, it does not replace the first try) and a question that
 * was used stays used after its case study or exam is reset.
 *
 * The answer itself is stored, not the points: points are worked out when they are read, with the
 * question as it is in the bank at that moment, as they always were.
 */
export interface Attempt {
  itemId: string;
  /** The run it was answered in. That session may be gone; the attempt is not. */
  sessionId: string;
  /** The case study or readiness exam that launched the run; absent for a custom test. */
  sourceId?: string;
  kind: TestSession["kind"];
  /** When it was submitted (ISO). */
  at: string;
  /** Absent when a test was ended with this question unanswered: it counts as used, scores nothing. */
  answer?: Answer;
  /** Seconds spent on it in that run. */
  time: number;
}

export interface SessionEntry {
  itemId: string;
  caseId?: string;
}

export interface TestSession {
  id: string;
  number: number;
  kind: "custom" | "case" | "readiness";
  title: string;
  createdAt: string;
  tutor: boolean;
  timed: boolean;
  pool: Pool;
  entries: SessionEntry[];
  answers: Record<string, Answer>;
  submitted: Record<string, boolean>;
  marked: Record<string, boolean>;
  timeSpent: Record<string, number>;
  current: number;
  status: "active" | "ended";
  /** Seconds allowed when timed. */
  timeLimit?: number;
  /** Catalog row that launched this session (case study or readiness exam id). */
  sourceId?: string;
}

export interface Score {
  earned: number;
  max: number;
}
